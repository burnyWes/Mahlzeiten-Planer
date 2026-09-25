---
date: 2026-09-25T10:10:01+00:00
git_commit: 3fdf05f895c64eba128efd94e1be6e99165ea6f6
branch: main
story: MZP-029
topic: "Wochenplan leeren"
tags: [plan, meals, weekPlan, domain, ui]
status: done
---

# PLAN: MZP-029 — Wochenplan leeren

Die untere Leiste des Wochenplans bekommt einen vierten Knopf ganz rechts. Er leert mit
einem Druck alle 28 Plätze der Woche. Der Knopf zeigt einen Radiergummi und heißt
`Wochenplan leeren`. Im Lesemodus und bei leerem Plan ist er gesperrt.

Das Vorhaben steht in `docs/notes.txt:187` („reset-button auf Wochenplan-Seite“). Alle
Entscheidungen stammen aus der Befragung vom 2026-09-25.

## Akzeptanzkriterien

- Die untere Leiste des Wochenplans hat vier Knöpfe in dieser Reihenfolge:
  `Zufallsauswahl generieren`, `Plan festlegen` beziehungsweise `Plan bearbeiten`,
  `Auf die Einkaufsliste` beziehungsweise `Schon auf der Einkaufsliste`,
  `Wochenplan leeren`.
- `Wochenplan leeren` zeigt nur ein Radiergummi-Icon (`aria-hidden`) und hat keinen
  sichtbaren Text.
- Ein Druck im Bearbeitungsmodus leert sofort und ohne Nachfrage alle 28 Plätze, auch
  die Plätze der Tage, die gerade nicht gezeigt werden. Der leere Plan wird über
  `WeekPlanClient.writeWeekPlan` gespeichert.
- Danach kommt die Ansage `Wochenplan geleert.`, und die Überschrift lautet
  `Wochenplan, keine von 28`.
- Der Knopf ist gesperrt (ausgegraut, `aria-disabled="true"`):
  - im Lesemodus, also festgelegt oder übertragen
  - im Bearbeitungsmodus, wenn kein Platz ein vorhandenes Gericht trägt
- Ein Druck auf den gesperrten Knopf ändert den Plan nicht und löst keine Ansage aus.
- Nach dem Leeren bleibt der Fokus auf dem Knopf, der jetzt gesperrt ist.
- Die Barrierefreiheitsprüfung (axe) findet nach dem Leeren nichts.

## Wesentliche Entscheidungen und Abwägungen

1. **Icon: neues `EraserIcon` (Radiergummi) statt des Papierkorbs:**
   - Warum: Der Papierkorb bedeutet in der App schon „Gericht löschen“ (`MealPage`).
     Hier werden keine Gerichte gelöscht, nur der Plan wird geleert.
   - Auswirkung: neue Datei `src/meals/ui/EraserIcon.tsx` im Stil der übrigen Icons
     (24er-`viewBox`, Linienzeichnung, `aria-hidden`, `focusable="false"`).
2. **Position: ganz rechts, nach dem Einkaufswagen:**
   - Warum: Der Knopf liegt weit weg vom oft gedrückten Würfel, so wie die zerstörende
     Aktion auf der Gerichtseite. Bei VoiceOver kommt er als letzter.
   - Auswirkung: Die Leiste hat vier Knöpfe, wie auf der `MealPage`. Das Layout
     (`.bottomBarContent button { flex: 1 }`) trägt das ohne CSS-Änderung.
3. **Keine Bestätigung, sofort leeren:**
   - Warum: Die Zufallsauswahl überschreibt den Plan genauso ohne Nachfrage. Der
     Lesemodus schützt einen festgelegten Plan schon.
   - Auswirkung: kein neuer Bildschirm, nur `replacePlan(EMPTY_WEEK_PLAN)` und eine
     Ansage.
