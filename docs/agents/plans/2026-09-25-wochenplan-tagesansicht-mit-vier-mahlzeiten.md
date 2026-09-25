---
date: 2026-09-25T09:10:24+00:00
git_commit: c29a7bea912edeedc808e341c8612fa874627439
branch: main
story: MZP-028
topic: "Wochenplan als Tagesansicht mit vier Mahlzeiten"
tags: [plan, meals, weekPlan, domain, firestore, ui]
status: ready
---

# PLAN: MZP-028 — Wochenplan als Tagesansicht mit vier Mahlzeiten

Der Wochenplan zeigt künftig nicht mehr die ganze Woche, sondern **einen Tag**. Unter
der Überschrift steht eine Zeile `[◀] Fr. [▶]`, mit der man zwischen Montag und Sonntag
blättert. Darunter stehen vier Zeilen, `Frühstück`, `Mittagessen`, `Snack` und
`Abendessen`, jede mit einem eigenen Gericht und links einem Icon für die Tageszeit.

Damit wird aus „ein Gericht pro Tag“ „vier Gerichte pro Tag“: Der Plan hat 28
gleichwertige **Plätze**. Datenmodell, Firestore, Vorrat, Übertragung, Würfel und
Überschrift rechnen künftig über Plätze statt über Tage. Das Vorhaben steht in
`docs/notes.txt:135` und `:145-151`. Die Würfelregeln nach Tageszeit
(`docs/notes.txt:152-164`) gehören **nicht** dazu, die Schnittstelle wird aber für sie
vorbereitet.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-25.

## Akzeptanzkriterien

- Der Wochenplan zeigt genau einen Tag. Unter der Überschrift steht die Zeile
  `[◀] Fr. [▶]`. Die Pfeile sind Knöpfe, die nur ein Icon zeigen und
  `Vorheriger Tag` beziehungsweise `Nächster Tag` heißen. Der Tag ist ein `<h2>`,
  sichtbar `Fr.`, vorgelesen `Freitag`.
- Am Montag ist `Vorheriger Tag` gesperrt, am Sonntag `Nächster Tag`. Gesperrt heißt:
  ausgegraut und `aria-disabled="true"`. Der Fokus bleibt auf dem Knopf, und ein Druck
  bewirkt nichts.
- Nach jedem Blättern wird der neue Tag angesagt, zum Beispiel `Samstag.` Der Fokus
  bleibt auf dem Pfeil.
- Beim ersten Öffnen nach dem Start der App steht der heutige Wochentag da. Nach einem
  Wechsel zu einer anderen Seite und zurück steht der zuletzt gezeigte Tag da, nach
  einem Neuladen wieder der heutige. Jedes Gerät blättert für sich, der Tag wird nicht
  gespeichert.
- Pro Tag gibt es vier Zeilen in der Reihenfolge `Frühstück`, `Mittagessen`, `Snack`,
  `Abendessen`. Jede Zeile hat ein eigenes Gericht. Links steht ein Icon (Sonnenaufgang,
  Sonne, Apfel, Mond, `aria-hidden`), daneben der feste Platz für die Schneeflocke.
- Die Beschriftungen nennen die Tageszeit, aber nicht den Tag:
  - Feld: `Frühstück` beziehungsweise `Frühstück, im Vorrat`
  - Würfel der Zeile: `Zufallsgericht für Frühstück`
  - Vorschlagsliste: `Vorschläge für Frühstück`
  - festgelegter Plan: `Frühstück, Müsli`, `Frühstück, Müsli, im Vorrat` oder
    `Snack, nichts geplant`
  - Ansage nach Wahl oder Würfel: `Frühstück, Müsli.` beziehungsweise
    `Frühstück, Müsli, im Vorrat.`
- Die Überschrift zählt die Plätze: `Wochenplan, keine von 28` oder
  `Wochenplan, 12 von 28`, mit den bisherigen Zusätzen `, festgelegt` und
  `, festgelegt, übertragen`. Beim Festlegen kommt die Ansage
  `Plan festgelegt, 12 von 28 Gerichten geplant.`
- `Zufallsauswahl generieren` füllt alle 28 Plätze der Woche nach `rarestInThePlan`,
  ohne Rücksicht auf `kind`. Dabei kommt die Ansage
  `Wochenplan neu gewürfelt, 28 Gerichte.`
- Der Vorrat deckt die Plätze in der Reihenfolge Mo-Frühstück, Mo-Mittagessen,
  Mo-Snack, Mo-Abendessen, Di-Frühstück … So-Abendessen. `Auf die Einkaufsliste` kauft
  alle ungedeckten Plätze der ganzen Woche ein, nicht nur die des gezeigten Tages. Die
  Ansage lautet `1 Gericht aus dem Vorrat entnommen.` beziehungsweise
  `2 Gerichte aus dem Vorrat entnommen.`
- Plan, Festlegung und Übertragung überstehen ein Neuladen und erscheinen auf dem
  zweiten Gerät. Ein übertragener Plan lässt sich weiterhin nur einmal übertragen.
- Der bisherige Plan (`weekPlan/current`, `weekPlan/stage`) wird nicht mehr gelesen.
  Die App startet mit einem leeren Plan im Bearbeiten-Zustand.

## Wesentliche Entscheidungen und Abwägungen

1. **Plätze statt Tage.** Es gibt den neuen Typ
   `MealTime = 'breakfast' | 'lunch' | 'snack' | 'dinner'`. Ein Platz ist
   `PlanSlot = { day, time }`, und der Plan ist
   `WeekPlan = Record<Weekday, Record<MealTime, MealId | null>>`.
   - Warum: Alle vier Zeilen sind gleichwertig. Jede wird gespeichert, übertragen,
     gewürfelt und kann vom Vorrat gedeckt werden (Frage 1).
   - Auswirkung: `weekPlan.ts`, `weekPlanStage.ts` (`coveredDays` wird zu
     `coveredSlots`), `randomPlanning.ts` und `announcements.ts` rechnen über
     `PLAN_SLOTS` (28 Einträge in Wochenreihenfolge). Die Tageszeit heißt bewusst
     `MealTime` und nicht `MealKind`. `kind` beschreibt das Gericht, `time` den Platz
     im Plan. Dass `'breakfast'` und `'snack'` in beiden Typen vorkommen, ist gewollt,
     denn die späteren Regeln bringen genau diese zusammen.

