---
title: Gotchas
description: Known traps for the macOS port — read before touching install, patch, or launch code.
---

# Gotchas

- [version-skew](version-skew.md) — macOS game build lags Windows; patch anchors may not match
- [windows-assumptions](windows-assumptions.md) — every Windows-only path, script, and convention in upstream that the port must replace
- [asar-restore](asar-restore.md) — Steam silently restores app.asar, reverting the mod
- [macos-codesign](macos-codesign.md) — the app is adhoc-signed; modified bundle verified launching fine
- [electron-as-node-asar](electron-as-node-asar.md) — ELECTRON_RUN_AS_NODE intercepts fs calls on .asar paths; need process.noAsar
- [ws-hello-mver-false-alarm](ws-hello-mver-false-alarm.md) — LAN sessions always flag "old mod" on the host; upstream asymmetry, cosmetic
- [client-demolish-red-blocks](client-demolish-red-blocks.md) — client demolishes strand red foundation tiles; only a host demolisher drag clears them
