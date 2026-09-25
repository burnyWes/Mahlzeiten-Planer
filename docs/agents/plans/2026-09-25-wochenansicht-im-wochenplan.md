---
date: 2026-09-25T10:35:47+00:00
git_commit: a7a4564e250117c2e678bbf4c8ebe4978454872b
branch: main
story: MZP-030
topic: "Wochenansicht im Wochenplan"
tags: [plan, meals, weekPlan, ui, accessibility]
status: ready
---

# PLAN: MZP-030 — Wochenansicht im Wochenplan

Der Wochenplan bekommt neben der Tagesansicht (MZP-028) eine **Wochenansicht**. Sie
zeigt sieben Zeilen, Montag bis Sonntag, für **eine** Tageszeit, zum Beispiel nur das
Mittagessen. Wo in der Tagesansicht `[◀] Fr. [▶]` steht, stehen in der Wochenansicht
vier Knöpfe mit den Icons der Tageszeiten. Ganz rechts in dieser Zeile sitzt in beiden
Ansichten ein Umschalter.

Das Vorhaben steht in `docs/notes.txt` unter TODO („Wochenansicht auf
Wochenplan-Seite“). Alle Entscheidungen stammen aus der Befragung vom 2026-09-25.

Später soll rechts neben der Überschrift ein Knopf kommen, der eine weitere Seite
öffnet, und zwar in beiden Ansichten. Er gehört nicht zu diesem Plan, der Platz bleibt
aber frei.

## Akzeptanzkriterien

- Rechts in der Navigationszeile unter der Überschrift steht in beiden Ansichten an
  derselben Stelle ein Umschalter, der nur ein Icon zeigt:
  - In der Tagesansicht heißt er `Wochenansicht` und zeigt das Wochen-Icon
    (Lucide `calendar-days`).
  - In der Wochenansicht heißt er `Tagesansicht` und zeigt das Tages-Icon
    (Lucide `calendar-1`).
  - Nach einem Druck bleibt der Fokus auf dem Knopf, der jetzt nach der anderen Ansicht
    heißt. Die Ansage lautet `Wochenansicht, Mittagessen.` beziehungsweise
    `Tagesansicht, Freitag.`
- Rechts neben der `<h1>` kommt nichts hinzu.
- Die Wochenansicht zeigt sieben Zeilen von Montag bis Sonntag für die gezeigte
  Tageszeit. Links in jeder Zeile steht das Tageskürzel `Mo.` bis `So.` (`aria-hidden`),
  daneben der feste Platz für die Schneeflocke. Alle Felder stehen bündig.
- Die Beschriftungen der Wochenansicht nennen den Tag und nicht die Tageszeit:
  - Feld: `Montag` beziehungsweise `Montag, im Vorrat`
  - Würfel der Zeile: `Zufallsgericht für Montag`
  - Vorschlagsliste: `Vorschläge für Montag`
  - festgelegter Plan: `Montag, Bolognese`, `Montag, Bolognese, im Vorrat` oder
    `Dienstag, nichts geplant`
  - Ansage nach Wahl oder Würfel: `Montag, Bolognese.` beziehungsweise
    `Montag, Bolognese, im Vorrat.`
- Die Tagesansicht verhält sich und klingt genau wie bisher.
- In der Wochenansicht stehen links vom Umschalter vier Knöpfe nur mit Icon, gebündelt
  als Gruppe `Tageszeit`: `Frühstück` (Sonnenaufgang), `Mittagessen` (Sonne), `Snack`
  (Apfel) und `Abendessen` (Mond).
  - Der Knopf der gezeigten Tageszeit hat `aria-pressed="true"`, alle anderen
    `aria-pressed="false"`. Er ist hervorgehoben wie der aktive Bereich in der
    Navigationsleiste (Akzentfläche, Rahmen in `--ink`), die anderen sind neutral
    (Fläche `--surface`, Rahmen in `--accentLine`).
  - Ein Druck auf einen anderen Knopf zeigt dessen Tageszeit. Der Fokus bleibt auf dem
    Knopf, und die Ansage lautet zum Beispiel `Abendessen.`
  - Ein Druck auf den schon gewählten Knopf ändert nichts und sagt nichts an.
- In der Wochenansicht nennt eine unsichtbare `<h2>` die gezeigte Tageszeit, zum
  Beispiel `Mittagessen`.
- Nach dem Start der App steht die Tagesansicht da, und die Wochenansicht beginnt beim
  Mittagessen. Ansicht und Tageszeit überstehen einen Wechsel zu einer anderen Seite,
  aber kein Neuladen. Sie werden auf keinem Weg gespeichert. Das Umschalten ändert
  weder den gezeigten Tag noch die gezeigte Tageszeit.
