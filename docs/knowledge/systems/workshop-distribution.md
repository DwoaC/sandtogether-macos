---
type: System
title: Steam Workshop distribution
description: How the mod reaches players — Workshop item as a dumb file channel plus a manual installer, published via publish-workshop.js.
tags: [workshop, distribution, steam, installer, publishing]
use_when:
  - packaging or publishing a release of the port
  - changing what players receive or how they install
  - explaining the install flow in player docs
resource: src/publish-workshop.js
timestamp: 2026-08-18T18:00:00Z
---

# Steam Workshop distribution

Sandustry's release branch has no mod auto-loader, so the Workshop is
used purely as a file-delivery channel: subscribing downloads the files;
the player then runs an installer by hand which patches the game.

## The flow

1. **Publish (dev side):** `node src/publish-workshop.js [existingItemId]`
   uses the game's own bundled steamworks.js to create/update the UGC
   item (created PRIVATE first for page review). It uploads
   `workshop/content/` + `workshop/preview.png`. `workshop/content/` is a
   mirror of `dist-package/` (installer + docs + `src/`).
2. **Subscribe (player side):** Workshop item **3784750764**, app
   2764460. Steam downloads to
   `steamapps/workshop/content/2764460/3784750764/` and auto-updates it
   on mod updates.
3. **Install (player side, manual, repeated after every game/mod
   update):** run `install.bat` / `install.ps1` from that folder — it
   locates the game, extracts/patches, installs the mod. No Node or
   internet needed.
4. Both players must run the same mod version — the in-game panel warns
   in red on mismatch.

## macOS facts (verified 2026-08-18)

- Workshop subscription works on mac: item 3784750764 is present under
  `~/Library/Application Support/Steam/steamapps/workshop/content/2764460/3784750764/`
  with the full content mirror.
- The delivered installer is `.bat`/`.ps1` — unusable on mac. The port's
  deliverable is a mac installer shipped **in the same workshop item**
  (or the upstream item updated to include it), since Workshop items are
  not per-platform for this game.
- `publish-workshop.js` hardcodes a Windows steamworks.js path
  (`GAME_SW = 'F:/SteamLibrary/.../resources/app/node_modules/steamworks.js'`)
  — publishing from mac needs that path parameterized. Publishing rights
  belong to the upstream author; a separate mac item would need its own
  publish run.

## Related

- [build-and-install-macos](../workflow/build-and-install-macos.md) — the installer step 3 runs
- [asar-restore](../gotchas/asar-restore.md) — why install must re-run after updates
- [windows-assumptions](../gotchas/windows-assumptions.md) — the publish-path assumption listed there
