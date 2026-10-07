---
date: 2026-10-07T06:51:09.034086+00:00
git_commit: 5a82f5018fedd443cb0d367d9aeb3ffbd9828d76
branch: main
story: MZP-039
topic: "Reste am nächsten Tag"
tags: [plan, meals, meal, weekPlan, randomPlanning, leftovers, WeekPlanArea, WeekPlanRow, MealFormPage, SettingsPage, firestoreWeekPlanClient, voiceover]
status: done
---

# PLAN: MZP-039 — Reste am nächsten Tag

Manche Gerichte reichen für zwei Tage. Ein Gericht bekommt dafür das Häkchen „Reste“.
Fällt es beim Würfeln auf einen Platz, steht es am Folgetag zur selben Tageszeit noch
einmal im Plan, als Reste gekennzeichnet. Reste werden beim Übertragen weder
eingekauft noch aus dem Vorrat genommen. In den Einstellungen lässt sich die
Reste-Regel für alle Geräte gemeinsam ein- und ausschalten.

Herkunft: `docs/notes.txt`, TODO-Eintrag „Reste“.

## Akzeptanzkriterien

- Im Gericht-Formular steht unter „Snack“ das Häkchen „Reste“, mit sichtbar etwas mehr
  Abstand zu „Snack“ als zwischen den anderen Häkchen. Es ist anfangs aus, wird
  gespeichert und erscheint auf allen Geräten. Gerichte ohne das Feld in Firestore
  gelten als „keine Reste“.
- „Reste“ ist unabhängig von Hauptgericht/Frühstück/Snack. Alle vier Häkchen lassen
  sich frei kombinieren, nur die drei Arten schließen sich wie bisher gegenseitig aus.
- In den Einstellungen steht direkt unter „Hauptgericht würfeln“ der Schalter
  „Reste einplanen“. Er ist anfangs an und gilt für alle Geräte gemeinsam
  (`weekPlan/rollingRules`). Ändert man „Hauptgericht würfeln“, bleibt
  „Reste einplanen“ erhalten, und umgekehrt.
- Bei eingeschaltetem Schalter gilt für jedes Würfeln, also für „Zufallsauswahl
  generieren“ und für das Würfeln eines einzelnen Platzes:
  Fällt ein Gericht mit Reste-Häkchen auf einen Platz und ist es dort **nicht** durch
  den Vorrat gedeckt, steht es am Folgetag zur **selben Tageszeit** noch einmal, als
  Reste gekennzeichnet.
- Bei ausgeschaltetem Schalter entstehen beim Würfeln keine Reste. Würfelt man einen
  einzelnen Platz, bleiben vorhandene Reste-Plätze unverändert. „Zufallsauswahl
  generieren“ würfelt wie bisher den ganzen Plan neu, alte Reste-Plätze verschwinden
  dabei also mit.
- Ein Gericht, das von Hand gewählt wird, erzeugt keine Reste.
- Fällt das Gericht auf den letzten Tag des Zeitraums, entstehen keine Reste.
- Würfelt man einen einzelnen Platz, überschreiben die Reste den Folgetag, ganz gleich,
  was dort stand. Die Ansage nennt beide Plätze, z. B.
  „Abendessen, Bolognese. Dienstag, 22. September, Abendessen, Reste von Bolognese.“
- Würfelt man die ganze Woche, bleibt ein Reste-Platz stehen und wird nicht noch einmal
  gewürfelt. Für die Regel „ein Hauptgericht pro Tag“ zählt er wie ein
  gewürfeltes Gericht. Reste erzeugen keine weiteren Reste.
- Ein Reste-Platz zeigt in der Spalte der Schneeflocke ein Box-Icon (Vorlage lucide
  `package`), in der Tages- und in der Wochenansicht, beim Bearbeiten und im
  festgelegten Plan. VoiceOver hängt „, Reste“ an, so wie heute „, im Vorrat“.
- Wird ein Reste-Platz oder sein Original (der Platz am Vortag zur selben Tageszeit)
  von Hand geändert, geleert oder neu gewürfelt, bleibt das Gericht auf dem
  Reste-Platz stehen, verliert aber das Reste-Kennzeichen. Bringt ein neues Würfeln des
  Originals wieder ein Reste-Gericht, gilt die Überschreib-Regel oben.
- „Auf die Einkaufsliste“ kauft für einen Reste-Platz nichts ein und bucht keinen
  Vorrat ab. Ein Reste-Platz zählt auch nicht mit, wenn ermittelt wird, wie viele
  Portionen eines Vorrats schon verplant sind, und zeigt nie die Schneeflocke.
- Die Überschrift „N von M“ zählt Reste-Plätze als geplant mit (sie sind belegt).
- Ein Plan, der vor dieser Änderung gespeichert wurde, lädt unverändert und hat keine
  Reste-Plätze.

