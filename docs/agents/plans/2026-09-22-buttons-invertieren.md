---
date: 2026-09-22T11:37:36.524407+00:00
git_commit: 0d2ce3e05f7eae0674c34719dad350bee56221ea
branch: main
story: MZP-012
topic: "Buttons invertieren"
tags: [plan, shared, ui, css, accessibility]
status: ready
---

# PLAN: MZP-012 — Buttons invertieren

Die gefuellten Buttons der App wechseln vom Dunkelgruen `#14532d` auf dessen exaktes
Komplement `#ebacd2` und tragen Text und Icons in Schwarz. Weil `--accent` damit zur
Fuellfarbe wird und als Linien- und Textfarbe ausfaellt, bekommen die leisen Buttons
eine eigene Linienfarbe und die gefuellten einen Rahmen, der ihre Form traegt.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-22.

## Akzeptanzkriterien

- [ ] Jeder heute gruen gefuellte Button hat die Flaeche `#ebacd2`, Text und Icon in
      Schwarz und einen 1px schwarzen Rahmen: "Zurueck", "Speichern", "Loeschen",
      "Abbrechen", "+", die Icon-Knoepfe am Gericht, der Mengen-Stepper am Vorrat, die
      untere Knopfleiste, der Update-Hinweis und die aktive Navigationsschaltflaeche.
- [ ] Jeder leise Button hat die Flaeche der Seite, schwarzen Text und einen Rahmen in
      `#a63f7d`: die inaktiven Navigationsschaltflaechen, die Vorschlagsliste sowie die
      Gericht- und Vorratsnamen in den Listen.
- [ ] Eingabefelder behalten den grauen Rahmen `#4b5563` und sind dadurch von den leisen
      Buttons unterscheidbar.
- [ ] Der Fokusring ist 3px schwarz und 2px abgesetzt. Er bleibt auf der rosa Flaeche
      wie auf der Seite sichtbar.
- [ ] Deaktivierte Buttons bleiben grau gefuellt mit weisser Schrift.
- [ ] Bei aktiver Farbumkehr sind alle diese Farben die exakten Komplemente: gefuellt
      `#14532d` mit weisser Schrift, leise Rahmen `#59c082`, Fokusring weiss.
- [ ] `test/palette.test.ts` rechnet weiterhin nach, dass jeder invertierte Token das
      exakte Komplement des hellen ist — auch das neue Paar `--accentLine`.
- [ ] Ein Test rechnet die tatsaechlich benutzten Farbkombinationen nach: Text auf
      seiner Flaeche mindestens 4,5:1, jede Linie gegen ihren Grund mindestens 3:1 — in
      beiden Modi.
- [ ] Systemleiste und Splash der installierten App stehen auf `#ebacd2` und folgen dem
      Schalter "Farben invertieren"; das App-Icon bleibt gruen.
- [ ] `docs/notes.txt`: "Button-Farben anpassen" steht auf `x` unter DONE.

## Wesentliche Entscheidungen und Abwaegungen

1. **`--accent` wird die Fuellfarbe, nicht mehr die Linienfarbe:** hell `#ebacd2`,
   invertiert `#14532d`.
   - Warum: die woertliche Umkehrung des heutigen Gruens; `#ebacd2` ist sein exaktes
     Komplement und steht heute schon im invertierten Block.
   - Auswirkung: der Token verliert seine drei anderen Rollen — Rahmen, Text der leisen
     Buttons und Fokusring — weil Rosa auf Weiss nur 1,85:1 traegt und damit als Text
     (4,5:1 gefordert) wie als Linie (3:1 gefordert) ausfaellt.
2. **Neues Token-Paar `--accentLine`:** hell `#a63f7d`, invertiert `#59c082`.
   - Warum: die leisen Buttons brauchen eine Linie, die in beiden Modi traegt — 5,8:1
     auf Weiss, 9,3:1 auf Schwarz — und zur Rose-Familie des Akzents gehoert
     (Farbton 324 Grad).
   - Auswirkung: `test/palette.test.ts` verlangt beide Werte als exaktes Komplement;
     `0xa6 + 0x59 = 0x3f + 0xc0 = 0x7d + 0x82 = 0xff`.
3. **Rahmen und Fokusring gehen auf `--ink`:** schwarz, invertiert weiss.
   - Warum: die rosa Flaeche hebt sich mit 1,85:1 nicht vom weissen Blatt ab (das Gruen
     tat das heute selbst mit 9,1:1). Ohne dunkle Kante waere der Button nur noch an
     seinem Text zu erkennen, nicht mehr an seiner Form. In der Farbumkehr gilt dasselbe
     spiegelbildlich: gruene Flaeche auf Schwarz sind 2,3:1.
   - Auswirkung: die Kante traegt die Form, die Farbe nur noch die Bedeutung.