2. **Neue Firestore-Dokumente `weekPlan/meals` und `weekPlan/mealStage`.** Die alten
   Dokumente `weekPlan/current` und `weekPlan/stage` werden nicht mehr gelesen und
   nicht mehr geschrieben.
   - Warum: Der alte Plan darf verworfen werden, weil er bisher nur zum Testen genutzt
     wurde (Frage 2). Ein Gerät mit veralteter PWA schreibt weiter in die alten
     Dokumente und kann den neuen Plan so nicht zerstören.
   - Auswirkung: Es braucht keinen Umwandlungscode. `firestore.rules` bleibt
     unverändert, weil `match /weekPlan/{document}` jedes Dokument der Sammlung abdeckt.
     `firestore.rules.test.ts` zieht auf die neuen Namen um. Die alten Dokumente
     bleiben als Leichen liegen und stören niemanden.

3. **Der Würfel kennt noch keine Fachregeln.** `PlanningRule` bekommt statt des Tages
   einen `PlanSlot`, `rarestInThePlan` zählt über 28 Plätze.
   - Warum: Das Vorhaben bleibt ein Umbau, die Regeln kommen als eigene Story
     (Frage 3).
   - Auswirkung: Bis dahin kann ein Hauptgericht im Frühstück landen. Die Regeln aus
     `notes.txt:152-164` werden später nur noch in `PLANNING_RULES` eingetragen und
     lesen `slot.time`.

4. **Die Überschrift zählt Plätze** (Frage 4). `plannedDayCount` heißt künftig
   `plannedMealCount`, und `suppliedDayCount` heißt `suppliedMealCount`.

5. **Der gezeigte Tag liegt in `SignedInApp`, der Starttag kommt von einer
   eingespeisten Uhr.** `Clock = () => Date` liegt in `src/shared/domain/clock.ts`.
   `SignedInApp` bekommt `clock?: Clock` mit dem Standard `() => new Date()`, nach dem
   Vorbild von `random` (`SignedInApp.tsx:80`, `:91`).
   - Warum: `WeekPlanArea` wird bei jedem Seitenwechsel neu aufgebaut
     (`SignedInApp.tsx:197-208`). Ein Tag, den es sich selbst merkt, wäre danach weg.
     Die Uhr soll außerdem für spätere Pläne der App bereitstehen (Frage 5).
   - Auswirkung: `WeekPlanArea` bekommt den Tag als `shownDay` und meldet Änderungen
     über `onShowDay`. Die Tests setzen den Tag fest, und e2e fixiert die Zeit per
     `page.clock.setFixedTime`.

6. **Die Tageszeile ist mit `aria-disabled` gesperrt, der Tag ist ein `<h2>`, und
   beim Blättern kommt eine kurze Ansage** (Frage 6).
   - Warum: `disabled` würde dem Knopf am Rand den Fokus nehmen. Das Muster mit
     `aria-disabled` gibt es schon beim Übertragen (`WeekPlanPage.tsx:103`), und das
     Grau kommt aus `index.css:145-150`.
   - Auswirkung: Der Klick-Handler prüft selbst, ob es einen Nachbartag gibt.

7. **Die Beschriftungen nennen den Tag nicht** (Frage 7). Weil nur ein Tag zu sehen
   ist, nennt ihn schon die `<h2>`. VoiceOver hört beim Wischen nicht viermal
   „Freitag“.

8. **Die Icons sind Sonnenaufgang, Sonne, Apfel und Mond**, als SVG im Stil der
   vorhandenen: 24×24, eine Linie mit Strichstärke 2, `currentColor`, Pfade aus
   Lucide wie bei `SnowflakeIcon` (Frage 8). Die Pfeile nehmen die Lucide-Chevrons.

## Ausgangslage

Datenmodell (`weekPlan.ts:4-20`, `weekPlanStage.ts:10-15`):

```
WeekPlan       = Record<Weekday, MealId | null>
WeekPlanStage  = { mode: 'editing' }
               | { mode: 'reading'; coveredDays: readonly Weekday[] | null }

Firestore      weekPlan/current = { monday: "abc", tuesday: null, ... }
               weekPlan/stage   = { mode: 'reading', coveredDays: ['monday'] }
```

Wer davon abhängt:

```
SignedInApp ── useWeekPlan ── WeekPlanClient (firestore / inMemory)
    │
    └─ WeekPlanArea
         ├─ chooseMeal(day, id)        → dayPlannedAnnouncement      WeekPlanArea.tsx:58
         ├─ shuffleDay(day)            → pickMealForDay              randomPlanning.ts:45
         ├─ shuffleWeek()              → filledWeekPlan (7 Tage)     randomPlanning.ts:56
         ├─ toggleStage()              → planFixedAnnouncement       announcements.ts:248
         ├─ addToShoppingList()        → transferredStage(coveredDaysOf), weekPlanTransfer
         └─ WeekPlanPage
              ├─ <h1> weekPlanHeading(plannedDayCount)  "Wochenplan, 3 von 7"
              ├─ WEEKDAYS.map → WeekPlanRow             WeekPlanPage.tsx:69-83
              │     ├─ FixedDay     .weekday "Mo." + .supplyMark + Text
              │     └─ EditableDay  .weekday + .supplyMark + input + 🔀 + Vorschläge
              └─ BottomBar  [🔀 Woche] [🔒/✎] [🛒]
```

Oberfläche heute:

```
+------------------------------------------+
| Wochenplan, 3 von 7                      |
|                                          |
| Mo. ❄ [ Bolognese          ] [🔀]        |  "Montag, im Vorrat"
| Di.   [                    ] [🔀]        |  "Zufallsgericht für Dienstag"
| Mi.   [ Linsensuppe        ] [🔀]        |
| Do.   [                    ] [🔀]        |
| Fr.   [                    ] [🔀]        |
| Sa.   [                    ] [🔀]        |
| So.   [                    ] [🔀]        |
+------------------------------------------+
| [   🔀   ]   [   🔒   ]   [   🛒   ]     |
+------------------------------------------+
```

