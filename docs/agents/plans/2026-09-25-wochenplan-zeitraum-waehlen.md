---
date: 2026-09-25T20:24:39+00:00
git_commit: 4d5cc17c15ee7f766df017a85fc95b4859efcf8e
branch: main
story: MZP-035
topic: "Wochenplan: Zeitraum wählen"
tags: [plan, meals, weekPlan, domain, api, ui, firestore]
status: done
---

# PLAN: MZP-035 — Wochenplan: Zeitraum wählen

Der Wochenplan bekommt rechts neben der Überschrift einen Knopf „Zeitraum wählen“. Er
öffnet die Seite „Zeitraum“. Dort wählt man ein Startdatum und eine Anzahl Tage (1–10).
Nach „Übernehmen“ zeigt der Wochenplan genau diese Tage. Dafür wird der Plan von festen
Wochentagen (Mo.–So.) auf Kalenderdaten umgestellt.

Das Vorhaben steht in `docs/notes.txt` unter TODO („Wochenplan erweitern – oben
Date-Picker für Startdatum – daneben Anzahl-Tage-Selector – Ab dem Datepickertag und für
anzahl tage wird geplant“). Alle Entscheidungen stammen aus der Befragung vom 2026-09-25.

## Akzeptanzkriterien

- Rechts neben der Wochenplan-Überschrift steht ein Icon-Knopf (`calendar-cog`) mit dem
  VoiceOver-Namen „Zeitraum wählen“ und ohne sichtbaren Text.
- Im Lese-Modus (festgelegt oder übertragen) ist der Knopf ausgegraut
  (`aria-disabled="true"`). Ein Druck öffnet nichts und löst keine Ansage aus.
- Im Bearbeitungsmodus öffnet der Knopf die Seite „Zeitraum“:
  - oben der Knopf „Zurück zum Wochenplan“, der ohne Speichern zurückführt
  - die Überschrift `Zeitraum` (h1), die beim Öffnen den Fokus bekommt
  - „Startdatum“ als Stepper („Ein Tag früher“ / „Ein Tag später“), vorbelegt mit dem
    gespeicherten Start, sichtbar `Fr. 25.09.`, für VoiceOver `Freitag, 25. September`;
    jeder Schritt sagt den neuen Tag an (Änderung nach der Handprüfung, siehe Notizen)
  - „Anzahl Tage“ als Stepper, vorbelegt mit der gespeicherten Anzahl; „Ein Tag weniger“
    ist bei 1 gesperrt, „Ein Tag mehr“ bei 10
  - in der unteren Leiste der Knopf „Übernehmen“
- „Übernehmen“:
  - speichert den Zeitraum für den ganzen Haushalt
  - verwirft die Gerichte aller Tage außerhalb des neuen Zeitraums und behält die Tage
    darin
  - führt zum Wochenplan zurück, dessen Überschrift den Fokus bekommt
  - sagt zum Beispiel `Zeitraum Freitag, 25. September bis Sonntag, 4. Oktober, 10 Tage.`
    an, bei einem Tag `Zeitraum Freitag, 25. September, 1 Tag.`
- Jeder Tag ist als Start erlaubt, auch einer in der Vergangenheit.
- Der Wochenplan zeigt genau die Tage des Zeitraums:
  - Tagesansicht: Überschrift sichtbar `Fr. 25.09.`, für VoiceOver
    `Freitag, 25. September`
  - Wochenansicht: jede Zeile beginnt sichtbar mit `Fr. 25.`, Felder, Knöpfe und
    Ansagen nennen den Tag `Freitag, 25. September`
  - Blättern mit ‹ › endet am ersten und am letzten Tag des Zeitraums
- Die Überschrift zählt `x von y`, dabei ist y die Anzahl der Tage mal 4. Würfeln,
  Leeren, Vorrat und Übertragung auf die Einkaufsliste wirken nur auf die Tage des
  Zeitraums.
- In den Zufallsregeln ist der „Vortag“ der Kalendertag davor, auch über einen Sonntag
  hinweg.
- Gezeigter Tag: Solange der zuletzt gewählte Tag im Zeitraum liegt, bleibt er stehen.
  Sonst wird heute gezeigt, wenn heute im Zeitraum liegt, andernfalls der erste Tag. Das
  gilt beim Start, nach „Übernehmen“ und wenn das andere Gerät den Zeitraum ändert. Nach
  „Übernehmen“ gilt der zuletzt gewählte Tag als verworfen.
- Ohne gespeicherten Zeitraum gilt die aktuelle Woche Mo.–So. Ein vorhandener Plan nach
  Wochentagen und die festgehaltenen Vorrats-Plätze nach Wochentagen erscheinen auf den
  Daten dieser Woche.
- Die Barrierefreiheitsprüfung (axe) findet auf der Seite „Zeitraum“ und im Wochenplan
  nichts.

## Wesentliche Entscheidungen und Abwägungen

1. **Der Plan wird nach Kalenderdatum gespeichert, nicht nach Wochentag:**
   - Warum: In einem 10-Tage-Zeitraum kommen Wochentage doppelt vor. Diese Tage würden
     sich sonst einen Platz teilen.
   - Auswirkung: `PlanSlot` wird `{ date: PlanDate; time: MealTime }`, und `WeekPlan`
     bekommt einen Zeitraum samt Tagen. `PLAN_SLOTS` und `EMPTY_WEEK_PLAN` werden zu
     Funktionen des Zeitraums. Umgestellt werden `weekPlan`, `randomPlanning`,
     `weekPlanView`, `weekPlanStage`, `announcements`, der Adapter, die UI und alle
     zugehörigen Tests.
2. **`PlanDate` ist ein Kalenderdatum als Text `JJJJ-MM-TT`:**
   - Warum: Es ist genau der Wert von `<input type="date">`, lässt sich als
     Firestore-Schlüssel verwenden und hat keine Zeitzone. Gerechnet wird über
     `Date.UTC`, damit die Sommerzeit-Umstellung keinen Tag verschluckt.
   - Auswirkung: neue Domänendatei `planDate.ts` mit reinen Funktionen, dazu ein
     Markentyp, damit nicht jeder beliebige Text als Datum durchgeht.
3. **Der Zeitraum ist ein Domänenwert `PlanPeriod { start, days }` mit der Invariante
   1 ≤ days ≤ 10:**
   - Warum: Die Grenze ist eine fachliche Regel und gehört nicht in den Stepper.
   - Auswirkung: `createPlanPeriod(draft)` prüft Start und Tage und wirft
     `InvalidPlanPeriod`. Der Adapter liest ungültige gespeicherte Werte als „kein
     Zeitraum“, dann gilt die aktuelle Woche.
