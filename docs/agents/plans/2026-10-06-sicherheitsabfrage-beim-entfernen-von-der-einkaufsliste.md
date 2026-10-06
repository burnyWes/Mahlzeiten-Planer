---
date: 2026-10-06T07:50:07.563188+00:00
git_commit: 5de21a657ae18551de2b40c2745968eca39ba7b5
branch: main
story: MZP-038
topic: "Sicherheitsabfrage beim Entfernen von der Einkaufsliste"
tags: [plan, shopping, ShoppingArea, ShoppingListPage, ShoppingItemRow, Stepper, useFocusAfterRemoval, voiceover]
status: ready
---

# PLAN: MZP-038 — Sicherheitsabfrage beim Entfernen von der Einkaufsliste

Drückt man auf der Einkaufsliste „Weniger“ bei einem Artikel, von dem es nur noch einen
gibt, wird der Artikel heute sofort und endgültig gelöscht. Künftig erscheint vorher
eine Sicherheitsabfrage, ob der Artikel wirklich entfernt werden soll.

## Akzeptanzkriterien

- „Weniger“ bei einem offenen Artikel mit Menge ≤ 1 (auch ohne Menge, auch `0,5 l`)
  entfernt nichts. Stattdessen öffnet sich die Seite „`<Name>` entfernen?“, und der
  Fokus liegt auf ihrer Überschrift.
- Die Seite zeigt den Knopf „Zurück zur Einkaufsliste“, die Überschrift
  „`<Name>` entfernen?“, den Satz „Der Artikel wird für beide Geräte von der
  Einkaufsliste entfernt.“ und die Knöpfe „Entfernen“ und „Abbrechen“.
- „Entfernen“ löscht den Artikel ganz, auch wenn seine Menge inzwischen über 1 liegt.
  Die Ansage lautet „`<Name>` entfernt, noch N offen.“ bzw. „`<Name>` entfernt, nichts
  mehr offen.“ Der Fokus landet auf der Checkbox der Zeile, die der entfernten folgt,
  sonst auf der davor, sonst auf der Überschrift der Liste.
- „Abbrechen“ und „Zurück zur Einkaufsliste“ lassen den Artikel unverändert und sagen
  nichts an. Der Fokus landet auf dem Knopf „Weniger, `<Name>`“ desselben Artikels.
- Verschwindet der Artikel, während die Abfrage offen ist (etwa weil er auf dem anderen
  Gerät gelöscht wurde), erscheint ohne Ansage die Liste, und der Fokus liegt auf der
  Überschrift.
- „Weniger“ bei einer Menge über 1 verringert wie bisher ohne Abfrage.
- In jedem anderen Fall, in dem die Liste neu erscheint (Rückkehr vom Hinzufügen,
  Wechsel über die Navigationsleiste), liegt der Fokus wie bisher auf der Überschrift.
- Die Bestätigungsseite hat keine Barrierefreiheitsverstöße (axe).

## Wesentliche Entscheidungen und Abwägungen

1. **Eigene Bestätigungsseite `RemoveItemPage`:** nach dem Muster von
   `DeleteKnownItemPage`. Ein Inline-Bestätigen in der Zeile und ein modaler `<dialog>`
   wurden verworfen.
   - Warum: Das Muster ist im Projekt bewährt (fünf Lösch-Seiten), mit VoiceOver
     eindeutig und braucht keine neue Technik.
   - Auswirkung: `ShoppingArea` ersetzt `addingItem: boolean` durch einen
     `page`-Zustand mit den Fällen Liste, Hinzufügen und Entfernen.
2. **Auslöser ist `isLastUnit`:** Die Abfrage kommt genau dann, wenn „Weniger“ heute
   löschen würde, also bei einer Menge ≤ 1, auch ohne Menge und bei Bruchteilen.
   - Warum: Ein Artikel ohne Menge sieht in der Liste wie „1“ aus, und bei `0,5 l` wäre
     ein ungefragtes Löschen genau der Fehler, den die Abfrage verhindern soll.
   - Auswirkung: Die Domäne bleibt unverändert.
3. **Entfernen ist ein eigener Anwendungsfall:** `useShoppingList` legt das
   vorhandene `removeItem` im Typ `ShoppingList` offen.
   - Warum: Bestätigt ist „`<Name>` entfernen“ und nicht „eins weniger“. Hat das andere
     Gerät die Menge inzwischen erhöht, würde `takeOneLess` nur verringern.
   - Auswirkung: `takeOneLess` bleibt unverändert und behält sein Entfernen bei ≤ 1 als
     Absicherung. `ShoppingArea` ruft es aber nur noch bei einer Menge über 1 auf.
