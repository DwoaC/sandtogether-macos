// ============================================================================
// SandTogether — co-op multiplayer mod for Sandustry
// Author / Autor: KAMIL PADULA
// macOS install payload. Run by install-macos.command via the GAME'S OWN
// Electron binary with ELECTRON_RUN_AS_NODE=1 — zero external dependencies.
// Usage: ELECTRON_RUN_AS_NODE=1 <Sandustry binary> install-macos.js <ResourcesDir> <ModDir>
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');

const res = process.argv[2]; // .../Sandustry.app/Contents/Resources
const mod = process.argv[3]; // Workshop item folder (contains src/)
if (!res || !mod) { console.error('usage: install-macos.js <ResourcesDir> <ModDir>'); process.exit(1); }
const srcDir = path.join(mod, 'src');
const log = (...a) => console.log('[SandTogether]', ...a);
const fail = (m) => { console.error('[SandTogether] ERROR:', m); process.exit(1); };

// --- asar extractor (same logic as install.ps1's Extract-Asar) ---------------
function extractAsar(asarPath, outDir, unpackedDir) {
  log('Unpacking game code (1-2 minutes)...');
  const fd = fs.openSync(asarPath, 'r');
  const hdr = Buffer.alloc(16);
  fs.readSync(fd, hdr, 0, 16, 0);
  const headerSize = hdr.readUInt32LE(4);
  const jsonLen = hdr.readUInt32LE(12);
  const jsonBuf = Buffer.alloc(jsonLen);
  fs.readSync(fd, jsonBuf, 0, jsonLen, 16);
  const index = JSON.parse(jsonBuf.toString('utf8'));
  const base = 8 + headerSize;
  let count = 0;
  (function walk(node, rel) {
    for (const name of Object.keys(node.files)) {
      const child = node.files[name];
      const childRel = rel ? rel + '/' + name : name;
      if (child.files) {
        fs.mkdirSync(path.join(outDir, childRel), { recursive: true });
        walk(child, childRel);
      } else {
        const dest = path.join(outDir, childRel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        if (child.unpacked) {
          const src = path.join(unpackedDir, childRel);
          if (fs.existsSync(src)) fs.copyFileSync(src, dest);
        } else {
          const size = Number(child.size);
          const buf = Buffer.alloc(size);
          fs.readSync(fd, buf, 0, size, base + Number(child.offset));
          fs.writeFileSync(dest, buf);
        }
        if (++count % 500 === 0) log('  ...', count, 'files');
      }
    }
  })(index, '');
  fs.closeSync(fd);
  log('Unpacked', count, 'files.');
}

// --- 1. extract / refresh the app folder ------------------------------------
const asar = path.join(res, 'app.asar');
const appDir = path.join(res, 'app');
if (fs.existsSync(asar)) {
  if (fs.existsSync(appDir)) { log('Steam replaced app.asar — re-extracting fresh to match current build...'); fs.rmSync(appDir, { recursive: true, force: true }); }
  extractAsar(asar, appDir, asar + '.unpacked');
  const bak = asar + '.bak';
  if (fs.existsSync(bak)) fs.rmSync(bak, { force: true });
  fs.renameSync(asar, bak);
} else if (!fs.existsSync(path.join(appDir, 'main.js'))) {
  const bak = asar + '.bak';
  if (fs.existsSync(bak)) extractAsar(bak, appDir, asar + '.unpacked');
  else fail('app.asar not found in ' + res + ' (Steam: verify integrity of game files first)');
}

// --- 2. version info ---------------------------------------------------------
const patches = JSON.parse(fs.readFileSync(path.join(srcDir, 'patches.json'), 'utf8'));
try {
  const gv = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8')).version;
  log('Game build:', gv, '(mod supports:', (patches.supportedVersions || []).join(', ') + ')');
} catch (e) {}

// --- 3. copy mod files -------------------------------------------------------
fs.copyFileSync(path.join(srcDir, 'sandtogether.js'), path.join(appDir, 'dist', 'js', 'sandtogether.js'));
fs.copyFileSync(path.join(srcDir, 'st-main.js'), path.join(appDir, 'st-main.js'));
log('[+] mod files copied');

// --- 4. index.html -----------------------------------------------------------
{
  const p = path.join(appDir, 'dist', 'index.html');
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('js/sandtogether.js')) log('[=] index.html (already patched)');
  else {
    s = s.replace('<script type="module" src="js/bundle.js"></script>', '<script src="js/sandtogether.js"></script>\n    <script type="module" src="js/bundle.js"></script>');
    if (!s.includes('js/sandtogether.js')) fail('index.html anchor not found');
    fs.writeFileSync(p, s);
    log('[+] index.html');
  }
}

