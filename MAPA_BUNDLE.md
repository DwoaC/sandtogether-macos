# Mapa architektury — bundle.js (wątek główny gry)

Źródło: raport agenta z 2026-08-16. Wszystkie linie odnoszą się do `scratchpad\sandustry\pretty\bundle.pretty.js`.

## 1. Stan gry

Korzeń stanu `e` ma 4 gałęzie: **`e.store`** (serializowalny, autorytatywny świat), **`e.session`** (runtime/UI/input, niezapisywane), **`e.shared`** (widoki SharedArrayBuffer, między wątkami), **`e.environment`** (workery) + **`e.sandkit`** (mody).

- Konstrukcja store: **73812–73940**. Pola: `version`, `player`, `productionPoints`, `resources{gold,fluxite,artifacts,energy}`, `creatures`, `conservatory`, `achievements`, `integrity{cheatsUsed,modsUsed}`, `world`, `projectiles[]`, `structures[]`, `drones[]`, `pipes[]`, `pumpsCache[]`, `worldItems[]`, `queue[]`, `gloom.emitterPositions[]`, `machineryEngine.runLaunchers`, `meta{worldId,worldName,tick,seed,nextId{...},elementCapacity,time}`.
- **Gracz: 73816–73888.** Płaski obiekt: `x, y, width, height, velocity{x,y}, threshold{x,y}, onGround, speedCapOverdrive{x,y}, inventory[], buildings[], tech{}, action, hotbar{...}, grapplingHook, cooldowns{}, isHovering, weaponsMeta`. **Gracz NIE ma pola health** — health/maxHealth (20/20) mają drony/stworki (27270, 28470, 28241).
- Spawn gracza: **73804–73810**; worldId to `Math.random().toString(36)` (**73811**).
- **Fizyka gracza: ~47040–47135.** Sub-stepped swept AABB vs teren; zapisuje `e.shared.playerPos[0/1]` (**47129**), emituje `player:moved`; grawitacja **47135**. Ground check `de()` **47143–47151**.
- Kamera: `e.session.camera.x/y` z centrum gracza, **21499–21550**; `session.overrideCamera` do cinematików (**21970**).
- Teleporty/respawn też piszą do SAB: **26452, 41497, 87765, 115782**.

## 2. Pętla główna

- **`Yt(e,t)` = driver rAF, 64307–64321.** FrameCap, pauza (**64316**), `dt` clamp 50 ms (**64318**), `store.meta.time += dt`, await `Kt(e,dt)`, potem minimapa/audio/FPS, kolejny rAF.
- **`Kt(e,t)` = update per frame, 64264–64304.** Kolejność: sync sim `re.lX(e.shared.sim)` → scheduler triggerów (tabela `Dt`, w tym **triggery modów `e.sandkit.mods.triggers`, 64280–64286**) → queue → ~15 subsystemów (struktury, maszyny, pociski, drony, gracz `D.LX`, światło) → uniformy shaderów (**64288–64299**) → `emit("frame:update",{state,dt})` (**64300**) → `store.meta.tick++` (**64303**).
- Przykłady triggerów: `EmitGloom` co 500 ms (**64237**), `PingPumpChunksFIX` co 10 s (**64244–64253**).

## 3. Protokół workerów

