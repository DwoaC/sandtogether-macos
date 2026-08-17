# Dziennik zmian — Sandustry Coop (SandTogether)

## 2026-08-17 wieczór (v0.9.7-beta) — LIVE DEBUG sesji usera ("nic nie działa, ziomek obserwatorem")

Diagnoza z żywych logów hosta (%APPDATA%\Sandustry\logs\main.log) + logi klienta/hosta innych graczy (Downloads/drive-download-20260817T185810Z):

1. **Gra zaktualizowała się DZIŚ** (app.asar.bak 18:53, re-extract 19:30; package.json WCIĄŻ "0.5.2" — devi nie bumpują!). Nowy build przemianował API: z top-level FH zniknęło `structures` (i launchers/misc/grid), doszły `reactions/excavation/processing/signals`. Mod wołał `FH.structures.build/removeAt/getAtCell/update` → undefined → **klient nie mógł budować**. FIX: `structNs()` — dynamiczny resolver (szuka ns z build+removeAt+getAtCell top-level i 1 poziom głębiej, cache w ST._structNs). Eventy structures:placed/removed/moved + grabber:elementPickedUp/Placed ISTNIEJĄ w nowym buildzie (zweryfikowane grep), enum Fire=11/FreezingIce=12 bez zmian.
2. **Stream nie nadążał**: kolejka chunków 3962→8631 i nie spadała (log SYNC-HOST), 400 chunk/s cap, sort po odległości GŁODZIŁ dalekie chunki w nieskończoność → klient widział świat sprzed 20+ s → 348× "grabPlace KONFLIKT", budowanie/narzędzia w "przeszłość". FIX: dwa pasma — fast lane = WSZYSTKIE brudne chunki w promieniu 24 chunków od każdego gracza (cap 120/batch), slow lane = 20-40 najstarszych FIFO (Set = insertion order, zero głodzenia) + **hash-skip** (FNV-1a per chunk; identyczna zawartość → nie wysyłaj; hashes.clear() w enqueueFullWorld żeby resync/nowy gracz dostał wszystko!).
3. **G1 potwierdzony na żywo** (log innych graczy: "Symulacja klienta: wznowiona"): ESC-menu gry śle SetPaused(false) → cicha podwójna symulacja. FIX: heartbeat re-pauzy [54,true] co 2 s w _frame klienta (idempotentne).
4. **G8**: peer-disconnected już NIE odpauzowuje klienta (ciche rozwidlenie świata) — świat zostaje zamrożony, solo = przycisk Stop.

node --check OK, opublikowane (public). OBAJ gracze muszą: install.bat + restart. VER 0.9.7-beta.

## 2026-08-17 (v0.9.6-beta) — poprawki z pełnego review kodu 0.9.3–0.9.5

Agent-recenzent zweryfikował zmiany 0.9.3–0.9.5 (raport w historii). Grabber-fix 0.9.4 potwierdzony poprawny (wyrównanie Uint32 OK: sim = Uint32Array(buffer,0,W*H); zerowanie tylko cellIds CELOWO słuszne — grabber decyduje wyłącznie po cellIds, mapData=render=lustro hosta). Naprawione znaleziska:

- **B1 (BUG)**: po połączeniu Join LAN pole IP trzymało fokus klawiatury → gra ignorowała WASD (globalny keydown gry pomija INPUT-y) aż do kliknięcia w canvas. Fix: po udanym połączeniu `lanRow.hide()+blur()`; dodatkowo stopPropagation na keydown/keyup inputa (keyup w grze NIE filtruje INPUT-ów — R6).
- **R1**: `_fireQ/_cryoQ` czyszczone przy "joined"/"stopped" — stare współrzędne nie wyciekną do innego świata/sesji.
- **R2**: hooki `_fire/_cryo` wymagają teraz `ST.wsx.paused` (lustro aktywne) — klient połączony ale na WŁASNYM świecie ma broń normalnie lokalnie i nic nie forwarduje (współrzędne bez sensu w świecie hosta).
- **R4**: grace grabbera adaptacyjny: `grabGraceMs() = min(3000, max(1200, 3*ping+300))` — stały 600ms był krótszy niż runda przy pingu 300ms+ (Szwajcaria↔Polska!) i duplikaty wracały pod lagiem.
- **R5**: symetryczna ochrona PLACE: `_placedCells` + sentinel (cellId=1) w odłożonej komórce — pętla odkładania czyta lokalne cellIds i "pustą" (lag lustra) komórkę celowała ponownie kolejnym slotem → host createAt no-op na zajętej → element ginął. Host dodatkowo loguje konflikt grabPlace (komórka zajęta = element klienta utracony — rzadki rozjazd, refund TODO wymaga dostępu do matrixa tanku).
- **N1**: `_grabbedCells/_placedCells` czyszczone przy joined/stopped. **N4**: try/catch na sendach flusha (wyjątek wypadałby z _frame do emit gry).

ODŁOŻONE (udokumentowane): R3 — RJ_FIRE=11/RJ_FREEZINGICE=12 build-specific bez runtime-guardu (peer na innym buildzie gry z przetasowanym enumem tworzyłby zły element; realne dopiero przy rozjeździe wersji GRY między graczami — mod i tak wymaga tej samej wersji moda). N3 — fireB/cryoB to przybliżenia (domyślny czas palenia zamiast skalowanego dystansem; statyczny lód zamiast cząstek z prędkością) — akceptowalne.

node --check OK, opublikowane (3784750764, public). VER 0.9.6-beta.

## 2026-08-17 — AUDYT BRAKÓW do "100% playable" (raport agenta w historii)

