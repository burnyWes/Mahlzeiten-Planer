---
date: 2026-09-24T14:48:11.548942+00:00
git_commit: 1eab02b103c3d7ade883ddf15c1551f935f47948
branch: main
story: MZP-025
topic: "Wochenplan festlegen und nur einmal übertragen"
tags: [plan, meals, weekPlan, supplies, bottomBar, firestore]
status: ready
---

# PLAN: MZP-025 — Wochenplan festlegen und nur einmal übertragen

Der Wochenplan bekommt zwei Modi: **Editiermodus** zum Planen und **Lesemodus** zum
Nachschlagen. Ein neuer Knopf in der unteren Leiste schaltet zwischen beiden um. Auf die
Einkaufsliste lässt sich nur im Lesemodus übertragen, und zwar genau einmal je
Festlegen. Die Schneeflocken der Tage, die beim Übertragen aus dem Vorrat kamen, bleiben
danach stehen, bis wieder bearbeitet wird.

Ziel: Der geplante Wochenplan bleibt einsehbar, besonders was aus dem Vorrat kommt, und
niemand packt aus Versehen alles zweimal auf die Einkaufsliste. Damit wird der
`docs/notes.txt`-Eintrag „Wochenplan-Prozess ueberarbeiten“ (MZP-015, Entscheidung 1)
abgelöst.

## Akzeptanzkriterien

- In der unteren Leiste sitzt zwischen „Zufallsauswahl generieren“ und dem Einkaufswagen
  ein neuer Knopf: 🔒 **„Plan festlegen“** im Editiermodus und ✏️ **„Plan bearbeiten“** im
  Lesemodus. Es ist dasselbe Element, nur Label und Icon wechseln.
- **Editiermodus:** Die Würfel je Tag und für die Woche sind aktiv (sofern es
  Zufallskandidaten gibt), die Tagesfelder sind bearbeitbar, und der Einkaufswagen ist
  gesperrt. Die Flocken zeigen live den Vorrat.
- **Lesemodus:** Alle Würfel sind gesperrt. Jede Tageszeile ist Text statt Eingabefeld:
  VoiceOver liest „Montag, Bolognese, im Vorrat“ oder „Montag, nichts geplant“, sichtbar
  steht „Mo. ❄ Bolognese“. Der Einkaufswagen ist aktiv, sofern mindestens ein Tag
  geplant ist. Bis zum Übertragen zeigen die Flocken live den Vorrat.
- Ein Druck auf den Einkaufswagen im Lesemodus überträgt wie bisher (kauft die
  ungedeckten Tage, zieht den Vorrat der gedeckten ab, sagt an). Danach ist er gesperrt
  und heißt **„Schon auf der Einkaufsliste“**. Der Fokus bleibt auf ihm, und ein
  weiterer Druck bewirkt nichts.
- Nach dem Übertragen zeigen die Flocken genau die Tage, die beim Druck gedeckt waren,
  auch wenn der Vorrat inzwischen leer ist.
- Überschrift: „Wochenplan, N von 7“ im Editiermodus, „Wochenplan, N von 7,
  festgelegt“ im Lesemodus und „Wochenplan, N von 7, festgelegt, übertragen“ nach dem
  Übertragen. Bei null geplanten Tagen steht „keine von 7“.
- Ansagen beim Umschalten: „Plan festgelegt, N von 7 Tagen geplant.“ (bei null „Plan
  festgelegt, keine von 7 Tagen geplant.“) und „Plan wieder bearbeitbar.“
- „Plan bearbeiten“ macht alles wieder bearbeitbar. Die Flocken sind wieder live, und
  der Merker „übertragen“ ist gelöscht. Nach erneutem „Plan festlegen“ ist der
  Einkaufswagen wieder aktiv.
- Der Modus ist geräteübergreifend: Was ein Gerät festlegt, bearbeitbar macht oder
  überträgt, sieht das andere sofort.
- Ohne gespeicherten Modus (Bestandsdaten) startet der Wochenplan im Editiermodus.

## Wesentliche Entscheidungen und Abwägungen

