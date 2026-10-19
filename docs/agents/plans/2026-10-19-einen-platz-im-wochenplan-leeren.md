---
date: 2026-10-19T13:08:57+00:00
git_commit: 3012df9355e836806b13897038a9beefb13c3bf6
branch: main
story: MZP-042
topic: "Einen Platz im Wochenplan leeren"
tags: [plan, meals, weekPlan, ui, announcements]
status: ready
---

# PLAN: MZP-042 — Einen Platz im Wochenplan leeren

Jede bearbeitbare Zeile des Wochenplans bekommt zwischen Textfeld und Würfel einen
Radiergummi-Knopf. Er leert mit einem Druck genau diesen Platz, statt dass man den Namen
Zeichen für Zeichen löschen muss. Alle Entscheidungen stammen aus der Befragung vom
2026-10-19.

## Akzeptanzkriterien

- Im Bearbeitungsmodus steht in jeder Zeile zwischen Textfeld und Würfel ein Knopf mit
  dem Radiergummi-Icon (`aria-hidden`), ohne sichtbaren Text.
- Der Knopf heißt `<Platzname> leeren`, mit demselben Platznamen wie der Würfel:
  - Tagesansicht: `Mittagessen leeren`
  - Wochenansicht: `Montag, 21. September leeren`
- Ein Druck leert den Platz. Das Feld ist danach leer, der Platz wird über
  `WeekPlanClient.writeWeekPlan` ohne Gericht gespeichert, und die Überschrift zählt
  ein Gericht weniger.
- Danach kommt die Ansage `Mittagessen, nichts geplant.` (Tagesansicht) bzw.
  `Montag, 21. September, nichts geplant.` (Wochenansicht).
- Steht nur getippter Text ohne gewähltes Gericht im Feld, räumt der Knopf ihn weg. Die
  Vorschlagsliste verschwindet, und dieselbe Ansage kommt.
- Der Knopf ist gesperrt (ausgegraut, `aria-disabled="true"`), wenn weder ein Gericht
  geplant ist noch Text im Feld steht. Ein Druck darauf ändert nichts und sagt nichts an.
- Nach dem Leeren bleibt der Fokus auf dem Knopf, der jetzt gesperrt ist.
- Reste verhalten sich wie beim Leeren von Hand. Wer den Ursprung leert, nimmt dem
  Folgetag nur die Reste-Markierung, das Gericht dort bleibt stehen. Wer den Reste-Platz
  leert, leert nur ihn.
- Das Leeren von Hand über die Tastatur bleibt stumm (der Test
  `says nothing when a field is emptied` gilt weiter).
- Im Lesemodus (festgelegt oder übertragen) gibt es den Knopf nicht.
- Die Barrierefreiheitsprüfung (axe) findet nach dem Leeren nichts.

## Wesentliche Entscheidungen und Abwägungen

1. **Icon: das vorhandene `EraserIcon`:**
   - Warum: Der Radiergummi bedeutet in der App „leeren“, in der Zeile für einen Platz,
     unten in der Leiste für den ganzen Plan.
   - Auswirkung: keine neue Icon-Datei.
2. **Name `<Platzname> leeren`, gebildet aus `slotName`:**
   - Warum: Er ist kurz, der Platz steht vorn, und er passt zu „Wochenplan leeren“.
     Beim Wischen hört man zuerst, um welchen Platz es geht.
   - Auswirkung: neue Funktion `clearSlotLabel(slot, naming)` in `announcements.ts`.
3. **Gesperrt mit `aria-disabled`, solange das Feld leer ist. Getippter Text zählt mit:**
   - Warum: Mit `disabled` fiele der Fokus nach dem Leeren auf `body`, und VoiceOver
     verlöre die Stelle (wie bei MZP-024 und MZP-029). Der Knopf bleibt in jeder Zeile
     stehen, das Layout springt nicht. Auch ein angefangenes Tippen soll sich mit einem
     Druck wegräumen lassen.
   - Auswirkung: Die Sperre hängt am Feldinhalt `typed ?? plannedName`, also am
     UI-Zustand. Sie liegt deshalb in `WeekPlanRow` und nicht als Regel in der Domäne.
     Weil ein Knopf mit `aria-disabled` weiter Klicks auslöst, prüft der Klick-Handler
     die Sperre selbst. Die CSS-Regel `button[aria-disabled='true']` gibt es schon.
4. **Ansage `<Platzname>, nichts geplant.`:**
   - Warum: Das ist derselbe Wortlaut wie im Lesemodus für einen leeren Platz
     (`fixedSlotText`), und er nennt den neuen Zustand.
   - Auswirkung: neue Funktion `slotClearedAnnouncement(slot, naming)` in
     `announcements.ts`. Neuer Handler `clearSlot` in `WeekPlanArea`, der über
     `WeekPlanPage` als `onClearSlot` an `WeekPlanRow` geht. Das Leeren von Hand läuft
     weiter über das stumme `chooseMeal(slot, null)`.
