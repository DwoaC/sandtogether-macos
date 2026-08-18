---
title: Systems
description: How Sandustry and the SandTogether mod work — game install layout, mod architecture, patching, transports.
---

# Systems

- [game-install-macos](game-install-macos.md) — where the macOS Steam build of Sandustry lives, its Electron layout, and its user-data dir
- [mod-architecture](mod-architecture.md) — host-authoritative co-op design: what runs where and why lockstep is impossible
- [patching-system](patching-system.md) — how the mod injects into the game: string anchors in bundle.js via patches.json
- [transports](transports.md) — Steam P2P and LAN WebSocket networking, and why it lives in the Electron main process
- [workshop-distribution](workshop-distribution.md) — how the mod reaches players: Workshop item as file channel + manual installer