1. **Modus gemeinsam in Firestore, eigenes Dokument `weekPlan/stage`:** Die Felder sind
   `mode` (`'editing' | 'reading'`) und `coveredDays` (Liste von Wochentagen oder `null`).
   - Warum: Der Schutz gegen doppeltes Übertragen muss über beide Geräte greifen. Ein
     eigenes Dokument übersteht das komplette `setDoc` auf `weekPlan/current`
     (`firestoreWeekPlanClient.ts:40`), und `WeekPlan` bleibt als Typ unverändert.
   - Auswirkung: `WeekPlanClient` bekommt `observeStage`/`writeStage`. Die Regeln
     erlauben `weekPlan/{document}` schon (`firestore.rules:21-23`), ein Ausrollen der
     Regeln ist **nicht** nötig.

2. **Einfrieren erst beim Drücken des Einkaufswagens:** Bis dahin sind die Flocken auch
   im Lesemodus live. Beim Druck werden die gedeckten Tage vor dem Abziehen gespeichert.
   - Warum: Nutzerentscheidung. Vorratsänderungen bis zum Übertragen fließen noch ein.
   - Auswirkung: `coveredDaysOf(plan, meals, supplies)` in `weekPlan.ts` liefert die
     gedeckten Tage. `WeekPlanArea` schreibt sie beim Übertragen in den Stage, noch bevor
     `SignedInApp` den Vorrat abzieht. `WeekPlanTransfer` bleibt unverändert.

3. **Fachregeln als reine Funktionen in `meals/domain/weekPlanStage.ts`:** Das sind der
   Typ `WeekPlanStage` und die Übergänge `EDITING_STAGE`, `FIXED_STAGE`,
   `transferredStage`. Dazu kommen die Abfragen `isFixed`, `isTransferred`,
   `canShuffle`, `canTransfer` und `isCoveredOn`.
   - Warum: „nur im Lesemodus, nur einmal“ ist Fachlogik und gehört nicht in die
     Komponenten (Architektur-Skill, TypeScript-Referenz).
   - Auswirkung: TDD-Tests in `weekPlanStage.test.ts`. Die Komponenten fragen nur ab.

4. **Wechselnder Knopf statt `aria-pressed`:** Label und Icon nennen die Handlung, die
   ein Druck auslöst. Das Schloss (`LockIcon`) ist neu, der Stift ist das vorhandene
   `EditIcon`.
   - Warum: Nutzerentscheidung. VoiceOver hört direkt, was der Knopf tut.
   - Auswirkung: Es ist ein einziges `<button>`-Element mit wechselndem `aria-label`, der
     Fokus bleibt beim Umschalten stehen. Weil VoiceOver den Labelwechsel nicht selbst
     vorliest, folgt immer eine Ansage.

5. **Der Einkaufswagen wird mit `aria-disabled` gesperrt statt mit `disabled`:**
   - Warum: Er sperrt sich durch den eigenen Druck. `disabled` würde den Fokus auf `body`
     werfen (Nutzerentscheidung A).
   - Auswirkung: Der Klick-Handler prüft `canTransfer` und tut sonst nichts. Die
     CSS-Regel `button:disabled` gilt zusätzlich für `button[aria-disabled='true']`. Für
     alle gesperrten Zustände des Einkaufswagens wird einheitlich `aria-disabled` genutzt;
     die Würfel bleiben bei `disabled`. Tests prüfen den Einkaufswagen über
     `toHaveAttribute('aria-disabled', 'true')`, weil `toBeDisabled()` `aria-disabled`
     nicht wertet.

6. **Lesemodus-Zeile als Text mit verstecktem Volltext:** Sichtbar sind „Mo.“, die Flocke
   und der Gerichtname, alle mit `aria-hidden`. Für VoiceOver gibt es ein
   `span.visuallyHidden` mit „Montag, Bolognese, im Vorrat“.
   - Warum: Nutzerentscheidung A (Text statt Feld). Ein `aria-label` auf `<li>` oder
     `<span>` ohne Rolle liest VoiceOver nicht zuverlässig vor.
   - Auswirkung: `index.css` bekommt die übliche Utility-Klasse `.visuallyHidden`.

