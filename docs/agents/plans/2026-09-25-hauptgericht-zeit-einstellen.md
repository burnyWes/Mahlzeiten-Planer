---
date: 2026-09-25T14:18:35+00:00
git_commit: 4015a2e0b543c0be4e3c45a5185c62018dfd55ed
branch: main
story: MZP-033
topic: "Einstellung, wann das Hauptgericht gewürfelt wird"
tags: [plan, meals, weekPlan, randomPlanning, settings, firestore, ui, e2e]
status: ready
---

# PLAN: MZP-033 — Einstellung, wann das Hauptgericht gewürfelt wird

In den Einstellungen steht künftig unter „Farben invertieren“ ein Dropdown
„Hauptgericht würfeln“. Damit legt der Haushalt fest, ob die Zufallsauswahl das
Hauptgericht nur mittags, nur abends oder wie bisher mittags oder abends würfelt.

Das Vorhaben steht in `docs/notes.txt` als „Dropdown in Einstellungen: Hauptmahlzeit
|Nur Mittags|Nur Abends|Mittags und Abends|“. MZP-031 hat den Münzwurf dafür als eigene
Funktion `mainMealTimeOf` vorbereitet (Entscheidung 2 dort). Alle Entscheidungen hier
stammen aus der Befragung vom 2026-09-25.

## Akzeptanzkriterien

- In den Einstellungen steht direkt unter „Farben invertieren“ ein beschriftetes
  Dropdown „Hauptgericht würfeln“ mit den Einträgen in dieser Reihenfolge:
  „Mittags oder abends“ (Standard), „Nur mittags“, „Nur abends“.
- Die Auswahl gilt für den ganzen Haushalt. Sie liegt in Firestore unter
  `weekPlan/rollingRules`, kommt auf dem anderen Gerät an und bleibt nach dem Neuladen
  erhalten. Ein fehlender oder unbekannter Wert gilt als „Mittags oder abends“.
- „Mittags oder abends“: alles wie heute (Münzwurf pro Tag, Gegenplatz-Logik aus
  MZP-031).
- „Nur mittags“ bzw. „Nur abends“ beim Würfeln der Woche: An jedem Tag steht das
  Hauptgericht zur gewählten Zeit (sofern es ein würfelbares Hauptgericht gibt). Der
  andere Platz bekommt ein `none`-Gericht oder einen Snack. Einen Münzwurf gibt es nicht.
- „Nur mittags“ bzw. „Nur abends“ beim Würfeln einer einzelnen Zeile (Beispiel „Nur
  mittags“, „Nur abends“ gespiegelt):

  ```
  Einzelwurf   Gegenplatz                      darf bekommen
  ───────────────────────────────────────────────────────────
  Mittag       leer / none / Snack / Frühst.   nur Hauptgericht
  Mittag       Hauptgericht (von Hand)         none / Snack
  Abend        egal                            none / Snack
  ```

- Von Hand lässt sich weiterhin jedes Gericht auf jeden Platz setzen.
- Ändern der Auswahl verändert den bestehenden Plan nicht. Die Einstellung gilt ab dem
  nächsten Wurf.
- Beim Ändern gibt es keine eigene Ansage, VoiceOver liest die Auswahl am `<select>`
  selbst vor. Ein fehlgeschlagener Schreibvorgang meldet sich wie überall mit
  „Konnte nicht gespeichert werden.“
- Das Dropdown ist immer bedienbar, auch wenn der Wochenplan festgelegt ist.

## Wesentliche Entscheidungen und Abwägungen

1. **Namen:** Die Beschriftung lautet „Hauptgericht würfeln“, die Einträge „Mittags oder
   abends“ · „Nur mittags“ · „Nur abends“.
   - Warum: „Hauptgericht“ ist der Begriff aus Formular und Filter. „würfeln“ macht klar,
     dass es nur um die Zufallsauswahl geht. „oder“ statt „und“, weil pro Tag genau ein
     Hauptgericht kommt. Der Standard steht zuerst.
   - Auswirkung: Der Notizeintrag nennt andere Namen. Maßgeblich ist dieser Plan.
2. **Die Auswahl gilt für den Haushalt:** Sie liegt im Firestore-Dokument
   `weekPlan/rollingRules` mit dem Feld `mainMealTime`
   (`'lunchOrDinner' | 'lunch' | 'dinner'`) und läuft über den `WeekPlanClient`.
   - Warum: Beide Geräte würfeln nach derselben Regel. `firestore.rules:21` erlaubt
     `weekPlan/{document}` schon, die Regeln müssen also nicht von Hand ausgerollt
     werden.
   - Auswirkung: `useWeekPlan` schützt die Auswahl wie `stage` über `isStaleSnapshot`
     vor verspäteten Momentaufnahmen.
