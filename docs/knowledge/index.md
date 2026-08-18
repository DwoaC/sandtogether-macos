---
okf_version: "0.1"
okf_bundle_name: sandtogether-macos
title: SandTogether macOS port — knowledge bundle
description: Durable project knowledge for porting the SandTogether co-op mod (Windows) to the macOS Steam build of Sandustry.
---

# SandTogether macOS port — knowledge bundle

This repo is a macOS port of [IronBamBam1990/sandtogether](https://github.com/IronBamBam1990/sandtogether),
a co-op multiplayer mod for the Steam game **Sandustry** (AppID 2764460).
The clone base is the upstream repo; port work adapts its Windows-only
installer, paths, and launch flow to the macOS app bundle.

Concept types: `System | Gotcha | Workflow | Playbook`.

Facts about the local game install (paths, versions, build IDs) were
verified against this machine on the concept's `timestamp` date — they
live outside this repo and can change with any Steam update. Re-verify
before asserting.

## Directories

- [systems/](systems/index.md) — how the game and the mod actually work
- [gotchas/](gotchas/index.md) — traps already identified; read before touching install/patch code
- [workflow/](workflow/index.md) — dev loop and build/install procedures
- [meta/](meta/index.md) — upstream sources and external references
