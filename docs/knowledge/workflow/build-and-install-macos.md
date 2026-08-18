---
type: Workflow
title: Building and installing the mod on macOS
description: What the macOS installer and launcher scripts must do, mirroring the upstream Windows dist-package.
tags: [installer, launcher, asar, shell]
use_when:
  - writing or changing the macOS installer or launcher scripts
  - packaging a player-facing release
resource: dist-package-mac/install.js
timestamp: 2026-08-18T21:00:00Z
---

# Building and installing the mod on macOS

Built and verified 2026-08-18 (real install + modded launch on this
machine). Lives in `dist-package-mac/`, the mac counterpart of
upstream's PowerShell `dist-package/`:

- **`install.js`** — dependency-free Node script mirroring
  `install.ps1`: locate game (default library + `libraryfolders.vdf`),
  kill running game, extract `app.asar` → `app/` with a built-in asar
  reader (fresh re-extract whenever the asar is present, so `app/`
  always matches the current build), rename asar → `app.asar.bak`, then
  delegate all patching to upstream's cross-platform `src/patch.js`
  (spawned with `process.execPath`). Idempotent. Payload `src/` is
  resolved from `__dirname/src` first, falling back to
  `../dist-package/src` for in-repo dev runs.
- **`install.command`** — double-clickable wrapper. No Node required:
  runs `install.js` via `ELECTRON_RUN_AS_NODE=1` on the game's own
  Electron binary (Node v20.18.1). Requires `process.noAsar` — see
  [electron-as-node-asar](../gotchas/electron-as-node-asar.md).
- **`SandTogether-Launch.command`** — if Steam restored `app.asar`,
  re-runs the installer (full re-extract + re-patch — safer than
  upstream's delete-only START.bat after game updates), then
  `open steam://run/2764460` so overlay and `+connect_lobby` invites
  keep working.

`app.asar.unpacked/` is never touched — native steamworks.js lives
there, and the extractor copies its members into `app/` from it.

Uninstall: Steam → verify integrity (restores `app.asar`), delete
`Contents/Resources/app`.

Still open for player-grade release: `+connect_lobby` passthrough via
the steam:// launch is unverified, and `.command` files downloaded from
the internet will hit Gatekeeper quarantine (workshop-delivered files
via Steam should be clean; verify on Tony's machine).

## Related

- [windows-assumptions](../gotchas/windows-assumptions.md) — the scripts this replaced
- [asar-restore](../gotchas/asar-restore.md) — why the launcher re-checks every start
- [patching-system](../systems/patching-system.md) — what patch.js applies