3. **Die Einstellung verbietet, die Tagesregel bleibt:** Eine feste Zeit schließt das
   Hauptgericht auf der anderen Zeit aus. „Höchstens ein Hauptgericht pro Tag“ gilt
   weiter.
   - Warum: vom Nutzer so entschieden (Frage 3, Variante A). Kein Tag bekommt zwei
     Hauptgerichte.
   - Auswirkung: `kindsBesideTheOtherMainMealTime` bekommt die Regel.
     `mainMealTimeOf(random)` wird nur bei `'lunchOrDinner'` geworfen.
4. **Generische Eintragsart `'choice'` in `SettingsPage`:** `shared/ui` bekommt ein
   fachneutrales beschriftetes `<select>`. Namen und Werte kommen aus `SignedInApp`.
   - Warum: `SettingsPage` kennt heute schon keine Fachlichkeit (`'page'`,
     `'toggle'`). So bleibt es.
5. **Die Regel ist ein eigener Parameter:** `pickMealFor` und `filledWeekPlan` bekommen
   sie als Argument `rule: MainMealTimeRule`. Der bisherige optionale Parameter
   `mainMealTime: MainMealTime | null` von `pickMealFor` bleibt für den Tageswurf in
   `filledDay` erhalten.

## Ausgangslage

```
Einstellungen (SignedInApp.tsx:160-170 → SettingsPage.tsx)
  SettingsEntry = 'page' | 'toggle'
  ┌─────────────────────────────────────────┐
  │ Farben invertieren               [ ●○ ] │  toggle, localStorage pro Gerät
  │ Artikel-Verwaltung                      │  page
  │ Kategorie-Verwaltung                    │  page
  └─────────────────────────────────────────┘

Wochenplan-Speicher (firestoreWeekPlanClient.ts)
  weekPlan/meals       Plan
  weekPlan/mealStage   Freigabe   ← Muster: observeStage / writeStage,
                                     useWeekPlan schützt über isStaleSnapshot

Würfeln (randomPlanning.ts)
  filledWeekPlan(meals, random)
   └─ filledDay: mainMealTime = mainMealTimeOf(random)       Z. 228, 50/50
                 pickMealFor(meals, plan, slot, random, mainMealTime)
  pickMealFor(meals, plan, slot, random, mainMealTime = null)   Z. 209
   └─ allowedFor → kindsBesideTheOtherMainMealTime            Z. 69-86
        Gegenplatz mainMeal         → none / Snack
        Gegenplatz anderes Gericht  → nur mainMeal
        Gegenplatz leer             → (mainMealTime ?? mainMealTimeOf(random)) === time

WeekPlanArea.tsx:117  pickMealFor(meals, weekPlanning.plan, slot, random)
WeekPlanArea.tsx:126  filledWeekPlan(meals, random)
```

## Zielbild

```
┌─────────────────────────────────────────┐
│ Einstellungen                           │
├─────────────────────────────────────────┤
│ Farben invertieren               [ ●○ ] │
│ Hauptgericht würfeln                    │
│ [ Mittags oder abends            ▾ ]    │
│ Artikel-Verwaltung                      │
│ Kategorie-Verwaltung                    │
└─────────────────────────────────────────┘
        Einträge: Mittags oder abends | Nur mittags | Nur abends
```

```
Firestore weekPlan/rollingRules { mainMealTime: 'lunchOrDinner' | 'lunch' | 'dinner' }
   ↑↓ WeekPlanClient.observeMainMealTimeRule / writeMainMealTimeRule
useWeekPlan → { …, mainMealTimeRule, changeMainMealTimeRule }
   ├─ SignedInApp → SettingsPage 'choice'-Eintrag
   └─ WeekPlanArea → pickMealFor(…, rule) / filledWeekPlan(…, rule)

randomPlanning
  filledDay: mainMealTime = rule === 'lunchOrDinner' ? mainMealTimeOf(random) : rule
  kindsBesideTheOtherMainMealTime(…, rule):
    rule ≠ lunchOrDinner und time ≠ rule          → none / Snack
    Gegenplatz mainMeal                           → none / Snack
    Gegenplatz anderes Gericht                    → nur mainMeal
    Gegenplatz leer                               → rule ≠ lunchOrDinner
                                                      ? nur mainMeal (time === rule)
                                                      : Münzwurf wie heute
```

