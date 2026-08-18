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