- Halb Getipptes wird verworfen, wenn die Ansicht oder die Tageszeit wechselt.
- Überschrift, untere Leiste, Vorrat, Übertragung und die Daten in Firestore verhalten
  sich unverändert und gelten weiter für die ganze Woche.
- axe findet in beiden Ansichten nichts, weder beim Bearbeiten noch im festgelegten
  Plan.

## Wesentliche Entscheidungen und Abwägungen

1. **Der Umschalter sitzt rechts in der Navigationszeile, nicht neben der
   Überschrift.**
   - Warum: Er steht bei dem, was er umschaltet, und liegt in beiden Ansichten an
     derselben Stelle. VoiceOver findet ihn beim Wischen deshalb immer an derselben
     Position. Der Platz neben der `<h1>` bleibt für das spätere Feature frei, das es
     in beiden Ansichten geben wird (Frage 1).
   - Auswirkung: Die Zeile heißt künftig `.planNavigation`. Links steht die Navigation
     der jeweiligen Ansicht (`.dayNavigation` oder `.mealTimeNavigation`), rechts der
     Umschalter.

2. **Der Umschalter heißt nach dem Ziel, und das Icon zeigt das Ziel.**
   - Warum: So ist es schon bei `Plan festlegen` / `Plan bearbeiten`. Die Ansage
     beschreibt den neuen Inhalt, ohne dass man weiterwischen muss (Frage 2).
   - Auswirkung: kein `aria-pressed` am Umschalter. Die Namen stehen wie
     `Vorheriger Tag` direkt in `WeekPlanPage.tsx`, die Ansagen in `announcements.ts`.

3. **Die Tageszeit-Knöpfe nutzen `aria-pressed`, sind als `role="group"` `Tageszeit`
   gebündelt, und es gibt eine unsichtbare `<h2>`.**
   - Warum: Beim Wischen über die Knöpfe hört man, welcher gewählt ist. Mit der `<h2>`
     funktioniert die Überschriften-Navigation in beiden Ansichten gleich (Frage 3 und
     Frage 6).
   - Auswirkung: `aria-pressed` ist im Projekt neu. Die Hervorhebung bekommt eine
     eigene CSS-Regel nach dem Vorbild von `.navigationBar button[aria-current='page']`
     (`index.css:91`).

4. **Eine Zeile nennt nur die Seite des Platzes, die die `<h2>` nicht nennt.**
   `WeekPlanRow` bekommt `naming: SlotNaming` (`'time' | 'day'`). Danach richten sich
   die Markierung links (Icon oder Tageskürzel) und alle Beschriftungen.
   - Warum: VoiceOver soll nicht siebenmal „Mittagessen“ hören, aus demselben Grund wie
     in MZP-028, Entscheidung 7 (Frage 4).
   - Auswirkung: Die Beschriftungsfunktionen in `announcements.ts` nehmen künftig
     `(slot, naming)` statt `time`. `mealTimeFieldLabel` heißt künftig
     `slotFieldLabel`.

5. **Nur die Oberfläche ändert sich.** Welche Plätze eine Ansicht zeigt, rechnet
   `shownSlots(view, day, time)` aus. Tagesansicht: die vier Tageszeiten des Tages.
   Wochenansicht: die sieben Tage der Tageszeit.
   - Warum: `WeekPlanRow` kann schon heute jeden beliebigen `PlanSlot` zeigen.
   - Auswirkung: Datenmodell, `weekPlanStage.ts`, `randomPlanning.ts`, Firestore,
     `firestore.rules` und `useWeekPlan` bleiben unberührt. Neu ist
     `src/meals/domain/weekPlanView.ts`. Es ist rein und wird test-getrieben gebaut.

6. **Ansicht und Tageszeit werden gehalten wie der gezeigte Tag.** `shownView`
   (Start `'day'`) und `shownTime` (Start `'lunch'`) liegen neben `shownDay` in
   `SignedInApp` und werden nicht gespeichert.
   - Warum: `WeekPlanArea` wird bei jedem Seitenwechsel neu aufgebaut. Das Verhalten
     entspricht dem des Tages aus MZP-028, Entscheidung 5 (Frage 5).
   - Auswirkung: `WeekPlanArea` bekommt `shownView`, `onShowView`, `shownTime` und
     `onShowTime`.

7. **Halb Getipptes wird über den React-Schlüssel verworfen.** Der Schlüssel jeder
   Zeile enthält Ansicht, Tag und Tageszeit.
   - Warum: Freitag-Mittagessen steht in beiden Ansichten. Ohne die Ansicht im
     Schlüssel bliebe das Getippte beim Umschalten stehen.

## Ausgangslage