## Wesentliche Entscheidungen und Abwägungen

1. **Wiederholung zur selben Tageszeit:** Mo abends → Di abends.
   - Warum: Das ist leicht zu erklären und passt zu „Nur mittags“/„Nur abends“.
   - Auswirkung: Der Reste-Platz ist `{ date: dateAfter(period, slot.date), time: slot.time }`.
2. **Nur Würfeln erzeugt Reste:** ganze Woche und ein einzelner Platz, nicht die
   Wahl von Hand.
   - Warum: Wer von Hand wählt, behält die Kontrolle. Ein zweiter Platz, der sich
     unbemerkt mitändert, wäre mit VoiceOver unangenehm.
   - Auswirkung: `withMealIn` bleibt ohne Reste-Logik. Die Reste setzt eine eigene
     Domänenfunktion, die nur die Würfelwege aufrufen.
3. **Folgetag wird überschrieben** (beim Würfeln eines einzelnen Platzes).
   - Warum: verlässlich vorhersagbar, gleich wie beim Würfeln der ganzen Woche.
   - Auswirkung: Die Ansage beim Würfeln eines Platzes nennt den Folgetag mit.
4. **Kennzeichen fällt bei Änderung weg, Gericht bleibt:** Der Reste-Platz behält
   sein Gericht, wird aber ein normaler Platz.
   - Warum: Entscheidung des Nutzers. Ein Platz ohne Original soll nicht
     „Reste“ heißen, das Gericht soll aber nicht verschwinden.
   - Auswirkung: `withMealIn(plan, slot, id)` entfernt das Kennzeichen an `slot` und
     am Platz des Folgetags zur selben Tageszeit.
5. **Fachbegriff am Gericht:** `Meal.leftovers: boolean`, Firestore-Feld `leftovers`
   (fehlt = `false`).
   - Warum: Das Merkmal ist unabhängig von `MealKind`, genauso wie `hidden`.
   - Auswirkung: `NewMeal`, `MealDraft`, `createMeal`, `withHiding`, Mapping,
     In-Memory-Fakes, Formular und Testdaten bekommen das Feld.
6. **Der Plan merkt sich Reste:** `WeekPlan.leftoverSlots: readonly PlanSlot[]`, in
   Firestore `weekPlan/datedMeals.leftovers: [{ date, time }]` (fehlt = `[]`).
   - Warum: Eine Wiederholung lässt sich an der `MealId` allein nicht erkennen.
   - Auswirkung: `sameWeekPlan` vergleicht `leftoverSlots` mit, damit
     `isStaleSnapshot` in `useWeekPlan` greift. `withPeriod` behält nur Reste-Plätze,
     deren Vortag (das Original) ebenfalls im neuen Zeitraum liegt, `emptyWeekPlan`/`emptied` haben keine. Eine ältere App-Version
     verliert beim Schreiben die Kennzeichen; das ist hingenommen, weil beide Geräte
     über den Service Worker aktualisiert werden.
7. **Würfelregeln als ein Wert:** `RollingRules = { mainMealTime: MainMealTimeRule;
   plansLeftovers: boolean }`, Firestore `weekPlan/rollingRules` mit
   `{ mainMealTime, leftovers }` (fehlt `leftovers` = `true`).
   - Warum: Zwei Schreibvorgänge mit `setDoc` auf dasselbe Dokument würden sich
     gegenseitig überschreiben.
   - Auswirkung: `WeekPlanClient.observeRollingRules/writeRollingRules` ersetzen
     `observeMainMealTimeRule/writeMainMealTimeRule`. `useWeekPlan` hält
     `rollingRules` und bietet `changeMainMealTimeRule` und `changeLeftoverPlanning`,
     die beide den ganzen Wert schreiben.
8. **Vorrats-Bedingung beim Würfeln:** Ob das Original durch den Vorrat gedeckt ist,
   wird im Moment des Würfelns mit `isSuppliedIn` am bis dahin gewürfelten Plan
   entschieden. Spätere Vorratsänderungen ändern ein gesetztes Kennzeichen nicht.
   - Warum: Das Kennzeichen soll stabil sein und nicht unbemerkt umspringen.
   - Auswirkung: `filledWeekPlan` und das Würfeln eines Platzes brauchen `supplies`.
9. **Icon:** Box nach lucide `package`, in der Spalte `supplyMark`.
   - Warum: Ausdrücklicher Wunsch, und ein Reste-Platz ist nie zugleich gedeckt, die
     Spalte wird also nie doppelt belegt.
   - Auswirkung: neues `PackageIcon`. Ein `SlotMark = 'supply' | 'leftovers' | null`
     ersetzt das bisherige `inSupply: boolean` in Zeile, Label und Ansagen.