## Zielbild

Oberfläche, bearbeitbar:

```
+------------------------------------------+
| Wochenplan, 5 von 28                     |  <h1>, Fokus beim Öffnen
|                                          |
|  [ ◀ ]            Fr.           [ ▶ ]    |  <h2> "Freitag"
|                                          |
| 🌅 ❄ [ Müsli                ] [🔀]       |  "Frühstück, im Vorrat"
| ☀    [ Bolognese            ] [🔀]       |  "Mittagessen"
| 🍎   [                      ] [🔀]       |  "Zufallsgericht für Snack"
| 🌙   [ Linsensuppe          ] [🔀]       |  "Abendessen"
+------------------------------------------+
| [   🔀   ]   [   🔒   ]   [   🛒   ]     |
+------------------------------------------+
```

Am Montag ist `◀` grau, am Sonntag `▶`. Festgelegt:

```
+------------------------------------------+
| Wochenplan, 5 von 28, festgelegt         |
|                                          |
|  [ ◀ ]            Fr.           [ ▶ ]    |
|                                          |
| 🌅 ❄ Müsli                               |  "Frühstück, Müsli, im Vorrat"
| ☀    Bolognese                           |  "Mittagessen, Bolognese"
| 🍎                                       |  "Snack, nichts geplant"
| 🌙   Linsensuppe                         |  "Abendessen, Linsensuppe"
+------------------------------------------+
```

Datenmodell:

```
MEAL_TIMES   = ['breakfast', 'lunch', 'snack', 'dinner']
PlanSlot     = { day: Weekday; time: MealTime }
PLAN_SLOTS   = [mon/breakfast, mon/lunch, mon/snack, mon/dinner, tue/breakfast, ... ]  (28)
DayPlan      = Record<MealTime, MealId | null>
WeekPlan     = Record<Weekday, DayPlan>
WeekPlanStage = { mode: 'editing' }
              | { mode: 'reading'; coveredSlots: readonly PlanSlot[] | null }

Firestore    weekPlan/meals     = { monday: { breakfast: "abc", lunch: null, snack: null, dinner: "xyz" }, ... }
             weekPlan/mealStage = { mode: 'reading', coveredSlots: [ { day: 'monday', time: 'breakfast' } ] }
```

Zustand des gezeigten Tages:

```
SignedInApp
  const [shownDay, setShownDay] = useState(() => weekdayOf(clock()))   Phase 2
                                                 ('monday' in Phase 1)
  └─ WeekPlanArea shownDay={shownDay} onShowDay={setShownDay}
       showDay(day) → onShowDay(day); announce(dayShownAnnouncement(day))
```

Was sich **nicht** ändert: `useWeekPlan`s Schutz gegen verspätete Momentaufnahmen
(`isStaleSnapshot`), `WeekPlanClient` (nur die Typen dahinter), `BottomBar` und ihre
drei Knöpfe, `MealSuggestions`, `suggestMeals`, `firestore.rules`, `supply.ts`.

## Abstraktionen und Wiederverwendung

- `src/shared/domain`
  - `clock.ts` (neu): `export type Clock = () => Date` (Phase 2)
- `src/meals/domain`
  - `weekPlan.ts`
    - `MEAL_TIMES`, `MealTime`, `PlanSlot`, `PLAN_SLOTS`, `DayPlan`: neu
    - `EMPTY_WEEK_PLAN`: jeder Tag hat vier leere Plätze
    - `withMealOnDay` → `withMealIn(plan, slot, id)`
    - `mealIn(plan, slot)`: neu, die `MealId` eines Platzes
    - `sameSlot(one, other)`: neu
    - `sameWeekPlan`: vergleicht über `PLAN_SLOTS`
    - `shownMealOn` → `shownMealIn(plan, slot, meals)`
    - `isSuppliedOn` → `isSuppliedIn(plan, slot, meals, supplies)`: zählt frühere
      Plätze über `PLAN_SLOTS`
    - `coveredDaysOf` → `coveredSlotsOf`
    - `plannedDayCount` → `plannedMealCount`, `suppliedDayCount` →
      `suppliedMealCount`
    - `weekPlanTransfer`, `plannedMeals`, `mealsWithoutItems`: laufen über Plätze
    - `weekdayBefore(day)` / `weekdayAfter(day)`: neu, `Weekday | null`
    - `weekdayOf(date)`: neu (Phase 2)
  - `weekPlanStage.ts`
    - `coveredDays` → `coveredSlots`, `transferredStage(coveredSlots)`,
      `sameStage` vergleicht Plätze, `isCoveredOn` → `isCoveredIn(stage, plan, slot, …)`,
      `canTransfer(stage, plannedMeals)`
  - `randomPlanning.ts`
    - `PlanningRule(candidates, plan, slot)`, `narrowedBy(…, slot)`,
      `pickMealForDay` → `pickMealFor(candidates, plan, slot, random)`,
      `filledWeekPlan` läuft über `PLAN_SLOTS`, `timesPlanned` zählt Plätze
  - `announcements.ts`
    - `mealTimeName(time)`: neu, `Frühstück | Mittagessen | Snack | Abendessen`
    - `weekPlanHeading`, `planFixedAnnouncement`: zählen `von 28`
    - `fixedDayText` → `fixedSlotText(time, meal, inSupply)`
    - `randomMealLabel(time)`, `mealSuggestionsLabel(time)`
    - `weekdayFieldLabel` → `mealTimeFieldLabel(time, inSupply)`
    - `dayPlannedAnnouncement` → `slotPlannedAnnouncement(time, meal, inSupply)`
    - `weekPlanShuffledAnnouncement`: `PLAN_SLOTS.length`
    - `suppliedDayPhrase` → `suppliedMealPhrase`: `1 Gericht` / `n Gerichte`
    - `dayShownAnnouncement(day)`: neu, `Samstag.`
- `src/meals/api`
  - `firestoreWeekPlanClient.ts`: Dokumente `meals` und `mealStage`, `toWeekPlan`
    liest verschachtelt, `toCoveredSlots` liest `{ day, time }`-Einträge
  - `inMemoryWeekPlanClient.ts`, `weekPlanClient.ts`: nur Typen, keine Logikänderung
