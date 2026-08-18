---
type: Workflow
title: Dev loop on macOS
description: Edit → copy → restart cycle for mod development against the macOS game install, including two-instance local testing and logs.
tags: [dev-loop, testing, logs, macos]
use_when:
  - iterating on mod code and needing to test in the real game
  - setting up two-instance local co-op testing
  - looking for the mod's runtime logs
timestamp: 2026-08-18T21:00:00Z
---

# Dev loop on macOS

Verified end-to-end 2026-08-18 (first modded run succeeded).

1. Install the mod into the game once:
   `dist-package-mac/install.command` (see
   [build-and-install-macos](build-and-install-macos.md)). Bundle patches
   only need re-applying when `src/patches.json` changes.
2. Edit `src/sandtogether.js`, copy to
   `Sandustry.app/Contents/Resources/app/dist/js/sandtogether.js`,
   restart the game.
3. **Two-instance local testing**: launch a second copy with
   `--st-userdata=<dir>` — any `--st-*` arg bypasses the game's
   single-instance lock. Use `Host LAN` / `Join LAN` on `127.0.0.1`.
   On macOS invoke the inner binary directly:
   `"<Sandustry.app>/Contents/MacOS/Sandustry" --st-userdata=/tmp/st2`
   (direct binary launch verified working; also prints logs to stdout).
4. **Logs** (verified): `[SandTogether]`-tagged entries land in
   `~/Library/Logs/Sandustry/main.log` — the electron-log default on
   mac. NOT under `~/Library/Application Support/Sandustry/` (that's
   only saves/settings/mods; Windows keeps logs in `%APPDATA%` because
   there userData and logs share a root).

## Related

- [game-install-macos](../systems/game-install-macos.md) — all the paths used above
- [port-plan](port-plan.md) — where verifying this loop sits in the plan
