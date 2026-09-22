---
date: 2026-09-22
git_commit: 49057c6a1b5babbdee87610b43cd6a912d54f8ab
branch: main
story: MZP-010
topic: "Navigationsleiste mit Icons und ein Bereich fuer Vorraete"
tags: [plan, navigation, shared-ui, meals, css]
status: ready
---

# PLAN: MZP-010 — Navigationsleiste mit Icons und ein Bereich fuer Vorraete

Die Navigationsleiste traegt heute drei Textknoepfe und ein Zahnrad. Sie soll
ausschliesslich Icons zeigen und um einen fuenften Bereich **Vorraete** wachsen, der
vorerst leer bleibt. Spaeter sollen dort Gerichte mit einer Anzahl stehen — das
Eisfach-Memory aus `docs/notes.txt`.

## Akzeptanzkriterien

- Die Navigationsleiste zeigt fuenf Knoepfe; keiner traegt sichtbaren Text.
- Reihenfolge: Einkaufsliste, Wochenplan, Gerichte, Vorraete, Einstellungen.
- Jeder Knopf traegt seinen Bereichsnamen als `aria-label`. VoiceOver liest
  unveraendert "Einkaufsliste", "Wochenplan", "Gerichte", "Einstellungen" und neu
  "Vorraete".
- Der aktive Knopf traegt weiterhin `aria-current="page"`.
- Alle fuenf Knoepfe sind gleich breit und mindestens 44 x 44 px gross.
- Der Knopf "Vorraete" oeffnet eine Seite mit der Ueberschrift "Vorraete", die beim
  Betreten den Fokus bekommt. Sonst steht dort nichts.
- Die Navigationsleiste bleibt auf der Vorraete-Seite sichtbar.
- Die axe-Pruefung bleibt in allen Bereichen ohne Befund, auch mit invertierten Farben.
- Die bestehenden e2e-Ablaeufe laufen unveraendert durch; sie steuern ueber die
  gesprochenen Namen.

## Wesentliche Entscheidungen und Abwaegungen

1. **Aufteilung der Leiste:** Alle fuenf Knoepfe bekommen `flex: 1` und fuellen die
   volle Breite.
   - Warum: gleichmaessiger Rhythmus, und die Einstellungen bleiben als letzter Knopf
     ganz rechts.
   - Auswirkung: die Ausnahme `li.navigationBarIcon` (`flex: none`) entfaellt, das
     Zentrieren wandert auf `.navigationBar button`, der `gap` sinkt von `0.5rem` auf
     `0.25rem`.

2. **`gap` auf `0.25rem`:** statt der heutigen `0.5rem`.
   - Warum: bei fuenf Spalten und 280 px Geraetebreite bleiben mit `0.5rem` nur rund
     43 px je Knopf — unter der geforderten Trefferflaeche von 44 px. Mit `0.25rem`
     sind es rund 46 px.
   - Auswirkung: keine feste `min-width` noetig, die die Zeile sprengen koennte.

3. **Vorraete gehoeren zum Kontext `meals`:** `src/meals/ui/SuppliesArea.tsx`.
   - Warum: Vorraete zaehlen Gerichte — derselbe Begriff wie in `meals`. Der
     Architektur-Skill legt einen zweiten Kontext erst an, wenn ein Begriff
     nachweislich Verschiedenes bedeutet. Der Wochenplan ist der Praezedenzfall im
     Code: er ordnet Gerichten Tage zu und liegt aus genau diesem Grund in `meals`.
   - Auswirkung: `eslint.config.js` und `test/domainLayerBoundary.test.ts` bleiben
     unangetastet. Spaetere `domain/supplies.ts` und `api/suppliesClient.ts` duerfen
     `Meal` direkt benutzen, ohne Umweg ueber `SignedInApp`.

4. **`Area.text` entfaellt, `icon` wird Pflicht:** `Area<Id> = { id, label, icon }`.
   - Warum: nach der Aenderung hat kein Bereich mehr eine Textbeschriftung.
   - Auswirkung: `spokenNameOf` faellt weg, `aria-label` ist immer `label` — eine
     Fallunterscheidung weniger.

5. **Kein `title`-Tooltip an den Knoepfen:** nur `aria-label`.
   - Warum: die App wird auf dem Handy bedient, dort erscheint kein Tooltip. VoiceOver
     liest bereits den vollen Namen.
   - Auswirkung: keine zweite Namensquelle, die auseinanderlaufen kann.

