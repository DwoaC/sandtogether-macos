# Initial reconnaissance — Sandustry moddability

*Translated from the original Polish notes.*

(2026-08-16)

## The game
- **Sandustry** Early Access since 2026-08-13, version **0.5.3**, Steam AppID **2764460**
- Installation: `F:\SteamLibrary\steamapps\common\Sandustry`
- Engine: **Electron + JavaScript** (webpack bundle), dev repo: github.com/lantto/sand

## Architecture (established)
- `resources\app.asar` (131 MB) — all code + assets; unpacked into the scratchpad, prettified in `scratchpad\sandustry\pretty\`
- Main process: `main.js` (59 KB, readable, NOT minified) — window, save/load (IPC `save-serialized`, `load`), Fluxloader integration
- Renderer: `dist/js/bundle.js` (4.5 MB minified) — game logic, UI, render loop
- **`dist/js/simulation-worker.js`** (1.2 MB) — sand simulation in a Web Worker
- `dist/js/utility-worker.js` (1.1 MB), `manager-worker.js` (46 KB)
- **SharedArrayBuffer** — the world is shared between threads (key for co-op: direct access to the state)
- `seedrandom.min.js` + procgen — the map is generated from a seed (procgen determinism)
- Preload with contextBridge — the renderer is sandboxed, Node is available only in the main process

## Steamworks
- The game bundles **steamworks.js 0.3.1** (native Steamworks bindings) — available from the main process
- Provides: lobby/matchmaking, P2P networking (Steam Datagram Relay), achievements, Workshop
- => ultimately, co-op via a Steam lobby without our own server

## Modding
- **Fluxloader** = mod loader; the game has NATIVE integration in main.js (looks for a Workshop item with modID `fluxloader`, hook `is-fluxloader-active-sync`)
- Repo: github.com/fluxloader-team/fluxloader (+ MODDING.md)
- Mod API: 3 contexts — `entry.electron.js` (main process, full Node!), `entry.game.js` (renderer), `entry.worker.js` (simulation workers)
- Patching the game code: `addPatch(file, {type, from, to, token})` — regex/replace on bundle.js and the workers
- Events: `fl:game-started`, `fl:scene-loaded`, `fl:worker-initialized`
- IPC: `sendGameEvent()`, `invokeElectronIPC()`, `sendWorkerMessage()`/`listenWorkerMessage()`
- Mods are installed in `%APPDATA%\...\fluxloader-mods\`
- NOTE: it is possible that Workshop/Fluxloader requires the "Mods" beta branch in Steam (to be verified — the FAQ may be outdated)
- **Nobody has made a multiplayer mod yet** — we will be the first

## Co-op architecture — preliminary decision
Variant 1 (CHOSEN to start with): **host-authoritative**
- The host runs the entire simulation; the client sends input (movement, digging, building)
- The host streams world diffs (chunks from the SAB) + player positions
- Transport v1: WebSocket over LAN/tailscale; v2: Steam P2P via steamworks.js
Variant 2 (rejected for now): deterministic lockstep — requires full simulation determinism, a lot of fiddly work

## TODO
- [ ] Agent reports: map of bundle.js (player state, input, save) and simulation-worker (loop, SAB layout, determinism)
- [ ] Fluxloader installation (Workshop / Mods branch?)
- [ ] Hello-world mod (event logging)
- [ ] PoC: second player visible in the host's world
