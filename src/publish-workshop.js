// ============================================================================
// SandTogether — co-op multiplayer mod for Sandustry
// Author / Autor: KAMIL PADULA
// Steam Workshop publisher. Creates/updates the Workshop item as PRIVATE so the
// author can review the page before making it public.
// Usage: node publish-workshop.js [existingItemId]
// ============================================================================
'use strict';
const path = require('path');

const APP_ID = 2764460; // Sandustry
const GAME_SW = 'F:/SteamLibrary/steamapps/common/Sandustry/resources/app/node_modules/steamworks.js';
const CONTENT = path.resolve(__dirname, '../workshop/content');
const PREVIEW = path.resolve(__dirname, '../workshop/preview.png');

const TITLE = 'SandTogether — Co-op Multiplayer';
const DESCRIPTION = `[h1]SandTogether — Co-op Multiplayer for Sandustry[/h1]
[b]Author: Kamil Padula[/b] — [b]Contributors: dotNine, Knight-HD[/b]

Play Sandustry together over the internet — no server, no port forwarding. Connect through Steam friend invites. Up to 4 players.

[h2]⚠ AFTER SUBSCRIBING — READ THIS (one-time setup)[/h2]
Sandustry cannot auto-load this kind of mod yet, so after subscribing you run a quick one-time installer:
[olist]
[*] Subscribe (you already did) and let Steam finish downloading.
[*] Open the mod folder. In Steam: right-click Sandustry → Manage → Browse local files, go up one level, then open: steamapps\\workshop\\content\\2764460\\3784750764\\  (or just search your PC for "SandTogether")
[*] Right-click [b]install.bat[/b] → Run (or install.ps1 → Run with PowerShell). It finds your game and installs the mod automatically. No Node.js or internet needed.
[*] Launch Sandustry from Steam. A [b]SandTogether[/b] panel appears in the top-right corner.
[/olist]
Both players need to do this. Full step-by-step in README.md (English) / INSTRUKCJA.md (Polski) inside the folder.

[b]Po polsku:[/b] Po zasubskrybowaniu wejdź do folderu moda (Steam → prawy na Sandustry → Zarządzaj → Przeglądaj pliki lokalne → folder wyżej → steamapps\\workshop\\content\\2764460\\3784750764\\), kliknij prawym [b]install.bat[/b] → Uruchom. Instalator sam znajdzie grę i wgra moda. Odpal grę — panel SandTogether jest w prawym górnym rogu. Musi to zrobić każdy z graczy. Pełna instrukcja: INSTRUKCJA.md.

[h2]Features (v0.9.36 — full co-op)[/h2]
[list]
[*] Steam invites (or LAN with auto-reconnect) — zero network setup
[*] Shared live world: sand, fluids, digging, unlocked zones — one authoritative simulation streamed in real time (fog-of-war areas are skipped, so joining is fast even on huge maps)
[*] Every player tool works for everyone: shovel, spray, firearms & rockets, vacuum, grabber, flamethrower, cryoblaster, demolisher
[*] One shared factory: build, demolish, move, copy-paste blueprints, pipes, signal wiring & buttons — on both sides
[*] Shared team progression: research/upgrades pool, tech tree, story steps, objectives, critter collection, factory processes
[*] Item pickup with full effects (artifacts, orbs, keys), shared resources; creatures, drones and projectiles synchronized; world-event sounds forwarded
[*] See your teammate: real player models with equipped tools, build ghosts and grabber crosshairs, off-screen arrows
[*] Steam achievements keep working; the panel warns in red on any mod-version mismatch
[*] Bilingual UI (English / Polski)
[/list]

[h2]How to play (Steam)[/h2]
[olist]
[*] [b]Host:[/b] open the panel → [b]Host (Steam)[/b] → [b]Invite[/b] and pick your friend.
[*] [b]Joining player:[/b] accept the Steam invite (works whether your game is open or closed).
[*] Host: load/start a game, save it, then click [b]Send world[/b].
[*] Joining player: after "World imported!", open [b]Load Game[/b] and load the received world. You now share one live world.
[/olist]
Both players must run the same mod version (the panel warns in red if they differ).

[h2]Controls (the SandTogether panel)[/h2]
[list]
[*] [b]Hide / show panel:[/b] click the panel header, or press [b]Ctrl+Shift+H[/b]. (It no longer uses F9 — that's the game's quick-load key.)
[*] [b]Host (Steam) / Invite:[/b] start a Steam co-op session and invite a friend.
[*] [b]Host LAN / Join LAN:[/b] local network play (ip:port, default 27777).
[*] [b]Send world:[/b] send your latest save to everyone connected (do this once at the start).
[*] [b]Resync:[/b] force a full re-sync if the mirrored world ever looks out of date.
[*] [b]Stop:[/b] leave / end the session.
[/list]

[h2]Installation[/h2]
This mod patches the game files (the game has no built-in mod loader for Early Access yet). Subscribe, then run [b]install.ps1[/b] from this item's folder (right-click → Run with PowerShell). Full instructions in README.md (EN) / INSTRUKCJA.md (PL). Both players need the mod (same version — the mod checks and warns on mismatch).

[h2]💛 Thank you — this mod is community-built[/h2]
Huge thanks to the code contributors: [b]dotNine[/b] (player models, world auto-transfer, collision sync) and [b]Knight-HD[/b] (building placement, grabber rework, teammate ghosts — a whole pull request!).

And to the testers whose precise bug reports shaped almost every release: [b]TCentraL[/b], [b]Warlow[/b], [b]NanYu_sad.[/b], [b]ЗаКеЛьМан[/b], [b]星灵[/b], [b]Lofar666[/b], [b]Bobulator333[/b], [b]thatsmaik[/b], [b]uolkx[/b], [b]MIXUIL[/b], [b]Justin[/b], [b]Hooye!![/b], [b]tony.s.jennette[/b], [b]Sprut[/b] — and everyone else who reported, tested and played. A short description + your log file (%APPDATA%\\Sandustry\\logs\\main.log) is the fastest route to a fix.

[h2]Open source / Contributing[/h2]
The full source code is on GitHub: [url=https://github.com/IronBamBam1990/sandtogether]github.com/IronBamBam1990/sandtogether[/url] — MIT license. Bug fixes, features and ports (e.g. a macOS installer — the mod code itself is cross-platform) are welcome as pull requests. The README covers the architecture and dev workflow.

[i]Polska wersja instrukcji w pliku INSTRUKCJA.md. Active development — feedback welcome![/i]`;