6. **Alle Navigationsicons in `src/shared/ui`:** `ChecklistIcon`, `CalendarIcon`,
   `PlateIcon`, `SnowflakeIcon` neben dem vorhandenen `SettingsIcon`.
   - Warum: `SettingsIcon` als bisher einziges Navigationsicon liegt bereits dort. Die
     Icons importieren nichts und tragen keinen Fachbegriff, die `shared`-Regel bleibt
     gewahrt.
   - Auswirkung: `SignedInApp` holt alle fuenf aus einem Ordner.

## Ausgangslage

`src/shared/ui/NavigationBar.tsx` ist generisch. Jeder Bereich ist ein `Area<Id>` mit
`label` (gesprochener Name), optionalem `text` (verkuerzte Sichtbeschriftung) und
optionalem `icon`. `spokenNameOf` (`NavigationBar.tsx:15-19`) setzt `aria-label` nur,
wenn `icon` oder `text` gesetzt ist — bei "Gerichte" steht der Name schon im Knopf.

`src/SignedInApp.tsx:26-31` haelt die Liste:

```
const AREAS = [
  { id: 'shopping',  label: 'Einkaufsliste', text: 'Einkauf' },
  { id: 'weekPlan',  label: 'Wochenplan',    text: 'Woche'   },
  { id: 'meals',     label: 'Gerichte'                       },
  { id: 'settings',  label: 'Einstellungen', icon: <SettingsIcon /> },
]
```

Sichtbar (`src/index.css:56-99`):

```
+-----------------------------------------------------------+
| [   Einkauf   ] [   Woche   ] [  Gerichte  ]        [ * ]  |
+-----------------------------------------------------------+
   flex:1           flex:1        flex:1     navigationBarIcon
                                             (flex:none, min-width 44px)
```

`SignedInApp.tsx:139-178` schaltet ueber `activeArea` zwischen vier Zweigen. Jeder
Bereich bekommt `navigation` als Prop und rendert sie ueber seinem `<main>`; die
Ueberschrift holt sich ueber `useHeadingFocus` beim Betreten den Fokus.

Icons sind handgeschriebene SVGs nach festem Muster (`viewBox="0 0 24 24"`,
`fill="none"`, `stroke="currentColor"`, `strokeWidth="2"`, `strokeLinecap="round"`,
`strokeLinejoin="round"`, `className="buttonIcon"`, `aria-hidden="true"`,
`focusable="false"`). Eine Icon-Bibliothek gibt es nicht.

Kontextgrenzen werden maschinell erzwungen: `eslint.config.js:8` listet
`contexts = ['shopping', 'meals']`, `test/domainLayerBoundary.test.ts` prueft die
Regeln. Da die Vorraete in `meals` landen, bleibt beides unberuehrt.

## Zielbild

```
+-----------------------------------------------------------+
| [ Liste ][ Kalender ][ Teller ][ Flocke ][ Zahnrad ]       |
+-----------------------------------------------------------+
  alle flex:1, gap 0.25rem, volle Breite
  aria-label: Einkaufsliste | Wochenplan | Gerichte | Vorraete | Einstellungen
```

Die Vorraete-Seite:

```
+--------------------------------+
| [L][K][T][F][Z]                |
+--------------------------------+
|                                |
| Vorraete                       |  <- h1, tabIndex -1, bekommt den Fokus
|                                |
|                                |
+--------------------------------+
```

## Abstraktionen und Wiederverwendung

Genutzt wird, was da ist: `NavigationBar` bleibt generisch, `useHeadingFocus` gibt der
neuen Ueberschrift den Fokus, `.page`, `.pageBelowNavigation` und `.pageHeader` tragen
das Layout, `.buttonIcon` die Icon-Groesse. Neu entstehen nur vier SVG-Komponenten und
eine Seite.

- `src/shared/ui`
  - `NavigationBar.tsx` — `Area` verschlankt, `spokenNameOf` entfaellt
    - `Area` — `text` weg, `icon` verpflichtend
    - `spokenNameOf` — geloescht, `aria-label` ist immer `label`
  - `ChecklistIcon.tsx` — neu, Einkaufsliste
  - `CalendarIcon.tsx` — neu, Wochenplan
  - `PlateIcon.tsx` — neu, Gerichte
  - `SnowflakeIcon.tsx` — neu, Vorraete
