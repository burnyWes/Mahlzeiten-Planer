---
date: 2026-09-16T11:42:40.055563+00:00
git_commit: 8457952f7cf12a0c7bbd20b7f5ea4334a010aa28
branch: main
story: MZP-003
topic: "Artikelvorschläge beim Tippen"
tags: [plan, shopping, meals, suggestions, accessibility, firestore]
status: ready
---

# PLAN: MZP-003 — Artikelvorschläge beim Tippen

Wer einen Artikel auf die Einkaufsliste setzt oder ein Einkaufs-Item in ein Gericht
schreibt, bekommt beim Tippen Namen vorgeschlagen, die der Haushalt schon kennt. Gleiche
Einträge müssen nicht mehr jedes Mal neu getippt werden, und Schreibweisen bleiben
einheitlich — was auch dem Zusammenführen gleichnamiger Artikel hilft.

Vorlage ist der Punkt *Beim Tippen von Items Vorschläge aus der Datenbank machen* aus
`docs/notes.txt`. Alle Entscheidungen stammen aus der Befragung vom 2026-09-16.

## Akzeptanzkriterien

- [x] Ab 2 getippten Zeichen erscheinen in "Artikel hinzufügen" und im Item-Feld des
      Gericht-Editors direkt unter dem Namensfeld höchstens 5 Vorschläge als Knöpfe in
      einer Liste mit dem Namen "Vorschläge".
- [x] Ein Name passt, wenn die Eingabe irgendwo in ihm steht; Gross-/Kleinschreibung und
      mehrfache Leerzeichen zählen nicht.
- [x] Reihenfolge: Treffer am Namensanfang vor Treffern in der Mitte, dann öfter
      benutzt, dann zuletzt benutzt, dann alphabetisch (`de-DE`).
- [x] Ein Vorschlag, der genau der Eingabe entspricht, erscheint nicht. Ohne Treffer
      gibt es keine Liste.
- [x] Ein Vorschlag übernimmt nur den Namen ins Feld und setzt den Fokus auf "Menge".
- [x] Beim Tippen wird nichts angesagt.
- [x] Vorgeschlagen werden alle Namen, die je auf die Einkaufsliste kamen, und die
      Item-Namen aller aktuell vorhandenen Gerichte.
- [x] Jedes Hinzufügen zur Einkaufsliste zählt den Namen um 1 hoch — auch beim
      Zusammenführen mit einem offenen Artikel und beim Übertragen eines Gerichts — und
      merkt sich die benutzte Schreibweise. Das gilt ohne Netz und über zwei Geräte.
- [x] Solange die Seite offen ist, ändern sich die Vorschläge nicht durch Abgleich von
      aussen.
- [x] Meldet der Server einen leeren Katalog, übernimmt die App einmalig die gesamte
      Historie aus `items`. Ohne Netz geschieht nichts.
- [x] Scheitert ein Schreibvorgang in den Katalog, gibt es keine Fehleransage; der
      Artikel steht trotzdem auf der Liste.
- [x] Firestore weist jeden Zugriff auf `knownItems` ab, der nicht vom Haushaltskonto
      kommt.
- [x] `meals` importiert weiterhin nichts aus `shopping`.

## Wesentliche Entscheidungen und Abwägungen

1. **Eigene Sammlung `knownItems`, ein Dokument je normalisiertem Namen.**
   `{ name, lastUsedAt, timesUsed }`.
   - Warum: `items` wird nie gelöscht und wächst unbegrenzt; die ganze Sammlung bei
     jeder Verbindung zu lesen kostet Lesevorgänge und Offline-Cache. Der Katalog wächst
     nur mit der Zahl verschiedener Namen und liefert die Sortiergrössen gleich mit.
   - Auswirkung: neue Sicherheitsregel samt Regeltest, Schreiben mit
     `setDoc(…, { merge: true })` und `increment(1)`, einmalige Übernahme der Historie
     durch die App.

2. **Der Katalog gehört zu `shopping`.**
   - Warum: "Artikel, den der Haushalt kauft" ist der Kernbegriff von `shopping`. Ein
     eigener Kontext wäre vorsorglich, `shared` ist für fachliche Begriffe tabu.
   - Auswirkung: `SignedInApp` baut eine Funktion `suggestNames(typed)` und reicht sie
     an beide Bereiche. `meals` kennt nur diese Funktion. Die Darstellung
     `NameSuggestions` liegt fachfrei in `shared/ui`.