4. **Der Fokus überdauert den Seitenwechsel:** `ShoppingArea` merkt sich im
   Listenzustand ein Rückkehrziel (`ListFocus`) und reicht es an `ShoppingListPage`
   weiter. Die Liste setzt es beim Aufbau nach der Überschrift und überschreibt damit
   deren Fokus.
   - Warum: Mit VoiceOver geht es an derselben Stelle der Liste weiter, statt oben neu
     anzufangen.
   - Auswirkung: `useFocusAfterRemoval` bekommt eine beim Aufbau schon vorgemerkte
     Entfernung. `Stepper` reicht einen Ref auf den Weniger-Knopf durch.
5. **Ein verschwundener Artikel schließt die Abfrage:** Die Seite hält nur die
   `ItemId` fest und sucht den Artikel in der aktuellen Liste. Fehlt er, setzt
   `ShoppingArea` noch während des Renderns den Zustand auf die Liste mit Fokus auf der
   Überschrift, nach dem Muster von `SuppliesArea.tsx:59-60`.
   - Warum: Ein Zielknopf existiert dann nicht mehr. Ein liegengebliebener
     Entfernen-Zustand dürfte nicht später wieder aufspringen.
   - Auswirkung: Für diesen Fall gibt es keine Ansage.
6. **Nur die Einkaufsliste:** Die Vorräte verhalten sich gleich, bleiben aber außen vor.
   - Warum: Der Wunsch betrifft die Einkaufsliste. Ob es bei den Vorräten stört, zeigt
     sich im Alltag.
   - Auswirkung: TODO-Eintrag in `docs/notes.txt`.

## Ausgangslage

```
ShoppingItemRow  ──onLess──▶  ShoppingListPage.takeOneLess(item, position)
  (Stepper −)                   │  isLastUnit(item)? → rowRemovedAt(position)  (Fokus vormerken)
                                ▼
                         ShoppingArea: announce(takeOneLess(item))
                                ▼
                         useShoppingList.takeOneLess
                           withOneLess(item) === null ? removeItem(item)   ← löscht sofort
                                                      : changeQuantityTo(...)
```

- `isLastUnit` (`src/shopping/domain/shoppingItem.ts:135`) gilt bei Menge ≤ 1.
- `useFocusAfterRemoval` (`src/shared/ui/useFocusAfterRemoval.ts`) merkt sich eine
  Position. Nach dem nächsten Render fokussiert es die Checkbox, die nun dort steht,
  sonst die letzte, sonst die Überschrift. Benutzt wird es auch von den Listen der
  Vorräte, Gerichte und Verwaltungen. Diese Aufrufe bleiben unverändert.
- `ShoppingArea` kennt nur `addingItem: boolean` (`src/shopping/ui/ShoppingArea.tsx:31`).
  Beim Zurückkehren baut sich `ShoppingListPage` neu auf, und `useHeadingFocus`
  fokussiert die Überschrift.
- Tests zum heutigen sofortigen Entfernen: `src/shopping/ui/ShoppingArea.test.tsx:936-1047`
  und E2E `e2e/shoppingList.spec.ts:203` („removes an item with its last unit“).

## Zielbild

```
ShoppingItemRow ──onLess──▶ ShoppingListPage ──onLessItem(item)──▶ ShoppingArea.takeOneLessOrAsk
                                                                   │
                                     isLastUnit(item)? ────────────┤
                                       nein → announce(takeOneLess(item))   (wie bisher)
                                       ja   → page = { kind: 'remove', id }
                                                   │
                                                   ▼
                                              RemoveItemPage
                                   ┌───────────────┴────────────────┐
                              Entfernen                     Abbrechen / Zurück
                announce(removeItem(item))                         │
   page = { list, focus: followingRow(removedAt) }   page = { list, focus: lessButton(id) }

   Artikel nicht mehr in items, solange page.kind === 'remove'
     → page = { list, focus: heading }   (ohne Ansage)
```

### Oberfläche

Vorher (Druck auf „−“ bei Brot löscht sofort):

```
┌──────────────────────────────────────────────┐
│ Einkaufsliste, 2 offen                   [+] │
│ ☐ Brot                         [−]  1  [+]   │
│ ☐ Milch                        [−]  2  [+]   │
└──────────────────────────────────────────────┘
```

Nachher, nach dem Druck auf „−“ bei Brot:

```
┌──────────────────────────────────────────────┐
│ [Zurück zur Einkaufsliste]                   │
│                                              │
│ Brot entfernen?                ← Fokus (h1)  │
│ Der Artikel wird für beide Geräte von der    │
│ Einkaufsliste entfernt.                      │
│                                              │
│ [Entfernen]   [Abbrechen]                    │
└──────────────────────────────────────────────┘
```

Die Navigationsleiste wird auf der Bestätigungsseite nicht gezeigt, wie bei
`AddItemPage` und den Lösch-Seiten.

### VoiceOver-Ablauf

```
„Weniger, Brot, Taste“              → Doppeltipp
„Brot entfernen?, Überschrift 1“
  „Entfernen, Taste“                → Doppeltipp
  Ansage: „Brot entfernt, noch 1 offen.“   Fokus: „Milch, Kontrollkästchen“
oder
  „Abbrechen, Taste“                → Doppeltipp
  keine Ansage                             Fokus: „Weniger, Brot, Taste“
```

## Abstraktionen und Wiederverwendung

- Wiederverwendet: `isLastUnit`, `removeItem` und `itemRemovedAnnouncement` aus
  `useShoppingList`, `useHeadingFocus`, die Klasse `pageActions` und
  `useFocusAfterRemoval`.
- Neu: `RemoveItemPage`, der UI-Typ `ListFocus` und die Texte in
  `domain/announcements.ts`.

Dateien:

- `src/shared/ui`
  - `Stepper.tsx` – optionaler Prop `lessButton?: Ref<HTMLButtonElement>`, wird an den
    Weniger-Knopf gehängt.
  - `useFocusAfterRemoval.ts` – optionaler dritter Parameter
    `removedBeforeMount: number | null = null`, der `pendingFocus` vorbelegt. Der
    vorhandene Effekt fokussiert dann nach dem ersten Render die folgende Zeile.
- `src/shopping/domain`
  - `announcements.ts` – `removeItemHeading(item)` → `"Brot entfernen?"`.
- `src/shopping/ui`
  - `RemoveItemPage.tsx` – neu, Aufbau wie `DeleteKnownItemPage`.
  - `ShoppingListPage.tsx` – Prop `focus: ListFocus`. `takeOneLess(item, position)`
    und der Aufruf von `rowRemovedAt` entfallen, `onLess` ruft direkt `onLessItem(item)`.
    Die Refs der Weniger-Knöpfe kommen in eine Map je `ItemId`. Exportiert den Typ
    `ListFocus`.
  - `ShoppingItemRow.tsx` – Prop `lessButton: Ref<HTMLButtonElement>`, wird an
    `Stepper` weitergereicht.
  - `ShoppingArea.tsx` – `page`-Zustand, `takeOneLessOrAsk`, Entfernen, Abbrechen und
    der Randfall „verschwunden“.
  - `useShoppingList.ts` – `removeItem: (item: ShoppingItem) => string` in den Typ
    `ShoppingList` und in die Rückgabe.

Skizzen:

```ts
export type ListFocus =
  | { kind: 'heading' }
  | { kind: 'followingRow'; removedAt: number }
  | { kind: 'lessButton'; id: ItemId }

type ShoppingPage =
  | { kind: 'list'; focus: ListFocus }
  | { kind: 'add' }
  | { kind: 'remove'; id: ItemId }
```

```ts
// ShoppingListPage
const heading = useHeadingFocus()
const { keepRow } = useFocusAfterRemoval(
  itemIds,
  heading,
  focus.kind === 'followingRow' ? focus.removedAt : null,
)
const lessButtons = useRef(new Map<ItemId, HTMLButtonElement>())

useEffect(() => {
  if (focus.kind === 'lessButton') lessButtons.current.get(focus.id)?.focus()
}, [])
```

Dieser Effekt hat absichtlich ein leeres Abhängigkeitsfeld: Er gilt nur beim Aufbau
der Liste. Weil React Effekte in Aufrufreihenfolge ausführt, setzt `useHeadingFocus`
zuerst den Fokus auf die Überschrift, und das Rückkehrziel überschreibt ihn danach.
Meldet ESLint (`react-hooks/exhaustive-deps`) den Effekt, wird das Ziel beim Aufbau
in einem `useRef` festgehalten, statt die Regel abzuschalten.