4. **Deaktiviert behaelt Grau mit weisser Schrift**, jetzt explizit `--surface`.
   - Warum: die Regel erbt ihre Schriftfarbe heute stillschweigend vom Basis-Button, und
     der wechselt auf Schwarz. Schwarz auf `#6b7280` ergaebe 4,34:1 und verfehlt die
     geforderten 4,5:1.
   - Auswirkung: eine Zeile mehr in der Regel, dafuer unveraendertes Aussehen.
5. **Die Navigationsleiste behaelt ihre eigene Behandlung:** aktiv gefuellt wie jeder
   gefuellte Button, inaktiv ohne Flaeche mit Rose-Rahmen.
   - Warum: die Leiste soll ruhig bleiben und der aktive Bereich das einzige Farbfeld
     darin sein.
   - Auswirkung: die aktive Schaltflaeche bleibt der Anker fuer die Orientierung; sie
     setzt den Rahmen auf `--ink` zurueck, den die leise Regel auf `--accentLine` legt.
6. **Die Systemleiste kippt mit dem Schalter mit**, gesteuert vom berechneten Wert von
   `--accent`.
   - Warum: sonst waere die Leiste das einzige Stueck der App, das die Umkehr nicht
     mitmacht. Der berechnete Wert haelt die Palette als einzige Quelle der Farben.
   - Auswirkung: `useAppearance` liest `--accent` vom Wurzelelement und schreibt es in
     das `<meta name="theme-color">`; das statische Attribut in `index.html` deckt nur
     noch den ersten Anstrich ab.
7. **App-Icon und Splash-Grafik bleiben gruen.**
   - Warum: das Gruen ist das Erkennungszeichen auf dem Startbildschirm, und die Icons
     neu zu erzeugen (`scripts/generateIcons.mjs`) ist ein eigenes Thema.
   - Auswirkung: `public/favicon.svg` und die PNG-Icons bleiben unberuehrt.

## Ausgangslage

Alle Farben liegen als Token in zwei `:root`-Bloecken in `src/index.css:1-30`. Der
zweite Block gilt bei `data-inverted-colors='true'` am `<html>`-Element, gesetzt vom
Inline-Skript in `index.html:17-24` vor dem ersten Anstrich und danach von
`useAppearance.ts:14-16`.

`test/palette.test.ts` haelt zwei Regeln fest, die jede Loesung einhalten muss:

- **Keine Farbe ausserhalb der Palette** (`palette.test.ts:59`) — in keiner normalen
  Regel darf ein `#…`, `rgb(`, `white` und so weiter stehen.
- **Jeder invertierte Token ist das exakte Komplement** `255 − Kanal` des hellen, und
  beide Bloecke haben gleich viele Token (`palette.test.ts:63-73`).

`--accent` traegt heute vier Rollen:

```
--accent: #14532d  (hell)            --accent: #ebacd2  (invertiert)
   |
   +-- Fuellfarbe gefuellter Buttons        index.css:128
   +-- Rahmen aller Buttons                 index.css:125
   +-- Textfarbe der leisen Buttons         index.css:81, 193, 307
   +-- Fokusring                            index.css:100, 395
```

Daraus ergeben sich vier Erscheinungsbilder:

```
+-------------------------------------------------+
| [::] [::] [##] [::] [::]   Navigationsleiste    |  aktiv:   gruen gefuellt (index.css:87)
+-------------------------------------------------+  inaktiv: weiss, gruenes Icon (78)
|  Gerichte                            [ + ]      |  addItemButton:  gefuellt (124)
|                                                 |
|  Lasagne                        [ / ] [ x ]     |  mealNameButton: leise (301)
|  Chili                          [ / ] [ x ]     |  iconButton:     gefuellt (379)
|                                                 |
|  Vorschlaege:  Lasagne / Chili                  |  suggestionList: leise (188)
+-------------------------------------------------+
|  [  Auf die Einkaufsliste  ] [  Zurueck  ]      |  bottomBar:      gefuellt (337)
+-------------------------------------------------+
```

