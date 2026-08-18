---
type: Gotcha
title: Electron-as-Node wraps fs with asar shims
description: Under ELECTRON_RUN_AS_NODE, any fs call on a path containing ".asar" is intercepted and treated as an archive lookup — plain-file operations on app.asar fail without process.noAsar.
tags: [electron, asar, fs, installer]
use_when:
  - writing any script that runs via ELECTRON_RUN_AS_NODE and touches app.asar
  - debugging ENOENT "not found in ...app.asar" errors from installer code
resource: dist-package-mac/install.js
timestamp: 2026-08-18T21:00:00Z
---

# Electron-as-Node wraps fs with asar shims

The mac installer runs its JS through the game's own Electron binary
(`ELECTRON_RUN_AS_NODE=1`) so players need no Node install. Discovered
2026-08-18: even in that mode, Electron's init wraps the whole `fs`
module — any path matching `/\.asar/i` is routed into archive-member
lookup. `fs.readFileSync('<...>/app.asar')` then fails with
`ENOENT, not found in <...>/app.asar` (it looked for an empty member
name *inside* the archive), and rename/delete on the asar would
misbehave the same way.

## The fix

`process.noAsar = true;` as the first line of any such script
(`dist-package-mac/install.js` does this). The env alternative is
`ELECTRON_NO_ASAR=1`. Plain Node is unaffected — the bug only appears
under the Electron runtime, which is exactly the player configuration,
so it will not surface in Node-based dev testing.

## Related

- [build-and-install-macos](../workflow/build-and-install-macos.md) — the installer that hit this