7. **Erneutes Festlegen gibt den Einkaufswagen wieder frei:** Das ist bewusst so, wie
   vom Nutzer beschrieben („bis zum nächsten Mal Lesemodus aktivieren“). Ein Druck nach
   Bearbeiten und Festlegen kauft auch die Tage, deren Vorrat schon verbraucht ist.

8. **Festlegen ist auch bei leerem Plan erlaubt:** Der Einkaufswagen bleibt dann
   gesperrt, weil kein Tag geplant ist.

9. **Der Snapshot-Bug in `useWeekPlan` bleibt offen:** Es gibt keinen
   `unconfirmedWrites`-Umbau. Der Stage läuft über dieselbe ungeprüfte Übernahme der
   Momentaufnahmen.
   - Warum: eigenständiges Thema, siehe `docs/notes.txt`.
   - Auswirkung: Der notes-Eintrag bekommt den Zusatz, dass jetzt auch der Modus
     betroffen sein kann. Die E2E-Tests warten vor einem Neuladen auf den Server.

## Ausgangslage

```
SignedInApp
  useWeekPlan(client) → { plan, chooseMeal, replacePlan }       weekPlan/current (7 Tage)
  useSupplies(client) → supplies (live)
  addWeekPlanToShoppingList(transfer)
     ├─ shoppingList.addItems(...)
     └─ supplies.changeSupply(... withoutPortions)
WeekPlanArea → WeekPlanPage
  ├─ WeekPlanRow × 7   [Mo.] [❄ live] [Eingabefeld] [🔀]
  └─ BottomBar         [ 🔀 Zufallsauswahl ] [ 🛒+ Auf die Einkaufsliste ]
```

- Die Flocke wird immer aus den aktuellen Vorräten berechnet
  (`isSuppliedOn`, `src/meals/domain/weekPlan.ts:48-60`). Nach dem Übertragen
  verschwindet sie sofort.
- Der Einkaufswagen ist nur bei null geplanten Tagen gesperrt
  (`src/meals/ui/WeekPlanPage.tsx:79`) und sonst beliebig oft drückbar.
  `SignedInApp.test.tsx:552` („buys the covered day on a second transfer“) hält genau
  dieses Verhalten fest.

Untere Leiste heute:

```
┌──────────────────────────────────────────────┐
│ [      🔀      ]      [      🛒+      ]      │
└──────────────────────────────────────────────┘
```

## Zielbild

```
weekPlan/stage
  { mode: 'editing' }                                 → Flocken live,        🛒 gesperrt
  { mode: 'reading', coveredDays: null }              → Flocken live,        🛒 aktiv (≥1 Tag)
  { mode: 'reading', coveredDays: ['monday', ...] }   → Flocken eingefroren, 🛒 gesperrt
  fehlt / unbekannt                                   → wie 'editing'

       Plan festlegen                 🛒 drücken
editing ─────────────► reading(null) ───────────► reading(coveredDays)
   ▲                        │                           │
   └──── Plan bearbeiten ───┴───────────────────────────┘
```

Editiermodus:

```
Wochenplan, 5 von 7
┌──────────────────────────────────────────────┐
│ Mo. ❄ [Bolognese               ] [🔀]        │
│ Di.   [Pizza                   ] [🔀]        │
│ Mi.   [                        ] [🔀]        │
│ ...                                          │
├──────────────────────────────────────────────┤
│ [    🔀    ]   [    🔒    ]   [   🛒+   ]grau │
└──────────────────────────────────────────────┘
          „Plan festlegen“   „Auf die Einkaufsliste“ (aria-disabled)
```

Lesemodus, vor und nach dem Übertragen:

```
Wochenplan, 5 von 7, festgelegt            Wochenplan, 5 von 7, festgelegt, übertragen
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ Mo. ❄ Bolognese              [🔀]grau│  │ Mo. ❄ Bolognese              [🔀]grau│
│ Di.   Pizza                  [🔀]grau│  │ Di.   Pizza                  [🔀]grau│
│ Mi.                          [🔀]grau│  │ Mi.                          [🔀]grau│
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ [ 🔀 ]grau  [  ✏️  ]  [  🛒+  ]       │  │ [ 🔀 ]grau  [  ✏️  ]  [  🛒+  ]grau   │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
            „Plan bearbeiten“                „Schon auf der Einkaufsliste“
VoiceOver je Zeile: „Montag, Bolognese, im Vorrat“ / „Mittwoch, nichts geplant“
```