Gefuellt sind ausserdem alle klassenlosen Buttons — "Zurueck" auf den Unterseiten,
"Speichern", "Loeschen"/"Abbrechen" in `.pageActions`, "Item hinzufuegen" — sowie der
Mengen-Stepper (`index.css:283`) und der Update-Hinweis. Deaktivierte Buttons sind grau
gefuellt (`index.css:132`) und erben ihre weisse Schrift vom Basis-Button; sichtbar am
Stepper-Plus bei vollem Vorrat (`SupplyListRow.tsx:46`), an "Zufallsauswahl generieren"
ohne Gerichte (`WeekPlanPage.tsx:64`) und an "Anmelden" waehrend der Anmeldung
(`SignInPage.tsx:75`).

Das Gruen steckt zusaetzlich an drei Stellen ausserhalb der Palette: `index.html:10`
(`theme-color`), `vite.config.ts:25` (Manifest) und `public/favicon.svg:2` samt der
daraus erzeugten PNG-Icons.

Die Icons sind `stroke="currentColor"` (etwa `EditIcon.tsx:7`) und folgen der
Schriftfarbe ihres Buttons ohne eigene Aenderung.

## Zielbild

```
Rollen nach dem Umbau

--accent       #ebacd2 <-> #14532d   Flaeche gefuellter Buttons
--accentLine   #a63f7d <-> #59c082   Rahmen leiser Buttons          (neu)
--ink          #000000 <-> #ffffff   Text aller Buttons, Rahmen gefuellter, Fokusring
--surface      #ffffff <-> #000000   Flaeche leiser Buttons, Text deaktivierter
--fieldBorder  #4b5563 <-> #b4aa9c   nur noch Rahmen der Eingabefelder
--disabled     #6b7280 <-> #948d7f   Flaeche und Rahmen deaktivierter Buttons
```

```
gefuellt                        leise                         deaktiviert
+=====================+        +---------------------+        +=====================+
|      Speichern      |        |       Lasagne       |        |          +          |
+=====================+        +---------------------+        +=====================+
 Flaeche #ebacd2                Flaeche der Seite              Flaeche #6b7280
 Text schwarz   11,4:1          Text schwarz    21:1           Text weiss      4,8:1
 Rahmen schwarz   21:1          Rahmen #a63f7d 5,8:1           Rahmen #6b7280  4,8:1
```

```
Navigationsleiste

+-------------------------------------------------+
|  +-----+  +-----+  +=====+  +-----+  +-----+    |
|  | [=] |  | [#] |  | [#] |  | [*] |  | [o] |    |
|  +-----+  +-----+  +=====+  +-----+  +-----+    |
+-------------------------------------------------+
   ^ inaktiv: Rahmen #a63f7d,        ^ aktiv: Flaeche #ebacd2,
     schwarzes Icon, keine Flaeche     schwarzes Icon, schwarzer Rahmen
```

Bei aktiver Farbumkehr entsteht daraus durch `255 − Kanal` das gespiegelte Bild:
gefuellte Buttons `#14532d` mit weisser Schrift und weissem Rahmen, leise Buttons mit
Rahmen `#59c082` und weisser Schrift auf Schwarz.

## Abstraktionen und Wiederverwendung

Die leise Erscheinung ist nach dieser Aenderung in allen drei Faellen dieselbe — Flaeche
der Seite plus Rose-Rahmen. Statt sie dreimal zu wiederholen, traegt eine gemeinsame
Regel die Deklaration; die drei bestehenden Regeln behalten nur ihre Anordnung. Die
Textfarbe faellt dabei ganz weg, weil gefuellte und leise Buttons dieselbe Schriftfarbe
`--ink` tragen.

Die Kontrastrechnung gehoert zu `test/palette.test.ts`, weil dort die Palette schon
eingelesen und je Block in Token zerlegt wird (`colourTokens`, `paletteBlocks`). Der
neue Test nutzt diese Funktionen und ergaenzt nur die relative Luminanz nach WCAG.

- `src`
  - `index.css` - Palette und alle Button-Regeln
    - `:root` - `--accent` auf `#ebacd2`, neues `--accentLine`
    - `:root[data-inverted-colors='true']` - die exakten Komplemente
    - `button` - Flaeche `--accent`, Text und Rahmen `--ink`
    - `button:disabled` - Schriftfarbe explizit `--surface`
    - leise Buttons - eine gemeinsame Regel fuer Navigation, Vorschlaege, Namen
    - `.navigationBar button[aria-current='page']` - setzt den Rahmen auf `--ink`
    - `:focus-visible`, `h1:focus-visible` - Ring auf `--ink`
  - `shared/appearance`
    - `useAppearance.ts` - schreibt den berechneten `--accent` in `theme-color`
    - `useAppearance.test.tsx` - neu, prueft das Mitkippen
