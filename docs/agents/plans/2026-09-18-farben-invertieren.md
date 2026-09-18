---
date: 2026-09-18T11:50:36.310900+00:00
git_commit: 7d41f12d889356da8f03e670245f95fda4d37c48
branch: main
story: MZP-008
topic: "Farben invertieren"
tags: [plan, shared, ui, settings, accessibility, css]
status: ready
---

# PLAN: MZP-008 — Farben invertieren

Die Einstellungen bekommen über der Artikelverwaltung einen Schalter „Farben
invertieren". Er kehrt jede Farbe der App exakt um (`255 − Kanal`) — also kein
entworfener Dark-Mode, sondern die mathematische Umkehrung des heutigen Bildes. Die
Einstellung gilt für das ganze Dokument, liegt im Speicher des Geräts und übersteht
Schliessen und erneutes Öffnen der App.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-18.

## Akzeptanzkriterien

- [x] In den Einstellungen steht **über** „Artikelverwaltung" die Zeile „Farben
      invertieren" mit dem Haken **rechts**. Die ganze Zeile ist Tippfläche.
- [x] VoiceOver liest die Zeile als „Farben invertieren, Schalter, aus" bzw. „ein" und
      sagt den Wechsel selbst an. Die App sagt über den `Announcer` **nichts**
      zusätzlich.
- [x] Umschalten kehrt sofort alle acht Farben der App um: `#ffffff`↔`#000000`,
      `#14532d`→`#ebacd2`, `#d1d5db`→`#2e2a24`, `#4b5563`→`#b4aa9c`,
      `#6b7280`→`#948d7f`, `#991b1b`→`#66e4e4`, `#ff00cc`→`#00ff33`.
- [x] Ein Test rechnet nach, dass jeder invertierte Token das exakte Komplement des
      hellen ist — die Umkehrung ist damit nicht von Hand abgetippt, sondern belegt.
- [x] Die Umkehrung gilt für die ganze App: Anmeldeseite, Navigationsleiste, Listen,
      Knopfleiste, Ansagezeile, Update-Hinweis und **Eingabefelder**.
- [x] Die Einstellung überlebt Schliessen und erneutes Öffnen der App auf diesem Gerät.
      Sie wandert **nicht** nach Firestore; das andere Gerät bleibt unberührt.
- [x] Die App zeichnet sich beim Start sofort invertiert — sie erscheint **nicht** erst
      hell und kippt dann um.
- [x] Verweigert der Browser den Speicher, lässt sich trotzdem umschalten — auch dann,
      wenn schon der **Lesezugriff** wirft. Gemerkt wird dann nichts, angesagt auch
      nichts.
- [x] Überscroll-Fläche und die Flächen hinter den Safe-Area-Rändern sind im
      invertierten Zustand schwarz — keine weissen Balken.
- [x] `src/index.css` enthält ausserhalb der beiden `:root`-Blöcke keinen Farbwert mehr.
- [x] Inline-Skript und Adapter benutzen nachweislich denselben Speicherschlüssel.
- [x] Die Einstellungen sind in beiden Zuständen ohne axe-Befund.
- [x] Die bestehenden Abläufe bleiben unverändert; die vorhandenen E2E-Tests laufen ohne
      Anpassung grün.

### Bewusste Grenzen

- Die Umkehrung ist exakt, ohne Ausnahme. Aus dem Dunkelgrün wird Rosa, aus dem
  magentafarbenen Haken Neongrün, aus dem Fehlerrot Türkis. Das ist so gewollt.
- Die Einstellung gehört dem Gerät, nicht dem Haushalt. Zwei Geräte können
  unterschiedlich stehen.
- iOS bringt mit „Farben umkehren" (Classic/Smart Invert) eine eigene Umkehrung mit.
  Ist die zusammen mit diesem Schalter eingeschaltet, heben sich beide auf und die App
  sieht wieder hell aus. Das ist erwartet und wird nicht abgefangen.