Reihenfolge der Zufallswerte: Bei `'lunch'` und `'dinner'` entfällt der Münzwurf, also
verbraucht der Wochenwurf pro Tag einen Zufallswert weniger als bei `'lunchOrDinner'`.
Beim Einzelwurf wird ebenfalls keine Münze geworfen.

## Abstraktionen und Wiederverwendung

- `src/meals/domain/`
  - `randomPlanning.ts`
    - `MainMealTimeRule` - neu: `MainMealTime | 'lunchOrDinner'`
    - `MAIN_MEAL_TIME_RULES` - neu: `['lunchOrDinner', 'lunch', 'dinner']` (Reihenfolge
      im Dropdown)
    - `DEFAULT_MAIN_MEAL_TIME_RULE` - neu: `'lunchOrDinner'`
    - `isMainMealTimeRule(value: unknown)` - neu, für den Adapter
    - `kindsBesideTheOtherMainMealTime`, `allowedFor`, `pickMealFor`, `filledDay`,
      `filledWeekPlan` - bekommen die Regel
  - `announcements.ts` - neu `mainMealTimeRuleName(rule)` → „Mittags oder abends“ /
    „Nur mittags“ / „Nur abends“ (Ort der anderen nutzersichtbaren Namen wie
    `mealFilterName`)
- `src/meals/api/`
  - `weekPlanClient.ts` - `observeMainMealTimeRule`, `writeMainMealTimeRule`
  - `firestoreWeekPlanClient.ts` - Dokument `weekPlan/rollingRules`
  - `inMemoryWeekPlanClient.ts` - wie bei `stage`, plus
    `mainMealTimeRuleArrivesFromElsewhere`, `storedMainMealTimeRule`
- `src/meals/ui/`
  - `useWeekPlan.ts` - `mainMealTimeRule`, `changeMainMealTimeRule`
  - `WeekPlanArea.tsx` - reicht `weekPlanning.mainMealTimeRule` an das Würfeln
- `src/shared/ui/SettingsPage.tsx` - Eintragsart `'choice'`
- `src/SignedInApp.tsx` - baut den Eintrag
- `src/index.css` - Gestaltung der Zeile mit Dropdown (Muster `.mealFilter`)
- `e2e/emulatorHousehold.ts` - neu `mainMealTimeRuleOnServer()`
- `e2e/weekPlan.spec.ts` bzw. neues `e2e/settings.spec.ts` - E2E-Tests

## Umsetzung

### Phase 1: Einstellung wählen und im Haushalt speichern

Abhängigkeiten: keine

Nach dieser Phase ist das Dropdown in den Einstellungen bedienbar. Die Auswahl wird im
Haushalt gespeichert, auf das Würfeln wirkt sie noch nicht.

**Aufgaben**:

- [x] `randomPlanning.ts` (TDD, Tests in `randomPlanning.test.ts`):
  ```ts
  export type MainMealTimeRule = MainMealTime | 'lunchOrDinner'

  export const MAIN_MEAL_TIME_RULES: readonly MainMealTimeRule[] = [
    'lunchOrDinner',
    'lunch',
    'dinner',
  ]

  export const DEFAULT_MAIN_MEAL_TIME_RULE: MainMealTimeRule = 'lunchOrDinner'

  export function isMainMealTimeRule(value: unknown): value is MainMealTimeRule
  ```
  Tests: `isMainMealTimeRule` akzeptiert die drei Werte und lehnt `'breakfast'`,
  `undefined` und `42` ab.
- [x] `announcements.ts`: `mainMealTimeRuleName(rule)` mit Tests in
  `announcements.test.ts`: `lunchOrDinner` → „Mittags oder abends“, `lunch` →
  „Nur mittags“, `dinner` → „Nur abends“.
- [x] `weekPlanClient.ts`: Schnittstelle erweitern.
  ```ts
  observeMainMealTimeRule(onRule: (rule: MainMealTimeRule) => void): () => void
  writeMainMealTimeRule(rule: MainMealTimeRule): void
  ```
- [x] `inMemoryWeekPlanClient.ts`: Der dritte Parameter `initialMainMealTimeRule`
  (Standard `DEFAULT_MAIN_MEAL_TIME_RULE`) und eigene Listener wie bei `stage`, dazu
  `mainMealTimeRuleArrivesFromElsewhere(rule)` und `storedMainMealTimeRule()`.