4. **Sperre über `canClear(stage, plannedMeals)` mit `aria-disabled`:**
   - Warum: Der Knopf sperrt sich durch den eigenen Druck, weil der Plan danach leer
     ist. Mit `disabled` fiele der Fokus auf `body`, und VoiceOver verlöre die Stelle.
     Beim Einkaufswagen ist es aus demselben Grund so (MZP-024, Entscheidung 5).
   - Auswirkung: Die Regel liegt in der Domäne neben `canShuffle` und `canTransfer`.
     `WeekPlanArea` prüft sie vor dem Leeren, weil ein Knopf mit `aria-disabled`
     weiterhin Klicks auslöst. Die CSS-Regel `button[aria-disabled='true']`
     (`src/index.css:146`) gibt es schon.
5. **„Leer“ heißt: kein Platz trägt ein vorhandenes Gericht (`plannedMealCount === 0`):**
   - Warum: Die Überschrift und `canTransfer` zählen schon so. Ids von inzwischen
     gelöschten Gerichten sind unsichtbar und zählen nicht.
   - Auswirkung: Geleert wird trotzdem vollständig auf `EMPTY_WEEK_PLAN`, also
     einschließlich solcher verwaisten Ids.

## Ausgangslage

```
WeekPlanArea (Logik, Ansagen)          src/meals/ui/WeekPlanArea.tsx
 └─ WeekPlanPage (Darstellung)         src/meals/ui/WeekPlanPage.tsx:155-179
     └─ BottomBar
         [ 🔀 Würfel ] [ 🔒/✎ Festlegen ] [ 🛒 Einkaufsliste ]
          disabled       immer aktiv        aria-disabled

useWeekPlan.replacePlan(plan)          src/meals/ui/useWeekPlan.ts:56 → writeWeekPlan
EMPTY_WEEK_PLAN                        src/meals/domain/weekPlan.ts:33
canShuffle / canTransfer               src/meals/domain/weekPlanStage.ts:57-67
weekPlanShuffledAnnouncement           src/meals/domain/announcements.ts
```

Vorher:

```
Bearbeitungsmodus:
┌─────────────┬─────────────┬─────────────┐
│     🔀      │     🔒      │    (🛒)     │
│   Würfel    │  Festlegen  │   gesperrt  │
└─────────────┴─────────────┴─────────────┘
```

## Zielbild

```
Bearbeitungsmodus, Plan mit Gerichten:
┌──────────┬──────────┬──────────┬──────────┐
│    🔀    │    🔒    │   (🛒)   │    ⌫     │
│  Würfel  │Festlegen │ gesperrt │  Leeren  │
└──────────┴──────────┴──────────┴──────────┘

Bearbeitungsmodus, Plan leer:
┌──────────┬──────────┬──────────┬──────────┐
│    🔀    │    🔒    │   (🛒)   │   (⌫)    │
│  Würfel  │Festlegen │ gesperrt │ gesperrt │
└──────────┴──────────┴──────────┴──────────┘

Lesemodus (festgelegt oder übertragen):
┌──────────┬──────────┬──────────┬──────────┐
│   (🔀)   │    ✎     │    🛒    │   (⌫)    │
│ gesperrt │Bearbeiten│Einkaufsl.│ gesperrt │
└──────────┴──────────┴──────────┴──────────┘
```

Ablauf eines Drucks:

```
Druck „Wochenplan leeren“
  └─ WeekPlanArea.clearPlan()
       ├─ canClear(stage, plannedMeals)? nein → nichts
       └─ ja → weekPlanning.replacePlan(EMPTY_WEEK_PLAN)
              announce(weekPlanClearedAnnouncement())  → „Wochenplan geleert.“
```

## Abstraktionen und Wiederverwendung

Wiederverwendet werden `replacePlan` (samt Schutz gegen verspätete Momentaufnahmen aus
MZP-027), `EMPTY_WEEK_PLAN`, `plannedMealCount`, `BottomBar` und die CSS-Regel für
`aria-disabled`. Es gibt keinen neuen Port und keine Änderung am Firestore-Adapter.

- `src/meals/domain`
  - `weekPlanStage.ts` — neue Regel
    - `canClear(stage, plannedMeals)` — `!isFixed(stage) && plannedMeals > 0`
  - `weekPlanStage.test.ts` — Tests für `canClear`
  - `announcements.ts` — neue Ansage
    - `weekPlanClearedAnnouncement()` — `'Wochenplan geleert.'`
  - `announcements.test.ts` — Test für die Ansage
