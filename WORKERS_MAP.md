# Worker map — Sandustry simulation workers

*Translated from the original Polish notes.*

Source: agent report from 2026-08-16. Files: `scratchpad\sandustry\pretty\{simulation,manager,utility}-worker.pretty.js`.

## 1. Simulation loop — in the MANAGER worker, not in the simulation worker!

- `manager-worker.pretty.js:1052-1064` — `StartManagerLoop`: rAF driver with an accumulator.
- `:914` — `he = 1/60` — **fixed timestep 60 Hz**.
- `:1055-1060` — delta clamped to 0.25 s, speed multiplier `fe` (`SetSimulationSpeed`, clamp [0,5], `:1077`), classic fixed-step catch-up.
- Tick body `be()` `:1135-1245`, phases:
  1. **Mutation drain** `:1142-1148` — Atomics handshake with the main thread (§3)
  2. **Timed triggers** `:1149-1161` — conveyor belts (166 ms), shakers (3333 ms), machines (683 ms), autosave, pumps, gloom
  3. Swap of chunk dirty maps `:1161`
  4. **Cell update dispatch** — broadcast `RunUpdate`/`RunTick` to the sim workers + await
  5. Hot-column rebalancing `:1205-1227`
  6. `store.meta.tick++` `:1244`
- Legacy path = 2-phase checkerboard (Even→Odd→PostUpdate); new path = `RunTick`, workers self-schedule via an atomic work queue.
- Worker side: `simulation-worker.pretty.js:40634` (RunUpdate), `:40645` (RunTick), chunk-claiming loop with spin-waits `:40692-40889`.

## 2. World memory

**One big SAB, struct-of-arrays; identical layout function in 3 contexts:** sim `:12429-12568`, manager `:354-491`, main `bundle:74236-74258`.

**Cell format — Uint32Array `cellIds` (width*height), value = range-based ID** (`:12409-12422`):
- `0` = empty
- `1..1000` = undamaged terrain (type id)
- `1001..1_000_000` = damaged-terrain handle → `damagedGround.type[]`(u8) + `.hp[]`(u16)
- `1_000_001..2_000_000` = element handle → index into the `elementData` SoA

`elementData` (`:12540-12566`): type(u8), x,y(u16), velocityX/Y, minVelocityX/Y, thresholdX/Y, density, durationMax/Left, dataField4 (f32); hasBeenUpdated, isFreeFalling, variantIndex, skipPhysics, hasDuration (u8); movesYAxis(+Count), dataField1/3 (u16); lastSideChecked, dataField2 (i16); linkedElementIndex (u32). **No temperature** — thermal behavior = type transitions (Ice/Steam/Lava...).

Element capacity 1e6, grows via `ReallocSimState`; slab allocator.

**Chunks: 40x40 cells** (`chunkSize=40`, `bundle:58529`), `cellSize=4` px. Two u8 dirty maps: `chunkShouldUpdate` / `chunkShouldUpdateNext` (`:12533-12534`). Helpers in the manager `:651-694`.