4. **Der Zeitraum gilt für den ganzen Haushalt und liegt mit dem Plan im selben
   Firestore-Dokument `weekPlan/datedMeals`:**
   - Warum: Kürzen und neuer Zeitraum kommen so in einem Schreibvorgang und einer
     Momentaufnahme an. Kein Gerät sieht einen Mischstand aus neuem Zeitraum und altem
     Plan. Die Regel `match /weekPlan/{document}` (`firestore.rules`) deckt das Dokument
     schon ab, ein Regel-Deployment ist nicht nötig.
   - Auswirkung: Es gibt keine neue Methode am Port. `writeWeekPlan` schreibt den
     Zeitraum mit, und der Schutz vor verspäteten Momentaufnahmen in `useWeekPlan`
     (`isStaleSnapshot` mit `sameWeekPlan`) deckt ihn mit ab, sobald `sameWeekPlan`
     den Zeitraum vergleicht.
5. **„Übernehmen“ verwirft die Tage außerhalb des neuen Zeitraums:**
   - Warum: Entscheidung des Nutzers. Das Dokument bleibt so klein.
   - Auswirkung: `withPeriod(plan, period)` behält nur die Tage im neuen Zeitraum.
     `replacePlan` schreibt das Ergebnis.
6. **Umzug beim Lesen, geschrieben wird erst beim ersten Ändern:**
   - Warum: Beim ersten Start nach dem Update soll sich nichts Sichtbares ändern.
   - Auswirkung: Fehlt `weekPlan/datedMeals`, liest der Adapter einmal
     `weekPlan/meals` (Wochentage) und legt es mit `weekPlanFromWeekdays` auf die
     aktuelle Woche. Der Plan wird erst gespeichert, wenn jemand etwas ändert. Alte
     `coveredSlots` in `weekPlan/mealStage` mit `day: 'monday'` werden ebenfalls auf die
     aktuelle Woche gelegt, neue werden als `{ date, time }` gespeichert. Der Adapter
     bekommt dafür die `Clock`. `weekPlan/meals` kommt in `notes.txt` auf die Liste
     „kann von Hand gelöscht werden“.
7. **Der gezeigte Tag wird abgeleitet, nicht per Effekt korrigiert:**
   - Warum: Die Regel greift beim Start, nach „Übernehmen“ und bei einem Zeitraum vom
     anderen Gerät, und zwar ohne `useEffect` und ohne zusätzliches Rendern.
   - Auswirkung: `SignedInApp` merkt sich `chosenDay: PlanDate | null`.
     `shownDayIn(period, chosenDay, today)` in der Domäne liefert den gezeigten Tag.
     „Übernehmen“ setzt `chosenDay` auf `null`.
8. **Die Seite „Zeitraum“ ist eine Unterseite von `WeekPlanArea`:**
   - Warum: Sie folgt demselben Muster wie `SuppliesArea` mit `page`-Zustand und
     `AddSupplyPage` mit Zurück-Knopf, Fehlermeldung und `BottomBar`.
   - Auswirkung: `WeekPlanArea` bekommt `useState<'plan' | 'period'>`. Wer den Bereich
     wechselt, landet beim nächsten Mal wieder auf dem Plan.
9. **Der Knopf wird mit `aria-disabled` gesperrt, nicht mit `disabled`:**
   - Warum: Er bleibt so für VoiceOver erreichbar und wird als abgeblendet gemeldet, wie
     „Auf die Einkaufsliste“ und „Wochenplan leeren“ (MZP-024 Entscheidung 5, MZP-029
     Entscheidung 4).
   - Auswirkung: `canChoosePeriod(stage)` in `weekPlanStage.ts`. `WeekPlanArea` prüft
     die Regel vor dem Öffnen.
10. **Um Mitternacht springt die Ansicht nicht auf den neuen Tag:**
    - Warum: Das ist schon heute so. `today` wird wie bisher `clock()` beim Rendern
      entnommen, ohne Zeitgeber.
    - Auswirkung: Es ist keine Änderung nötig.

## Ausgangslage

```
Firestore  weekPlan/meals        { monday: {breakfast,lunch,snack,dinner}, …, sunday }
           weekPlan/mealStage    { mode, coveredSlots: [{ day: 'monday', time }] | null }
           weekPlan/rollingRules { mainMealTime }
               │
   src/meals/api/firestoreWeekPlanClient.ts:34-45   toWeekPlan / fromWeekPlan (7 Wochentage)
               │
   src/meals/ui/useWeekPlan.ts        plan, stage, mainMealTimeRule, Schutz vor
               │                      verspäteten Momentaufnahmen (isStaleSnapshot)
   src/SignedInApp.tsx:141            shownDay = weekdayOf(clock())
               │
   src/meals/ui/WeekPlanArea.tsx      Würfeln, Leeren, Festlegen, Übertragen, Ansagen
   src/meals/ui/WeekPlanPage.tsx      Überschrift, Tages-/Wochenansicht, BottomBar
   src/meals/ui/WeekPlanRow.tsx       eine Zeile (Tageszeit-Icon oder "Fr.")
```

Wochentag-Abhängigkeiten, die umgestellt werden:

- `src/meals/domain/weekPlan.ts:4-52`: `WEEKDAYS`, `Weekday`, `PlanSlot { day }`,
  `PLAN_SLOTS` (28 Plätze), `EMPTY_WEEK_PLAN`, `weekdayOf`, `weekdayBefore`,
  `weekdayAfter`. Dazu alles, was über `PLAN_SLOTS` läuft: `sameWeekPlan`,
  `slotsBefore`, `plannedSlots`, `coveredSlotsOf`.
- `src/meals/domain/weekPlanView.ts:17-25`: `shownSlots` mit `WEEKDAYS`.
- `src/meals/domain/randomPlanning.ts`: `filledWeekPlan` (`:271-278`, `WEEKDAYS`,
  `EMPTY_WEEK_PLAN`), `timesPlanned` (`:141`, `PLAN_SLOTS`),
  `neighbouringMainMealSlots` (`:157`, `weekdayBefore/After`), `mealOfTheDayBefore`
  (`:194`), `kindsBesideTheOtherMainMealTime` und `filledDay` (`day: Weekday`).
- `src/meals/domain/announcements.ts:237-273`: `weekdayName`, `weekdayAbbreviation`,
  `dayShownAnnouncement`, `dayViewShownAnnouncement`, `slotName`,
  `plannedMealsPhrase` (fest `PLAN_SLOTS.length`), und damit `weekPlanHeading`,
  `planFixedAnnouncement`, `weekPlanShuffledAnnouncement`.
- `src/meals/ui/WeekPlanPage.tsx:97-126`: `DayNavigation` mit `weekdayBefore/After`
  und `weekdayAbbreviation/Name`.
