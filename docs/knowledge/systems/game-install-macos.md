---
type: System
title: Sandustry macOS install layout
description: Verified paths, versions, and Electron bundle structure of the macOS Steam build of Sandustry on this machine.
tags: [sandustry, macos, steam, electron, paths]
use_when:
  - writing or porting install/uninstall/launch scripts for the mod
  - deciding where to copy mod files or patch game files on macOS
  - locating the game's user data, saves, mods, or settings on macOS
timestamp: 2026-08-18T00:00:00Z
---

# Sandustry macOS install layout

Sandustry is an Electron app shipped as a normal macOS `.app` bundle via
Steam. All paths below verified on this machine 2026-08-18.

## Game install

- Steam AppID **2764460**, manifest buildid **24719878**
- Install dir: `~/Library/Application Support/Steam/steamapps/common/Sandustry/Sandustry.app`
- `Info.plist`: `CFBundleIdentifier` = `com.sandustry.game`,
  `CFBundleShortVersionString` = **0.5.2**, `LSMinimumSystemVersion` 11.0
- Executable: `Contents/MacOS/Sandustry`
- Game code: `Contents/Resources/app.asar` (all JS + assets)
- Native modules: `Contents/Resources/app.asar.unpacked/node_modules/steamworks.js`
  — ships prebuilds for `dist/osx`, `dist/win64`, `dist/linux64`, so
  Steam P2P is available on macOS without rebuilding anything
- `Contents/Resources/steam_appid.txt` contains `2764460`
- Electron frameworks in `Contents/Frameworks/` (Electron Framework,
  Squirrel, helper apps)

The Windows layout the upstream mod targets (`<game>/resources/app.asar`
next to `Sandustry.exe`) maps to `Sandustry.app/Contents/Resources/` on
macOS.

## User data

- `~/Library/Application Support/Sandustry/` (Electron userData) —
  contains `saves/`, `mods/` (exists, empty), `custom_maps/`,
  `meta/settings.json`, `meta/lastPlayedGame.json`
- Windows `%APPDATA%\Sandustry` maps here. Upstream's log path
  `%APPDATA%\Sandustry\logs\main.log` had no `logs/` dir here yet —
  likely created on first modded run; verify before hardcoding.

## Gotchas

- macOS game version (0.5.2) differed from the Windows version upstream
  was reconned against (0.5.3) — see
  [version-skew](../gotchas/version-skew.md).
- The app is only adhoc-signed — see
  [macos-codesign](../gotchas/macos-codesign.md).

## Related

- [windows-assumptions](../gotchas/windows-assumptions.md) — every upstream path/script this layout replaces
- [dev-loop-macos](../workflow/dev-loop-macos.md) — how these paths are used day to day