## Abstraktionen und Wiederverwendung

Wiederverwendet werden `isSuppliedOn`, `shownMealOn`, `plannedDayCount`,
`weekPlanTransfer`, `EditIcon`, `BottomBar`, der `Announcer` über `announce` und das
Muster der In-Memory-Clients (`…ArrivesFromElsewhere`, `stored…`).

- `src/meals/domain/`
  - `weekPlanStage.ts` — **neu**
    - `WeekPlanStage` — `{ mode: 'editing' } | { mode: 'reading'; coveredDays: readonly Weekday[] | null }`
    - `EDITING_STAGE`, `FIXED_STAGE`, `transferredStage(coveredDays)`
    - `isFixed`, `isTransferred`, `canShuffle`, `canTransfer(stage, plannedDays)`
    - `isCoveredOn(stage, plan, day, meals, supplies)` — eingefrorene Tage vor live
      berechneten
  - `weekPlanStage.test.ts` — **neu**
  - `weekPlan.ts` — `coveredDaysOf(plan, meals, supplies)` kommt dazu, und
    `weekPlanTransfer` nutzt es intern
  - `announcements.ts` — `weekPlanHeading(plannedDays, stage)`, dazu neu
    `planFixedAnnouncement`, `planEditableAnnouncement`, `stageButtonLabel`,
    `transferButtonLabel` und `fixedDayText`
- `src/meals/api/`
  - `weekPlanClient.ts` — `observeStage`, `writeStage`
  - `firestoreWeekPlanClient.ts` — Dokument `weekPlan/stage`, `toWeekPlanStage`,
    `fromWeekPlanStage`
  - `inMemoryWeekPlanClient.ts` — zweiter Parameter `initialStage`, dazu
    `stageArrivesFromElsewhere`, `storedStage`
- `src/meals/ui/`
  - `useWeekPlan.ts` — `stage`, `changeStage`
  - `WeekPlanArea.tsx` — Umschalten samt Ansage, Übertragen samt Stage-Schreiben
  - `WeekPlanPage.tsx` — dritter Knopf, Sperrlogik und Überschrift
  - `WeekPlanRow.tsx` — Lesemodus-Zeile und gesperrter Würfel
  - `LockIcon.tsx` — **neu**
- `src/index.css` — `button[aria-disabled='true']`, `.visuallyHidden`, Layout der
  Lesezeile
- `e2e/emulatorHousehold.ts` — `weekPlanStageOnServer()`

## Logging und Beobachtbarkeit

Keine Änderungen. Schreibfehler am Stage gehen wie beim Plan über `onWriteFailure` als
Ansage „Konnte nicht gespeichert werden.“

## Umsetzung

### Phase 1: Plan festlegen und bearbeiten

Abhängigkeiten: keine

Der Umschaltknopf, der gemeinsame Modus und der Lesemodus entstehen. Übertragen geht nur
noch im Lesemodus, ist aber in dieser Phase noch beliebig oft möglich.

**Aufgaben**:

- [x] `weekPlanStage.test.ts` zuerst schreiben (rot), dann `weekPlanStage.ts`:
  ```ts
  export type WeekPlanStage =
    | { mode: 'editing' }
    | { mode: 'reading'; coveredDays: readonly Weekday[] | null }

  export const EDITING_STAGE: WeekPlanStage = { mode: 'editing' }
  export const FIXED_STAGE: WeekPlanStage = { mode: 'reading', coveredDays: null }

  export function isFixed(stage: WeekPlanStage): boolean
  export function canShuffle(stage: WeekPlanStage): boolean
  export function canTransfer(stage: WeekPlanStage, plannedDays: number): boolean
  ```
  Tests: Editiermodus erlaubt Würfeln und verbietet Übertragen. Der Lesemodus verbietet
  Würfeln und erlaubt Übertragen nur ab einem geplanten Tag.