5. **Fachlich derselbe Weg wie das Leeren von Hand (`withMealIn(plan, slot, null)`):**
   - Warum: Das Verhalten ist einheitlich, auch bei Resten.
   - Auswirkung: keine Änderung an `weekPlan.ts`, an den Ports oder am
     Firestore-Adapter. `clearSlot` schreibt auch dann, wenn nur getippter Text
     weggeräumt wird. Das ist ein harmloser Schreibvorgang mit unverändertem Plan, der
     nebenbei die Id eines inzwischen gelöschten Gerichts entfernt.

## Ausgangslage

```
WeekPlanArea (Logik, Ansagen)        src/meals/ui/WeekPlanArea.tsx
 │  chooseMeal(slot, id)             :113  sagt nur etwas, wenn ein Gericht gewählt wurde
 │  shuffleSlot(slot)                :141
 └─ WeekPlanPage                     src/meals/ui/WeekPlanPage.tsx:245  eine Zeile je Platz
     └─ WeekPlanRow                  src/meals/ui/WeekPlanRow.tsx:38
         ├─ FixedSlot     Lesemodus, nur Text
         └─ EditableSlot  :115
              typed: string | null   getippter Text, null = Name des geplanten Gerichts
              change('')  → onChooseMeal(slot, null)       :124
              ShuffleSlotButton                            :78

useWeekPlan.chooseMeal → replacePlan(withMealIn(plan, slot, id))   src/meals/ui/useWeekPlan.ts:99
withMealIn                                                        src/meals/domain/weekPlan.ts:125
slotName / randomMealLabel / fixedSlotText                        src/meals/domain/announcements.ts:416-441
```

Vorher, Bearbeitungsmodus, Tagesansicht:

```
┌──────────────────────────────────────────────┐
│ ☀  ❄  [ Bolognese ...................... ] 🔀 │
│ ☀     [ ................................ ] 🔀 │
└──────────────────────────────────────────────┘
```

## Zielbild

```
Bearbeitungsmodus, Tagesansicht:
┌──────────────────────────────────────────────┐
│ ☀  ❄  [ Bolognese ................. ] ⌫  🔀   │   ⌫ aktiv
│ ☀     [ ........................... ](⌫) 🔀   │   ⌫ gesperrt, Feld leer
│ ☀     [ piz ....................... ] ⌫  🔀   │   ⌫ aktiv, nur getippt
│       ┌ Pizza ┐                              │
└──────────────────────────────────────────────┘

Wochenansicht:
│ Mo 21.    [ Bolognese ............. ] ⌫  🔀   │

Lesemodus: unverändert, keine Knöpfe in den Zeilen.
```

Ablauf eines Drucks:

```
Druck „Mittagessen leeren“
  └─ EditableSlot.clear()
       ├─ Feld leer (typed ?? plannedName === '')? ja → nichts
       └─ nein → setTyped(null)
                 onClearSlot(slot)
                   └─ WeekPlanArea.clearSlot(slot)
                        ├─ weekPlanning.chooseMeal(slot, null)   → writeWeekPlan
                        └─ announce(slotClearedAnnouncement(slot, naming))
                                                     → „Mittagessen, nichts geplant.“
```

## Abstraktionen und Wiederverwendung

Wiederverwendet werden `slotName`, `chooseMeal` aus `useWeekPlan` samt `withMealIn`,
`EraserIcon`, die Klasse `iconButton` (das CSS für `.weekPlanChoice .iconButton` streckt
schon jeden Knopf der Zeile) und die CSS-Regel für `aria-disabled`. Es gibt keinen neuen
Port und keine CSS-Änderung.

- `src/meals/domain`
  - `announcements.ts`, zwei neue Funktionen direkt nach `randomMealLabel`:
    - `clearSlotLabel(slot, naming)` gibt `` `${slotName(slot, naming)} leeren` `` zurück
    - `slotClearedAnnouncement(slot, naming)` gibt
      `` `${slotName(slot, naming)}, nichts geplant.` `` zurück
  - `announcements.test.ts`: Tests für beide
- `src/meals/ui`
  - `WeekPlanRow.tsx`: Prop `onClearSlot`, neue Komponente `ClearSlotButton`,
    `clear()` in `EditableSlot`
  - `WeekPlanPage.tsx`: Prop `onClearSlot` an `WeekPlanRow` weiterreichen
  - `WeekPlanArea.tsx`: Handler `clearSlot`
  - `WeekPlanArea.test.tsx`: neue Tests, Hilfsfunktion `clearSlot(name)`

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine.