- `test`
  - `palette.test.ts` - neuer Kontrast-Test ueber die benutzten Kombinationen
- `index.html` - `theme-color` auf `#ebacd2` fuer den ersten Anstrich
- `vite.config.ts` - `theme_color` im Manifest auf `#ebacd2`
- `docs/notes.txt` - "Button-Farben anpassen" auf `x` nach DONE

## Logging und Beobachtbarkeit

Keine Aenderung. Die App protokolliert nichts, und die Farbwahl ist am Bild zu sehen.

## Umsetzung

### Phase 1: Palette und Buttons

Abhaengigkeiten: keine

Nach dieser Phase ist die Aenderung vollstaendig sichtbar und in beiden Modi pruefbar.
Der Kontrast-Test entsteht zuerst und schlaegt fehl, solange `--accentLine` fehlt.

**Aufgaben**:

- [x] `test/palette.test.ts` um die Kontrastrechnung erweitern. Die Paare nennen die
      Kombinationen, die die App wirklich zeichnet; `--accent` gegen `--surface` steht
      bewusst **nicht** darin, weil dort der Rahmen `--ink` die Form traegt.

      ```ts
      const TEXT_ON_ITS_BACKGROUND = [
        ['--ink', '--accent'],
        ['--surface', '--disabled'],
        ['--ink', '--surface'],
        ['--failure', '--surface'],
      ]

      const LINES_AGAINST_THEIR_GROUND = [
        ['--ink', '--accent'],
        ['--ink', '--surface'],
        ['--accentLine', '--surface'],
        ['--fieldBorder', '--surface'],
        ['--disabled', '--surface'],
        ['--checkMark', '--surface'],
      ]

      function relativeLuminance(colour: string) { ... }
      function contrast(one: string, other: string) { ... }
      ```

      Der Test laeuft ueber **beide** Palette-Bloecke und fordert 4.5 fuer Text und 3
      fuer Linien.
- [x] `src/index.css:11` — `--accent: #ebacd2` und darunter `--accentLine: #a63f7d`.
- [x] `src/index.css:24` — `--accent: #14532d` und `--accentLine: #59c082`.
- [x] `src/index.css:124-130` — Basis-Button umstellen:

      ```css
      button {
        border: 1px solid var(--ink);
        border-radius: 6px;
        padding: 0.5rem 1rem;
        background-color: var(--accent);
        color: var(--ink);
      }
      ```
- [x] `src/index.css:132-135` — `color: var(--surface)` in `button:disabled` ergaenzen,
      Flaeche und Rahmen bleiben `--disabled`.
- [x] Gemeinsame Regel fuer die leisen Buttons anlegen und die Farbzeilen aus
      `.navigationBar button` (`index.css:78`), `.suggestionList button`
      (`index.css:188`) und `.mealNameButton` (`index.css:301`) entfernen:

      ```css
      .navigationBar button,
      .suggestionList button,
      .mealNameButton {
        background-color: var(--surface);
        border-color: var(--accentLine);
      }
      ```

      Die Regel steht **zwischen** `button` und `button:disabled`. `.navigationBar button`
      und `button:disabled` haben dieselbe Spezifitaet (0,1,1); nur diese Reihenfolge
      sorgt dafuer, dass ein deaktivierter leiser Button grau bleibt statt leise. Heute
      ist kein leiser Button deaktivierbar — alle `disabled` sitzen an gefuellten
      (`WeekPlanPage.tsx:64,72`, `WeekPlanRow.tsx:64`, `SupplyListRow.tsx:46`,
      `SignInPage.tsx:75`) —, die Reihenfolge haelt die Regel aber fuer den naechsten
      Fall gerade.
- [x] `src/index.css:87-90` — die aktive Navigationsschaltflaeche fuellen und den
      Rahmen zurueckholen:

      ```css
      .navigationBar button[aria-current='page'] {
        background-color: var(--accent);
        border-color: var(--ink);
      }
      ```
- [x] `src/index.css:100` und `src/index.css:395` — `outline: 3px solid var(--ink)`.

**Automatisierte Verifikation**:

- [x] `npm run test` — `palette.test.ts` haelt die exakte Umkehrung auch fuer
      `--accentLine` und die neue Kontrastrechnung ist gruen.
- [x] `npm run test` — "defines every colour in the palette" bleibt gruen, es steht also
      weiterhin kein Farbwert in einer normalen Regel.
- [x] `npm run test` — alle uebrigen Testdateien bleiben gruen.
- [x] `npm run lint`
- [x] `npm run build`