- `src/meals/ui/WeekPlanRow.tsx:64`: `weekdayAbbreviation(slot.day)`.
- `src/meals/ui/WeekPlanArea.tsx:139`: `replacePlan(EMPTY_WEEK_PLAN)`.
- `src/SignedInApp.tsx:141, 284`: `shownDay`.
- `e2e/emulatorHousehold.ts:163-232, 382-405`: liest `weekPlan/meals` und
  `coveredSlots` mit `day`.

Die Wochenplan-Seite heute:

```
┌──────────────────────────────┐
│ Wochenplan, 5 von 28         │
│ ‹          Fr.          › [▦]│
│ 🌅 [Müsli            ] 🔀    │
│ ☀ ❄[Spaghetti        ] 🔀    │
│ 🍎 [                 ] 🔀    │
│ 🌙 [                 ] 🔀    │
├──────────────────────────────┤
│  🔀  │  🔒  │ (🛒) │  ⌫      │
└──────────────────────────────┘
```

## Zielbild

Datenmodell:

```ts
type PlanDate = string & { readonly planDate: unique symbol }   // 'JJJJ-MM-TT'
type PlanPeriod = { start: PlanDate; days: number }             // 1 ≤ days ≤ 10
type PlanSlot = { date: PlanDate; time: MealTime }
type WeekPlan = {
  period: PlanPeriod
  days: Readonly<Record<PlanDate, DayPlan>>                     // nur Tage im Zeitraum
}
```

Firestore:

```
weekPlan/datedMeals  { start: '2026-09-25', days: 10,
                       plan: { '2026-09-25': { breakfast, lunch, snack, dinner }, … } }
weekPlan/mealStage   { mode, coveredSlots: [{ date: '2026-09-25', time }] | null }
weekPlan/meals       wird nur noch gelesen, solange datedMeals fehlt
```

Wochenplan, Tagesansicht:

```
Bearbeitungsmodus                       Lese-Modus
┌──────────────────────────────┐        ┌──────────────────────────────┐
│ Wochenplan, 5 von 40    [📅⚙]│        │ Wochenplan, 5 von 40,  (📅⚙) │
│ ‹       Fr. 25.09.      › [▦]│        │ festgelegt          ausgegraut│
│ 🌅 [Müsli            ] 🔀    │        │ ‹       Fr. 25.09.      › [▦]│
│ …                            │        │ …                            │
└──────────────────────────────┘        └──────────────────────────────┘
```

Wochenansicht (Mittagessen, Zeitraum 25.09., 10 Tage):

```
┌──────────────────────────────┐
│ Wochenplan, 5 von 40    [📅⚙]│
│ 🌅 [☀] 🍎 🌙              [▣]│
│ Fr. 25. ❄[Spaghetti     ] 🔀 │
│ Sa. 26.  [Linsensuppe   ] 🔀 │
│ …                            │
│ So. 04.  [              ] 🔀 │
└──────────────────────────────┘
```

Neue Seite „Zeitraum“:

```
┌──────────────────────────────┐
│ [Zurück zum Wochenplan]      │
│ Zeitraum                     │  ← h1, Fokus beim Öffnen
│                              │
│ Startdatum                   │
│ [ 25.09.2026           ▾ ]   │  ← <input type="date">
│ Bitte ein Startdatum wählen. │  ← nur bei leerem Feld
│                              │
│ Anzahl Tage                  │
│  [−]   10   [+]              │  ← Stepper, 1–10
├──────────────────────────────┤
│        [✓ Übernehmen]        │
└──────────────────────────────┘
```

Ablauf „Übernehmen“:

```
PeriodPage.apply()
  └─ createPlanPeriod({ start, days })   wirft InvalidPlanPeriod('startMissing')
       │                                  → Fehlermeldung, announce, Fokus ins Feld
       └─ onApply(period)
            └─ WeekPlanArea.applyPeriod(period)
                 ├─ canChoosePeriod(stage)? nein → nichts
                 ├─ weekPlanning.replacePlan(withPeriod(plan, period))
                 ├─ onPeriodApplied()        → SignedInApp: chosenDay = null
                 ├─ setPage('plan')          → WeekPlanPage, Fokus auf h1
                 └─ announce(periodAppliedAnnouncement(period))
```

Gezeigter Tag:

```
shownDayIn(period, chosenDay, today)
  chosenDay im Zeitraum?  → chosenDay
  today im Zeitraum?      → today
  sonst                   → period.start
```

## Abstraktionen und Wiederverwendung

Wiederverwendet werden `useWeekPlan.replacePlan` samt Schutz vor verspäteten
Momentaufnahmen (MZP-027), `BottomBar`, `useHeadingFocus`, `Stepper`, das
Fehler-Muster von `AddSupplyPage` (`failure`-Absatz, `aria-describedby`, `announce`,
Fokus ins Feld), die CSS-Regel `button[aria-disabled='true']` und `.pageHeader`
(`src/index.css:165`, schon `space-between`). Der Port `WeekPlanClient` behält seine
Methoden.

- `src/meals/domain`
  - `planDate.ts` — neu, Kalenderdatum
    - `PlanDate`, `isPlanDate(value)`, `toPlanDate(text)`, `planDateOf(date: Date)` (lokales Datum)
    - `WEEKDAYS`, `Weekday` (aus `weekPlan.ts` hierher verschoben)
    - `daysAfter(date, count)`, `weekdayOf(date)`, `dayOfMonth(date)`,
      `monthOf(date)` (1–12)
  - `planDate.test.ts` — neu
  - `planPeriod.ts` — neu, Zeitraum
    - `MIN_PERIOD_DAYS = 1`, `MAX_PERIOD_DAYS = 10`, `PlanPeriod`, `PlanPeriodDraft`
    - `createPlanPeriod(draft)`, `InvalidPlanPeriod` (`reason: 'startMissing' | 'daysOutOfRange'`)
    - `isPlanPeriod(value)` für den Adapter
    - `weekOf(today)` (Mo.–So. der Woche von `today`)
    - `datesOf(period)`, `lastDateOf(period)`, `includesDate(period, date)`
    - `dateBefore(period, date)` / `dateAfter(period, date)` (`null` am Rand)
    - `samePeriod(one, other)`, `canHaveFewerDays(days)`, `canHaveMoreDays(days)`
    - `shownDayIn(period, chosenDay, today)`
  - `planPeriod.test.ts` — neu
  - `weekPlan.ts` — auf Datum umgestellt
    - entfällt: `Weekday`-Plätze, `PLAN_SLOTS`, `EMPTY_WEEK_PLAN`, `weekdayBefore`,
      `weekdayAfter`, `weekdayOf` (wandert nach `planDate.ts`)
    - `WEEKDAYS` und `Weekday` werden aus `planDate.ts` weiter exportiert
    - neu: `planSlotsOf(period)`, `emptyWeekPlan(period)`, `emptied(plan)`,
      `withPeriod(plan, period)`, `slotCountOf(plan)`,
      `weekPlanFromWeekdays(weekdays, week)`, `dateOfWeekday(week, day)`
    - angepasst: `PlanSlot { date, time }`, `mealIn` (fehlender Tag → `null`),
      `withMealIn`, `sameSlot`, `sameWeekPlan` (auch Zeitraum), `slotsBefore`,
      `plannedSlots`, `coveredSlotsOf`
  - `weekPlanView.ts` — `shownSlots(view, period, day, time)`
  - `weekPlanStage.ts` — neu `canChoosePeriod(stage)`
  - `randomPlanning.ts` — `day: PlanDate`, Nachbartage und Vortag über
    `dateBefore/dateAfter(plan.period, …)`, `filledWeekPlan(meals, period, random, rule)`
  - `announcements.ts` — Tagesnamen mit Datum, Anzahl aus dem Zeitraum, neue Ansagen
    und Beschriftungen für die Seite „Zeitraum“
