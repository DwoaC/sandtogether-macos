---
type: Gotcha
title: LAN/WS sessions always show a false mod-version alarm on the host
description: Upstream asymmetry — on the WebSocket transport only the client sends the game-level hello, so the host never receives an mver reply and flags the peer as running an old mod.
tags: [upstream-bug, websocket, mver, version-check, lan]
use_when:
  - a player reports "incompatible mod version" in a LAN session
  - evaluating whether a version warning is real before debugging sync
  - preparing upstream PRs
resource: src/st-main.js
timestamp: 2026-08-18T21:45:00Z
---

# LAN/WS sessions always show a false mod-version alarm on the host

Observed in the first mac↔mac loopback test (2026-08-18): host panel
shows the mod-version-incompatible warning ("PEER NA STARYM MODZIE /
OLD mod (<= 0.9.7)") even though both sides run identical mod builds.
World sync works fine regardless.

## Root cause (upstream, not the port)

The mod-version exchange (`mver`) is sent by the renderer as a *reply
to receiving a game-level `hello` message* (`src/sandtogether.js` ~349).
On the WS transport only the **client** sends `hello`
(`src/st-main.js:154`, on join); the WS server side never does — the
host-sends-hello paths exist only for the Steam transport
(`src/st-main.js:220` and `:270`). So:

- host receives client hello → replies mver → client logs
  "wersja moda OK u host" ✓
- client never receives a host hello → never sends mver → host's 5 s
  timeout fires the OLD-mod alarm ✗

Pure logic, identical on Windows — not a mac issue. Steam-transport
sessions are unaffected (both sides send hello there).

## Disposition

Cosmetic on LAN; safe to ignore when both installs came from the same
commit. Candidate one-line upstream PR: after the WS server registers a
new peer, send `{t:'hello', nick, ver}` to that socket.

## Related

- [test-environment](../meta/test-environment.md) — the test where this surfaced
- [transports](../systems/transports.md) — WS vs Steam transport split
