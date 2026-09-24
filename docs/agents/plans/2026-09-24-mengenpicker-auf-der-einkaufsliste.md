---
date: 2026-09-24T05:58:13+00:00
git_commit: c51b723bcee0083aa5aa32c13c41ed8163acd694
branch: main
story: MZP-020
topic: "Mengenpicker auf der Einkaufsliste"
tags: [plan, shopping, quantity, firestore, ui, voiceover]
status: done
---

# PLAN: MZP-020 — Mengenpicker auf der Einkaufsliste

Wie bei den Vorräten soll jede offene Zeile der Einkaufsliste rechts einen Stepper
`[−] Menge [+]` tragen. `+` erhöht um 1, `−` verringert um 1, und `−` bei der letzten
Einheit nimmt den Artikel ganz von der Liste.

Vorlage sind die beiden TODO-Punkte `- Menge auf Einkaufsliste anpassbar machen`
(`docs/notes.txt:91`) und `- Mengenpicker auf Einkaufsliste` (`docs/notes.txt:103`).
Alle Entscheidungen stammen aus der Befragung vom 2026-09-24.

## Akzeptanzkriterien

- Jede **offene** Zeile zeigt links Checkbox und Namen, rechts `[−] Menge [+]`. Ohne
  Menge steht in der Mitte `1`, mit Einheit etwa `500 g`.
- **Abgehakte** Zeilen zeigen wie heute `Milch, 2` durchgestrichen, ohne Stepper.
- Die Checkbox heißt für VoiceOver weiterhin `Mehl, 500 g` bzw. `Brot`: die Menge steckt
  als visuell versteckter Text im Label. Die sichtbare Menge in der Mitte des Steppers
  ist `aria-hidden`, damit man sie nicht zweimal hört.
- Die Knöpfe heißen `Weniger, <Artikel>` und `Mehr, <Artikel>`.
- `Mehr` erhöht die Menge um 1 in ihrer Einheit. Ohne Menge wird aus `1` eine `2`
  (ohne Einheit). Ansage `<Artikel>, <Menge>.`, etwa `Mehl, 501 g.` oder `Brot, 2.`
- `Mehr` ist inaktiv, sobald die Menge plus 1 über 9999 läge. Eine größere Menge aus dem
  Formular bleibt erhalten und lässt sich nur verringern.
- `Weniger` verringert um 1, solange die Menge über 1 liegt; Ansage wie oben. Das
  Ergebnis wird auf 6 Nachkommastellen gerundet (`2,2 l` → `1,2 l`, nicht
  `1.2000000000000002 l`); eine getippte Menge wie `1,2345 l` bleibt dabei exakt.
- `Weniger` bei einer Menge ≤ 1, auch ohne Menge, löscht den Artikel aus Firestore. Die
  Zeile verschwindet sofort. Ansage `<Artikel> entfernt, noch N offen.` bzw.
  `<Artikel> entfernt, nichts mehr offen.`
- Danach steht der Fokus auf der Checkbox der folgenden Zeile, sonst der vorhergehenden,
  sonst auf der Überschrift.
- Ein entfernter Artikel zählt **nicht** als Änderung für `Aufräumen`.
- Eine verspätete Firestore-Momentaufnahme lässt weder eine **einzelne** geänderte Menge
  zurückspringen noch einen entfernten Artikel wieder auftauchen. Mehrere schnelle
  Schritte hintereinander sind davon ausgenommen (Entscheidung 10).
- Die Vorräte sehen aus und verhalten sich wie vorher.

## Wesentliche Entscheidungen und Abwägungen

1. **Schrittweite immer 1 in der vorhandenen Einheit, keine Menge zählt als 1.**
   - Warum: vorhersehbar. Die App rechnet beim Zusammenführen schon genauso
     (`orOneWithoutUnit`, `quantity.ts:72-74`). `500 g` → `501 g` ist selten sinnvoll,
     aber nie überraschend.
   - Auswirkung: `orOneWithoutUnit` wird exportiert. Die Schritt-Regeln samt Grenze und
     Rundung stehen in `shopping/domain/shoppingItem.ts`, weil die Grenze 9999 nur für
     die Einkaufsliste gilt; `shared/domain/quantity.ts` bleibt ohne Fachregel eines
     Kontexts.

2. **Obergrenze 9999, Prüfung auf „Menge + 1 ≤ 9999“.**
   - Warum: ein versehentliches Dauertippen soll nicht ausufern. Die Prüfung auf das
     Ergebnis statt auf den Stand deckt auch Bruchzahlen ab (`9998,5` → kein `+`).
   - Auswirkung: `canTakeOneMore(item)` steuert `disabled` am Knopf, `withOneMore` lässt
     den Artikel bei erreichter Grenze unverändert (wie `withOneMore` bei den Vorräten,
     `supply.ts:71-74`).

3. **Rundung auf 6 Nachkommastellen** nach jedem Schritt.
   - Warum: Gleitkommafehler würden sonst sichtbar und hörbar. 6 statt 3 Stellen, damit
     eine im Formular getippte Menge wie `1,2345 l` beim Schritt nicht verfälscht wird.
   - Auswirkung: eine private Funktion `roundedAmount` in `shoppingItem.ts`. Die Anzeige
     mit Punkt statt Komma (`1.5 l`) bleibt, wie sie heute überall ist
     (`formatQuantity`, `quantity.ts:59-63`).