3. **Gericht-Items werden beim Vorschlagen dazugemischt, nicht gespeichert.**
   - Warum: Für den Haushalt dasselbe Verhalten, aber kein zusätzlicher Schreibvorgang
     beim Speichern eines Gerichts, eine Übernahme nur aus `items`, und Items gelöschter
     oder korrigierter Gerichte verschwinden von selbst.
   - Auswirkung: Gericht-Namen zählen mit `timesUsed = 0`; steht ein Name in beiden
     Quellen, gilt der Katalogeintrag.

4. **Echte Knöpfe in einer `<ul aria-label="Vorschläge">` statt `datalist` oder
   Combobox.**
   - Warum: iOS-VoiceOver unterstützt `aria-activedescendant` schlecht (derselbe Grund,
     aus dem MZP-002 kein Tab-Muster nutzt); bei `datalist` bestimmt Safari Treffer und
     Reihenfolge, und die Vorschläge in der Tastaturleiste sind unter VoiceOver schwer
     erreichbar.
   - Auswirkung: Wischreihenfolge Name → Vorschläge → Menge. VoiceOver sagt beim
     Eintritt "Vorschläge, Liste, n Objekte" — das ersetzt eine Live-Ansage.

5. **Keine Ansage beim Tippen.**
   - Warum: Entscheidung des Nutzers; VoiceOver spricht beim Tippen bereits jedes
     Zeichen.
   - Auswirkung: `useAnnouncer` bleibt unberührt.

6. **Ein Vorschlag übernimmt nur den Namen, Fokus auf "Menge".**
   - Warum: vorhersehbar, an beiden Stellen gleich, keine unbemerkt vorbelegte Menge.
   - Auswirkung: Der Katalog speichert keine Mengen.

7. **Vorschläge werden beim Öffnen der Seite eingefroren.**
   - Warum: Listen dürfen sich unter VoiceOver nicht durch fremden Abgleich verändern.
   - Auswirkung: Die Seite hält die `suggestNames`-Funktion fest, die sie beim ersten
     Rendern bekommen hat. Artikel, die auf derselben Seite gerade hinzugefügt wurden,
     werden dort erst nach erneutem Öffnen vorgeschlagen.

8. **Übernahme der Historie nur bei vom Server bestätigtem leeren Katalog.**
   - Warum: Ein frisch installiertes Gerät ohne Netz hat einen leeren Cache und würde
     sonst fälschlich übernehmen.
   - Auswirkung: `getDocsFromServer` für die Prüfung und das Lesen der Historie;
     schlägt es fehl, geschieht nichts, der nächste Start versucht es erneut. Die Werte
     leiten sich vollständig aus `items` ab, zwei gleichzeitig übernehmende Geräte
     schreiben also dasselbe.
   - Hingenommen: Wird in den Sekunden zwischen Lesen der Historie und Schreiben der
     Übernahme ein Artikel hinzugefügt, der noch nicht beim Server war, überschreibt die
     Übernahme dessen Zählung um 1 zu niedrig. Das betrifft nur den allerersten Start
     und nur die Sortierung.
   - Auf dem ersten Start sieht "Artikel hinzufügen" die übernommene Historie erst nach
     erneutem Öffnen, weil die Vorschläge beim Öffnen eingefroren werden.

9. **Katalogfehler bleiben still.**
   - Warum: Die Ansage "Konnte nicht gespeichert werden." liesse glauben, der Artikel
     fehle auf der Liste.
   - Auswirkung: Der Firestore-Katalog-Client verschluckt Fehler. Die Regel muss vor der
     Prüfung auf dem Gerät von Hand ausgerollt werden; das Rollout-TODO in
     `docs/notes.txt` bleibt offen.

10. **Tippfehler bleiben vorerst im Katalog.**
    - Auswirkung: neuer TODO-Eintrag "Vorschläge verwalten" in `docs/notes.txt`.

## Ausgangslage

Artikelnamen werden an zwei Stellen getippt:

```
Einkaufsliste ─ [+] ─► AddItemPage             Gericht bearbeiten ─► MealItemsEditor
                       ┌──────────────────────┐                      ┌──────────────────────┐
                       │ Name     [_________] │                      │ Item     [_________] │
                       │ Menge [__] Einheit[▾]│                      │ Menge [__] Einheit[▾]│
                       │ [Hinzufügen]         │                      │ [Item hinzufügen]    │
                       └──────────────────────┘                      └──────────────────────┘
                       src/shopping/ui/AddItemPage.tsx:62            src/meals/ui/MealItemsEditor.tsx:90
```

- Einziges Vorschlagsmuster ist die `datalist` mit den festen `UNITS` im Einheitenfeld
  (`AddItemPage.tsx:82`, `MealItemsEditor.tsx:114`).
- `items` wird nie gelöscht; der Client beobachtet aber nur offene und in dieser Sitzung
  abgehakte Artikel (`firestoreShoppingListClient.ts:103-110`).
- `normalizeItemName` vereinheitlicht Namen für den Abgleich (`shoppingItem.ts:57-59`).
- Alles, was auf die Liste kommt, läuft durch `carryOutAll` in `useShoppingList`
  (`useShoppingList.ts:91-104`) — einzeln über `addItem`, als Gericht über `addItems`.
- `SignedInApp` ist die einzige Stelle, an der `shopping` und `meals` zusammenkommen
  (`SignedInApp.tsx:47-58`); ESLint verbietet Importe zwischen den Kontexten
  (`eslint.config.js:17-40`).
- Clients entstehen in `main.tsx` und werden als Fabriken über `App` an `SignedInApp`
  gereicht (`App.tsx:17-21`).

```
Firestore
├── items/{id}   { name, quantity, createdAt, checkedOffAt }
└── meals/{id}   { name, items: [{ name, quantity }], ingredientNotes, recipe }
```

## Zielbild

```
Firestore
├── items/{id}
├── meals/{id}
└── knownItems/{knownItemId}   { name, lastUsedAt, timesUsed }     ← neu

main.tsx ── createKnownItemsClient ──► App ──► SignedInApp
                                                 │ useKnownItems(knownItemsClient)
                                                 │   beobachtet knownItems,
                                                 │   stösst einmal die Übernahme an
                                                 │ useShoppingList(client, knownItemsClient)
                                                 │   carryOutAll → recordUse je Artikel
                                                 │ suggestNames = typed =>
                                                 │   suggestNames(withNamesInUse(known, mealItemNames), typed)
                                                 ├──► ShoppingArea ──► AddItemPage ──► NameSuggestions
                                                 └──► MealsArea ──► MealFormPage ──► MealItemsEditor ──► NameSuggestions
```

Oberfläche "Artikel hinzufügen", vorher und nachher:

```
Vorher                                   Nachher (Eingabe "mil")
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│ [Zurück zur Liste]              │      │ [Zurück zur Liste]              │
│ Artikel hinzufügen              │      │ Artikel hinzufügen              │
│ Name    [mil______________]     │      │ Name    [mil______________]     │
│                                 │      │ ┌ Vorschläge ─────────────────┐ │
│                                 │      │ │ [Milch]                     │ │
│                                 │      │ │ [Milchreis]                 │ │
│                                 │      │ │ [Hafermilch]                │ │
│                                 │      │ └─────────────────────────────┘ │
│ Menge [__]  Einheit [______]    │      │ Menge [__]  Einheit [______]    │
│ [Hinzufügen]                    │      │ [Hinzufügen]                    │
└─────────────────────────────────┘      └─────────────────────────────────┘

Tipp auf [Milch]:
│ Name    [Milch____________]     │   ← Liste verschwindet (genauer Treffer ausgeblendet)
│ Menge [|_]  Einheit [______]    │   ← Fokus, VoiceOver: "Menge, Textfeld"
```

Der Gericht-Editor bekommt dieselbe Liste unter "Item", der Fokus springt auf dessen
"Menge".

## Abstraktionen und Wiederverwendung

Wiederverwendet: `normalizeItemName` (Treffer, Dokument-ID, Übernahme),
`toShoppingItem` aus dem Firestore-Einkaufslisten-Client (für die gelesene Historie),
das Fabrik-Muster aus `main.tsx`/`App`, das Muster der Übersetzung in `SignedInApp`,
`collectionOf` im Regeltest, `storeItemOnServer` im E2E-Test.