10. **Ansagen:** Nur die Ansage beim Würfeln eines einzelnen Platzes nennt Reste.
    Die Ansagen für die ganze Woche und für die Übertragung bleiben wortgleich.

## Ausgangslage

```
Meal (src/meals/domain/meal.ts:20)
  name, items, ingredientNotes, recipe, categories, hidden, kind
       └─ Firestore meals/{id}: … hidden, mainMeal, breakfast, snack
          (src/meals/api/firestoreMealsClient.ts:72-84)

WeekPlan (src/meals/domain/weekPlan.ts:21)
  period + days[PlanDate] = { breakfast, lunch, snack, dinner: MealId | null }
       └─ Firestore weekPlan/datedMeals: { start, days, plan }
          (src/meals/api/firestoreWeekPlanClient.ts:63-89)

Würfelregel „Hauptgericht“  MainMealTimeRule
       └─ Firestore weekPlan/rollingRules: { mainMealTime }   (setDoc, ganzes Dokument)
          useWeekPlan.ts:62-77, SignedInApp.tsx:217-229

Würfeln
  WeekPlanArea.shuffleWeek  → filledWeekPlan(meals, period, random, rule)  randomPlanning.ts:300
  WeekPlanArea.shuffleSlot  → pickMealFor(...) → chooseMeal → withMealIn    WeekPlanArea.tsx:125

Übertragen
  WeekPlanArea.addToShoppingList (WeekPlanArea.tsx:168)
    → transferredStage(coveredSlotsOf(plan, meals, supplies))
    → weekPlanTransfer(plan, meals, supplies)   weekPlan.ts:203
         jeder belegte Platz ─┬─ isSuppliedIn → spentSupplies
                              └─ sonst        → mealsToBuy
    isSuppliedIn zählt jede frühere Belegung desselben Gerichts (timesPlannedBefore, :128)

Anzeige
  WeekPlanRow.SlotMarks: Schneeflocke, wenn isCoveredIn(...)   WeekPlanRow.tsx:49-73
  slotFieldLabel / fixedSlotText / slotPlannedAnnouncement: „…, im Vorrat“
                                                             announcements.ts:360-392
```

## Zielbild

```
Meal + leftovers: boolean                   Firestore meals/{id}.leftovers

WeekPlan + leftoverSlots: PlanSlot[]        Firestore weekPlan/datedMeals.leftovers

RollingRules { mainMealTime, plansLeftovers }
                                            Firestore weekPlan/rollingRules
                                              { mainMealTime, leftovers }

Würfeln eines Platzes (WeekPlanArea.shuffleSlot)
  pickMealFor(...)  ──► Meal
  rolledInto(plan, slot, meal, meals, supplies, rules)          leftovers.ts
     = withMealIn(plan, slot, meal.id)
       └─ wenn rules.plansLeftovers && meal.leftovers
             && Folgetag im Zeitraum && !isSuppliedIn(…, slot, …)
          → Folgetag gleiche Zeit = meal.id, als Reste gekennzeichnet

Ganze Woche (filledWeekPlan)
  Tag für Tag, Platz für Platz:
     Platz ist Reste-Platz? → überspringen
     sonst pickMealFor → rolledInto

Übertragen / Vorrat
  plannedSlots ohne Reste-Plätze → weder mealsToBuy noch spentSupplies
  isSuppliedIn(Reste-Platz) = false, timesPlannedBefore zählt Reste nicht

Anzeige
  slotMarkOf(stage, plan, slot, meals, supplies): 'supply' | 'leftovers' | null
     'supply'    → ❄  „…, im Vorrat“
     'leftovers' → 📦 „…, Reste“
```

Oberfläche, Tagesansicht beim Bearbeiten:

```
vorher                                         nachher
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│ ◀  Dienstag, 22. September  ▶        │       │ ◀  Dienstag, 22. September  ▶        │
│ 🌅    [Müsli            ] [⤮]        │       │ 🌅    [Müsli            ] [⤮]        │
│ ☀     [                 ] [⤮]        │       │ ☀     [                 ] [⤮]        │
│ 🍎    [Apfel            ] [⤮]        │       │ 🍎    [Apfel            ] [⤮]        │
│ ☾  ❄  [Linsensuppe      ] [⤮]        │       │ ☾  📦 [Bolognese        ] [⤮]        │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
                                                  VoiceOver: „Abendessen, Reste“
```

Gericht-Formular:

```
vorher                                  nachher
│ Hauptgericht              [✓] │       │ Hauptgericht              [✓] │
│ Frühstück                 [ ] │       │ Frühstück                 [ ] │
│ Snack                     [ ] │       │ Snack                     [ ] │
│ Kategorien …                  │       │                               │  ← mehr Abstand
                                        │ Reste                     [ ] │
                                        │ Kategorien …                  │
```

Einstellungen:

```
vorher                                         nachher
│ Farben invertieren                 [ ○ ] │   │ Farben invertieren                 [ ○ ] │
│ Hauptgericht würfeln [Mittags oder…  ▾] │   │ Hauptgericht würfeln [Mittags oder…  ▾] │
│ Artikel-Verwaltung                       │   │ Reste einplanen                    [ ● ] │
│ …                                        │   │ Artikel-Verwaltung                       │
```

## Abstraktionen und Wiederverwendung

Wiederverwendet: `dateAfter` (planPeriod), `isSuppliedIn`, `withMealIn`, `sameSlot`,
`isStaleSnapshot`, Settings-Eintrag `kind: 'toggle'`, `.toggleField`, `.supplyMark`,
`MealTimeIcon`-/`SnowflakeIcon`-Muster (`src/shared/ui/SnowflakeIcon.tsx`) für ein Icon.

- `src/meals/domain`
  - `meal.ts` - `leftovers` in `NewMeal`, `MealDraft`, `createMeal`, `withHiding`
  - `weekPlan.ts` - `leftoverSlots` im `WeekPlan`
    - `emptyWeekPlan`, `withPeriod`, `sameWeekPlan`, `withMealIn` - Reste mitführen bzw. Kennzeichen entfernen
    - `isLeftoverIn(plan, slot)` - neu
    - `isSuppliedIn`, `timesPlannedBefore`, `plannedSlots`/`weekPlanTransfer` - Reste-Plätze auslassen
  - `leftovers.ts` - neu: `leftoverSlotAfter`, `withLeftoversIn`, `rolledInto`
  - `randomPlanning.ts` - `RollingRules`, `DEFAULT_ROLLING_RULES`; `filledWeekPlan` mit `supplies` und `rules`, überspringt Reste-Plätze
  - `weekPlanStage.ts` - `SlotMark`, `slotMarkOf` ersetzt `isCoveredIn` in der Anzeige
  - `announcements.ts` - `slotFieldLabel`, `fixedSlotText`, `slotPlannedAnnouncement` mit `SlotMark`; neu `leftoversPlannedAnnouncement`
- `src/meals/api`
  - `firestoreMealsClient.ts`, `inMemoryMealsClient.ts` - Feld `leftovers`
  - `weekPlanClient.ts` - `observeRollingRules`/`writeRollingRules`
  - `firestoreWeekPlanClient.ts` - `leftovers` in `datedMeals`, `RollingRules` in `rollingRules`
  - `inMemoryWeekPlanClient.ts` - analog, `rollingRulesArriveFromElsewhere`, `storedRollingRules`
- `src/meals/ui`
  - `MealFormPage.tsx` - Häkchen „Reste“
  - `useWeekPlan.ts` - `rollingRules`, `changeMainMealTimeRule`, `changeLeftoverPlanning`
  - `WeekPlanArea.tsx` - `shuffleSlot`/`shuffleWeek` über `rolledInto`/`filledWeekPlan` mit `supplies`
  - `WeekPlanRow.tsx` - `SlotMarks` mit `SlotMark`
  - `PackageIcon.tsx` - neu
- `src/SignedInApp.tsx` - Schalter „Reste einplanen“
- `src/index.css` - `.toggleField.leftoversField` mit `margin-top`
- `e2e/emulatorHousehold.ts` - `leftovers` in `StoredMealFlags`, `leftoverMealNamesOnServer`, `rollingRulesOnServer`, `leftoverSlotsOnServer`
- `docs/architektur/05-bausteinsicht.md` - `leftovers` im Knoten der Wochenplan-Domäne (Zeile 176)

## Logging und Beobachtbarkeit

Keine Änderungen. Fehlgeschlagene Schreibvorgänge melden wie bisher
„Konnte nicht gespeichert werden.“.

## Umsetzung

### Phase 1: Reste-Häkchen am Gericht

Abhängigkeiten: keine

Ein Gericht lässt sich als „Reste“ kennzeichnen. Das Kennzeichen wird gespeichert und
auf allen Geräten gezeigt.

**Aufgaben**:
- [x] `meal.test.ts` zuerst: `createMeal` übernimmt `draft.leftovers`, `withHiding`
  behält `leftovers`.
- [x] `src/meals/domain/meal.ts`: `leftovers: boolean` in `NewMeal` und `MealDraft`;
  `createMeal` und `withHiding` reichen es durch.
- [x] `src/meals/api/firestoreMealsClient.ts`: `toMeal` liest
  `leftovers: stored.leftovers === true`, `toDocument` schreibt `leftovers`.
- [x] `inMemoryMealsClient.ts` und alle Testdaten mit `Meal`-Literalen
  (`npm run lint`/`tsc` findet sie) um `leftovers: false` ergänzen.