4. **Entfernen = echtes Löschen.**
   - Warum: der Artikel ist nicht gekauft, sondern nicht mehr gewollt. Abhaken würde ihn
     als erledigt stehen lassen und ließe ihn per Checkbox wieder öffnen.
   - Auswirkung: der Port bekommt `removeItem(id)`. Firestore löscht per `deleteDoc` (wie
     `firestoreSuppliesClient.ts:54`), `firestore.rules` erlaubt `write` auf `items`
     bereits, also auch `delete` — keine Regeländerung.

5. **Unbestätigte Löschungen getrennt von unbestätigten Schreibvorgängen.**
   - Warum: `UnconfirmedWrite` trägt immer einen geschriebenen Artikel
     (`unconfirmedWrites.ts:4-7`). Eine Löschung dort unterzubringen, hieße jeden
     Aufrufer und elf Tests umzubauen. Eine eigene Liste von Ids ist kleiner und liest
     sich klarer.
   - Auswirkung: `unconfirmedWrites.ts` bekommt `UnconfirmedRemovals`,
     `withoutUnconfirmedRemovals`, `dropConfirmedRemovals` und `forgetWritesOf`. Beim
     Löschen **muss** eine noch offene Mengenänderung desselben Artikels vergessen
     werden: sonst hält `dropConfirmedWrites` sie fest, sobald das Dokument weg ist
     (`unconfirmedWrites.ts:52`), und `withUnconfirmedWrites` hängt den Artikel wieder an
     (`unconfirmedWrites.ts:43`).

6. **Die Id fliegt sofort aus der eingefrorenen Reihenfolge.**
   - Warum: sonst zählt `pendingChangeCount` den gelöschten Artikel als „Abgang“
     (`stableList.ts:28-31`) und `Aufräumen, 1 Änderung` erscheint für etwas, das schon
     weg ist.
   - Auswirkung: neue Funktion `withoutFromFrozenOrder` in `stableList.ts`.

7. **Stepper nur an offenen Zeilen; Menge in der Mitte `aria-hidden`.**
   - Warum: VoiceOver soll nicht an zwei nutzlosen Knöpfen je abgehakter Zeile
     vorbeiwischen; die Menge hört man schon in der Checkbox.
   - Auswirkung: `ShoppingItemRow` rendert zwei Varianten. Die Knöpfe stehen **neben**
     dem `<label>`, nicht darin — ein Knopf im Label würde die Checkbox mit auslösen.
     Das Label besteht aus sichtbarem Namen und einem Span `.visuallyHidden` mit
     `, 500 g`; so bleibt `formatItemForAnnouncement` die eine Quelle für den Namen der
     Checkbox. `.visuallyHidden` ist neu in `index.css`.

8. **Ein gemeinsamer `Stepper` in `shared/ui`.**
   - Warum: Vorrat und Einkaufsliste brauchen denselben Knopfaufbau. Die Mitte
     unterscheidet sich (der Vorrat lässt sie vorlesen, die Einkaufsliste nicht), also
     wird sie als `children` übergeben statt über einen Schalter.
   - Auswirkung: `SupplyListRow` wird auf `Stepper` umgestellt, ohne dass sich Markup-Text
     oder Verhalten ändern — die e2e-Erwartung `Bolognese−2+` (`supplies.spec.ts:98`)
     bleibt gültig. Die Klassen `.supplyStepper` und `.supplyCount` heißen danach
     `.stepper` und `.stepperAmount`.

9. **Fokusführung über `useFocusAfterRemoval`**, Ziel ist die Checkbox.
   - Warum: bewährt bei den Vorräten (`SupplyListPage.tsx:28-37`), mit VoiceOver auf dem
     Gerät geprüft.
   - Auswirkung: `ShoppingItemRow` bekommt einen `Ref<HTMLInputElement>` für die
     Checkbox. Gezählt wird die Position in der angezeigten Liste, abgehakte Zeilen
     eingeschlossen.

10. **Bekannte Grenzen der optimistischen Anzeige werden nicht in dieser Story gelöst,
    sondern als Bugs notiert.**
    - Mehrere schnelle Schritte: `rememberWrite` behält das `before` des ersten
      Schritts (`unconfirmedWrites.ts:26-29`). Kommt verspätet ein Zwischenstand, ist
      er weder `written` noch `before`, der Schreibvorgang gilt als überholt und die
      Anzeige springt kurz auf den Zwischenstand. Mit Firestores lokaler
      Latenzkompensation kaum sichtbar; der nächste Snapshot bringt den Endstand.
    - Löschung auf dem anderen Gerät bei eigenem unbestätigtem Schritt:
      `dropConfirmedWrites` behält den Schreibvorgang, solange das Dokument fehlt
      (`unconfirmedWrites.ts:52`), der Artikel bleibt als Geist stehen, und `updateDoc`
      meldet `Konnte nicht gespeichert werden.`
    - Entfernen eines Artikels, der selbst noch unbestätigt ist: `dropConfirmedRemovals`
      wertet dessen Fehlen im Snapshot schon als Bestätigung.
    - Warum: alle drei brauchen ein Überarbeiten von `dropConfirmedWrites`, das weit
      über den Stepper hinausgeht und die heutige Hinzufügen- und Abhaken-Logik
      mitbetrifft.
    - Auswirkung: drei `b`-Einträge in `docs/notes.txt` (Phase 2).

11. **Neue Ansagen enden mit Punkt**, wie beim Vorrat (`Bolognese, 4.`) und wie in der
    Befragung vereinbart. `checkOffAnnouncement`/`reopenAnnouncement` bleiben ohne
    Punkt — sie anzugleichen ist nicht Teil dieser Story.