- `src/shopping/domain`
  - `knownItem.ts` - neu
    - `KnownItem` - `{ name, lastUsedAt, timesUsed }`
    - `knownItemIdOf(name)` - Firestore-taugliche ID aus dem normalisierten Namen
    - `recordUse(knownItems, name, usedAt)` - reine Fortschreibung, für den In-Memory-Client
    - `knownItemsFromHistory(items)` - Zählung, jüngstes `createdAt`, jüngste Schreibweise
    - `withNamesInUse(knownItems, names)` - Gericht-Namen dazumischen (Phase 2)
    - `suggestNames(knownItems, typed)` - Treffer- und Sortierregel, höchstens 5
  - `knownItem.test.ts` - neu
- `src/shopping/api`
  - `knownItemsClient.ts` - neu, Port
  - `firestoreKnownItemsClient.ts` - neu, stiller Adapter
  - `inMemoryKnownItemsClient.ts` - neu, Fake für Tests
  - `firestoreShoppingListClient.ts` - `toShoppingItem` exportieren
- `src/shopping/ui`
  - `useKnownItems.ts` - neu, beobachtet und stösst die Übernahme an
  - `useShoppingList.ts` - zweiter Parameter `knownItemsClient`, `recordUse` in `carryOutAll`
  - `ShoppingArea.tsx` - reicht `suggestNames` an `AddItemPage`
  - `AddItemPage.tsx` - `NameSuggestions` unter dem Namensfeld, Fokus auf "Menge"
  - `ShoppingArea.test.tsx` - Vorschläge und Zählung
- `src/shared/ui`
  - `NameSuggestions.tsx` - neu, Liste von Strings als Knöpfe
- `src/meals/ui` (Phase 2)
  - `MealsArea.tsx`, `MealFormPage.tsx` - reichen `suggestNames` durch
  - `MealItemsEditor.tsx` - `NameSuggestions` unter "Item", Fokus auf "Menge"
  - `MealsArea.test.tsx` - Vorschläge im Editor
- `src/SignedInApp.tsx`, `src/App.tsx`, `src/main.tsx` - Katalog-Client verdrahten
- `firestore.rules`, `firestore.rules.test.ts` - Regel `knownItems`
- `e2e/shoppingList.spec.ts` - Vorschlag aus der übernommenen Historie
- `docs/notes.txt` - TODO "Vorschläge verwalten"

## Logging und Beobachtbarkeit

Keine Änderung. Katalogfehler werden bewusst weder angesagt noch protokolliert.

## Umsetzung

### Phase 1: Vorschläge in "Artikel hinzufügen"

Abhängigkeiten: keine

Der Katalog entsteht, wird bei jedem Hinzufügen fortgeschrieben, übernimmt einmalig die
Historie und liefert Vorschläge auf der Seite "Artikel hinzufügen".

**Aufgaben**:

- [x] `src/shopping/domain/knownItem.test.ts` test-getrieben zuerst, mindestens:
  - findet einen Namen, der die Eingabe in der Mitte enthält ("milch" → "Hafermilch")
  - ignoriert Gross-/Kleinschreibung und mehrfache Leerzeichen
  - schlägt unter 2 Zeichen nichts vor
  - stellt Treffer am Namensanfang vor Treffer in der Mitte, auch wenn Letztere öfter
    benutzt wurden
  - sortiert innerhalb einer Gruppe nach `timesUsed`, dann `lastUsedAt`, dann `de-DE`
  - blendet den genauen Treffer aus ("Milch " zu "milch")
  - liefert höchstens 5 Namen
  - `recordUse` legt einen neuen Namen mit `timesUsed = 1` an, zählt einen bekannten
    hoch, übernimmt die neue Schreibweise und das neue `lastUsedAt`
  - `knownItemsFromHistory` zählt abgehakte und offene Artikel gleich, fasst
    normalisiert gleiche Namen zusammen, nimmt jüngstes `createdAt` und dessen
    Schreibweise
  - `knownItemIdOf` ergibt für "Milch" und " milch " dieselbe ID und enthält weder `/`
    noch ist sie `.` oder `..`, noch hat sie die Form `__…__`
