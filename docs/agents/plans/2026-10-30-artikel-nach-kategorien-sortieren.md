---
date: 2026-10-30T08:11:35.748070+00:00
git_commit: f5cfb342abf39f42c9c0519eddf4f6ffa193da16
branch: main
story: MZP-046
topic: "Artikel nach Reihenfolge im Laden sortieren"
tags: [plan, shopping, meals, settings, firestore, ui, voiceover]
status: ready
---

# PLAN: MZP-046 — Artikel nach Reihenfolge im Laden sortieren

Die Einkaufsliste soll sich nach dem Weg durch den Laden ordnen. Dafür gibt es in den
Einstellungen eine neue Seite "Artikelkategorien" (zwischen "Artikel" und "Einheiten").
Dort legt der Haushalt Kategorien wie "Obst/Gemüse" oder "Tiefkühlkost" an und bringt sie
in eine frei wählbare Reihenfolge. Jeder Artikel im Katalog bekommt höchstens eine
Kategorie. Die Einkaufsliste gruppiert ihre Artikel dann unter Zwischenüberschriften in
dieser Reihenfolge. Innerhalb einer Gruppe steht der neueste Artikel unten, Artikel ohne
Kategorie stehen ganz unten. Die Sortierung lässt sich abschalten. Wird ein Artikel
hinzugefügt, den der Katalog noch nicht kennt, fragt ein Dialog nach seiner Kategorie.

Außerdem bekommen die Verwaltungsseiten Artikel, Artikelkategorien, Einheiten und
Gerichtskategorien ein "+" oben rechts zum Anlegen. Gerichtskategorien bekommen dafür
einen eigenen Katalog, damit eine leere Kategorie bestehen bleibt.

Alle Entscheidungen stammen aus der Befragung vom 2026-10-30.

## Akzeptanzkriterien

### Artikelkategorien verwalten

- Die Einstellungen zeigen in dieser Reihenfolge: "Farben invertieren", "Regeln",
  "Artikel", **"Artikelkategorien"**, "Einheiten", "Gerichtskategorien".
- Die Seite "Artikelkategorien" zeigt den Knopf "Zurück zu den Einstellungen", darunter
  einen `pageHeader` mit `h1` "Artikelkategorien, N" (bei null "Artikelkategorien,
  keine") und rechts den Knopf "+" mit `aria-label` "Artikelkategorie anlegen".
- Darunter steht der Schalter "Nach Kategorien sortieren" (`role="switch"`). Er gilt für
  den ganzen Haushalt, ist ohne gespeicherten Wert **an** und bleibt nach einem Neuladen
  erhalten.
- Darunter stehen die Kategorien in ihrer Reihenfolge. Jede Zeile hat einen Namensknopf
  "1. Obst/Gemüse, 12 Artikel" (bei einem "1 Artikel") und einen Mülleimer "Löschen,
  Obst/Gemüse". Ohne Kategorien steht dort "Noch keine Kategorien.".
- "+" öffnet `h1` "Kategorie anlegen" mit dem Feld "Name" (Fokus, leer) und dem Spinner
  "Position" (vorbelegt mit dem Platz am Ende, Bereich 1 bis Anzahl + 1, `valueText`
  "5 von 5"). "Speichern" steht in der unteren Knopfleiste. Nach dem Speichern zeigt die
  Seite die Liste, die Ansage lautet "Drogerie angelegt, Position 5 von 5.".
- Ein Tipp auf den Namensknopf öffnet `h1` "Kategorie bearbeiten" mit Name und Position
  (Bereich 1 bis Anzahl). Nach dem Speichern lautet die Ansage "Backwaren gespeichert,
  Position 2 von 4.". Die übrigen Kategorien rücken entsprechend nach.
- Ist der Name schon vergeben (normalisiert verglichen wie Artikelnamen), steht in der
  Fehlerzeile "Die Kategorie Tiefkühlkost gibt es schon.", und die Meldung wird angesagt.
  Es wird nichts zusammengeführt. Ein leerer Name ergibt "Bitte einen Namen eingeben.",
  einer mit mehr als 100 Zeichen "Der Name ist zu lang.".
- Der Mülleimer öffnet `h1` "Tiefkühlkost löschen?" mit dem Text "7 Artikel haben dann
  keine Kategorie mehr." (bei einem: "1 Artikel hat dann keine Kategorie mehr.", bei
  null: "Kein Artikel ist dieser Kategorie zugeordnet.") und den Knöpfen "Löschen" und
  "Abbrechen". Nach dem Löschen lautet die Ansage "Tiefkühlkost gelöscht, noch 3
  Kategorien." (bzw. "noch 1 Kategorie.", "keine Kategorien mehr."). Die Artikel dieser
  Kategorie gelten danach als "Ohne Kategorie".
- Verschwindet die geöffnete Kategorie, weil das andere Gerät sie gelöscht hat, zeigt die
  Seite wieder die Liste.

### Kategorie am Artikel