## Ausgangslage

Die Zeile heute (`ShoppingItemRow.tsx:15-27`) — die ganze Zeile ist das Label der
Checkbox:

```
┌──────────────────────────────────────────┐
│ [ ]  Mehl, 500 g                         │   <label class="itemOpen">
│ [ ]  Brot                                │     <input type=checkbox>
│ [✓]  ~~Milch, 2~~                        │     <span>formatItemForAnnouncement</span>
└──────────────────────────────────────────┘
```

Der Datenfluss beim Abhaken (`useShoppingList.ts:158-175`):

```
Klick ─> toggleItem(item)
           ├─ client.checkOffItem(id)               Firestore, im Hintergrund
           ├─ rememberWrite(writes, checkOff(item))  optimistisch
           └─ return checkOffAnnouncement ─> announce

observeItems ─> liveItems ─> dropConfirmedWrites
                   │
liveItems + writes ─> withUnconfirmedWrites ─> settledItems
                                                  │
frozenOrder + settledItems ─> projectStableList ─> shownItems
```

Der Port (`shoppingListClient.ts:8-14`) kennt `observeItems`, `addItem`,
`changeQuantity`, `checkOffItem`, `reopenItem` — kein Löschen.

Das Vorbild bei den Vorräten (`SupplyListRow.tsx:31-51`):

```
<span class="supplyStepper">
  <button class="stepperButton" aria-label="Weniger, Bolognese">−</button>
  <span class="supplyCount">3</span>
  <button class="stepperButton" aria-label="Mehr, Bolognese" disabled={isFull}>+</button>
</span>
```

## Zielbild

Die Liste:

```
┌─────────────────────────────────────────────┐
│ Einkaufsliste, 2 offen                  [+] │
├─────────────────────────────────────────────┤
│ [ ]  Mehl                  [−]  500 g  [+]  │
│ [ ]  Brot                  [−]    1    [+]  │   ohne Menge: „1“
│ [✓]  ~~Milch, 2~~                           │   abgehakt: wie heute
└─────────────────────────────────────────────┘
```

Markup einer offenen Zeile:

```
<li class="shoppingRow">
  <label class="itemOpen">
    <input type="checkbox" ref={checkbox}>
    <span>Mehl<span class="visuallyHidden">, 500 g</span></span>
  </label>
  <Stepper lessLabel="Weniger, Mehl" moreLabel="Mehr, Mehl" moreDisabled={…}>
    <span class="stepperAmount" aria-hidden="true">500 g</span>
  </Stepper>
</li>
```

VoiceOver beim Wischen durch die Zeile:

```
„Mehl, 500 g, Kontrollkästchen, deaktiviert“
„Weniger, Mehl, Taste“
„Mehr, Mehl, Taste“
```

Die Schritte, so wie die Domäne sie rechnet:

```
Menge vorher     Mehr                Weniger
(keine)          2                   entfernt
1                2                   entfernt
0,5 l            1,5 l               entfernt
1,2345 l         2,2345 l            0,2345 l
1,5 l            2,5 l               0,5 l
2,2 l            3,2 l               1,2 l      <- gerundet
500 g            501 g               499 g
9998 g           9999 g              9997 g
9998,5 g         (inaktiv)           9997,5 g
9999 g           (inaktiv)           9998 g
12000 ml         (inaktiv)           11999 ml
```

Der Datenfluss nach der Änderung:

```
Mehr / Weniger (Menge > 1)
  ├─ client.changeQuantity(id, quantity)
  ├─ rememberWrite(writes, withQuantity(item, quantity), before)
  └─ return quantityChangedAnnouncement

Weniger (Menge ≤ 1)
  ├─ client.removeItem(id)
  ├─ removals += id,  writes -= Schreibvorgänge von id
  ├─ frozenOrder -= id
  └─ return itemRemovedAnnouncement

liveItems + writes ─> withUnconfirmedWrites ─> withoutUnconfirmedRemovals ─> settledItems
liveItems ─> dropConfirmedRemovals   (Id nicht mehr im Snapshot = bestätigt)
```

## Abstraktionen und Wiederverwendung

Wiederverwendet werden `withQuantity`, `formatQuantity`, `formatItemForAnnouncement`,
`rememberWrite`, `useFocusAfterRemoval`, `.stepperButton` und der Aufbau der
Vorrats-Tests. Neu sind die Schritt-Regeln, die Löschung im Port und in der
optimistischen Anzeige sowie der gemeinsame `Stepper`.

- `src/shared/domain`
  - `quantity.ts` — `orOneWithoutUnit` wird exportiert, sonst unverändert
- `src/shopping/domain`
  - `shoppingItem.ts` — Schritt-Regeln
    - `MAXIMUM_STEPPED_AMOUNT` — neu, 9999
    - `steppedQuantity`, `canTakeOneMore`, `withOneMore` — neu (Phase 1)
    - `isLastUnit`, `withOneLess` — neu (Phase 1 bzw. 2)
  - `announcements.ts` — `quantityChangedAnnouncement` (Phase 1),
    `itemRemovedAnnouncement` (Phase 2)
  - `unconfirmedWrites.ts` — `UnconfirmedRemovals`, `withoutUnconfirmedRemovals`,
    `dropConfirmedRemovals`, `forgetWritesOf` (Phase 2)
  - `stableList.ts` — `withoutFromFrozenOrder` (Phase 2)
  - dazu die passenden `*.test.ts`
