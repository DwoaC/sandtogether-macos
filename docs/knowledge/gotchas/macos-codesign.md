---
type: Gotcha
title: Sandustry.app is adhoc-signed
description: The macOS build has only an adhoc linker signature (no Developer ID, no hardened runtime flag observed), which affects how safely we can modify app.asar.
tags: [codesign, macos, gatekeeper, security]
use_when:
  - modifying anything inside Sandustry.app
  - debugging the game failing to launch after installing the mod
timestamp: 2026-08-18T21:00:00Z
---

# Sandustry.app is adhoc-signed

Verified 2026-08-18 with `codesign -dv`:
`Signature=adhoc`, `flags=0x20002(adhoc,linker-signed)`,
`TeamIdentifier=not set`. No Developer ID, no notarization.

## Why it matters

- Good news: there is no real signature to invalidate — no
  hardened-runtime Developer ID seal that modifying
  `Contents/Resources` would break. Steam-launched apps also skip the
  quarantine/Gatekeeper path a downloaded app would hit.
- **Verified 2026-08-18 on arm64 (this machine):** the fully modded
  bundle (asar extracted+renamed, files patched) launches cleanly with
  the mod active — the executable's linker signature is untouched by
  Resources changes, and no re-sign was needed.
- Fallback if a future macOS tightens this:
  `codesign --force --deep -s - "<path>/Sandustry.app"` re-applies an
  adhoc signature to the whole bundle.

## Related

- [game-install-macos](../systems/game-install-macos.md) — bundle layout being modified
- [asar-restore](asar-restore.md) — the modification in question