**Remaining SABs** (list in the sim worker's `Init` `:40514-40570`): mapData, wallData, authorization, mouseWorldPos, actionState, reservoir, playerPos, listenerPos, gold(+Change), energy(+Change), productionPoints, conveyorBeltsAnimationIndex, shadowMap, waterPresence, workerPerformance + blockGrid (blockType/blockAccess/blockData/filterPalette/structureVersion/conveyorVersion `:40628-40631`).

World dimensions are data-driven from the map (`store.world.size`), not a constant.

## 3. Message protocol

- Full enum of 81 ids in plaintext: `manager-worker.pretty.js:265`. Format: `[msgId, ...args]`.
- Sim onmessage `:40510`; cases include Init 40513, RunUpdate 40634, RunTick 40645, Blast 40903, Dig 40906, UpdateStructure(s) 40909/40912, RunConveyorBelts 40917, ComputeShadow* ~41027, RegisterMod* / RegisterWorkerEventHandler / RegisterWorkerHook, ReallocSimState ~41180.
- Sim → main: InitFinished, PlaySound, AddLightBatch, SandkitCreateParticlesBatch, SandkitEventBatch, FlameBurnBatch (26547), TerrainDestroyedBatch (26767), ShowToast, UpdateStructure... (batching `:26771`).
- Sim → manager: UpdateFinished, PostUpdate, RunConveyorBelts.

**KEY: how the main thread injects digging/building.** There is NO SetCell handler in the sim worker. Instead:
- The main bundle contains the ENTIRE sim library and **writes directly to the SAB** via `FH.elements.createAt/replaceAt/removeAt`, `FH.terrains.removeAt` (`bundle:12466, 13009, 37298`).
- Writes are **queued and applied only while the sim is stopped**, via the mutation-sync module `bundle:52636-52719` (exports `Lu` (mutation queue), `f6`, `dt`, `a6`, `cV`, `lh`, `ZG`, `cT` (init)).
- Protocol on `Int32Array mutationSync[0]`: main `0→1` (work pending, `:52712`) + `Atomics.waitAsync`; manager `:1143-1148` sees 1 → store 2 → notify → wait ≤100 ms; main `compareExchange(2→3)` → drain the queues (`:52698-52704`) → store 0 + notify. SAB: `bundle:74514-74518`.
- Some actions do go as messages, though: Dig, Blast, Vacuum, HandleGrabber, SwapElement, AddStructure(s), QueueSetCell, SetPixel, SetChunkActive, Ignite, SpawnWorldItem — routed to the owning thread via `getThreadIndexFromCellX` (`bundle:13197`).

## 4. Manager worker = clock + barrier scheduler

- Owner of the 60 Hz loop and of `store.meta.tick`; trigger table `:713-748`.
- Fan-out to the sim workers via MessagePorts; `ve` `:1247-1256` (sequential ids so ticks don't interleave), `Te` (column sweep for conveyor belts), `Fe` (barrier done===threads).
- Work-queue SAB `:1005-1048`; adaptive scheduling (hot columns, EMA `:1205-1227`).
- Handles: SetPaused, SetSimulationSpeed, **RegisterManagerTrigger (`new Function(...)` on data[2], `:1083` — a code-injection point into the manager for mods!)**, RegisterModSharedBuffer `:1110`, ReallocSimState `:1128`, Save `:1125` → SAB snapshot → `UtilitySave` to the utility worker (`Me` `:1274-1306`).

## 5. Utility worker = save serialization

The only real entry point is `:39220-39326` (the remaining 39k lines = dead webpack shared code). Handles UtilityInit + **UtilitySave `:39229-39320`**: raw cellIds/elementData/damagedGround/wallData/shadowMap/authorization → JSON save (`store`, `wall`, `matrix`, `shadow`, `authorization` + RLE sections) + metadata → SaveComplete. **A ready-made full-state serializer = join snapshot.**

## 6. Determinism — THERE IS NONE

- 83 `Math.random()` calls in the simulation worker, including in the physics path: `:30791-30794` (free-fall jitter, random bounces), `:2369`, `:30411/:30749` (random sign), `:9017/:29268` (random neighbor shuffle!), `:40245` (gold roll in the shaker).
- No seeded PRNG in the tick path; the seed exists only in the save metadata and in the Pixi noise uniform.
- The only shared randomness: a per-tick int rolled by the manager and broadcast in the RunTick args (`manager:1162, :1179`) — a ready-made "tick seed" hook, but that's not enough.
- Even with a seed: the chunk-claiming order = `Atomics.add` on a shared counter → non-deterministic; the worker count depends on `hardwareConcurrency` (clamp(HC-2, 2, 18), `bundle:74170-74173`).

**=> Lockstep is definitively out. Host-authoritative state streaming.**

## 7. Multi-threading

N sim workers write in parallel to a single SAB, coordinated with atomics (work stealing `Atomics.add`, spin-waits on neighbor flags `:40752-40786`, publication via `Atomics.store(chunkDone,...)`). Main ↔ workers communicate only through the mutationSync gate + Atomics.waitAsync.

## Seams for multiplayer (conclusions)

- (a) **the 60 Hz loop `be()` in the manager** = natural network tick
- (b) **the mutationSync queue** (`bundle:52636-52719`) = the single choke point for all player-driven world edits — hook `Lu`/`f6`/`dt`, intercept and replay remote actions atomically between ticks
- (c) **the UtilitySave path** = a ready-made full-state serializer for join/resync
- (d) deltas can be scoped with the existing `chunkShouldUpdate` dirty map