// --- 5. preload.js -----------------------------------------------------------
{
  const p = path.join(appDir, 'preload.js');
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('sandtogetherNet')) log('[=] preload.js (already patched)');
  else { s += '\n' + fs.readFileSync(path.join(srcDir, 'st-preload-append.js'), 'utf8'); fs.writeFileSync(p, s); log('[+] preload.js'); }
}

// --- 6. main.js --------------------------------------------------------------
{
  const p = path.join(appDir, 'main.js');
  let s = fs.readFileSync(p, 'utf8');
  const A = '// --- SandTogether init ---', B = '// --- /SandTogether init ---';
  const block = '\n\n' + A + '\n' +
    "try {\n  const _stUd = process.argv.find((a) => a.startsWith('--st-userdata='));\n  if (_stUd) { app.setPath('userData', _stUd.split('=')[1]); console.log('[SandTogether] userData override:', _stUd.split('=')[1]); }\n} catch (e) { console.error('[SandTogether] userdata error:', e); }\n" +
    "try {\n  app.whenReady().then(() => {\n    try { require('./st-main.js').init({ getMainWindow: () => mainWindow }); }\n    catch (e) { console.error('[SandTogether] init error:', e); }\n  });\n} catch (e) { console.error('[SandTogether] bootstrap error:', e); }\n" + B + '\n';
  const ia = s.indexOf(A);
  if (ia >= 0) { const ib = s.indexOf(B); s = s.slice(0, ia).replace(/\s+$/, '') + s.slice(ib + B.length); }
  s += block;
  if (patches.mainJs && s.includes(patches.mainJs.singleInstanceAnchor)) s = s.replace(patches.mainJs.singleInstanceAnchor, patches.mainJs.singleInstancePatched);
  fs.writeFileSync(p, s);
  log('[+] main.js');
}

// --- 7. bundle.js anchor patches (multi-version variants) --------------------
{
  const p = path.join(appDir, 'dist', 'js', 'bundle.js');
  let s = fs.readFileSync(p, 'utf8');
  let dirty = false, criticalFail = false, featureMiss = 0;
  for (const pt of patches.bundle || []) {
    let applied = false, already = false;
    for (const v of pt.variants || []) {
      if (s.indexOf(v.patched) >= 0) { already = true; break; }
      const i1 = s.indexOf(v.anchor);
      if (i1 < 0) continue;
      if (s.indexOf(v.anchor, i1 + 1) >= 0) continue; // anchor not unique in this variant
      s = s.slice(0, i1) + v.patched + s.slice(i1 + v.anchor.length);
      dirty = true; applied = true;
      break;
    }
    if (applied) log('[+] bundle:', pt.name);
    else if (already) log('[=] bundle:', pt.name, '(already patched)');
    else if (pt.critical) { log('[X] bundle:', pt.name, '- NO MATCHING VARIANT (critical)'); criticalFail = true; }
    else { log('[!] bundle:', pt.name, '- not found, feature disabled on this build'); featureMiss++; }
  }
  if (dirty) fs.writeFileSync(p, s);
  if (criticalFail) fail('This game version is NOT supported by the mod yet (core hook did not match). Watch the Workshop page for an update.');
  if (featureMiss) log('Note:', featureMiss, 'optional feature(s) unavailable on this game build, but co-op will work.');
}

log('=== DONE! SandTogether installed. Launch Sandustry from Steam. ===');