- `src/meals/api`
  - `firestoreWeekPlanClient.ts` — Dokument `datedMeals`, Umzug aus `meals`,
    `coveredSlots` mit `date`, Parameter `clock`
  - `inMemoryWeekPlanClient.ts` — Startwert `emptyWeekPlan(weekOf(A_MONDAY))` statt
    `EMPTY_WEEK_PLAN`; Parameter `initialPlan` bleibt, jetzt ohne festen Standard
- `src/meals/ui`
  - `CalendarCogIcon.tsx` — neu
  - `PeriodPage.tsx` — neu, Seite „Zeitraum“
  - `WeekPlanArea.tsx` — Unterseite, `applyPeriod`, `today`, Tagesauswahl
  - `WeekPlanPage.tsx` — Knopf im Kopf, `DayNavigation` mit Datum
  - `WeekPlanRow.tsx` — Zeilenanfang `Fr. 25.`
  - `useWeekPlan.ts` — Startzustand aus einem übergebenen Zeitraum
- `src/shared/ui/Stepper.tsx` — optionales `lessDisabled` (Standard `false`)
- `src/SignedInApp.tsx` — `chosenDay`, `today`, `clock` an `useWeekPlan`
- `src/main.tsx` — `clock` an `createFirestoreWeekPlanClient`
- `src/index.css` — `.weekdayMark` so breit, dass `Fr. 25.` passt
- `e2e/emulatorHousehold.ts`, `e2e/weekPlan.spec.ts` — neues Dokument, Datumsnamen,
  neuer Ablauf
- `docs/notes.txt` — Punkt abhaken, `weekPlan/meals` zum Löschen vormerken

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Die Domäne wird test-getrieben entwickelt: Jede Aufgabe an einer Domänendatei beginnt
mit dem fehlschlagenden Test in der zugehörigen `.test.ts`. Testdaten verwenden die
Woche ab Montag, 21.09.2026 (`A_MONDAY` in den vorhandenen Tests). Wo vorhandene Tests
heute `slot('monday', 'lunch')` schreiben, bekommen sie Konstanten wie
`const MONDAY = planDate('2026-09-21')`, damit die Tests ihre Absicht behalten.

### Phase 1: Plan nach Kalenderdatum

Abhängigkeiten: keine.

Der Plan wird nach Datum gespeichert und hat einen Zeitraum. Ohne gespeicherten
Zeitraum gilt die aktuelle Woche, ein vorhandener Wochentag-Plan wird darauf gelegt.
Nach außen bleibt alles wie heute, nur die Tage tragen jetzt ein Datum.

**Aufgaben**:

- [x] `src/meals/domain/planDate.test.ts` / `planDate.ts` anlegen:

  ```ts
  export type PlanDate = string & { readonly planDate: unique symbol }

  const PLAN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
  const MILLISECONDS_PER_DAY = 86_400_000

  export function isPlanDate(value: unknown): value is PlanDate
  export function planDateOf(date: Date): PlanDate
  export function daysAfter(date: PlanDate, count: number): PlanDate
  export function weekdayOf(date: PlanDate): Weekday
  export function dayOfMonth(date: PlanDate): number
  export function monthOf(date: PlanDate): number
  ```

  `isPlanDate` prüft das Muster und dass das Datum existiert (`2026-02-30` → `false`).
  `planDateOf` nimmt das **lokale** Datum (`getFullYear/getMonth/getDate`).
  `daysAfter` rechnet über `Date.UTC` und `getUTC*`. `weekdayOf` zieht aus
  `weekPlan.ts` hierher um und rechnet mit `getUTCDay`. `WEEKDAYS` und `Weekday` ziehen
  mit nach `planDate.ts`, damit kein Kreisimport mit `weekPlan.ts` entsteht, und
  `weekPlan.ts` exportiert sie von dort weiter. Dazu kommt `toPlanDate(text: string):
  PlanDate`. Es wirft einen `RangeError` bei ungültigem Text und dient Tests und
  Konstanten (`const MONDAY = toPlanDate('2026-09-21')`). Tests:
  - `planDateOf(new Date(2026, 8, 25, 0, 5))` ist `'2026-09-25'`
  - `daysAfter('2026-09-25', 6)` ist `'2026-10-01'`, `daysAfter('2026-10-24', 2)` ist
    `'2026-10-26'` (über die Zeitumstellung am 25.10.), `daysAfter(…, -1)` rückwärts
  - `weekdayOf('2026-09-21')` ist `'monday'`, `weekdayOf('2026-09-27')` ist `'sunday'`
  - `isPlanDate('2026-09-25')` wahr, `''`, `'25.09.2026'`, `'2026-02-30'` und `42` falsch
- [x] `src/meals/domain/planPeriod.test.ts` / `planPeriod.ts` anlegen: `PlanPeriod`,
  `MIN_PERIOD_DAYS`, `MAX_PERIOD_DAYS`, `weekOf`, `datesOf`, `lastDateOf`,
  `includesDate`, `dateBefore`, `dateAfter`, `samePeriod`, `isPlanPeriod` (Objekt mit
  gültigem `start` und ganzzahligem `days` in 1–10). Tests:
  - `weekOf('2026-09-25')` ist `{ start: '2026-09-21', days: 7 }`, `weekOf` eines
    Sonntags beginnt am Montag davor
  - `datesOf({ start: '2026-09-25', days: 10 })` endet mit `'2026-10-04'`
  - `dateBefore` am Start und `dateAfter` am letzten Tag sind `null`
  - `includesDate` für den Tag vor dem Start und nach dem Ende ist falsch
