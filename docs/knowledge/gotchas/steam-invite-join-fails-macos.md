---
type: Gotcha
title: Steam invite join never completes on macOS
description: mac↔mac Steam invites deliver but the join stalls after GameLobbyJoinRequested — LAN transport unaffected; fix not yet attempted.
tags: [steam-p2p, steamworks, macos, lobby, open-bug]
use_when:
  - debugging Steam invite/lobby join on macOS
  - deciding which transport to recommend to mac players
timestamp: 2026-08-18T23:30:00Z
---

# Steam invite join never completes on macOS

Tier 2b test (2026-08-18, two Apple Silicon Macs, mod v0.9.33 tree):

What works, per logs:
- steamworks.js inits both sides ("Steam OK — nick/id" logged)
- Host creates lobby: `event: hosting {"transport":"steam","lobbyId":"109775242569362426"}`
- Invite delivered; client logs `GameLobbyJoinRequested` with the
  correct friend + lobby ids

Then nothing — no `joined`, no peer events. Failure is downstream of
the join request: `joinSteamLobby()` or P2P session establishment in
`src/st-main.js`. Not investigated further (parked in favor of the
upstream PR); LAN transport fully works, READMEs steer mac players
to Host LAN / Join LAN.

Next debugging session: start at `joinSteamLobby` in `src/st-main.js`,
add logging around lobby.join() and the P2P channel setup, check
whether the osx steamworks.js build supports the networking API the
mod uses (SDR / ISteamNetworkingMessages vs old P2P API).

Disclosed in the upstream PR:
<https://github.com/IronBamBam1990/sandtogether/pull/2>

## Related

- [transports](../systems/transports.md) — the Steam path that stalls
- [test-environment](../meta/test-environment.md) — tier 2b definition
