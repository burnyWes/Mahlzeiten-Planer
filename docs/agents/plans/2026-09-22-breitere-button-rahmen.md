---
date: 2026-09-22T13:44:20.264965+00:00
git_commit: 442753fbcbbe2eb822afbab33018e178812959ee
branch: main
story: MZP-014
topic: "Breitere Button-Rahmen"
tags: [plan, shared, ui, css, accessibility]
status: ready
---

# PLAN: MZP-014 — Breitere Button-Rahmen

Der Rahmen der Buttons waechst von 1px auf 3px, der Fokusring von 3px auf 4px. Damit
traegt die Kante die Form des Buttons deutlich genug, und der Fokus bleibt an jedem
Element der staerkste Strich. Die Eingabefelder behalten ihren duennen grauen Rahmen;
nur im Wochenplan, wo Feld und Knopf nebeneinander stehen, gleicht sich das Feld der
neuen Knopfhoehe an.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-22.

## Akzeptanzkriterien

- [ ] Jeder Button traegt einen 3px-Rahmen: gefuellte in `--ink`, leise in
      `--accentLine`, die aktive Navigationsschaltflaeche in `--ink`, deaktivierte in
      `--disabled`.
- [ ] Eingabefelder behalten ihren 1px-Rahmen in `--fieldBorder` und bleiben dadurch von
      den leisen Buttons unterscheidbar.
- [ ] Der Haken-Winkel der Checkbox bleibt unveraendert bei 3px Kante und 5px Haken.
- [ ] Der Fokusring ist 4px `--ink` an jedem fokussierbaren Element — Buttons, Felder,
      Checkbox und Seitenueberschrift. Die Abstaende bleiben, wie sie sind: 2px
      allgemein, 4px an der Ueberschrift.
- [x] In der Wochenplan-Zeile sind Eingabefeld und Zufalls-Knopf gleich hoch und ihre
      Kanten schliessen buendig ab.
- [ ] Die untere Knopfleiste behaelt ihre Hoehe von `3rem`; `--bottomBarHeight` und das
      Seiten-Polster bleiben richtig, der Inhalt der Knoepfe laeuft nicht ueber.
- [ ] Die Aenderung gilt in beiden Farbmodi; `test/palette.test.ts` bleibt gruen, es
      steht also weiterhin kein Farbwert ausserhalb der Palette.

## Wesentliche Entscheidungen und Abwaegungen

1. **Rahmenstaerke 3px in der Basisregel `button`:** eine Zahl in `index.css:125`.
   - Warum: seit MZP-012 traegt die Kante die Form des Buttons, weil die rosa Flaeche
     nur 1,85:1 gegen das weisse Blatt steht. Alle uebrigen Button-Regeln setzen
     ausschliesslich die Farbe und erben die Staerke.
   - Auswirkung: das Stylesheet bleibt bei zwei Strichstaerken — 1px fuer alles Passive
     (Felder, Trennlinien), 3px fuer alles Bedienbare (Button-Rahmen, Haken-Winkel,
     Fokusring). Normale Buttons wachsen um 4px, die untere Knopfleiste bleibt durch ihr
     eigenes `box-sizing: border-box` unveraendert gross.
2. **Fokusring auf 4px**, Abstand bleibt 2px, in `:focus-visible` und `h1:focus-visible`.
   - Warum: bei gleicher Staerke waeren Rahmen und Ring auf einem gefuellten Button zwei
     gleich dicke schwarze Striche, getrennt nur durch 2px Luft. Der Fokus soll die
     staerkste Marke am Element bleiben.
   - Auswirkung: beide Fokusregeln bleiben im Gleichschritt; die Ueberschrift behaelt
     ihren groesseren Abstand von 4px. `:focus-visible` (`:99-102`) haengt an keinem
     Element, der staerkere Ring gilt also auch fuer Eingabefelder und die Checkbox —
     gewollt, weil der Fokus ueberall dieselbe Marke sein soll.
3. **Eingabefelder bleiben bei 1px.**
   - Warum: MZP-012 fordert ausdruecklich, dass Eingabefeld und leiser Button
     unterscheidbar sind. Diese Unterscheidung haengt an Farbe *und* Staerke; ein leeres
     Feld und ein leiser Button saehen bei gleicher Kante fast gleich aus.
   - Auswirkung: Feld und Button sind 4px unterschiedlich hoch — sichtbar nur dort, wo
     beide nebeneinander stehen, siehe 4.