- `src/meals/ui`
  - `WeekPlanPage.tsx`: Tageszeile, vier Zeilen statt sieben
  - `WeekPlanRow.tsx`: bekommt `slot`, `MealTimeMark` statt `DayMarks`
  - `WeekPlanArea.tsx`: `shownDay`, `onShowDay`, alles pro Platz
  - `MealTimeIcon.tsx` (neu): wählt `SunriseIcon`, `SunIcon`, `AppleIcon`,
    `MoonIcon`
  - `SunriseIcon.tsx`, `SunIcon.tsx`, `AppleIcon.tsx`, `MoonIcon.tsx` (neu)
  - `ChevronLeftIcon.tsx`, `ChevronRightIcon.tsx` (neu)
- `src/SignedInApp.tsx`: hält `shownDay`, in Phase 2 zusätzlich `clock`
- `src/index.css`: `.dayNavigation`, `.mealTimeMark` statt `.weekday`
- `firestore.rules.test.ts`: Dokumentnamen `meals` und `mealStage`
- `e2e/emulatorHousehold.ts`, `e2e/weekPlan.spec.ts`: neue Dokumente und Beschriftungen
- `docs/notes.txt`: Einträge nach DONE, neuer Hinweis unter TODO

## Logging und Beobachtbarkeit

Die App hat kein Logging. Beobachtbar ist sie über die VoiceOver-Ansagen. Neu oder
geändert:

```
"Samstag."                                        Blättern
"Frühstück, Müsli."                               statt "Montag, Müsli."
"Frühstück, Müsli, im Vorrat."                    statt "Montag, Müsli, im Vorrat."
"Plan festgelegt, 12 von 28 Gerichten geplant."   statt "... 3 von 7 Tagen geplant."
"Wochenplan neu gewürfelt, 28 Gerichte."          statt "..., 7 Gerichte."
"Wochenplan, 2 Artikel hinzugefügt. 1 Gericht aus dem Vorrat entnommen."
```

## Umsetzung

### Phase 1: Ein Tag mit vier Mahlzeiten

Abhängigkeiten: keine.

Der Plan hat 28 Plätze. Die Seite zeigt einen Tag mit Tageszeile und vier Zeilen samt
Icons. Der gezeigte Tag liegt in `SignedInApp` und startet in dieser Phase immer am
Montag. Am Ende ist die App vollständig benutzbar, und alle Tests laufen auf dem
neuen Modell.

**Aufgaben**:

- [ ] `src/meals/domain/weekPlan.test.ts` zuerst umschreiben (roter Schritt). Die
  vorhandenen Blöcke bleiben inhaltlich erhalten und rechnen über Plätze.
  Die Hilfsfunktion im Test baut Pläne über `withMealIn`, zum Beispiel
  `planWith([{ day: 'monday', time: 'lunch' }, 'bolognese'], …)`.
  - `MEAL_TIMES`: `runs from breakfast to dinner`, also
    `['breakfast', 'lunch', 'snack', 'dinner']`.
  - `PLAN_SLOTS`: `holds four slots for every weekday in the order of the week`, also
    28 Einträge, der erste `monday/breakfast`, der fünfte `tuesday/breakfast`, der
    letzte `sunday/dinner`.
  - `EMPTY_WEEK_PLAN`: `plans no meal in any slot`.
  - `withMealIn`: `replaces exactly one slot` (auch die anderen drei Zeiten desselben
    Tages bleiben leer), `empties a slot again`, `leaves the plan it was given
    untouched`.
  - `shownMealIn`: die drei vorhandenen Fälle, pro Platz.
  - `plannedMeals`: `gives the meals in the order of the slots` (Mo-Abendessen vor
    Di-Frühstück), `keeps a meal that is planned in two slots twice`, `skips empty
    slots and meals that were deleted meanwhile`.
  - `plannedMealCount`: `counts no slot of an empty plan`, `counts only the slots that
    carry a meal that still exists`, `counts two slots of the same day twice`.
  - `isSuppliedIn`: die vorhandenen sieben Fälle, dazu `spends a single portion on the
    lunch before the dinner of the same day`.
  - `sameWeekPlan`: dazu `fails for two plans that differ in one meal time of the same
    day`.
  - `sameSlot`: `holds for the same day and time`, `fails for another time of the same
    day`.
  - `coveredSlotsOf`: die drei vorhandenen Fälle, pro Platz, in Wochenreihenfolge.
  - `weekPlanTransfer`: die vorhandenen Fälle, pro Platz. `follows the weekdays …`
    wird zu `follows the slots when several supplies are spent`.
  - `suppliedMealCount`: die drei vorhandenen Fälle.
  - `weekdayBefore` / `weekdayAfter`: `gives the day before Tuesday as Monday`, `has no
    day before Monday`, `gives the day after Saturday as Sunday`, `has no day after
    Sunday`.
- [ ] `src/meals/domain/weekPlan.ts` auf Plätze umbauen:
  ```ts
  export const MEAL_TIMES = ['breakfast', 'lunch', 'snack', 'dinner'] as const
  export type MealTime = (typeof MEAL_TIMES)[number]
  export type PlanSlot = { day: Weekday; time: MealTime }
  export const PLAN_SLOTS: readonly PlanSlot[] = WEEKDAYS.flatMap((day) =>
    MEAL_TIMES.map((time) => ({ day, time })),
  )
  export type DayPlan = Readonly<Record<MealTime, MealId | null>>
  export type WeekPlan = Readonly<Record<Weekday, DayPlan>>

  const EMPTY_DAY_PLAN: DayPlan = Object.fromEntries(
    MEAL_TIMES.map((time) => [time, null]),
  ) as DayPlan

  export function mealIn(plan: WeekPlan, slot: PlanSlot): MealId | null {
    return plan[slot.day][slot.time]
  }

  export function withMealIn(plan: WeekPlan, slot: PlanSlot, id: MealId | null): WeekPlan {
    return { ...plan, [slot.day]: { ...plan[slot.day], [slot.time]: id } }
  }

  function slotsBefore(slot: PlanSlot): readonly PlanSlot[] {
    return PLAN_SLOTS.slice(0, PLAN_SLOTS.findIndex((each) => sameSlot(each, slot)))
  }

  export function weekdayBefore(day: Weekday): Weekday | null {
    return WEEKDAYS[WEEKDAYS.indexOf(day) - 1] ?? null
  }
  ```
  `PlannedDay` wird zu `PlannedSlot = { slot, meal }`. Die übrigen Funktionen folgen
  den Umbenennungen aus „Abstraktionen und Wiederverwendung“.
