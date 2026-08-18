// ============================================================================
// SandTogether — co-op multiplayer mod for Sandustry (macOS installer)
// Runs under plain Node OR under the game's own Electron binary via
// ELECTRON_RUN_AS_NODE=1 (see install.command) — no dependencies either way.
//
// Mirrors dist-package/install.ps1: locate game -> close it -> extract
// app.asar fresh -> sideline app.asar -> run src/patch.js on the unpacked app.
// Idempotent; re-run after every game or mod update.
// Usage: install.js [path-to-Sandustry.app]
// ============================================================================
'use strict';
// Under ELECTRON_RUN_AS_NODE, Electron wraps fs so any path containing
// ".asar" is read as an archive member, not a file. Disable that — this
// script must treat app.asar as a plain file (read, rename, delete).
process.noAsar = true;
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

function fail(msg) {
  console.error('\nERROR: ' + msg);
  console.error('Send a screenshot of this window to the mod author for help.');
  process.exit(1);
}

// --- 1. Locate the game bundle ----------------------------------------------
function findGame() {
  const arg = process.argv[2];
  if (arg) {
    if (fs.existsSync(path.join(arg, 'Contents/MacOS/Sandustry'))) return arg;
    fail('No Sandustry.app at ' + arg);
  }
  const steamRoot = path.join(os.homedir(), 'Library/Application Support/Steam');
  const candidates = [path.join(steamRoot, 'steamapps/common/Sandustry/Sandustry.app')];
  const vdf = path.join(steamRoot, 'steamapps/libraryfolders.vdf');
  if (fs.existsSync(vdf)) {
    for (const m of fs.readFileSync(vdf, 'utf8').matchAll(/"path"\s+"(.+?)"/g)) {
      candidates.push(path.join(m[1], 'steamapps/common/Sandustry/Sandustry.app'));
    }
  }
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'Contents/MacOS/Sandustry'))) return c;
  }
  fail('Sandustry.app not found. Checked:\n  ' + candidates.join('\n  ') +
       '\nPass the path explicitly: install.command /path/to/Sandustry.app');
}

const gameApp = findGame();
const res = path.join(gameApp, 'Contents/Resources');
console.log('Game: ' + gameApp);

// --- 2. Close the game -------------------------------------------------------
spawnSync('pkill', ['-x', 'Sandustry']);

// --- 3. Extract app.asar (no-dependency asar reader) --------------------------
// asar layout: u32@4 = header pickle size; u32@12 = JSON length; JSON at 16;
// file offsets are relative to 8 + headerSize. Same math as install.ps1.
function extractAsar(asarPath, outDir, unpackedDir) {
  console.log('Unpacking game code (1-2 minutes)...');
  const buf = fs.readFileSync(asarPath);
  const headerSize = buf.readUInt32LE(4);
  const jsonLen = buf.readUInt32LE(12);
  const index = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));
  const base = 8 + headerSize;
  let extracted = 0;

  (function walk(node, rel) {
    for (const [name, child] of Object.entries(node.files)) {
      const childRel = rel ? path.join(rel, name) : name;
      if (child.files) {
        fs.mkdirSync(path.join(outDir, childRel), { recursive: true });
        walk(child, childRel);
        continue;
      }
      const dest = path.join(outDir, childRel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (child.unpacked) {
        const src = path.join(unpackedDir, childRel);
        if (fs.existsSync(src)) fs.copyFileSync(src, dest);
      } else if (child.link) {
        // rare in this game; keep parity with install.ps1 which skips links
      } else {
        const off = base + Number(child.offset);
        fs.writeFileSync(dest, buf.subarray(off, off + child.size));
        if (child.executable) fs.chmodSync(dest, 0o755);
      }
      if (++extracted % 200 === 0) console.log('  ... ' + extracted + ' files');
    }
  })(index, '');
  console.log('Unpacked ' + extracted + ' files.');
}

// app.asar PRESENT = fresh install OR Steam restored/updated it. Re-extract
// fresh so app/ matches the CURRENT build, then sideline the asar so Electron
// loads our patched folder instead of it.
const asar = path.join(res, 'app.asar');
const appDir = path.join(res, 'app');
if (fs.existsSync(asar)) {
  if (fs.existsSync(appDir)) {
    console.log('Steam replaced app.asar - re-extracting fresh to match current build...');
    fs.rmSync(appDir, { recursive: true, force: true });
  }
  extractAsar(asar, appDir, path.join(res, 'app.asar.unpacked'));
  fs.rmSync(asar + '.bak', { force: true });
  fs.renameSync(asar, asar + '.bak');
} else if (!fs.existsSync(path.join(appDir, 'main.js'))) {
  if (fs.existsSync(asar + '.bak')) {
    extractAsar(asar + '.bak', appDir, path.join(res, 'app.asar.unpacked'));
  } else {
    fail('app.asar not found in ' + res + ' (Steam: verify integrity of game files first)');
  }
}

// --- 4. Version check ---------------------------------------------------------
// In the dev tree, ../src is the live source of truth; dist-package/src is
// the release-time copy and can lag it. A packaged build ships its own src/.
const SRC = fs.existsSync(path.join(__dirname, 'src'))
  ? path.join(__dirname, 'src')
  : path.join(__dirname, '..', 'src');
try {
  const gv = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8')).version;
  const sup = JSON.parse(fs.readFileSync(path.join(SRC, 'patches.json'), 'utf8')).supportedVersions;
  console.log('Game build: ' + gv + ' (mod supports: ' + sup.join(', ') + ')');
} catch (e) {}

// --- 5. Patch (reuses the upstream cross-platform patcher) --------------------
const r = spawnSync(process.execPath, [path.join(SRC, 'patch.js'), appDir], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
});
if (r.status !== 0) fail('patch.js failed (see messages above)');

console.log('\n=== DONE! SandTogether installed. ===');
console.log('Launch via SandTogether-Launch.command (or Steam; if Steam restores');
console.log('app.asar the game runs unmodded - the launcher guards against that).');
console.log('Uninstall: Steam -> Sandustry -> Properties -> Installed Files ->');
console.log('Verify integrity, then delete Contents/Resources/app.');