**Manuelle Verifikation**:

- [ ] Auf dem Geraet im **hellen** Modus: gefuellte Buttons sind rosa mit schwarzem Text
      und schwarzer Kante — untere Knopfleiste, "Zurueck", "Speichern", das `+` im
      Seitenkopf, die Icon-Knoepfe am Gericht.
- [ ] Gericht- und Vorratsnamen sowie die Vorschlaege beim Tippen zeigen schwarzen Text
      mit Rose-Rahmen und sind von den Eingabefeldern (grauer Rahmen) zu unterscheiden.
- [ ] Die Navigationsleiste: der aktive Bereich ist das einzige Farbfeld, die anderen
      vier tragen nur den Rose-Rahmen.
- [ ] Der Mengen-Stepper am vollen Vorrat und "Zufallsauswahl generieren" ohne Gerichte
      sind grau mit weisser Schrift.
- [ ] Mit der Tastatur durch eine Seite wandern: der Fokusring ist auf der rosa Flaeche
      und auf der Seite zu sehen.
- [ ] Denselben Durchgang mit eingeschalteter Farbumkehr: gefuellte Buttons dunkelgruen
      mit weisser Schrift, leise mit hellgruenem Rahmen.

### Phase 2: Systemleiste und Splash

Abhaengigkeiten: Phase 1

Die Systemleiste des Browsers und der Splash der installierten App folgen der
Buttonfarbe und dem Schalter "Farben invertieren".

**Aufgaben**:

- [x] `index.html:10` — `content="#ebacd2"`. Das Attribut deckt den ersten Anstrich ab,
      bevor React laeuft.
- [x] `vite.config.ts:25` — `theme_color: '#ebacd2'` im Manifest.
- [x] `src/shared/appearance/useAppearance.ts` — den berechneten Akzent in das
      `<meta>` schreiben, im selben Effekt, der schon das Datenattribut setzt:

      ```ts
      function applyAccentToTheSystemBar() {
        const systemBar = document.querySelector('meta[name="theme-color"]')
        const accent = getComputedStyle(document.documentElement)
          .getPropertyValue('--accent')
          .trim()
        if (systemBar && accent) systemBar.setAttribute('content', accent)
      }
      ```
- [x] `src/shared/appearance/useAppearance.test.tsx` neu (die Endung `.tsx` ist Pflicht: `vitest.config.ts:19` gibt nur diesen Dateien jsdom): ein `<meta name="theme-color">`
      und beide Akzentwerte am Wurzelelement aufsetzen, den Haken umlegen und pruefen,
      dass das `<meta>` dem berechneten `--accent` folgt. Fehlt der Wert — in jsdom ist
      das Stylesheet nicht geladen —, bleibt das `<meta>` unveraendert.
- [ ] `docs/notes.txt` — "Button-Farben anpassen" auf `x` setzen und nach DONE
      verschieben.

**Automatisierte Verifikation**:

- [x] `npm run test` — der neue Test zu `useAppearance` ist gruen.
- [x] `npm run test` — `palette.test.ts` bleibt gruen; die Farbwerte in `index.html` und
      `vite.config.ts` liegen ausserhalb seines Zugriffs und stehen bewusst dort.
- [x] `npm run lint`
- [x] `npm run build`

**Manuelle Verifikation**:

- [ ] Die App auf dem Geraet oeffnen: die Systemleiste des Browsers ist rosa.
- [ ] Den Schalter "Farben invertieren" umlegen: die Systemleiste wird dunkelgruen, ohne
      Neuladen.
- [ ] Die installierte App vom Startbildschirm starten: das Icon ist unveraendert gruen.
      Auf dem iPhone kann die Statusleiste im installierten Betrieb dem
      `apple-mobile-web-app-status-bar-style` folgen und von `theme-color` unberuehrt
      bleiben; das ist erwartet und kein Fehler dieser Phase.

## Notizen zur Umsetzung

Hier waehrend der Umsetzung Rueckmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `src/index.css:1-30` — die Palette mit beiden Bloecken
- `test/palette.test.ts:59-73` — die zwei Regeln, die jede Farbaenderung einhalten muss
- `docs/agents/plans/2026-09-18-farben-invertieren.md` — MZP-008, die exakte Farbumkehr
  und ihre Begruendung
- WCAG 2.2, 1.4.3 Contrast (Minimum) — 4,5:1 fuer Text
- WCAG 2.2, 1.4.11 Non-text Contrast — 3:1 fuer Bedienelemente und ihre Grenzen