- [x] `src/meals/ui/MealFormPage.tsx`: leerer Entwurf `leftovers: false`,
  Bearbeiten übernimmt `meal.leftovers`. Neues Häkchen nach „Snack“:
  ```tsx
  <label className="toggleField leftoversField">
    <span>Reste</span>
    <input
      type="checkbox"
      checked={draft.leftovers}
      onChange={(event) => change({ leftovers: event.target.checked })}
    />
  </label>
  ```
- [x] `src/index.css`: `.leftoversField { margin-top: 1.5rem; }` (nur Abstand nach
  oben, der übrige Stil kommt von `.toggleField`).
- [x] `MealsArea.test.tsx`: Häkchen „Reste“ ist anfangs aus. Anhaken und Speichern
  legt `leftovers: true` im Fake ab, beim Bearbeiten ist es wieder angehakt.
  Das Häkchen ändert die Art nicht.
- [x] `e2e/emulatorHousehold.ts`: `leftovers?: boolean` in `StoredMealFlags`, neu
  `leftoverMealNamesOnServer()` nach dem Muster von `snackMealNamesOnServer`.
- [x] `e2e/meals.spec.ts`: neuer Test „marks a meal as leaving leftovers“. Gericht
  anlegen, „Reste“ anhaken, speichern, `expect.poll(leftoverMealNamesOnServer)`
  enthält es, nach dem Neuladen ist das Häkchen beim Bearbeiten gesetzt.

**Automatisierte Verifikation**:
- [x] `npm run test` grün (inkl. neuer Tests in `meal.test.ts`, `MealsArea.test.tsx`)
- [x] `npm run lint` und `npm run build` laufen durch
- [x] `npm run test:e2e` grün, darunter „marks a meal as leaving leftovers“

**Manuelle Verifikation**:
- [x] Auf dem iPhone: Der Abstand zwischen „Snack“ und „Reste“ ist sichtbar größer als
  zwischen den anderen Häkchen. VoiceOver liest „Reste, Markierungsfeld, nicht
  markiert“.

### Phase 2: Schalter „Reste einplanen“

Abhängigkeiten: keine (fachlich nach Phase 1 sinnvoll)

Die Würfelregeln werden zu einem gemeinsamen Wert. Der neue Schalter lässt sich
ein- und ausschalten und gilt für beide Geräte.

**Aufgaben**:
- [x] `src/meals/domain/randomPlanning.ts`:
  ```ts
  export type RollingRules = {
    mainMealTime: MainMealTimeRule
    plansLeftovers: boolean
  }
  export const DEFAULT_ROLLING_RULES: RollingRules = {
    mainMealTime: DEFAULT_MAIN_MEAL_TIME_RULE,
    plansLeftovers: true,
  }
  export function sameRollingRules(one: RollingRules, other: RollingRules): boolean
  ```
  Test in `randomPlanning.test.ts` zuerst.
- [x] `src/meals/api/weekPlanClient.ts`: `observeRollingRules(onRules)` und
  `writeRollingRules(rules)` ersetzen `observeMainMealTimeRule`/`writeMainMealTimeRule`.
- [x] `src/meals/api/firestoreWeekPlanClient.ts`: `toRollingRules(stored)` liest
  `mainMealTime` (wie `toMainMealTimeRule`) und `leftovers !== false`.
  `writeRollingRules` schreibt `{ mainMealTime, leftovers }` per `setDoc`.
- [x] `src/meals/api/inMemoryWeekPlanClient.ts`: dritter Parameter
  `initialRollingRules = DEFAULT_ROLLING_RULES`, `rollingRulesArriveFromElsewhere`,
  `storedRollingRules`. Die bisherigen `mainMealTimeRule…`-Helfer und ihre
  Verwendungen in Tests umstellen (u. a. `WeekPlanArea.test.tsx:195, 200, 238, 1030`).
- [x] `src/meals/ui/useWeekPlan.ts`: Zustand `rollingRules` mit `unconfirmedRollingRules`
  und `isStaleSnapshot(…, sameRollingRules)`.
  `WeekPlanning` bietet `rollingRules`, `changeMainMealTimeRule(rule)` und
  `changeLeftoverPlanning(plansLeftovers)`. Beide schreiben
  `{ ...rollingRules, <geändertes Feld> }`. `mainMealTimeRule` fällt weg, Aufrufer lesen
  `rollingRules.mainMealTime`.
- [x] `useWeekPlan.test.tsx`: Der eigene Fake-Client dort (`:33-76`) bekommt
  `observeRollingRules`/`writeRollingRules`, die Tests `:175-196` werden umgestellt.
  Ändern des einen Felds behält das andere. Eine veraltete
  Momentaufnahme überschreibt den unbestätigten Stand nicht (Muster der bisherigen
  Rule-Tests).