- [x] `src/shopping/domain/knownItem.ts` umsetzen.
  ```ts
  export type KnownItem = { name: string; lastUsedAt: number; timesUsed: number }

  const MINIMUM_TYPED_LENGTH = 2
  const MAXIMUM_SUGGESTIONS = 5

  export function knownItemIdOf(name: string): string {
    return encodeURIComponent(normalizeItemName(name)).replace(
      /[._]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    )
  }

  export function suggestNames(
    knownItems: readonly KnownItem[],
    typed: string,
  ): readonly string[]
  ```
  Firestore-Vorgaben für Dokument-IDs: kein `/`, nicht `.` oder `..`, nicht `__.*__`
  (siehe Verweise).
- [x] `src/shopping/api/knownItemsClient.ts` — Port:
  ```ts
  export interface KnownItemsClient {
    observeKnownItems(
      onKnownItems: (knownItems: readonly KnownItem[]) => void,
    ): () => void
    recordUse(name: string, usedAt: number): void
    takeOverHistoryIfEmpty(): void
  }
  ```
- [x] `src/shopping/api/inMemoryKnownItemsClient.ts` — Fake mit
  `createInMemoryKnownItemsClient(initialKnownItems = [], history = [])`,
  `recordUse` über die Domänenfunktion, `takeOverHistoryIfEmpty` übernimmt `history`
  nur bei leerem Katalog, zusätzlich `storedKnownItems()` und
  `knownItemsArriveFromElsewhere(knownItems)` für Tests.
- [x] `src/shopping/api/firestoreShoppingListClient.ts` — `toShoppingItem` exportieren.
- [x] `src/shopping/api/firestoreKnownItemsClient.ts` — Adapter
  `createFirestoreKnownItemsClient(firestore)`:
  - `observeKnownItems`: `onSnapshot` auf `knownItems`, Felder defensiv lesen wie in
    `toShoppingItem`.
  - `recordUse`: `setDoc(doc(firestore, 'knownItems', knownItemIdOf(name)),
    { name, lastUsedAt: usedAt, timesUsed: increment(1) }, { merge: true })`, Fehler
    mit `.catch(() => {})` verschlucken.
  - `takeOverHistoryIfEmpty`: `getDocsFromServer(query(knownItems, limit(1)))`; nur wenn
    leer `getDocsFromServer(collection(firestore, 'items'))`, über `toShoppingItem` und
    `knownItemsFromHistory` rechnen und mit `writeBatch` in Blöcken von höchstens 500
    schreiben (`set` ohne `merge`). Jeder Fehler in der Kette wird verschluckt.
- [x] `firestore.rules` — `match /knownItems/{knownItemId} { allow read, write: if
  isHousehold(); }`.
- [x] `firestore.rules.test.ts` — `knownItemsOf = collectionOf('knownItems')` mit den
  vier Fällen wie bei den Gerichten (Haushalt schreibt, Haushalt liest, anderes Konto
  abgewiesen, Unangemeldete abgewiesen).
- [x] `src/shopping/ui/useKnownItems.ts` — beobachtet den Katalog und ruft einmal je
  Client `takeOverHistoryIfEmpty()` auf; liefert `readonly KnownItem[]`.
- [x] `src/shopping/ui/useShoppingList.ts` — Signatur
  `useShoppingList(client, knownItemsClient)`; in `carryOutAll` je Ergebnis
  `knownItemsClient.recordUse(outcome.item.name, outcome.item.createdAt)`.
- [x] `src/shared/ui/NameSuggestions.tsx` — reine Darstellung:
  ```tsx
  type NameSuggestionsProps = {
    names: readonly string[]
    onChoose: (name: string) => void
  }
  ```
  Rendert nichts bei leerer Liste, sonst `<ul aria-label="Vorschläge"
  className="suggestionList">` mit je `<li><button type="button">{name}</button></li>`.
- [x] `src/index.css` — `.suggestionList` im Stil der vorhandenen Listen (keine
  Aufzählungszeichen, Knöpfe untereinander, gleiche Mindesthöhe wie die übrigen Knöpfe).
- [x] `src/shopping/ui/AddItemPage.tsx` — neue Prop `suggestNames: (typed: string) =>
  readonly string[]`, beim ersten Rendern festhalten
  (`const [suggestNamesOnOpen] = useState(() => suggestNames)`), `NameSuggestions`
  zwischen Namensfeld und Mengenfeldern, `amountField`-Ref; `onChoose` setzt den Namen
  und fokussiert "Menge".