- [x] `firestoreWeekPlanClient.ts`: `const ROLLING_RULES = 'rollingRules'`, Dokument
  `doc(firestore, WEEK_PLAN, ROLLING_RULES)`.
  - Lesen: `toMainMealTimeRule(stored)` →
    `isMainMealTimeRule(stored?.mainMealTime) ? stored.mainMealTime : DEFAULT_MAIN_MEAL_TIME_RULE`
  - Schreiben: `setDoc(rollingRules, { mainMealTime: rule })`, bei Fehler
    `onWriteFailure(WRITE_FAILED)`
- [x] `useWeekPlan.ts` (TDD, `useWeekPlan.test.tsx`): Zustand `mainMealTimeRule`
  (Start `DEFAULT_MAIN_MEAL_TIME_RULE`), `changeMainMealTimeRule(rule)` setzt ihn
  optimistisch und schreibt. Die Beobachtung folgt dem Muster von `stage`, mit
  `unconfirmedMainMealTimeRule` und `isStaleSnapshot(…, (one, other) => one === other)`.
  Tests:
  - übernimmt die Regel vom Server
  - behält eine eigene Änderung, wenn eine verspätete Momentaufnahme des alten Werts
    kommt
  - übernimmt die Regel des anderen Geräts, sobald die eigene bestätigt ist
- [x] `SettingsPage.tsx`: neue Eintragsart.
  ```ts
  | {
      kind: 'choice'
      id: string
      label: string
      options: readonly { value: string; label: string }[]
      chosen: string
      onChoose: (value: string) => void
    }
  ```
  Darstellung im `<li className="mealRow">`: `<label htmlFor={entry.id}>` über
  `<select id={entry.id}>`. So heißt das Feld für VoiceOver „Hauptgericht würfeln“.
- [x] `index.css`: Klasse `settingsChoice` für die Zeile. Beschriftung über dem
  Dropdown, das Dropdown über die volle Breite, mindestens 44 px hoch. Die Gestaltung
  von `<select>` in `.mealFilter` übernehmen, auch für die invertierten Farben.
- [x] `SignedInApp.tsx`: Eintrag zwischen `invertedColors` und `KNOWN_ITEMS_ENTRY`.
  ```ts
  {
    kind: 'choice',
    id: 'mainMealTimeRule',
    label: 'Hauptgericht würfeln',
    options: MAIN_MEAL_TIME_RULES.map((rule) => ({
      value: rule,
      label: mainMealTimeRuleName(rule),
    })),
    chosen: weekPlanning.mainMealTimeRule,
    onChoose: (value) => {
      if (isMainMealTimeRule(value)) weekPlanning.changeMainMealTimeRule(value)
    },
  }
  ```
- [x] `SignedInApp.test.tsx`:
  - `offers to invert the colours above the known items` anpassen. `shownItemNames()`
    liest den Text der Zeilen, die neue Zeile enthält also auch die Texte der Optionen.
    Beim Umsetzen prüfen und die Erwartung passend formulieren (z. B. Zeilen über
    `getByRole('combobox', { name: 'Hauptgericht würfeln' })` statt über den Text
    prüfen).
  - neu: `offers the main meal time below the inverted colours`. Die Combobox
    „Hauptgericht würfeln“ zeigt „Mittags oder abends“, die Optionen stehen in der
    Reihenfolge „Mittags oder abends“, „Nur mittags“, „Nur abends“.
  - neu: `remembers the main meal time for the household`. Mit `userEvent.selectOptions`
    „Nur abends“ wählen, danach gilt `weekPlanClient.storedMainMealTimeRule()` gleich
    `'dinner'`.
  - neu: `shows the main meal time chosen on the other device`. Nach
    `mainMealTimeRuleArrivesFromElsewhere('lunch')` zeigt das Dropdown „Nur mittags“.
  - neu: `says nothing of its own when the main meal time changes`.
  - die bestehenden axe-Tests `has no accessibility violations on the settings` (normal
    und invertiert) decken die neue Zeile mit ab und müssen grün bleiben.
- [x] `e2e/emulatorHousehold.ts`: `mainMealTimeRuleOnServer()` liest
  `weekPlan/rollingRules` → `fields.mainMealTime.stringValue ?? null` (Muster
  `weekPlanStageOnServer`).
