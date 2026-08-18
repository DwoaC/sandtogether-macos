---
type: Workflow
title: Dev loop on macOS
description: Edit → copy → restart cycle for mod development against the macOS game install, including two-instance local testing and logs.
tags: [dev-loop, testing, logs, macos]
use_when:
  - iterating on mod code and needing to test in the real game
  - setting up two-instance local co-op testing
  - looking for the mod's runtime logs
timestamp: 2026-08-18T00:00:00Z
---

# Dev loop on macOS

Translated from upstream's Windows dev loop; mac paths verified, flow
itself pending first modded run.

1. Install the mod into the game once (installer, see
   [build-and-install-macos](build-and-install-macos.md)). Bundle patches
   only need re-applying when `src/patches.json` changes.
2. Edit `src/sandtogether.js`, copy to
   `Sandustry.app/Contents/Resources/app/dist/js/sandtogether.js`,
   restart the game.
3. **Two-instance local testing**: launch a second copy with
   `--st-userdata=<dir>` — any `--st-*` arg bypasses the game's
   single-instance lock. Use `Host LAN` / `Join LAN` on `127.0.0.1`.
   On macOS a second instance means invoking the inner binary directly:
   `"<Sandustry.app>/Contents/MacOS/Sandustry" --st-userdata=/tmp/st2`
   (`open -n` doesn't pass args the same way; verify which works).
4. **Logs**: upstream logs everything tagged `[SandTogether]` to
   `%APPDATA%\Sandustry\logs\main.log` → expect
   `~/Library/Application Support/Sandustry/logs/main.log` on mac
   (`logs/` doesn't exist on an unmodded install; confirm on first
   modded run).

## Related

- [game-install-macos](../systems/game-install-macos.md) — all the paths used above
- [port-plan](port-plan.md) — where verifying this loop sits in the plan