- [x] `src/meals/domain/weekPlan.test.ts` / `weekPlan.ts` auf Datum umstellen (siehe
  *Abstraktionen*):

  ```ts
  export type PlanSlot = { date: PlanDate; time: MealTime }
  export type WeekPlan = {
    period: PlanPeriod
    days: Readonly<Record<PlanDate, DayPlan>>
  }

  export function planSlotsOf(period: PlanPeriod): readonly PlanSlot[]
  export function emptyWeekPlan(period: PlanPeriod): WeekPlan
  export function emptied(plan: WeekPlan): WeekPlan
  export function slotCountOf(plan: WeekPlan): number
  export function dateOfWeekday(week: PlanPeriod, day: Weekday): PlanDate
  export function weekPlanFromWeekdays(
    weekdays: Readonly<Record<Weekday, DayPlan>>,
    week: PlanPeriod,
  ): WeekPlan
  ```

  `mealIn` liefert für einen Tag ohne Eintrag `null`. `withMealIn` legt den Tag bei
  Bedarf an (von `EMPTY_DAY_PLAN` aus). `sameWeekPlan` vergleicht zusätzlich
  `samePeriod`. Alle Funktionen, die heute über `PLAN_SLOTS` laufen, laufen über
  `planSlotsOf(plan.period)`, also nur über den Zeitraum. Die vorhandenen Tests werden
  auf Datumskonstanten umgestellt. Neu:
  - `it('counts four meal times per day of the period')`:
    `slotCountOf(emptyWeekPlan({ start, days: 10 }))` ist `40`
  - `it('finds no meal on a day outside the period')`
  - `it('keeps meals planned on Sunday before those planned on the next Monday')`:
    Vorrat mit `count: 1`, dasselbe Gericht am So. 27.09. und am Mo. 28.09. im
    Zeitraum ab 25.09. Nur der Sonntag ist gedeckt, `slotsBefore` folgt dem Kalender.
  - `it('lays a plan of weekdays onto the dates of the week')`
- [x] `src/meals/domain/weekPlanView.test.ts` / `weekPlanView.ts`:
  `shownSlots(view, period, day, time)`. Die Wochenansicht liefert
  `datesOf(period).map((date) => ({ date, time }))`. Test mit 10 Tagen.
- [x] `src/meals/domain/randomPlanning.test.ts` / `randomPlanning.ts` umstellen:
  - `filledWeekPlan(meals, period, random, rule)` läuft über `datesOf(period)` ab
    `emptyWeekPlan(period)`
  - `filledDay`, `kindsBesideTheOtherMainMealTime`: `day: PlanDate`
  - `neighbouringMainMealSlots(plan, slot)`: `[dateBefore(plan.period, slot.date),
    slot.date, dateAfter(plan.period, slot.date)]`
  - `mealOfTheDayBefore`: `dateBefore(plan.period, slot.date)`
  - `timesPlanned`: `planSlotsOf(plan.period)`

  Die vorhandenen Tests werden mit `weekOf('2026-09-21')` weitergeführt. Neu:
  - `it('keeps the same category apart across a Sunday')`: Zeitraum ab Sa. 26.09., drei
    Tage. Die Kategorie vom So. 27.09. sperrt den Mo. 28.09.
  - `it('fills every day of a ten day period')`
- [x] `src/meals/domain/announcements.test.ts` / `announcements.ts` umstellen:
  - `planDateName(date)` → `'Freitag, 25. September'` (Monatsnamen Januar–Dezember)
  - `planDateHeading(date)` → `'Fr. 25.09.'`
  - `planDateMark(date)` → `'Fr. 25.'`
  - `dayShownAnnouncement(date)` → `'Freitag, 25. September.'`
  - `dayViewShownAnnouncement(date)` → `'Tagesansicht, Freitag, 25. September.'`
  - `slotName(slot, 'day')` → `planDateName(slot.date)`. Damit folgen
    `fixedSlotText`, `randomMealLabel`, `slotFieldLabel`, `slotPlannedAnnouncement`,
    `noMatchingMealAnnouncement` und `mealSuggestionsLabel` ohne eigene Änderung.
  - `plannedMealsPhrase(plannedMeals, slotCount)`. `weekPlanHeading`,
    `planFixedAnnouncement` und `weekPlanShuffledAnnouncement` bekommen `slotCount` als
    zusätzlichen Parameter.
  - `weekdayAbbreviation` bleibt als Baustein, `weekdayName` bleibt.
- [x] `src/meals/api/firestoreWeekPlanClient.ts` umstellen:
  - Konstante `DATED_MEALS = 'datedMeals'`. `MEALS` bleibt für den Umzug, als
    `WEEKDAY_MEALS` umbenannt.
  - `createFirestoreWeekPlanClient(firestore, onWriteFailure, clock: Clock)`
  - `toWeekPlan(stored)`: `isPlanPeriod({ start: stored.start, days: stored.days })`,
    sonst `null` (kein gespeicherter Plan). Tage nur für `datesOf(period)`, Werte nur
    als `string`.
  - `fromWeekPlan(plan)`: `{ start, days, plan: { [date]: { ...dayPlan } } }` nur für
    die Tage im Zeitraum.
  - `observeWeekPlan`: `onSnapshot(datedMeals, …)`. Liefert `toWeekPlan` einen Plan,
    wird er weitergegeben. Sonst folgt ein einmaliges `getDoc(weekdayMeals)`. Dessen
    Ergebnis wird mit `weekPlanFromWeekdays(toWeekdays(data), weekOf(planDateOf(clock())))`
    weitergegeben, **nur wenn** bis dahin keine Momentaufnahme mit gespeichertem Plan
    kam (lokale Variable `datedPlanArrived`). Das Abmelden stoppt den Listener und
    verwirft ein noch ausstehendes `getDoc`-Ergebnis.
  - `toCoveredSlots(stored, week)`: Einträge mit `date` (per `isPlanDate`) werden
    übernommen, Einträge mit altem `day` (per `isWeekday`) werden über
    `dateOfWeekday(week, day)` umgelegt. `fromWeekPlanStage` schreibt `{ date, time }`.
- [x] `src/main.tsx`: `createFirestoreWeekPlanClient(firestore, onWriteFailure, () => new Date())`.
- [x] `src/meals/api/inMemoryWeekPlanClient.ts`: `initialPlan: WeekPlan` wird ein
  Pflichtparameter ohne Standard. Die Aufrufer in den Tests übergeben
  `emptyWeekPlan(weekOf(MONDAY))` oder ihren vorbereiteten Plan.
- [x] `src/meals/ui/useWeekPlan.ts`: `useWeekPlan(client, initialPeriod: PlanPeriod)`,
  Startzustand `emptyWeekPlan(initialPeriod)`. `useWeekPlan.test.tsx` anpassen.