- Der **Startbildschirm** der installierten PWA bleibt weiss. Er kommt aus
  `background_color: '#ffffff'` (`vite.config.ts:29`), wird vom Betriebssystem vor dem
  ersten Zeichnen gemalt und ist geräteweit fest — ein Schalter in der App erreicht ihn
  nicht. Das Inline-Skript sorgt nur dafür, dass die App selbst nicht hell **anfängt**.
- Die iOS-Statusleiste wird nicht eigens umgeschaltet. Ab iOS 26 tönt WebKit die
  Systemflächen nach der tatsächlichen Hintergrundfarbe von `body`/`html` und ignoriert
  `meta theme-color`; die Farbe kippt also von selbst mit, sobald sie auf Variablen
  steht. `index.html:9-10` und das Manifest in `vite.config.ts:31-32` bleiben
  unangetastet.
- Der Wächter-Test prüft **Schreibweisen**, nicht Wahrnehmung: Er verbietet Farbwerte
  ausserhalb der Palette (Hex, `rgb()`, `hsl()`, `oklch()`, `color-mix()` und die
  gebräuchlichen Farbnamen). Eine exotische Notation kann ihm entgehen.
- Der Kontrast im invertierten Zustand wird **nicht** automatisiert geprüft: axe läuft
  in jsdom ohne Stylesheet und kann `color-contrast` dort gar nicht auswerten. Dafür
  gibt es einen Punkt in der manuellen Prüfung.

## Wesentliche Entscheidungen und Abwägungen