- **Fabryka workerów `nr(e)`: 74194–74215.** Typy: `manager-worker`, `utility-worker`, `simulation-worker` (N sztuk). Pod Fluxloaderem worker jest ładowany **synchronicznym XHR** z `js/<name>-worker.js` i bootowany z Blob URL (**74203–74214**) — to jest seam do injectowania kodu do workerów.
- Tworzenie wątków + mesh MessageChannel między wątkami sim: **74170–74192** (`meta{startingIndex,threadCount,ports[],managerPort}`).
- **Enum opcodes (`O.dD`), linia 25707.** Wiadomość = tablica `[opcode, ...args]`, opcody 1–81. Najważniejsze: `Init=1, RunUpdate=2, SetCell=3, Blast=4, Dig=5, Vacuum=6, AddStructure=7, AddStructures=8, RemoveStructuresBetween=9, HandleGrabber=10, SwapElement=11, SetChunkActive=12, Ignite=14, IncrementFluxite=21, PingChunk=25, QueueSetCell=26, SetUpgradeLevel=27, BuildCheck=28, RegisterModElements=29, RegisterModTerrains=30, RegisterWorkerEventHandler=31, RegisterWorkerHook=32, InitFinished=36, UpdateFinished=37, SetPixel=38, Collector=39, PlaySound=41, AddLight=42, MoveCamera=43, SpawnWorldItem=44, SandkitEvent=46, ShowToast=49, RunConveyorBelts=51, UpdateStructure=52, PostUpdate=53, SetPaused=54, Save=55, StartManagerLoop=57, RegisterModSharedBuffer=58, SaveComplete=60, ReallocSimState=65, UpdateStructures=66, RunTick=67, SetSimulationSpeed=68, UtilityInit=69, UtilitySave=70, ElementSlabsExhausted=64, TerrainDestroyedBatch=81`.
- Transport: `post(state,threadIdx,msg)`, `postAll`, `postAllAwait` (**74529–74552**; `RunUpdate`/`RunTick` dostają UUID korelacyjny na indeksie 1, **74537–74545**), `postToEachThreadColumnSequentiallyAwait` (**74553–74564**).
- Handlery: utility onmessage **74290–74333**; manager **74334–74350**; per-sim-thread wielki switch **74352–74490**.
- Init workerów dostaje **cienkie projekcje** store'a: `getWorkerStore` **74565–74594**, `getWorkerSession` **74595–74603**.
- **SAB-y główne:** alokacja + widoki **129700–129909**. Zawartość: `mapData/wallData/authorization/shadowMap` = `Uint8Array(width*height)` (pełne gridy świata!); `playerPos/listenerPos` Float32; `gold/goldChange/energy/energyChange/productionPoints` Uint32; `mouse.worldPosition` Uint16; `actionState` Uint8; `reservoir`, `waterPresenceZones`, `workQueue` (kolejki tasków chunków **129770–129792**), `schedulingMode`, `hybridScheduling`, perf.
- SAB symulacji elementów: `Xs.xr(width,height,chunkSize,elementCapacity)` **129910–129914**; layout SoA przy realloc **74226–74274** — `cellIds`, `terrainType`, `damagedGround{type,hp}`, `elementData.{type,x,y,velocityX,velocityY,...,dataField1-4}`. Wzrost: `ElementSlabsExhausted` → pauza → `or()` +1e6 → broadcast `ReallocSimState`.
- SAB-y gridu bloków/struktur: **25904–25923** (`blockTypeSab, blockAccessSab, blockDataSab, filterPaletteSab, structureVersionSab, conveyorVersionSab`). SAB-y managera: **74506–74521** (`mutationSync` Int32 do Atomics).

## 4. Input

- Wszystkie listenery w `Br(e)`: **74815–74960**. Mysz **74851–74890**, wheel **74891–74915**, `keydown` **74918–74929**, `keyup` **74930–74936**.
- Stan: `session.input.keys[nazwa]` — enum 4-stanowy `O.$T` (Up/Down/Pressed/Released), edge-triggered per frame. `session.input.mouse{position,worldPosition,cellPosition,clicked,pressed,released,available}`, `session.input.action.move`, `session.input.action.boost`, `session.input.mode`.
- Bindowanie przez `session.settings.keyBindings`; przyciski myszy w tej samej tabeli jako `MouseLeft/...`, wheel jako `WheelUp/WheelDown`.
- **Każdy handler najpierw emituje `input:keydown`/`input:keyup`/`input:scroll`/... i PRZERYWA domyślną obsługę jeśli listener zwróci truthy (74921–74936)** — czysty punkt przechwycenia dla netcode.
- Blur czyści klawisze: `Er(e)` **74810–74814**.