- Die Artikel-Verwaltung bekommt einen `pageHeader` mit "+" (`aria-label` "Artikel
  anlegen"). Jede Zeile zeigt "Äpfel, Obst/Gemüse", bei Artikeln ohne Kategorie nur den
  Namen. Die Liste bleibt alphabetisch.
- Der Artikel-Dialog heißt "Artikel bearbeiten" (bisher "Vorschlag bearbeiten") bzw.
  "Artikel anlegen". Unter "Name" steht das Feld "Kategorie" (vorbelegt mit der
  aktuellen Kategorie), darunter die Knopfliste "Kategorie-Vorschläge". Sie zeigt ab dem
  ersten Zeichen bis zu 5 Kategorien, die das Getippte enthalten, aber nicht genau ihm
  entsprechen. Erst kommen die, die mit dem Getippten beginnen, dann gilt die
  Kategorie-Reihenfolge.
- Beim Speichern gilt für das Feld Kategorie:
  - leer heißt "Ohne Kategorie"
  - entspricht es normalisiert einer vorhandenen Kategorie, wird diese zugeordnet
    ("obst/gemüse" → "Obst/Gemüse")
  - sonst wird die Kategorie am Ende der Reihenfolge angelegt und zugeordnet, die
    Ansage lautet dann "Äpfel gespeichert. Kategorie Drogerie neu angelegt, Position 5."
- Wird ein Artikel auf den Namen eines anderen umbenannt (Zusammenführen wie bisher),
  trägt der übrig bleibende Eintrag die Kategorie aus dem Dialog.
- "Artikel anlegen" legt einen Katalogeintrag mit `timesUsed: 0` und `lastUsedAt` =
  jetzt an. Ein vorhandener Name ergibt "Den Artikel Äpfel gibt es schon.". Die Ansage
  lautet "Äpfel angelegt.".

### Gruppierte Einkaufsliste

- Ist die Sortierung an, stehen die Artikel der Liste in Gruppen. Jede Gruppe hat eine
  `h2` mit dem Kategorienamen und eine eigene `ul.itemList`. Die Gruppen stehen in der
  Kategorie-Reihenfolge, innerhalb einer Gruppe nach `createdAt` (der neueste unten).
- Die Kategorie eines Einkaufsartikels ist die seines Katalogeintrags (Namensvergleich
  normalisiert). Ohne Katalogeintrag, ohne Kategorie oder mit gelöschter Kategorie
  landet er in der Gruppe "Ohne Kategorie" ganz unten. Sie hat die `h2` "Ohne
  Kategorie", außer sie ist die einzige Gruppe. Dann gibt es gar keine Überschrift.
- Gruppen ohne Artikel werden nicht gezeigt. Eine Gruppe, deren Artikel alle abgehakt
  sind, bleibt bis zum Aufräumen stehen.
- Ein auf diesem Gerät hinzugefügter Artikel erscheint sofort am Ende seiner Gruppe.
  Gibt es seine Gruppe noch nicht, entsteht sie an ihrem Platz in der Reihenfolge.
- Ändert sich die Kategorie eines Artikels auf der Liste oder die Reihenfolge der
  Kategorien, bleibt die Anzeige, wie sie ist. Jeder betroffene offene Artikel zählt
  im Knopf "Aufräumen (n)" mit, bis aufgeräumt wird. Artikel vom anderen Gerät
  erscheinen wie bisher erst nach dem Aufräumen.
- Das Umlegen des Schalters wirkt sofort: Die angezeigten Artikel (auch abgehakte)
  werden neu geordnet bzw. die Überschriften verschwinden. Welche Artikel angezeigt
  werden, ändert sich dadurch nicht.
- Ist die Sortierung aus, sieht die Liste genau aus wie heute.

### Kategorie-Dialog beim Hinzufügen

- Ein Druck auf "Hinzufügen" in "Artikel hinzufügen" mit einem gültigen Namen, der nicht
  im Artikelkatalog steht, schreibt noch nichts. Stattdessen erscheint `h1` "Kategorie
  für Bananen" mit dem Text "Bananen ist neu. In welche Kategorie?", dem Feld
  "Kategorie" (Fokus) samt "Kategorie-Vorschläge" und den Knöpfen "Mit Kategorie
  hinzufügen" und "Ohne Kategorie hinzufügen". Oben steht der Knopf "Zurück zum Artikel".
- "Mit Kategorie hinzufügen" ordnet die Kategorie zu (nach denselben Regeln wie im
  Artikel-Dialog, auch das Neuanlegen am Ende), fügt den Artikel hinzu und kehrt zum
  leeren Formular zurück, mit Fokus im Feld "Name". Die Ansage ist die bisherige
  Hinzufügen-Ansage, ergänzt um " Kategorie Obst/Gemüse." bzw. um " Kategorie Drogerie
  neu angelegt, Position 5.". Ein leeres Feld ergibt in der Fehlerzeile "Bitte eine
  Kategorie eingeben oder ohne Kategorie hinzufügen.".
- "Ohne Kategorie hinzufügen" fügt den Artikel ohne Kategorie hinzu und kehrt ebenso
  zurück.
- "Zurück zum Artikel" kehrt zum ausgefüllten Formular zurück, ohne etwas zu schreiben.
- Ungültige Namen (leer, zu lang) melden sich wie bisher, ohne dass der Dialog
  erscheint. Steht der Name im Katalog, erscheint der Dialog nie, auch wenn der Artikel
  keine Kategorie hat.
- Der Dialog erscheint auch bei abgeschalteter Sortierung. Bei "Auf die Einkaufsliste"
  aus einem Gericht oder dem Wochenplan erscheint er nicht.

### Einheiten und Gerichtskategorien anlegen

- Die Einheiten-Verwaltung bekommt einen `pageHeader` mit "+" (`aria-label` "Einheit
  anlegen"). "+" öffnet `h1` "Einheit anlegen" mit dem Feld "Name". Ein vorhandener Name
  ergibt "Die Einheit g gibt es schon.", sonst lautet die Ansage "Dose angelegt.".
- Die Gerichtskategorien-Verwaltung bekommt einen `pageHeader` mit "+" (`aria-label`
  "Gerichtskategorie anlegen"). "+" öffnet `h1` "Kategorie anlegen" mit dem Feld "Name".
  Ein vorhandener Name ergibt "Die Kategorie Pasta gibt es schon.", sonst lautet die
  Ansage "Pasta angelegt.".
- Eine angelegte Gerichtskategorie ohne Gerichte steht als "Pasta, 0" in der Liste,
  bleibt nach einem Neuladen erhalten und wird im Gericht-Formular vorgeschlagen.
  Umbenennen und Löschen wirken auf den Katalog und auf die Gerichte. Der Filter der
  Gerichteliste zeigt weiter nur Kategorien, die ein Gericht trägt.

### Übergreifend

- Die Firestore-Regeln erlauben `itemCategories` und `mealCategories` nur dem Haushalt.
- Alle neuen und geänderten Seiten sind ohne axe-Befund.
- Die bestehenden Tests laufen grün.

### Bewusste Grenzen

- Die Kategorie steht am Katalogeintrag, nicht am Einkaufsartikel. Artikel, die nie in
  den Katalog gelangt sind, sind immer "Ohne Kategorie". Heute gelangt jeder hinzugefügte
  Artikel über `recordUse` in den Katalog.
- Kategorien lassen sich nicht zusammenführen.
- Ein Firestore-Feld `categoryId`, das auf eine gelöschte Kategorie zeigt, bleibt
  stehen. Es wirkt wie "Ohne Kategorie" und wird beim nächsten Speichern des Artikels
  überschrieben.

## Wesentliche Entscheidungen und Abwägungen

1. **Die Reihenfolge wird per Positions-Spinner im Dialog gesetzt.** Gespeichert wird sie
   als geordnete Liste in einem einzigen Dokument `itemCategories/catalog`
   (`{ categories: [{ id, name }], sortByCategory }`).
   - Warum: Unter VoiceOver ist ein Spinner ein einziger Handgriff, egal wie weit eine
     Kategorie wandert. Drag & Drop ist praktisch unbedienbar, Hoch/Runter-Knöpfe füllen
     jede Zeile. Ein Dokument macht das Umsortieren zu einem atomaren Schreibvorgang, ohne
     Neunummerieren.
   - Auswirkung: neue Sammlung `itemCategories` samt Regel. Der Spinner nutzt das
     vorhandene `SpinButton`.

2. **Artikel verweisen per `categoryId` auf ihre Kategorie, als Feld am Dokument in
   `knownItems`.**
   - Warum: Umbenennen und Löschen brauchen kein Massenschreiben über alle Artikel
     (anders als `withCategoryRenamed` bei den Gerichten).
   - Auswirkung: `KnownItem` bekommt `categoryId: ItemCategoryId | null`. Die
     Katalogfunktionen, die heute `KnownItem` und `KnownUnit` gemeinsam bedienen,
     werden auf einen generischen `CatalogEntry` umgestellt (Phase 2). Eine ID, die in
     der Kategorienliste fehlt, gilt als "Ohne Kategorie".

3. **Die Gruppierung respektiert die eingefrorene Liste (Mischform).**
   - Warum: Unter dem VoiceOver-Finger soll nichts springen. Wer gerade hinzufügt, steht
     aber nicht in der Liste, also darf sein eigener neuer Artikel sofort richtig landen.
   - Auswirkung: Der eingefrorene Stand merkt sich neben der Reihenfolge der IDs auch
     die Gruppe jedes Artikels zum Zeitpunkt des Einfrierens (`FrozenList`, Phase 3).
     `pendingChangeCount` zählt verschobene Artikel mit.

4. **Der Schalter gilt für den Haushalt und steht auf der Seite Artikelkategorien.**
   - Warum: Kategorien und Reihenfolge gelten ohnehin für beide Geräte. Die
     Einstellungsseite bleibt kurz.
   - Auswirkung: `sortByCategory` liegt im selben Dokument wie die Kategorien.

5. **Der Kategorie-Dialog erscheint vor dem Schreiben, nur für Namen außerhalb des
   Katalogs.**
   - Warum: Der Artikel landet so gleich in der richtigen Gruppe. Bekannte Artikel ohne
     Kategorie würden sonst bei jedem Einkauf nachfragen.
   - Auswirkung: `addItem` bekommt die gewählte Kategorie mit. Die Platzierung in der
     eingefrorenen Liste nutzt sie direkt, ohne auf die Momentaufnahme von `knownItems`
     zu warten.

6. **Gerichtskategorien bekommen einen eigenen Katalog `mealCategories/catalog`
   (`{ names: string[] }`).** Er wird mit den aus Gerichten abgeleiteten Kategorien
   zusammengeführt.
   - Warum: Eine leere Kategorie kann heute nicht bestehen (`mealCategories(meals)`).
   - Auswirkung: eigene, letzte Phase im Kontext `meals`. Doppelbuchführung wie bei den
     Einheiten: Umbenennen und Löschen schreiben in Katalog und Gerichte.

7. **Artikelkategorien gehören zum Kontext `shopping`.**
   - Warum: Sie ordnen die Einkaufsliste und hängen am Artikelkatalog. `meals` braucht
     sie nicht.
   - Auswirkung: Der Architekturtest bleibt unverändert. `SignedInApp` verdrahtet nur.

## Ausgangslage

```
Einstellungen (SignedInApp.tsx:207-219)
├─ Farben invertieren        Schalter, localStorage
├─ Regeln                    weekPlan/rollingRules
├─ Artikel                   KnownItemsArea   → knownItems/{knownItemIdOf(name)} {name,lastUsedAt,timesUsed}
├─ Einheiten                 KnownUnitsArea   → units/{…}
└─ Gerichtskategorien        CategoriesArea   → nur abgeleitet aus meals[].categories
```

Einkaufsliste (`src/shopping/ui/useShoppingList.ts`, `src/shopping/domain/stableList.ts`):

```
client.observeItems ─► liveItems
                         │ + unconfirmedWrites / − unconfirmedRemovals
                         ▼
                     settledItems ─► projectStableList(frozenOrder) ─► shownItems ─► ShoppingListPage
                                                ▲
 frozenOrder: readonly ItemId[]                 │
   firstFrozenOrder   beim ersten Snapshot      │
   appendToFrozenOrder eigener neuer Artikel → hinten
   nextFrozenOrder    "Aufräumen": offene nach createdAt
   pendingChangeCount departures + arrivals
```

- `ShoppingListPage.tsx:89-102` rendert eine einzige `ul.itemList`.
- `AddItemPage.tsx:62-77` ruft `addItem(draft)` direkt beim Absenden.
- `KnownItemFormPage` pflegt nur den Namen. Der Weg zum Speichern ist
  `planKnownItemRename` → `KnownItemsClient.renameKnownItem` (Batch mit `merge: true`).
- `knownItem.ts` stellt `recordUse`, `withNamesInUse`, `canonicalName`,
  `planKnownItemRename`, `applyRename`, `knownItemsByName`, `suggestFromCatalog` bereit.
  `knownUnit.ts` delegiert an diese Funktionen.
- `pageHeader` mit `addItemButton` gibt es auf Einkaufsliste, Gerichten und Vorräten
  (`ShoppingListPage.tsx:73-85`), auf den Verwaltungsseiten nicht.

## Zielbild

```
Einstellungen
├─ Farben invertieren
├─ Regeln
├─ Artikel                 [+]  Zeile "Äpfel, Obst/Gemüse"; Dialog Name + Kategorie
├─ Artikelkategorien       [+]  NEU → itemCategories/catalog { categories:[{id,name}], sortByCategory }
├─ Einheiten               [+]
└─ Gerichtskategorien      [+]  + mealCategories/catalog { names:[…] }

knownItems/äpfel { name, lastUsedAt, timesUsed, categoryId: "k1" | null }
```

Einkaufsliste:

```
settledItems ─┐
knownItems  ──┼─► categoryOf(name) ─► nextFrozenList(items, grouping) ─► FrozenList
catalog     ──┘                                                         { ids, groupOf }
                                                                              │
                               projectSections(frozenList, settledItems, catalog, sortByCategory)
                                                                              ▼
                                                         readonly ListSection[] ─► ShoppingListPage
```

Oberflächen (Vorher → Nachher):

```
Vorher – Einstellungen             Nachher – Einstellungen
Farben invertieren      [■□]       Farben invertieren      [■□]
Regeln                             Regeln
Artikel                            Artikel
Einheiten                          Artikelkategorien        ← neu
Gerichtskategorien                 Einheiten
                                   Gerichtskategorien
```

```
Nachher – Artikelkategorien                Nachher – Kategorie bearbeiten
[Zurück zu den Einstellungen]              [Zurück zu den Artikelkategorien]
Artikelkategorien, 4               [+]     Kategorie bearbeiten
Nach Kategorien sortieren         [■□]     Name      [Backwaren          ]
[1. Obst/Gemüse, 12 Artikel]       [🗑]    Position  [ 2 ] [−][+]   (2 von 4)
[2. Backwaren, 3 Artikel]          [🗑]
[3. Süßigkeiten, 0 Artikel]        [🗑]
[4. Tiefkühlkost, 7 Artikel]       [🗑]    ─────────────────── [💾 Speichern]
```

```
Vorher – Artikel-Verwaltung                 Nachher – Artikel-Verwaltung
[Zurück zu den Einstellungen]               [Zurück zu den Einstellungen]
Artikel, 42                                 Artikel, 42                        [+]
[Äpfel]                       [🗑]          [Äpfel, Obst/Gemüse]               [🗑]
[Batterien]                   [🗑]          [Batterien]                        [🗑]

Vorher – Vorschlag bearbeiten               Nachher – Artikel bearbeiten
Name [Äpfel        ]                        Name      [Äpfel        ]
                                            Kategorie [Ob           ]
                                            Kategorie-Vorschläge: [Obst/Gemüse]
             [💾 Speichern]                               [💾 Speichern]
```

```
Vorher – Einkaufsliste                      Nachher – Einkaufsliste (Sortierung an)
Einkaufsliste, 4 offen          [+]         Einkaufsliste, 4 offen          [+]
☐ Pizza          [−] 1 [+]                  ## Obst/Gemüse
☐ Äpfel          [−] 3 [+]                  ☐ Äpfel          [−] 3 [+]
☐ Batterien      [−] 1 [+]                  ☐ Bananen        [−] 1 [+]
☐ Bananen        [−] 1 [+]                  ## Tiefkühlkost
                                            ☐ Pizza          [−] 1 [+]
                                            ## Ohne Kategorie
                                            ☐ Batterien      [−] 1 [+]
```

```
Artikel hinzufügen               Kategorie für Bananen
Name    [Bananen  ]              [Zurück zum Artikel]
Menge   [3] Einheit [Stück]  ─►  Kategorie für Bananen
[Hinzufügen]                     Bananen ist neu. In welche Kategorie?
                                 Kategorie [Ob             ]
                                 Kategorie-Vorschläge: [Obst/Gemüse]
                                 [Mit Kategorie hinzufügen]
                                 [Ohne Kategorie hinzufügen]
```

## Abstraktionen und Wiederverwendung

- `src/shopping/domain`
  - `catalogEntry.ts` – **neu**, die generischen Katalogfunktionen aus `knownItem.ts`
    über `CatalogEntry = { name, lastUsedAt, timesUsed }`
    - `recordUse`, `withNamesInUse`, `canonicalName`, `planCatalogRename`,
      `applyRename`, `entriesByName`, `suggestFromCatalog`, `hasName`
  - `knownItem.ts` – `KnownItem = CatalogEntry & { categoryId }`, eigene Varianten für
    das Anlegen von Einträgen (`categoryId: null`), `planKnownItemRename` mit
    Kategorie, `knownItemToAdd`, `KnownItemAlreadyTaken`, `isKnownName`
  - `knownUnit.ts` – `KnownUnit = CatalogEntry`, `knownUnitToAdd`,
    `KnownUnitAlreadyTaken`
  - `itemCategory.ts` – **neu**, Kategorien-Katalog als reine Funktionen
  - `categorizedList.ts` – **neu**, Gruppenzuordnung und Abschnitte der Einkaufsliste
  - `stableList.ts` – `FrozenList` statt `FrozenOrder`
  - `announcements.ts` – neue Überschriften, Zeilen, Ansagen, Meldungen
- `src/shopping/api`
  - `itemCategoriesClient.ts`, `firestoreItemCategoriesClient.ts`,
    `inMemoryItemCategoriesClient.ts` – **neu**
  - `knownItemsClient.ts` und Adapter – `categoryId`, `addKnownItem`,
    `recordUse` mit optionaler Kategorie
  - `knownUnitsClient.ts` und Adapter – `addKnownUnit`
- `src/shopping/ui`
  - `ItemCategoriesArea.tsx`, `ItemCategoryListPage.tsx`, `ItemCategoryListRow.tsx`,
    `ItemCategoryFormPage.tsx`, `DeleteItemCategoryPage.tsx`, `useItemCategories.ts` –
    **neu**, nach dem Muster von `KnownUnitsArea` und Co.
  - `ItemCategoryField.tsx` – **neu**, Feld "Kategorie" mit `NameSuggestions`, genutzt
    vom Artikel-Dialog und vom Kategorie-Dialog
  - `ChooseItemCategoryPage.tsx` – **neu**, der Kategorie-Dialog beim Hinzufügen
  - `KnownItemFormPage.tsx`, `KnownItemListPage.tsx`, `KnownItemListRow.tsx`,
    `KnownItemsArea.tsx`, `KnownUnitFormPage.tsx`, `KnownUnitListPage.tsx`,
    `KnownUnitsArea.tsx`, `ShoppingListPage.tsx`, `ShoppingArea.tsx`, `AddItemPage.tsx`,
    `useShoppingList.ts`, `useKnownItems.ts`, `useKnownUnits.ts` – angepasst
- `src/shared/ui`
  - `ManagementHeader.tsx` – **neu**, `pageHeader` mit `h1` (Fokus über
    `useHeadingFocus`) und "+"-Knopf, genutzt von den vier Verwaltungsseiten
- `src/meals`
  - `domain/mealCategory.ts` – `withCatalogCategories`, `catalogCategoryToAdd`
  - `api/mealCategoriesClient.ts` samt Firestore- und In-Memory-Adapter – **neu**
  - `ui/useMealCategories.ts` – **neu**; `CategoriesArea.tsx`, `CategoryListPage.tsx`,
    `CategoryFormPage.tsx`, `MealsArea.tsx` angepasst
- `src/SignedInApp.tsx`, `src/App.tsx`, `src/main.tsx` – neue Clients verdrahten,
  Einstellungseintrag `itemCategories`
- `firestore.rules`, `firestore.rules.test.ts` – zwei neue Sammlungen
- `docs/architektur/05-bausteinsicht.md` – neue Bausteine nachtragen

## Logging und Beobachtbarkeit

Keine Änderungen. Fehlgeschlagene Schreibvorgänge der neuen Adapter werden wie bei
`knownItems` und `units` mit `ignoreFailure` verworfen, die Momentaufnahme stellt den
Stand wieder her.

## Umsetzung

### Phase 1: Artikelkategorien verwalten

Abhängigkeiten: keine

Die neue Seite mit Liste, Anlegen, Bearbeiten samt Position, Löschen und dem
Sortier-Schalter. Die Artikelanzahl je Kategorie ist in dieser Phase immer 0, weil
Artikel erst in Phase 2 eine Kategorie bekommen. Die Liste bekommt dafür schon hier die
Prop `assignedCounts: ReadonlyMap<ItemCategoryId, number>`. In Phase 1 ist sie leer, in
Phase 2 liefert sie die gleichnamige Domänenfunktion.

**Aufgaben**:

- [x] Test zuerst: `src/shopping/domain/itemCategory.test.ts`
- [x] `src/shopping/domain/itemCategory.ts` anlegen:
  ```ts
  export type ItemCategoryId = string
  export type ItemCategory = { id: ItemCategoryId; name: string }
  export type ItemCategoryCatalog = {
    categories: readonly ItemCategory[]
    sortByCategory: boolean
  }
  export const EMPTY_ITEM_CATEGORY_CATALOG: ItemCategoryCatalog
  export class ItemCategoryAlreadyTaken extends Error { category: string }
  export type CategoryPlacement = { position: number; count: number }
  export function itemCategoryCatalogFromStored(stored: unknown): ItemCategoryCatalog
  export function withCategoryAdded(catalog, id, written, position): ItemCategoryCatalog
  export function withCategoryChanged(catalog, id, written, position): ItemCategoryCatalog
  export function withoutItemCategory(catalog, id): ItemCategoryCatalog
  export function withSortByCategory(catalog, on: boolean): ItemCategoryCatalog
  export function placementOf(catalog, id): CategoryPlacement | null
  export function categoryNamed(catalog, typed): ItemCategory | null
  export function findItemCategory(catalog, id: ItemCategoryId | null): ItemCategory | null
  export function suggestItemCategories(catalog, typed): readonly string[]
  ```
  - Namen über `createItemName` validieren (gleiche Meldungen wie bei Artikeln),
    doppelte Namen (normalisiert über `normalizeItemName`, die eigene ID ausgenommen)
    werfen `ItemCategoryAlreadyTaken` mit dem vorhandenen Namen.
  - `position` ist 1-basiert und wird auf 1 bis Anzahl (+1 beim Anlegen) begrenzt.
  - `itemCategoryCatalogFromStored`: fehlendes Dokument → `sortByCategory: true`,
    keine Kategorien. Einträge ohne `id` oder `name` werden übersprungen.
  - `suggestItemCategories`: ab 1 Zeichen, höchstens 5, enthält das Getippte, aber
    nicht genau es. Erst die, die mit dem Getippten beginnen, dann die
    Katalog-Reihenfolge.
  - Tests: Anlegen am Ende und an Stelle 2 von 3 (die alte Nummer 2 wird 3),
    Verschieben nach vorn und hinten, Umbenennen auf den eigenen Namen in anderer
    Schreibweise ist erlaubt, Duplikat beim Anlegen und Umbenennen, Begrenzung der
    Position, Löschen, `fromStored` mit leerem, unvollständigem und vollständigem
    Dokument, Vorschlagsranking.
- [x] `src/shopping/domain/announcements.ts` ergänzen (Tests in
  `announcements.test.ts` zuerst): `itemCategoriesHeading(count)`,
  `itemCategoryRowLabel(category, placement, assignedCount)`,
  `itemCategoryPositionText(placement)` ("2 von 4"),
  `itemCategoryCreatedAnnouncement`, `itemCategorySavedAnnouncement`,
  `itemCategoryDeletionNote(assignedCount)`, `itemCategoryDeletedAnnouncement`,
  `deleteItemCategoryHeading(name)` ("Tiefkühlkost löschen?"), und `additionFailureMessage`
  um `ItemCategoryAlreadyTaken` → "Die Kategorie <Name> gibt es schon." erweitern.
- [x] Port `src/shopping/api/itemCategoriesClient.ts`:
  ```ts
  export interface ItemCategoriesClient {
    observeCatalog(onCatalog: (catalog: ItemCategoryCatalog) => void): () => void
    writeCatalog(catalog: ItemCategoryCatalog): void
    newCategoryId(): ItemCategoryId
  }
  ```
- [x] `firestoreItemCategoriesClient.ts`: Dokument `itemCategories/catalog`, `onSnapshot`
  → `itemCategoryCatalogFromStored`. `writeCatalog` per `setDoc` (ganzes Dokument),
  `newCategoryId` per `doc(collection(firestore, 'itemCategories')).id`. Fehler →
  `ignoreFailure`.
- [x] `inMemoryItemCategoriesClient.ts` mit `catalogArrivesFromElsewhere` und
  `storedCatalog()` für Tests, IDs zählend (`k1`, `k2`, …).
- [x] `src/shopping/ui/useItemCategories.ts`: liefert `catalog`, `loaded` (erst wahr,
  wenn die erste Momentaufnahme da ist, für Phase 3), `addCategory(name,
  position)`, `changeCategory(id, name, position)`, `removeCategory(id)`,
  `switchSortByCategory(on)`. Jede Methode rechnet über die Domänenfunktionen und ruft
  `writeCatalog`. Bis zur Momentaufnahme gilt der zuletzt selbst geschriebene Stand,
  damit zwei schnelle Änderungen nacheinander aufeinander aufbauen.
- [x] `src/shared/ui/ManagementHeader.tsx`: `pageHeader` mit `h1` (Ref aus
  `useHeadingFocus`, `tabIndex={-1}`) und `button.addItemButton` "+" mit `aria-label`
  aus den Props.
- [x] UI nach dem Muster von `KnownUnitsArea`: `ItemCategoriesArea` (Seitenzustand
  `list | create | form(id) | delete(id)`, fällt auf `list` zurück, wenn die ID
  verschwindet), `ItemCategoryListPage` (Header, Schalter, Liste),
  `ItemCategoryListRow`, `ItemCategoryFormPage` (Name, `SpinButton` "Position" mit
  [−]/[+] wie `AmountSpinner`, Fehlerzeile, `BottomBar` mit Speichern),
  `DeleteItemCategoryPage`. Zurück-Knopf: "Zurück zu den Artikelkategorien".
- [x] `SignedInApp.tsx`: `ITEM_CATEGORIES_ENTRY = 'itemCategories'` mit Label
  "Artikelkategorien" zwischen Artikel und Einheiten; `createItemCategoriesClient`
  als Prop, durchgereicht über `App.tsx` und `main.tsx` (Firestore). In den Tests
  bekommen `renderSignedInApp` (`SignedInApp.test.tsx:64-85`) und das Rendern in
  `App.test.tsx:41` den In-Memory-Client. Den Hook `useItemCategories` ruft
  `SignedInApp` auf und reicht den Zustand weiter, nicht den Client.
- [x] `firestore.rules`: `match /itemCategories/{document} { allow read, write: if
  isHousehold(); }` und in `firestore.rules.test.ts` die drei Fälle (Haushalt darf,
  anderes Konto nicht, unangemeldet nicht).
- [x] Komponententest `src/shopping/ui/ItemCategoriesArea.test.tsx` (In-Memory-Client):
  Anlegen am Ende mit Ansage, Anlegen an Stelle 2 verschiebt die anderen, Bearbeiten
  mit Positionswechsel und Ansage, Duplikat-Meldung, Löschen mit Sicherheitsabfrage und
  Ansage, Rückfall auf die Liste bei Löschung von außen, Schalter schreibt
  `sortByCategory`, axe ohne Befund.
- [x] `src/SignedInApp.test.tsx:1598-1603`: den bestehenden Test der Eintragsreihenfolge
  um "Artikelkategorien" zwischen "Artikel" und "Einheiten" anpassen.
- [x] E2E `e2e/settings.spec.ts`: "orders the item categories and keeps the order after
  a reload" (drei anlegen, die vierte an Stelle 2, neu laden, Reihenfolge und Schalter
  geprüft).

**Automatisierte Verifikation**:

- [x] `npm run test` grün, darunter `itemCategory.test.ts` und `ItemCategoriesArea.test.tsx`
- [x] `npm run lint` und `npm run build` ohne Befund
- [x] `npm run test:rules` grün (Regeltests)
- [x] `npm run test:e2e` grün (Emulator, darunter `e2e/settings.spec.ts`)

### Phase 2: Kategorie am Artikel und "+" in der Artikel-Verwaltung

Abhängigkeiten: Phase 1

**Aufgaben**:

- [x] Refactoring mit unveränderten Tests zuerst: `src/shopping/domain/catalogEntry.ts`
  anlegen und die generischen Funktionen aus `knownItem.ts` dorthin ziehen
  (`CatalogEntry`, `hasName`, `recordUse`, `withNamesInUse`, `canonicalName`,
  `applyRename`, `entriesByName`, `suggestFromCatalog`, Planung des Umbenennens als
  `planCatalogRename<Entry extends CatalogEntry>`). Wo neue Einträge entstehen
  (`recordUse`, `withNamesInUse`), bekommt die Funktion eine Fabrik
  `newEntry: (name, usedAt) => Entry`. Wo ein vorhandener Eintrag fortgeschrieben wird,
  wird er gespreadet (`{ ...entry, name, lastUsedAt, timesUsed }`), damit Zusatzfelder
  wie `categoryId` erhalten bleiben. Das gilt für `recordUse` und den Merge-Zweig von
  `planCatalogRename` (`knownItem.ts:107-113`, dort von `merged ?? renamed` aus). Ein
  neuer Test in `catalogEntry.test.ts` belegt, dass `recordUse` ein Zusatzfeld behält.
  `KnownUnitRename` wird zu `CatalogRename<KnownUnit>`, `KnownItemRename` zu
  `CatalogRename<KnownItem>`. `knownUnit.ts`, `firestoreKnownUnitsClient.ts` und
  `inMemoryKnownUnitsClient.ts` nutzen `CatalogEntry` direkt.
  `npm run test` und `npm run build` müssen vor dem nächsten Schritt grün sein.
- [x] Tests zuerst in `knownItem.test.ts`, dann `knownItem.ts`:
  - `KnownItem = CatalogEntry & { categoryId: ItemCategoryId | null }`, neue Einträge
    mit `categoryId: null`. `knownItemsFromHistory` setzt `null`.
  - `planKnownItemRename(knownItems, from, newName, categoryId)`: `written.categoryId`
    ist immer der übergebene Wert, auch beim Zusammenführen.
  - `knownItemToAdd(knownItems, written, categoryId, now): KnownItem`, wirft
    `KnownItemAlreadyTaken` bei vorhandenem Namen.
  - `isKnownName(knownItems, name): boolean`.
  - `categoryIdOfName(knownItems, name): ItemCategoryId | null`.
  - `assignedCounts(knownItems): ReadonlyMap<ItemCategoryId, number>`.
- [x] Test-Fixtures nachziehen: `build` ist `tsc -b` und prüft auch die Tests. Jede
  `KnownItem`-Fixture bekommt `categoryId: null`, das betrifft `known()` in
  `ShoppingArea.test.tsx:44`, `knownItem.test.ts`, `KnownItemsArea.test.tsx` und die
  Startdaten der In-Memory-Clients in `SignedInApp.test.tsx` und `App.test.tsx`.
  `toEqual`-Erwartungen auf gespeicherte Einträge (z. B. `KnownItemsArea.test.tsx:243`)
  enthalten das Feld ebenfalls.
- [x] `KnownItemsArea.test.tsx:247` erwartet die Überschrift "Vorschlag bearbeiten",
  sie wird auf "Artikel bearbeiten" umgestellt.
- [x] Tests zuerst in `itemCategory.test.ts`: `categoryToAssign(catalog, typed,
  newId): { catalog: ItemCategoryCatalog; categoryId: ItemCategoryId | null; created:
  CategoryPlacement | null }`. Leer → `null`, normalisiert vorhanden → deren ID, sonst
  neu am Ende.
- [x] Ansagen und Meldungen ergänzen: `knownItemRowLabel(knownItem, category)`,
  `knownItemCreatedAnnouncement`, `categoryCreatedPhrase(name, placement)` ("Kategorie
  Drogerie neu angelegt, Position 5."), `additionFailureMessage` um
  `KnownItemAlreadyTaken` → "Den Artikel <Name> gibt es schon.". Die Überschrift des
  Dialogs ist "Artikel bearbeiten" bzw. "Artikel anlegen".
- [x] `KnownItemsClient`:
  - `addKnownItem(knownItem)` neu (`setDoc` ohne `merge`)
  - `recordUse(name, usedAt, categoryId?: ItemCategoryId)`: Ist `categoryId` gesetzt,
    landet es im selben `setDoc` mit `merge: true`, sonst bleibt das Feld unberührt.
    Ein einziger Schreibvorgang, damit keine Momentaufnahme ohne Kategorie dazwischen
    liegt. Gebraucht wird das in Phase 4.
  - `renameKnownItem` schreibt `categoryId` mit
  - `toKnownItem` liest `categoryId ?? null` (String oder `null`)
  - In-Memory-Adapter entsprechend
- [x] `src/shopping/ui/ItemCategoryField.tsx`: Feld "Kategorie" plus
  `NameSuggestions label="Kategorie-Vorschläge"`. Die Vorschläge werden beim Öffnen
  eingefroren wie in `AddItemPage`. Ein Tipp auf einen Vorschlag setzt den Wert.
- [x] `KnownItemFormPage`: Modus `edit | create`, Feld Kategorie vorbelegt mit dem
  Namen von `findItemCategory(catalog, knownItem.categoryId)`, `onSave(name,
  categoryText)`.
- [x] `KnownItemsArea`: Seitenzustand um `create` erweitern. Beim Speichern erst
  `categoryToAssign` (schreibt bei `created` den Katalog über `useItemCategories`),
  dann `planKnownItemRename` bzw. `knownItemToAdd`. Die Ansage wird um
  `categoryCreatedPhrase` ergänzt.
- [x] `KnownItemListPage`/`KnownItemListRow`: `ManagementHeader` mit "Artikel
  anlegen", Zeilentext über `knownItemRowLabel`.
- [x] `ItemCategoryListPage` bekommt `assignedCounts(knownItems.knownItems)` statt der
  leeren Map, `DeleteItemCategoryPage` die Zahl für den Hinweistext.
- [x] `SignedInApp.tsx`: `itemCategories` an `KnownItemsArea`, `knownItems` an
  `ItemCategoriesArea` reichen.
- [x] Komponententests `KnownItemsArea.test.tsx`: Kategorie zuordnen, neue Kategorie
  per Freitext mit Ansage und am Ende des Katalogs, Schreibweise angleichen, Feld
  leeren, Zusammenführen behält die Dialog-Kategorie, Anlegen über "+" samt
  Duplikat-Meldung, Zeilentext, axe ohne Befund.
- [x] `ItemCategoriesArea.test.tsx`: Artikelanzahl in der Zeile und im Löschhinweis.

**Automatisierte Verifikation**:

- [x] `npm run test` grün, auch die unveränderten Tests von `knownUnit.test.ts` und
  `KnownUnitsArea.test.tsx` nach dem Refactoring
- [x] `npm run lint` und `npm run build` ohne Befund

### Phase 3: Gruppierte Einkaufsliste

Abhängigkeiten: Phase 2

**Aufgaben**:

- [x] Tests zuerst: `src/shopping/domain/categorizedList.test.ts`, dann
  `categorizedList.ts`:
  ```ts
  export type ListGroup = ItemCategoryId | null
  export type Grouping = {
    groupOf: (item: ShoppingItem) => ListGroup
    rankOf: (group: ListGroup) => number
  }
  export const UNGROUPED: Grouping
  export function groupingOf(catalog, knownItems): Grouping
  export type ListSection = { category: ItemCategory | null; items: readonly ShoppingItem[] }
  ```
  - `groupingOf`: Ist `sortByCategory` aus, ergibt sich `UNGROUPED` (alles `null`, Rang
    0). Sonst Gruppe über `categoryIdOfName`. Eine ID, die im Katalog fehlt, ergibt
    `null`. Der Rang ist die Katalogposition, `null` steht hinter allen.
  - `rankOf` einer ID, die (noch) nicht im Katalog steht, liegt hinter allen bekannten
    und vor `null`. Das betrifft eine im Hinzufüge-Dialog gerade erst angelegte
    Kategorie, deren Momentaufnahme noch aussteht.
- [x] Tests zuerst in `stableList.test.ts`, dann `stableList.ts` von `FrozenOrder` auf
  `FrozenList` umstellen:
  ```ts
  export type FrozenList = {
    ids: readonly ItemId[]
    groupOf: ReadonlyMap<ItemId, ListGroup>
  }
  ```
  - `nextFrozenList(liveItems, grouping)`: offene Artikel nach `(rankOf(groupOf),
    createdAt, id)`.
  - `firstFrozenList(appended, liveItems, grouping)`: wie `firstFrozenOrder`, die
    eintreffenden Artikel sortiert wie bei `nextFrozenList`, danach die schon
    angehängten.
  - `insertIntoFrozenList(frozen, id, group, grouping)`: Steht die ID schon drin,
    passiert nichts. Sonst kommt sie hinter den letzten Artikel derselben Gruppe. Gibt
    es keinen, kommt sie vor den ersten Artikel einer Gruppe mit höherem Rang, sonst
    ans Ende. Mit `UNGROUPED` ist das genau das heutige Anhängen.
  - `regroupFrozenList(frozen, liveItems, grouping)`: dieselben IDs (auch abgehakte),
    stabil neu sortiert nach `(rank, createdAt, id)`, Gruppen neu gesetzt. Gilt für den
    Schalter.
  - `withoutFromFrozenList`, `projectStableList(frozen, liveItems)` unverändert in der
    Bedeutung.
  - `projectSections(frozen, liveItems, catalog, grouped: boolean)`: fasst
    aufeinanderfolgende Artikel gleicher eingefrorener Gruppe zu `ListSection`
    zusammen. Ist `grouped` falsch, ergibt sich genau ein Abschnitt mit `category:
    null`.
  - `pendingChangeCount(frozen, liveItems, grouping)`: wie bisher departures +
    arrivals, dazu jeder offene, eingefrorene Artikel, dessen aktuelle Gruppe von der
    eingefrorenen abweicht oder dessen Gruppe unter den eingefrorenen Gruppen
    inzwischen einen anderen Platz hat (verglichen wird die Reihenfolge der
    eingefrorenen Gruppen mit ihrer Reihenfolge nach `rankOf`).
  - Tests: alle bestehenden Fälle mit `UNGROUPED`, dazu Gruppensortierung, Einfügen in
    eine vorhandene, neue, erste und letzte Gruppe, Kategorie geändert zählt und bleibt
    stehen, Reihenfolge geändert zählt, `regroup` behält abgehakte Artikel, Abschnitte
    mit abgehakter Gruppe.
- [x] `useShoppingList`: zusätzlich `catalog: ItemCategoryCatalog` bekommen,
  `grouping = groupingOf(catalog, knownItems)`. `addItem(draft, categoryId?)` bzw.
  `carryOutAll` fügen über `insertIntoFrozenList` ein. Die Gruppe ist bei
  abgeschalteter Sortierung immer `null`, sonst die übergebene Kategorie oder
  `grouping.groupOf`. Gerichte und Wochenplan übergeben keine.
  - **Erstes Einfrieren:** Heute friert `observeItems` beim ersten Snapshot ein
    (`useShoppingList.ts:86-100`). Dann wären `knownItems` und der Katalog noch leer,
    alle Artikel lägen in `null`, und bei jedem Start stünde "Aufräumen (n)" da. Deshalb
    wird erst eingefroren, wenn Artikel, Artikelkatalog und Kategorienkatalog je ihre
    erste Momentaufnahme haben. `useKnownItems` bekommt dafür ebenfalls `loaded`, und
    `useShoppingList` bekommt beide Flags. Das Einfrieren wandert aus dem Callback in
    einen Effekt, der auf alle drei wartet und einmal `firstFrozenList` anwendet.
    Eigene Artikel, die vorher hinzugefügt werden, gehen wie heute über `appended` ein.
  - Wechselt `catalog.sortByCategory` nach dem ersten Einfrieren, wird einmal
    `regroupFrozenList` angewandt (Vergleich mit dem vorigen Wert in einem `useRef`).
  - `cleanUp` nutzt `nextFrozenList(settledItems, grouping)`.
  - Neu im Rückgabewert ist `sections: readonly ListSection[]`. `items` bleibt für
    Fokus und Entfernen erhalten.
  - Test: Kommt der Katalog nach den Artikeln an, zeigt die Liste die Gruppen, und es
    gibt keinen Aufräumen-Knopf.
- [x] `ShoppingListPage`: rendert `sections`. Gibt es eine Kategorie oder mehr als
  einen Abschnitt, bekommt jeder Abschnitt eine `h2` (Name bzw. "Ohne Kategorie"),
  sonst gar keine. Jeder Abschnitt hat eine eigene `ul.itemList`. `useFocusAfterRemoval`
  bekommt weiter die flache ID-Reihenfolge über alle Abschnitte.
- [x] `src/index.css`: Abstand der `h2` innerhalb der Einkaufsliste (Klasse
  `listSectionHeading`), Farben nur über die vorhandenen Tokens, damit
  `test/palette.test.ts` grün bleibt.
- [x] `SignedInApp.tsx`: `itemCategories.catalog` an `useShoppingList`.
- [x] Komponententests `ShoppingArea.test.tsx`: Gruppen mit Überschriften in
  Katalog-Reihenfolge, "Ohne Kategorie" unten, keine Überschrift bei nur
  unkategorisierten Artikeln, Sortierung aus = heutige Darstellung, Kategorieänderung
  von außen zählt im Aufräumen-Knopf und wirkt nach dem Aufräumen, Schalter wirkt
  sofort und behält abgehakte Artikel, Fokus nach dem Entfernen über eine
  Gruppengrenze, axe ohne Befund.
- [x] E2E `e2e/shoppingList.spec.ts`: "groups the list by the order of the item
  categories" (zwei Kategorien anlegen, Artikeln zuordnen, Liste zeigt die
  Überschriften in Reihenfolge, Schalter aus zeigt keine Überschriften).

**Automatisierte Verifikation**:

- [x] `npm run test` grün, darunter `categorizedList.test.ts`, `stableList.test.ts`,
  `ShoppingArea.test.tsx`
- [x] `npm run lint` und `npm run build` ohne Befund
- [x] `npm run test:e2e` grün (darunter `e2e/shoppingList.spec.ts`)

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: Die Überschriften lassen sich per Rotor
  ("Überschriften") anspringen, die Ansage einer Zeile ist unverändert.
- [x] Mit zwei Geräten: Eine Kategorieänderung auf Gerät A verschiebt auf Gerät B
  nichts, bis dort "Aufräumen" gedrückt wird.

### Phase 4: Kategorie-Dialog beim Hinzufügen

Abhängigkeiten: Phase 3

**Aufgaben**:

- [x] Ansagen ergänzen (Tests zuerst): `chooseCategoryHeading(name)`,
  `chooseCategoryQuestion(name)`, `assignedCategoryPhrase(name)` ("Kategorie
  Obst/Gemüse."), Meldung "Bitte eine Kategorie eingeben oder ohne Kategorie
  hinzufügen.".
- [x] `useShoppingList.addItem(draft, categoryId: ItemCategoryId | null = null)`: gibt
  `categoryId` an `knownItemsClient.recordUse(name, usedAt, categoryId)` weiter, sofern
  sie nicht `null` ist. Platziert wird über Phase 3.
- [x] `ShoppingArea`: Seitenzustand `add` hält den Entwurf, neu ist `chooseCategory`
  mit dem Entwurf. `AddItemPage` bekommt `isKnownName` und `onNewName(draft)`. Beim
  Absenden wird erst `createShoppingItem` validiert (Meldungen wie bisher). Ist der
  Name bekannt, wird wie bisher hinzugefügt, sonst geht es zu `onNewName`.
  `AddItemPage` übernimmt einen Anfangsentwurf (für "Zurück zum Artikel").
- [x] `src/shopping/ui/ChooseItemCategoryPage.tsx`: Zurück-Knopf, `h1`, Frage,
  `ItemCategoryField`, Fehlerzeile, die zwei Knöpfe. "Mit Kategorie hinzufügen" ruft
  `categoryToAssign` (schreibt bei Bedarf den Katalog), dann `addItem(draft,
  categoryId)`, und kehrt mit leerem Entwurf zu `AddItemPage` zurück. Dort liegt der
  Fokus im Namensfeld, angesagt wird die zusammengesetzte Ansage.
- [x] `SignedInApp.tsx`: `isKnownName`, `suggestItemCategories` und die
  Kategorie-Zuordnung an `ShoppingArea`.
- [x] Komponententests `ShoppingArea.test.tsx`: Dialog bei neuem Namen und nicht bei
  bekanntem (auch ohne Kategorie), leerer Name zeigt die Meldung ohne Dialog, mit
  vorhandener Kategorie landet der Artikel sofort in der Gruppe, neue Kategorie per
  Freitext wird angelegt, "Ohne Kategorie hinzufügen", "Zurück zum Artikel" behält den
  Entwurf und schreibt nichts, leeres Kategoriefeld ergibt die Meldung, Dialog auch bei
  abgeschalteter Sortierung, kein Dialog bei `addItems` (Gericht), axe ohne Befund.
- [x] Bestehende Tests, die über "Artikel hinzufügen" einen Namen außerhalb des
  Katalogs eintragen, um den Schritt "Ohne Kategorie hinzufügen" ergänzen:
  `ShoppingArea.test.tsx` (der Harness `ShoppingAreaUnderTest`,
  `ShoppingArea.test.tsx:65-93`, bekommt dazu `catalog`, `isKnownName` und die
  Kategorie-Vorschläge), `SignedInApp.test.tsx`, `e2e/shoppingList.spec.ts` und
  `e2e/settings.spec.ts:196-201` ("Mehl"). `e2e/meals.spec.ts` und
  `e2e/weekPlan.spec.ts` nutzen `AddItemPage` nicht und bleiben unberührt.
- [x] E2E-Helfer `addItemToList(page, name, { isNew })` in `e2e/keyboard.ts` oder einer
  neuen Testhilfe. Der Aufrufer sagt ausdrücklich, ob der Dialog erwartet wird. Der
  Helfer rät nicht, denn ob ein Name schon im Katalog steht, hängt im E2E vom Timing der
  Momentaufnahme ab (z. B. zweimal "Milch" in `e2e/shoppingList.spec.ts:104-105`). Vor
  dem zweiten Hinzufügen desselben Namens wartet der Test, bis der Katalogeintrag auf
  dem Server ist, so wie es die bestehenden Tests vor einem Neuladen schon tun.
- [x] E2E `e2e/shoppingList.spec.ts`: "asks for the category of a new item".

**Automatisierte Verifikation**:

- [x] `npm run test` grün
- [x] `npm run lint` und `npm run build` ohne Befund
- [x] `npm run test:e2e` grün

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: Nach "Hinzufügen" eines neuen Artikels liegt der
  Fokus im Feld "Kategorie", nach "Mit Kategorie hinzufügen" wieder im Feld "Name",
  und die Ansage nennt die Kategorie.

### Phase 5: "+" in der Einheiten-Verwaltung

Abhängigkeiten: Phase 1 (`ManagementHeader`)

**Aufgaben**:

- [x] Tests zuerst in `knownUnit.test.ts`: `knownUnitToAdd(knownUnits, written, now)`
  mit `timesUsed: 0`, `lastUsedAt: now`, wirft `KnownUnitAlreadyTaken` bei
  vorhandenem Namen. `additionFailureMessage` → "Die Einheit <Name> gibt es schon.",
  `knownUnitCreatedAnnouncement` → "<Name> angelegt.".
- [x] `KnownUnitsClient.addKnownUnit(knownUnit)` in Port, Firestore-Adapter (`setDoc`
  ohne `merge`) und In-Memory-Adapter.
- [x] `KnownUnitListPage` mit `ManagementHeader` ("Einheit anlegen"),
  `KnownUnitFormPage` mit Modus `create` (`h1` "Einheit anlegen"), `KnownUnitsArea`
  mit Seitenzustand `create`.
- [x] Komponententest `KnownUnitsArea.test.tsx`: Anlegen mit Ansage, Duplikat-Meldung,
  axe ohne Befund.

**Automatisierte Verifikation**:

- [x] `npm run test`, `npm run lint`, `npm run build` grün bzw. ohne Befund

### Phase 6: Eigener Katalog und "+" für Gerichtskategorien

Abhängigkeiten: Phase 1 (`ManagementHeader`)

**Aufgaben**:

- [x] Tests zuerst in `src/meals/domain/mealCategory.test.ts`:
  - `withCatalogCategories(overviews, catalogNames): readonly CategoryOverview[]`
    ergänzt Katalognamen ohne Gericht mit `mealCount: 0`, dedupliziert über
    `sameCategory`, alphabetisch.
  - `catalogCategoryToAdd(known, written): string` wirft die **neue** Fehlerklasse
    `CatalogCategoryAlreadyTaken`. `mealFailureMessage` bildet sie auf "Die Kategorie
    <Name> gibt es schon." ab. Das bestehende `CategoryAlreadyTaken` ("<X> ist schon
    eingetragen.", `meals/domain/announcements.ts:66`) bleibt für das Gericht-Formular
    unverändert.
  - `catalogWithoutCategory(names, name)` und `catalogWithCategoryRenamed(names, from,
    newName)`. Letzteres entdoppelt über `sameCategory`, wenn der neue Name schon im
    Katalog steht.
- [x] Port `src/meals/api/mealCategoriesClient.ts` (`observeCatalog(onNames)`,
  `writeCatalog(names)`), Firestore-Adapter auf `mealCategories/catalog { names }`,
  In-Memory-Adapter.
- [x] `src/meals/ui/useMealCategories.ts`. `SignedInApp` ruft ihn auf und reicht den
  Zustand (Namen samt Schreibmethoden) an `CategoriesArea` und `MealsArea`, nicht den
  Client.
- [x] `CategoriesArea`: `categories = withCatalogCategories(mealCategories(meals),
  catalog)`. Seitenzustand um `create` erweitert. Anlegen schreibt den Katalog,
  Umbenennen und Löschen schreiben Katalog **und** Gerichte. Liefert
  `withCategoryRenamed` `null`, weil kein Gericht die Kategorie trägt, wird nur der
  Katalog geschrieben. Die Ansage "<Name> gespeichert." kommt trotzdem (heute
  verstummt sie in diesem Fall, `CategoriesArea.tsx:57-60`). Sie bleibt nur aus, wenn
  die Kategorie weder im Katalog noch an einem Gericht steht.
- [x] `CategoryListPage` mit `ManagementHeader` ("Gerichtskategorie anlegen"),
  `CategoryFormPage` mit Modus `create` (`h1` "Kategorie anlegen"), Ansage
  `categoryCreatedAnnouncement` → "<Name> angelegt.".
- [x] `MealsArea`: Das Gericht-Formular bekommt `knownCategories` aus
  `withCatalogCategories`, der Filter weiter nur aus `mealCategories(meals.meals)`.
- [x] `SignedInApp.tsx`, `App.tsx`, `main.tsx`: `createMealCategoriesClient`
  verdrahten, in `renderSignedInApp` und `App.test.tsx` den In-Memory-Client einsetzen.
  `MealsArea.test.tsx` und `CategoriesArea.test.tsx` bekommen die neuen Props.
- [x] `firestore.rules` um `match /mealCategories/{document}` ergänzen, drei Regeltests.
- [x] Komponententests `CategoriesArea.test.tsx` und `MealsArea.test.tsx`: Anlegen,
  Duplikat, leere Kategorie "Pasta, 0", Umbenennen und Löschen einer leeren und einer
  benutzten Kategorie, Vorschlag im Gericht-Formular, Filter ohne leere Kategorie, axe
  ohne Befund.
- [x] `docs/architektur/05-bausteinsicht.md`: in Ebene 1 bei `shopping`
  "Artikelkategorien" und bei `meals` den Gerichtskategorien-Katalog nennen, in Ebene 2
  `ItemCategoriesArea`, `ItemCategoriesClient` und `categorizedList` eintragen.
- [x] `.claude/projekt.md`: Beschreibung des Kontexts `shopping` um "nach
  Ladenreihenfolge ordnen" ergänzen.

**Automatisierte Verifikation**:

- [x] `npm run test`, `npm run lint`, `npm run build` grün bzw. ohne Befund
- [x] `npm run test:rules` grün
- [x] `npm run test:e2e` grün

**Manuelle Verifikation**:

- [x] Vor der Freigabe die Regeln von Hand ausrollen:
  `npx firebase deploy --only firestore:rules --project mahlzeiten-planer-ecd26`.
  Danach in der Produktion eine Artikelkategorie und eine Gerichtskategorie anlegen,
  und beide sind nach einem Neuladen noch da.
- [x] Auf dem iPhone mit VoiceOver: Das "+" ist auf allen vier Verwaltungsseiten
  erreichbar und wird mit seinem Namen angesagt. Der Positions-Spinner lässt sich per
  Wischen nach oben und unten verstellen.

## Notizen zur Umsetzung

- Phase 1: Im E2E zeigte sich, dass die Momentaufnahme eines früheren eigenen
  Schreibvorgangs (IndexedDB-Persistenz) erst nach dem nächsten Schreiben eintreffen
  kann. Dann stand kurz der alte Katalog da, und "Kategorie anlegen" übernahm eine zu
  kleine Endposition. `useItemCategories` überspringt deshalb wie `useWeekPlan` veraltete
  Momentaufnahmen (`isStaleSnapshot` mit `sameItemCategoryCatalog`). Dafür ist
  `unconfirmedWrite.ts` von `meals/domain` nach `shared/domain` gewandert, damit
  `shopping` nicht aus `meals` importiert. Das Formular friert die höchste Position beim
  Öffnen ein.
- Phase 1: `SpinArrow` liegt jetzt in `shared/ui/SpinArrow.tsx` (aus `AmountSpinner`
  herausgezogen). Neu in der Domäne: `placedItemCategory` (Kategorie samt Platz), von
  `addCategory`/`changeCategory` zurückgegeben für die Ansagen.
- Phase 2: Die Fabrik für neue Katalogeinträge nimmt einen fertigen `CatalogEntry`
  entgegen (`(entry) => Entry`) statt `(name, usedAt)`. Die generischen Funktionen
  heißen `recordCatalogUse`, `withCatalogNamesInUse`, `entriesByName`, damit
  `knownItem.ts` seine bisherigen Namen behält. `categoryToAssign` liefert in `created`
  die angelegte Kategorie samt Platz (`PlacedItemCategory`), damit die Ansage den
  bereinigten Namen nennt. `useItemCategories` trennt `planCategoryAssignment` und
  `applyCategoryAssignment`, damit bei einem abgelehnten Artikelnamen keine Kategorie
  entsteht. `recordUse` der Domäne nimmt die optionale Kategorie ebenfalls (für den
  In-Memory-Adapter).
- Phase 3: `firstFrozenList` setzt die schon angehängten eigenen Artikel per
  `insertIntoFrozenList` in ihre Gruppe statt ans Ende, sonst entstünden doppelte
  Überschriften. Das Einfrieren und das Umgruppieren beim Schalter passieren nicht in
  einem Effekt, sondern als Zustandsanpassung beim Rendern (wie `itemToRemoveIsGone` in
  `ShoppingArea`). `Grouping` trägt zusätzlich `grouped`, damit `groupOfAddedItem` bei
  abgeschalteter Sortierung `null` liefert. `regroupFrozenList` lässt IDs fallen, die
  in den Live-Daten fehlen (sie wären ohnehin unsichtbar). Neu: `showsSectionHeadings`,
  `listSectionHeading`. `useShoppingList` bekommt `catalog` und ein gemeinsames
  `catalogsLoaded` (Artikel- und Kategorienkatalog).
- Phase 4: Die Pflicht zur Kategorie bei "Mit Kategorie hinzufügen" prüft die Domäne
  (`ensureCategoryChosen` wirft `ItemCategoryMissing`). Die Ansage setzt
  `withAssignedCategoryPhrase` zusammen. `ShoppingArea` bekommt die Kategorie-Wahl als
  ein Objekt `categoryChoice` (`isKnownName`, Vorschläge, Planen und Übernehmen der
  Zuordnung). Statt eines E2E-Helfers mit `{ isNew }` gibt es in
  `e2e/shoppingList.spec.ts` `addNewItem` und `addKnownItem`; in den Unit-Tests klickt
  der Helfer "Ohne Kategorie hinzufügen", falls der Dialog erscheint (In-Memory ist
  deterministisch). Im E2E kam die Momentaufnahme eines gerade in den Einstellungen
  angelegten Artikels erst nach dem Absenden an. Der Test wartet deshalb auf den
  Katalogeintrag auf dem Server. Im echten Betrieb kann der Dialog in diesem Fall
  ebenso einmal unnötig erscheinen, wenn man sehr schnell ist.
- Phase 6: Der Firestore-Adapter der Gerichtskategorien meldet Schreibfehler wie die
  übrigen Adapter in `meals` über `onWriteFailure` ("Konnte nicht gespeichert werden."),
  nicht stumm über `ignoreFailure`. `useMealCategories` liefert `names` und `writeNames`
  und überspringt veraltete Momentaufnahmen wie `useItemCategories`. Neu in der Domäne:
  `mealCategoryNamesFromStored`, `sameCatalogNames`. Die Regeln für `itemCategories` und
  `mealCategories` sind am 2026-10-30 ausgerollt; die Prüfung in der Produktion steht aus.

## Verweise

- `docs/agents/plans/2026-09-25-einheiten-verwaltung.md` (MZP-034) – Muster für Katalog,
  Verwaltung und gemeinsame Katalogfunktionen
- `docs/agents/plans/2026-09-18-artikelverwaltung-und-einstellungen.md` – Artikel-
  Verwaltung
- `docs/agents/plans/2026-09-24-kategorien-fuer-gerichte.md` – Gerichtskategorien
- `src/shopping/domain/stableList.ts` – eingefrorene Liste
- `src/shared/ui/SpinButton.tsx` – Spinner für die Position
- `docs/notes.txt` – Hinweis auf das manuelle Ausrollen der Firestore-Regeln