GAME-BREAKING: **G1** ESC klienta cicho odpauzowuje sim (menu pauzy śle własne SetPaused(false), ST.wsx.paused zostaje true → nigdy nie re-pauzuje → podwójna symulacja na lustrze). **G2** upgrades/tech/augmenty w ogóle niesynchronizowane (zakup klienta = darmowy, fluxite wraca po 1s z res; host nie zna poziomów klienta). **G3** host w menu głównym zatruwa klienta (res/snap/ent NIE mają guardu worldId/scene — tylko wc ma; menu = mały świat → nadpisuje zasoby, KASUJE struktury klienta po 6s grace).
MAJOR: **G4** pauza hosta zamraża sync bez informacji (frame:update nie odpala). **G5** sygnały/automatyka, config maszyn (structure.data), copy-paste blueprintów klienta cofane — endgame host-only. **G6** fabuła/objectives/stratacores/boss/viability/discoveries/critters jednokierunkowe lub wcale (klient triggeruje → cofa się po 1s). **G7** brak per-klientowej persystencji (join = reset do save'a hosta) — trudne. **G8** disconnect = ciche rozwidlenie (klient odpauzowany gra dalej, traci wszystko przy rejoinie; brak auto-reconnect WS). **G9** drony klienta możliwe nadpisywane przez ent 10Hz (NIEZWERYFIKOWANE czy klient w ogóle deployuje bezpośrednio).
MINOR: G10 brak czatu; G11 relay tylko pos/hello (3+ graczy: myproj/snd nie relayowane); G12 dropy tylko ze snap 2.5s; G13 tutorial/hints/options rozjazd; G16 kruchość kotwic na update'y gry (największe ryzyko operacyjne).
POTWIERDZONE NIE-PROBLEMY: brak śmierci/health gracza w grze (store.player bez health, 0 trafień "respawn" w bundle).
PLAN RUND: 1) G1+G3 (małe, chronią przed korupcją) 2) G2 (ekonomia; DECYZJA USERA: upgrade'y wspólne vs per-gracz) 3) G6+G5 (pełna kampania) 4) G4+G8+czat.

## 2026-08-17 (v0.9.5-beta) — JOIN LAN: pole na IP (bug zgłoszony przez 星灵)

Bug: „Join LAN" używał `window.prompt(t("join_prompt"),...)` do wpisania adresu — a **Electron/Chromium NIE obsługuje `window.prompt()`** (renderer: no-op, dialog się nie pokazuje). Efekt: brak interfejsu do wpisania IP. (Join by Lobby ID był OK — używa schowka, nie prompt.)

Fix: wbudowane pole input w panelu (`#st-lan-row`/`#st-lan-addr`, placeholder „ip or ip:port", default 127.0.0.1:27777). Klik „Join LAN" pokazuje wiersz i fokusuje input; drugi klik / Enter / przycisk „Connect" łączy przez `net.joinWs(h,port)`. i18n `btn_connect` (EN „Connect"/PL „Połącz"). Bez zmian protokołu. node --check OK. Opublikowane (3784750764, public). VER 0.9.5-beta.

## 2026-08-17 (v0.9.4-beta) — GRABBER FIX (re-grabbing / duplikaty w tanku)

Root cause znaleziony: klient grabuje komórkę → tank napełnia się synchronicznie (dane narzędzia), ALE usunięcie komórki ze świata idzie przez odroczoną kolejkę Lu, która u zapauzowanego klienta NIE drenuje → komórka "zostaje" w cellIds → grabber bierze ją PONOWNIE co klatkę (tank pełny duplikatów) aż lustro hosta (~100ms) usunie komórkę. To było "grabber nie działa jak trzeba".

Fix (chirurgiczny, host-autorytatywny, split świat/tank):
- **`grabClearLocal(state,x,y)`**: na `grabber:elementPickedUp` klient zeruje cellId lokalnie OD RAZU (`new Uint32Array(sim.buffer,sim.byteOffset,W*H)[idx]=0`) → getCellId→0, isCellIdElement→false → grabber widzi pusto, nie bierze znów. Zapisuje idx→ts w `_grabbedCells`.
- **Ochrona przed przywróceniem przez lustro**: w `applyWorldBatch` po zastosowaniu chunków iteruję `_grabbedCells` (grace 600ms): jeśli host już pokazuje 0 → potwierdzone, usuń z listy; jeśli wciąż niezerowe (host nie przetworzył grabPick) → wyzeruj z powrotem. Samoczynnie kończy się gdy host potwierdzi.
- Split jest poprawny: **świat = host-autorytatywny** (host robi `FH.elements.removeAt`/`createAt` z forwardowanych grabPick/grabPlace), **tank = lokalne inventory klienta** (napełnia/opróżnia się natychmiast). Zero double-count (host NIE dotyka tanku klienta).
- Pozostaje mały lag wizualny (mapData dogania przez lustro ~100ms) — nieodłączny round-trip, ale grabowanie zachowuje się poprawnie (jeden cell = jeden wpis w tanku).

Bez zmian w patches.json/protokole (grabPick/grabPlace ten sam format). VER 0.9.4-beta. node --check OK. Opublikowane na Warsztat (3784750764, public). Oba konta muszą update.

## 2026-08-17 (v0.9.3-beta) — flamethrower + cryoblaster u klienta

Agent zmapował 3 narzędzia (raport w historii). Root cause: wszystkie piszą przez odroczoną kolejkę Lu, która przy pauzie klienta nie drenuje → no-op (flame/cryo) lub rozjazd (grabber pisze synchronicznie swój matrix).

Zrobione (bron):
- **Flamethrower**: patch `flamethrower fire hook (A)` — kotwica `s=0)=>{if(t<0||n<0||...` (1× w obecnym buildzie). `_fire(e,x,y)` na kliencie: kolejkuj komórkę + return true (skip). Host: `FH.fire.burnElementAt` + `FH.elements.createAt(RJ_FIRE=11)`.
- **Cryoblaster**: patch `cryoblaster freeze hook` — kotwica `x={x:Math.cos(b)*U...};(0,h.Lu)(e,i,l,...` (1×). Wstawione jako sekwencja (nie early-out) `_cryo(e,i,l),` przed Lu — Lu no-opuje na kliencie (dropLu przy pauzie). Host: `FH.elements.createAt(RJ_FREEZINGICE=12)`.
- **Batchowanie**: fire/cryo kolejkowane (ST._fireQ/_cryoQ, cap 2000) i wysyłane co 60ms jako {act,fireB/cryoB,c:[x,y,...]} — nie zalewa sieci (cryo ~540 komórek/s).
- RJ_FIRE=11, RJ_FREEZINGICE=12 (z enuma obecnego builda, `Fire=11]="Fire",FreezingIce=12`). Build-specific.

NIE zrobione: **grabber** — to Tool z tankiem (matrix) w danych narzędzia; pisze matrix SYNCHRONICZNIE + world przez Lu (deferred). Delay = nieodłączny round-trip host-autorytatywny. Czysty fix (early-out tick + host prowadzi tank) jest złożony i ryzykowny (tank to inventory gracza) — zostawiam obecny event-forwarding (grabber:elementPickedUp/Placed), który ma właściwy kształt, tylko z opóźnieniem. Test 2 instancji: brak błędów. VER 0.9.3-beta.

## 2026-08-17 (v0.9.2-beta) — FIX budowania klienta + fix ns kopania

Naprawa "auto-delete" struktur klienta (bez czekania na logi — z analizy kodu):
1. **Host force-place**: replayAction "place" → buildOne(...,true). Przyczyna: building:place odpala się u klienta PO jego kontroli kolizji (wolne u niego), ale host robi 2gą kontrolę na swoim stanie (minimalny rozjazd) → build null → nic nie wraca. Fix: host ufa walidacji klienta (clearance:-1).
2. **Okres ochronny w reconcile** (6s): nie kasuj struktur postawionych w ostatnich 6s (host mógł jeszcze nie ująć w snapshotcie / rozjazd klucza przez offset struktury). Mapa `_structApplied` (klucz→ts) ustawiana w applyNetStructs + reconcile.
3. **findApi multi-ns**: obecny build ma FH namespace **`excavation`** (nie `patterns` jak 0.5.3!). Dig replay: `findApi("excavate",["excavation","patterns"])`. Wykryte z logu FH keys. To mogło psuć odtwarzanie kopania na obecnym buildzie.
- Diagnostyka budowania (CLIENT forward place / HOST postawiono/NIE) zostaje.

NIE naprawione (wymagają dalszej pracy): grabber delay (nieodłączny round-trip host-autorytatywny), flamethrower/cryoblaster (Fire/Ice przez createAt — inna ścieżka, brak prostej unikalnej kotwicy, nie wrzucam na ślepo). Test 2 instancji: brak błędów. VER 0.9.2-beta.

## 2026-08-17 (v0.9.1-beta) — feedback TCentraL: diagnostyka budowania

Feedback (0.9.0-beta): modele+ruch OK ("really great"). 3 bugi klienta:
1. **Budowanie klienta "auto-deleted"** — struktury się nie potwierdzają. Nasz tor: building:place cancel+forward → host buildOne → {st,add}. Podejrzenia: (a) host build zwraca null (zła nazwa typu structureId vs to co build chce / kolizja u hosta), (b) building:place cancel nie działa na tym buildzie → klient stawia lokalnie → snapshot reconcile kasuje bo host nie ma. Dodana DIAGNOSTYKA: CLIENT forward place (structureId,x,y) + HOST postawiono/NIE postawiono. Trzeba logów TCentraLa.
2. **Grabber delay** — nieodłączny lag host-autorytatywny (round-trip); klient forwarduje grab, host wykonuje, lustro wraca. Bez lokalnej predykcji (odrzucona decyzją usera) nie zniknie. Do rozważenia: lekka predykcja tylko dla grabbera.
3. **Flamethrower/cryoblaster** — nie działają u klienta: używają INNEJ ścieżki mutacji świata (ogień/mróz) niż DN/setCell, więc nie są hookowane. Trzeba znaleźć ich hooki (przyszłe).

VER 0.9.1-beta.

## 2026-08-17 (v0.9.0-beta hotfix) — DEMISTYFIKACJA "0.5.4" + fix instalatora

**PRZEŁOM: nie ma niewspieranej 0.5.4.** User zaktualizował grę do najnowszej ze Steama → app.asar wciąż package **0.5.2**, buildid 24719878 (ten sam co wcześniej). Steam NIE ma nowszego builda. "0.5.4" które widzą gracze = wersja WYŚWIETLANA (in-game/store), różna od package.json. Test: wszystkie 9 zaczepów pasuje do OBECNEGO bundle.js (frame v0, reszta v1). **Mod w pełni wspiera obecny build.**

Prawdziwy problem ЗаКеЛьМана = mod się nie ładował, bo Steam przywracał app.asar (gra ładuje asar zamiast folderu app). Fix install.ps1:
- Gdy `app.asar` OBECNY (Steam go podłożył: świeża instalacja LUB auto-update) → **usuń stary folder app, rozpakuj ŚWIEŻO z obecnego app.asar**, usuń stary .bak, przemianuj app.asar→.bak. Gwarantuje że folder app = obecny build i asar odsunięty.
- Gdy brak app.asar a folder app jest (normalny stan zmodowany) → skip (tylko re-patch).
- Test w stanie ЗаКеЛьМана (asar przywrócony + stary folder): re-extract świeży 0.5.2 → 9/9 patchy [+] → boot OK, mod aktywny.
- Instalator DONE: usunięty nieaktualny "F9", dodany tip o wyłączeniu auto-update Steam.

Wniosek dla graczy z "nie mogę się połączyć po 0.5.4": po prostu **odpal install.bat ponownie** (teraz sam ogarnia podmianę Steam). Wersja gry NIE jest problemem.

## 2026-08-17 (v0.9.0-beta) — MERGE dotNine batch 2

Po zapoznaniu się z kodem dotNine (przeczytane sekcje modeli/grabber/resDelta), zmergowane na naszą bazę:
- **Modele graczy** (najtrudniejsze, Tier 2): puppety = prawdziwe sprite'y sklonowane z `state.session.rendering.pixi.sprites.player.*`, dodane do parenta renderowania gry. Sync w pos: tools (widoczne części), facing (scale.x), aim (atan2 do kursora, world-space), trail (alpha). Pozycja przez `FH.rendering.getDrawPos` (world→screen). Dead-reckoning (vx/vy/tUpdate, cap 3px/ms, stall→v=0). rebuild części tylko przy zmianie zestawu. muzzleFlash przy wzroście liczby pocisków. Nick nadal na canvasie 2D. Sprzątanie puppetów przy disconnect/stop. Constanty ANCHOR_DX/DY/aim-mirror = do strojenia wizualnego (dotNine sam oznaczył jako niezweryfikowane). Pos rate 50→33ms.
- **Grabber**: eventy grabber:elementPickedUp/Placed → {act,grabPick/grabPlace,x,y,et} → host FH.elements.removeAt/createAt. Rozwiązuje bug 2 NanYu (wet sand).
- **resDelta** (zasoby dwukierunkowo): klient co 1s wysyła PRZYROSTY store.resources (vs _resSnapshot re-bazowany po każdym res od hosta); host dolicza do swoich. Zarobek klienta nie ginie przy rozłączeniu.
- **NIE brane** (decyzja usera): lokalna predykcja sprayu dotNine (zostajemy host-autorytatywni), bramka kopania (forward wszystkiego).

Test 2 instancji: brak błędów JS, sync/pauza OK. Modele graczy: kod ładuje się czysto, ale realny rendering puppetów wymaga testu w świecie z 2 kontami (autotest jest w menu) → BETA. VER 0.9.0-beta, PROTO_VER 5.

## 2026-08-17 (v0.8.0-beta) — MERGE WKŁADU dotNine (współtwórca)

dotNine (członek społeczności) przysłał rozbudowaną wersję (bazującą na naszej starszej). Agent zrobił review; zmergowane na NASZĄ aktualną bazę (multi-wersja/host-authoritative/reliable transfer zostają nasze). Batch 1:

- **Sync cellIds (kolizja klienta) — protokół wc v2→v3.** worldBuffers zwraca `sim` (sh.sim.cellIds); serializacja 7→11 B/komórka (+4 sim); klient wpisuje warstwę do sim.cellIds. Efekt: wykopana dziura JEST prawdziwa dla klienta (może w nią wejść). Spójne z host-authority (klient nie autoruje, tylko dostaje siatkę). PROTO_VER 4→5.
- **Fix odtwarzania kopania na hoście**: `findApi("excavate","patterns")` — FH.world.excavate "wygląda dobrze ale nic nie robi", prawdziwe jest FH.patterns.excavate (odkrycie dotNine). findApi dostał preferredNs + .bind.
- **Auto-transfer świata**: host auto-send przy dołączeniu gracza + ciągły poll `_autoSentWid` w _frame (send każdego świata raz); klient auto-load przez `FH.game.load` po imporcie + okno zaufania `_pendingTrustUntil`/`_trustedWid` (silnik nadaje nowy worldId po load → bez zaufania kolejne wc byłyby odrzucane). Likwiduje ręczny "Send world→Load Game" (problem Warlowa).
- **Join by Lobby ID (schowek)**: klikalne #st-lobbyid (kopiuj) + przycisk Join-by-ID (wklej, regex \d{5,}, net.joinSteam). Omija zaproszenia Steam.
- **Strzałki do graczy poza ekranem** + kolory per-gracz (PEER_PALETTE, peerColor hash, drawOffscreenIndicator).
- **Ping/RTT** (ping/pong, EMA, #st-ping).
- Kredyt: dotNine jako Contributor (nagłówek kodu, HUD by-line, opis Workshop, changeNote).

Test 2 instancji: brak błędów JS, v3 sync działa, ~40-75 KB/s (+57% przez cellIds — OK, tylko dirty chunki w realu). VER 0.8.0-beta.

DEFERRED do batch 2 (Tier 2/dodatki): modele graczy z ekwipunkiem (kruche, deep PIXI coupling — wymaga strojenia), grabber tool (grabber:elementPickedUp/Placed), bidirectional resDelta (zasoby klienta). Decyzja usera: spray host-autorytatywnie (NIE bierzemy lokalnej predykcji dotNine), bramka kopania — nasze (forward wszystkiego).

## 2026-08-17 (v0.7.0-beta) — PRZEBUDOWA: klient host-autorytatywny (bugi 2+3 NanYu)

Agent zmapował placement (raport w pamięci): `building:place` (Q:1969) anulowalny = CZYSTY no-op; fundamenty piszą komórki BEZPOŚREDNIO (te→Gz/B→setCellId+mapData, nie kolejka Lu) → zapauzowany klient je zapisuje → fantomy. `l.Tn`(A:44735) dodaje store+cache bez zapisu komórek; renderer O:62058 rysuje z store.structures+cache.

Zmiany (klient NIGDY nie pisze do świata lokalnie):
- **building:place hook** (nowy, event gry): klient (nie applyingNet) → forward `{act,place,type,x,y}` + return true (anuluj lokalne stawianie, zero zapisu). Pokrywa WSZYSTKIE stawiania (pipes/foundations/maszyny idą przez ten punkt).
- **structures:placed**: teraz tylko HOST rozgłasza własne (klient anuluje przed zapisem).
- **_setCell** (B/Gz): klient NIGDY nie pisze komórek — return true zawsze; spray gracza → forward; podczas applyingNet → cichy skip (teren z lustra mapData).
- **replayAction {act,place}**: host stawia autorytatywnie (buildOne bez force, realna kontrola kolizji) → broadcast {st,add}.
- **buildOne(state,s,force)**: force=true (klient renderujący potwierdzone) → `{x,y,clearance:-1}` omija kontrolę kolizji Q (−1 ≠ żaden enum Blocked); komórki i tak pomija _setCell → tylko sprite. applyNetStructs/applySnapshot → force=true; host → bez force.
- Diagnostyka: log nieudanego postawienia na hoście.

Test 2 instancji: brak błędów JS, sync/pauza OK. **Placement wymaga testu graczy** (autotest nie klika). VER 0.7.0-beta, PROTO_VER 4.

Ograniczenia do sprawdzenia przez testerów: orientacja przenośników (building:place nie niesie kąta), pipes synchronizują się przez snapshot 2.5s (nie instant), hauler-line data (origin/target/lineId) może wymagać dosync.

## 2026-08-17 (v0.6.4) — feedback NanYu: 3 bugi klienta

1. **Klient nie kopie terenu (dirt)** — NAPRAWIONE: usunięta blokada `_pd/_projCtx` w `_dig`. Klient ma pauzę sim → brak kopań AI → każde DN = akcja gracza → forwardujemy zawsze. + findApi szuka 2 poziomy głębiej (pewniejsze znalezienie excavate) + diagnostyka HOST (log pierwszego kopania / brak API).
2. **Grabber nie przenosi wet sand** — DO ZBADANIA. Root cause prawdopodobnie: cellIds klienta zamrożone od momentu joinu (synchronizujemy WYGLĄD świata mapData/wall/shadow/auth, ale NIE grid cellIds/elementData — sim-only). Grabber/operacje na elementach na kliencie czytają nieaktualny cellIds.
3. **Foundation → czerwone niezniszczalne bloki** — DO ZBADANIA. Ta sama przyczyna: klient stawia strukturę lokalnie (pisze cellIds na bazie STAŁEGO stanu z joinu) → rozjazd z hostem → fantomowe bloki. Właściwy fix: postawienie struktur na kliencie host-autorytatywne (bez lokalnego zapisu cellIds) — wymaga ostrożności + realnego testu. Workaround dla gracza: foundation stawia HOST.

Kluczowa wiedza architektoniczna: **cellIds/elementData NIE są synchronizowane** (za duże, sim-only) — synchronizujemy tylko mapData(RGBA+material)/wallData/shadowMap/authorization. Kolizja klienta działa (mapData.alpha=material), ale każda LOKALNA operacja klienta pisząca cellIds się rozjeżdża. To źródło bugów 2 i 3.

## 2026-08-17 (v0.6.3) — fix: F9 kolidował z quick-load gry (zgłoszenie Lofar666)

Bug: panel chowany klawiszem F9, a gra ma F9 = szybkie wczytanie save'a → chowając panel gracz wczytywał grę. Fix:
- Zwijanie panelu przez **klik w nagłówek** (st-head → toggle st-body, strzałka ▾/▸) — zero klawiszy gry
- Bezpieczny skrót Ctrl+Shift+H z `capture:true` + `preventDefault` + `stopImmediatePropagation` (nie trafia do gry)
- README/INSTRUKCJA/i18n zaktualizowane (usunięte F9)
- VER 0.6.3, boot test czysty, Workshop zaktualizowany

## 2026-08-17 (v0.6.2) — audyt toru host/zaproszenia/transfer + wzmocnienia

Przegląd całego kodu połączeń na życzenie usera. **Zweryfikowano nazwy pól callbacków Steam PROSTO Z NATYWNEJ BINARKI** (steamworksjs.win32-x64-msvc.node, wyciągnięte stringi):
- P2PSessionRequest: pole `remote` ✅ (kod trafiony)
- GameLobbyJoinRequested: `lobby_steam_id` → napi camelCase `lobbySteamId` ✅ (kod trafiony)
- SteamId: `steamId64/steamId32/accountId` ✅; metody sendP2PPacket/acceptP2PSession/getOwner/getMembers/openInviteDialog/setJoinable ✅
- Wniosek: callbacki NIE były bugiem; prawdziwy bug = brak obsługi zaproszeń przy zamkniętej grze (naprawione 0.6.1)

Wzmocnienia 0.6.2:
- `S.lobby.setJoinable(true)` po utworzeniu lobby
- czyszczenie rich presence `connect` przy stopNetworking (żeby "Join Game" nie zostało nieaktualne)
- log `start argv:` przy starcie (diagnostyka — widać czy Steam podał +connect_lobby u dołączającego)
- Boot test czysty, PROTO_VER 4, VER 0.6.2, Workshop zaktualizowany

## 2026-08-17 (v0.6.1) — KRYTYCZNY fix zaproszeń (niezależny od wersji)

Wielu ludzi: "nic po kliknięciu zaproszenia", niezależnie od wersji gry. Przyczyna: kod obsługiwał TYLKO `GameLobbyJoinRequested` (overlay przy włączonej grze). Steam ma 3 ścieżki dołączenia:
1. gra działa + accept w overlayu → `GameLobbyJoinRequested` (był obsłużony)
2. gra WYŁĄCZONA + accept → Steam odpala grę z `+connect_lobby <id>` w argv (NIE czytaliśmy!) ← najczęstszy przypadek
3. gra działa + accept z listy znajomych → Steam odpala 2gą instancję → single-instance ubija → `second-instance` event z argv (NIE obsługiwaliśmy)

Fix (st-main.js):
- `tryJoinFromArgv(argv)` parsuje `+connect_lobby <id>` oraz `steam://joinlobby/<appid>/<lobbyid>/...` (regex); unit-test 4 przypadki OK
- Wywołanie przy starcie (po init Steam, cold-launch) + `app.on('second-instance')` (współistnieje z handlerem gry)
- `setRichPresence('connect', '+connect_lobby '+lobbyId)` przy hostowaniu → w liście znajomych pojawia się "Dołącz do gry" + poprawny launch param
- `S._pendingJoin` na wypadek argv przed initem Steam
- Boot test czysty, PROTO_VER bez zmian (4), VER 0.6.1
- Workshop + SandTogether-0.6.1.zip zaktualizowane

## 2026-08-17 (v0.6.0) — WIELOWERSYJNOŚĆ (Justin/MIXUIL: "nic po zaproszeniu")

Problem: gra wychodzi z nową wersją co 1-2 dni (0.5.2/0.5.3/0.5.4 w obiegu). Steam DOMYŚLNIE serwuje **0.5.2**, a mod był pod 0.5.3 → u większości subskrybentów zaczepy nie pasowały → panel się pokazuje, ale mechanika (frame hook + akcje) nie wpięta → "zaproszenia działają, panel nie reaguje". Potwierdzone przez 2 osoby (Justin, MIXUIL).

Rozwiązanie:
- **patches.json przebudowany na warianty**: każdy patch ma listę {anchor,patched} dla różnych wersji (0.5.3 + 0.5.2); instalator/patcher próbuje po kolei i nakłada pasujący. Agent znalazł i zweryfikował 9 zaczepów 0.5.2 (wszystkie unikalne).
- **install.ps1 (czysty PowerShell, bez Node)** + instalator patch.js: iterują warianty; przy braku KRYTYCZNEGO haka (frame:update) → twardy błąd "niewspierana wersja gry" (zamiast cichego przepuszczenia). Niekrytyczne braki → warning, coop i tak działa.
- **Runtime backstop w modzie**: jeśli po 12 s stan gry nie przechwycony (gra zaktualizowała się po instalacji) → czerwony panel "Niewspierana wersja gry".
- Fix idempotencji: patch achievements dostał znacznik `/*STA*/` (jego docelowy tekst był podłańcuchem oryginału → fałszywe "już nałożone").
- Walidacja: 9/9 nakłada się na 0.5.2 (v1) i 0.5.3 (v0); 2gi przebieg = 0 dubli (idempotencja OK).
- VER 0.6.0, PROTO_VER bez zmian (4, protokół sieciowy ten sam). Twoja gra odświeżona czystym 0.5.3 + przepatchowana.

UWAGA: MANUAL.zip (pre-patched 0.5.3) działa TYLKO dla 0.5.3 — dla wszystkich ludzie mają używać **install.bat** (sam wykrywa wersję i patchuje ich pliki). 0.5.4 wciąż niewspierana (brak plików) — instalator jasno to zgłosi.

## 2026-08-17 (v0.5.1) — niezawodny transfer świata przez Steam P2P

Bug zgłoszony przez testera: po "Wyślij świat" klient nie widzi save'a hosta. Przyczyna: `sendWorld` blastował wszystkie kawałki (192 KB każdy) synchronicznie w pętli → przepełnienie bufora Steam P2P → gubione paczki → niekompletny/uszkodzony transfer. Test lokalny przechodził bo szedł po WebSocket/LAN (strumień TCP, bez limitów paczek).

Fix:
- Paczka zmniejszona 192 KB → **48 KB** (bezpiecznie pod limitem Steam P2P)
- Wysyłka **rozłożona w czasie**: kolejka `ST._wtx`, 4 paczki/tick co 25 ms (~7,5 MB/s) zamiast blasta
- **Odzyskiwanie zgubionych paczek**: odbiorca śledzi otrzymane indeksy, co 700 ms wysyła `world-need` z brakującymi → host ponawia; import dopiero gdy got===total (world-end może zaginąć — nie blokuje)
- Symulacja przy 30% strat: 29/68 zgubionych, odzyskane w 5 rundach, plik bit-identyczny ✓
- PROTO_VER 3→4 (wykrycie niezgodności wersji między graczami)
- Workshop + SandTogether-0.5.1.zip + MANUAL.zip zaktualizowane; changeNote opisuje fix

## 2026-08-16 (v0.5.0b) — achievements-with-mods

- Nowy patch bundle "achievements with mods": z bramki achievementów (A_ przy pretty:128344) usunięty warunek `integrity.modsUsed`; **`cheatsUsed` zostaje** (intencja devów wobec menu cheatów — nie obchodzimy)
- Uzasadnienie: dziś modsUsed jest martwe (nigdy nie ustawiane), patch = ubezpieczenie na przyszłe wersje gry; standard "achievement enabler" znany z innych gier
- NAPRAWA patchera: test idempotencji per-patch zmieniony z "patched obecny" na "kotwica zniknęła" — poprzedni test fałszywie pomijał patche, których tekst docelowy jest podłańcuchem oryginału (dokładnie ten przypadek)
- Workshop + SandTogether-0.5.0.zip zaktualizowane

## 2026-08-16 (v0.5.0) — PEŁNY MULTIPLAYER (żądanie usera: 100%)

Nowe patche bundle (kotwice 1×): player-dig flag (I), projectile-update flag (m), spray flag (_) — flagi kontekstu pozwalają odróżnić akcje GRACZA od akcji stworków/dronów (te liczy wyłącznie host).

- **Broń palna/rakiety klienta**: pociski klienta symulowane lokalnie, trafienia forwardowane do hosta (DN w kontekście _projCtx); pociski hosta → klient i klienta → host rysowane jako tracery na warstwie ghost (zero podwójnej symulacji/obrażeń)
- **Stworki + drony**: stream {t:"ent"} 10 Hz host→klient (wholesale; lokalny AI między pakietami = wygładzanie); DN/Gz stworków NIE forwardowane (gating flagami)
- **Podnoszenie przedmiotów**: event `worldItem:pickedUp` (bus) → klient forwarduje id → host wykonuje **FH.world.items.pickUp** (pełne efekty: artefakty++, orb→tech, dźwięki); filtr _pickedPending (TTL 10 s) w snapshot reconcile chroni przed respawnem u klienta
- **Przenoszenie budynków obu stron**: structures:removed(byMove) → stash starych pozycji → para z structures:moved → {k:"move"}/{t:"st",k:"mv"}
- **Dźwięki zdarzeń świata**: tap na onmessage workerów hosta (PlaySound=41, limit 20/s) → {t:"snd"} → klient odtwarza przez FH.sound (best-effort, introspekcja)
- **Fabuła/gloom**: store.mods (storyProgression) + store.gloom w wiadomości res (1 Hz)
- **Vacuum**: prawdziwa tabela pojemności [500,1000,1500,2000,2500,3000] z kodu gry (moduł 6420) × poziom ulepszenia (FH.upgrades.getLevel)
- PROTO_VER=3; E2E test 2 instancji czysty; Workshop zaktualizowany (opis bez sekcji ograniczeń, gwiazdka: tracery/10 Hz/rzadki race przy jednoczesnym podniesieniu)

## 2026-08-16 (v0.4.2) — audyt braków + poprawki

Naprawione przeoczenia (z audytu "co zapomniałem"):
- **Handshake wersji** (PROTO_VER=2 w hello) — przy niezgodności czerwony komunikat "RÓŻNE WERSJE MODA" po obu stronach; batch świata ma pole v:2 i klient odrzuca inne
- **Drony hosta widoczne u klienta** — dodane do snapshotu (store.drones wholesale)
- **Siatka authorization streamowana** — format chunka v2: map(4)+wall(1)+shadow(1)+auth(1)=7 B/komórka; bez tego klient nie mógłby kopać w strefach odblokowanych przez hosta po dołączeniu
- **Wsparcie 3-4 graczy** — host relayuje pos/hello między klientami ({t:"relay",from,msg}); świat i tak broadcast
- **Tytuł na Workshop bez nazwiska** (decyzja usera po mojej rekomendacji prywatności): "SandTogether — Co-op Multiplayer"; autorstwo zostaje w opisie/README/kodzie/HUD
- README: ostrzeżenie żeby klient nie polegał na własnych save'ach w trakcie sesji
- Workshop update wypchnięty (item 3784750764, Public, okładka = grafika usera SandustryPic.png)

Świadome braki → v0.5: broń palna klienta, move budynków klienta, pickup przedmiotów, stworki, dźwięki zdarzeń u klienta, sync celów/fabuły przy długich sesjach, czat, ping, prawdziwe pojemności zbiorników vacuum

## 2026-08-16 (v0.4.1) — AUTORSTWO + EN + STEAM WORKSHOP

- **Autor: KAMIL PADULA** — nagłówki we wszystkich plikach źródłowych (sandtogether.js, st-main.js, patch.js, st-preload-append.js, install.ps1, modinfo.json), kredyt w HUD ("by Kamil Padula"), README/INSTRUKCJA
- **i18n**: UI moda dwujęzyczne — EN domyślnie, PL auto-wykrywany (getPreferredSystemLanguagesSync); tabela STRINGS w sandtogether.js; installer i logi po angielsku
- **README.md (EN)** + INSTRUKCJA.md (PL) w pakiecie; pakiet SandTogether-0.4.1.zip
- **Steam Workshop**: opublikowane przez steamworks.js (workshop.createItem/updateItem, konto Iron):
  - Item ID: **3784750764** — https://steamcommunity.com/sharedfiles/filedetails/?id=3784750764
  - Widoczność: **Private** (do przejrzenia przez autora; zmiana na Public na stronie itemu albo skryptem)
  - Zawartość: install.ps1 + README + INSTRUKCJA + src/ ; preview.png generowany (src/make-preview.js — placeholder, podmienić na screenshot)
  - Ponowna publikacja/update: `node src/publish-workshop.js 3784750764`
- UWAGA/ryzyka Workshop: mod instaluje się przez install.ps1 (patchuje pliki gry) — subskrypcja sama nie instaluje; możliwa reakcja moderacji/devów (gra nie ma jeszcze oficjalnego loadera dla EA); zalecany kontakt z devami/Discordem Sandustry

## 2026-08-16 (późna noc) — v0.4.0: WSPÓLNA FABRYKA (M4)

### Nowe mechanizmy
- **Struktury (budynki/maszyny/taśmy/rury)**:
  - Event-driven: subskrypcja `structures:placed/removed` przez FH.events.on (bus na state.sandkit.events) po obu stronach; flaga `_applyingNet` tłumi pętle zwrotne
  - Klient buduje/burzy → `{t:"act",k:"build"/"demolish"}` → host odtwarza przez **FH.structures.build/removeAt/update** (API robi store+cache+blockGrid za nas!) → broadcast `{t:"st"}` do klientów
  - Snapshot-reconcile co 2,5 s (deflate JSON store.structures+pipes+worldItems): dobudowa/usunięcie/aktualizacja data przez API, worldItems wholesale
- **Zasoby** (1 Hz): store.resources + productionPoints + SAB gold/energy/productionPoints + conveyorBeltsAnimationIndex (animacja taśm u klienta)
- **Vacuum klienta**: patch bundle `vacuum hook (j)` — kotwica `j=(e,t,n,a)=>{var s,l,U;const f=y(e);x(t,f);...` (1×); klient wysyła intencję (throttle 120 ms), host zbiera elementy (FH.elements.getInfoAtPos + removeAtDeferred, promień 4, max 10/tick) → `{t:"vacres",types}` → klient wypełnia zbiorniki (miękki limit 250 — dokładna tabela pojemności jest wewnętrzna)

### Ustalenia z analizy
- FH.structures ma pełne API instancji: build (=k1=Q, emituje building:place[cancellable tylko string types]/building:placed), removeAt/Between/AtPositions, update (V6+propagacja do workerów), setData, getAtCell, beginBatchWrite
- Weapon-tick (53442): tylko Dig/Shoot/Spray — vacuum to osobny tool (moduł ~12120-12400, maska C, tank fill M, cap=U.i[upgradeLevel] — tabela wewnętrzna)
- Eventy structures:placed (1952), :removed (26742), :moved (53137-53143; move klienta = ograniczenie, revert przez reconcile)

### Test E2E (menu-world, 2 instancje)
- Subskrypcje aktywne obie strony, lustro 29-46 KB/s / 187-361 chunk/s, zero błędów
- Struktury nietestowane in-game (menu nie ma budynków) — wymaga testu usera

### Znane ograniczenia 0.4 (kolejka 0.5)
- Broń palna/rakiety klienta bez efektu na świat; move budynku klienta revertuje; pickup worldItems u klienta zawodny (dupe lokalny do snapshotu); stworki/drony host-only (u klienta możliwy jitter)
- Koszt budowy: NIE-PROBLEM — stawianie budynków w grze jest darmowe (gold idzie na tech tree; tech klienta = z importowanego save'a hosta)

### Pakiet: SandTogether-0.4.zip

## 2026-08-16 (noc) — v0.3.0: M3 WSPÓLNY ŚWIAT — E2E test zaliczony

### Odkrycia z analizy silnika (agenci)
- **Renderer czyta co klatkę bezwarunkowo tylko 3 bufory: mapData (RGBA, 4B/komórka; alpha=materialId używany też do KOLIZJI na main thread), wallData (paleta u8), shadowMap (u8)** → lustro = strumień tych 3 buforów; zero remapowania cellIds/elementData!
- cellIds/elementData są sim-only; chunkShouldUpdate = tylko scheduling symulacji (idealny detektor zmian)
- **Akcje gracza w tym buildzie NIE idą przez wiadomości workerów** — Dig/Blast opcody martwe; wszystko przez mutation queue Lu (bundle:52636+) i bezpośrednie zapisy Gz/setCellId na main thread
- Pauza klienta: [54,true] TYLKO do manager workera (session.paused zostawić false → render działa); przy pauzie kolejka Lu nigdy nie drenuje (leak) → hook _dropLu
- Kopanie: DN(state,cellX,cellY,mask2D,vel,dmg) — maska = zwykła tablica 0/1 11×11/13×13 (shovel upgrade); replay na hoście przez FH.*.excavate
- FH (ie.FH) przechwycone w patchu frame:update v2 — namespaces: utils,action,elements,world,terrains,wall,shadows,...

### Nowe patche bundle.js (patch.js, kotwice zweryfikowane 1×)
- frame hook v2: przekazuje też ie.FH
- dig hook (DN=j): window.SandTogether._dig — klient wysyła intencję, pomija lokalne
- setCell hook (Gz=B): _setCell — klient wysyła + wykonuje lokalnie (predykcja)
- mutation-queue drop (Lu=h/m): _dropLu — brak leaku przy pauzie

### Protokół world sync
- Host: skan chunkShouldUpdate co klatkę → pending; batch ≤40 chunków/100 ms, priorytet wg odległości od graczy, rolling sweep 4/batch (samonaprawa); format [u16 cx][u16 cy][u8 cw][u8 ch][mapRGBA][wall][shadow] → deflate-raw (CompressionStream) → base64 → {t:"wc",wid,scene,W,H,d}
- Klient: gate worldId (wyjątek: obie strony w menu scene 1 = tryb testowy), pauza sim przy pierwszym batchu, zapis do SAB → render podnosi następną klatkę
- Akcje: {t:"act",k:"dig"|"set"} → host replay przez FH excavate/setCellId
- Pełny świat przy peer-hello + przycisk Resync

### Wynik testu E2E (2 instancje, menu-world 720×720, 324 chunki)
- Pełny świat: ~2 s; steady-state: 8–27 KB/s, 74–269 chunk/s, kolejka 0
- Klient: "Symulacja klienta: ZAPAUZOWANA (lustro hosta)", aplikacja batchy OK, zero błędów

### Pakiet
- SandTogether-0.3.zip (dla drugiego gracza)

### TODO v0.4
- Sync struktur/budynków (store.structures + session.cache.structures d.set / zoom<1 linear scan) + blockGrid SAB
- Sync zasobów (gold/energy/productionPoints SAB u32) i inwentarza
- Vacuum/grabber na kliencie (teraz no-op)
- Weryfikacja orientacji chunkShouldUpdate na niekwadratowym świecie in-game
- Test in-game (scene ≠ 1) i realny test CH↔PL przez Steam P2P

## 2026-08-16 (wieczór) — v0.2: M1+M2 ZALICZONE, sieć działa end-to-end

### Zbudowane (src/)
- `st-main.js` — networking w main procesie: Steam P2P (lobby FriendsOnly, overlay invite, callbacki P2PSessionRequest/GameLobbyJoinRequested/LobbyChatUpdate, poll pakietów 15 ms) + własny minimalny WebSocket RFC6455 (serwer i klient na `net`, zero zależności). IPC: st:host-steam/join-steam/invite/host-ws/join-ws/stop/send/status + push st:msg/st:event.
- `sandtogether.js` — renderer: HUD (przyciski Host Steam/Zaproś/Host LAN/Dołącz LAN/Wyślij świat, F9 ukrywa), sync pozycji 20 Hz, duszki na własnym canvasie (transformacja ekran = świat − kamera, interpolacja 0.25), transfer świata (export/import save przez window.electron, chunki base64 po 192 KB).
- `st-preload-append.js` — bridge contextBridge `window.sandtogetherNet`.
- `patch.js` — idempotentny patcher (6 patchy: pliki moda, index.html, bundle.js frame hook, preload, main.js init block wymienialny, bypass single-instance dla `--st-*`).

### Wyniki testów (2 instancje lokalnie, --st-autotest)
- Host: serwer WS wstał, peer-connected, hello (nick Iron), **odebrał pozycję klienta (1914,1856)**
- Klient: joined, **odebrał pozycję hosta** — pełna dwukierunkowa wymiana działa
- Uwagi: druga instancja lokalnie ma software rendering (konflikt GPU cache) — na dwóch PC nie wystąpi
- Steam P2P jeszcze NIE testowany (wymaga 2 kont — test z kolegą)

### Pakiet dla drugiego gracza
- `SandTogether-0.2.zip` (install.ps1 + INSTRUKCJA.md + src) — automatyczna instalacja u kolegi

### Znane szczegóły techniczne
- steamworks.js 0.3.1: networking={sendP2PPacket,isP2PPacketAvailable,readP2PPacket,acceptP2PSession}, matchmaking={createLobby,joinLobby,Lobby(openInviteDialog,getMembers,getOwner)}, callback.SteamCallback (P2PSessionRequest=6, GameLobbyJoinRequested=8)
- Buffer po IPC do renderera przychodzi jako {type:'Buffer',data:[...]} — obsłużone w sendWorld
- getSaveFiles → tablica metadanych z pierwszej linii .save; exportSave → {success,data}; importSave waliduje metaData.id


## 2026-08-16 — M0 ZALICZONE: injection działa (bez Fluxloadera)

### Decyzja: rezygnacja z Fluxloadera
- Fluxloader (github.com/fluxloader-team/fluxloader) był robiony pod **demo** — ostatni release 2.5.5 z 2026-04-12, ostatni commit 2026-04-21, czyli sprzed premiery EA (13.08).
- W Steam Workshop dla EA **nie ma** itemu fluxloader (wyszukiwarka: 0 wyników), mimo że main.js gry ma dla niego integrację — najwyraźniej jeszcze nie opublikowany dla EA.
- Zamiast tego: **własny injection przez rozpakowany `resources\app`**.

### Co zostało zrobione w plikach gry (F:\SteamLibrary\steamapps\common\Sandustry\resources\)
1. `app\` — rozpakowana kopia app.asar (cała gra, 135 MB)
2. `app.asar` → **przemianowany na `app.asar.bak`** (Electron w tym buildzie preferuje asar nad folder — bez rename folder był ignorowany)
3. `app\main.js` — dodany marker logowania po linii `DEV_BYPASS_MSSTORE_INIT_GATE`
4. `app\dist\index.html` — dodany `<script src="js/sandtogether.js"></script>` PRZED bundle.js
5. `app\dist\js\sandtogether.js` — nasz mod (M0: hook na `new Worker(...)`, sonda logów)

### Wynik testu (Sandustry.exe --enable-logging)
- Marker w main procesie: JEST
- `[SandTogether] Injection OK` w rendererze: JEST
- Hook Worker przechwycił tworzenie workerów: **1× manager + 1× utility + 17× simulation** (CPU usera → clamp(HC-2,2,18))
- Gra startuje i działa normalnie z naszym kodem

### Jak cofnąć (powrót do czystej gry)
1. Usuń folder `resources\app`
2. Przemianuj `resources\app.asar.bak` z powrotem na `app.asar`
(albo po prostu Steam → weryfikacja integralności plików)

### UWAGA eksploatacyjna
- Aktualizacja gry na Steam wgra nowy app.asar → nasz rozpakowany folder zostanie STARĄ wersją gry. Po każdym update: rozpakować asar na nowo i nałożyć nasze 3 zmiany (docelowo skrypt `deploy.ps1`).
- Weryfikacja integralności Steam przywróci app.asar (nasz folder app zostaje, ale wtedy będzie znowu ignorowany? — nie: asar wróci, a Electron preferuje asar ⇒ mod przestanie się ładować; trzeba ponowić rename).

### Następne kroki
- M1: warstwa sieciowa — WebSocket serwer w main procesie (mamy pełny dostęp do main.js!), klient, handshake
- M2: duszki graczy (sync pozycji przez hook na SAB playerPos / player:moved)
