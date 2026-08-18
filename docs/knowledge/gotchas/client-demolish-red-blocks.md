---
type: Gotcha
title: Client demolishes leave red blocks only the host can clear
description: Upstream's orphaned-foundation-tile sweep (v0.9.32) only arms on host/solo demolisher drags, so client demolishes strand red tiles the client cannot remove.
tags: [upstream-bug, demolish, red-blocks, client, sync]
use_when:
  - a client player reports being unable to delete/demolish things
  - working on demolish/action-replay code
  - preparing upstream PRs
resource: src/sandtogether.js
timestamp: 2026-08-18T22:30:00Z
---

# Client demolishes leave red blocks only the host can clear

Observed in the first tier-2a session (2026-08-18): Tony (client)
demolished structures fine, but red foundation tiles stayed behind, and
dragging the demolisher over them did nothing. Not a mac issue — pure
upstream logic.

## Mechanism (all in `src/sandtogether.js`)

- Structure demolish itself works: client `_demol` hook (~line 1252)
  forwards `{t:"act",k:"demolish",list}`; host replays via `removeOne`
  and confirms with `st rm`.
- But demolished buildings can strand foundation *terrain cells*
  (terrainType 15–18) — upstream's own comment: replayed tiles stuck in
  QUEUED state get skipped by the game's demolition.
- Upstream v0.9.32 added a 250 ms "demolish-dobicie" sweep that clears
  such orphans — armed via `ST._hostDemolRect` (~1236), which is set
  **only on host/solo demolisher drags**. The host's replay of a client
  demolish (`msg.k === "demolish"`, ~1290) never sets it.
- The client can't clear them either: red blocks aren't structures, so
  its `_demol` scan finds nothing ("pusty rect — nic do rozbiórki") and
  sends nothing.

Session logs matched exactly: client "CLIENT demolish rect → 7/5
struktur"; host later cleaned 70+80 orphans — but only when the HOST
dragged the demolisher over the area.

## Workaround

Host drags the demolisher across the red area — the sweep fires and the
world stream removes them for everyone.

## Fix candidate (upstream PR)

Client includes its rect in the act message
(`{t:"act",k:"demolish",list,rect}`); host replay sets
`ST._hostDemolRect` from that rect (fallback: bbox of `list`), letting
the existing sweep serve client demolishes too. Backward compatible —
old peers ignore the extra field.

## Related

- [ws-hello-mver-false-alarm](ws-hello-mver-false-alarm.md) — the other upstream quirk surfaced by tier-2 testing
- [test-environment](../meta/test-environment.md) — the session where this surfaced