- [x] `src/shopping/ui/ShoppingArea.tsx` — Prop `suggestNames` an `AddItemPage` reichen.
- [x] `src/SignedInApp.tsx` — Prop `createKnownItemsClient: () => KnownItemsClient`,
  Client einmal per `useState`, `useKnownItems`, an `useShoppingList` übergeben,
  `suggestNames = (typed) => suggestNames(knownItems, typed)` an `ShoppingArea`.
- [x] `src/App.tsx` — Prop `createKnownItemsClient` durchreichen.
- [x] `src/main.tsx` — `createKnownItemsClient={() =>
  createFirestoreKnownItemsClient(firestore)}`.
- [x] Bestehende Testaufbauten anpassen: `SignedInApp.test.tsx` und `App.test.tsx`
  mit `createInMemoryKnownItemsClient`; `ShoppingAreaUnderTest` in
  `ShoppingArea.test.tsx` verdrahtet `useKnownItems`, `useShoppingList(client,
  knownItemsClient)` und `suggestNames` genauso wie `SignedInApp` und gibt den
  Katalog-Fake aus `renderShoppingArea` zurück.
- [x] `src/shopping/ui/ShoppingArea.test.tsx` — neue Fälle:
  - zeigt nach "mil" die passenden Vorschläge in der Liste "Vorschläge" in der
    festgelegten Reihenfolge
  - zeigt unter 2 Zeichen und ohne Treffer keine Liste
  - übernimmt einen Vorschlag ins Namensfeld und fokussiert "Menge"
  - zählt einen hinzugefügten Artikel im Katalog, auch wenn er mit einem offenen
    zusammengeführt wird
  - ändert die Vorschläge nicht, wenn während der offenen Seite ein Katalogeintrag von
    aussen eintrifft
  - kündigt beim Tippen nichts an
  - keine Barrierefreiheitsverstösse mit sichtbaren Vorschlägen
- [x] `src/SignedInApp.test.tsx` — neue Fälle:
  - zählt jedes Item eines übertragenen Gerichts im Katalog
  - übernimmt die Historie bei leerem Katalog und schlägt sie danach vor
- [x] `e2e/shoppingList.spec.ts` — zwei Tests, die zugleich den Integrationstest des
  Firestore-Katalog-Adapters bilden. Weil die Seite die Vorschläge beim Öffnen
  einfriert, die Übernahme aber asynchron nach der Anmeldung läuft, wird das Öffnen,
  Tippen und Prüfen in `await expect(async () => { … }).toPass()` wiederholt (jeweils
  mit "Zurück zur Liste" am Ende eines Fehlversuchs):
  - *suggests an item from the history taken over at start*:
    `storeItemOnServer('Hafermilch', 1)`, anmelden, "milch" tippen, Knopf "Hafermilch"
    in der Liste "Vorschläge", Enter darauf, Namensfeld enthält "Hafermilch", "Menge"
    hat den Fokus.
  - *suggests an item that was added before*: "Brot" hinzufügen, zurück, erneut
    öffnen, "br" tippen, Knopf "Brot" erscheint.
- [x] `docs/notes.txt` — unter TODO anhängen:
  `- Vorschläge verwalten: Tippfehler aus dem Artikelkatalog (knownItems) löschen können,
  z. B. unter Einstellungen.`

**Automatisierte Verifikation**:

- [x] `npm run test` grün, darunter `knownItem.test.ts`, die neuen Fälle in
      `ShoppingArea.test.tsx` und `SignedInApp.test.tsx`
- [x] `npm run test:rules` grün mit den vier `knownItems`-Fällen
- [x] `npm run test:e2e` grün mit dem neuen Vorschlagsfall
- [x] `npm run lint` ohne Befund
- [x] `npm run build` erfolgreich

**Manuelle Verifikation**:

- [x] Vor dem Test: `npx firebase deploy --only firestore:rules --project
      mahlzeiten-planer-ecd26` ausgeführt.
- [x] Auf dem iPhone mit VoiceOver: "Artikel hinzufügen" öffnen, zwei Zeichen eines
      bekannten Artikels tippen, nach rechts wischen — VoiceOver erreicht die Liste
      "Vorschläge" direkt nach dem Namensfeld und sagt die Anzahl.