```ts
// ShoppingArea
const itemToRemove =
  page.kind === 'remove' ? (items.find((item) => item.id === page.id) ?? null) : null
const itemToRemoveIsGone = page.kind === 'remove' && itemToRemove === null
if (itemToRemoveIsGone) setPage(listWithFocus({ kind: 'heading' }))

function takeOneLessOrAsk(item: ShoppingItem) {
  if (isLastUnit(item)) setPage({ kind: 'remove', id: item.id })
  else announce(takeOneLess(item))
}

function remove(item: ShoppingItem) {
  const removedAt = items.findIndex((shown) => shown.id === item.id)
  announce(removeItem(item))
  setPage(listWithFocus({ kind: 'followingRow', removedAt }))
}
```

`removedAt` wird beim Druck auf „Entfernen“ aus der aktuellen Liste ermittelt und
nicht beim Öffnen der Abfrage gespeichert. So stimmt die Position auch dann, wenn sich
die Liste dazwischen geändert hat.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine

Die Sicherheitsabfrage wird samt Entfernen, Abbrechen, Fokusführung und dem Randfall
„Artikel verschwunden“ gebaut. Die bestehenden Tests werden auf den Weg über die
Abfrage umgestellt. Die UI-Tests entstehen test-getrieben in `ShoppingArea.test.tsx`.

**Aufgaben**:

- [x] `src/shopping/domain/announcements.test.ts`: Test für `removeItemHeading`
      (`"Brot entfernen?"`) schreiben, rot sehen, dann `removeItemHeading` in
      `announcements.ts` ergänzen.
- [x] `src/shopping/ui/ShoppingArea.test.tsx`: Hilfsfunktionen `confirmRemoval()`
      (Klick auf „Entfernen“) und `cancelRemoval()` (Klick auf „Abbrechen“) ergänzen.
- [x] Neue Tests in `ShoppingArea.test.tsx` (zuerst rot):
  - [x] `asks before removing an item with its last unit`: „Weniger, Brot“ bei Menge 1
        zeigt die Überschrift „Brot entfernen?“ mit Fokus, den erklärenden Satz und den
        Knopf „Zurück zur Einkaufsliste“. `client.storedItems()` enthält Brot noch, und
        es gibt keine Ansage.
  - [x] `asks before removing an item without quantity` und
        `asks before removing an item with a fraction below one` (`0,5 l`).
  - [x] `takes one less without asking above one`: Milch mit 2 wird zu 1, ohne dass
        eine Abfrage erscheint.
  - [x] `keeps the item when the removal is cancelled`: Nach „Abbrechen“ ist Brot
        unverändert gespeichert, es gibt keine Ansage, und der Fokus liegt auf
        „Weniger, Brot“.
  - [x] `keeps the item when going back from the removal`: dasselbe über „Zurück zur
        Einkaufsliste“.
  - [x] `removes the whole item even if its quantity rose meanwhile`: Abfrage für Brot
        öffnen, dann kommt per `renderWithLaggingSnapshots` eine Momentaufnahme mit
        Brot, Menge 3. Nach „Entfernen“ ist Brot gelöscht.
  - [x] `returns to the list when the item to remove is gone`: Abfrage öffnen, dann
        kommt eine Momentaufnahme ohne Brot. Die Liste erscheint ohne Ansage, und der
        Fokus liegt auf der Überschrift.
  - [x] `has no accessibility violations on the removal page` (axe).
- [x] Bestehende Tests in `ShoppingArea.test.tsx:936-1047` umstellen: Nach jedem
      `takeOneLess`, das entfernt, folgt `confirmRemoval()`. Betroffen sind „removes an
      item when its last unit is taken“, „removes an item with a fraction below one“,
      „says that nothing is open any more“, die drei Fokustests („leaves the focus on
      …“), „does not count a removed item as a change to clean up“ und die beiden
      „keeps a removed item away …“. Die Erwartungen bleiben gleich, nur die drei
      Fokustests prüfen jetzt den Fokus nach der Rückkehr von der Abfrage.
- [x] `src/shared/ui/Stepper.tsx`: optionalen Prop `lessButton?: Ref<HTMLButtonElement>`
      an den Weniger-Knopf hängen.
- [x] `src/shared/ui/useFocusAfterRemoval.ts`: optionalen Parameter
      `removedBeforeMount: number | null = null` ergänzen und `pendingFocus` damit
      vorbelegen. Die übrigen Aufrufer bleiben unverändert.
- [x] `src/shopping/ui/useShoppingList.ts`: `removeItem` in den Typ `ShoppingList` und
      in das Rückgabeobjekt aufnehmen.
