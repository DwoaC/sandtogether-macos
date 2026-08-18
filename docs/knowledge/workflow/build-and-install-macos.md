---
type: Workflow
title: Building and installing the mod on macOS
description: What the macOS installer and launcher scripts must do, mirroring the upstream Windows dist-package.
tags: [installer, launcher, asar, shell]
use_when:
  - writing or changing the macOS installer or launcher scripts
  - packaging a player-facing release
timestamp: 2026-08-18T00:00:00Z
---

# Building and installing the mod on macOS

Upstream ships `dist-package/` — a pure-PowerShell installer (no Node
needed for players) plus docs. The macOS port needs the same contract as
shell scripts. Nothing is built from source; "build" here means patch +
package.

## Installer must

1. Locate the game:
   `~/Library/Application Support/Steam/steamapps/common/Sandustry/Sandustry.app`
   (allow override for non-default Steam libraries).
2. Extract `Contents/Resources/app.asar` → `Contents/Resources/app/`
   (needs an asar extractor; upstream avoids Node for players — decide:
   bundle a minimal extractor or require `npx asar`).
3. Apply every `src/patches.json` anchor→replacement to
   `app/dist/js/bundle.js`; fail loudly if any anchor count ≠ 1.
4. Copy `src/sandtogether.js` → `app/dist/js/`, append
   `src/st-preload-append.js` to the preload, install `src/st-main.js`
   per upstream's layout.
5. Delete `app.asar` (Electron prefers it over `app/` —
   [asar-restore](../gotchas/asar-restore.md)). Leave
   `app.asar.unpacked/` untouched (native steamworks.js lives there).
6. Re-run required after every game or mod update.

## Launcher must

Delete `Contents/Resources/app.asar` if Steam recreated it, then launch
the game (via `open` on the .app or `steam://run/2764460` — the Steam URL
keeps the Steam overlay/launch context; verify `+connect_lobby` arg
passthrough for invite joins).

## Related

- [windows-assumptions](../gotchas/windows-assumptions.md) — the scripts being replaced
- [macos-codesign](../gotchas/macos-codesign.md) — post-modification launch risk
- [patching-system](../systems/patching-system.md) — what step 3 applies
