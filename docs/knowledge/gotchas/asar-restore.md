---
type: Gotcha
title: Steam restores app.asar and reverts the mod
description: Steam file verification/updates recreate app.asar; if present, Electron loads it instead of the patched app/ directory, silently disabling the mod.
tags: [steam, app.asar, electron, installer]
use_when:
  - writing the macOS launcher or installer
  - debugging "mod stopped working after an update"
timestamp: 2026-08-18T00:00:00Z
---

# Steam restores app.asar and reverts the mod

The install model is: extract `app.asar` into a plain `app/` directory,
patch files there, delete `app.asar`. Electron prefers `app.asar` over
`app/` when both exist — so whenever Steam verification or a game update
recreates `app.asar`, the game silently loads the unmodded version.

Upstream's answer is `SandTogether-START.bat`: on every launch, if
`resources\app.asar` exists, delete it, then start the game. The macOS
launcher must do the same against
`Sandustry.app/Contents/Resources/app.asar`.

## The detail that matters

- This is silent failure — no error, the game just runs vanilla. Any
  "mod not loading" report should check for a resurrected `app.asar`
  first.
- After a real game update the restored `app.asar` is *new* game code:
  don't just delete it — re-run the installer so the new bundle gets
  re-extracted and re-patched (anchors may also need updating, see
  [version-skew](version-skew.md)).
- Keep `app.asar.unpacked/` intact — steamworks.js native modules live
  there and are loaded via path references from the extracted code.

## Related

- [windows-assumptions](windows-assumptions.md) — the launcher this replaces
- [build-and-install-macos](../workflow/build-and-install-macos.md) — installer flow