- [x] `src/shopping/ui/RemoveItemPage.tsx` neu anlegen:
      ```tsx
      <main className="page">
        <button type="button" onClick={onCancel}>Zurück zur Einkaufsliste</button>
        <h1 ref={heading} tabIndex={-1}>{removeItemHeading(item)}</h1>
        <p>Der Artikel wird für beide Geräte von der Einkaufsliste entfernt.</p>
        <div className="pageActions">
          <button type="button" onClick={onRemove}>Entfernen</button>
          <button type="button" onClick={onCancel}>Abbrechen</button>
        </div>
      </main>
      ```
- [x] `src/shopping/ui/ShoppingItemRow.tsx`: Prop `lessButton` ergänzen und an
      `Stepper` durchreichen.
- [x] `src/shopping/ui/ShoppingListPage.tsx`: Typ `ListFocus` exportieren und Prop
      `focus: ListFocus` ergänzen. `useFocusAfterRemoval` bekommt
      `removedBeforeMount`, die Map `lessButtons` kommt hinzu, ebenso der
      Aufbau-Effekt für `lessButton`. `takeOneLess(item, position)`, der Import von
      `isLastUnit` und `rowRemovedAt` entfallen, `onLess={() => onLessItem(item)}`.
- [x] `src/shopping/ui/ShoppingArea.tsx`: `addingItem` durch `page: ShoppingPage`
      ersetzen (Startwert `{ kind: 'list', focus: { kind: 'heading' } }`). Dazu kommen
      `takeOneLessOrAsk`, `remove`, `cancelRemoval` (→ `lessButton`) und der Randfall
      `itemToRemoveIsGone`. `AddItemPage.onBack` führt zurück zur Liste mit Fokus auf
      der Überschrift.
- [x] `e2e/shoppingList.spec.ts:203` („removes an item with its last unit“): nach
      `pressButton(page, 'Weniger, Brot')` die Überschrift „Brot entfernen?“ erwarten
      und `pressButton(page, 'Entfernen')` ergänzen. Die übrigen Erwartungen bleiben
      gleich.
- [x] `docs/architektur/05-bausteinsicht.md:116`: `RemoveItemPage` in den Knoten
      `shoppingArea` aufnehmen (`ShoppingListPage · AddItemPage · RemoveItemPage`).
- [x] `docs/notes.txt`: unten unter TODO anhängen:
      `- Vorraete: Sicherheitsabfrage, wenn "Weniger" den letzten Vorrat entfernt
      (wie MZP-038 auf der Einkaufsliste)`.

**Automatisierte Verifikation**:

- [x] Die neuen Tests in `ShoppingArea.test.tsx` und `announcements.test.ts` laufen grün.
- [x] Die umgestellten Tests in `ShoppingArea.test.tsx:936-1047` laufen grün.
- [x] Die Tests der übrigen Nutzer von `Stepper` und `useFocusAfterRemoval`
      (`SuppliesArea.test.tsx`, `WeekPlanArea.test.tsx`, Gerichte- und
      Verwaltungslisten) laufen unverändert grün.
- [x] `npm run test` läuft grün.
- [x] `npm run lint` läuft ohne Befund.
- [x] `npm run build` läuft durch (Typprüfung).
- [x] `npm run test:e2e` läuft grün, auch „removes an item with its last unit“.

**Manuelle Verifikation**:

- [ ] Auf dem iPhone mit VoiceOver: „Weniger“ bei einem Artikel mit Menge 1 öffnen.
      VoiceOver liest „Brot entfernen?, Überschrift“ vor.
- [ ] „Abbrechen“: VoiceOver steht wieder auf „Weniger, Brot“, und Brot ist unverändert.
- [ ] „Entfernen“: VoiceOver sagt „Brot entfernt, noch N offen.“ und steht auf dem
      nächsten Artikel. Auf dem zweiten Gerät verschwindet Brot.
- [ ] Bei einem Artikel mit Menge 2 verringert „Weniger“ ohne Abfrage.
- [ ] Die Bestätigungsseite ist auch bei invertierten Farben gut lesbar.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/agents/plans/2026-09-24-mengenpicker-auf-der-einkaufsliste.md` – Einführung von
  „Weniger“ und dem Entfernen bei Menge ≤ 1
- `src/shopping/ui/DeleteKnownItemPage.tsx`, `src/shopping/ui/KnownItemsArea.tsx` –
  Muster für Bestätigungsseite und `page`-Zustand
- `src/meals/ui/SuppliesArea.tsx:59-60` – Muster für das Zurücksetzen des Zustands
  während des Renderns
- `src/shared/ui/useFocusAfterRemoval.ts` – Fokusführung nach dem Entfernen