- [x] `announcements.test.ts` / `announcements.ts`:
  - `weekPlanHeading(plannedDays, stage)` ergänzt im Lesemodus `, festgelegt`, etwa
    „Wochenplan, 5 von 7, festgelegt“ oder „Wochenplan, keine von 7, festgelegt“.
  - `planFixedAnnouncement(plannedDays)` gibt „Plan festgelegt, 5 von 7 Tagen
    geplant.“ oder „Plan festgelegt, keine von 7 Tagen geplant.“ zurück.
  - `planEditableAnnouncement()` gibt „Plan wieder bearbeitbar.“ zurück.
  - `stageButtonLabel(stage)` liefert „Plan festlegen“ oder „Plan bearbeiten“.
  - `fixedDayText(day, meal, inSupply)` liefert „Montag, Bolognese, im Vorrat“,
    „Montag, Bolognese“ oder „Montag, nichts geplant“.
  - Der Aufruf in `WeekPlanPage` wird angepasst.
- [x] Port `WeekPlanClient` um `observeStage(onStage)` und `writeStage(stage)`
  erweitern.
- [x] `inMemoryWeekPlanClient.ts`: `createInMemoryWeekPlanClient(initialPlan, initialStage = EDITING_STAGE)`,
  eigene Listener-Menge für den Stage, dazu `stageArrivesFromElsewhere(stage)` und
  `storedStage()`.
- [x] `firestoreWeekPlanClient.ts`: `doc(firestore, WEEK_PLAN, 'stage')`.
  `toWeekPlanStage(stored)` liefert bei `mode === 'reading'` die Weekday-gefilterten
  `coveredDays` (fehlt die Liste oder ist sie keine, `null`), sonst `EDITING_STAGE`.
  `writeStage` schreibt `{ mode }` bzw. `{ mode, coveredDays }` per `setDoc` und
  meldet Fehler über `onWriteFailure(WRITE_FAILED)`.
- [x] `useWeekPlan.ts`: `stage`-Zustand, Beobachtung über `client.observeStage` und
  `changeStage(stage)` (setzt lokal und schreibt), aufgenommen in `WeekPlanning`.
- [x] `LockIcon.tsx` im Stil von `EditIcon` anlegen (24er-viewBox, Strich, `aria-hidden`,
  `className="buttonIcon"`): Bügel und Körper eines geschlossenen Schlosses.
- [x] `WeekPlanArea.tsx`:
  - `toggleStage()` wechselt zu `FIXED_STAGE` und sagt
    `planFixedAnnouncement(plannedDayCount(...))` an, oder wechselt zu `EDITING_STAGE`
    und sagt `planEditableAnnouncement()` an.
  - `addToShoppingList()` überträgt nur, wenn
    `canTransfer(stage, plannedDayCount(...))` gilt.
  - `stage` und `onToggleStage` werden an `WeekPlanPage` gereicht.
- [x] `WeekPlanPage.tsx`: Die Leiste hat die Reihenfolge Würfel, Umschaltknopf,
  Einkaufswagen.
  - Der Würfel ist `disabled`, wenn `!canShuffle(stage) || randomCandidateCount === 0`.
  - Der Umschaltknopf hat `aria-label={stageButtonLabel(stage)}` und zeigt `LockIcon`
    bzw. `EditIcon`.
  - Der Einkaufswagen bekommt `aria-disabled={!canTransfer(stage, plannedDays)}` statt
    `disabled`.
  - Die Überschrift nutzt `weekPlanHeading(plannedDays, stage)`.
  - `stage` wird an jede Zeile gereicht.
- [x] `WeekPlanRow.tsx`: Im Lesemodus steht statt `input` und `MealSuggestions` ein
  `span.weekPlanMeal` (`aria-hidden`) mit dem Gerichtnamen, dazu ein
  `span.visuallyHidden` mit `fixedDayText(...)`. Die bestehenden Spans für Wochentag
  und Flocke bleiben. Der Würfel ist `disabled`, wenn
  `!canShuffle(stage) || randomCandidateCount === 0`. Ein angefangenes Tippen
  (`typed`) wird beim Wechsel in den Lesemodus verworfen, weil das Feld verschwindet.
