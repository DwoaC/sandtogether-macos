# Bundle map — Sandustry internals

*Translated from the original Polish notes.*

Source: agent report from 2026-08-16. All line numbers refer to `scratchpad\sandustry\pretty\bundle.pretty.js`.

## 1. Game state

The state root `e` has 4 branches: **`e.store`** (serializable, authoritative world), **`e.session`** (runtime/UI/input, not saved), **`e.shared`** (SharedArrayBuffer views, cross-thread), **`e.environment`** (workers) + **`e.sandkit`** (mods).

- Store construction: **73812–73940**. Fields: `version`, `player`, `productionPoints`, `resources{gold,fluxite,artifacts,energy}`, `creatures`, `conservatory`, `achievements`, `integrity{cheatsUsed,modsUsed}`, `world`, `projectiles[]`, `structures[]`, `drones[]`, `pipes[]`, `pumpsCache[]`, `worldItems[]`, `queue[]`, `gloom.emitterPositions[]`, `machineryEngine.runLaunchers`, `meta{worldId,worldName,tick,seed,nextId{...},elementCapacity,time}`.
- **Player: 73816–73888.** Flat object: `x, y, width, height, velocity{x,y}, threshold{x,y}, onGround, speedCapOverdrive{x,y}, inventory[], buildings[], tech{}, action, hotbar{...}, grapplingHook, cooldowns{}, isHovering, weaponsMeta`. **The player has NO health field** — health/maxHealth (20/20) belong to drones/creatures (27270, 28470, 28241).
- Player spawn: **73804–73810**; worldId is `Math.random().toString(36)` (**73811**).
- **Player physics: ~47040–47135.** Sub-stepped swept AABB vs terrain; writes `e.shared.playerPos[0/1]` (**47129**), emits `player:moved`; gravity **47135**. Ground check `de()` **47143–47151**.
- Camera: `e.session.camera.x/y` centered on the player, **21499–21550**; `session.overrideCamera` for cinematics (**21970**).
- Teleports/respawn also write to the SAB: **26452, 41497, 87765, 115782**.

## 2. Main loop

- **`Yt(e,t)` = rAF driver, 64307–64321.** FrameCap, pause (**64316**), `dt` clamp 50 ms (**64318**), `store.meta.time += dt`, await `Kt(e,dt)`, then minimap/audio/FPS, next rAF.
- **`Kt(e,t)` = per-frame update, 64264–64304.** Order: sim sync `re.lX(e.shared.sim)` → trigger scheduler (table `Dt`, including **mod triggers `e.sandkit.mods.triggers`, 64280–64286**) → queue → ~15 subsystems (structures, machines, projectiles, drones, player `D.LX`, light) → shader uniforms (**64288–64299**) → `emit("frame:update",{state,dt})` (**64300**) → `store.meta.tick++` (**64303**).
- Trigger examples: `EmitGloom` every 500 ms (**64237**), `PingPumpChunksFIX` every 10 s (**64244–64253**).

## 3. Worker protocol

- **Worker factory `nr(e)`: 74194–74215.** Types: `manager-worker`, `utility-worker`, `simulation-worker` (N instances). Under Fluxloader the worker is loaded via **synchronous XHR** from `js/<name>-worker.js` and booted from a Blob URL (**74203–74214**) — this is the seam for injecting code into workers.
- Thread creation + MessageChannel mesh between sim threads: **74170–74192** (`meta{startingIndex,threadCount,ports[],managerPort}`).
- **Opcode enum (`O.dD`), line 25707.** A message is an array `[opcode, ...args]`, opcodes 1–81. Most important: `Init=1, RunUpdate=2, SetCell=3, Blast=4, Dig=5, Vacuum=6, AddStructure=7, AddStructures=8, RemoveStructuresBetween=9, HandleGrabber=10, SwapElement=11, SetChunkActive=12, Ignite=14, IncrementFluxite=21, PingChunk=25, QueueSetCell=26, SetUpgradeLevel=27, BuildCheck=28, RegisterModElements=29, RegisterModTerrains=30, RegisterWorkerEventHandler=31, RegisterWorkerHook=32, InitFinished=36, UpdateFinished=37, SetPixel=38, Collector=39, PlaySound=41, AddLight=42, MoveCamera=43, SpawnWorldItem=44, SandkitEvent=46, ShowToast=49, RunConveyorBelts=51, UpdateStructure=52, PostUpdate=53, SetPaused=54, Save=55, StartManagerLoop=57, RegisterModSharedBuffer=58, SaveComplete=60, ReallocSimState=65, UpdateStructures=66, RunTick=67, SetSimulationSpeed=68, UtilityInit=69, UtilitySave=70, ElementSlabsExhausted=64, TerrainDestroyedBatch=81`.
- Transport: `post(state,threadIdx,msg)`, `postAll`, `postAllAwait` (**74529–74552**; `RunUpdate`/`RunTick` receive a correlation UUID at index 1, **74537–74545**), `postToEachThreadColumnSequentiallyAwait` (**74553–74564**).
- Handlers: utility onmessage **74290–74333**; manager **74334–74350**; per-sim-thread big switch **74352–74490**.
- Worker init receives **thin projections** of the store: `getWorkerStore` **74565–74594**, `getWorkerSession` **74595–74603**.
- **Main SABs:** allocation + views **129700–129909**. Contents: `mapData/wallData/authorization/shadowMap` = `Uint8Array(width*height)` (full world grids!); `playerPos/listenerPos` Float32; `gold/goldChange/energy/energyChange/productionPoints` Uint32; `mouse.worldPosition` Uint16; `actionState` Uint8; `reservoir`, `waterPresenceZones`, `workQueue` (chunk task queues **129770–129792**), `schedulingMode`, `hybridScheduling`, perf.
- Element simulation SAB: `Xs.xr(width,height,chunkSize,elementCapacity)` **129910–129914**; SoA layout on realloc **74226–74274** — `cellIds`, `terrainType`, `damagedGround{type,hp}`, `elementData.{type,x,y,velocityX,velocityY,...,dataField1-4}`. Growth: `ElementSlabsExhausted` → pause → `or()` +1e6 → broadcast `ReallocSimState`.
- Block/structure grid SABs: **25904–25923** (`blockTypeSab, blockAccessSab, blockDataSab, filterPaletteSab, structureVersionSab, conveyorVersionSab`). Manager SABs: **74506–74521** (`mutationSync` Int32 for Atomics).