1. **CSS-Custom-Properties statt `filter: invert(1)`:** acht Farbtoken in `:root`, im
   invertierten Zustand überschrieben.
   - Warum: Die Spec-Ausnahme, nach der `filter` auf dem Wurzelelement **keinen**
     Containing Block für `position: fixed` erzeugt, ist belegt nur in Chromium
     umgesetzt; für WebKit gibt es keine Quelle, und Safari 26 hat genau dieses
     Verhalten angefasst („Fixed CSS filters to establish a containing block like
     transform does", WebKit-Release-Notes 26.0). Dazu ein offener Apple-Report über
     falsche Farben bei `filter` in iOS 26.2. `.bottomBar` (`position: fixed`) und
     `.navigationBar` (`sticky`) wären ein Blindflug.
   - Auswirkung: Die **30 Farbwerte in 18 Regeln** in `src/index.css` werden zu acht
     Variablen. Jede künftige Farbe muss als Token angelegt werden; ein Test wacht
     darüber.
2. **Exakte Umkehrung aller acht Farben, ohne Ausnahme.**
   - Warum: „exakt invertieren" war die Vorgabe. Es ist ausserdem die einzige Variante,
     bei der später keine Farbe vergessen wird — jede neue Farbe hat genau eine
     richtige Umkehrung.
   - Auswirkung: Der Kontrast bleibt erhalten, das Markenbild nicht. Die Rechnung wird
     im Test nachvollzogen, nicht geglaubt.
3. **Hintergrundfarbe explizit auf `html` **und** `body`.**
   - Warum: Die Überscroll-Fläche und die Flächen hinter den Safe-Area-Insets werden
     auf iOS nicht aus dem gerenderten Seiteninhalt gemalt, sondern aus der aufgelösten
     Hintergrundfarbe von `body`, sonst `html`, sonst Weiss. Heute hat nur `body` eine.
   - Auswirkung: Eine Regel für `html` kommt neu hinzu.
4. **Schalter als `<input type="checkbox" role="switch">`** in einem `<label>`, das die
   ganze Zeile umfasst; Haken rechts, in der Optik des grossen Hakens aus der
   Einkaufsliste.
   - Warum: Nur dieses Muster lässt VoiceOver den Zustandswechsel von sich aus ansagen.
     axe erlaubt die Rolle ausdrücklich (`allowedRoles: […, "switch"]` für
     `input[type=checkbox]`) und liefert `aria-checked` implizit nach — ein eigenes
     `aria-checked` ist weder nötig noch erwünscht.
   - Auswirkung: Die vorhandenen Regeln `.itemList label` und
     `.itemList input[type='checkbox']` greifen bereits; es fehlt nur die Ausrichtung
     nach rechts. In Playwright ist der Schalter **nicht** über `getByRole('checkbox')`
     erreichbar, sondern über `getByRole('switch')`.
5. **Zustand am Wurzelelement als `data-inverted-colors`,** gesetzt von zwei Stellen:
   einem Inline-Skript in `index.html` vor dem ersten Zeichnen und dem Hook bei jeder
   Änderung.
   - Warum: Das Stylesheet steht im `<head>`, React läuft später. Ohne das Inline-Skript
     zeichnet die App sich erst hell und kippt dann um.
   - Auswirkung: Der Speicherschlüssel steht an zwei Stellen. Ein Test hält die beiden
     **Schlüssel** zusammen; dass beide Stellen auch gleich robust gegen einen
     gesperrten Speicher sind, muss der Adapter selbst leisten (siehe Entscheidung 6).
6. **Speicherung hinter einem Port in `src/shared/appearance/`,** flach aufgebaut wie
   `src/shared/appUpdate/`. Lesen **und** Schreiben sind gegen einen werfenden Speicher
   abgesichert.
   - Warum: Die App kennt bisher kein `localStorage`. `appUpdate` ist das nächstliegende
     Vorbild: Port, echter Adapter, In-Memory-Fake, Hook — Tests bleiben framework- und
     mockfrei. Safari wirft bei gesperrtem Speicher schon beim Zugriff auf
     `localStorage` selbst; ein ungeschütztes Lesen im `useState`-Initialisierer wäre
     ein weisser Bildschirm.
   - Auswirkung: Der Adapter bekommt seinen Speicher hereingereicht
     (`Pick<Storage, 'getItem' | 'setItem'>`), damit sein Test im vitest-Projekt `unit`
     läuft, das ohne jsdom arbeitet (`vitest.config.ts:8-12`).
7. **Der Wächter-Test liegt in `test/`, nicht in `src/`.**
   - Warum: Er liest Dateien über `node:fs`. `tsconfig.app.json` deckt `src` ab, führt
     aber nur `vite/client` und `vite-plugin-pwa/client` als `types` — ein Node-Import
     unter `src` lässt `tsc -b` und damit `npm run build` scheitern. `test/**/*.ts`
     steht dagegen in `tsconfig.node.json` mit `"types": ["node"]`, ist in
     `eslint.config.js:79` mit Node-Globals versehen und wird von `vitest.config.ts:11`
     bereits eingesammelt. Vorbild: `test/domainLayerBoundary.test.ts`.
8. **`SettingsEntry` wird eine unterschiedene Union** (`kind: 'page' | 'toggle'`).
   - Warum: `SignedInApp` bestimmt Reihenfolge und Inhalt der Einstellungen;
     `SettingsPage` bleibt frei von Wissen über einzelne Einstellungen.
   - Auswirkung: `SETTINGS_ENTRIES` wird von der Modul-Konstante zur im Rumpf gebauten
     Liste, weil der Schalter Zustand und Handler trägt.
9. **`color-scheme: dark` im invertierten Zustand, dazu eigene Farben für
   `input`/`textarea`.**
   - Warum: Eingabefelder haben heute keine eigene Hintergrundfarbe — die kommt vom
     Browser und würde sonst weiss bleiben. `color-scheme` regelt zusätzlich
     Schreibmarke, Auswahl und Rollbalken.

## Ausgangslage

```
src/
  index.css                 30 fest verdrahtete Farbwerte in 18 Regeln,
                            eine Variable (--bottomBarHeight) existiert bereits
  main.tsx                  verdrahtet die echten Clients, Importe mit .ts/.tsx-Endung
  App.tsx                   hält Sitzung, Ansagen, Update
  SignedInApp.tsx           AREAS, SETTINGS_ENTRIES, Bereichsauswahl
  shared/
    appUpdate/              Vorbild: appUpdateClient.ts + zwei Adapter + Hook
    ui/SettingsPage.tsx     Liste aus { id, label }, jeder Eintrag ein Knopf
test/
  domainLayerBoundary.test.ts   Vorbild: Test, der Dateien liest
index.html                  color-scheme (Z. 9), theme-color (Z. 10),
                            Modul-Skript (Z. 20), kein Inline-Skript
```

Die Einstellungen heute:

```
┌──────────────────────────────────────────┐
│ Einkaufsliste │ Gerichte │           ⚙   │  .navigationBar (sticky)
├──────────────────────────────────────────┤
│ Einstellungen                       (h1) │
│ ──────────────────────────────────────── │
│ [ Artikelverwaltung                    ] │  li.mealRow > button.mealNameButton
│ ──────────────────────────────────────── │
└──────────────────────────────────────────┘
```

Die acht Farben und ihre Verwendung:

| Farbe | Verwendung | Token | invertiert |
|---|---|---|---|
| `#ffffff` | Seite, Leisten, Sekundärknöpfe | `--surface` | `#000000` |
| `#000000` | Text, Haken-Rahmen | `--ink` | `#ffffff` |
| `#14532d` | Primärknopf, Fokusrahmen, aktiver Tab | `--accent` | `#ebacd2` |
| `#d1d5db` | Trennlinien | `--divider` | `#2e2a24` |
| `#4b5563` | Feldrahmen | `--fieldBorder` | `#b4aa9c` |
| `#6b7280` | deaktivierter Knopf | `--disabled` | `#948d7f` |
| `#991b1b` | Fehlermeldung | `--failure` | `#66e4e4` |
| `#ff00cc` | Haken | `--checkMark` | `#00ff33` |

Die App benutzt **nirgends** `localStorage`; ein Muster für „Einstellung nur auf diesem
Gerät" gibt es noch nicht. Icons zeichnen mit `currentColor`
(`src/shared/ui/SettingsIcon.tsx:7`) und kippen deshalb von selbst mit.

## Zielbild

```
Start der App
  index.html  ──► Inline-Skript liest 'invertedColors' aus localStorage
                  und setzt html[data-inverted-colors]      ── vor dem ersten Zeichnen
  index.css   ──► :root                                = helle Token
                  :root[data-inverted-colors='true']   = invertierte Token

Laufzeit
  main.tsx      createLocalStorageAppearanceClient()
       │
       ▼
  App.tsx       useAppearance(appearanceClient)
       │          ├── liest beim ersten Rendern denselben Wert
       │          └── schreibt bei jeder Änderung Attribut und Speicher
       ▼
  SignedInApp   appearance ──► SettingsPage (entries: toggle, page)
```

Die Einstellungen danach:

```
┌──────────────────────────────────────────┐
│ Einkaufsliste │ Gerichte │           ⚙   │
├──────────────────────────────────────────┤
│ Einstellungen                       (h1) │
│ ──────────────────────────────────────── │
│   Farben invertieren                  ⌐  │  li.mealRow > label.settingsToggle
│                                       └──│  role="switch"
│ ──────────────────────────────────────── │
│ [ Artikelverwaltung                    ] │
│ ──────────────────────────────────────── │
└──────────────────────────────────────────┘
```

## Abstraktionen und Wiederverwendung

Wiederverwendet wird:

- `src/shared/appUpdate/` als Bauplan für Port, Fake, Adapter und Hook.
- `.itemList label` und `.itemList input[type='checkbox']` aus `src/index.css` — die
  Schalterzeile erbt Hakenoptik, Zeilenhöhe und Abstände.
- `.mealRow` für die Zeile, `.itemList` für die Trennlinien.
- `test/domainLayerBoundary.test.ts` als Vorbild für einen Test, der Projektdateien
  liest.

Neu entsteht:

- `src/shared/appearance`
  - `appearanceClient.ts` - Port `AppearanceClient` mit `readInvertedColors` und
    `writeInvertedColors`, dazu `DeviceStorage`
  - `localStorageAppearanceClient.ts` - Adapter, hält den Schlüssel
    `INVERTED_COLORS_KEY`, verträgt fehlenden und werfenden Speicher in beide Richtungen
  - `localStorageAppearanceClient.test.ts` - Adaptertest gegen einen Speicher-Fake
  - `inMemoryAppearanceClient.ts` - Fake `StoringAppearanceClient` mit
    `storedInvertedColors()`
  - `useAppearance.ts` - Hook, liefert `{ invertedColors, toggleInvertedColors }` und
    hält `document.documentElement.dataset.invertedColors` nach
- `test`
  - `palette.test.ts` - Wächter über `src/index.css` und `index.html`
- `src/index.css`
  - `:root` - acht Farbtoken neben `--bottomBarHeight`
  - `:root[data-inverted-colors='true']` - die invertierten Werte und `color-scheme`
  - `html` - neue Regel mit `background-color`
  - `input, textarea` - eigene `background-color` und `color`
  - `.settingsToggle` - Zeile mit dem Haken rechts
- `index.html`
  - Inline-Skript im `<head>`
- `src/shared/ui/SettingsPage.tsx`
  - `SettingsEntry` - Union aus `page` und `toggle`
- `src/SignedInApp.tsx`
  - `settingsEntries` - im Rumpf gebaut, Schalter zuerst
- `src/App.tsx`
  - neue Eigenschaft `appearanceClient`, ruft `useAppearance`
- `src/main.tsx`
  - verdrahtet den Adapter
- `e2e/appearance.spec.ts`
  - Neuladen-Probe

Für alle neuen Dateien unter `src/` gilt `verbatimModuleSyntax` — Typen werden mit
`import type` geholt. `src/main.tsx` schreibt in allen Importen die Dateiendung aus
(`src/main.tsx:3-9`); die neue Zeile tut das auch.

## Logging und Beobachtbarkeit

Keine Änderung. Der Schalter meldet nichts über den `Announcer`; VoiceOver spricht den
Zustand des Schalters von sich aus.

## Umsetzung

### Phase 1: Farbtoken einziehen

Abhängigkeiten: keine.

Alle Farben wandern in Variablen, ohne dass sich am Bild etwas ändert. Danach gibt es
genau eine Stelle, an der Farbe definiert wird.

**Aufgaben**:

- [x] In `src/index.css` die acht Token in `:root` anlegen, neben dem bestehenden
      `--bottomBarHeight`:

      ```css
      :root {
        color-scheme: light;
        --surface: #ffffff;
        --ink: #000000;
        --accent: #14532d;
        --divider: #d1d5db;
        --fieldBorder: #4b5563;
        --disabled: #6b7280;
        --failure: #991b1b;
        --checkMark: #ff00cc;
        --bottomBarHeight: calc(3rem + 1rem + 1px);
      }
      ```

- [x] Alle 30 Farbwerte in diesen 18 Regeln auf die Token umstellen: `body`,
      `.navigationBar`, `.navigationBar button`,
      `.navigationBar button[aria-current='page']`, `:focus-visible`,
      `input, textarea`, `button`, `button:disabled`, `.failure`, `.announcer`,
      `.itemList li`, `.suggestionList button`, `.itemList input[type='checkbox']`,
      `.itemList input[type='checkbox']:checked::before`, `.mealNameButton`,
      `.bottomBar`, `h1:focus-visible`, `.appUpdate`.
      `.bottomBarInFlow { background-color: transparent }` bleibt, wie es ist.
- [x] Neue Regel `html { background-color: var(--surface) }` ergänzen, damit die
      Überscroll-Fläche nicht weiss bleibt.
- [x] `input, textarea` um eigene Farben ergänzen, damit sie nicht am Browser hängen:

      ```css
      input,
      textarea {
        border: 1px solid var(--fieldBorder);
        background-color: var(--surface);
        color: var(--ink);
      }
      ```

- [x] `test/palette.test.ts` anlegen: liest `src/index.css`, entfernt die
      `:root`-Blöcke und besteht darauf, dass im Rest kein Farbwert steht.

      ```ts
      const stylesheet = readFileSync(
        new URL('../src/index.css', import.meta.url),
        'utf8',
      )

      const COLOUR = new RegExp(
        [
          '#[0-9a-f]{3,8}\\b',
          '\\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\\(',
          '\\b(?:white|black|red|green|blue|gray|grey)\\b',
        ].join('|'),
        'i',
      )

      function rulesOutsideThePalette(stylesheet: string) {
        return stylesheet.replace(/:root[^{]*\{[^}]*\}/g, '')
      }

      it('defines every colour in the palette', () => {
        expect(rulesOutsideThePalette(stylesheet)).not.toMatch(COLOUR)
      })
      ```

**Automatisierte Verifikation**:

- [x] `npm run test` — der neue Test `defines every colour in the palette` ist grün,
      alle bestehenden Tests bleiben grün.
- [x] `npm run lint` läuft durch.
- [x] `npm run build` läuft durch — das belegt zugleich, dass `test/palette.test.ts` am
      richtigen Ort liegt (unter `src/` würde `tsc -b` den `node:fs`-Import abweisen).

### Phase 2: Schalter, Speicherung und Umkehrung

Abhängigkeiten: Phase 1.

Der Schalter erscheint, merkt sich seinen Zustand auf dem Gerät und kehrt die Farben um.

**Aufgaben**:

- [x] `src/shared/appearance/appearanceClient.ts` anlegen:

      ```ts
      export type DeviceStorage = Pick<Storage, 'getItem' | 'setItem'>

      export interface AppearanceClient {
        readInvertedColors(): boolean
        writeInvertedColors(invertedColors: boolean): void
      }
      ```

- [x] `src/shared/appearance/localStorageAppearanceClient.ts` anlegen. Der Speicher wird
      hereingereicht, damit der Test ohne jsdom läuft. **Beide** Richtungen sind
      abgesichert — auch der Zugriff auf `localStorage` selbst, der in Safari bei
      gesperrtem Speicher wirft:

      ```ts
      export const INVERTED_COLORS_KEY = 'invertedColors'

      function deviceStorage(): DeviceStorage | null {
        try {
          return globalThis.localStorage
        } catch {
          return null
        }
      }

      function storedValue(storage: DeviceStorage | null): string | null {
        try {
          return storage?.getItem(INVERTED_COLORS_KEY) ?? null
        } catch {
          return null
        }
      }

      function store(
        storage: DeviceStorage | null,
        invertedColors: boolean,
      ): void {
        try {
          storage?.setItem(INVERTED_COLORS_KEY, String(invertedColors))
        } catch {
          return
        }
      }

      export function createLocalStorageAppearanceClient(
        storage: DeviceStorage | null = deviceStorage(),
      ): AppearanceClient {
        return {
          readInvertedColors: () => storedValue(storage) === 'true',
          writeInvertedColors: (invertedColors) => store(storage, invertedColors),
        }
      }
      ```

- [x] `src/shared/appearance/localStorageAppearanceClient.test.ts` test-getrieben
      schreiben, gegen einen handgeschriebenen `DeviceStorage`-Fake. Fälle: liest
      `'true'` als eingeschaltet; liest `'false'`, einen fremden Wert und `null` als
      ausgeschaltet; schreibt `'true'` und `'false'` unter
      `INVERTED_COLORS_KEY`; übersteht `storage === null`; übersteht einen Speicher,
      dessen `getItem` wirft; übersteht einen, dessen `setItem` wirft.
- [x] `src/shared/appearance/inMemoryAppearanceClient.ts` anlegen:

      ```ts
      export type StoringAppearanceClient = AppearanceClient & {
        storedInvertedColors(): boolean
      }

      export function createInMemoryAppearanceClient(
        invertedColors = false,
      ): StoringAppearanceClient
      ```

- [x] `src/shared/appearance/useAppearance.ts` anlegen:

      ```ts
      export type Appearance = {
        invertedColors: boolean
        toggleInvertedColors: () => void
      }
      ```

      Der Hook startet mit `appearanceClient.readInvertedColors()`, hält per `useEffect`
      `document.documentElement.dataset.invertedColors` auf `String(invertedColors)` und
      schreibt beim Umschalten erst in den Client, dann in den Zustand.
- [x] In `src/index.css` den invertierten Block ergänzen:

      ```css
      :root[data-inverted-colors='true'] {
        color-scheme: dark;
        --surface: #000000;
        --ink: #ffffff;
        --accent: #ebacd2;
        --divider: #2e2a24;
        --fieldBorder: #b4aa9c;
        --disabled: #948d7f;
        --failure: #66e4e4;
        --checkMark: #00ff33;
      }
      ```

- [x] `.settingsToggle` ergänzen — Zeilenhöhe und Abstand kommen bereits von
      `.itemList label`:

      ```css
      .settingsToggle {
        flex: 1;
        justify-content: space-between;
      }
      ```

- [x] In `index.html` das Inline-Skript ans Ende des `<head>` setzen:

      ```html
      <script>
        try {
          document.documentElement.dataset.invertedColors =
            localStorage.getItem('invertedColors') === 'true'
        } catch (storageBlocked) {
          document.documentElement.dataset.invertedColors = 'false'
        }
      </script>
      ```

- [x] `test/palette.test.ts` um zwei Tests erweitern:
      - `inverts every colour of the palette exactly` — liest beide `:root`-Blöcke,
        sammelt je Block die Farbtoken und rechnet nach, dass der invertierte Wert das
        Komplement des hellen ist. Damit steht die Kernforderung im Test, nicht nur im
        Plan:

        ```ts
        function colourTokens(block: string) {
          return new Map(
            [...block.matchAll(/(--[a-zA-Z]+):\s*(#[0-9a-f]{6})\b/g)].map(
              ([, token, colour]) => [token, colour],
            ),
          )
        }

        function complementOf(colour: string) {
          const channels = [1, 3, 5].map(
            (start) => 255 - parseInt(colour.slice(start, start + 2), 16),
          )
          return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`
        }
        ```

      - `applies the stored preference before the first paint` — liest `index.html`
        (`new URL('../index.html', import.meta.url)`) und verlangt, dass dort
        `INVERTED_COLORS_KEY` und das Datenattribut `invertedColors` vorkommen, damit
        Skript und Adapter denselben Schlüssel benutzen.
- [x] `src/shared/ui/SettingsPage.tsx`: `SettingsEntry` zur Union machen und beide
      Sorten rendern:

      ```ts
      export type SettingsEntry =
        | { kind: 'page'; id: string; label: string }
        | {
            kind: 'toggle'
            id: string
            label: string
            enabled: boolean
            onToggle: () => void
          }
      ```

      Die `toggle`-Zeile wird zu

      ```tsx
      <label className="settingsToggle">
        <span>{entry.label}</span>
        <input
          type="checkbox"
          role="switch"
          checked={entry.enabled}
          onChange={entry.onToggle}
        />
      </label>
      ```

      Kein `aria-checked`: axe erlaubt `switch` auf `input[type=checkbox]` und leitet
      den Zustand aus dem Element ab.
- [x] `src/SignedInApp.tsx`: `appearance: Appearance` als neue Eigenschaft annehmen,
      `SETTINGS_ENTRIES` durch eine im Rumpf gebaute Liste ersetzen — Schalter zuerst,
      Artikelverwaltung danach.
- [x] `src/App.tsx`: `appearanceClient: AppearanceClient` als neue Eigenschaft annehmen,
      `useAppearance` aufrufen und das Ergebnis an `SignedInApp` durchreichen.
- [x] `src/main.tsx`: `createLocalStorageAppearanceClient()` verdrahten, Import mit
      `.ts`-Endung wie die Nachbarzeilen.
- [x] `src/SignedInApp.test.tsx` erweitern — `renderSignedInApp` reicht den
      In-Memory-Client durch: der Schalter steht **vor** der Artikelverwaltung;
      Umschalten setzt `toBeChecked()` und schreibt in den Client; ein zweiter axe-Test
      prüft die eingeschaltete Stellung.
- [x] `src/App.test.tsx` erweitern — `renderApp` übergibt den In-Memory-Client; ein Test
      belegt, dass ein gemerktes „eingeschaltet" `data-inverted-colors="true"` am
      Wurzelelement setzt. Jeder Test dieser Datei setzt seinen Ausgangszustand selbst,
      da `document.documentElement` innerhalb der Datei zwischen den Tests bestehen
      bleibt.
- [x] `e2e/appearance.spec.ts` anlegen, mit `test.beforeEach(prepareEmulators)` wie die
      bestehenden Specs: anmelden, `pressButton(page, 'Einstellungen')`, dann den
      Schalter über `page.getByRole('switch', { name: 'Farben invertieren' })`
      fokussieren und mit `page.keyboard.press('Space')` umlegen (`pressButton` drückt
      Enter und taugt hier nicht). Erwartet wird
      `html[data-inverted-colors="true"]`; danach `page.reload()` und erneut dasselbe
      Attribut sowie ein angehakter Schalter.

**Automatisierte Verifikation**:

- [x] `npm run test` — die neuen Tests des Adapters, der Palette, der Einstellungen und
      des Wurzelattributs sind grün, alle bestehenden bleiben grün.
- [x] `npm run lint` läuft durch.
- [x] `npm run build` läuft durch.
- [x] `npm run test:e2e` — `remembers the inverted colours after a reload` ist grün,
      die bestehenden Abläufe bleiben grün.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [x] Einstellungen öffnen, „Farben invertieren" einschalten: Die ganze App kippt —
      Navigationsleiste, Listen, Knopfleiste, Eingabefelder.
- [x] Im invertierten Zustand eine Fehlermeldung auslösen (Artikel ohne Namen speichern)
      und einen deaktivierten Knopf ansehen: Beides ist gut lesbar.
- [x] Über die Liste hinaus scrollen („Gummiband"): Die Fläche ist schwarz, keine
      weissen Balken. Dasselbe am oberen und unteren Rand hinter den Safe-Area-Insets.
- [x] Die Statusleiste bleibt lesbar.
- [x] App schliessen (aus dem App-Umschalter wegwischen) und neu starten: Nach dem
      weissen Startbildschirm des Systems erscheint die App sofort invertiert, ohne
      zwischendurch hell zu zeichnen.
- [x] Mit VoiceOver über die Zeile streichen: „Farben invertieren, Schalter, ein".
      Doppeltippen sagt „aus", und es folgt keine zweite Ansage aus der App.
- [x] Am zweiten Gerät nachsehen: Dort ist nichts invertiert.

## Notizen zur Umsetzung

Der Test `applies the stored preference before the first paint` importiert
`INVERTED_COLORS_KEY` **nicht** aus dem Adapter, sondern liest ihn per Regex aus dessen
Quelltext. Grund: Ein Import aus `test/` nach `src/` zieht die Adapterdatei in
`tsconfig.node.json` (`moduleResolution: nodenext`), das Dateiendungen in relativen
Importen verlangt — `tsc -b` und damit `npm run build` scheiterten daran. Der Test liest
ohnehin Projektdateien; das Muster steht bereits in `e2e/emulatorHousehold.ts`
(`householdUid()` liest die UID aus `firestore.rules`).

## Verweise

- `src/index.css` — die 30 Farbwerte in 18 Regeln
- `src/shared/appUpdate/` — Vorbild für Port, Fake, Adapter und Hook
- `test/domainLayerBoundary.test.ts` — Vorbild für einen dateilesenden Test
- `tsconfig.app.json` / `tsconfig.node.json` — warum der Wächter in `test/` liegt
- `vitest.config.ts:8-12` — `.test.ts` läuft ohne jsdom, deshalb der hereingereichte
  Speicher
- Filter Effects Level 1, Ausnahme für das Wurzelelement:
  https://drafts.csswg.org/filter-effects-1/
- WebKit Features in Safari 26.0, „Fixed CSS filters to establish a containing block
  like transform does" (119130847): https://webkit.org/blog/17333/
- Safari 26 tönt Systemflächen nach der Hintergrundfarbe statt nach `theme-color`:
  https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/
- Überscroll-Fläche und aufgelöste Hintergrundfarbe auf iOS:
  https://nasedk.in/blog/ios26-safari-toolbar-colors/
