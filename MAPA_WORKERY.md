# Mapa architektury — workery symulacji

Źródło: raport agenta z 2026-08-16. Pliki: `scratchpad\sandustry\pretty\{simulation,manager,utility}-worker.pretty.js`.

## 1. Pętla symulacji — w MANAGER-workerze, nie w simulation-workerze!

- `manager-worker.pretty.js:1052-1064` — `StartManagerLoop`: driver rAF z akumulatorem.
- `:914` — `he = 1/60` — **fixed timestep 60 Hz**.
- `:1055-1060` — clamp delty do 0.25 s, mnożnik prędkości `fe` (`SetSimulationSpeed`, clamp [0,5], `:1077`), klasyczny fixed-step catch-up.
- Ciało ticku `be()` `:1135-1245`, fazy:
  1. **Drain mutacji** `:1142-1148` — handshake Atomics z main threadem (§3)
  2. **Triggery czasowe** `:1149-1161` — taśmy (166 ms), shakery (3333 ms), maszyny (683 ms), autosave, pompy, gloom
  3. Swap dirty map chunków `:1161`
  4. **Dispatch update'u komórek** — broadcast `RunUpdate`/`RunTick` do workerów sim + await
  5. Rebalans hot-kolumn `:1205-1227`
  6. `store.meta.tick++` `:1244`
- Ścieżka legacy = szachownica 2-fazowa (Even→Odd→PostUpdate); nowa = `RunTick`, workery same się schedulują przez atomową work queue.
- Strona workera: `simulation-worker.pretty.js:40634` (RunUpdate), `:40645` (RunTick), pętla claimowania chunków ze spin-waitami `:40692-40889`.

## 2. Pamięć świata

**Jeden wielki SAB, struct-of-arrays; identyczna funkcja layoutu w 3 kontekstach:** sim `:12429-12568`, manager `:354-491`, main `bundle:74236-74258`.

**Format komórki — Uint32Array `cellIds` (width*height), wartość = ID zakresowe** (`:12409-12422`):
- `0` = puste
- `1..1000` = nieuszkodzony teren (id typu)
- `1001..1_000_000` = handle uszkodzonego terenu → `damagedGround.type[]`(u8) + `.hp[]`(u16)
- `1_000_001..2_000_000` = handle elementu → indeks w SoA `elementData`

`elementData` (`:12540-12566`): type(u8), x,y(u16), velocityX/Y, minVelocityX/Y, thresholdX/Y, density, durationMax/Left, dataField4 (f32); hasBeenUpdated, isFreeFalling, variantIndex, skipPhysics, hasDuration (u8); movesYAxis(+Count), dataField1/3 (u16); lastSideChecked, dataField2 (i16); linkedElementIndex (u32). **Brak temperatury** — termika = przejścia typów (Ice/Steam/Lava...).

Pojemność elementów 1e6, rośnie przez `ReallocSimState`; slab allocator.

**Chunki: 40x40 komórek** (`chunkSize=40`, `bundle:58529`), `cellSize=4` px. Dwie mapy dirty u8: `chunkShouldUpdate` / `chunkShouldUpdateNext` (`:12533-12534`). Helpery w managerze `:651-694`.

**Pozostałe SAB-y** (lista w `Init` sim workera `:40514-40570`): mapData, wallData, authorization, mouseWorldPos, actionState, reservoir, playerPos, listenerPos, gold(+Change), energy(+Change), productionPoints, conveyorBeltsAnimationIndex, shadowMap, waterPresence, workerPerformance + blockGrid (blockType/blockAccess/blockData/filterPalette/structureVersion/conveyorVersion `:40628-40631`).

Wymiary świata data-driven z mapy (`store.world.size`), nie stała.

## 3. Protokół wiadomości

- Pełny enum 81 id w plaintext: `manager-worker.pretty.js:265`. Format: `[msgId, ...args]`.
- Sim onmessage `:40510`; przypadki m.in. Init 40513, RunUpdate 40634, RunTick 40645, Blast 40903, Dig 40906, UpdateStructure(s) 40909/40912, RunConveyorBelts 40917, ComputeShadow* ~41027, RegisterMod* / RegisterWorkerEventHandler / RegisterWorkerHook, ReallocSimState ~41180.
- Sim → main: InitFinished, PlaySound, AddLightBatch, SandkitCreateParticlesBatch, SandkitEventBatch, FlameBurnBatch (26547), TerrainDestroyedBatch (26767), ShowToast, UpdateStructure... (batching `:26771`).
- Sim → manager: UpdateFinished, PostUpdate, RunConveyorBelts.

