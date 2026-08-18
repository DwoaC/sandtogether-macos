---
type: System
title: Upstream and external references
description: Where this repo comes from and every external source relevant to the port — upstream mod, game, mod loader, community reverse-engineering.
tags: [upstream, references, links]
use_when:
  - syncing changes from upstream or preparing a PR back to it
  - needing game internals beyond what this bundle covers
  - checking licensing before publishing
timestamp: 2026-08-18T00:00:00Z
---

# Upstream and external references

This repo is a clone of the upstream mod; port work layers on top.

## Upstream mod

- Repo: <https://github.com/IronBamBam1990/sandtogether> — MIT, © Kamil
  Padula; contributors dotNine, Knight-HD
- Steam Workshop page:
  <https://steamcommunity.com/sharedfiles/filedetails/?id=3784750764>
- In-repo reverse-engineering docs (kept in this clone): `BUNDLE_MAP.md`,
  `WORKERS_MAP.md`, `COOP_PLAN.md`, `RECON.md`, `CHANGELOG.md`

## The game

- Sandustry, Steam AppID **2764460**, Early Access since 2026-08-13:
  <https://store.steampowered.com/app/2764460/Sandustry/>
- Developer's pre-Steam dev repo: <https://github.com/lantto/sand>
- Electron + webpack; simulation in Web Workers over SharedArrayBuffer;
  map procgen seeded via `seedrandom.min.js`

## Related community projects

- Fluxloader (community mod loader; game has native integration hooks):
  <https://github.com/fluxloader-team/fluxloader>
- Deobfuscated bundle.js notes:
  <https://github.com/TyllerTheGamer/sandustrybundle>
- Custom map loader mod:
  <https://github.com/Electric131/Sandustry-CustomMapLoader>
- Another Sandustry co-op attempt (Fluxloader-based, different codebase —
  not our upstream): <https://github.com/scooter5561/sandustry_together>

## Related

- [mod-architecture](../systems/mod-architecture.md) — summary of what upstream built