4. **Feld und Knopf der Wochenplan-Zeile dehnen sich auf die Zeilenhoehe** statt mittig
   zu sitzen.
   - Warum: `.weekPlanChoice` ist die einzige Stelle der App, an der ein Feld direkt
     neben einem Button steht (`WeekPlanRow.tsx:67-81`). Der Versatz waere dort an jeder
     der sieben Zeilen zu sehen.
   - Waehrend der Umsetzung korrigiert: der Versatz laeuft andersherum als hier zunaechst
     angenommen. Chrome gibt `button` im UA-Stylesheet `box-sizing: border-box`, einem
     Text-`input` dagegen `content-box`. Gemessen steht das Feld mit 64px gegen einen
     Knopf von 44px (heute) beziehungsweise 48px (mit 3px-Kante) - das Feld ist also das
     hoehere Element, und der Versatz bestand schon vor dieser Aenderung. Deshalb dehnen
     sich **beide** Elemente; dann ist die Zeile buendig, gleich welches gerade hoeher ist.
   - Auswirkung: eine Regel fuer `.weekPlanChoice input` und `.weekPlanChoice .iconButton`.
     Der Zufalls-Knopf wird dadurch 48x64 statt 48x48, seine Trefferflaeche also groesser.
     Die
     Alternative — alle Bedienelemente global auf `box-sizing: border-box` mit
     gemeinsamer Hoehe — faellt aus: daran haengen `height: 3rem` der unteren
     Knopfleiste, `--bottomBarHeight` und das Seiten-Polster, womit aus einer
     Rahmenaenderung ein Layout-Umbau wuerde.
5. **Keine neuen Farb- oder Laengen-Token.**
   - Warum: die 3px stehen an genau einer Stelle. Ein Token dafuer waere eine
     Abstraktion ohne zweiten Verwender; `--bottomBarHeight` bleibt der einzige
     Laengen-Token, weil er tatsaechlich an drei Stellen gebraucht wird.
   - Auswirkung: `colourTokens` (`palette.test.ts:43-49`) liest ohnehin nur `#rrggbb`;
     die Pruefung auf gleich viele Token je Block bleibt unberuehrt.
6. **Ein E2E-Test misst die buendigen Kanten, kein Test misst Rahmenstaerken.**
   - Warum: ein Test gegen `border-width: 3px` pruefte den CSS-Wert gegen sich selbst.
     Die gleiche Hoehe von Feld und Knopf ist dagegen echtes Layout-Verhalten, das
     kippen kann — `meals.spec.ts:78` misst schon heute auf diese Weise.
   - Auswirkung: `e2e/weekPlan.spec.ts` bekommt einen `boundingBox`-Vergleich.

## Ausgangslage

Die Rahmenbreite der Buttons steht an genau einer Stelle, `src/index.css:124-130`:

```css
button {
  border: 1px solid var(--ink);
  ...
}
```

Alle anderen Button-Regeln aendern seit MZP-012 nur die Farbe und erben die Staerke:

```
button                                index.css:125   border: 1px solid var(--ink)
  |
  +-- .navigationBar button           index.css:136   border-color: --accentLine
  |   .suggestionList button                          (leise Buttons)
  |   .mealNameButton
  +-- .navigationBar button[current]  index.css:89    border-color: --ink
  +-- button:disabled                 index.css:141   border-color: --disabled
```

Die uebrigen Striche des Stylesheets:

```
1px   Eingabefelder (--fieldBorder, :113), Trennlinien der Liste (:184),
      Kanten der Navigations- und Knopfleiste (:63, :321), Announcer (:155),
      Update-Hinweis (:413)
3px   Haken-Winkel der Checkbox (:234-235), Fokusring (:100, :407)
5px   der Haken selbst (:248-249)
```

Der Button-Rahmen liegt mit 1px in der Gruppe der passiven Linien, obwohl er seit
MZP-012 die Form traegt: die Flaeche `#ebacd2` hebt sich mit 1,85:1 nicht vom weissen
Blatt ab, in der Farbumkehr `#14532d` mit 2,3:1 nicht vom schwarzen.