- [ ] `src/meals/domain/weekPlanStage.test.ts` zuerst umschreiben: alle Fälle mit
  `coveredSlots`, dazu in `sameStage` `fails for two transfers that cover different
  meal times of the same day` und in `isCoveredIn` `keeps the covered lunch of the
  transfer but not the dinner of that day`.
- [ ] `src/meals/domain/weekPlanStage.ts` umbauen: `coveredSlots: readonly PlanSlot[] |
  null`, `transferredStage(coveredSlots)`, `sameSlots` über `sameSlot`,
  `isCoveredIn(stage, plan, slot, meals, supplies)`, `canTransfer(stage,
  plannedMeals)`.
- [ ] `src/meals/domain/randomPlanning.test.ts` zuerst umschreiben:
  - `rarestInThePlan`: `counts the slot that is being rolled as well`, dazu `counts
    the meals of every meal time of the week`.
  - `pickMealFor`: die vorhandenen Fälle, pro Platz.
  - `filledWeekPlan`: `fills 28 slots with 28 meals without repeating one`, `spreads
    three meals over the 28 slots as evenly as it can` (10/9/9), `walks through the
    candidates when the random source always gives zero`, `leaves the plan empty
    without a stored meal`.
- [ ] `src/meals/domain/randomPlanning.ts` umbauen:
  ```ts
  export type PlanningRule = (
    candidates: readonly Meal[],
    plan: WeekPlan,
    slot: PlanSlot,
  ) => readonly Meal[]

  function timesPlanned(plan: WeekPlan, meal: Meal): number {
    return PLAN_SLOTS.filter((slot) => mealIn(plan, slot) === meal.id).length
  }

  export function filledWeekPlan(candidates: readonly Meal[], random: RandomSource): WeekPlan {
    return PLAN_SLOTS.reduce((plan, slot) => {
      const picked = pickMealFor(candidates, plan, slot, random)
      return picked === null ? plan : withMealIn(plan, slot, picked.id)
    }, EMPTY_WEEK_PLAN)
  }
  ```
- [ ] `src/meals/domain/announcements.test.ts` zuerst anpassen (Blöcke ab Zeile 503):
  - `mealTimeName`: alle vier Namen.
  - `weekPlanHeading`: `Wochenplan, keine von 28`, `Wochenplan, 12 von 28`,
    `…, festgelegt`, `…, festgelegt, übertragen`.
  - `planFixedAnnouncement`: `Plan festgelegt, 12 von 28 Gerichten geplant.` und
    `Plan festgelegt, keine von 28 Gerichten geplant.`
  - `fixedSlotText`: `Snack, nichts geplant`, `Frühstück, Müsli`,
    `Frühstück, Müsli, im Vorrat`.
  - `randomMealLabel('breakfast')`: `Zufallsgericht für Frühstück`.
  - `mealTimeFieldLabel`: `Abendessen` und `Abendessen, im Vorrat`.
  - `slotPlannedAnnouncement`: `Mittagessen, Bolognese.` und
    `Mittagessen, Bolognese, im Vorrat.`
  - `weekPlanShuffledAnnouncement`: `Wochenplan neu gewürfelt, 28 Gerichte.`
  - `weekPlanTransferAnnouncement`: `1 Gericht aus dem Vorrat entnommen.` und
    `2 Gerichte aus dem Vorrat entnommen.` statt Tage. Der Satz `alle Gerichte aus
    dem Vorrat entnommen, nichts hinzugefügt.` bleibt.
  - `mealSuggestionsLabel('snack')`: `Vorschläge für Snack`.
  - `dayShownAnnouncement('saturday')`: `Samstag.`
  - `weekdayName` und `weekdayAbbreviation` bleiben unverändert.
- [ ] `src/meals/domain/announcements.ts` anpassen:
  ```ts
  const mealTimeNames: Record<MealTime, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    snack: 'Snack',
    dinner: 'Abendessen',
  }

  function plannedMealsPhrase(plannedMeals: number): string {
    return plannedMeals === 0
      ? `keine von ${PLAN_SLOTS.length}`
      : `${plannedMeals} von ${PLAN_SLOTS.length}`
  }
  ```
  Die übrigen Funktionen folgen den Umbenennungen, der Import von `WEEKDAYS` entfällt.
- [ ] `src/meals/api/firestoreWeekPlanClient.ts` umbauen:
  - `const MEALS = 'meals'` und `const MEAL_STAGE = 'mealStage'` ersetzen `CURRENT`
    und `STAGE`.
  - `toWeekPlan` liest `stored?.[day]?.[time]` und nimmt nur Strings, sonst `null`.
  - `toCoveredSlots` nimmt ein Array und behält nur Einträge, deren `day` ein Weekday
    und deren `time` eine MealTime ist (`isPlanSlot`). Alles andere ergibt `null`.
  - `fromWeekPlanStage` schreibt
    `coveredSlots: stage.coveredSlots?.map(({ day, time }) => ({ day, time })) ?? null`.
  - `writeWeekPlan` schreibt den Plan als verschachtelte Map
    (`Object.fromEntries(WEEKDAYS.map((day) => [day, { ...plan[day] }]))`).
- [ ] `src/meals/api/inMemoryWeekPlanClient.ts` und `weekPlanClient.ts`: übersetzen
  mit den neuen Typen, ohne Logikänderung.
- [ ] `src/meals/ui/useWeekPlan.test.tsx` auf Plätze umstellen, die drei Tests
  bleiben inhaltlich gleich. `useWeekPlan.ts`: `chooseMeal(slot, id)` über
  `withMealIn`.