## 4. Input

- All listeners in `Br(e)`: **74815–74960**. Mouse **74851–74890**, wheel **74891–74915**, `keydown` **74918–74929**, `keyup` **74930–74936**.
- State: `session.input.keys[name]` — 4-state enum `O.$T` (Up/Down/Pressed/Released), edge-triggered per frame. `session.input.mouse{position,worldPosition,cellPosition,clicked,pressed,released,available}`, `session.input.action.move`, `session.input.action.boost`, `session.input.mode`.
- Binding via `session.settings.keyBindings`; mouse buttons live in the same table as `MouseLeft/...`, wheel as `WheelUp/WheelDown`.
- **Every handler first emits `input:keydown`/`input:keyup`/`input:scroll`/... and ABORTS the default handling if a listener returns truthy (74921–74936)** — a clean interception point for netcode.
- Blur clears keys: `Er(e)` **74810–74814**.

## 5. Save/Load

- Save `B(e)` **10476–10491**: `session.saving.status="saving"`, emit `"store:save"`, fetches the wall palette, then `manager.postMessage([Save, {...e.store}, palette, id, type])` — **the entire store goes via structured clone to the manager worker**, which serializes it together with the SAB grids.
- Completion: `SaveComplete` **74291–74333** → `window.electron.saveSerialized(...)` (**10434**) or IndexedDB (**10405–10474**); metadata **10445–10465**.
- Load `S(e)` **10492–10560**: payload `{store, wall{tiles{data,sections,width,height},palette}, matrix, shadow, authorization}` — section decompression **10512–10518**. **This is the complete list of authoritative state = the snapshot for a joining client.**

## 6. Entities/buildings

- Buildings: `store.structures[]` (objects `{type,x,y,data}`) + spatial cache `session.cache.structures` (**64232**) + block-grid SAB for cell→structure lookups. Also `store.pipes`, `pumpsCache`, `drones`, `projectiles`, `worldItems`, counters `store.meta.nextId.*` (**73936–73939**).
- Mutations go to the workers as opcodes (`AddStructure`, `UpdateStructure`, ...); workers send back `UpdateStructure` (**74369**) applied by `L.V6`. Bulk resync on load: **129923–129927**.
- Energy/machines: `sandkit.mods.energy`, priorities **39312**; conveyor belts via `RunConveyorBelts`.

## 7. RNG / determinism

- `Math.seedrandom` in the bundle (**63329**). **Worldgen is fully deterministic from the seed**: `D = e.seed ?? "sandustry"` (**69061**), domain seeds `new Math.seedrandom(D + "<domain>")` (**67538–71207**). Seed in `store.meta.seed`.
- **Runtime is NON-DETERMINISTIC**: bare `Math.random()` everywhere (particles **74390**, helpers **47155–47159**) + multi-threaded chunk scheduling → **lockstep is out; design host-authoritative + delta replication**.

## 8. Mod hooks

- **Fluxloader**: `window.electron.isFluxloaderActiveSync()` (**74196**); workers loaded from patchable text (**74203–74214**).
- **Sandkit (built-in modding API!)**: `e.sandkit`: `mods.{elements,items,structures,projectiles,energy,matters,misc,triggers,graphics}`, `events`, `keyBindings`.
- Event bus: `on/off` **22441–22448**, `emit` **22453–22460** (truthy ⇒ cancels default). Events: `frame:update`, `player:moved`, `store:save`, `input:*`.
- API `FH`/`qe` (~39440–41500): `action`, `world` (39836), `items` (40334), `structures.register/getAtCell/...` (40443–40482), `ui` (40946), `input.registerKeyBinding/...` (41277–41322), **`player.getPosition/setPosition/setVelocity/... /inventory.add` (41323–41382)**, `camera.snapToPlayer` (41383). Mod SAB via `RegisterModSharedBuffer` (58), worker hooks via opcodes 31/32, mod triggers in the scheduler (**64280**).

## Conclusions for multiplayer

Best seams:
- (a) intercepting the `input:*` events (74918–74936) to route remote input;
- (b) replicating `store.player` + `shared.playerPos` per peer — the SAB is single-slot, remote avatars require a parallel array;
- (c) mirroring the opcode stream in `post/postAll` (74529–74534) — **every world mutation is already a serializable `[opcode, args]` array = a natural network command channel**;
- (d) join snapshot = the shape of the load payload (10506–10519);
- (e) driving from a mod trigger or `frame:update`.