- `src/shopping/api`
  - `shoppingListClient.ts` — `removeItem(id)` (Phase 2)
  - `firestoreShoppingListClient.ts` — `removeItem` per `deleteDoc` (Phase 2)
  - `inMemoryShoppingListClient.ts` — `removeItem` (Phase 2)
- `src/shopping/ui`
  - `ShoppingItemRow.tsx` — zwei Varianten, Stepper, versteckte Menge, Checkbox-Ref
  - `ShoppingListPage.tsx` — `onLessItem`, `onMoreItem`, Fokusführung
  - `ShoppingArea.tsx` — reicht `takeOneLess`/`takeOneMore` mit `announce` durch
  - `useShoppingList.ts` — `takeOneMore`, `takeOneLess`, Löschungen im Zustand
  - `ShoppingArea.test.tsx` — `shownItems()` liest das Label, neue Tests
- `src`
  - `SignedInApp.test.tsx` — `shownShoppingItemNames()` für die Einkaufsliste
- `src/shared/ui`
  - `Stepper.tsx` — neu
- `src/meals/ui`
  - `SupplyListRow.tsx` — nutzt `Stepper`
- `src/index.css` — `.shoppingRow`, `.visuallyHidden`, `.stepper`, `.stepperAmount`
- `e2e`
  - `keyboard.ts` — `shownShoppingItems(page)` neu
  - `emulatorHousehold.ts` — `itemQuantitiesOnServer()` neu
  - `shoppingList.spec.ts`, `meals.spec.ts`, `weekPlan.spec.ts` — Einkaufslisten-
    Erwartungen über `shownShoppingItems`; neue Tests in `shoppingList.spec.ts`
- `docs/notes.txt` — beide TODO-Punkte auf `x` und nach DONE, drei `b`-Einträge

Nicht angefasst werden `firestore.rules`, `addition.ts`, `AddItemPage.tsx`,
`SupplyListPage.tsx`, `supply.ts` und die Vorrats-Tests.

## Logging und Beobachtbarkeit

Die App hat kein Logging; beobachtbar ist sie über die Ansagen aus `announce`. Neu:

```
"Mehl, 501 g."
"Brot, 2."
"Milch entfernt, noch 3 offen."
"Milch entfernt, nichts mehr offen."
```

Scheitert das Schreiben oder Löschen in Firestore, greift wie bisher `onWriteFailure`
mit `Konnte nicht gespeichert werden.` (`firestoreShoppingListClient.ts:19`).

## Umsetzung

### Phase 1: Menge per Stepper ändern

Abhängigkeiten: keine.

Offene Zeilen bekommen den Stepper, `Mehr` und `Weniger` ändern die Menge und sagen sie
an. `Weniger` ist in dieser Phase bei einer Menge ≤ 1 **inaktiv**; Phase 2 macht daraus
das Entfernen.

**Aufgaben**:

- [x] `orOneWithoutUnit` in `src/shared/domain/quantity.ts` (Zeile 72-74) exportieren.
      Erst ein Test in `quantity.test.ts`: `null` ergibt `{ amount: 1, unit: null }`,
      eine vorhandene Menge kommt unverändert zurück.
- [x] Schritt-Regeln in `src/shopping/domain/shoppingItem.ts` ergänzen, hinter
      `withQuantity` (Zeile 104-109). Erst die Tests in `shoppingItem.test.ts`, ein
      `describe('stepping the quantity')` mit allen Zeilen der Tabelle im Zielbild
      außer „entfernt“:
      ```ts
      export const MAXIMUM_STEPPED_AMOUNT = 9999

      function roundedAmount(amount: number): number {
        return Math.round(amount * 1_000_000) / 1_000_000
      }

      export function steppedQuantity(item: ShoppingItem): Quantity {
        return orOneWithoutUnit(item.quantity)
      }

      export function canTakeOneMore(item: ShoppingItem): boolean {
        return steppedQuantity(item).amount + 1 <= MAXIMUM_STEPPED_AMOUNT
      }

      export function withOneMore(item: ShoppingItem): ShoppingItem {
        if (!canTakeOneMore(item)) return item
        const quantity = steppedQuantity(item)
        return withQuantity(item, {
          ...quantity,
          amount: roundedAmount(quantity.amount + 1),
        })
      }

      export function isLastUnit(item: ShoppingItem): boolean {
        return steppedQuantity(item).amount <= 1
      }
      ```
      `withOneLess` entsteht gleich mit der Rückgabe `ShoppingItem | null` (Vorbild
      `supply.ts:81-84`), damit sich seine Signatur in Phase 2 nicht ändert. In Phase 1
      wird es nur für Mengen > 1 wirksam aufgerufen:
      ```ts
      export function withOneLess(item: ShoppingItem): ShoppingItem | null {
        if (isLastUnit(item)) return null
        const quantity = steppedQuantity(item)
        return withQuantity(item, {
          ...quantity,
          amount: roundedAmount(quantity.amount - 1),
        })
      }
      ```
      Tests u. a.: ohne Menge → `withOneMore` ergibt `{ amount: 2, unit: null }`;
      `2.2 l` → `withOneLess` ergibt genau `1.2 l`; `1.2345 l` → `withOneMore` ergibt
      genau `2.2345 l`; `0.5 l`, `1` und „ohne Menge“ →
      `withOneLess` ergibt `null`; `9998.5 g` → `canTakeOneMore` ist `false` und
      `withOneMore` gibt denselben Artikel zurück; `12000 ml` → `canTakeOneMore` ist
      `false`. `Quantity` und `orOneWithoutUnit` kommen zum Import aus
      `'../../shared/domain/quantity'` dazu.