- [ ] Die Icons anlegen, jeweils im Aufbau von `SnowflakeIcon.tsx`
  (`className="buttonIcon"`, `viewBox="0 0 24 24"`, `stroke="currentColor"`,
  `strokeWidth="2"`, `aria-hidden="true"`, `focusable="false"`), mit Lucide-Pfaden:
  - `src/meals/ui/SunriseIcon.tsx`: `M12 2v8`, `m4.93 10.93 1.41 1.41`, `M2 18h2`,
    `M20 18h2`, `m19.07 10.93-1.41 1.41`, `M22 22H2`, `m8 6 4-4 4 4`,
    `M16 18a4 4 0 0 0-8 0`
  - `src/meals/ui/SunIcon.tsx`: `<circle cx="12" cy="12" r="4" />`, `M12 2v2`,
    `M12 20v2`, `m4.93 4.93 1.41 1.41`, `m17.66 17.66 1.41 1.41`, `M2 12h2`,
    `M20 12h2`, `m6.34 17.66-1.41 1.41`, `m19.07 4.93-1.41 1.41`
  - `src/meals/ui/AppleIcon.tsx`:
    `M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z`,
    `M10 2c1 .5 2 2 2 5`
  - `src/meals/ui/MoonIcon.tsx`: `M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z`
  - `src/meals/ui/ChevronLeftIcon.tsx`: `m15 18-6-6 6-6`
  - `src/meals/ui/ChevronRightIcon.tsx`: `m9 18 6-6-6-6`
  - `src/meals/ui/MealTimeIcon.tsx`: `({ time }: { time: MealTime })`, wählt über eine
    `Record<MealTime, ComponentType>` (aus `react`) das passende Icon.
- [ ] `src/meals/ui/WeekPlanRow.tsx` umbauen:
  - Props: `slot: PlanSlot` statt `day`, `onChooseMeal(slot, id)`,
    `onShuffleSlot(slot)`.
  - `DayMarks` wird zu `MealTimeMarks({ time, inSupply })`:
    `<span className="mealTimeMark" aria-hidden="true"><MealTimeIcon time={time} /></span>`
    und dahinter unverändert `.supplyMark`.
  - Beschriftungen: `mealTimeFieldLabel`, `randomMealLabel(time)`,
    `mealSuggestionsLabel(time)`, `fixedSlotText(time, planned, inSupply)`.
  - `shownMealIn` und `isCoveredIn` pro Platz.
- [ ] `src/meals/ui/WeekPlanPage.tsx` umbauen:
  - Neue Props `shownDay: Weekday` und `onShowDay: (day: Weekday) => void`.
  - Zwischen `.pageHeader` und der Meldung „Noch keine Gerichte gespeichert.“ die
    Tageszeile:
    ```tsx
    <div className="dayNavigation">
      <DayStepButton label="Vorheriger Tag" target={weekdayBefore(shownDay)} onShowDay={onShowDay}>
        <ChevronLeftIcon />
      </DayStepButton>
      <h2>
        <span aria-hidden="true">{weekdayAbbreviation(shownDay)}</span>
        <span className="visuallyHidden">{weekdayName(shownDay)}</span>
      </h2>
      <DayStepButton label="Nächster Tag" target={weekdayAfter(shownDay)} onShowDay={onShowDay}>
        <ChevronRightIcon />
      </DayStepButton>
    </div>
    ```
    `DayStepButton` ist eine lokale Komponente: `className="iconButton"`,
    `aria-label={label}`, `aria-disabled={target === null}`, und `onClick` ruft
    `onShowDay(target)` nur auf, wenn `target !== null`.
  - Die Liste rendert
    `MEAL_TIMES.map((time) => <WeekPlanRow key={`${shownDay}-${time}`} slot={{ day: shownDay, time }} … />)`.
    Der Schlüssel enthält den Tag, damit beim Blättern halb Getipptes verworfen wird.
  - `plannedDayCount` wird zu `plannedMealCount`.
- [ ] `src/meals/ui/WeekPlanArea.tsx` umbauen:
  - Neue Props `shownDay` und `onShowDay`.
  - `chooseMeal(slot, id)` sagt `slotPlannedAnnouncement(slot.time, chosen,
    isSuppliedIn(planned, slot, meals, supplies))` an.
  - `shuffleSlot(slot)` nutzt `pickMealFor`.
  - `addToShoppingList` nutzt `transferredStage(coveredSlotsOf(…))`.
  - `showDay(day)` ruft `onShowDay(day)` auf und sagt `dayShownAnnouncement(day)` an.
- [ ] `src/SignedInApp.tsx`: `const [shownDay, setShownDay] = useState<Weekday>('monday')`
  neben `activeArea` anlegen und an `WeekPlanArea` durchreichen. Beim Übertragen wird
  `suppliedMealCount` statt `suppliedDayCount` genutzt.
- [ ] `src/index.css`:
  - `.weekday` wird zu `.mealTimeMark` (`flex: none; width: 24px; display: flex;
    align-items: center; justify-content: center;`).
  - Neu ist `.dayNavigation`
    (`display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1rem 0;`)
    mit `.dayNavigation h2 { margin: 0; font-size: 1.25rem; }`.
  - Die Pfeile nutzen das vorhandene `.iconButton` und das Grau aus
    `button[aria-disabled='true']`.
