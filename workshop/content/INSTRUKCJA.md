# SandTogether — coop mod dla Sandustry (wersja 0.4)

Mod dodaje pełny multiplayer coop do Sandustry. Obaj gracze MUSZĄ mieć zainstalowanego
moda w tej samej wersji i tę samą wersję gry (0.5.3).

## Instalacja

1. Miej zainstalowane Sandustry ze Steama (odpal raz normalnie).
2. Kliknij prawym na `install.ps1` → **Uruchom w programie PowerShell**
   (jeśli Windows blokuje: `powershell -ExecutionPolicy Bypass -File install.ps1`).
3. Skrypt sam znajdzie grę, rozpakuje jej kod i nałoży moda.

## Jak grać (internet, przez Steam — bez konfiguracji sieci)

**Host:**
1. Odpal grę → panel **SandTogether** (prawy górny róg) → **Host (Steam)** → **Zaproś** (wybierz znajomego).
2. Wczytaj/rozpocznij grę, zapisz ją i kliknij **Wyślij świat**.

**Dołączający:**
1. Przyjmij zaproszenie Steam.
2. Po komunikacie o imporcie: **Load Game** → wczytaj otrzymany świat.
3. Od tej chwili grasz w świecie hosta (status "lustro hosta" w panelu).

**LAN/test:** Host LAN / Dołącz LAN (`ip:27777`). **Kliknij nagłówek panelu** (lub Ctrl+Shift+H), żeby go schować/pokazać. **Resync** wymusza pełne odświeżenie.

## Co działa (0.4)

- Połączenie przez Steam (zaproszenia) lub LAN
- Widzicie swoje postacie i nicki na żywo
- **Wspólny świat na żywo**: piasek, płyny, kopanie, zmiany terenu — świat hosta
  streamowany do klienta (10–50 KB/s), symulacja liczy się tylko u hosta
- **Kopanie i stawianie elementów przez klienta** — wykonywane u hosta
- **Budynki i maszyny**: stawianie/burzenie po obu stronach + stan maszyn
  uzgadniany co 2,5 s; taśmy, rury, fabryka — wspólne
- **Zasoby wspólne** (złoto/energia/produkcja — stan hosta u obu)
- **Odkurzacz klienta** — zbiera elementy ze świata hosta do swoich zbiorników

## Ograniczenia (w kolejce do 0.5)

- Broń palna/rakiety klienta nie działają na świat (kopanie/spray/vacuum — tak)
- Przenoszenie budynku przez klienta może się cofnąć (obejście: zburz i postaw)
- Podnoszenie przedmiotów z ziemi przez klienta jest zawodne
- Stworki/drony sterowane przez hosta (u klienta mogą drgać)
- Po **aktualizacji gry na Steam** mod znika — odpal `install.ps1` ponownie

## Odinstalowanie

Steam → Sandustry → Właściwości → Zainstalowane pliki → Sprawdź spójność plików gry,
potem usuń folder `resources\app`.