- [x] `e2e/appearance.spec.ts` oder neues `e2e/settings.spec.ts`: Test
  `remembers the main meal time for the household after a reload`. Einstellungen
  öffnen, die Combobox „Hauptgericht würfeln“ auf „Nur abends“ stellen
  (`selectOption`), danach liefert `mainMealTimeRuleOnServer()` den Wert `'dinner'`.
  Nach dem Neuladen zeigt das Dropdown weiterhin „Nur abends“. `prepareEmulators`
  leert alle Dokumente (`emulatorHousehold.ts:50`), das neue Dokument ist also
  eingeschlossen.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/meals/domain/randomPlanning.test.ts` grün
- [x] `npx vitest run src/meals/domain/announcements.test.ts` grün
- [x] `npx vitest run src/meals/ui/useWeekPlan.test.tsx` grün
- [x] `npx vitest run src/SignedInApp.test.tsx` grün (inkl. axe)
- [x] `npm run test`, `npm run lint`, `npm run build` fehlerfrei
- [x] E2E-Test `remembers the main meal time for the household after a reload` grün

**Manuelle Verifikation**:

- [x] Auf dem Gerät mit VoiceOver: In den Einstellungen wird unter „Farben
  invertieren“ „Hauptgericht würfeln, Mittags oder abends“ vorgelesen. Die Auswahl
  lässt sich über den Picker ändern und steht nach dem Neuladen und auf dem zweiten
  Gerät genauso da.
- [x] Die Zeile ist in normalen und invertierten Farben gut lesbar.

### Phase 2: Würfeln hält sich an die Einstellung

Abhängigkeiten: Phase 1

Nach dieser Phase steht das Hauptgericht beim Würfeln zur eingestellten Zeit.

**Aufgaben**:

- [x] `randomPlanning.test.ts`: zuerst die fehlschlagenden Tests.
  - `filledWeekPlan(meals, random, 'lunch')` mit je einem Gericht jeder Art: an jedem
    Tag mittags das Hauptgericht, abends `none` oder Snack. Mit `'dinner'` gespiegelt.
  - `filledWeekPlan(…, 'dinner')` mit einer Zufallsfolge, die bei `'lunchOrDinner'`
    mittags ergäbe (`sequence([0])`): Das Hauptgericht steht trotzdem abends, also
    ohne Münzwurf.
  - `filledWeekPlan(…, 'lunch')` nur mit Hauptgerichten: 7 belegte Plätze, alle
    mittags.
  - `filledWeekPlan(…, 'lunchOrDinner')` verhält sich wie bisher (bestehende Tests
    laufen mit diesem Wert).
  - `pickMealFor` mit `'lunch'`:
    - Abend, Gegenplatz leer → `none`/Snack, nie Hauptgericht
    - Abend, Gegenplatz `none` → `none`/Snack (nicht mehr „nur Hauptgericht“)
    - Abend, nur Hauptgerichte vorhanden → `null`
    - Mittag, Gegenplatz leer → nur Hauptgericht, und es wird kein Zufallswert für
      eine Münze verbraucht
    - Mittag, Gegenplatz `none`/Snack/Frühstück → nur Hauptgericht
    - Mittag, Gegenplatz von Hand gesetztes Hauptgericht → `none`/Snack
  - `pickMealFor` mit `'dinner'`: dieselben Fälle gespiegelt, mindestens Mittag bei
    leerem Gegenplatz → `none`/Snack und Abend mit Hauptgericht am Mittag →
    `none`/Snack.
  - Frühstück und Snack-Spalte sind von der Regel unberührt.
- [x] `randomPlanning.ts`: `kindsBesideTheOtherMainMealTime(meals, plan, day, time,
  random, rule, mainMealTime)`.
  ```ts
  if (rule !== 'lunchOrDinner' && time !== rule) return KINDS_BESIDE_THE_MAIN_MEAL
  const other = shownMealIn(plan, { day, time: otherMainMealTime(time) }, meals)
  if (other !== null) return other.kind === 'mainMeal' ? KINDS_BESIDE_THE_MAIN_MEAL : MAIN_MEAL_KINDS
  return mainMealTimeFor(rule, mainMealTime, random) === time ? MAIN_MEAL_KINDS : KINDS_BESIDE_THE_MAIN_MEAL
  ```
  `mainMealTimeFor` ergibt die feste Zeit, sonst `mainMealTime ?? mainMealTimeOf(random)`.
  Die Namen dürfen sich beim Umsetzen ändern, solange sie sprechend bleiben.
- [x] `randomPlanning.ts`: `pickMealFor(meals, plan, slot, random, rule, mainMealTime =
  null)` und `filledWeekPlan(meals, random, rule)`. `filledDay` wirft
  `mainMealTimeOf(random)` nur bei `'lunchOrDinner'`, sonst gilt die feste Zeit.
  `rule` ist ein Pflichtparameter, damit kein Aufrufer die Einstellung vergisst. Die
  bestehenden Tests übergeben `'lunchOrDinner'`.
- [x] `WeekPlanArea.tsx`: `shuffleSlot` und `shuffleWeek` übergeben
  `weekPlanning.mainMealTimeRule`.
- [x] `WeekPlanArea.test.tsx`: bestehende Aufrufe laufen über den In-Memory-Client mit
  dem Standard `'lunchOrDinner'` weiter. Neue Tests:
  - Regel `'dinner'` (die Fixture in `WeekPlanArea.test.tsx:181` reicht einen dritten
    Wert an `createInMemoryWeekPlanClient` durch), Woche würfeln mit `alwaysFirst` → das Hauptgericht steht
    abends, obwohl `alwaysFirst` bei `'lunchOrDinner'` mittags ergäbe.
  - Regel `'lunch'`, Würfel am Abendessen bei nur Hauptgerichten → Ansage
    „Abendessen, kein passendes Gericht.“ (`announcements.ts:252`)
  - Umstellen der Regel ändert den bestehenden Plan nicht.
- [x] `SignedInApp.test.tsx`: ein durchgehender Test. „Nur abends“ in den Einstellungen
  wählen, zum Wochenplan wechseln, die Woche würfeln → das Hauptgericht steht abends.
- [x] `e2e/weekPlan.spec.ts`: neuer Test `rolls the main meal only in the evening when
  the household wants it so`. Bolognese (`mainMeal`) und Brot (`{ mainMeal: false }`,
  also `none`) über `storeMealOnServer` anlegen, in den Einstellungen „Nur abends“
  wählen, die Woche würfeln. Laut `weekPlanMealNamesOnServer()` steht danach an jedem
  Tag Bolognese abends und nie mittags.
- [x] `docs/notes.txt`: den Eintrag „Dropdown in Einstellungen: Hauptmahlzeit …“ auf
  `x` setzen und nach DONE verschieben.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/meals/domain/randomPlanning.test.ts` grün