- [ ] `src/meals/ui/WeekPlanArea.test.tsx` umschreiben. `WeekPlanAreaUnderTest` hält
  `shownDay` selbst in `useState`, Start ist ein Parameter von `renderWeekPlanArea`
  mit dem Standard `'monday'`. Die Hilfen `dayField(name)` und `weekdayRows()` werden
  zu `mealTimeField(name)` und `mealTimeRows()`, und `markedWeekdays()` wird zu
  `markedMealTimes()` über die zugängliche Beschriftung der Felder. Die vorhandenen
  Tests bleiben inhaltlich erhalten und laufen pro Platz des gezeigten Tages. Neu
  sind:
  - `shows the four meal times of the shown day`: Die Felder heißen `Frühstück`,
    `Mittagessen`, `Snack` und `Abendessen`, und die `<h2>` heißt `Montag`.
  - `shows an icon in front of every meal time`: Jede Zeile hat ein `svg` in
    `.mealTimeMark`, und alle stehen auf `aria-hidden`.
  - `steps to the next day and says which it is`: Nach einem Druck auf `Nächster
    Tag` heißt die `<h2>` `Dienstag`, die Ansage lautet `Dienstag.`, und der Knopf
    hat weiter den Fokus.
  - `steps back to the day before`: Start am Mittwoch, dann `Vorheriger Tag`.
  - `locks the step back on Monday`: `Vorheriger Tag` hat `aria-disabled="true"`,
    ein Druck lässt `Montag` stehen und sagt nichts an.
  - `locks the step forward on Sunday`: entsprechend für `Nächster Tag`.
  - `shows the meals of the day that was stepped to`: Plan mit Bolognese am
    Dienstag-Mittag, nach `Nächster Tag` hat `Mittagessen` den Wert `Bolognese`.
  - `forgets what was typed when the day changes`: in `Frühstück` tippen, blättern,
    zurückblättern, das Feld ist leer.
  - `rolls the whole week and not only the shown day`: `Zufallsauswahl generieren`,
    danach sind in `weekPlanClient.storedWeekPlan()` alle 28 Plätze belegt.
  - `hands over the meals of every day, not only of the shown one`.
  - `names the heading after the planned meals`: `Wochenplan, 2 von 28`.
  - `has no accessibility violations on a day in the middle of the week` (Mittwoch,
    beide Pfeile bedienbar) und `has no accessibility violations on Sunday`.
  - Entfallen: `shows a row for every weekday of an empty plan` und `names every
    field after the full weekday`, beide ersetzt durch den ersten neuen Test.
- [ ] `src/SignedInApp.test.tsx`: Die Tests zum Wochenplan (Zeile 266-714) nutzen
  Plätze und die neuen Beschriftungen. `says which meal was planned by hand on which
  day` wird zu `says which meal was planned by hand for which meal time`. Neu ist
  `keeps the shown day after a visit to the meals area`: `Nächster Tag`, dann
  `Gerichte`, dann `Wochenplan`, die `<h2>` heißt `Dienstag`.
- [ ] `firestore.rules.test.ts`: Die Dokumente heißen `meals` und `mealStage`. Die
  Testdaten `weekPlan` und `weekPlanStage` (Zeile 58-68) bekommen die neue Form.
- [ ] `e2e/emulatorHousehold.ts`:
  - `weekPlanOnServer` liest `weekPlan/meals` und gibt
    `Record<string, string | null>` mit Schlüsseln wie `monday.lunch` zurück
    (`fields[day].mapValue.fields[time].stringValue`).
  - `weekPlanStageOnServer` liest `weekPlan/mealStage` und gibt
    `coveredSlots: readonly string[] | null` im selben Format `monday.lunch` zurück.
- [ ] `e2e/keyboard.ts`: `stepToDay(page, dayName)` drückt `Nächster Tag`, bis die
  `<h2>` `dayName` heißt. Das geht höchstens sechsmal, der Test startet am Montag.
- [ ] `e2e/weekPlan.spec.ts` umschreiben:
  - `plans a week and puts its items on the shopping list`: `Mittagessen` statt
    `Montag`, Überschrift `Wochenplan, 1 von 28`, danach `28 Gerichte` und
    `28 von 28`, 28 belegte Plätze auf dem Server. Die Einkaufsliste zeigt
    `Hackfleisch, 14000 g` und `Spaghetti, 28`.
  - `buys only the meal that the supply no longer covers`: Montag-`Mittagessen`
    Bolognese, Montag-`Abendessen` Chili, Dienstag-`Mittagessen` Bolognese (über
    `stepToDay`). Die Ansage lautet
    `Wochenplan, 2 Artikel hinzugefügt. 1 Gericht aus dem Vorrat entnommen.`
  - `keeps the week plan after a reload`: Freitag-`Abendessen`, gewartet wird auf
    `friday.dinner` auf dem Server. Nach dem Neuladen `stepToDay(page, 'Freitag')`.
  - `keeps the fixed plan after a reload`: Ansage
    `Plan festgelegt, 1 von 28 Gerichten geplant.`, Überschrift
    `Wochenplan, 1 von 28, festgelegt`.
  - `transfers a fixed plan only once`: `coveredSlots` ist `['monday.lunch']`, und der
    Text lautet `Mittagessen, Bolognese, im Vorrat`.
  - `never rolls a hidden meal into the week`: Alle 28 Plätze tragen dasselbe Gericht.
  - `lines the meal time field up with its shuffle button`: `Frühstück` und
    `Zufallsgericht für Frühstück`.
  - Neu ist `steps through the week with the arrows`: Am Montag ist `Vorheriger Tag`
    `aria-disabled`, nach sechs Drücken auf `Nächster Tag` ist die `<h2>` `Sonntag`
    und `Nächster Tag` `aria-disabled`.

**Automatisierte Verifikation**:

- [ ] `npm run test` läuft durch.
- [ ] `PLAN_SLOTS` hat 28 Einträge in der Reihenfolge Mo-Frühstück … So-Abendessen.
- [ ] `filledWeekPlan` belegt alle 28 Plätze, und `rarestInThePlan` zählt über alle
  Tageszeiten.
- [ ] `isSuppliedIn` verbraucht eine Portion am Mittagessen vor dem Abendessen
  desselben Tages.
- [ ] `locks the step back on Monday` und `locks the step forward on Sunday` sind grün,
  der Fokus bleibt auf dem Pfeil.
- [ ] `keeps the shown day after a visit to the meals area` ist grün.
- [ ] Alle `has no accessibility violations …`-Tests des Wochenplans sind grün.
- [ ] `npm run test:rules` läuft durch.
- [ ] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [ ] `npm run build` übersetzt ohne Typfehler.
- [ ] `npm run test:e2e` läuft durch, einschließlich `steps through the week with the
  arrows`.

**Manuelle Verifikation**:

- [ ] Mit VoiceOver den Wochenplan öffnen und durchwischen: Man hört
  `Wochenplan, … von 28`, `Vorheriger Tag, abgeblendet`, `Montag, Überschrift`,
  `Nächster Tag`, dann `Frühstück`, `Zufallsgericht für Frühstück` und so weiter bis
  `Abendessen`. Die Icons werden nicht vorgelesen.
- [ ] `Nächster Tag` mehrmals doppeltippen: Jedes Mal kommt die Ansage des neuen Tages,
  und der Fokus bleibt auf dem Pfeil. Am Sonntag ist der Knopf abgeblendet, und ein
  weiterer Doppeltipp bewirkt nichts.