**KLUCZOWE: jak main thread wstrzykuje kopanie/budowanie.** NIE ma handlera SetCell w sim workerze. Zamiast tego:
- Main bundle zawiera CAŁĄ bibliotekę sim i **pisze bezpośrednio do SAB** przez `FH.elements.createAt/replaceAt/removeAt`, `FH.terrains.removeAt` (`bundle:12466, 13009, 37298`).
- Zapisy są **kolejkowane i aplikowane tylko gdy sim stoi**, przez moduł mutation-sync `bundle:52636-52719` (exporty `Lu` (queue mutacji), `f6`, `dt`, `a6`, `cV`, `lh`, `ZG`, `cT` (init)).
- Protokół na `Int32Array mutationSync[0]`: main `0→1` (praca czeka, `:52712`) + `Atomics.waitAsync`; manager `:1143-1148` widzi 1 → store 2 → notify → wait ≤100 ms; main `compareExchange(2→3)` → drain kolejek (`:52698-52704`) → store 0 + notify. SAB: `bundle:74514-74518`.
- Część akcji idzie jednak wiadomościami: Dig, Blast, Vacuum, HandleGrabber, SwapElement, AddStructure(s), QueueSetCell, SetPixel, SetChunkActive, Ignite, SpawnWorldItem — routing do wątku-właściciela przez `getThreadIndexFromCellX` (`bundle:13197`).

## 4. Manager worker = zegar + barrier scheduler

- Właściciel pętli 60 Hz i `store.meta.tick`; tabela triggerów `:713-748`.
- Fan-out do workerów sim przez MessagePorty; `ve` `:1247-1256` (sekwencyjne id żeby ticki się nie krzyżowały), `Te` (sweep po kolumnach dla taśm), `Fe` (bariera done===threads).
- Work-queue SAB `:1005-1048`; adaptive scheduling (hot-kolumny, EMA `:1205-1227`).
- Obsługuje: SetPaused, SetSimulationSpeed, **RegisterManagerTrigger (`new Function(...)` na data[2], `:1083` — punkt injekcji kodu do managera dla modów!)**, RegisterModSharedBuffer `:1110`, ReallocSimState `:1128`, Save `:1125` → snapshot SAB → `UtilitySave` do utility workera (`Me` `:1274-1306`).

## 5. Utility worker = serializacja save'ów

Realny entry point tylko `:39220-39326` (reszta 39k linii = martwy kod webpack shared). Obsługuje UtilityInit + **UtilitySave `:39229-39320`**: surowe cellIds/elementData/damagedGround/wallData/shadowMap/authorization → JSON save (`store`, `wall`, `matrix`, `shadow`, `authorization` + RLE sections) + metadane → SaveComplete. **Gotowy serializator pełnego stanu = snapshot do joinu.**

## 6. Determinizm — NIE MA

- 83 wywołania `Math.random()` w simulation-workerze, w tym w ścieżce fizyki: `:30791-30794` (jitter free-fall, losowe odbicia), `:2369`, `:30411/:30749` (losowy znak), `:9017/:29268` (losowy shuffle sąsiadów!), `:40245` (roll złota w shakerze).
- Brak seedowanego PRNG w ścieżce ticku; seed tylko w metadanych save i uniformie szumu Pixi.
- Jedyna współdzielona losowość: per-tick int rzucany przez managera i broadcastowany w RunTick args (`manager:1162, :1179`) — gotowy hook „tick seed", ale to za mało.
- Nawet z seedem: kolejność claimowania chunków = `Atomics.add` na współdzielonym liczniku → niedeterministyczna; liczba workerów zależy od `hardwareConcurrency` (clamp(HC-2, 2, 18), `bundle:74170-74173`).

**=> Lockstep odpada definitywnie. Host-autorytatywny streaming stanu.**

## 7. Wielowątkowość

N workerów sim pisze równolegle do jednego SAB, koordynacja atomikami (work stealing `Atomics.add`, spin-waity na flagach sąsiadów `:40752-40786`, publikacja `Atomics.store(chunkDone,...)`). Main ↔ workery tylko przez bramkę mutationSync + Atomics.waitAsync.

## Seamy pod multiplayer (wnioski)

- (a) **pętla 60 Hz `be()` w managerze** = naturalny network tick
- (b) **kolejka mutationSync** (`bundle:52636-52719`) = pojedynczy choke point wszystkich edycji świata od gracza — przechwycić `Lu`/`f6`/`dt`, przechwytywać i odtwarzać zdalne akcje atomowo między tickami
- (c) **ścieżka UtilitySave** = gotowy serializator pełnego stanu do join/resync
- (d) delty można scope'ować istniejącą dirty-mapą `chunkShouldUpdate`
