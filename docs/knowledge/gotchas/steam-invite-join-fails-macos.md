---
type: Gotcha
title: osx steamworks.js emits snake_case callback fields (broke invite join)
description: The osx steamworks binary delivers callback payloads with snake_case keys where win64 uses camelCase — any handler reading only camelCase silently no-ops on mac. Fixed with pickField().
tags: [steam-p2p, steamworks, macos, callbacks, fixed]
use_when:
  - handling any steamworks.js callback payload field
  - debugging a Steam feature that works on Windows but silently fails on mac
timestamp: 2026-08-18T23:59:00Z
---

# osx steamworks.js emits snake_case callback fields

FIXED 2026-08-18 (commit e2e52c0 + deploy fix c786cc2); Steam invite
join verified working mac↔mac: request → joined in ~350 ms, P2P hello
both ways, mver OK both ways.

## Root cause

The game bundles steamworks.js 0.3.1 with per-platform native binaries.
Callback payload field names differ by binary: win64 emits camelCase
(`lobbySteamId`), osx emits snake_case (`lobby_steam_id` — captured in
the log). `GameLobbyJoinRequested` read only camelCase names, got
`undefined`, and the `if (lobbyId !== null)` guard silently skipped
`joinSteamLobby`. Invite delivered, join never started, no error.

## Fix

`pickField(data, ...keys)` in `src/st-main.js` tries both casings, used
in `GameLobbyJoinRequested` and `P2PSessionRequest` (same risk on the
host's accept path). Unknown-shape payloads now emit a visible error
event instead of a silent no-op. Test: scratchpad
`test-callback-fields.js` runs the real function against both
platforms' captured payloads.

## Rule

Any new steamworks.js callback handler must read fields through
`pickField` with both casings. Suspect this class of bug whenever a
Steam feature works on Windows and silently does nothing on mac.

## Deployment trap that masked the fix

First deploy shipped OLD code: the fix went into `src/st-main.js` but
the dev installer's payload fallback was `dist-package/src/` (the
release-time copy). Now the fallback is `../src` and `dist-package/src`
was synced. Rule: after editing mod source, verify the *installed* file
(`grep pickField "<game>/Contents/Resources/app/st-main.js"`) before
retesting.

## Related

- [invite-button-overlay-macos](invite-button-overlay-macos.md) — the OTHER invite problem, still open
- [transports](../systems/transports.md) — Steam transport now fully working on mac
