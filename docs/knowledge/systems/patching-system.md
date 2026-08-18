---
type: System
title: Bundle patching via string anchors
description: How the mod injects into the game's minified bundle.js — anchor/replacement pairs in patches.json, applied by patch.js or the player installer.
tags: [patching, bundle.js, anchors, installer]
use_when:
  - re-anchoring patches after a game update
  - porting the installer to macOS
  - adding a new game hook or action capture
resource: src/patches.json
timestamp: 2026-08-18T00:00:00Z
---

# Bundle patching via string anchors

Sandustry has no official mod loader on the release branch, so the mod
edits game files directly: `src/patches.json` holds anchor/patched string
pairs applied to the game's minified `dist/js/bundle.js`, with
per-game-version anchor variants. Anchors must stay unique-in-bundle.

## The detail that matters

- `src/patch.js` is a Node-based dev patcher; players instead run the
  pure-PowerShell installer in `dist-package/` (no Node dependency) —
  this is Windows-only and is the main thing the macOS port replaces.
- Bundle patches only need re-applying when `patches.json` changes; the
  mod's own `sandtogether.js` can be copied in without re-patching.
- The game ships an integration hook for **Fluxloader** (a community mod
  loader, checked from `main.js` via a Workshop item with modID
  `fluxloader` and hook `is-fluxloader-active-sync`), but upstream
  SandTogether does not depend on it — it patches files directly.
- Expect breakage after every game update; upstream re-anchors quickly.

## Gotchas

- Anchors are version-sensitive and the macOS build can lag the Windows
  build — see [version-skew](../gotchas/version-skew.md). Never assume an
  anchor that matches on Windows matches the mac `bundle.js`; grep the
  actual installed bundle.
- Steam file verification restores `app.asar`, silently reverting the
  mod — see [asar-restore](../gotchas/asar-restore.md).

## Related

- [mod-architecture](mod-architecture.md) — what the patches hook into
- [build-and-install-macos](../workflow/build-and-install-macos.md) — the port's installer work