- [x] `src/SignedInApp.tsx`: nach dem Eintrag `mainMealTimeRule`:
  ```ts
  {
    kind: 'toggle',
    id: 'leftoverPlanning',
    label: 'Reste einplanen',
    enabled: weekPlanning.rollingRules.plansLeftovers,
    onToggle: () =>
      weekPlanning.changeLeftoverPlanning(!weekPlanning.rollingRules.plansLeftovers),
  },
  ```
  `WeekPlanArea` bekommt `rollingRules` statt `mainMealTimeRule` (Destrukturierung
  `WeekPlanArea.tsx:87`).
- [x] `src/SignedInApp.test.tsx` (neben den Tests `:1545-1562` zu „Hauptgericht
  würfeln“): Schalter „Reste einplanen“ steht nach „Hauptgericht würfeln“, ist an,
  Umschalten schreibt `plansLeftovers: false` und lässt `mainMealTime` unverändert.
- [x] `e2e/emulatorHousehold.ts`: `mainMealTimeRuleOnServer` zu
  `rollingRulesOnServer(): Promise<{ mainMealTime: string | null; leftovers: boolean | null }>`
  erweitern.
- [x] `e2e/settings.spec.ts`: neuer Test „switches off planning leftovers for the
  household“. Der Schalter ist an, wird ausgeschaltet, auf dem Server
  `leftovers: false`; danach „Nur abends“ wählen, und `leftovers` bleibt `false`.
  Den bestehenden Test auf `rollingRulesOnServer` umstellen.

**Automatisierte Verifikation**:
- [x] `npm run test` grün
- [x] `npm run lint` und `npm run build` laufen durch
- [x] `npm run test:e2e` grün, darunter beide Tests in `settings.spec.ts`

### Phase 3: Reste würfeln und anzeigen

Abhängigkeiten: Phase 1, Phase 2

Würfeln setzt Reste am Folgetag. Der Plan speichert sie, die Zeile zeigt die Box,
VoiceOver sagt „Reste“. Eine Änderung von Hand entfernt das Kennzeichen.

**Aufgaben**:
- [x] `weekPlan.test.ts` zuerst, dann `src/meals/domain/weekPlan.ts`:
  - `WeekPlan` bekommt `readonly leftoverSlots: readonly PlanSlot[]`.
  - `emptyWeekPlan`/`emptied`/`withDays`: `leftoverSlots: []` bzw. durchgereicht.
    `withPeriod` behält nur Reste-Plätze, deren Datum **und** Vortag im neuen
    Zeitraum liegen (Test: Start rückt einen Tag nach hinten → Reste-Platz am neuen
    ersten Tag verliert das Kennzeichen, das Gericht bleibt).
    `weekPlanFromWeekdays` baut auf `emptyWeekPlan` auf und braucht nichts.
  - `sameWeekPlan` vergleicht zusätzlich `leftoverSlots` als Menge.
  - `isLeftoverIn(plan, slot): boolean`.
  - `withMealIn(plan, slot, id)` entfernt `slot` und den Platz am Folgetag zur selben
    Tageszeit aus `leftoverSlots`. Tests: Reste-Platz geändert → Gericht neu,
    Kennzeichen weg. Original geändert → Gericht am Folgetag bleibt, Kennzeichen weg.
- [x] `leftovers.test.ts` zuerst, dann neu `src/meals/domain/leftovers.ts`:
  ```ts
  export function leftoverSlotAfter(plan: WeekPlan, slot: PlanSlot): PlanSlot | null
  // dateAfter(plan.period, slot.date) mit slot.time, sonst null

  export function rolledInto(
    plan: WeekPlan,
    slot: PlanSlot,
    meal: Meal,
    meals: readonly Meal[],
    supplies: readonly Supply[],
    rules: RollingRules,
  ): WeekPlan
  // withMealIn(plan, slot, meal.id); bei plansLeftovers && meal.leftovers
  // && !isSuppliedIn(gesetzt, slot, meals, supplies) && Folgeplatz vorhanden:
  // Folgeplatz über withMealIn(…, folgeplatz, meal.id) setzen (räumt so auch das
  // Kennzeichen am übernächsten Tag ab) und danach in leftoverSlots aufnehmen
  ```
  Tests: setzt Reste am Folgetag gleiche Zeit; keine Reste ohne Häkchen; keine bei
  `plansLeftovers: false`; keine am letzten Tag; keine, wenn das Original durch den
  Vorrat gedeckt ist; überschreibt ein belegtes und ein schon als Reste gesetztes
  Folgefeld; überschreibt es ein Original, dessen Reste am übernächsten Tag stehen,
  verliert der übernächste Tag das Kennzeichen (Gericht bleibt); Neuwürfeln des Originals mit einem Gericht ohne Reste lässt das Gericht am
  Folgetag stehen, nimmt aber das Kennzeichen weg.
  `leftovers.ts` importiert `RollingRules` per `import type` aus `randomPlanning.ts`
  (Vorbild: `announcements.ts:17`). Es gibt keine `import/no-cycle`-Regel, und der
  reine Typ-Import löst sich zur Laufzeit auf.