- [ ] Die vier Icons sind auf dem Handy erkennbar und stehen bündig. Die Felder aller
  vier Zeilen stehen gleich weit rechts, mit und ohne Schneeflocke, auch bei
  eingeschalteter Farbumkehr.
- [ ] Die gesperrten Pfeile sind sichtbar ausgegraut.
- [ ] Einen Platz am Dienstag auf dem einen Gerät planen. Auf dem zweiten Gerät
  erscheint er, sobald man dort zum Dienstag blättert.

### Phase 2: Heute als Starttag

Abhängigkeiten: Phase 1.

Beim ersten Öffnen nach dem Start der App zeigt der Wochenplan den heutigen Wochentag.
Die Uhr wird eingespeist.

**Aufgaben**:

- [ ] In `src/meals/domain/weekPlan.test.ts` zuerst `weekdayOf` testen:
  - `names a Monday as monday`: `new Date(2026, 8, 21, 12)` ergibt `'monday'`.
  - `names a Sunday as sunday`: `new Date(2026, 8, 27, 12)` ergibt `'sunday'`, weil
    `getDay()` hier `0` liefert.
  - `takes the local day shortly after midnight`: `new Date(2026, 8, 25, 0, 5)` ergibt
    `'friday'`.
- [ ] `src/shared/domain/clock.ts` anlegen: `export type Clock = () => Date`.
- [ ] `weekdayOf` in `src/meals/domain/weekPlan.ts`:
  ```ts
  const DAYS_FROM_SUNDAY_TO_MONDAY = 6

  export function weekdayOf(date: Date): Weekday {
    return WEEKDAYS[(date.getDay() + DAYS_FROM_SUNDAY_TO_MONDAY) % WEEKDAYS.length]
  }
  ```
- [ ] `src/SignedInApp.tsx`: Die Prop `clock?: Clock` bekommt den Standard
  `() => new Date()`, und der Startwert lautet
  `useState<Weekday>(() => weekdayOf(clock()))`. `App.tsx` und `main.tsx` bleiben
  unverändert, weil sie den Standard nutzen.
- [ ] `src/SignedInApp.test.tsx`: Die Hilfsfunktion zum Rendern bekommt eine feste Uhr,
  standardmäßig einen Montag (`() => new Date(2026, 8, 21, 12)`), damit die Tests aus
  Phase 1 unverändert bleiben. Neu sind:
  - `opens the week plan on the day of today`: Die Uhr steht auf Freitag, die `<h2>`
    heißt `Freitag`.
  - `keeps the stepped day although the clock moves on`: Die Uhr gibt erst Freitag,
    dann Samstag. Nach `Vorheriger Tag` und einem Besuch bei `Gerichte` heißt die
    `<h2>` `Donnerstag`.
- [ ] `e2e/weekPlan.spec.ts`: In `test.beforeEach` die Zeit festsetzen, bevor
  `page.goto` läuft:
  `await page.clock.setFixedTime(new Date('2026-09-21T12:00:00'))`, ein Montag. So
  laufen die Tests aus Phase 1 unverändert. Neu ist `opens the week plan on the day of
  today`: Die Zeit steht auf `2026-09-25T12:00:00`, die `<h2>` heißt `Freitag`, und
  `Vorheriger Tag` und `Nächster Tag` sind beide bedienbar.
- [ ] `docs/notes.txt`: Die Punkte `3 Zeilen pro Tag im Wochenplan` (Zeile 135) und
  unter `Wochenplan erweitern` die Unterpunkte `Tag steht oben, links und rechts
  buttons …` (Zeile 150) und `4 Zeilen mit passenden Icons …` (Zeile 151) auf `x`
  setzen und nach DONE verschieben. Der Oberpunkt `Wochenplan erweitern` bleibt mit
  seinen offenen Unterpunkten (Date-Picker, Anzahl-Tage) unter TODO stehen. Unten
  unter TODO anhängen:
  ```
  - Zufallsregeln: der Wochenplan hat seit MZP-028 vier Plaetze pro Tag
    (MealTime 'breakfast' | 'lunch' | 'snack' | 'dinner'); PlanningRule bekommt den
    PlanSlot, die Regeln oben koennen slot.time mit meal.kind vergleichen
  - Firestore: weekPlan/current und weekPlan/stage werden seit MZP-028 nicht mehr
    gelesen und koennen von Hand geloescht werden
  ```

**Automatisierte Verifikation**:

- [ ] `npm run test` läuft durch, besonders `weekdayOf` für Sonntag und kurz nach
  Mitternacht.
- [ ] `opens the week plan on the day of today` und `keeps the stepped day although
  the clock moves on` sind grün.
- [ ] `npm run lint` und `npm run build` laufen durch.
- [ ] `npm run test:e2e` läuft durch, einschließlich `opens the week plan on the day of
  today`.

**Manuelle Verifikation**:

- [ ] Die App auf dem Handy neu laden und den Wochenplan öffnen. Es steht der heutige
  Wochentag da.
- [ ] Zu einem anderen Tag blättern, zu `Gerichte` wechseln und zurück. Der geblätterte
  Tag steht noch da. Nach dem Neuladen steht wieder der heutige Tag da.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/notes.txt:135`, `:145-151`: das Vorhaben
- `docs/notes.txt:152-164`: die späteren Würfelregeln nach Tageszeit
- `docs/agents/plans/2026-09-19-wochenplan-mit-zufallsauswahl.md`: Einführung von
  Wochenplan, `PlanningRule` und `rarestInThePlan`
- `docs/agents/plans/2026-09-24-wochenplan-festlegen-und-einmal-uebertragen.md`:
  `WeekPlanStage` und `coveredDays`
- `docs/agents/plans/2026-09-25-verspaetete-momentaufnahmen-beheben.md`: MZP-027,
  `isStaleSnapshot` in `useWeekPlan`
- Lucide-Icons (ISC-Lizenz): https://lucide.dev/icons/sunrise, `/sun`, `/apple`,
  `/moon`, `/chevron-left`, `/chevron-right`
- Playwright Clock: https://playwright.dev/docs/clock
