---
type: System
title: SandTogether host-authoritative architecture
description: Why the mod is host-authoritative, what runs in each Electron context, and the world-streaming design.
tags: [sandtogether, architecture, multiplayer, electron, host-authoritative]
use_when:
  - modifying sync, networking, or action-forwarding code
  - deciding where new code belongs (main process vs renderer vs worker)
  - evaluating whether a change keeps the host-authoritative invariant
resource: src/sandtogether.js
timestamp: 2026-08-18T00:00:00Z
---

# SandTogether host-authoritative architecture

The game's simulation is non-deterministic (83× `Math.random` in physics,
work-stealing scheduler), so lockstep is impossible. SandTogether is
host-authoritative: the host runs the only real simulation; clients render
a mirrored world and forward their actions.

## The detail that matters

- **Host** streams dirty 40×40 chunks of `mapData` (RGBA) + `wallData` +
  `shadowMap` + `authorization` + `sim.cellIds` (collision) — 11 B/cell,
  deflate-compressed, prioritized around player positions (fast lane) with
  a starvation-free FIFO for the rest and content-hash skipping.
- **Client** simulation is paused via manager opcode `SetPaused`;
  rendering stays alive reading mirrored buffers each frame. A re-pause
  heartbeat defends against the game's own unpause paths (ESC menu).
- **Client actions** (dig, build, demolish, move, vacuum, grabber,
  flamethrower, cryoblaster, spray, guns…) are captured by string patches
  in `bundle.js` plus game event hooks, forwarded to the host, replayed
  authoritatively, confirmed back through the world stream.
- The world lives in a **SharedArrayBuffer** shared between the game's
  threads — this is what makes direct state mirroring possible.
- Up to 4 players; Steam achievements keep working.

## Code layout (this repo)

- `src/sandtogether.js` — renderer side: HUD, world sync, action
  forwarding/replay, player models, i18n EN/PL
- `src/st-main.js` — Electron main process: transports, invites, relays
- `src/st-preload-append.js` — preload bridge (`sandtogetherNet`)
- `BUNDLE_MAP.md`, `WORKERS_MAP.md` — upstream reverse-engineering maps
  of `bundle.js` and the simulation workers

## Invariant

Clients must never mutate the shared world locally except through the
confirmed-mirror pattern. Upstream rejects PRs that break this.

## Related

- [patching-system](patching-system.md) — how the hooks get into the game
- [transports](transports.md) — how host and clients talk