- [x] `randomPlanning.test.ts` zuerst, dann `src/meals/domain/randomPlanning.ts`:
  `filledWeekPlan(meals, period, random, rules, supplies)` (alle rund 20 Aufrufe in
  `randomPlanning.test.ts` ausdrücklich umstellen, kein Default) und
  `filledDay` überspringen Plätze mit `isLeftoverIn` und setzen über `rolledInto`.
  `pickMealFor` nimmt `rule: MainMealTimeRule` wie bisher.
  Tests: Bolognese (Hauptgericht, Reste) als einziges Hauptgericht, „Nur abends“,
  zwei Tage → Mo abends Bolognese, Di abends Bolognese als Reste, Di mittags kein
  Hauptgericht. Mit Vorrat Bolognese 1 → keine Reste. Reste lösen keine weiteren Reste
  aus (drei Tage: Mi abends ist kein Reste-Platz).
- [x] `src/meals/api/firestoreWeekPlanClient.ts`: `toWeekPlan` liest
  `stored.leftovers` als Liste `{ date, time }` (nur gültige `PlanDate`/`MealTime`,
  deren Datum und Vortag im Zeitraum liegen, sonst ignorieren; fehlt das Feld → `[]`). `fromWeekPlan` schreibt
  `leftovers: plan.leftoverSlots.map(({ date, time }) => ({ date, time }))`.
- [x] `src/meals/domain/weekPlanStage.ts`:
  ```ts
  export type SlotMark = 'supply' | 'leftovers' | null
  export function slotMarkOf(stage, plan, slot, meals, supplies): SlotMark
  // isLeftoverIn && Gericht vorhanden → 'leftovers', isCoveredIn → 'supply', sonst null
  ```
  `isCoveredIn` bleibt für den Vorrat. Tests in `weekPlanStage.test.ts`; die
  bestehenden Tests (`weekPlanStage.test.ts:163-230`) bleiben.
- [x] `src/meals/domain/announcements.ts` (Tests zuerst):
  - `slotFieldLabel(slot, naming, mark)` → „Abendessen, Reste“ / „…, im Vorrat“.
  - `fixedSlotText(slot, naming, meal, mark)` analog.
  - `slotPlannedAnnouncement(slot, naming, meal, mark)` analog.
  - Die bestehenden Bool-Tests (`announcements.test.ts:776-870`) auf `SlotMark`
    umstellen.
  - neu `leftoversPlannedAnnouncement(slot, meal)` →
    „`<Datumsname>`, `<Tageszeit>`, Reste von `<Gericht>`.“ (Datumsname wie
    `planDateName`, Tageszeit wie `mealTimeName`).