- `src/meals/ui`
  - `SuppliesArea.tsx` — neu, Navigationsleiste plus Ueberschrift "Vorraete"
- `src`
  - `SignedInApp.tsx` — `AREAS` mit fuenf Icons, neuer Zweig fuer `supplies`
  - `SignedInApp.test.tsx` — Leistentest umgestellt, Tests fuer den neuen Bereich
- `src/index.css` — `navigationBarIcon` entfaellt, Zentrierung auf alle Knoepfe
- `.claude/projekt.md` — Satz zum Kontext **meals** um die Vorraete erweitert

## Logging und Beobachtbarkeit

Keine Aenderung. Die Leiste meldet nichts ueber den `Announcer`; der Bereichswechsel
wird allein ueber den Fokus auf der Ueberschrift hoerbar, wie in jedem anderen Bereich.

## Umsetzung

### Phase 1: Text durch Icons ersetzen

Abhaengigkeiten: keine

Die drei Textknoepfe bekommen Icons, das Layout stellt auf gleich breite Spalten um,
und `Area` verliert die Textvariante.

**Aufgaben**:

- [x] `src/shared/ui/ChecklistIcon.tsx` anlegen — Checkliste mit zwei Haken, abgeleitet
      von lucide `list-checks` (ISC, https://lucide.dev/icons/list-checks). Muster der
      bestehenden Icons uebernehmen.

      ```tsx
      <path d="m3 5 1.5 1.5L7.5 3.5" />
      <path d="M11 6h10" />
      <path d="m3 11 1.5 1.5L7.5 9.5" />
      <path d="M11 12h10" />
      <circle cx="4.5" cy="18" r="1.2" />
      <path d="M11 18h10" />
      ```

- [x] `src/shared/ui/CalendarIcon.tsx` anlegen — lucide `calendar` (ISC,
      https://lucide.dev/icons/calendar).

      ```tsx
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      ```

- [x] `src/shared/ui/PlateIcon.tsx` anlegen — flacher Teller im Profil mit drei
      Dampfschwaden, eigene Zeichnung.

      ```tsx
      <path d="M8 10.5c1.2-2-1.2-3.5 0-5.5" />
      <path d="M12 10.5c1.2-2-1.2-3.5 0-5.5" />
      <path d="M16 10.5c1.2-2-1.2-3.5 0-5.5" />
      <path d="M3 13.5h18" />
      <path d="M5 13.5a9 9 0 0 0 14 0" />
      ```

- [x] `src/shared/ui/NavigationBar.tsx`: `Area<Id>` auf `{ id, label, icon }`
      reduzieren, `icon` verpflichtend als `ReactNode`. `spokenNameOf` loeschen,
      `aria-label={area.label}` direkt setzen, den Knopfinhalt auf `{area.icon}`
      reduzieren und das `className` am `<li>` entfernen.

- [x] `src/SignedInApp.tsx`: `AREAS` auf Icons umstellen.

      ```tsx
      const AREAS = [
        { id: 'shopping', label: 'Einkaufsliste', icon: <ChecklistIcon /> },
        { id: 'weekPlan', label: 'Wochenplan', icon: <CalendarIcon /> },
        { id: 'meals', label: 'Gerichte', icon: <PlateIcon /> },
        { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
      ] as const satisfies readonly Area<string>[]
      ```

- [x] `src/index.css`: die beiden Bloecke `.navigationBar li.navigationBarIcon` und
      `.navigationBar li.navigationBarIcon button` (im Ausgangszustand Zeilen 84-94)
      loeschen; `navigationBarIcon` kommt danach nirgends mehr vor. Die
      Zentrierung nach `.navigationBar button` ziehen und den `gap` in
      `.navigationBar ul` auf `0.25rem` setzen.

      ```css
      .navigationBar ul {
        gap: 0.25rem;
      }

      .navigationBar button {
        width: 100%;
        background-color: var(--surface);
        color: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      ```

- [x] `src/SignedInApp.test.tsx`: den Test "names the four areas in the order of their
      use" umstellen — die `aria-label`-Reihe bleibt, die Erwartung an die Textinhalte
      wird zu "kein Knopf traegt sichtbaren Text".

      ```ts
      expect(
        within(screen.getByRole('navigation'))
          .getAllByRole('button')
          .map((tab) => tab.textContent),
      ).toEqual(['', '', '', ''])
      ```

**Automatisierte Verifikation**:

- [x] `npm run test` laeuft gruen, insbesondere `SignedInApp.test.tsx`
      "names the four areas in the order of their use", "switches to the week plan and
      marks it as the current area", "switches to the meals area and marks it as the
      current area" und "reaches the settings through the gear button".
- [x] Die axe-Tests "has no accessibility violations on the shopping list", "... on the
      meals area", "... on the week plan", "... on the settings" und "... on the
      inverted settings" bleiben ohne Befund.
- [x] `test/palette.test.ts` bleibt gruen — die neuen Icons setzen keine eigene Farbe,
      sie erben ueber `stroke="currentColor"`.
- [x] `npm run lint` laeuft ohne Befund, `jsx-a11y` eingeschlossen.
- [x] `npm run build` uebersetzt fehlerfrei — der Typfehler zeigt an, falls ein Bereich
      ohne `icon` uebrig geblieben ist.

**Manuelle Verifikation**:

- [x] Auf dem Geraet: Checkliste, Kalender und Teller sind bei 24 px als das erkennbar,
      was sie darstellen — auch mit invertierten Farben.
- [x] VoiceOver liest die vier Knoepfe als "Einkaufsliste", "Wochenplan", "Gerichte",
      "Einstellungen" und nennt den aktiven als aktuelle Seite.
- [x] Alle vier Knoepfe sind gleich breit, das Zahnrad steht ganz rechts, und jeder
      Knopf laesst sich mit dem Daumen sicher treffen.

### Phase 2: Vorraete als fuenfter Bereich

Abhaengigkeiten: Phase 1

Der neue Tab mit Schneeflocke und eine Seite, die vorerst nur ihre Ueberschrift traegt.

**Aufgaben**:

- [x] `src/shared/ui/SnowflakeIcon.tsx` anlegen — lucide `snowflake` (ISC,
      https://lucide.dev/icons/snowflake).

      ```tsx
      <path d="m10 20-1.25-2.5L6 18" />
      <path d="M10 4 8.75 6.5 6 6" />
      <path d="m14 20 1.25-2.5L18 18" />
      <path d="m14 4 1.25 2.5L18 6" />
      <path d="m17 21-3-6h-4" />
      <path d="m17 3-3 6 1.5 3" />
      <path d="M2 12h6.5L10 9" />
      <path d="m20 10-1.5 2 1.5 2" />
      <path d="M22 12h-6.5L14 15" />
      <path d="m4 10 1.5 2L4 14" />
      <path d="m7 21 3-6-1.5-3" />
      <path d="m7 3 3 6h4" />
      ```

- [x] `src/meals/ui/SuppliesArea.tsx` anlegen — nimmt `navigation` entgegen und rendert
      die Ueberschrift mit `useHeadingFocus`, wie `SettingsPage` es vormacht.

      ```tsx
      export function SuppliesArea({ navigation }: { navigation: ReactNode }) {
        const heading = useHeadingFocus()

        return (
          <>
            {navigation}
            <main className="page pageBelowNavigation">
              <div className="pageHeader">
                <h1 ref={heading} tabIndex={-1}>
                  Vorräte
                </h1>
              </div>
            </main>
          </>
        )
      }
      ```

- [x] `src/SignedInApp.tsx`: `AREAS` um den Bereich `supplies` vor den Einstellungen
      erweitern und einen Zweig ergaenzen, der `SuppliesArea` mit der Navigation
      rendert.

      ```tsx
      { id: 'supplies', label: 'Vorräte', icon: <SnowflakeIcon /> },
      ```

- [x] `.claude/projekt.md`: den Satz zum Kontext **meals** um die Vorraete erweitern,
      damit die Landkarte den neuen Bereich kennt.

- [x] `src/SignedInApp.test.tsx`: den Leistentest auf fuenf Bereiche erweitern — Name
      des Tests und `tabNames()`-Erwartung.

      ```ts
      expect(tabNames()).toEqual([
        'Einkaufsliste',
        'Wochenplan',
        'Gerichte',
        'Vorräte',
        'Einstellungen',
      ])
      ```

- [x] `src/SignedInApp.test.tsx`: einen Test ergaenzen, der die Vorraete oeffnet und
      Ueberschrift, Fokus und `aria-current` prueft.

      ```ts
      it('switches to the supplies and marks them as the current area', async () => {
        renderSignedInApp()

        await goToArea('Vorräte')

        expect(screen.getByRole('heading', { name: 'Vorräte' })).toHaveFocus()
        expect(screen.getByRole('button', { name: 'Vorräte' })).toHaveAttribute(
          'aria-current',
          'page',
        )
      })
      ```

- [x] `src/SignedInApp.test.tsx`: einen Test ergaenzen, der zeigt, dass die Seite ausser
      der Ueberschrift nichts enthaelt.

      ```ts
      it('leaves the supplies empty for now', async () => {
        renderSignedInApp()

        await goToArea('Vorräte')

        const page = within(screen.getByRole('main'))
        expect(page.queryAllByRole('listitem')).toEqual([])
        expect(page.queryAllByRole('button')).toEqual([])
      })
      ```

- [x] `src/SignedInApp.test.tsx`: einen axe-Test fuer den neuen Bereich ergaenzen.

      ```ts
      it('has no accessibility violations on the supplies', async () => {
        const { rendered } = renderSignedInApp()

        await goToArea('Vorräte')

        expect(await accessibilityViolations(rendered.container)).toEqual([])
      })
      ```

- [x] `src/SignedInApp.test.tsx`: einen Test ergaenzen, der zeigt, dass ein Besuch der
      Vorraete die Einkaufsliste unberuehrt laesst — nach dem Vorbild von "leaves the
      shopping list as it was after a visit to the meals area".

**Automatisierte Verifikation**:

- [x] `npm run test` laeuft gruen, einschliesslich der neuen Tests "switches to the
      supplies and marks them as the current area", "leaves the supplies empty for now"
      und "has no accessibility violations on the supplies". Der erste belegt zugleich,
      dass die Leiste auf der Vorraete-Seite steht — ohne sie gaebe es den Knopf mit
      `aria-current` dort nicht.
- [x] `test/domainLayerBoundary.test.ts` bleibt gruen — `SuppliesArea` liegt in
      `meals/ui` und importiert nur `react` und `shared/ui`.
- [x] `npm run lint` laeuft ohne Befund.
- [x] `npm run build` uebersetzt fehlerfrei.
- [x] `npm run test:e2e` laeuft durch — die Ablaeufe in `e2e/meals.spec.ts`,
      `e2e/weekPlan.spec.ts`, `e2e/shoppingList.spec.ts` und `e2e/appearance.spec.ts`
      steuern ueber die gesprochenen Namen und bleiben unveraendert.

**Manuelle Verifikation**:

- [ ] Auf dem Geraet: die Schneeflocke ist bei 24 px erkennbar, auch mit invertierten
      Farben.
- [ ] VoiceOver: der fuenfte Knopf heisst "Vorräte", beim Betreten liest VoiceOver
      "Vorräte, Überschrift Ebene 1" und danach ist die Seite still.
- [ ] Alle fuenf Knoepfe sind gleich breit, das Zahnrad steht ganz rechts, und jeder
      Knopf laesst sich mit dem Daumen sicher treffen.

## Notizen zur Umsetzung

Hier waehrend der Umsetzung Rueckmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `src/shared/ui/NavigationBar.tsx` — die generische Leiste
- `src/SignedInApp.tsx:26-31` — `AREAS`
- `src/index.css:56-99` — Layout der Leiste
- `src/shared/ui/SettingsPage.tsx` — Vorlage fuer eine Seite mit Navigation und Fokus
- `src/meals/ui/WeekPlanArea.tsx` — Praezedenzfall: Wochenplan ohne eigenen Kontext
- `eslint.config.js:8` und `test/domainLayerBoundary.test.ts` — Kontextgrenzen
- `docs/agents/plans/2026-09-15-gerichteseite-und-navigationsleiste.md` — Herkunft der
  Leiste
- `docs/notes.txt` — "Eisfach-Memory" unter TODO
- lucide (ISC) — https://lucide.dev/icons/list-checks,
  https://lucide.dev/icons/calendar, https://lucide.dev/icons/snowflake