- `src/meals/ui`
  - `EraserIcon.tsx` — neu, Radiergummi
  - `WeekPlanArea.tsx` — `clearPlan`, an die Seite als `onClearPlan` gereicht
  - `WeekPlanPage.tsx` — Prop `onClearPlan`, vierter Knopf in der `BottomBar`
  - `WeekPlanArea.test.tsx` — neue Tests, Reihenfolgetest angepasst
- `docs/notes.txt` — Punkt `reset-button auf Wochenplan-Seite` nach der Abnahme auf `x`
  setzen und nach DONE verschieben

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine.

Der Wochenplan lässt sich im Bearbeitungsmodus mit einem Knopf ganz leeren. Die Domäne
wird test-getrieben entwickelt, erst der fehlschlagende Test, dann der Code.

**Aufgaben**:

- [x] `src/meals/domain/weekPlanStage.test.ts`: Tests für `canClear` schreiben. Sie
  gehören in die vorhandenen `describe`-Blöcke `EDITING_STAGE`, `FIXED_STAGE` und
  `transferredStage` und schlagen zuerst fehl:
  - `EDITING_STAGE`: `it('allows clearing once a meal is planned')` →
    `canClear(EDITING_STAGE, 1)` ist `true`
  - `EDITING_STAGE`: `it('allows no clearing while no meal is planned')` →
    `canClear(EDITING_STAGE, 0)` ist `false`
  - `FIXED_STAGE`: `it('allows no clearing however many meals are planned')` →
    `canClear(FIXED_STAGE, 5)` ist `false`
  - `transferredStage`: `it('allows no clearing')` →
    `canClear(transferredStage([]), 5)` ist `false`
- [x] `src/meals/domain/weekPlanStage.ts`: `canClear` neben `canShuffle` und
  `canTransfer` ergänzen.

  ```ts
  export function canClear(
    stage: WeekPlanStage,
    plannedMeals: number,
  ): boolean {
    return !isFixed(stage) && plannedMeals > 0
  }
  ```

- [x] `src/meals/domain/announcements.test.ts`: `describe('weekPlanClearedAnnouncement')`
  mit `it('says that the plan was cleared')` → `'Wochenplan geleert.'`, zuerst
  fehlschlagend.
- [x] `src/meals/domain/announcements.ts`: `weekPlanClearedAnnouncement()` direkt nach
  `weekPlanShuffledAnnouncement` ergänzen.
- [x] `src/meals/ui/EraserIcon.tsx` anlegen. Der Aufbau folgt `ShuffleIcon.tsx`
  (`className="buttonIcon"`, `viewBox="0 0 24 24"`, `stroke="currentColor"`,
  `strokeWidth="2"`, runde Enden, `aria-hidden="true"`, `focusable="false"`). Die
  Pfade sind die des Radiergummis aus Lucide (ISC-Lizenz):

  ```tsx
  <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
  <path d="M22 21H7" />
  <path d="m5 11 9 9" />
  ```

- [x] `src/meals/ui/WeekPlanArea.test.tsx`: neue Tests schreiben. Hilfsfunktionen
  `clearButton()` (`getByRole('button', { name: 'Wochenplan leeren' })`) und
  `clearPlan()` (`userEvent.click(clearButton())`) neben `transferButton()` anlegen.
  - `it('clears every meal time of the week and says so')`: Plan mit Gerichten am
    Montag (Mittagessen) und Sonntag (Abendessen), gezeigt wird Montag. Nach
    `clearPlan()` ist `mealsOf(weekPlanClient.storedWeekPlan())` gleich
    `mealsOf(EMPTY_WEEK_PLAN)`, und `announcements` endet mit `'Wochenplan geleert.'`.
  - `it('names the heading after the cleared plan')`: Nach dem Leeren heißt die
    Überschrift `Wochenplan, keine von 28`.
  - `it('keeps the clear button focused after clearing')`: Nach `clearPlan()` hat
    `clearButton()` den Fokus und `aria-disabled="true"`.
  - `it('offers no clearing while no meal time carries a meal')`: Bei leerem Plan hat
    `clearButton()` `aria-disabled="true"`.
  - `it('offers no clearing while the plan is fixed')`: Plan mit Gericht, nach
    `fixPlan()` hat `clearButton()` `aria-disabled="true"`. Ein Druck lässt
    `storedWeekPlan()` unverändert und fügt keine Ansage hinzu.
  - `it('offers no clearing after the transfer')`: Plan mit Gericht, `fixPlan()`,
    `addToShoppingList()`, danach hat `clearButton()` `aria-disabled="true"`.
  - `it('has no accessibility violations after the plan was cleared')`: nach
    `clearPlan()` liefert `accessibilityViolations` nichts.