- [x] `src/SignedInApp.tsx`:
  - `today = planDateOf(clock())` bei jedem Rendern
  - `useWeekPlan(weekPlanClient, weekOf(today))` (nur der Startwert zählt)
  - `chosenDay: PlanDate | null` statt `shownDay: Weekday`, Startwert `null`
  - an `WeekPlanArea`: `shownDay={shownDayIn(weekPlanning.plan.period, chosenDay, today)}`,
    `onShowDay={setChosenDay}`

  `shownDayIn` entsteht schon in dieser Phase in `planPeriod.ts` (test-getrieben:
  gewählter Tag im Zeitraum, außerhalb mit heute im Zeitraum, außerhalb ohne heute,
  `null`).
- [x] `src/meals/ui/WeekPlanArea.tsx`: `shownDay: PlanDate`, `onShowDay(date)`,
  `clearPlan` mit `replacePlan(emptied(plan))`, `shuffleWeek` mit
  `filledWeekPlan(meals, plan.period, random, mainMealTimeRule)`, Ansagen mit
  `slotCountOf(plan)`.
- [x] `src/meals/ui/WeekPlanPage.tsx`: `DayNavigation` bekommt `period` und nutzt
  `dateBefore/dateAfter(period, shownDay)`. Die Überschrift zeigt
  `planDateHeading(shownDay)` (`aria-hidden`) und `planDateName(shownDay)`
  (`visuallyHidden`). `shownSlots(shownView, plan.period, shownDay, shownTime)`. Der
  React-`key` der Zeilen wird `${shownView}-${slot.date}-${slot.time}`.
  `weekPlanHeading(plannedMeals, slotCountOf(plan), stage)`.
- [x] `src/meals/ui/WeekPlanRow.tsx`: `planDateMark(slot.date)` statt
  `weekdayAbbreviation(slot.day)`.
- [x] `src/index.css`: `.weekdayMark` so verbreitern, dass `Fr. 25.` in einer Zeile
  steht (`white-space: nowrap` und eine passende `min-width` in `ch`). Die Felder
  der Wochenansicht stehen weiterhin bündig untereinander.
- [x] `src/meals/ui/WeekPlanArea.test.tsx`, `src/SignedInApp.test.tsx`: auf Datum
  umstellen. `renderWeekPlan(initialDay: Weekday)` wird zu `initialDay: PlanDate`, die
  erwarteten Namen werden `'Montag, 21. September'` usw., die Überschriften
  `… von 28` bleiben bei der Standardwoche. Neu:
  - `it('names the shown day with its date')`: Überschrift sichtbar `Fr. 25.09.`,
    Name `Freitag, 25. September`
  - `it('marks each row of the week view with weekday and day of month')`: erste Zeile
    beginnt mit `Mo. 21.`
- [x] `e2e/emulatorHousehold.ts`: `weekPlanOnServer` liest `weekPlan/datedMeals` und
  liefert Schlüssel `'2026-09-21.lunch'`. `storedPlanSlot`/`storedSlotName` lesen
  `date`. Neu: `storeWeekdayPlanOnServer(plan)` schreibt das alte Format nach
  `weekPlan/meals`, für den Umzugstest.
- [x] `e2e/weekPlan.spec.ts`: die Tages- und Feldnamen auf Datum umstellen
  (`stepToDay(page, 'Freitag, 25. September')`, `getByLabel('Montag, 21. September')`).
  Neu: `test('shows a plan of weekdays on the dates of this week')`. Der Test legt mit
  `storeWeekdayPlanOnServer` am `friday.lunch` ein Gericht an, öffnet den Wochenplan an
  `A_MONDAY`, blättert auf `Freitag, 25. September` und findet dort das Gericht.

**Automatisierte Verifikation**:

- [x] `planDate.test.ts`, `planPeriod.test.ts` laufen grün, einschließlich
  Zeitumstellung und Monatswechsel.
- [x] Die umgestellten Tests in `weekPlan.test.ts`, `weekPlanView.test.ts`,
  `weekPlanStage.test.ts`, `randomPlanning.test.ts`, `announcements.test.ts` laufen grün,
  auch die neuen Tests für „über den Sonntag hinweg“.
- [x] `WeekPlanArea.test.tsx`, `SignedInApp.test.tsx`, `useWeekPlan.test.tsx` laufen
  grün, einschließlich axe.
- [x] `npm run test` läuft vollständig grün, auch `test/domainLayerBoundary.test.ts`
  (die neuen Domänendateien importieren nichts von außen).
- [x] `npm run lint` meldet nichts.
- [x] `npm run build` läuft durch (Typprüfung).
- [x] `npx playwright test e2e/weekPlan.spec.ts` läuft grün, auch der Umzugstest.

**Manuelle Verifikation**:

- [x] Auf dem Handy mit dem vorhandenen Produktionsplan: Nach dem Update steht der
  laufende Wochenplan unverändert auf Mo.–So. dieser Woche, und die Tagesüberschrift
  zeigt `Fr. 25.09.`.
- [x] In der Wochenansicht steht `Fr. 25.` in einer Zeile, und die Eingabefelder stehen
  bündig untereinander, auch mit invertierten Farben.

### Phase 2: Zeitraum wählen

Abhängigkeiten: Phase 1.

Rechts neben der Überschrift öffnet ein Knopf die Seite „Zeitraum“. Nach „Übernehmen“
zeigt der Wochenplan die gewählten Tage.

**Aufgaben**:

- [x] `src/meals/domain/planPeriod.test.ts` / `planPeriod.ts`:

  ```ts
  export type PlanPeriodDraft = { start: string; days: number }

  export class InvalidPlanPeriod extends Error {
    constructor(readonly reason: 'startMissing' | 'daysOutOfRange') { … }
  }

  export function createPlanPeriod(draft: PlanPeriodDraft): PlanPeriod
  export function canHaveFewerDays(days: number): boolean
  export function canHaveMoreDays(days: number): boolean
  ```

  `createPlanPeriod` wirft `startMissing`, wenn `draft.start` kein `PlanDate` ist
  (leer oder ungültig), und `daysOutOfRange` bei 0, 11 oder einer Kommazahl. Ein
  Datum in der Vergangenheit ist gültig. Der Aufbau von `InvalidPlanPeriod` folgt
  `InvalidSupply` in `supply.ts`.
- [x] `src/meals/domain/weekPlan.test.ts` / `weekPlan.ts`: `withPeriod(plan, period)`.
  Tests:
  - `it('keeps the meals of days that stay in the period')`: 21.–27.09. → 25.09. mit
    5 Tagen, Fr.–So. behalten ihre Gerichte
  - `it('drops the meals of days outside the new period')`: Mo.–Do. fehlen danach in
    `days`
  - `it('starts the new days empty')`