- [x] `npx vitest run src/meals/ui/WeekPlanArea.test.tsx` grün
- [x] `npx vitest run src/SignedInApp.test.tsx` grün
- [x] `npm run test` grün (inkl. Architekturtest `domainLayerBoundary`)
- [x] `npm run lint`, `npm run build` fehlerfrei
- [x] E2E `e2e/weekPlan.spec.ts` grün

**Manuelle Verifikation**:

- [ ] Auf dem Gerät „Nur mittags“ einstellen und die Woche würfeln: Jeder Tag hat das
  Hauptgericht mittags. Dasselbe mit „Nur abends“. Mit „Mittags oder abends“ wechselt
  es wie bisher.
- [ ] Bei „Nur mittags“ den Würfel am Abendessen drücken: Es kommt nie ein
  Hauptgericht.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: Der E2E-Test steht in der neuen Datei `e2e/settings.spec.ts`, weil
  `appearance.spec.ts` nur die Darstellung prüft. Im bestehenden Test `offers to invert
  the colours above the known items` wird die neue Zeile über
  `expect.stringMatching(/^Hauptgericht würfeln/)` erwartet. Die genaue Prüfung der
  Combobox übernimmt `offers the main meal time below the inverted colours`.

## Verweise

- `docs/notes.txt`: „Dropdown in Einstellungen: Hauptmahlzeit |Nur Mittags|Nur Abends|
  Mittags und Abends|“
- `docs/agents/plans/2026-09-25-regeln-fuer-die-zufallsauswahl.md` (MZP-031,
  Entscheidung 2: `mainMealTimeOf` als Stelle für diese Einstellung)
- `docs/agents/plans/2026-09-18-farben-invertieren.md` (Einstellungs-Schalter)
- `docs/agents/plans/2026-09-24-wochenplan-festlegen-und-einmal-uebertragen.md`
  (Muster `weekPlan/mealStage` und Schutz gegen verspätete Momentaufnahmen)
- `firestore.rules:21` (`weekPlan/{document}`)