(async () => {
  const sw = require(GAME_SW);
  const client = sw.init(APP_ID);
  console.log('Steam user:', client.localplayer.getName());
  const ws = client.workshop;
  console.log('Visibility enum:', JSON.stringify(ws.UgcItemVisibility));

  let itemId = process.argv[2] ? BigInt(process.argv[2]) : null;
  if (!itemId) {
    const created = await ws.createItem();
    console.log('createItem ->', JSON.stringify(created, (k, v) => (typeof v === 'bigint' ? String(v) : v)));
    itemId = BigInt(created.itemId);
    if (created.needsToAcceptAgreement) {
      console.log('!!! You must accept the Steam Workshop legal agreement:');
      console.log('!!! https://steamcommunity.com/sharedfiles/workshoplegalagreement');
    }
  }

  // visibility: publish | unlisted | private (default: public)
  const visArg = (process.argv[3] || 'public').toLowerCase();
  const vis = visArg === 'private' ? ws.UgcItemVisibility.Private : visArg === 'unlisted' ? ws.UgcItemVisibility.Unlisted : ws.UgcItemVisibility.Public;
  const details = {
    title: TITLE,
    description: DESCRIPTION,
    changeNote: 'v0.9.38-beta — network & robustness batch: (1) ROW-DELTA world streaming (protocol v5): only changed 40-cell rows are sent instead of whole chunks — typically 2-10x less bandwidth, which directly reduces lag on slower connections. (2) CRITTERS collected by the joining player now disappear from the host\'s map too (no double-collect). (3) STEAM AUTO-REJOIN: if the P2P link drops, the joiner automatically re-enters the lobby (up to 5 tries), same as the LAN reconnect. (4) The panel now warns when the two players run DIFFERENT GAME BUILDS (Steam sometimes serves different builds under the same version number — this caused several mystery bugs). Includes 0.9.37 (chat, per-player memory, machine settings, instant drops). Both players MUST update together (new protocol) + re-run install.bat.',
    previewPath: PREVIEW,
    contentPath: CONTENT,
    visibility: vis,
    tags: ['Mods'],
  };
  let result;
  try {
    result = await ws.updateItem(itemId, details);
  } catch (e) {
    console.log('updateItem with tags failed (' + (e.message || e) + '), retrying without tags...');
    delete details.tags;
    result = await ws.updateItem(itemId, details);
  }
  console.log('updateItem ->', JSON.stringify(result, (k, v) => (typeof v === 'bigint' ? String(v) : v)));
  console.log('');
  console.log('DONE. Workshop item (private):');
  console.log('https://steamcommunity.com/sharedfiles/filedetails/?id=' + itemId);
  process.exit(0);
})().catch((e) => { console.error('PUBLISH FAILED:', e.message || e); process.exit(1); });