- [x] Doppeltipp auf einen Vorschlag: Name steht im Feld, Fokus liegt auf "Menge".
- [x] Ein alter, längst abgehakter Artikel wird vorgeschlagen (Übernahme hat gegriffen).
- [x] Nach dem Hinzufügen eines neuen Artikels und erneutem Öffnen der Seite wird er
      vorgeschlagen; auf dem zweiten Gerät ebenso.
- [x] Im Flugmodus hinzufügen: keine Fehleransage, der Artikel steht auf der Liste.

### Phase 2: Vorschläge im Gericht-Editor

Abhängigkeiten: Phase 1

Die Item-Namen der Gerichte fliessen in die Vorschläge, und der Gericht-Editor zeigt sie
unter dem Feld "Item".

**Aufgaben**:

- [x] `src/shopping/domain/knownItem.test.ts` — test-getrieben:
  - `withNamesInUse` ergänzt unbekannte Namen mit `timesUsed = 0` und `lastUsedAt = 0`
  - lässt einen normalisiert schon bekannten Namen unverändert (Katalog gewinnt)
  - nimmt einen Namen, der in mehreren Gerichten steht, nur einmal auf
- [x] `src/shopping/domain/knownItem.ts` — `withNamesInUse(knownItems, names:
  readonly string[]): readonly KnownItem[]`.
- [x] `src/SignedInApp.tsx` — `mealItemNames = meals.meals.flatMap((meal) =>
  meal.items.map((item) => item.name))`; `suggestNames` rechnet über
  `withNamesInUse(knownItems, mealItemNames)` und geht an `ShoppingArea` und
  `MealsArea`.
- [x] `src/meals/ui/MealsArea.tsx` — Prop `suggestNames` an `MealFormPage`.
- [x] `src/meals/ui/MealFormPage.tsx` — Prop `suggestNames`, beim ersten Rendern
  festhalten, an `MealItemsEditor`.
- [x] `src/meals/ui/MealItemsEditor.tsx` — Prop `suggestNames`, `NameSuggestions`
  zwischen "Item" und den Mengenfeldern, `amountField`-Ref, `onChoose` setzt den Namen
  und fokussiert "Menge".
- [x] `src/meals/ui/MealsArea.test.tsx` — Testaufbau um `suggestNames` ergänzen; neue
  Fälle:
  - zeigt unter "Item" die gereichten Vorschläge
  - übernimmt einen Vorschlag ins Feld "Item" und fokussiert "Menge"
  - keine Barrierefreiheitsverstösse im Formular mit sichtbaren Vorschlägen
- [x] `src/SignedInApp.test.tsx` — neue Fälle:
  - schlägt in "Artikel hinzufügen" ein Item eines Gerichts vor, das nie gekauft wurde
  - schlägt im Gericht-Editor einen gekauften Artikel vor

**Automatisierte Verifikation**:

- [x] `npm run test` grün, darunter die neuen Fälle in `knownItem.test.ts`,
      `MealsArea.test.tsx` und `SignedInApp.test.tsx`
- [x] `npm run lint` ohne Befund — insbesondere kein Import aus `shopping` in `meals`
- [x] `npm run build` erfolgreich

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: Gericht anlegen, im Feld "Item" zwei Zeichen tippen,
      nach rechts wischen — die Liste "Vorschläge" folgt direkt; Doppeltipp übernimmt
      den Namen, Fokus liegt auf "Menge".
- [x] Ein Item eines Gerichts, das noch nie eingekauft wurde, wird in "Artikel
      hinzufügen" vorgeschlagen.

## Notizen zur Umsetzung

## Verweise

- Vorlage: `docs/notes.txt`, TODO "Beim Tippen von Items Vorschläge aus der Datenbank
  machen"
- Vorgänger: `docs/agents/plans/2026-09-15-gerichteseite-und-navigationsleiste.md`
  (Navigationsmuster und Übersetzung in `SignedInApp`)
- Firestore-Dokument-IDs, Einschränkungen:
  https://firebase.google.com/docs/firestore/best-practices#document_ids
- Firestore `increment`:
  https://firebase.google.com/docs/firestore/manage-data/add-data#increment_a_numeric_value
- Firestore Batched Writes (höchstens 500 Operationen):
  https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes
- `getDocsFromServer`:
  https://firebase.google.com/docs/reference/js/firestore_.md#getdocsfromserver
- Memory: VoiceOver ist der primäre Bedienweg; Push erlaubt, Commit vorher erfragen.