Ein Platz des Wochenplans lässt sich im Bearbeitungsmodus mit einem Knopf leeren. Die
Domäne wird test-getrieben entwickelt: erst der fehlschlagende Test, dann der Code.

**Aufgaben**:

- [x] `src/meals/domain/announcements.test.ts`: nach `describe('randomMealLabel')` zwei
  Blöcke ergänzen, die zuerst fehlschlagen (Vorlage: `mondayBreakfast` wie bei
  `randomMealLabel`):
  - `describe('clearSlotLabel')`
    - `it('names the meal time the button clears')` →
      `clearSlotLabel(mondayBreakfast, 'time')` ist `'Frühstück leeren'`
    - `it('names the day the button clears')` →
      `clearSlotLabel(mondayBreakfast, 'day')` ist
      `'Montag, 21. September leeren'`
  - `describe('slotClearedAnnouncement')`
    - `it('says that nothing is planned for the meal time')` →
      `'Frühstück, nichts geplant.'`
    - `it('says that nothing is planned for the day')` →
      `'Montag, 21. September, nichts geplant.'`
- [x] `src/meals/domain/announcements.ts`: beide Funktionen direkt nach `randomMealLabel`
  ergänzen.

  ```ts
  export function clearSlotLabel(slot: PlanSlot, naming: SlotNaming): string {
    return `${slotName(slot, naming)} leeren`
  }

  export function slotClearedAnnouncement(
    slot: PlanSlot,
    naming: SlotNaming,
  ): string {
    return `${slotName(slot, naming)}, nichts geplant.`
  }
  ```

- [x] `src/meals/ui/WeekPlanArea.test.tsx`: Hilfsfunktion neben `shuffleSlot` anlegen:

  ```ts
  function clearSlotButton(name: string) {
    return screen.getByRole('button', { name: `${name} leeren` })
  }

  function clearSlot(name: string) {
    return userEvent.click(clearSlotButton(name))
  }
  ```

- [x] `src/meals/ui/WeekPlanArea.test.tsx`: neue Tests in einem eigenen
  `describe('clearing a meal time')` schreiben, die zuerst fehlschlagen:
  - `it('clears a planned meal time and says so')`: Plan mit Bolognese am Montag
    (Mittagessen). Nach `clearSlot('Mittagessen')` ist
    `mealIn(storedWeekPlan(), slot(MONDAY, 'lunch'))` `null`,
    `mealTimeField('Mittagessen')` hat den Wert `''`, die Überschrift heißt
    `Wochenplan, keine von 28`, und `announcements` ist
    `['Mittagessen, nichts geplant.']`.
  - `it('leaves the other meal times alone while it clears one')`: Bolognese am Montag
    zum Mittag- und Abendessen. Nach `clearSlot('Mittagessen')` steht im Abendessen
    weiter `'bolognese'`.
  - `it('clears what was typed without choosing a meal')`: leerer Plan,
    `typeIntoMealTime('Frühstück', 'pi')`. Nach `clearSlot('Frühstück')` ist das Feld
    leer, `noSuggestionsFor('Frühstück')` ist `null`, und `announcements` endet mit
    `'Frühstück, nichts geplant.'`.
  - `it('keeps the clear button focused after clearing')`: Nach
    `clearSlot('Mittagessen')` hat `clearSlotButton('Mittagessen')` den Fokus und
    `aria-disabled="true"`.
  - `it('offers no clearing of an empty meal time')`: leerer Plan,
    `clearSlotButton('Frühstück')` hat `aria-disabled="true"`. Ein Druck lässt
    `storedWeekPlan()` unverändert und fügt keine Ansage hinzu.
  - `it('names the day in the week view')`: Bolognese am Montag zum Mittagessen,
    Wochenansicht mit Mittagessen. Nach `clearSlot('Montag, 21. September')` ist der
    Platz leer, und `announcements` endet mit
    `'Montag, 21. September, nichts geplant.'`.
  - `it('keeps the meal of the leftovers but not the mark when the original is cleared')`:
    `renderWeekPlanArea([leavingLeftovers, pizza], withLeftovers)` wie im vorhandenen
    Reste-Test. Nach `clearSlot('Abendessen')` ist `leftoverSlots` leer, und am Dienstag
    steht zum Abendessen weiter das Gericht.
  - `it('turns the leftovers into an empty slot when they are cleared')`:
    `renderWeekPlanAreaOn(TUESDAY, [leavingLeftovers, pizza], withLeftovers)`. Nach
    `clearSlot('Abendessen')` ist `leftoverSlots` leer, und der Dienstag hat zum
    Abendessen kein Gericht.
  - `it('offers no clearing while the plan is fixed')`: Plan mit Gericht, nach
    `fixPlan()` liefert
    `screen.queryAllByRole('button', { name: / leeren$/ })` nur den Knopf
    `Wochenplan leeren`.
  - `it('shows the clear button as an icon only')`:
    `clearSlotButton('Frühstück').textContent` ist `''`.
  - `it('places the clear button between the field and the rolling')`: In der Zeile des
    Mittagessens folgen aufeinander das Textfeld, `Mittagessen leeren` und
    `Zufallsgericht für Mittagessen` (Reihenfolge über
    `compareDocumentPosition` oder über die Liste von `within(row).getAllByRole(...)`).
  - `it('has no accessibility violations after a meal time was cleared')`: nach
    `clearSlot('Mittagessen')` liefert `accessibilityViolations` nichts.