- [x] `quantityChangedAnnouncement` in `src/shopping/domain/announcements.ts` ergänzen,
      hinter `reopenAnnouncement` (Zeile 93-98). Erst die Tests in
      `announcements.test.ts`: `Mehl, 501 g.` und `Brot, 2.`
      ```ts
      export function quantityChangedAnnouncement(item: ShoppingItem): string {
        return `${formatItemForAnnouncement(item)}.`
      }
      ```
- [x] `src/shared/ui/Stepper.tsx` anlegen:
      ```tsx
      type StepperProps = {
        lessLabel: string
        moreLabel: string
        lessDisabled?: boolean
        moreDisabled: boolean
        onLess: () => void
        onMore: () => void
        children: ReactNode
      }

      export function Stepper({ … }: StepperProps) {
        return (
          <span className="stepper">
            <button type="button" className="stepperButton"
              aria-label={lessLabel} disabled={lessDisabled} onClick={onLess}>−</button>
            {children}
            <button type="button" className="stepperButton"
              aria-label={moreLabel} disabled={moreDisabled} onClick={onMore}>+</button>
          </span>
        )
      }
      ```
      `lessDisabled` gibt es nur für Phase 1; Phase 2 entfernt die Eigenschaft wieder.
- [x] `SupplyListRow.tsx` (Zeile 31-51) auf `Stepper` umstellen; die Mitte bleibt
      `<span className="stepperAmount">{count}</span>` **ohne** `aria-hidden`. Die
      Vorrats-Tests in `SuppliesArea.test.tsx` laufen unverändert grün — sie sind der
      Beleg, dass sich am Vorrat nichts ändert.
- [x] `src/index.css`: `.supplyStepper` (Zeile 293-298) in `.stepper` umbenennen,
      `.supplyCount` (Zeile 306-309) in `.stepperAmount` und dort `white-space: nowrap`
      ergänzen, damit `500 g` nicht umbricht. Neu:
      ```css
      .shoppingRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .shoppingRow label {
        flex: 1;
        min-width: 0;
      }

      .shoppingRow label span {
        overflow-wrap: anywhere;
      }

      .visuallyHidden {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
      }
      ```
      `grep -rn "supplyStepper\|supplyCount" src` findet danach nichts mehr.
- [x] `ShoppingItemRow.tsx` umbauen. Offene Zeile: Label mit Checkbox und
      `<span>{item.name}<span className="visuallyHidden">, {formatQuantity(…)}</span></span>`
      — der versteckte Span nur, wenn `item.quantity !== null`, damit die Checkbox bei
      `Brot` weiter genau `Brot` heißt. Daneben `Stepper` mit
      `lessLabel={lessItemLabel(item)}`, `moreLabel={moreItemLabel(item)}`,
      `lessDisabled={isLastUnit(item)}`, `moreDisabled={!canTakeOneMore(item)}` und in
      der Mitte `<span className="stepperAmount" aria-hidden="true">{formatQuantity(
      steppedQuantity(item))}</span>`. Abgehakte Zeile: unverändert wie heute. Das `<li>`
      bekommt in beiden Fällen `className="shoppingRow"`. Neue Props `onLess`, `onMore`.
- [x] `lessItemLabel` und `moreItemLabel` in `src/shopping/domain/announcements.ts`
      ergänzen, nach dem Vorbild `lessSupplyLabel`/`moreSupplyLabel` in
      `src/meals/domain/announcements.ts`; erst die Tests: `Weniger, Mehl` und
      `Mehr, Mehl`.
- [x] `takeOneMore(item): string` und `takeOneLess(item): string` in
      `useShoppingList.ts` ergänzen und in den Typ `ShoppingList` (Zeile 44-52)
      aufnehmen. Beide folgen `toggleItem` (Zeile 158-175):
      ```ts
      const changeQuantityTo = useCallback(
        (changed: ShoppingItem) => {
          const before = liveItems.find((live) => live.id === changed.id) ?? null
          client.changeQuantity(changed.id, steppedQuantity(changed))
          setUnconfirmedWrites((writes) => rememberWrite(writes, changed, before))
          return quantityChangedAnnouncement(changed)
        },
        [client, liveItems],
      )
      ```
      `takeOneMore = (item) => changeQuantityTo(withOneMore(item))`. `takeOneLess` ruft
      `changeQuantityTo` mit dem Ergebnis von `withOneLess(item)`. Bei `null` schreibt es
      in Phase 1 nichts und gibt `quantityChangedAnnouncement(item)` zurück — der
      Zweig ist unerreichbar, weil der Knopf dann inaktiv ist, und Phase 2 ersetzt ihn
      durch das Entfernen.
      `changeQuantity` im Port verlangt `Quantity` (nicht `null`); nach einem Schritt ist
      die Menge nie `null`.
- [x] `ShoppingListPage.tsx` um `onLessItem` und `onMoreItem` erweitern und an die Zeile
      reichen; `ShoppingArea.tsx` verdrahtet sie mit
      `(item) => announce(takeOneLess(item))` bzw. `takeOneMore`.
