---
type: Gotcha
title: Windows assumptions in upstream to replace
description: Inventory of every Windows-only path, script, and convention in the upstream mod, with the macOS equivalent for each.
tags: [porting, windows, macos, installer, paths]
use_when:
  - planning or implementing any piece of the macOS port
  - deciding whether an upstream file can be reused as-is
timestamp: 2026-08-18T21:00:00Z
---

# Windows assumptions in upstream to replace

Upstream is Windows-only in its tooling, not its mod logic. The JS mod
code (`src/sandtogether.js`, `src/st-main.js`, preload) is
platform-neutral; everything around it assumes Windows.

## The inventory

| Upstream (Windows) | macOS equivalent |
|---|---|
| `dist-package/install.bat` + pure-PowerShell installer | shell-script installer to write |
| `SandTogether-START.bat` — deletes `resources\app.asar` if Steam restored it, then launches `Sandustry.exe` | launcher script: check/remove `Sandustry.app/Contents/Resources/app.asar`, then `open` the app or launch via `steam://run/2764460` |
| `<game>\resources\app.asar` next to `Sandustry.exe` | `Sandustry.app/Contents/Resources/app.asar` |
| Mod copy target `<game>/resources/app/dist/js/sandtogether.js` | `Sandustry.app/Contents/Resources/app/dist/js/sandtogether.js` (asar extracted to `app/`) |
| `%APPDATA%\Sandustry` (logs, saves, mods) | `~/Library/Application Support/Sandustry` |
| `%APPDATA%\Sandustry\logs\main.log` | `~/Library/Logs/Sandustry/main.log` (verified — electron-log's mac default; NOT under Application Support) |
| `repatch.bat`, `update.bat` in related tooling | shell scripts |
| `src/publish-workshop.js` hardcodes `GAME_SW = 'F:/SteamLibrary/...'` for steamworks.js | parameterize; mac path is inside `Sandustry.app/Contents/Resources/app.asar.unpacked/node_modules/steamworks.js` |

## Gotchas

- `.bat`/PowerShell comments and player docs are partly Polish
  (`INSTRUKCJA.md`); keep EN/PL parity if porting docs.
- Windows batch quoting/`%~dp0` idioms have no direct meaning in the
  port — rewrite, don't transliterate.
- macOS adds one concern Windows doesn't have: code signature — see
  [macos-codesign](macos-codesign.md).

## Related

- [game-install-macos](../systems/game-install-macos.md) — verified mac paths
- [asar-restore](asar-restore.md) — why START scripts delete app.asar
- [build-and-install-macos](../workflow/build-and-install-macos.md) — the replacement installer work