- [x] `src/meals/ui/WeekPlanRow.tsx`: Prop `onClearSlot: (slot: PlanSlot) => void` in
  `WeekPlanRowProps` ergänzen. `ClearSlotButton` neben `ShuffleSlotButton` anlegen und
  in `EditableSlot` zwischen `<input>` und `<ShuffleSlotButton>` einsetzen.

  ```tsx
  function ClearSlotButton({
    slot,
    naming,
    empty,
    onClear,
  }: {
    slot: PlanSlot
    naming: SlotNaming
    empty: boolean
    onClear: () => void
  }) {
    return (
      <button
        type="button"
        className="iconButton"
        aria-label={clearSlotLabel(slot, naming)}
        aria-disabled={empty}
        onClick={onClear}
      >
        <EraserIcon />
      </button>
    )
  }
  ```

  In `EditableSlot`:

  ```tsx
  const shownText = typed ?? plannedName

  function clear() {
    if (shownText === '') return
    setTyped(null)
    onClearSlot(slot)
  }
  ```

  Das `<input>` liest `value={shownText}`. Der Knopf bekommt `empty={shownText === ''}`
  und `onClear={clear}`.
- [x] `src/meals/ui/WeekPlanPage.tsx`: Prop `onClearSlot: (slot: PlanSlot) => void`
  ergänzen und an `WeekPlanRow` weiterreichen.
- [x] `src/meals/ui/WeekPlanArea.tsx`: `clearSlot` nach `chooseMeal` ergänzen und als
  `onClearSlot` an `WeekPlanPage` reichen.

  ```ts
  function clearSlot(slot: PlanSlot) {
    weekPlanning.chooseMeal(slot, null)
    announce(slotClearedAnnouncement(slot, slotNamingIn(shownView)))
  }
  ```

**Automatisierte Verifikation**:

- [x] Die neuen Tests für `clearSlotLabel` und `slotClearedAnnouncement` in
  `announcements.test.ts` laufen grün.
- [x] Die neuen Tests in `WeekPlanArea.test.tsx` laufen grün, auch die axe-Prüfung nach
  dem Leeren.
- [x] Der vorhandene Test `says nothing when a field is emptied` läuft unverändert grün.
- [x] `npm run test` läuft vollständig grün.
- [x] `npm run lint` meldet nichts.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [ ] Auf dem Handy, Tages- und Wochenansicht: Der Radiergummi steht zwischen Textfeld
  und Würfel. Die Zeile bricht nicht um, und das Textfeld bleibt gut lesbar, auch mit
  umgekehrten Farben.
- [ ] Mit VoiceOver: Nach dem Textfeld kommt „Mittagessen leeren, Taste“. Nach dem
  Doppeltippen kommt „Mittagessen, nichts geplant.“, der Fokus bleibt auf dem Knopf, und
  der Knopf wird als abgeblendet gemeldet.
- [ ] Nach dem Leeren zeigt ein zweites Gerät den Platz leer.

## Notizen zur Umsetzung

- Der Reihenfolgetest liest `input, button` per `querySelectorAll` aus der Zeile, weil
  `getAllByRole` keinen regulären Ausdruck als Rolle annimmt.
- Der Test `offers no clearing while the plan is fixed` lief schon vor der Umsetzung
  grün, weil der Lesemodus ohnehin keine Knöpfe in den Zeilen zeigt. Er sichert das
  Verhalten gegen spätere Änderungen ab.

## Verweise

- `docs/agents/plans/2026-09-25-wochenplan-leeren.md` (MZP-029): `EraserIcon`,
  `aria-disabled` statt `disabled`
- `docs/agents/plans/2026-09-24-wochenplan-festlegen-und-einmal-uebertragen.md`
  (MZP-024): Entscheidung 5, Fokus und `aria-disabled`
- `docs/agents/plans/2026-10-07-reste-am-naechsten-tag.md`: Reste-Plätze
- `src/meals/ui/WeekPlanRow.tsx:78-95`: `ShuffleSlotButton` als Vorbild
- `src/meals/domain/weekPlan.ts:125`: `withMealIn`