- [x] `src/meals/domain/weekPlanStage.test.ts` / `weekPlanStage.ts`:
  `canChoosePeriod(stage)` ist `!isFixed(stage)`. Tests in den Blöcken
  `EDITING_STAGE`, `FIXED_STAGE` und `transferredStage`.
- [x] `src/meals/domain/announcements.test.ts` / `announcements.ts`:
  - `periodAppliedAnnouncement(period)` →
    `'Zeitraum Freitag, 25. September bis Sonntag, 4. Oktober, 10 Tage.'`, bei
    `days: 1` `'Zeitraum Freitag, 25. September, 1 Tag.'`
  - `periodFailureMessage(error)` → bei `startMissing`
    `'Bitte ein Startdatum wählen.'`, sonst `null` (wie `mealFailureMessage`)
  - `periodDaysPhrase(days)` → `'1 Tag'` / `'7 Tage'`, auch für die Stepper-Ansage
- [x] `src/shared/ui/Stepper.tsx`: optionales `lessDisabled?: boolean` (Standard
  `false`) auf den „−“-Knopf. Die vorhandenen Aufrufer bleiben unverändert.
- [x] `src/meals/ui/CalendarCogIcon.tsx` anlegen, im Aufbau wie `CalendarDaysIcon.tsx`.
  Die Pfade werden von https://lucide.dev/icons/calendar-cog (ISC-Lizenz) übernommen,
  zur Umsetzung dort gegenprüfen:

  ```tsx
  <path d="m15.228 16.852-.923-.383" />
  <path d="m15.228 19.148-.923.383" />
  <path d="M16 2v4" />
  <path d="m16.47 14.305.382.923" />
  <path d="m16.852 20.772-.383.924" />
  <path d="m19.148 15.228.383-.923" />
  <path d="m19.53 21.696-.382-.924" />
  <path d="m20.772 16.852.924-.383" />
  <path d="m20.772 19.148.924.383" />
  <path d="M21 10.592V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
  <path d="M3 10h18" />
  <path d="M8 2v4" />
  <circle cx="18" cy="18" r="3" />
  ```

- [x] `src/meals/ui/PeriodPage.tsx` anlegen, nach dem Muster von `AddSupplyPage.tsx`:
  - Props: `period: PlanPeriod`, `onApply(period)`, `onBack()`, `announce(text)`
  - Zustand `draft: PlanPeriodDraft` aus `period`, `failureMessage`
  - `<button onClick={onBack}>Zurück zum Wochenplan</button>`, `<h1 ref={heading}
    tabIndex={-1}>Zeitraum</h1>` (Fokus über `useHeadingFocus`)
  - `<label htmlFor="periodStart">Startdatum</label>` + `<input id="periodStart"
    type="date" value={draft.start} aria-describedby="periodFailure" …>`
  - `<p id="periodFailure" className="failure">{failureMessage}</p>`
  - „Anzahl Tage“ als `<span id="periodDaysLabel">` über dem `Stepper` mit
    `lessLabel="Ein Tag weniger"`, `moreLabel="Ein Tag mehr"`,
    `lessDisabled={!canHaveFewerDays(draft.days)}`,
    `moreDisabled={!canHaveMoreDays(draft.days)}`, Inhalt
    `<span className="stepperAmount" aria-labelledby=…>{draft.days}</span>`. Jeder
    Schritt sagt `periodDaysPhrase(days)` an.
  - `BottomBar` mit `<button type="button" onClick={apply}><SaveIcon />Übernehmen</button>`
  - `apply`: `try { onApply(createPlanPeriod(draft)) } catch (error) { const message =
    periodFailureMessage(error); if (message === null) throw error; … Fokus ins
    Datumsfeld }`
- [x] `src/meals/ui/WeekPlanArea.tsx`:
  - `const [page, setPage] = useState<'plan' | 'period'>('plan')`
  - `openPeriod()`: `if (!canChoosePeriod(stage)) return; setPage('period')`
  - `applyPeriod(period)`: `if (!canChoosePeriod(stage)) return;`
    `weekPlanning.replacePlan(withPeriod(plan, period))`, `onPeriodApplied()`,
    `setPage('plan')`, `announce(periodAppliedAnnouncement(period))`
  - neue Prop `onPeriodApplied: () => void`
  - bei `page === 'period'` wird `<PeriodPage period={plan.period} …>` ohne
    `navigation` gerendert (wie die Unterseiten von `SuppliesArea`)
- [x] `src/meals/ui/WeekPlanPage.tsx`: im `.pageHeader` nach dem `h1`:

  ```tsx
  <button
    type="button"
    className="iconButton"
    aria-label="Zeitraum wählen"
    aria-disabled={!canChoosePeriod(stage)}
    onClick={onChoosePeriod}
  >
    <CalendarCogIcon />
  </button>
  ```

- [x] `src/SignedInApp.tsx`: `onPeriodApplied={() => setChosenDay(null)}`.
- [x] `src/meals/ui/WeekPlanArea.test.tsx`: neue Tests (Hilfen `periodButton()`,
  `openPeriod()`, `startField()`, `applyButton()`):
  - `it('shows the period button as an icon only beside the heading')`
  - `it('offers no period choice while the plan is fixed')`: nach `fixPlan()` gilt
    `aria-disabled="true"`, ein Druck öffnet nichts und sagt nichts an
  - `it('offers no period choice after the transfer')`
  - `it('opens the period page with the stored period')`: Überschrift `Zeitraum` hat
    den Fokus, `startField()` hat `'2026-09-21'`, die Anzahl ist `7`
  - `it('limits the days of the period to one up to ten')`: bei 10 ist „Ein Tag mehr“
    `disabled`, bei 1 „Ein Tag weniger“
  - `it('applies the chosen period and says so')`: Start `2026-09-25`, 10 Tage →
    `storedWeekPlan().period` stimmt, Ansage
    `'Zeitraum Freitag, 25. September bis Sonntag, 4. Oktober, 10 Tage.'`, die
    Überschrift `Wochenplan, … von 40` hat den Fokus
  - `it('drops the meals of days outside the applied period')`: Gericht am Mo.
    21.09. und Fr. 25.09., neuer Zeitraum ab 25.09. → nur Freitag bleibt gespeichert
  - `it('refuses a period without start date')`: Feld leeren, „Übernehmen“ →
    Fehlermeldung, Ansage `'Bitte ein Startdatum wählen.'`, Fokus im Feld,
    `storedWeekPlan()` unverändert
  - `it('goes back to the plan without applying')`
  - `it('steps only through the days of the period')`: 10-Tage-Zeitraum, „Nächster
    Tag“ am 04.10. ist gesperrt
  - `it('has no accessibility violations on the period page')`