**Es gibt kein globales `box-sizing: border-box`.** Daraus ergeben sich zwei
Verhaltensweisen nebeneinander:

Chrome bringt sein eigenes `box-sizing` mit: `button` steht im UA-Stylesheet auf
`border-box`, ein Text-`input` auf `content-box`. Die Kante zaehlt beim Knopf also in
seine Hoehe hinein, beim Feld kommt sie obendrauf. Gemessen mit Playwright:

```
Knopf (border-box)          Inhalt + Polster + 2x Kante, mindestens min-height 44px

  .iconButton    24px Icon + 18 + 2x1 = 44px  ->  mit 3px Kante  48px
  Textknopf      27px Zeile + 18 + 2x1 = 47px ->  mit 3px Kante  51px
  .bottomBarContent button   height: 3rem = 54px  ->  unveraendert  54px
     Inhaltshoehe  54 - 18 Polster - 2x Kante:  34px  ->  30px
     gebraucht:    Textzeile 27px, Icon 24px          ->  passt

Feld (content-box)          min-height + Polster + 2x Kante

  input          44 + 18 + 2x1 = 64px          ->  unveraendert   64px
                 ^    ^
                 |    +-- padding 0.5rem = 9px je Seite (root font-size 18px)
                 +-- min-height: 44px (:96)
```

Jeder Knopf waechst also um 4px, weil die staerkere Kante bei `border-box` zur
Aussenhoehe addiert, waehrend der Inhalt gleich bleibt.

`--bottomBarHeight: calc(3rem + 1rem + 1px)` (`:18`) rechnet mit genau dieser festen
Knopfhoehe und traegt das Seiten-Polster (`:351-359`) — die Leiste bleibt also
unberuehrt, waehrend alle anderen Buttons 4px wachsen.

Feld und Button stehen nur an einer Stelle nebeneinander:

```
WeekPlanRow.tsx:60-87   .weekPlanChoice (:361-366, display: flex, align-items: center)

  Mo  *   +--------------------------+  +---+
          |                          |  | ~ |      Feld 64px, Knopf 44px
  .  .  . | Lasagne                  |  +---+      schon heute 20px Versatz,
          +--------------------------+             mittig ausgeglichen
```

An allen uebrigen Stellen stehen Felder unter sich — `.quantityFields` (`:202-205`)
setzt zwei Eingabefelder nebeneinander, `.field` (`:104-109`) stapelt Label und Feld —
oder Buttons unter sich (`.pageActions`, `.supplyStepper`, `.bottomBarContent`).

Die Tests, die die Aenderung beruehren koennen:

- `test/palette.test.ts:121-123` — kein Farbwert ausserhalb der `:root`-Bloecke. Eine
  Breitenangabe ist kein Farbwert, die Regel bleibt gruen.
- `e2e/meals.spec.ts:78` — prueft, dass der Announcer ueber dem Loeschen-Knopf endet.
  Die Ungleichung haelt auch bei 4px hoeheren Knoepfen, wird aber mitgeprueft.

## Zielbild

```
Strichstaerken nach der Aenderung

  1px   passiv       Eingabefelder, Trennlinien, Kanten der Leisten
  3px   bedienbar    Button-Rahmen, Haken-Winkel der Checkbox
  4px   Fokus        der Ring, an jedem Element der staerkste Strich
  5px   der Haken selbst
```

```
gefuellt                     leise                        mit Fokus
+##################+        +------------------+        ++++++++++++++++++++
|    Speichern     |        |     Lasagne      |        +##################+
+##################+        +------------------+        +|   Speichern    |+
 3px --ink                   3px --accentLine            +##################+
 Flaeche --accent            Flaeche der Seite           ++++++++++++++++++++
                                                          4px Ring, 2px Luft
```

```
Wochenplan-Zeile: das Feld fuellt die Zeilenhoehe

  vorher (mit 3px-Knopf, ohne Angleich)     nachher (align-self: stretch)

  Mo  *  +---------------+                  Mo  *  +---------------+  +###+
         |               |  +###+                  |               |  |   |
  . . .  | Lasagne       |  | ~ |           . . .  | Lasagne       |  | ~ |
         |               |  +###+                  |               |  |   |
         +---------------+                         +---------------+  +###+
         Feld 64, Knopf 48                         beide 64px, Kanten buendig
```

