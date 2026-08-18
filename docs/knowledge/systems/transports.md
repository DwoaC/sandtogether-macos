---
type: System
title: Networking transports (Steam P2P + LAN WebSocket)
description: The two transports, why networking lives in the Electron main process, and macOS availability of steamworks.js.
tags: [networking, steam-p2p, websocket, steamworks, main-process]
use_when:
  - working on lobby, invite, join, or relay code
  - debugging connection failures on macOS
  - deciding whether a networking feature needs the main process
resource: src/st-main.js
timestamp: 2026-08-18T00:00:00Z
---

# Networking transports

Two transports, both implemented in `src/st-main.js`:

1. **Steam P2P** — lobbies, friend invites, `+connect_lobby` launch arg,
   lobby-ID clipboard join. Uses the game's own bundled **steamworks.js
   0.3.1** native bindings (Steam Datagram Relay; no server, no port
   forwarding).
2. **WebSocket (LAN)** — dependency-free, for local/LAN play and
   two-instance dev testing on `127.0.0.1`.

## The detail that matters

- Networking lives in the **Electron main process** because the renderer
  reloads between scenes — a renderer-held socket would drop on every
  scene change.
- steamworks.js is only reachable from the main process (renderer is
  sandboxed behind contextBridge).
- **macOS-verified:** the game's bundled steamworks.js at
  `app.asar.unpacked/node_modules/steamworks.js` ships `dist/osx`
  prebuilds, so Steam P2P needs no native rebuild for the port.
- The preload bridge exposing networking to the renderer is
  `src/st-preload-append.js` (`sandtogetherNet`).

## Related

- [mod-architecture](mod-architecture.md) — what flows over these transports
- [game-install-macos](game-install-macos.md) — where steamworks.js sits on disk