- [x] `src/SignedInApp.test.tsx`: neue Tests zur Tagesregel (Uhr an einem Freitag,
  25.09.):
  - `it('shows today after applying a period that includes it')`
  - `it('shows the first day after applying a period without today')`: Start
    `2026-10-01` → Überschrift `Donnerstag, 1. Oktober`
  - `it('moves to today when the other device sets a period without the chosen day')`:
    auf Samstag geblättert, dann `weekPlanArrivesFromElsewhere` mit einem Zeitraum ab
    Freitag, 1 Tag → Freitag
- [x] `e2e/weekPlan.spec.ts`: `test('plans the chosen period')`. Wochenplan an
  `A_FRIDAY` öffnen, „Zeitraum wählen“, Start `2026-09-28`, auf 10 Tage stellen,
  „Übernehmen“. Danach heißt die Überschrift `Montag, 28. September`, die Wochenansicht
  hat 10 Zeilen bis `Mi. 07.`, „Zufallsauswahl generieren“ füllt alle 10 Tage, und
  `weekPlanOnServer()` enthält nur Schlüssel vom 28.09. bis 07.10.
- [x] `docs/notes.txt`: erst nach der manuellen Abnahme den Punkt `- Wochenplan
  erweitern` mit seinen drei Unterpunkten auf `x` setzen und nach DONE verschieben (die
  bestehende `n`-Zeile bleibt unverändert darunter). Unter TODO anhängen:
  `- Firestore: weekPlan/meals wird seit MZP-035 nur noch gelesen, solange
  weekPlan/datedMeals fehlt, und kann danach von Hand geloescht werden`.

**Automatisierte Verifikation**:

- [x] Die neuen Tests zu `createPlanPeriod`, `withPeriod`, `canChoosePeriod` und den
  Ansagen laufen grün.
- [x] Die neuen Tests in `WeekPlanArea.test.tsx` und `SignedInApp.test.tsx` laufen
  grün, einschließlich axe auf der Seite „Zeitraum“.
- [x] `npm run test` läuft vollständig grün.
- [x] `npm run lint` meldet nichts.
- [x] `npm run build` läuft durch.
- [x] `npx playwright test e2e/weekPlan.spec.ts` läuft grün, auch
  `plans the chosen period`.

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: Der Knopf rechts neben der Überschrift heißt
  „Zeitraum wählen, Taste“ und ist im festgelegten Plan abgeblendet, und die
  Stepper-Ansage „8 Tage“ kommt.
- [x] Auf dem iPhone mit VoiceOver: Das Startdatum lässt sich mit „Ein Tag früher“ und
  „Ein Tag später“ verschieben, sichtbar steht z. B. `Mo. 28.09.`, und VoiceOver sagt
  den neuen Tag an.
- [x] Nach „Übernehmen“ kommt die Zeitraum-Ansage, der Fokus steht auf der
  Wochenplan-Überschrift, und das zweite Gerät zeigt sofort denselben Zeitraum.
- [x] Das Icon ist neben den übrigen Kalender-Icons klar als eigener Knopf erkennbar,
  auch mit invertierten Farben.

## Notizen zur Umsetzung

- Phase 1: `SignedInApp.test.tsx` „keeps the stepped day although the clock moves on“
  verließ sich darauf, dass die Uhr nur einmal gelesen wird. Da `today` jetzt bei jedem
  Rendern gelesen wird (Entscheidung 10), läuft die Uhr im Test erst nach dem Blättern
  weiter. Die Absicht des Tests bleibt gleich.
- Phase 1: `.weekdayMark` bekommt `width: 7ch` statt einer `min-width`. So stehen die
  Felder sicher bündig, auch wenn `Mo. 21.` breiter läuft als `Mi. 07.`.
- Phase 1: `emptyWeekPlan` legt für jeden Tag des Zeitraums einen leeren Tagesplan an.
  `withMealIn` ignoriert Plätze außerhalb des Zeitraums, damit `days` nur Tage im
  Zeitraum enthält.
- Phase 2: Lucide hat `calendar-cog` inzwischen neu gezeichnet (lucide-static 1.48.0:
  Ringe `v3`, Linie bei `y=9`). `CalendarCogIcon` übernimmt die Pfade aus dem Plan, die
  zur älteren Zeichnung von `CalendarDaysIcon` passen, damit die Kalender-Icons
  einheitlich aussehen.
- Phase 2: „Anzahl Tage“ ist eine Gruppe (`role="group"` mit `aria-labelledby`) um den
  Stepper. Ein `aria-labelledby` direkt auf der Zahl wäre auf einem `span` ohne Rolle
  nicht erlaubt.
- Phase 2, nach der Handprüfung: Das Datumsfeld `<input type="date">` öffnete auf dem
  iPhone beim Antippen den Kalender nicht (nur einmal zufällig nach Aus- und
  Einschalten). Entscheidung des Nutzers am 2026-09-25: Das Startdatum wird wie „Anzahl
  Tage“ mit einem Stepper gewählt. Damit kann kein leeres Datum mehr entstehen.
  `createPlanPeriod`, `InvalidPlanPeriod`, `PlanPeriodDraft` und `periodFailureMessage`
  entfallen, an ihre Stelle treten `withEarlierStart`, `withLaterStart`,
  `withFewerDays` und `withMoreDays` in `planPeriod.ts`. Der Test „refuses a period
  without start date“ wird zu „moves the start by one day and names it“.
- Phase 2: Der Test-Aufbau in `WeekPlanArea.test.tsx` leitet den gezeigten Tag wie
  `SignedInApp` über `shownDayIn` ab, damit das Blättern nach „Übernehmen“ im
  Zeitraum bleibt.

## Verweise

- `docs/notes.txt` — TODO „Wochenplan erweitern“ (Date-Picker, Anzahl-Tage-Selector)
- `docs/agents/plans/2026-09-25-wochenplan-tagesansicht-mit-vier-mahlzeiten.md` —
  MZP-028, vier Plätze pro Tag, Umzug von `weekPlan/current`
- `docs/agents/plans/2026-09-25-wochenansicht-im-wochenplan.md` — Wochenansicht
- `docs/agents/plans/2026-09-25-verspaetete-momentaufnahmen-beheben.md` — MZP-027,
  `isStaleSnapshot`
- `docs/agents/plans/2026-09-25-wochenplan-leeren.md` — MZP-029, `aria-disabled`
- `docs/agents/plans/2026-09-24-wochenplan-festlegen-und-einmal-uebertragen.md` —
  MZP-024, Entscheidung 5
- `src/meals/ui/AddSupplyPage.tsx` — Vorbild für Seite, Fehlermeldung und Fokus
- Lucide-Icon „calendar-cog“: https://lucide.dev/icons/calendar-cog
- MDN `<input type="date">`: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date