- [x] `src/meals/ui/WeekPlanArea.test.tsx`: vorhandene Tests anpassen.
  - `puts the stage button between the rolling and the transfer`: umbenennen in
    `it('orders the bottom bar as rolling, stage, transfer and clearing')` und die
    erwartete Liste um `'Wochenplan leeren'` am Ende ergänzen.
  - `shows the rolling and stepping buttons as icons only`: umbenennen in
    `it('shows the rolling, stepping and clearing buttons as icons only')` und
    `expect(clearButton().textContent).toBe('')` ergänzen.
- [x] `src/meals/ui/WeekPlanArea.tsx`: `clearPlan` ergänzen und als `onClearPlan` an
  `WeekPlanPage` reichen.

  ```ts
  function clearPlan() {
    if (!canClear(stage, plannedMeals)) return
    weekPlanning.replacePlan(EMPTY_WEEK_PLAN)
    announce(weekPlanClearedAnnouncement())
  }
  ```

- [x] `src/meals/ui/WeekPlanPage.tsx`: Prop `onClearPlan: () => void` ergänzen und in
  der `BottomBar` nach dem Einkaufswagen den vierten Knopf einfügen.

  ```tsx
  <button
    type="button"
    aria-label="Wochenplan leeren"
    aria-disabled={!canClear(stage, plannedMeals)}
    onClick={onClearPlan}
  >
    <EraserIcon />
  </button>
  ```

- [x] `docs/notes.txt`: erst nach der manuellen Abnahme den Punkt
  `- reset-button auf Wochenplan-Seite` auf `x` setzen und nach DONE verschieben.

**Automatisierte Verifikation**:

- [x] Die neuen `canClear`-Tests in `weekPlanStage.test.ts` laufen grün.
- [x] Der Test `weekPlanClearedAnnouncement` in `announcements.test.ts` läuft grün.
- [x] Die neuen und angepassten Tests in `WeekPlanArea.test.tsx` laufen grün, auch die
  axe-Prüfung nach dem Leeren.
- [x] `npm run test` läuft vollständig grün.
- [x] `npm run lint` meldet nichts.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [x] Auf dem Handy: Der Wochenplan zeigt vier gleich breite Knöpfe, der Radiergummi
  steht ganz rechts und ist als Radiergummi zu erkennen, auch mit umgekehrten Farben.
- [x] Mit VoiceOver: Der letzte Knopf der Leiste heißt „Wochenplan leeren, Taste“. Nach
  dem Doppeltippen kommt „Wochenplan geleert.“, der Fokus bleibt auf dem Knopf, und der
  Knopf wird als abgeblendet gemeldet.
- [x] Nach dem Leeren zeigt ein zweites Gerät den leeren Plan.
- [x] Im festgelegten Plan ist der Radiergummi ausgegraut, und ein Tippen bewirkt
  nichts.

## Notizen zur Umsetzung

## Verweise

- `docs/notes.txt:187` — reset-button auf Wochenplan-Seite
- `docs/agents/plans/2026-09-24-wochenplan-festlegen-und-einmal-uebertragen.md` —
  Entscheidung 5, `aria-disabled` statt `disabled`
- `docs/agents/plans/2026-09-25-wochenplan-tagesansicht-mit-vier-mahlzeiten.md` — 28
  Plätze, Tagesansicht
- `src/meals/ui/MealPage.tsx:80-101` — Vorbild für die Leiste mit vier Knöpfen
- Lucide-Icon „eraser“: https://lucide.dev/icons/eraser