## 5. Save/Load

- Save `B(e)` **10476–10491**: `session.saving.status="saving"`, emit `"store:save"`, pobiera paletę ścian, potem `manager.postMessage([Save, {...e.store}, palette, id, type])` — **cały store leci structured clone do manager workera**, który serializuje go razem z gridami SAB.
- Zakończenie: `SaveComplete` **74291–74333** → `window.electron.saveSerialized(...)` (**10434**) lub IndexedDB (**10405–10474**); metadane **10445–10465**.
- Load `S(e)` **10492–10560**: payload `{store, wall{tiles{data,sections,width,height},palette}, matrix, shadow, authorization}` — dekompresja sekcji **10512–10518**. **To jest kompletna lista autorytatywnego stanu = snapshot dla joinującego klienta.**

## 6. Encje/budynki

- Budynki: `store.structures[]` (obiekty `{type,x,y,data}`) + cache przestrzenny `session.cache.structures` (**64232**) + block-grid SAB do lookupów cell→struktura. Też `store.pipes`, `pumpsCache`, `drones`, `projectiles`, `worldItems`, liczniki `store.meta.nextId.*` (**73936–73939**).
- Mutacje idą do workerów jako opcody (`AddStructure`, `UpdateStructure`, ...); workery odsyłają `UpdateStructure` (**74369**) aplikowane przez `L.V6`. Bulk resync przy load: **129923–129927**.
- Energia/maszyny: `sandkit.mods.energy`, priorytety **39312**; taśmy przez `RunConveyorBelts`.

## 7. RNG / determinizm

- `Math.seedrandom` w bundlu (**63329**). **Worldgen w pełni deterministyczny z seeda**: `D = e.seed ?? "sandustry"` (**69061**), domenowe seedy `new Math.seedrandom(D + "<domena>")` (**67538–71207**). Seed w `store.meta.seed`.
- **Runtime NIEDETERMINISTYCZNY**: gołe `Math.random()` wszędzie (particles **74390**, helpery **47155–47159**) + wielowątkowy scheduling chunków → **lockstep odpada; projektować host-autorytatywny + replikacja delty**.

## 8. Hooki modów

- **Fluxloader**: `window.electron.isFluxloaderActiveSync()` (**74196**); workery ładowane z patchowalnego tekstu (**74203–74214**).
- **Sandkit (wbudowane API modów!)**: `e.sandkit`: `mods.{elements,items,structures,projectiles,energy,matters,misc,triggers,graphics}`, `events`, `keyBindings`.
- Event bus: `on/off` **22441–22448**, `emit` **22453–22460** (truthy ⇒ anuluje default). Eventy: `frame:update`, `player:moved`, `store:save`, `input:*`.
- API `FH`/`qe` (~39440–41500): `action`, `world` (39836), `items` (40334), `structures.register/getAtCell/...` (40443–40482), `ui` (40946), `input.registerKeyBinding/...` (41277–41322), **`player.getPosition/setPosition/setVelocity/... /inventory.add` (41323–41382)**, `camera.snapToPlayer` (41383). Mod SAB przez `RegisterModSharedBuffer` (58), worker hooki przez opcody 31/32, triggery modów w schedulerze (**64280**).

## Wnioski dla multiplayer

Najlepsze seamy:
- (a) przechwycenie eventów `input:*` (74918–74936) do routowania zdalnego inputu;
- (b) replikacja `store.player` + `shared.playerPos` per peer — SAB jest jednoslotowy, zdalne awatary wymagają równoległej tablicy;
- (c) mirror strumienia opcodów w `post/postAll` (74529–74534) — **każda mutacja świata to już serializowalna tablica `[opcode, args]` = naturalny kanał komend sieciowych**;
- (d) snapshot joinu = kształt payloadu load (10506–10519);
- (e) sterowanie z triggera moda albo `frame:update`.