- [x] `ShoppingArea.test.tsx`: `shownItems()` (Zeile 153-155) liest künftig das Label,
      nicht die ganze Zeile — dann bleiben alle vorhandenen Erwartungen wie
      `['Milch, 2']` gültig:
      ```ts
      function shownItems() {
        return screen
          .getAllByRole('listitem')
          .map((row) => row.querySelector('label')?.textContent)
      }
      ```
      Dazu Hilfen `takeOneLess(name)` und `takeOneMore(name)` wie in
      `SuppliesArea.test.tsx:112-120`.
- [x] Neue Tests in `ShoppingArea.test.tsx`, ein `describe('changing the quantity at
      the row')`:
      - `counts an item without quantity up to two` — `Brot` → `Mehr`; gespeichert ist
        `{ amount: 2, unit: null }`, Ansage `Brot, 2.`, `shownItems()` ist `['Brot, 2']`.
      - `counts an amount with unit up and down` — `Mehl, 500 g` → `Mehr` → `501 g`,
        `Weniger` → `500 g`; Ansagen `Mehl, 501 g.` und `Mehl, 500 g.`
      - `rounds the amount after a step` — `Milch, 2.2 l` → `Weniger`; gespeichert ist
        genau `1.2`.
      - `shows one in the middle of an item without quantity` — die Mitte zeigt `1`, die
        Checkbox heißt `Brot`.
      - `names the checkbox with its quantity` — `getByRole('checkbox', { name:
        'Mehl, 500 g' })` wird gefunden.
      - `offers no more at the upper bound` — `9999 g`: `Mehr, Mehl` ist inaktiv,
        `Weniger, Mehl` aktiv.
      - `offers no stepper on a checked off item` — nach dem Abhaken gibt es keinen Knopf
        `Weniger, Milch` und `Mehr, Milch` mehr.
      - `keeps the stepped quantity while the snapshot lags behind` — mit
        `renderWithLaggingSnapshots`: `Mehr`, dann `client.snapshotArrives` mit der
        alten Menge; `shownItems()` zeigt weiter die neue.
      - `has no accessibility violations with a stepper` — Liste mit einem Artikel mit und
        einem ohne Menge.
- [x] `e2e/keyboard.ts` um `shownShoppingItems(page)` ergänzen:
      ```ts
      export function shownShoppingItems(page: Page) {
        return page.getByRole('main').getByRole('listitem').locator('label')
      }
      ```
      Alle Erwartungen an die Einkaufsliste darauf umstellen: `shoppingList.spec.ts:56`,
      `:66`, `:73`, `:89`, `:102`, `:107`, `:119`, `meals.spec.ts:48`,
      `weekPlan.spec.ts:62`, `:111`. `shownItems` bleibt für Vorräte und Gerichte.
- [x] `src/SignedInApp.test.tsx`: `shownItemNames()` (Zeile 94-98) liest die ganze
      Zeile und prüft damit die Einkaufsliste (`:359`, `:413`, `:439`, `:568`, `:712`,
      `:730`, `:758`, `:782`, `:859`) — mit Stepper stünde dort
      `Hackfleisch, 500 g−500 g+`. Die Hilfe wird aber auch für die Einstellungen
      genutzt (`:971`) und bleibt deshalb. Neu `shownShoppingItemNames()`, die
      `row.querySelector('label')?.textContent` liest; die neun Einkaufslisten-Stellen
      darauf umstellen.
- [x] `itemQuantitiesOnServer()` in `e2e/emulatorHousehold.ts` ergänzen, neben
      `itemNamesOnServer` (Zeile 59-72). Sie liefert je Dokument einen Text wie
      `'Milch, 3 l'` bzw. `'Brot'`, damit `expect.poll(...).toEqual([...])` direkt
      vergleicht. Firestore-REST: `quantity.mapValue.fields` (kann fehlen) mit
      `amount.integerValue` als **String** oder `amount.doubleValue` als Zahl und
      `unit.stringValue` bzw. `unit.nullValue`; ohne Menge `quantity.nullValue`.
- [x] `e2e/shoppingList.spec.ts` um `changes the quantity of an item at its row`
      ergänzen: `Milch, 2 l` anlegen, `Mehr, Milch` zweimal, `Weniger, Milch` einmal;
      Status `Milch, 3 l.`, `shownShoppingItems` ist `['Milch, 3 l']`,
      `expect.poll(itemQuantitiesOnServer).toEqual(['Milch, 3 l'])`.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch, einschließlich der unveränderten Vorrats-Tests.
- [x] Die Schritt-Tests in `shoppingItem.test.ts` decken jede Zeile der Tabelle im
      Zielbild ab (ohne „entfernt“ bei `withOneMore`, mit `null` bei `withOneLess`).
- [x] `keeps the stepped quantity while the snapshot lags behind` ist grün.
- [x] Die Zugänglichkeitsprüfungen der Liste sind grün, mit und ohne Menge.
- [x] `grep -rn "supplyStepper\|supplyCount" src` findet nichts.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `npm run test:e2e` läuft durch, einschließlich `changes the quantity of an item at
      its row` und `changes the count of a supply at its row` (`Bolognese−2+`).

**Manuelle Verifikation**:

- [x] Auf dem Gerät mit VoiceOver durch eine offene Zeile wischen: `Mehl, 500 g,
      Kontrollkästchen`, `Weniger, Mehl, Taste`, `Mehr, Mehl, Taste` — die Menge in der
      Mitte wird **nicht** vorgelesen.