- [x] `src/meals/ui/PackageIcon.tsx`: neu, Muster `SnowflakeIcon`, Pfade aus lucide
  `package` (ISC, https://lucide.dev/icons/package).
- [x] `src/meals/ui/WeekPlanRow.tsx`: `SlotMarks` bekommt `mark: SlotMark` und zeigt
  `SnowflakeIcon` bzw. `PackageIcon`. `FixedSlot`/`EditableSlot` nutzen `slotMarkOf`.
- [x] `src/meals/ui/WeekPlanArea.tsx`:
  - `shuffleSlot`: `pickMealFor` → `rolledInto(plan, slot, picked, meals, supplies,
    rollingRules)` → `weekPlanning.replacePlan(rolled)`. Ansage
    `slotPlannedAnnouncement(…, slotMarkOf(…))`. Ist der Folgeplatz in `rolled`
    ein Reste-Platz von `picked`, folgt `leftoversPlannedAnnouncement`, getrennt
    durch ein Leerzeichen.
  - `chooseMeal` übergibt `slotMarkOf` an die Ansage (heute `isSuppliedIn`,
    `WeekPlanArea.tsx:120`).
  - `shuffleWeek`: `filledWeekPlan(meals, plan.period, random, rollingRules, supplies)`.
- [x] `WeekPlanArea.test.tsx`: Würfeln eines Platzes mit einem Reste-Gericht zeigt am
  Folgetag „Abendessen, Reste“ und sagt beide Plätze an. Das Kennzeichen verschwindet
  nach einer Wahl von Hand im Reste-Platz und im Original. Im festgelegten Plan liest
  der versteckte Text „Abendessen, Bolognese, Reste“. In der Wochenansicht hat die
  Zeile des Folgetags die Box. Mit `plansLeftovers: false` entstehen keine Reste.
- [x] `useWeekPlan.test.tsx`: Eine Momentaufnahme, die sich nur in `leftoverSlots`
  unterscheidet, gilt nicht als gleich (`sameWeekPlan`).
- [x] `e2e/emulatorHousehold.ts`: `StoredWeekPlan` um `leftovers` erweitern, neu
  `leftoverSlotsOnServer(): Promise<readonly string[]>` (`"<date>.<time>"` aus
  `datedMeals.leftovers`).
- [x] `e2e/weekPlan.spec.ts`: neuer Test „rolls the leftovers of a meal into the next
  day“. Bolognese (Hauptgericht, Reste) als einziges Gericht, „Nur abends“ in den
  Einstellungen, Zeitraum zwei Tage, „Zufallsauswahl generieren“. Am zweiten Tag
  ist das Feld „Abendessen, Reste“ mit Bolognese belegt, und
  `leftoverSlotsOnServer` enthält diesen Platz. Nach dem Neuladen ist das noch so.
- [x] `docs/architektur/05-bausteinsicht.md`: Knoten Zeile 176 um `leftovers` ergänzen.

**Automatisierte Verifikation**:
- [x] `npm run test` grün (inkl. `leftovers.test.ts`, Architekturtest)
- [x] `npm run lint` und `npm run build` laufen durch
- [x] `npm run test:e2e` grün, darunter „rolls the leftovers of a meal into the next day“

**Manuelle Verifikation**:
- [x] Auf dem iPhone: Die Box ist in der Tages- und in der Wochenansicht gut von der
  Schneeflocke zu unterscheiden, auch mit umgekehrten Farben.
- [x] Mit VoiceOver einen einzelnen Platz würfeln, bis ein Reste-Gericht kommt: Die
  Ansage nennt beide Plätze verständlich, das Feld am Folgetag heißt „…, Reste“.

### Phase 4: Reste beim Übertragen

Abhängigkeiten: Phase 3

Reste-Plätze werden weder eingekauft noch aus dem Vorrat genommen und verbrauchen keine
Vorrats-Portion.

**Aufgaben**:
- [x] `weekPlan.test.ts` zuerst, dann `src/meals/domain/weekPlan.ts`:
  - `timesPlannedBefore` zählt Reste-Plätze nicht.
  - `isSuppliedIn` ist für einen Reste-Platz `false`.
  - `weekPlanTransfer` lässt Reste-Plätze aus `mealsToBuy` und `spentSupplies` heraus
    (eigene Hilfsfunktion `transferredSlots`). `plannedMeals`/`plannedMealCount`
    zählen sie weiter mit.
  - Tests: Bolognese Mo abends + Reste Di abends → `mealsToBuy: [Bolognese]` einmal.
    Vorrat Linsensuppe 1, Reste-Platz Linsensuppe vor einem normalen
    Linsensuppe-Platz → der normale Platz bleibt gedeckt.
    `coveredSlotsOf` enthält den Reste-Platz nie.
- [x] `WeekPlanArea.test.tsx`: „Auf die Einkaufsliste“ übergibt für Bolognese mit
  Resten genau einmal Bolognese, die Ansage bleibt wortgleich.
- [x] `e2e/weekPlan.spec.ts`: Der Test aus Phase 3 geht weiter: festlegen,
  „Auf die Einkaufsliste“. Die Artikel von Bolognese stehen mit einfacher Menge auf der
  Liste (`itemQuantitiesOnServer`), die Vorräte bleiben unverändert.

**Automatisierte Verifikation**:
- [x] `npm run test` grün
- [x] `npm run lint` und `npm run build` laufen durch
- [x] `npm run test:e2e` grün

**Manuelle Verifikation**:
- [x] Auf dem iPhone eine Woche mit einem Reste-Gericht würfeln, festlegen und
  übertragen: Die Zutaten stehen nur einmal auf der Einkaufsliste.

## Notizen zur Umsetzung

- Ob beim Würfeln eines Platzes Reste entstanden sind, entscheidet die neue
  Domänenfunktion `leftoversRolledAfter(plan, slot)` in `leftovers.ts`. So bleibt die
  Regel aus `WeekPlanArea` heraus.
- `toWeekPlan` filtert die gelesenen Reste-Plätze über `withPeriod`, damit die Regel
  „Datum und Vortag im Zeitraum“ nur an einer Stelle steht.
- Schon das Leeren eines Reste-Feldes nimmt das Kennzeichen weg. Das Feld heißt danach
  nur noch „Abendessen“, bevor ein neues Gericht gewählt ist.

## Verweise

- `docs/notes.txt`, TODO-Eintrag „Reste“
- Vorlage für den Vorrats-Abgleich: `docs/agents/plans/2026-09-23-vorrat-beim-uebertragen-verbrauchen.md`
- Vorlage für die Würfelregel in den Einstellungen: `docs/agents/plans/2026-09-25-hauptgericht-zeit-einstellen.md`
- Lucide-Icon als Stilvorlage: https://lucide.dev/icons/package