Bei aktiver Farbumkehr aendert sich nichts an den Staerken — nur die Farben spiegeln
sich wie seit MZP-008.

## Abstraktionen und Wiederverwendung

Die Aenderung nutzt die Struktur, die MZP-012 geschaffen hat: die Basisregel `button`
haelt Form und Staerke, die abgeleiteten Regeln nur noch die Farbe. Deshalb genuegt eine
einzige Zahl fuer alle Buttons der App, und es entsteht keine neue Abstraktion.

Der Angleich im Wochenplan bleibt bewusst lokal: `align-self` gehoert zum Kind in seinem
Flex-Kontext und wirkt nur dort, wo ein Feld tatsaechlich neben einem Knopf steht.

- `src`
  - `index.css` - Rahmenstaerke, Fokusring, Wochenplan-Zeile
    - `button` - `border: 3px`
    - `:focus-visible` - `outline: 4px`
    - `h1:focus-visible` - `outline: 4px`
    - `.weekPlanChoice input`, `.weekPlanChoice .iconButton` - `align-self: stretch`
- `e2e`
  - `weekPlan.spec.ts` - neuer Test: Feld und Zufalls-Knopf sind gleich hoch

## Logging und Beobachtbarkeit

Keine Aenderung. Die App protokolliert nichts, und die Wirkung ist am Bild zu sehen.

## Umsetzung

Abhaengigkeiten: keine

Nach dieser Phase ist die Aenderung vollstaendig sichtbar und in beiden Farbmodi
pruefbar. Der E2E-Test entsteht zuerst und schlaegt fehl, solange das Feld der
Wochenplan-Zeile 4px niedriger ist als der Knopf daneben.

**Aufgaben**:

- [x] `e2e/weekPlan.spec.ts` um den Kantentest erweitern. Der Test braucht kein Gericht:
      die sieben Zeilen stehen auch im leeren Wochenplan, der Zufalls-Knopf ist dann
      deaktiviert und hat trotzdem seine Groesse.

      ```ts
      test('lines the weekday field up with its shuffle button', async ({ page }) => {
        await page.goto('/')
        await signIn(page)
        await pressButton(page, 'Wochenplan')

        const field = await page.getByLabel('Montag', { exact: true }).boundingBox()
        const shuffle = await page
          .getByRole('button', { name: 'Zufallsgericht für Montag', exact: true })
          .boundingBox()

        expect(field!.height).toBeCloseTo(shuffle!.height, 0)
        expect(field!.y).toBeCloseTo(shuffle!.y, 0)
      })
      ```

      Die Beschriftungen stammen aus `weekdayFieldLabel` und `randomMealLabel`
      (`announcements.ts:117-123`); ohne Vorrat traegt das Feld nur den Wochentag.
- [x] `src/index.css:125` — `border: 3px solid var(--ink)`.
- [x] `src/index.css:100` — `outline: 4px solid var(--ink)`, `outline-offset` bleibt 2px.
- [x] `src/index.css:407` — `outline: 4px solid var(--ink)`, `outline-offset` bleibt 4px.
- [x] `src/index.css:381-384` — Feld und Knopf der Zeile auf die gemeinsame Zeilenhoehe:

      ```css
      .weekPlanChoice input,
      .weekPlanChoice .iconButton {
        align-self: stretch;
      }
      ```

**Automatisierte Verifikation**:

- [x] `npm run test:e2e` — der neue Test in `weekPlan.spec.ts` ist gruen: Feld und
      Zufalls-Knopf sind gleich hoch und stehen auf derselben Oberkante.
- [x] `npm run test:e2e` — `meals.spec.ts` bleibt gruen; die Positionspruefung
      (`meals.spec.ts:78`) haelt auch bei 4px hoeheren Knoepfen.
- [x] `npm run test:e2e` — die uebrigen Spezifikationen bleiben gruen, insbesondere
      `appearance.spec.ts` mit der Farbumkehr.