- [x] `Mehr` drücken und `Mehl, 501 g.` hören; der Fokus bleibt auf dem Knopf.
- [x] Einen Artikel mit `9998 g` anlegen und `Mehr` drücken: der Knopf wird inaktiv.
      Prüfen, wo der VoiceOver-Fokus danach steht (bei den Vorräten mit `isFull`
      genauso); fällt er weg, als `b` in `docs/notes.txt` festhalten.
- [x] Die Zeile sieht aus wie eine Vorrats-Zeile, auch bei eingeschalteter Farbumkehr;
      `500 g` bricht nicht um, lange Namen verdrängen den Stepper nicht.
- [x] Die Mengenänderung erscheint auf dem zweiten Gerät.

### Phase 2: Artikel mit „Weniger“ entfernen

Abhängigkeiten: Phase 1.

`Weniger` bei der letzten Einheit löscht den Artikel, die Anzeige hält die Löschung
fest, bis Firestore sie bestätigt, und der Fokus wandert weiter.

**Aufgaben**:

- [x] `itemRemovedAnnouncement(item, openCount)` in
      `src/shopping/domain/announcements.ts` ergänzen, mit `openCountPhrase`
      (Zeile 82-84). Erst die Tests: `Milch entfernt, noch 3 offen.` und
      `Milch entfernt, nichts mehr offen.`
      ```ts
      export function itemRemovedAnnouncement(
        item: ShoppingItem,
        openCount: number,
      ): string {
        return `${item.name} entfernt, ${openCountPhrase(openCount)}.`
      }
      ```
- [x] In `src/shopping/domain/unconfirmedWrites.ts` ergänzen, erst die Tests in
      `unconfirmedWrites.test.ts`:
      ```ts
      export type UnconfirmedRemovals = readonly ItemId[]

      export function withoutUnconfirmedRemovals(
        items: readonly ShoppingItem[],
        removals: UnconfirmedRemovals,
      ): readonly ShoppingItem[] {
        return items.filter((item) => !removals.includes(item.id))
      }

      export function dropConfirmedRemovals(
        removals: UnconfirmedRemovals,
        liveItems: readonly ShoppingItem[],
      ): UnconfirmedRemovals {
        return removals.filter((id) => liveItems.some((item) => item.id === id))
      }

      export function forgetWritesOf(
        writes: UnconfirmedWrites,
        id: ItemId,
      ): UnconfirmedWrites {
        return writes.filter((write) => write.written.id !== id)
      }
      ```
      Tests: eine Löschung blendet den Artikel aus, solange der Snapshot ihn noch trägt;
      sie wird fallen gelassen, sobald er fehlt; `forgetWritesOf` lässt Schreibvorgänge
      anderer Artikel stehen.
- [x] `withoutFromFrozenOrder(order, id)` in `src/shopping/domain/stableList.ts`
      ergänzen, neben `appendToFrozenOrder` (Zeile 49-54). Erst die Tests in
      `stableList.test.ts`: die Id verschwindet, die übrigen behalten ihre Reihenfolge;
      und zusammen mit `pendingChangeCount`: Reihenfolge `['bread', 'milk']`, live nur
      `bread` — `pendingChangeCount(withoutFromFrozenOrder(order, 'milk'), live)` ist
      `0`, ohne die neue Funktion wäre es `1`.
- [x] `removeItem(id: ItemId): void` in `src/shopping/api/shoppingListClient.ts`
      aufnehmen. `firestoreShoppingListClient.ts`:
      `writeInBackground(deleteDoc(itemDocument(id)))`, `deleteDoc` zum Import.
      `inMemoryShoppingListClient.ts`: `items = items.filter((item) => item.id !== id)`,
      dann `publish()`.
- [x] `useShoppingList.ts`: Zustand `unconfirmedRemovals` neben `unconfirmedWrites`
      (Zeile 61-63). Im `observeItems`-Callback (Zeile 66-76) zusätzlich
      `setUnconfirmedRemovals((removals) => dropConfirmedRemovals(removals, items))`.
      `settledItems` (Zeile 79) wird zu
      `withoutUnconfirmedRemovals(withUnconfirmedWrites(liveItems, unconfirmedWrites),
      unconfirmedRemovals)`. `takeOneLess` bei `withOneLess(item) === null`:
      ```ts
      client.removeItem(item.id)
      setUnconfirmedRemovals((removals) => [...removals, item.id])
      setUnconfirmedWrites((writes) => forgetWritesOf(writes, item.id))
      setFrozenOrder((order) => withoutFromFrozenOrder(order, item.id))
      return itemRemovedAnnouncement(item, openCount - 1)
      ```
      Der Artikel ist offen (der Stepper steht nur an offenen Zeilen), also sinkt
      `openCount` um genau 1.
- [x] `lessDisabled` aus `Stepper.tsx` und `ShoppingItemRow.tsx` wieder entfernen.
- [x] Fokusführung in `ShoppingListPage.tsx` nach dem Vorbild `SupplyListPage.tsx:23-37`:
      `useFocusAfterRemoval(items.map((item) => item.id), heading)`, `keepRow(item.id)`
      als `checkbox`-Ref an die Zeile, und vor `onLessItem(item)` bei `isLastUnit(item)`
      `rowRemovedAt(position)`. `ShoppingItemRow` setzt den Ref auf die Checkbox beider
      Varianten.
