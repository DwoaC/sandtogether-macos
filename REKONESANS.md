# Sandustry Coop Mod — Rekonesans (2026-08-16)

## Gra
- **Sandustry** Early Access od 13.08.2026, wersja **0.5.3**, Steam AppID **2764460**
- Instalacja: `F:\SteamLibrary\steamapps\common\Sandustry`
- Silnik: **Electron + JavaScript** (webpack bundle), repo dev: github.com/lantto/sand

## Architektura (ustalone)
- `resources\app.asar` (131 MB) — cały kod + assety; rozpakowany do scratchpada, prettified w `scratchpad\sandustry\pretty\`
- Proces główny: `main.js` (59 KB, czytelny, NIE zminifikowany) — okno, save/load (IPC `save-serialized`, `load`), integracja Fluxloader
- Renderer: `dist/js/bundle.js` (4.5 MB min.) — logika gry, UI, pętla render
- **`dist/js/simulation-worker.js`** (1.2 MB) — symulacja piasku w Web Workerze
- `dist/js/utility-worker.js` (1.1 MB), `manager-worker.js` (46 KB)
- **SharedArrayBuffer** — świat współdzielony między wątkami (kluczowe dla coop: bezpośredni dostęp do stanu)
- `seedrandom.min.js` + procgen — mapa generowana z seeda (determinizm procgen)
- Preload z contextBridge — renderer sandboxowany, Node dostępny tylko w main procesie

## Steamworks
- Gra bunduje **steamworks.js 0.3.1** (natywne bindingi Steamworks) — dostępne z main procesu
- Daje: lobby/matchmaking, P2P networking (Steam Datagram Relay), achievementy, Workshop
- => docelowo coop przez Steam lobby bez własnego serwera

## Modding
- **Fluxloader** = mod loader, gra ma NATYWNĄ integrację w main.js (szuka w Workshop item z modID `fluxloader`, hook `is-fluxloader-active-sync`)
- Repo: github.com/fluxloader-team/fluxloader (+ MODDING.md)
- API moda: 3 konteksty — `entry.electron.js` (main proces, pełny Node!), `entry.game.js` (renderer), `entry.worker.js` (workery symulacji)
- Patchowanie kodu gry: `addPatch(file, {type, from, to, token})` — regex/replace na bundle.js i workerach
- Eventy: `fl:game-started`, `fl:scene-loaded`, `fl:worker-initialized`
- IPC: `sendGameEvent()`, `invokeElectronIPC()`, `sendWorkerMessage()`/`listenWorkerMessage()`
- Mody instalowane w `%APPDATA%\...\fluxloader-mods\`
- UWAGA: możliwe że Workshop/Fluxloader wymaga brancha beta "Mods" w Steam (do zweryfikowania — FAQ może być nieaktualne)
- **Nikt jeszcze nie zrobił moda multiplayer** — będziemy pierwsi

## Architektura coop — decyzja wstępna
Wariant 1 (WYBRANY na start): **host-autorytatywny**
- Host liczy całą symulację; klient wysyła input (ruch, kopanie, budowanie)
- Host streamuje diffy świata (chunki z SAB) + pozycje graczy
- Transport v1: WebSocket po LAN/tailscale; v2: Steam P2P przez steamworks.js
Wariant 2 (odrzucony na start): lockstep deterministyczny — wymaga pełnego determinizmu symulacji, dłubanina

## TODO
- [ ] Raporty agentów: mapa bundle.js (stan gracza, input, save) i simulation-worker (pętla, layout SAB, determinizm)
- [ ] Instalacja Fluxloadera (Workshop / branch Mods?)
- [ ] Hello-world mod (logowanie eventów)
- [ ] PoC: drugi gracz widoczny w świecie hosta