```
SignedInApp  shownDay (Start: weekdayOf(clock()))                  SignedInApp.tsx:115
  └─ WeekPlanArea   showDay → onShowDay + dayShownAnnouncement     WeekPlanArea.tsx:66
       └─ WeekPlanPage
            ├─ .pageHeader  <h1> weekPlanHeading                   WeekPlanPage.tsx:141
            ├─ DayNavigation  .dayNavigation [◀] <h2>Fr.</h2> [▶]   WeekPlanPage.tsx:83
            ├─ MEAL_TIMES.map → WeekPlanRow slot={shownDay, time}  WeekPlanPage.tsx:150
            │     MealTimeMarks: .mealTimeMark (Icon) + .supplyMark WeekPlanRow.tsx:50
            │     Beschriftungen über time:  mealTimeFieldLabel, randomMealLabel,
            │       mealSuggestionsLabel, fixedSlotText, slotPlannedAnnouncement
            └─ BottomBar  [🔀] [🔒/✎] [🛒] [⌫]
```

Oberfläche heute:

```
+------------------------------------------+
| Wochenplan, 5 von 28                     |
|                                          |
|  [ ◀ ]            Fr.           [ ▶ ]    |
|                                          |
| 🌅 ❄ [ Müsli                ] [🔀]       |
| ☀    [ Bolognese            ] [🔀]       |
| 🍎   [                      ] [🔀]       |
| 🌙   [ Linsensuppe          ] [🔀]       |
+------------------------------------------+
| [  🔀  ]  [  🔒  ]  [  🛒  ]  [  ⌫  ]    |
+------------------------------------------+
```

## Zielbild

Tagesansicht:

```
+------------------------------------------+
| Wochenplan, 5 von 28            (frei)   |  <h1>
|                                          |
|  [ ◀ ]       Fr.       [ ▶ ]     [ ▦ ]   |  ▦ = "Wochenansicht"
|                                          |
| 🌅 ❄ [ Müsli                ] [🔀]       |  "Frühstück, im Vorrat"
| ☀    [ Bolognese            ] [🔀]       |  "Mittagessen"
| 🍎   [                      ] [🔀]       |
| 🌙   [ Linsensuppe          ] [🔀]       |
+------------------------------------------+
| [  🔀  ]  [  🔒  ]  [  🛒  ]  [  ⌫  ]    |
+------------------------------------------+
```

Wochenansicht, bearbeitbar:

```
+------------------------------------------+
| Wochenplan, 5 von 28            (frei)   |  <h1>
|                                          |
|  [🌅] [☀̲] [🍎] [🌙]               [ 1 ]   |  Gruppe "Tageszeit", 1 = "Tagesansicht"
|                                          |  <h2 visuallyHidden> "Mittagessen"
| Mo. ❄ [ Bolognese           ] [🔀]       |  "Montag, im Vorrat"
| Di.   [                     ] [🔀]       |  "Zufallsgericht für Dienstag"
| Mi.   [ Linsensuppe         ] [🔀]       |
| Do.   [                     ] [🔀]       |
| Fr.   [ Bolognese           ] [🔀]       |
| Sa.   [                     ] [🔀]       |
| So.   [                     ] [🔀]       |
+------------------------------------------+
| [  🔀  ]  [  🔒  ]  [  🛒  ]  [  ⌫  ]    |
+------------------------------------------+
```

`☀̲` ist der gewählte Knopf (`aria-pressed="true"`, Akzentfläche).

Wochenansicht, festgelegt:

```
| Wochenplan, 5 von 28, festgelegt         |
|  [🌅] [☀̲] [🍎] [🌙]               [ 1 ]   |
| Mo. ❄ Bolognese                          |  "Montag, Bolognese, im Vorrat"
| Di.                                      |  "Dienstag, nichts geplant"
| ...                                      |
```

Zustand und Datenfluss:

```
SignedInApp
  shownDay   useState(() => weekdayOf(clock()))
  shownView  useState<WeekPlanView>('day')            neu
  shownTime  useState<MealTime>('lunch')              neu
  └─ WeekPlanArea
       showView(view) → onShowView(view)
                        announce(week ? weekViewShownAnnouncement(shownTime)
                                      : dayViewShownAnnouncement(shownDay))
       showTime(time) → nichts, wenn time === shownTime
                        sonst onShowTime(time); announce(mealTimeShownAnnouncement(time))
       chooseMeal     → slotPlannedAnnouncement(slot, slotNamingIn(shownView), …)
       └─ WeekPlanPage
            .planNavigation
              ├─ day:  DayNavigation (.dayNavigation)
              │  week: MealTimeNavigation (.mealTimeNavigation, role=group "Tageszeit")
              └─ ViewSwitchButton
            week: <h2 className="visuallyHidden">{mealTimeName(shownTime)}</h2>
            shownSlots(shownView, shownDay, shownTime).map →
              WeekPlanRow key=`${view}-${day}-${time}` naming={slotNamingIn(view)}
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `weekPlanView.ts` (neu)
    - `WeekPlanView = 'day' | 'week'`
    - `SlotNaming = 'time' | 'day'`
    - `slotNamingIn(view)`: `'day'` → `'time'`, `'week'` → `'day'`
    - `shownSlots(view, day, time)`: die Plätze der Ansicht in ihrer Reihenfolge
  - `announcements.ts`
    - `slotName(slot, naming)` (neu): `mealTimeName(slot.time)` oder
      `weekdayName(slot.day)`
    - `fixedSlotText`, `randomMealLabel`, `mealSuggestionsLabel`,
      `slotPlannedAnnouncement`: nehmen `(slot, naming, …)` statt `time`
    - `mealTimeFieldLabel` → `slotFieldLabel(slot, naming, inSupply)`
    - `weekViewShownAnnouncement(time)` (neu): `Wochenansicht, Mittagessen.`
    - `dayViewShownAnnouncement(day)` (neu): `Tagesansicht, Freitag.`
    - `mealTimeShownAnnouncement(time)` (neu, Phase 2): `Abendessen.`
- `src/meals/ui`
  - `WeekPlanRow.tsx`: Prop `naming`. `MealTimeMarks` wird zu `SlotMarks`: Icon in
    `.mealTimeMark` oder Kürzel in `.weekdayMark`, danach `.supplyMark`.
  - `WeekPlanPage.tsx`: `.planNavigation`, `ViewSwitchButton`, in Phase 2
    `MealTimeNavigation`, Zeilen über `shownSlots`
  - `WeekPlanArea.tsx`: `shownView`, `onShowView`, `shownTime`, `onShowTime`,
    `showView`, `showTime`
  - `CalendarDaysIcon.tsx`, `CalendarOneIcon.tsx` (neu). Sonnenaufgang, Sonne, Apfel
    und Mond gibt es schon (`MealTimeIcon.tsx`).
- `src/SignedInApp.tsx`: `shownView` und `shownTime`
- `src/index.css`: `.planNavigation`, `.dayNavigation` angepasst, `.weekdayMark`, in
  Phase 2 `.mealTimeNavigation` und `button[aria-pressed]`
- Tests: `weekPlanView.test.ts` (neu), `announcements.test.ts`,
  `WeekPlanArea.test.tsx`, `SignedInApp.test.tsx`, `e2e/weekPlan.spec.ts`
- `docs/notes.txt`: Eintrag nach DONE

Unverändert: `weekPlan.ts`, `weekPlanStage.ts`, `randomPlanning.ts`, alle Clients,
`useWeekPlan`, `firestore.rules`, `BottomBar`, `MealSuggestions`, `MealTimeIcon`.

## Logging und Beobachtbarkeit

Die App hat kein Logging. Beobachtbar ist sie über die VoiceOver-Ansagen. Neu:

```
"Wochenansicht, Mittagessen."          Umschalten zur Woche
"Tagesansicht, Freitag."               Umschalten zum Tag
"Abendessen."                          Tageszeit gewählt (Phase 2)
"Montag, Bolognese."                   Wahl oder Würfel in der Wochenansicht
"Montag, Bolognese, im Vorrat."
```

## Umsetzung

### Phase 1: Umschalter und Wochenansicht

Abhängigkeiten: keine.

Der Umschalter wechselt zwischen Tages- und Wochenansicht. Die Wochenansicht zeigt die
sieben Tage des Mittagessens mit Tageskürzel und Tagesbeschriftungen. Links vom
Umschalter steht in der Wochenansicht noch nichts, die Tageszeit ist in dieser Phase
fest `'lunch'`. Am Ende ist die Wochenansicht vollständig bedienbar.

**Aufgaben**:

- [x] `src/meals/domain/weekPlanView.test.ts` zuerst schreiben (roter Schritt):
  - `slotNamingIn`: `names the meal time in the day view` und `names the day in the
    week view`.
  - `shownSlots`:
    - `shows the four meal times of the day in the day view`: `('day', 'friday',
      'lunch')` ergibt Freitag Frühstück, Mittagessen, Snack, Abendessen.
    - `shows the seven days of the meal time in the week view`: `('week', 'friday',
      'dinner')` ergibt Montag- bis Sonntag-Abendessen.
- [x] `src/meals/domain/weekPlanView.ts` anlegen:
  ```ts
  import { MEAL_TIMES, WEEKDAYS, type MealTime, type PlanSlot, type Weekday } from './weekPlan'

  export type WeekPlanView = 'day' | 'week'

  export type SlotNaming = 'time' | 'day'

  export function slotNamingIn(view: WeekPlanView): SlotNaming {
    return view === 'day' ? 'time' : 'day'
  }

  export function shownSlots(view: WeekPlanView, day: Weekday, time: MealTime): readonly PlanSlot[] {
    return view === 'day'
      ? MEAL_TIMES.map((each) => ({ day, time: each }))
      : WEEKDAYS.map((each) => ({ day: each, time }))
  }
  ```
- [x] `src/meals/domain/announcements.test.ts` zuerst anpassen:
  - `slotName`: `names the meal time` (`Frühstück`) und `names the day` (`Montag`).
  - Die vorhandenen Fälle für `fixedSlotText`, `randomMealLabel`,
    `mealSuggestionsLabel`, `slotPlannedAnnouncement` und `mealTimeFieldLabel` (dann
    `slotFieldLabel`) rufen mit `(slot, 'time', …)` auf und erwarten dasselbe wie
    bisher. Je Funktion kommt ein Fall mit `'day'` dazu: `Montag, nichts geplant`,
    `Montag, Bolognese, im Vorrat`, `Zufallsgericht für Montag`,
    `Vorschläge für Montag`, `Montag, Bolognese.`, `Montag, Bolognese, im Vorrat.`,
    `Montag` und `Montag, im Vorrat`.
  - `weekViewShownAnnouncement('lunch')`: `Wochenansicht, Mittagessen.`
  - `dayViewShownAnnouncement('friday')`: `Tagesansicht, Freitag.`
- [x] `src/meals/domain/announcements.ts` anpassen:
  ```ts
  export function slotName(slot: PlanSlot, naming: SlotNaming): string {
    return naming === 'time' ? mealTimeName(slot.time) : weekdayName(slot.day)
  }

  export function randomMealLabel(slot: PlanSlot, naming: SlotNaming): string {
    return `Zufallsgericht für ${slotName(slot, naming)}`
  }

  export function weekViewShownAnnouncement(time: MealTime): string {
    return `Wochenansicht, ${mealTimeName(time)}.`
  }

  export function dayViewShownAnnouncement(day: Weekday): string {
    return `Tagesansicht, ${weekdayName(day)}.`
  }
  ```
  `fixedSlotText`, `mealSuggestionsLabel`, `slotFieldLabel` (bisher
  `mealTimeFieldLabel`) und `slotPlannedAnnouncement` ersetzen `mealTimeName(time)`
  genauso durch `slotName(slot, naming)`.
- [x] `src/meals/ui/CalendarDaysIcon.tsx` und `src/meals/ui/CalendarOneIcon.tsx` im
  Aufbau von `SunriseIcon.tsx` anlegen (`className="buttonIcon"`,
  `viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth="2"`,
  `aria-hidden="true"`, `focusable="false"`), mit den Lucide-Pfaden:
  - `CalendarDaysIcon`: `M8 2v4`, `M16 2v4`,
    `<rect width="18" height="18" x="3" y="4" rx="2" />`, `M3 10h18`, `M8 14h.01`,
    `M12 14h.01`, `M16 14h.01`, `M8 18h.01`, `M12 18h.01`, `M16 18h.01`
  - `CalendarOneIcon`: `M11 14h1v4`, `M16 2v4`, `M3 10h18`, `M8 2v4`,
    `<rect x="3" y="4" width="18" height="18" rx="2" />`

  Die Koordinaten folgen dem vorhandenen `CalendarIcon.tsx` (`y="4"`, `M3 10h18`),
  damit alle Kalender gleich aussehen. Vor dem Anlegen die Pfade unter
  https://lucide.dev/icons/calendar-days und https://lucide.dev/icons/calendar-1
  abgleichen.
- [x] `src/meals/ui/WeekPlanRow.tsx`:
  - Neue Prop `naming: SlotNaming`.
  - `MealTimeMarks` wird zu `SlotMarks({ slot, naming, inSupply })`:
    ```tsx
    {naming === 'time' ? (
      <span className="mealTimeMark" aria-hidden="true"><MealTimeIcon time={slot.time} /></span>
    ) : (
      <span className="weekdayMark" aria-hidden="true">{weekdayAbbreviation(slot.day)}</span>
    )}
    <span className="supplyMark" aria-hidden="true">{inSupply && <SnowflakeIcon />}</span>
    ```
  - Alle Beschriftungen bekommen `(slot, naming, …)`: `slotFieldLabel`,
    `randomMealLabel`, `mealSuggestionsLabel`, `fixedSlotText`.
- [x] `src/meals/ui/WeekPlanPage.tsx`:
  - Neue Props `shownView: WeekPlanView`, `onShowView: (view: WeekPlanView) => void`,
    `shownTime: MealTime`.
  - Lokale Komponente `ViewSwitchButton({ shownView, onShowView })`:
    `className="iconButton"`, in der Tagesansicht `aria-label="Wochenansicht"` mit
    `<CalendarDaysIcon />` und Ziel `'week'`, in der Wochenansicht
    `aria-label="Tagesansicht"` mit `<CalendarOneIcon />` und Ziel `'day'`.
  - Die Zeile wird:
    ```tsx
    <div className="planNavigation">
      {shownView === 'day' && <DayNavigation shownDay={shownDay} onShowDay={onShowDay} />}
      <ViewSwitchButton shownView={shownView} onShowView={onShowView} />
    </div>
    ```
    In der Wochenansicht steht in Phase 1 links nur ein leerer Platzhalter
    (`<div className="mealTimeNavigation" />`), damit der Umschalter rechts bleibt.
  - Die Liste rendert
    `shownSlots(shownView, shownDay, shownTime).map((slot) => <WeekPlanRow key={`${shownView}-${slot.day}-${slot.time}`} slot={slot} naming={slotNamingIn(shownView)} … />)`.
- [x] `src/meals/ui/WeekPlanArea.tsx`:
  - Neue Props `shownView`, `onShowView`, `shownTime`.
  - `showView(view)`: `onShowView(view)`, dann
    `announce(view === 'week' ? weekViewShownAnnouncement(shownTime) : dayViewShownAnnouncement(shownDay))`.
  - `chooseMeal` sagt
    `slotPlannedAnnouncement(slot, slotNamingIn(shownView), chosen, …)` an.
- [x] `src/SignedInApp.tsx`: neben `shownDay`
  `const [shownView, setShownView] = useState<WeekPlanView>('day')` und
  `const [shownTime] = useState<MealTime>('lunch')` anlegen und an `WeekPlanArea`
  durchreichen. In Phase 2 kommt der Setter dazu.
- [x] `src/index.css`:
  - Neu ist `.planNavigation { display: flex; align-items: center; gap: 1.5rem; margin: 1rem 0; }`.
  - `.dayNavigation` verliert `margin` und bekommt `flex: 1`. Die übrigen Regeln
    bleiben, also Pfeile außen und Tag in der Mitte.
  - `.mealTimeNavigation { flex: 1; }`
  - `.weekdayMark { flex: none; width: 2.5rem; }`. Die Breite reicht für `Mo.` bis
    `So.`, und so stehen alle Felder bündig.
- [x] `src/meals/ui/WeekPlanArea.test.tsx`:
  - `WeekPlanAreaUnderTest` hält zusätzlich `shownView` in `useState`.
    `renderWeekPlanArea` bekommt am Ende die Parameter `initialView: WeekPlanView = 'day'`
    und `initialTime: MealTime = 'lunch'`. Neu ist die Hilfe
    `renderWeekView(initialMeals, initialPlan, supplies)`, die mit `'week'` und
    `'lunch'` startet. Die vorhandenen Tests bleiben unverändert.
  - Neu:
    - `offers the week view from the day view`: Es gibt einen Knopf `Wochenansicht`
      mit einem `svg` und ohne sichtbaren Text.
    - `switches to the week view and says which meal time it shows`: Nach dem Druck
      gibt es sieben Felder von `Montag` bis `Sonntag`, die Ansage lautet
      `Wochenansicht, Mittagessen.`, und der Knopf `Tagesansicht` hat den Fokus.
    - `switches back to the day that was shown before`: Start am Mittwoch, erst zur
      Woche, dann zurück. Die `<h2>` heißt `Mittwoch`, die Ansage lautet
      `Tagesansicht, Mittwoch.`, und der Knopf `Wochenansicht` hat den Fokus.
    - `shows the lunch of every day in the week view`: Plan mit Bolognese am
      Dienstag-Mittag und Chili am Dienstag-Abend. Das Feld `Dienstag` hat den Wert
      `Bolognese`.
    - `shows the weekday in front of every row of the week`: Die sieben `.weekdayMark`
      zeigen `Mo.` bis `So.` und stehen auf `aria-hidden`.
    - `names the rolling of a row after its day`: `Zufallsgericht für Montag`, danach
      lautet die Ansage `Montag, <Gericht>.`
    - `says which meal a suggestion put on a day of the week`: Die Ansage nennt
      `Montag, Bolognese.`
    - `says that the meal of a day of the week is kept in store`:
      `Montag, Bolognese, im Vorrat.`
    - `names the field of a covered day after the supply`: `Montag, im Vorrat`.
    - `shows each day as text while the plan is fixed`: festgelegt, dann
      `Montag, Bolognese` und `Dienstag, nichts geplant`.
    - `forgets what was typed when the view changes`: in `Mittagessen` tippen, zur
      Woche und zurück. Das Feld zeigt wieder den geplanten Wert.
    - `keeps the week view while the plan is fixed`: festlegen, der Knopf
      `Tagesansicht` ist weiter bedienbar.
    - `has no accessibility violations in the week view` und `has no accessibility
      violations in the week view of a fixed plan`.
  - `shows the rolling, stepping and clearing buttons as icons only` prüft zusätzlich
    `Wochenansicht`.
- [x] `src/SignedInApp.test.tsx`: Neu sind
  - `opens the week plan in the day view`: Es gibt `Wochenansicht`, aber kein Feld
    `Dienstag`.
  - `keeps the week view after a visit to the meals area`: `Wochenansicht`, dann
    `Gerichte`, dann `Wochenplan`. Das Feld `Montag` ist da, ebenso der Knopf
    `Tagesansicht`.
- [x] `e2e/weekPlan.spec.ts`: Neu ist `plans a day of the week in the week view`. Zur
  Woche umschalten, im Feld `Donnerstag` Bolognese wählen, auf
  `thursday.lunch` auf dem Server warten, zur Tagesansicht wechseln und zum Donnerstag
  blättern (`stepToDay`). Das Feld `Mittagessen` zeigt `Bolognese`.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch, einschließlich `weekPlanView.test.ts`.
- [x] `switches to the week view and says which meal time it shows` und
  `switches back to the day that was shown before` sind grün, der Fokus bleibt auf dem
  Umschalter.
- [x] `keeps the week view after a visit to the meals area` ist grün.
- [x] Alle `has no accessibility violations …`-Tests sind grün, auch die beiden neuen.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `npm run test:e2e` läuft durch, einschließlich `plans a day of the week in the
  week view`.

**Manuelle Verifikation**:

- [x] Mit VoiceOver im Wochenplan `Wochenansicht` doppeltippen: Man hört
  `Wochenansicht, Mittagessen.`, der Fokus steht auf `Tagesansicht`. Beim Weiterwischen
  folgen `Montag`, `Zufallsgericht für Montag` und so weiter bis `Sonntag`. Die
  Kürzel werden nicht vorgelesen.
- [x] `Tagesansicht` doppeltippen: Man hört `Tagesansicht, <Tag>.`, und es steht
  derselbe Tag da wie vorher.
- [x] Auf dem Handy stehen in der Wochenansicht alle sieben Felder bündig, mit und
  ohne Schneeflocke, auch bei eingeschalteter Farbumkehr. Der Umschalter steht in
  beiden Ansichten an derselben Stelle.

### Phase 2: Tageszeit wählen

Abhängigkeiten: Phase 1.

In der Wochenansicht stehen links vom Umschalter die vier Tageszeit-Knöpfe. Eine
unsichtbare `<h2>` nennt die gezeigte Tageszeit.

**Aufgaben**:

- [x] `src/meals/domain/announcements.test.ts` zuerst:
  `mealTimeShownAnnouncement('dinner')` ergibt `Abendessen.`
- [x] `src/meals/domain/announcements.ts`:
  ```ts
  export function mealTimeShownAnnouncement(time: MealTime): string {
    return `${mealTimeName(time)}.`
  }
  ```
- [x] `src/meals/ui/WeekPlanPage.tsx`:
  - Neue Prop `onShowTime: (time: MealTime) => void`.
  - Lokale Komponente `MealTimeNavigation({ shownTime, onShowTime })` ersetzt den
    Platzhalter:
    ```tsx
    <div className="mealTimeNavigation" role="group" aria-label="Tageszeit">
      {MEAL_TIMES.map((time) => (
        <button
          key={time}
          type="button"
          className="iconButton"
          aria-label={mealTimeName(time)}
          aria-pressed={time === shownTime}
          onClick={() => onShowTime(time)}
        >
          <MealTimeIcon time={time} />
        </button>
      ))}
    </div>
    ```
  - Nach `.planNavigation` steht in der Wochenansicht
    `<h2 className="visuallyHidden">{mealTimeName(shownTime)}</h2>`.
- [x] `src/meals/ui/WeekPlanArea.tsx`: Neue Prop `onShowTime`.
  `showTime(time)` bricht ab, wenn `time === shownTime`. Sonst ruft es
  `onShowTime(time)` auf und sagt `mealTimeShownAnnouncement(time)` an.
- [x] `src/SignedInApp.tsx`: `const [shownTime, setShownTime] = useState<MealTime>('lunch')`,
  `onShowTime={setShownTime}`.
- [x] `src/index.css`:
  - `.mealTimeNavigation { display: flex; gap: 0.5rem; }` (zusätzlich zu `flex: 1`
    aus Phase 1), und die Knöpfe darin bekommen `flex: 1`.
  - Neutrale Knöpfe:
    `.mealTimeNavigation button { background-color: var(--surface); border-color: var(--accentLine); }`
  - Der gewählte:
    `.mealTimeNavigation button[aria-pressed='true'] { background-color: var(--accent); border-color: var(--ink); }`
- [x] `src/meals/ui/WeekPlanArea.test.tsx`: `WeekPlanAreaUnderTest` hält zusätzlich
  `shownTime` in `useState`. Neu:
  - `offers the four meal times in the week view`: In der Gruppe `Tageszeit` stehen
    die Knöpfe `Frühstück`, `Mittagessen`, `Snack` und `Abendessen` in dieser
    Reihenfolge, jeder mit einem `svg` und ohne sichtbaren Text.
  - `marks the shown meal time as pressed`: `Mittagessen` hat
    `aria-pressed="true"`, die anderen `"false"`.
  - `shows the dinner of every day after the dinner was chosen`: Plan mit Chili am
    Dienstag-Abend. Nach `Abendessen` hat das Feld `Dienstag` den Wert `Chili`,
    `Abendessen` ist gedrückt, die Ansage lautet `Abendessen.`, und der Knopf hat den
    Fokus.
  - `says nothing when the shown meal time is chosen again`: `Mittagessen` drücken,
    es gibt keine neue Ansage.
  - `names the meal time in a hidden heading of the week view`: Die `<h2>` heißt
    `Mittagessen`, nach `Snack` heißt sie `Snack`.
  - `names the meal time that was chosen when switching to the week`: Start in der
    Tagesansicht mit `initialTime = 'snack'`. Nach `Wochenansicht` lautet die Ansage
    `Wochenansicht, Snack.`
  - `keeps the shown day when the meal time changes`: Start am Freitag, zur Woche,
    `Abendessen`, zurück zum Tag. Die `<h2>` heißt `Freitag`.
  - `forgets what was typed when the meal time changes`: in `Montag` tippen,
    `Abendessen`, dann `Mittagessen`. Das Feld zeigt wieder den geplanten Wert.
  - `has no accessibility violations with another meal time chosen`.
- [x] `src/SignedInApp.test.tsx`: Neu ist `keeps the chosen meal time after a visit to
  the meals area`: `Wochenansicht`, `Snack`, `Gerichte`, `Wochenplan`. `Snack` ist
  gedrückt.
- [x] `e2e/weekPlan.spec.ts`: Neu ist `shows the dinner of the whole week`. Im
  Tagesansicht-Feld `Abendessen` am Montag Chili planen, auf `monday.dinner` warten,
  `Wochenansicht` und `Abendessen` drücken. Das Feld `Montag` zeigt `Chili`, und
  `Abendessen` hat `aria-pressed="true"`.
- [x] `docs/notes.txt`: Den Punkt `- Wochenansicht auf Wochenplan-Seite` unter TODO auf
  `x` setzen und nach DONE verschieben, ans Ende über der Trennlinie.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `shows the dinner of every day after the dinner was chosen` und `says nothing
  when the shown meal time is chosen again` sind grün.
- [x] `has no accessibility violations with another meal time chosen` ist grün.
- [x] `npm run lint` und `npm run build` laufen durch.
- [x] `npm run test:e2e` läuft durch, einschließlich `shows the dinner of the whole
  week`.

**Manuelle Verifikation**:

- [ ] Mit VoiceOver in der Wochenansicht über die Knöpfe wischen: Man hört
  `Frühstück, Taste, Tageszeit, Gruppe` (die Reihenfolge der Teile kann je nach
  iOS-Version abweichen), dann `Mittagessen, ausgewählt` und so weiter.
- [ ] `Abendessen` doppeltippen: Man hört `Abendessen.`, der Fokus bleibt, und die
  sieben Felder zeigen das Abendessen der Woche.
- [ ] Per Rotor „Überschriften“ springt man von `Wochenplan, …` zu `Abendessen`.
- [ ] Der gewählte Knopf ist auf dem Handy klar vom Rest zu unterscheiden, auch bei
  eingeschalteter Farbumkehr. Die vier Knöpfe und der Umschalter passen auf 360 px
  nebeneinander.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: Lucide 1.48.0 zeichnet `calendar-days` und `calendar-1` inzwischen einen
  Pixel höher (`y="3"`, `M3 9h18`, Punkte bei 13/17). Wie im Plan vorgesehen folgen
  die neuen Icons den Koordinaten des vorhandenen `CalendarIcon.tsx` (`y="4"`,
  `M3 10h18`), damit alle Kalender gleich aussehen.

## Verweise

- `docs/notes.txt`, TODO: „Wochenansicht auf Wochenplan-Seite“
- `docs/agents/plans/2026-09-25-wochenplan-tagesansicht-mit-vier-mahlzeiten.md`:
  MZP-028, Tagesansicht, `shownDay`, Entscheidungen 5 bis 7
- `docs/agents/plans/2026-09-25-wochenplan-leeren.md`: MZP-029, untere Leiste mit vier
  Knöpfen
- Lucide-Icons (ISC-Lizenz): https://lucide.dev/icons/calendar-days,
  https://lucide.dev/icons/calendar-1
- WAI-ARIA `aria-pressed`: https://www.w3.org/TR/wai-aria-1.2/#aria-pressed