- [x] Neue Tests in `ShoppingArea.test.tsx`, im `describe` aus Phase 1:
      - `removes an item when its last unit is taken` — `Brot` (ohne Menge) und
        `Milch, 2`; `Weniger, Brot`; `client.storedItems()` enthält nur noch Milch,
        Ansage `Brot entfernt, noch 1 offen.`
      - `removes an item with a fraction below one` — `Milch, 0.5 l` → `Weniger` entfernt.
      - `says that nothing is open any more` — einziger Artikel entfernt, Ansage
        `… entfernt, nichts mehr offen.`, Überschrift `Einkaufsliste, nichts offen`.
      - `leaves the focus on the checkbox that follows the removed row`,
        `leaves the focus on the checkbox before the removed last row`,
        `leaves the focus on the heading when the only item is removed` — wie
        `SuppliesArea.test.tsx:466-496`.
      - `does not count a removed item as a change to clean up` — nach dem Entfernen gibt
        es keinen Knopf `/Aufräumen/`.
      - `keeps a removed item away while the snapshot still carries it` — mit
        `renderWithLaggingSnapshots`: `Weniger` auf `Brot`, dann
        `client.snapshotArrives` mit dem alten Brot; `shownItems()` enthält kein `Brot`.
      - `keeps a removed item away after its quantity was changed` — mit
        `renderWithLaggingSnapshots`: `Milch, 2` → `Weniger` → `Weniger`, dann
        `client.deliverSnapshot()`; Milch bleibt weg. Das sichert `forgetWritesOf` ab.
- [x] `e2e/shoppingList.spec.ts` um `removes an item with its last unit` ergänzen:
      `Brot` und `Milch` anlegen, `Weniger, Brot`; Status `Brot entfernt, noch 1 offen.`,
      `shownShoppingItems` ist `['Milch']`, `Einkaufsliste, 1 offen` ist sichtbar, die
      Checkbox `Milch` hat den Fokus, `expect.poll(itemNamesOnServer).toEqual(
      ['Milch'])`. Danach `page.reload()` — `Brot` bleibt weg.
- [x] In `docs/notes.txt` unten unter TODO drei `b`-Einträge aus Entscheidung 10
      anhängen (schnelle Schritte mit verspätetem Zwischenstand; Löschung auf dem
      anderen Gerät bei eigenem unbestätigtem Schritt; Entfernen eines noch
      unbestätigten Artikels), je mit Datei:Zeile.
- [x] In `docs/notes.txt` die Punkte `- Menge auf Einkaufsliste anpassbar machen`
      (Zeile 91) und `- Mengenpicker auf Einkaufsliste` (Zeile 103) auf `x` setzen und in
      den DONE-Block über der TODO-Überschrift verschieben, ohne die übrigen Zeilen zu
      berühren.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `withoutUnconfirmedRemovals`, `dropConfirmedRemovals`, `forgetWritesOf` und
      `withoutFromFrozenOrder` sind test-getrieben entstanden und grün.
- [x] `keeps a removed item away while the snapshot still carries it` und
      `keeps a removed item away after its quantity was changed` sind grün.
- [x] Die drei Fokus-Tests sind grün.
- [x] `grep -n "lessDisabled" -r src` findet nichts.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `npm run test:e2e` läuft durch, einschließlich `removes an item with its last
      unit`.

**Manuelle Verifikation**:

- [x] Auf dem Gerät mit VoiceOver `Weniger` an einem Artikel ohne Menge drücken:
      `Brot entfernt, noch N offen.` hören, danach steht der VoiceOver-Fokus auf der
      Checkbox der folgenden Zeile.
- [x] Den letzten Artikel der Liste entfernen — der Fokus steht auf der vorhergehenden
      Zeile; den einzigen entfernen — auf der Überschrift.
- [x] Auf dem zweiten Gerät verschwindet der Artikel ebenfalls; `Aufräumen` erscheint
      auf dem ersten Gerät nicht.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- **Phase 1, Name der Checkbox per `aria-label` statt verstecktem Span** (Rückfrage vom
  2026-09-24). Chromium hat den Span `.visuallyHidden` wegen `position: absolute` als
  Block behandelt und den Namen als `Milch , 2 l` berechnet; jsdom rechnet ohne Layout,
  daher fiel es erst im e2e-Test auf. Jetzt tragen beide Varianten der Zeile
  `aria-label={formatItemForAnnouncement(item)}`, das offene Label zeigt sichtbar nur den
  Namen, `.visuallyHidden` entfällt. Die Test-Hilfen `shownItems()`
  (`ShoppingArea.test.tsx`), `shownShoppingItemNames()` (`SignedInApp.test.tsx`) und
  `shownShoppingItems(page)` (`e2e/keyboard.ts`) lesen deshalb das `aria-label` der
  Checkboxen; die e2e-Erwartungen laufen über `expect.poll(...).toEqual(...)`.
- **Phase 1, Farbtest**: `test/palette.test.ts` hielt `white-space` für die Farbe `white`.
  Das Muster verlangt jetzt, dass einem Farbwort kein `-` folgt, abgesichert durch den
  Test `tells a colour name from a property that starts with it`.
- **Phase 1, Grep auf `supplyCount`** findet weiter die Formular-`id="supplyCount"` in
  `AddSupplyPage.tsx` und `SupplyPage.tsx`. Gemeint war die CSS-Klasse, die ist weg.

## Verweise

- `docs/agents/plans/2026-09-22-vorraete-mit-anzahl.md` — MZP-011, der Stepper und die
  Fokusführung der Vorräte
- `docs/notes.txt:91`, `:103` — die beiden TODO-Punkte
- `src/shopping/domain/unconfirmedWrites.ts` — Schutz für unbestätigte eigene
  Schreibvorgänge seit MZP-006
