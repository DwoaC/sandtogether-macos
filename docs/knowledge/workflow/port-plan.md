---
type: Playbook
title: macOS port plan
description: Ordered work items to get SandTogether running on the macOS Steam build of Sandustry.
tags: [porting, plan, macos]
use_when:
  - starting a work session on this repo and choosing what to do next
  - writing a design spec for any port work item
timestamp: 2026-08-18T19:00:00Z
---

# macOS port plan

The mod's JS (renderer, main-process, preload) is platform-neutral; the
port is about installation, launch, paths, and anchor verification. Order:

1. **Anchor audit** — ✅ DONE 2026-08-18: all 15 anchors (14 bundle +
   1 mainJs) resolve exactly once against the mac 0.5.2 files; details
   in [version-skew](../gotchas/version-skew.md). Re-run after any game
   or `patches.json` update (extract via
   `npx @electron/asar extract-file <app.asar> dist/js/bundle.js`).
2. **Installer script** (shell, replacing `dist-package` PowerShell):
   extract asar → apply patches → copy mod files → delete `app.asar`,
   preserving `app.asar.unpacked`. See
   [build-and-install-macos](build-and-install-macos.md).
3. **Launcher script** (replacing `SandTogether-START.bat`): delete
   resurrected `app.asar` if present, launch game. See
   [asar-restore](../gotchas/asar-restore.md).
4. **First modded run** — confirm launch (codesign question, see
   [macos-codesign](../gotchas/macos-codesign.md)), confirm
   `[SandTogether]` entries in the log, confirm log path on mac.
5. **Two-instance LAN test** — `--st-userdata=<dir>` second instance,
   Host LAN / Join LAN on 127.0.0.1. See
   [dev-loop-macos](dev-loop-macos.md).
6. **Steam P2P test** — steamworks.js `dist/osx` is bundled (verified);
   test lobby create/invite/join, ideally cross-platform vs a Windows
   host.
7. **Player docs** — macOS README section; upstream keeps EN + PL.

Knowledge impact: every step that verifies an "unverified" claim in the
gotcha concepts updates that concept in the same session.

## Related

- [mod-architecture](../systems/mod-architecture.md) — the thing being ported
- [windows-assumptions](../gotchas/windows-assumptions.md) — full replacement inventory