- [x] `npm run test` — `palette.test.ts` bleibt gruen: die neuen Breitenangaben sind
      keine Farbwerte, und die Zahl der Token je Palette-Block ist unveraendert.
- [x] `npm run test` — alle uebrigen Testdateien bleiben gruen.
- [x] `npm run lint`
- [x] `npm run format:check`
- [x] `npm run build`

**Manuelle Verifikation**:

- [ ] Auf dem Geraet im hellen Modus: die Kante ist an allen Buttons deutlich staerker —
      untere Knopfleiste, "Zurueck", "Speichern", das `+` im Seitenkopf, die Icon-Knoepfe
      am Gericht, der Mengen-Stepper am Vorrat.
- [ ] Die leisen Buttons — Navigationsleiste, Vorschlaege, Gericht- und Vorratsnamen —
      tragen dieselbe Staerke in Rose und sind weiterhin klar von den Eingabefeldern mit
      ihrer duennen grauen Kante zu unterscheiden.
- [ ] Im Wochenplan stehen Feld und Zufalls-Knopf jeder Zeile buendig; der Text im Feld
      bleibt mittig.
- [ ] Die untere Knopfleiste ist unveraendert hoch, ihre Beschriftung und die Icons
      sitzen mittig und werden nicht angeschnitten.
- [ ] Mit der Tastatur durch eine Seite wandern: der Fokusring ist auf gefuellten wie auf
      leisen Buttons als eigener, staerkerer Strich vom Rahmen zu unterscheiden.
- [ ] Denselben Durchgang mit eingeschalteter Farbumkehr.

## Notizen zur Umsetzung

**2026-09-22 — die Groessenrechnung des Entwurfs war falsch.** Der Entwurf ging fuer
Knopf und Feld von `content-box` aus. Chrome setzt `button` im UA-Stylesheet aber auf
`box-sizing: border-box`, ein Text-`input` nicht. Der neue E2E-Test hat das aufgedeckt:
gemessen wurden Feld 64px gegen Knopf 48px statt der erwarteten 64 gegen 68. Der Versatz
lief also andersherum und bestand schon vor dieser Aenderung (64 gegen 44). Folge:
`align-self: stretch` am Feld allein haette nichts bewirkt, weil das Feld bereits das
hoechste Element der Zeile ist. Jetzt dehnen sich beide Elemente. Ausgangslage, Zielbild
und Entscheidung 4 sind entsprechend berichtigt.

**Die E2E-Suite ist im Vorratsbereich instabil.** In zwei vollen Laeufen fielen wechselnde
Vorrats-Tests mit einem zu kleinen Zaehler aus ("Linsensuppe, 1." statt "4."); gezielte
Wiederholungslaeufe waren jedes Mal gruen. Ursache ist `useSupplies.ts:25-30`: der Hook
veroeffentlicht jede Momentaufnahme ungeprueft, eine verspaetete Momentaufnahme
ueberschreibt also den eigenen, noch unbestaetigten Schreibvorgang — dieselbe Klasse, die
`useShoppingList` ueber `unconfirmedWrites` abfaengt. Unabhaengig von dieser Aenderung, als
Bug in `docs/notes.txt` vermerkt.

## Verweise

- `src/index.css:124-130` — die Basisregel, die Form und Staerke aller Buttons haelt
- `src/index.css:99-102`, `src/index.css:406-409` — die beiden Fokusregeln
- `src/index.css:341-349` — die untere Knopfleiste mit ihrem eigenen `box-sizing`
- Chrome UA-Stylesheet — `button` steht dort auf `box-sizing: border-box`, ein
  Text-`input` nicht; am 2026-09-22 mit Playwright nachgemessen
- `src/meals/ui/WeekPlanRow.tsx:60-87` — die einzige Zeile mit Feld und Knopf
  nebeneinander
- `docs/agents/plans/2026-09-22-buttons-invertieren.md` — MZP-012, warum die Kante die
  Form traegt
- WCAG 2.2, 1.4.11 Non-text Contrast — 3:1 fuer Bedienelemente und ihre Grenzen
- WCAG 2.2, 2.4.13 Focus Appearance — der Fokus als eigene, ausreichend starke Marke