- [x] `index.css`:
  - Die Regel `button:disabled` gilt auch für `button[aria-disabled='true']`.
  - `.visuallyHidden` kommt als übliches Clip-Muster dazu (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;`).
  - `.weekPlanMeal` bekommt `flex: 1; min-width: 0; overflow-wrap: anywhere;`, damit
    der Würfel rechts bündig bleibt.
- [x] `WeekPlanArea.test.tsx` anpassen und erweitern:
  - Hilfsfunktion `fixPlan()` drückt „Plan festlegen“. Die Übertragungstests
    (`hands the planned meals over…`, `leaves out a day…`,
    `leaves the covered days out…`, `keeps the transfer within reach…`,
    `leaves the plan standing…`) legen vorher fest.
  - `offers no transfer while no day carries a meal` prüft `aria-disabled` im
    Lesemodus. `keeps the transfer within reach…` prüft
    `not.toHaveAttribute('aria-disabled', 'true')`.
  - `leaves the plan standing after the transfer` erwartet den Lesetext statt des
    Feldwerts.
  - Neu: `offers no transfer while the plan is being edited`,
    `hands nothing over when the locked transfer is pressed`,
    `switches to reading and says how many days are planned`,
    `says that the plan can be edited again`,
    `names the stage button after what it does`,
    `puts the stage button between the rolling and the transfer`,
    `shows each day as text while the plan is fixed` (etwa „Montag, Bolognese, im
    Vorrat“ und „Mittwoch, nichts geplant“, keine Textbox),
    `locks every rolling button while the plan is fixed`,
    `names the heading after the fixed plan`,
    `shows the stage that the other device wrote` (`stageArrivesFromElsewhere`),
    `keeps the stage button focused after switching`, dazu
    `has no accessibility violations on a fixed plan`.
- [x] `SignedInApp.test.tsx`: Die Hilfsfunktion `transferTheWeekPlan()` drückt zuerst
  „Plan festlegen“ und dann den Einkaufswagen. `buys the covered day on a second transfer`
  wird in dieser Phase so angepasst, dass der zweite Druck nur den Einkaufswagen
  betrifft; Phase 2 schreibt diesen Test um.
- [x] `firestore.rules.test.ts`: Der Haushalt darf `weekPlan/stage` lesen und schreiben,
  ein Fremder nicht (analog zu `current`).
- [x] `e2e/weekPlan.spec.ts`: In `plans a week and puts its items on the shopping list`
  und `buys only the day that the supply no longer covers` wird vor dem Einkaufswagen
  „Plan festlegen“ gedrückt. Neu ist `keeps the fixed plan after a reload`: festlegen,
  mit `weekPlanStageOnServer()` auf `mode: 'reading'` warten, neu laden, dann steht die
  Überschrift auf „…, festgelegt“ und es gibt keine Textbox „Montag“ mehr.
- [x] `e2e/emulatorHousehold.ts`: `weekPlanStageOnServer()` liest `weekPlan/stage` per
  REST und gibt `{ mode, coveredDays }` zurück.

**Automatisierte Verifikation**:

- [x] `npm run test` grün (unter anderem `weekPlanStage.test.ts`,
  `announcements.test.ts`, `WeekPlanArea.test.tsx`, `SignedInApp.test.tsx`)
- [x] Die Regeltests in `firestore.rules.test.ts` sind grün.
- [x] `npx playwright test e2e/weekPlan.spec.ts` grün
- [x] `npm run lint` grün, auch die Architekturgrenze: `weekPlanStage.ts` importiert
  nichts aus `ui`/`api`.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: „Plan festlegen“ drücken. Der Fokus bleibt auf dem
  Knopf, er heißt jetzt „Plan bearbeiten“, und die Ansage „Plan festgelegt, N von 7
  Tagen geplant.“ ist zu hören.
- [x] Im Lesemodus liest VoiceOver jede Tageszeile als eine Einheit („Montag,
  Bolognese, im Vorrat“), und die Würfel werden als abgeblendet gemeldet.
- [x] Das Schloss-Icon ist in normalen und invertierten Farben gut erkennbar, und die
  drei Knöpfe passen nebeneinander in die Leiste.
- [x] Legt ein Gerät fest, zeigt das zweite Gerät den Lesemodus ohne Neuladen.

### Phase 2: Nur einmal übertragen und Vorrat eingefroren zeigen

Abhängigkeiten: Phase 1

Nach dem Übertragen ist der Einkaufswagen bis zum nächsten Festlegen gesperrt, und die
Flocken bleiben auf den Tagen stehen, die beim Druck gedeckt waren.

**Aufgaben**:

- [x] `weekPlan.test.ts` / `weekPlan.ts`: `coveredDaysOf(plan, meals, supplies)`
  liefert die Wochentage in Reihenfolge, für die `isSuppliedOn` gilt.
  `weekPlanTransfer` nutzt es für die Aufteilung in gedeckt und zu kaufen, ohne
  Verhaltensänderung.
- [x] `weekPlanStage.test.ts` / `weekPlanStage.ts`:
  - `transferredStage(coveredDays)` gibt
    `{ mode: 'reading', coveredDays }` zurück.
  - `isTransferred(stage)` gilt, wenn `coveredDays !== null`.
  - `canTransfer` ist nach dem Übertragen `false`.
  - `isCoveredOn(stage, plan, day, meals, supplies)` liefert nach dem Übertragen
    `coveredDays.includes(day) && shownMealOn(...) !== null`, sonst
    `isSuppliedOn(...)`.
  - Tests: Nach dem Übertragen bleibt ein Tag gedeckt, obwohl die Vorräte leer sind.
    Ein vorher ungedeckter Tag bleibt ungedeckt, obwohl jetzt Vorrat da ist. Im
    Editiermodus und im Lesemodus vor dem Übertragen zählt live der Vorrat.
- [x] `announcements.ts`:
  - `weekPlanHeading` ergänzt nach dem Übertragen `, festgelegt, übertragen`.
  - `transferButtonLabel(stage)` liefert „Auf die Einkaufsliste“ bzw. „Schon auf der
    Einkaufsliste“.
  - Beides kommt samt Tests dazu.
- [x] `WeekPlanArea.tsx`: `addToShoppingList()` schreibt zuerst
  `changeStage(transferredStage(coveredDaysOf(plan, meals, supplies)))` und ruft dann
  `onAddToShoppingList(weekPlanTransfer(...))` auf. Beides wird aus demselben
  Vorratsstand vor dem Abziehen berechnet.
- [x] `WeekPlanPage.tsx` / `WeekPlanRow.tsx`: Die Flocke, `weekdayFieldLabel` und
  `fixedDayText` nutzen `isCoveredOn(stage, ...)` statt `isSuppliedOn(...)`. Der
  Einkaufswagen bekommt `aria-label={transferButtonLabel(stage)}`.
- [x] `WeekPlanArea.test.tsx`, neue Tests:
  - `locks the transfer after it was pressed once`: Label „Schon auf der
    Einkaufsliste“, `aria-disabled`, ein zweiter Druck liefert keinen zweiten
    Eintrag in `transferred`.
  - `keeps the transfer button focused after the transfer`
  - `records the covered days of the transfer`: `storedStage()` enthält `coveredDays`.
  - `keeps the marks of the transfer when the supply is spent`: Die Supplies-Prop wird
    nach dem Übertragen auf `[]` neu gerendert, die Flocke bleibt.
  - `shows the live supply again once the plan is edited`
  - `offers the transfer again after the plan was fixed anew`
  - `names the heading after the transfer`
  - `shows the transfer that the other device made`
- [x] `SignedInApp.test.tsx`: `buys the covered day on a second transfer` wird ersetzt
  durch
  - `offers no second transfer of a fixed plan`: nach dem Übertragen ist der Knopf
    gesperrt, der Vorrat nur einmal abgezogen, und auf der Liste steht jeder Artikel
    einmal.
  - `buys the covered day once the plan is fixed anew`: übertragen, „Plan
    bearbeiten“, „Plan festlegen“ und wieder übertragen ergibt „Bohnen, 2“ und
    „Hackfleisch, 500 g“ (Entscheidung 7).
  - Neu ist außerdem `keeps the snowflake of a spent supply until the plan is edited`.
- [x] `e2e/weekPlan.spec.ts`: Neu ist `transfers a fixed plan only once`: planen,
  festlegen, übertragen, auf `coveredDays` in `weekPlanStageOnServer()` warten, neu
  laden. Danach steht die Überschrift auf „…, festgelegt, übertragen“, der Knopf
  „Schon auf der Einkaufsliste“ ist `aria-disabled`, und die Zeile „Montag, …, im
  Vorrat“ ist noch da, obwohl der Vorrat auf dem Server leer ist.
- [x] `docs/notes.txt`:
  - „Wochenplan-Prozess ueberarbeiten“ auf `x` setzen und nach DONE verschieben.
  - Unter TODO einen `b`-Hinweis anhängen: Der Snapshot-Bug von `useWeekPlan` betrifft
    seit MZP-025 auch `weekPlan/stage`, und eine verspätete Momentaufnahme könnte den
    Einkaufswagen kurz wieder freigeben.

**Automatisierte Verifikation**:

- [x] `npm run test` grün (unter anderem `weekPlan.test.ts`, `weekPlanStage.test.ts`,
  `WeekPlanArea.test.tsx`, `SignedInApp.test.tsx`)
- [x] `npx playwright test e2e/weekPlan.spec.ts e2e/supplies.spec.ts` grün
- [x] `npm run lint` grün
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [ ] Auf dem iPhone mit VoiceOver: Den Einkaufswagen im Lesemodus drücken. Die
  Übertragungsansage ist zu hören, der Fokus bleibt auf dem Knopf, und er heißt jetzt
  „Schon auf der Einkaufsliste, abgeblendet“.
- [ ] Die Flocken der gedeckten Tage bleiben nach dem Übertragen stehen. Nach „Plan
  bearbeiten“ verschwinden die Flocken der verbrauchten Vorräte.
- [ ] Nach dem Übertragen auf einem Gerät zeigt das zweite Gerät den gesperrten
  Einkaufswagen und die Überschrift „…, festgelegt, übertragen“.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: `WeekPlanRow` ist in `FixedDay` und `EditableDay` geteilt. Beim Festlegen baut
  React `EditableDay` ab, dadurch verfällt ein angefangenes Tippen ohne eigenen Reset.
  Dazu kommen die Tests `forgets what was typed once the plan is fixed` und
  `starts fixed when the stored stage says so`.
- Phase 2, Abweichung von Entscheidung 9 (mit Rückfrage beim Nutzer): Der Snapshot-Bug von
  `useWeekPlan` ist behoben statt nur vermerkt. Seit Phase 1 fiel
  `buys only the day that the supply no longer covers` in etwa jedem zweiten Lauf durch
  (vorher 1 von 8), und auf dem Server fehlte der Dienstag. Mitprotokolliert: Firestore
  liefert die Momentaufnahmen der eigenen Schreibvorgänge teils erst nach allen späteren
  Schreibvorgängen aus. Eine veraltete Momentaufnahme setzte den Plan zurück, und der
  nächste `setDoc` überschrieb den Tag. Jetzt merkt sich `useWeekPlan` für Plan und Stage
  den letzten eigenen Schreibvorgang und verwirft abweichende Momentaufnahmen, bis er
  zurückkommt (`isStaleSnapshot` in `unconfirmedWrite.ts`, dazu `sameWeekPlan` und
  `sameStage`, Tests in `useWeekPlan.test.tsx`). Danach waren 60 von 60 Läufen grün. Der
  geplante `b`-Hinweis zum Stage in `docs/notes.txt` entfällt deshalb, und der
  Bug-Eintrag steht unter DONE.
- Phase 2: `transfers a fixed plan only once` wartet vor dem Festlegen auf
  „Montag, im Vorrat“, damit der eben angelegte Vorrat schon angekommen ist.

## Verweise

- `docs/agents/plans/2026-09-23-vorrat-beim-uebertragen-verbrauchen.md` (MZP-015,
  Entscheidung 1: bisher kein Schutz gegen den zweiten Druck)
- `docs/agents/plans/2026-09-19-wochenplan-mit-zufallsauswahl.md`
- `docs/agents/plans/2026-09-17-knopfleiste-am-unteren-rand.md`
- `docs/notes.txt`: „Wochenplan-Prozess ueberarbeiten“ und der Snapshot-Bug von
  `useWeekPlan`
