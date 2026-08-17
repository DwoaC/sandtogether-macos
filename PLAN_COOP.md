# PLAN: Sandustry Coop Mod ("SandTogether" — nazwa robocza)

Data: 2026-08-16. Bazuje na: REKONESANS.md, MAPA_BUNDLE.md, MAPA_WORKERY.md.

## Decyzja architektoniczna (PODJĘTA)

**Host-autorytatywny coop 2+ graczy.** Lockstep odpada definitywnie: 83 × `Math.random()` w ścieżce fizyki, losowy shuffle sąsiadów, niedeterministyczna kolejność claimowania chunków (work stealing na Atomics), liczba workerów zależna od CPU.

- **Host**: liczy pełną symulację (bez zmian). Autorytet nad światem, zasobami, strukturami.
- **Klient**: własna symulacja **ZAPAUZOWANA** (`SetPaused` / speed 0). Świat aktualizowany diffami chunków od hosta wpisywanymi prosto do SAB. Własny ruch gracza liczony LOKALNIE (predykcja — fizyka gracza jest na main thread, self-contained, `bundle:~47040`) na w miarę świeżym terenie.
- **Transport v1**: WebSocket (host otwiera serwer w procesie Electron — pełny Node). LAN / Tailscale / VPS relay.
- **Transport v2**: Steam P2P + lobby przez steamworks.js (już zbundlowane w grze, 0.3.1).

## Kanały synchronizacji

1. **Pozycje graczy** (60 Hz, malutkie): hook na event `player:moved` + `shared.playerPos`. Zdalni gracze = duszki rysowane przez API Sandkit (`player.getPosition` istnieje dla lokalnego; zdalnych rysujemy sami w warstwie Pixi / przez `frame:update`).
2. **Akcje graczy → host** (event-driven): klient NIE wykonuje akcji lokalnie, tylko wysyła do hosta. Punkty przechwycenia:
   - eventy `input:*` (bundle 74918-74936 — listener zwracający truthy anuluje domyślną obsługę!)
   - kolejka mutationSync (`bundle:52636-52719`, exporty `Lu/f6/dt`) — choke point wszystkich zapisów do świata
   - wiadomości opcodowe (Dig=5, Blast=4, AddStructure=7, ...) — mirror w `post/postAll` (`bundle:74529-74534`); każda mutacja to już serializowalna tablica `[opcode, args]`
3. **Świat → klienci** (10–20 Hz): host zbiera dirty chunki (`chunkShouldUpdate`, chunk=40x40), serializuje `cellIds`+`elementData` dla komórek chunka (albo prościej v1: rekonstrukcja typów do postaci "materiał na komórkę"), kompresja (RLE + deflate — piasek świetnie się kompresuje), wysyłka. Interest management: najpierw chunki w viewportach graczy, reszta wolniej.
4. **Store delta** (1–5 Hz): resources, structures[], drones[], worldItems[], productionPoints — JSON diff przeciw poprzedniemu snapshotowi.
5. **Join snapshot**: gotowy serializator = ścieżka Save → `UtilitySave` (utility:39229-39320) produkuje `{store, wall, matrix, shadow, authorization}`; klient ładuje jak save (`S(e)` bundle:10492-10560). Zero własnej roboty serializacyjnej!

## Struktura moda (Fluxloader)

```
sandtogether/
  modinfo.json          # modID, entrypoints, configSchema (port, nick, host/join)
  entry.electron.js     # main proces: WebSocket server/client, Steam P2P (v2), relay IPC
  entry.game.js         # renderer: hooki input/player:moved/frame:update, rendering duszków,
                        #   aplikacja diffów do SAB przez mutationSync, UI (menu Host/Join)
  entry.worker.js       # (opcjonalnie) hooki w managerze: tap na pętlę be() jako network tick,
                        #   zbieranie dirty chunków po stronie hosta
```

Uwaga: `RegisterManagerTrigger` robi `new Function(...)` w manager workerze (`manager:1083`) — legalny punkt injekcji kodu do pętli 60 Hz bez patchowania pliku workera.

## Milestony

- **M0 — Fundament** (pół dnia): Fluxloader zainstalowany i działa na EA (uwaga na branch "Mods" w Steam Beta). Mod hello-world: loguje `fl:game-started`, `fl:scene-loaded`, eventy input. Weryfikacja że patche i 3 konteksty działają.
- **M1 — Rura sieciowa** (1 dzień): entry.electron.js otwiera WS server (host) / łączy się (klient). Handshake, nicki, ping. UI w grze: przycisk Host / Join+IP (na start może być config w modinfo albo klawisz).
- **M2 — Duszki** (1-2 dni): pozycje graczy 60 Hz w obie strony, zdalny gracz renderowany w świecie hosta i klienta. **Pierwszy "wow moment": widzimy się nawzajem.** (Świat jeszcze niezsynchronizowany — obaj grają na tej samej mapie z tego samego save'a.)
- **M3 — Wspólny świat** (3-5 dni, najtrudniejsze): klient pauzuje sim; join snapshot przez ścieżkę save; akcje klienta → host (przechwycenie input/mutationSync); host → dirty chunki + store delta. Tu wyjdą wszystkie smaczki (realloc elementData, spójność blockGrid, struktury).
- **M4 — Grywalność** (2-3 dni): interest management (viewport), kompresja, płynność (interpolacja duszków), obsługa disconnect/reconnect, HUD coop (kto online, pingi).
- **M5 — Steam** (2-3 dni): lobby + P2P przez steamworks.js z procesu gry, "Join friend" z listy znajomych, publikacja na Workshop.

## Ryzyka / niewiadome

- Czy pauza sim na kliencie zamraża też rendering particles/animacji (może wymagać rozdzielenia pauzy wizualnej od sim).
- Rozmiar diffów chunków przy dużych kataklizmach (lawa/powódź) — może wymagać priorytetyzacji + degradacji do klatek kluczowych.
- Wersjonowanie: mod musi pilnować zgodności wersji gry (0.5.3) — patche na zminifikowane identyfikatory się kruszą przy update'ach gry.
- Achievementy/integrity: `store.integrity.modsUsed` — gra oznacza save jako modowany; nie ruszamy, uczciwie.
- EA dopiero co wyszło — devi mogą sami zapowiedzieć MP; sprawdzić roadmapę zanim wejdziemy głęboko w M3+.

## Stan na teraz

- [x] Rekonesans kodu gry (mapy w MAPA_BUNDLE.md, MAPA_WORKERY.md)
- [x] Decyzja architektury: host-autorytatywny
- [ ] M0: instalacja Fluxloadera (CZEKA NA USERA: subskrypcja w Workshop / branch Mods)
- [ ] M0: hello-world mod
