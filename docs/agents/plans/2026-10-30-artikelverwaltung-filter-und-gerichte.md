---
date: 2026-10-30T13:23:39.072419+00:00
git_commit: 5d23571430af75428f4777615b5ec92f65ee15bb
branch: main
story: MZP-048
topic: "Artikelverwaltung: Kategorienfilter und Gerichte je Artikel"
tags: [plan, shopping, meals, settings, ui, voiceover]
status: done
---

# PLAN: MZP-048 — Artikelverwaltung: Kategorienfilter und Gerichte je Artikel

In den Einstellungen unter "Artikel" lässt sich die Liste nach Artikelkategorie
filtern. Jede Zeile nennt die Zahl der Gerichte, in denen der Artikel vorkommt. Auf
"Artikel bearbeiten" stehen diese Gerichte mit je einem Mülleimer, mit dem der Artikel
sofort aus dem Gericht verschwindet. Benennt man einen Artikel um, ändert sich sein
Name auch in allen Gerichten. Der Löschdialog weist auf die Gerichte hin, in denen der
Artikel weiter steht.

Alle Entscheidungen stammen aus der Befragung vom 2026-10-30.

## Akzeptanzkriterien

### Kategorienfilter

- Die Artikelliste zeigt unter der Überschrift ein Auswahlfeld mit dem Label "Filter".
  Es enthält "Alle", dann in einer `optgroup` "Kategorie" alle Artikelkategorien in
  Ladenreihenfolge (auch solche ohne Artikel) und am Ende "Ohne Kategorie".
- Gibt es noch keine Artikelkategorie, fehlt der Filter.
- Ist ein Filter aktiv, zeigt die `h1` "Artikel, 5 / 57" und VoiceOver liest
  "Artikel, 5 von 57". Ohne Filter bleibt sie wie heute ("Artikel, 57" bzw.
  "Artikel, keine").
- Ist ein Filter aktiv, steht neben dem Auswahlfeld ein ✕-Knopf "Filter
  zurücksetzen". Er stellt "Alle" ein und legt den Fokus zurück auf das Auswahlfeld.
- Beim Wechsel kommt die Ansage "Backen, 5 von 57 Artikeln." bzw. "Ohne Kategorie,
  3 von 57 Artikeln.", beim Zurücksetzen "Filter zurückgesetzt, 57 Artikel." (bei
  einem: "1 Artikel").
- Passt kein Artikel zum Filter, steht statt der Liste "Keine Artikel in dieser
  Auswahl.". "Noch keine Vorschläge." bleibt dem leeren Katalog vorbehalten.
- Zu "Ohne Kategorie" gehören Artikel mit `categoryId` `null` und Artikel, deren
  Kategorie es nicht mehr gibt.
- Der Filter bleibt gesetzt, wenn man einen Artikel öffnet, bearbeitet, löscht oder
  neu anlegt und zur Liste zurückkehrt. Beim Verlassen der Artikelverwaltung geht er
  verloren.
- Wird die gewählte Kategorie gelöscht (auch auf dem anderen Gerät), springt der
  Filter auf "Alle" zurück. Er wird nicht wieder gewählt, wenn eine gleichnamige
  Kategorie entsteht.

### Gerichtezahl in der Zeile

- Die Zeile lautet "Mehl (Backen), 3 Gerichte", bei einem Gericht "Mehl (Backen),
  1 Gericht", ohne Kategorie "Mehl, 3 Gerichte". Steckt der Artikel in keinem
  Gericht, fehlt der Zusatz.
- Jedes Gericht zählt einmal, auch wenn es den Artikel mehrfach enthält.
  Ausgeblendete Gerichte zählen mit.
- Verglichen wird der normalisierte Name (Groß- und Kleinschreibung sowie
  mehrfache oder umgebende Leerzeichen spielen keine Rolle).
- Der Mülleimer der Zeile behält sein `aria-label` "Löschen, Mehl".

### Hinweis im Löschdialog

- Steckt der Artikel in mindestens einem Gericht, steht im Dialog "Mehl löschen?"
  unter dem bisherigen Absatz: "Mehl steht noch in 3 Gerichten und bleibt dort
  erhalten." (bei einem: "in 1 Gericht"). Sonst fehlt der Absatz.
- Löschen ändert keine Gerichte.

### Gerichte auf "Artikel bearbeiten"

- Unter Name, Kategorie und Fehlerzeile steht eine `h2` "Gerichte, 3" (bei null
  "Gerichte, keine"), darunter eine `ul.itemList` mit den Gerichten in
  alphabetischer Reihenfolge. Jede Zeile zeigt den Gerichtnamen und einen Mülleimer
  mit `aria-label` "Entfernen, Pizza".
- Ohne Gerichte steht statt der Liste "In keinem Gericht verwendet.".
- "Artikel anlegen" zeigt weder `h2` noch Liste.
- Der Mülleimer wirkt sofort, ohne Sicherheitsabfrage und ohne Speichern. Er entfernt
  alle Positionen dieses Artikels aus dem Gericht. Die übrigen Artikel und Felder des
  Gerichts bleiben unverändert.
- Ansage danach: "Mehl aus Pizza entfernt, noch 2 Gerichte." bzw. "…, noch
  1 Gericht." bzw. "…, in keinem Gericht mehr.".
- Danach liegt der Fokus auf dem Mülleimer des Gerichts, das an die Stelle des
  entfernten rückt, sonst auf dem davor. Ist die Liste leer, liegt er auf der `h2`.
- Getippter, noch nicht gespeicherter Name und getippte Kategorie bleiben erhalten.
- Kommt der Artikel auf dem anderen Gerät in ein Gericht hinzu oder fällt heraus,
  während die Seite offen ist, aktualisieren sich `h2` und Liste.
- Die Liste gehört zum gespeicherten Namen des Artikels, nicht zum gerade getippten.

### Umbenennen in den Gerichten nachziehen

- Speichert man "Artikel bearbeiten" mit einem anderen Namen, auch mit bloß anderer
  Schreibweise ("mehl" → "Mehl"), bekommt in allen Gerichten jede Position mit dem
  alten Namen den neuen. Die Mengen bleiben gleich.
- Enthält ein Gericht schon eine Position mit dem neuen Namen, bleiben beide
  Positionen getrennt stehen. Mengen werden nicht zusammengerechnet.
- Alle betroffenen Gerichte werden in einem Schreibvorgang (`changeMeals`) geändert.
- Ansage: "Weizenmehl gespeichert, in 3 Gerichten umbenannt." bzw. "…, in 1 Gericht
  umbenannt.". Ändert sich kein Gericht, bleibt sie wie heute "Weizenmehl
  gespeichert.". Ein Zusatz zur neu angelegten Kategorie folgt wie bisher dahinter.
- Ändert sich nur die Kategorie, bleiben die Gerichte unberührt.

### Übergreifend

- Alle neuen und geänderten Seiten sind ohne axe-Befund.
- Die bestehenden Tests laufen grün.

### Bewusste Grenzen

- Löschen eines Artikels entfernt ihn nicht aus den Gerichten (Entscheidung der
  Befragung, Variante A).
- Katalog und Gerichte werden beim Umbenennen in zwei getrennten Schreibvorgängen
  geändert, nicht atomar.
- Der Filter wird nicht über das Verlassen der Artikelverwaltung hinaus gemerkt.

## Wesentliche Entscheidungen und Abwägungen

1. **Kontextgrenze: `shopping` bekommt die Gerichte nur als fertige Sicht.**
   - Warum: `shopping` und `meals` kennen einander nicht. Die Verbindung stellt
     allein `SignedInApp.tsx` her (`docs/architektur/05-bausteinsicht.md`, 5.1).
   - Auswirkung: `shopping/domain/knownItem.ts` definiert den eigenen Typ
     `MealUsingItem = { mealId: string; mealName: string }`. `KnownItemsArea`
     erhält von `SignedInApp` drei Props: `mealsUsingItem(name)`,
     `onRemoveItemFromMeal(mealId, name)` und `onKnownItemRenamed(from, to)`. Die
     letzte liefert die Zahl der geänderten Gerichte zurück. Die Regeln (Gerichte zu
     einem Artikel finden, Artikel aus Gericht entfernen, Artikel in Gerichten
     umbenennen) liegen test-getrieben als reine Funktionen in
     `meals/domain/meal.ts`.

2. **Ein Namensindex statt Suche je Zeile.**
   - Warum: Die Artikelliste zählt für jeden Artikel die Gerichte. Ein Durchlauf über
     alle Gerichte je Zeile normalisiert pro Renderdurchgang viele tausend Namen.
   - Auswirkung: `mealsByItemName(meals)` baut einmal je Render eine `Map`
     (normalisierter Artikelname → Gerichte, je Gericht einmal, alphabetisch).
     `SignedInApp` übersetzt den Lookup in `MealUsingItem`.

3. **Eigene Filterkomponente in `shopping`.**
   - Warum: `shopping/ui` darf `meals/ui/MealFilterSelect` nicht importieren. Die
     Optionen unterscheiden sich außerdem (Kategorie-IDs, "Ohne Kategorie", keine
     Art).
   - Auswirkung: `KnownItemFilterSelect` übernimmt Aufbau, Ids und die CSS-Klasse
     `mealFilter` von `MealFilterSelect`. `CrossIcon` zieht von `meals/ui` nach
     `shared/ui`. Die Filterregel liegt in `shopping/domain/knownItem.ts`:
     `KnownItemFilter = { by: 'category'; categoryId } | { by: 'uncategorized' }`.

4. **Der Filterzustand liegt in `KnownItemsArea`.**
   - Warum: Er soll das Öffnen eines Artikels überstehen. Die Area bleibt dabei
     gemountet, die Listenseite nicht.
   - Auswirkung: Eine verschwundene Kategorie setzt den gemerkten Filter während des
     Renderns auf `null`, wie in `SuppliesArea.tsx:59`. Damit tritt der für die
     Gerichte notierte Bug (notes.txt, "eine verschwundene Filteroption bleibt
     gemerkt") hier nicht auf.

5. **`ManagementHeader` bekommt ein optionales `headingLabel`.**
   - Warum: Sichtbar "5 / 57" wie bei Gerichten und Vorräten, vorgelesen "5 von 57"
     (`MealListPage.tsx:49-53`).
   - Auswirkung: `aria-label` an der `h1` nur, wenn `headingLabel` gesetzt ist. Die
     übrigen Verwaltungsseiten bleiben unverändert.

6. **Umbenennen in den Gerichten zieht `SignedInApp` nach.**
   - Warum: Nur die Kompositionswurzel kennt beide Kontexte.
   - Auswirkung: `KnownItemsArea.changeKnownItem` ruft nach `renameKnownItem`
     `onKnownItemRenamed(knownItem.name, rename.written.name)` auf und hängt die
     Zahl an die Ansage. `SignedInApp` schreibt mit einem `meals.changeMeals`. Bei
     einer leeren Liste schreibt `changeMeals` nichts
     (`firestoreMealsClient.ts:120`).

## Ausgangslage

```
Einstellungen ─► "Artikel"   (SignedInApp.tsx:262)
                  │
                  ▼
            KnownItemsArea   Seitenzustand: list | create | form(name) | delete(name)
             ├─ KnownItemListPage    ManagementHeader "Artikel, 57" [+]
             │    └─ KnownItemListRow  "Mehl (Backen)"  [🗑 Löschen, Mehl]
             ├─ KnownItemFormPage    Name, Kategorie, [Speichern]
             └─ DeleteKnownItemPage  "Mehl löschen?"
```

- Gerichte verweisen auf Artikel nur über den Namen: `MealItem = { name, quantity }`
  (`src/meals/domain/meal.ts:14`). Ein Gericht darf denselben Artikel mehrfach
  enthalten (`MealItemsEditor.tsx:100` entfernt nach Position).
- `normalizeMealName` (`meal.ts:121`) und `normalizeItemName`
  (`shopping/domain/shoppingItem.ts:61`) normalisieren gleich.
- Das Umbenennen ändert heute nur den Katalog (`KnownItemsArea.tsx:70`,
  `planCatalogRename` in `catalogEntry.ts:74`, das bei vorhandenem Zielnamen
  zusammenführt). Die Gerichte behalten den alten Namen. `withNamesInUse`
  (`SignedInApp.tsx:196`) mischt ihn deshalb weiter in die Vorschläge.
- `knownItemsWithoutCategory` (`knownItem.ts:158`) und `findItemCategory`
  (`itemCategory.ts:185`) gibt es schon.
- Fokus nach dem Entfernen einer Zeile regelt `useFocusAfterRemoval`
  (`src/shared/ui/useFocusAfterRemoval.ts`), genutzt z. B. in `SupplyListPage.tsx:43`.

Heute: Artikelliste

```
[Zurück zu den Einstellungen]
# Artikel, 57                          [+]
Backpapier (Haushalt)                 [🗑]
Mehl (Backen)                         [🗑]
Zahnpasta                             [🗑]
```

Heute: "Artikel bearbeiten"

```
[Zurück zu den Artikeln]
# Artikel bearbeiten
Name       [Mehl            ]
Kategorie  [Backen          ]
(Fehlerzeile)
═════════ [💾 Speichern] ═════════
```

Heute: Löschdialog

```
[Zurück zu den Artikeln]
# Mehl löschen?
Der Vorschlag wird für beide Geräte entfernt. Wird der Name wieder
verwendet, entsteht er neu.
[Löschen] [Abbrechen]
```

## Zielbild

```
SignedInApp
  index = mealsByItemName(meals.meals)                       (meals/domain)
  <KnownItemsArea
     mealsUsingItem={(name) => usages aus index}             → MealUsingItem[]
     onRemoveItemFromMeal={(mealId, name) =>
        meals.changeMeal(mealId, withoutItem(meal, name))}   (meals/domain)
     onKnownItemRenamed={(from, to) => {
        changed = withItemRenamed(meals.meals, from, to)     (meals/domain)
        meals.changeMeals(changed); return changed.length }}
  />
```

Neu: Artikelliste ohne Filter

```
[Zurück zu den Einstellungen]
# Artikel, 57                          [+]
Filter [ Alle                 ▾ ]
Backpapier (Haushalt)                 [🗑]
Mehl (Backen), 3 Gerichte             [🗑]
Zahnpasta                             [🗑]
```

Neu: Artikelliste mit Filter

```
[Zurück zu den Einstellungen]
# Artikel, 2 / 57                      [+]      (vorgelesen: "Artikel, 2 von 57")
Filter [ Backen               ▾ ] [✕]
Hefe (Backen), 1 Gericht              [🗑]
Mehl (Backen), 3 Gerichte             [🗑]
```

Auswahlfeld geöffnet:

```
Alle
── Kategorie ──
Obst/Gemüse
Backen
Kühlregal
Drogerie
Ohne Kategorie
```

Leere Auswahl:

```
# Artikel, 0 / 57                      [+]
Filter [ Drogerie             ▾ ] [✕]
Keine Artikel in dieser Auswahl.
```

Neu: "Artikel bearbeiten"

```
[Zurück zu den Artikeln]
# Artikel bearbeiten
Name       [Mehl            ]
Kategorie  [Backen          ]
(Fehlerzeile)
## Gerichte, 3
Pfannkuchen                           [🗑]   (Entfernen, Pfannkuchen)
Pizza                                 [🗑]
Zwiebelkuchen                         [🗑]
═════════ [💾 Speichern] ═════════
```

ohne Gerichte:

```
## Gerichte, keine
In keinem Gericht verwendet.
```

Neu: Löschdialog

```
[Zurück zu den Artikeln]
# Mehl löschen?
Der Vorschlag wird für beide Geräte entfernt. Wird der Name wieder
verwendet, entsteht er neu.
Mehl steht noch in 3 Gerichten und bleibt dort erhalten.
[Löschen] [Abbrechen]
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `meal.ts`
    - `mealsByItemName(meals)` - neu: `ReadonlyMap<string, readonly Meal[]>`,
      Schlüssel `normalizeMealName(item.name)`, je Gericht einmal, Reihenfolge der
      Eingabe (`meals.meals` ist schon `byName`)
    - `withoutItem(meal, name)` - neu: `NewMeal` ohne alle Positionen mit diesem
      normalisierten Namen
    - `withItemRenamed(meals, from, to)` - neu: nur die tatsächlich geänderten
      `Meal`s, Positionen mit normalisiertem `from` heißen danach exakt `to`
  - `meal.test.ts` - Tests für alle drei
- `src/shopping/domain`
  - `knownItem.ts`
    - `MealUsingItem` - neu: `{ mealId: string; mealName: string }`
    - `KnownItemFilter` - neu: `{ by: 'category'; categoryId: ItemCategoryId } |
      { by: 'uncategorized' }`
    - `knownItemsMatching(knownItems, catalog, filter)` - neu, `null` → alle
    - `knownFilterIn(catalog, chosen)` - neu: `null`, wenn die Kategorie fehlt
  - `announcements.ts`
    - `knownItemsHeading(count, filteredFromCount?)` - erweitert um "N von M"
    - `shownKnownItemsCount(shown, filteredFromCount)` - neu: "N / M"
    - `knownItemFilterName(catalog, filter)` - neu
    - `knownItemFilterAnnouncement`, `knownItemFilterResetAnnouncement` - neu
    - `knownItemRowLabel(knownItem, category, mealCount)` - erweitert
    - `knownItemInMealsNote(name, mealCount)` - neu, für den Löschdialog
    - `usingMealsHeading(count)` - neu: "Gerichte, N" / "Gerichte, keine"
    - `itemRemovedFromMealAnnouncement(itemName, mealName, remaining)` - neu
    - `knownItemSavedAnnouncement(name, renamedMealCount)` - erweitert
  - `knownItem.test.ts`, `announcements.test.ts` - Tests dazu
- `src/shared/ui`
  - `CrossIcon.tsx` - verschoben aus `src/meals/ui`, Import in
    `MealFilterSelect.tsx` anpassen
  - `ManagementHeader.tsx` - optionale Prop `headingLabel`
- `src/shopping/ui`
  - `KnownItemFilterSelect.tsx` - neu, nach `MealFilterSelect`
  - `KnownItemListPage.tsx` - Filter, Überschrift, Leertext, Gerichtezahl je Zeile
  - `KnownItemListRow.tsx` - Prop `mealCount`
  - `KnownItemFormPage.tsx` - optionale Prop `usingMeals` samt Entfernen
  - `UsingMeals.tsx` - neu: `h2`, Liste mit Mülleimern, Leertext, Fokus
  - `DeleteKnownItemPage.tsx` - Prop `mealCount`
  - `KnownItemsArea.tsx` - Filterzustand, neue Props, Ansagen
  - `KnownItemsArea.test.tsx` - Testaufbau mit Fakes für die neuen Props, neue Fälle
- `src/SignedInApp.tsx` - Index bauen, drei Props übergeben
- `src/SignedInApp.test.tsx` - je ein Fall für Zählung, Entfernen und Umbenennen über
  echte In-Memory-Clients
- `e2e/settings.spec.ts` - ein Ablauf: Gericht mit Artikel anlegen, in der
  Artikelverwaltung aus dem Gericht entfernen, nach dem Neuladen fehlt der Artikel
  im Gericht
- `docs/architektur/05-bausteinsicht.md` - Satz zur Verbindung von `shopping` und
  `meals` ergänzen

Neues CSS ist nicht nötig. Die Filterleiste nutzt `.mealFilter`, die Gerichtezeilen
nutzen `.mealItemRow` wie im `MealItemsEditor`, beides mit `iconButton` und `TrashIcon`.

## Umsetzung

### Phase 1: Kategorienfilter in der Artikelliste

Abhängigkeiten: keine

Die Artikelliste lässt sich nach Kategorie und "Ohne Kategorie" filtern.

**Aufgaben**:
- [x] Test zuerst (`src/shopping/domain/knownItem.test.ts`), danach Umsetzung in
  `knownItem.ts`:
  - `knownItemsMatching(knownItems, catalog, null)` liefert alle unverändert
  - `{ by: 'category', categoryId: 'c1' }` liefert nur Artikel mit `c1`
  - `{ by: 'uncategorized' }` liefert Artikel mit `null` und mit verwaister ID
  - `knownFilterIn(catalog, chosen)` gibt `chosen` zurück, solange die Kategorie im
    Katalog steht, sonst `null`. `uncategorized` und `null` bleiben unverändert.
  ```ts
  export type KnownItemFilter =
    | { by: 'category'; categoryId: ItemCategoryId }
    | { by: 'uncategorized' }

  export function knownItemsMatching(
    knownItems: readonly KnownItem[],
    catalog: ItemCategoryCatalog,
    filter: KnownItemFilter | null,
  ): readonly KnownItem[] {
    if (filter === null) return knownItems
    return knownItems.filter((knownItem) =>
      filter.by === 'category'
        ? knownItem.categoryId === filter.categoryId
        : findItemCategory(catalog, knownItem.categoryId) === null,
    )
  }
  ```
- [x] Test zuerst, dann Texte in `src/shopping/domain/announcements.ts`:
  - `knownItemsHeading(57)` → "Artikel, 57", `knownItemsHeading(0)` → "Artikel,
    keine", `knownItemsHeading(5, 57)` → "Artikel, 5 von 57", `knownItemsHeading(0,
    57)` → "Artikel, 0 von 57"
  - `shownKnownItemsCount(5, null)` → "5", `shownKnownItemsCount(5, 57)` → "5 / 57"
  - `knownItemFilterName(catalog, { by: 'category', categoryId })` → Kategoriename,
    `{ by: 'uncategorized' }` → "Ohne Kategorie"
  - `knownItemFilterAnnouncement(name, 5, 57)` → "Backen, 5 von 57 Artikeln.",
    bei einem Artikel insgesamt → "Backen, 1 von 1 Artikel."
  - `knownItemFilterResetAnnouncement(57)` → "Filter zurückgesetzt, 57 Artikel.",
    bei 1 → "Filter zurückgesetzt, 1 Artikel."
- [x] `src/meals/ui/CrossIcon.tsx` nach `src/shared/ui/CrossIcon.tsx` verschieben,
  Import in `MealFilterSelect.tsx` anpassen.
- [x] `ManagementHeader`: optionale Prop `headingLabel?: string`, als `aria-label`
  der `h1`.
- [x] `src/shopping/ui/KnownItemFilterSelect.tsx` anlegen. Props: `catalog`,
  `activeFilter`, `onChooseFilter`. Werte: `''` für "Alle",
  `category:<id>` je Kategorie in `catalog.categories`-Reihenfolge innerhalb
  `<optgroup label="Kategorie">`, `uncategorized` für "Ohne Kategorie" am Ende
  (außerhalb der `optgroup`). Label "Filter", `id="knownItemFilter"`, Hülle
  `div.mealFilter`. Bei aktivem Filter ein `iconButton` mit `CrossIcon` und
  `aria-label` "Filter zurücksetzen", der `onChooseFilter(null)` ruft und das
  Auswahlfeld fokussiert.
- [x] `KnownItemListPage`: Props `shownKnownItems` (gefiltert), `totalCount`,
  `activeFilter`, `onChooseFilter`. Überschrift sichtbar `Artikel,
  ${shownKnownItemsCount(...)}` bzw. ohne Filter `knownItemsHeading(totalCount)`,
  `headingLabel={knownItemsHeading(shown, totalCount)}` nur bei aktivem Filter.
  `KnownItemFilterSelect` nur bei `catalog.categories.length > 0`. Leertexte: bei
  `totalCount === 0` "Noch keine Vorschläge.", sonst bei leerer Auswahl "Keine
  Artikel in dieser Auswahl.".
- [x] `KnownItemsArea`: `const [chosenFilter, setChosenFilter] =
  useState<KnownItemFilter | null>(null)`, `activeFilter = knownFilterIn(catalog,
  chosenFilter)`, bei `chosenFilter !== null && activeFilter === null` während des
  Renderns `setChosenFilter(null)` wie `SuppliesArea.tsx:59`. `chooseFilter`
  setzt den Zustand und sagt an (`knownItemFilterAnnouncement` mit
  `knownItemFilterName` bzw. `knownItemFilterResetAnnouncement`).
- [x] UI-Tests in `src/shopping/ui/KnownItemsArea.test.tsx`:
  - ohne Kategorien gibt es kein Auswahlfeld "Filter"
  - die Optionen lauten "Alle", die Kategorien in Katalogreihenfolge (auch eine
    ohne Artikel), "Ohne Kategorie"
  - Kategorie wählen: Liste zeigt nur deren Artikel, `h1` hat den Namen "Artikel,
    2 von 5" und den Text "Artikel, 2 / 5", Ansage "Backen, 2 von 5 Artikeln."
  - "Ohne Kategorie" zeigt Artikel mit `null` und mit verwaister ID
  - leere Kategorie zeigt "Keine Artikel in dieser Auswahl."
  - "Filter zurücksetzen": alle Artikel, Ansage "Filter zurückgesetzt, 5 Artikel.",
    Fokus auf dem Auswahlfeld, ✕-Knopf weg
  - Artikel öffnen und "Zurück zu den Artikeln": Filter bleibt gesetzt
  - gewählte Kategorie wird im `itemCategoriesClient` entfernt: Filter steht auf
    "Alle", eine danach gleichnamig neu angelegte Kategorie wird nicht gewählt
  - axe ohne Befund mit aktivem Filter

**Automatisierte Verifikation**:
- [x] `npm run test` läuft grün, inklusive der bestehenden `MealsArea`- und
  `SuppliesArea`-Tests nach dem Umzug von `CrossIcon`
- [x] `npm run lint` läuft durch (Architekturregel inklusive)
- [x] `npm run build` läuft durch

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver: Das Auswahlfeld "Filter" öffnet die Liste mit
  Kategorien und "Ohne Kategorie". Nach der Wahl kommt die Ansage, und die
  Überschrift wird als "Artikel, N von M" gelesen.

### Phase 2: Gerichtezahl in Zeile und Löschdialog

Abhängigkeiten: Phase 1 (gleiche Dateien, keine fachliche Abhängigkeit)

Die Artikelverwaltung erfährt über `SignedInApp`, welche Gerichte einen Artikel
enthalten, und zeigt die Zahl.

**Aufgaben**:
- [x] Test zuerst (`src/meals/domain/meal.test.ts`), dann `mealsByItemName` in
  `meal.ts`:
  - ein Gericht mit "Mehl" und "mehl " erscheint unter `mehl` genau einmal
  - zwei Gerichte erscheinen in der Reihenfolge der Eingabe
  - ausgeblendete Gerichte sind enthalten
  - ein Gericht ohne Artikel taucht nirgends auf
- [x] Test zuerst, dann in `src/shopping/domain/announcements.ts`:
  - `knownItemRowLabel(knownItem, category, 0)` wie heute,
    `knownItemRowLabel(mehl, backen, 3)` → "Mehl (Backen), 3 Gerichte",
    `(mehl, null, 1)` → "Mehl, 1 Gericht"
  - `knownItemInMealsNote('Mehl', 3)` → "Mehl steht noch in 3 Gerichten und bleibt
    dort erhalten.", bei 1 → "… in 1 Gericht …"
- [x] `MealUsingItem` in `src/shopping/domain/knownItem.ts` anlegen.
- [x] `KnownItemsArea`: neue Prop `mealsUsingItem: (name: string) => readonly
  MealUsingItem[]`. An `KnownItemListPage` reichen. `DeleteKnownItemPage` bekommt
  `mealCount={mealsUsingItem(addressedKnownItem.name).length}`.
- [x] `KnownItemListPage` reicht `mealCount={mealsUsingItem(knownItem.name).length}`
  an `KnownItemListRow`. Diese übergibt ihn an `knownItemRowLabel`.
- [x] `DeleteKnownItemPage`: Prop `mealCount`. Bei `> 0` ein zweiter `p` mit
  `knownItemInMealsNote`.
- [x] `SignedInApp`:
  ```tsx
  const mealsByItem = mealsByItemName(meals.meals)

  function mealsUsingItem(name: string): readonly MealUsingItem[] {
    return (mealsByItem.get(normalizeMealName(name)) ?? []).map((meal) => ({
      mealId: meal.id,
      mealName: meal.name,
    }))
  }
  ```
  und `mealsUsingItem={mealsUsingItem}` an `KnownItemsArea`.
- [x] `KnownItemsArea.test.tsx`: `renderKnownItemsArea` nimmt optional eine Zuordnung
  Artikelname → `MealUsingItem[]` und baut daraus eine einfache Funktion (kein Mock).
  Neue Fälle:
  - Zeile "Mehl (Backen), 3 Gerichte", "Hefe, 1 Gericht", ein Artikel ohne Gerichte
    ohne Zusatz, `aria-label` der Mülleimer unverändert "Löschen, Mehl"
  - Löschdialog mit Gerichten zeigt den Hinweis, ohne Gerichte nicht
- [x] `SignedInApp.test.tsx`: Ein Gericht "Pizza" mit "Mehl" im
  In-Memory-`MealsClient`, ein Katalogartikel "mehl". In Einstellungen → Artikel
  lautet die Zeile "mehl, 1 Gericht".
- [x] `docs/architektur/05-bausteinsicht.md`, 5.1: Der Satz zur einzigen Verbindung
  wird erweitert. `SignedInApp` überträgt außerdem Gerichte auf die Einkaufsliste,
  reicht der Artikelverwaltung die Gerichte je Artikel und zieht das Entfernen und
  Umbenennen von Artikeln in den Gerichten nach.

**Automatisierte Verifikation**:
- [x] `npm run test` läuft grün
- [x] `npm run lint` läuft durch
- [x] `npm run build` läuft durch

### Phase 3: Gerichte auf "Artikel bearbeiten" mit Mülleimer

Abhängigkeiten: Phase 2

Auf der Bearbeiten-Seite stehen die Gerichte des Artikels, und ein Tipp auf den
Mülleimer nimmt ihn aus dem Gericht.

**Aufgaben**:
- [x] Test zuerst (`meal.test.ts`), dann `withoutItem(meal, name): NewMeal` in
  `meal.ts`: entfernt alle Positionen mit normalisiert gleichem Namen, alle anderen
  Felder (Name, Kategorien, Art, `hidden`, `leftovers`, Notizen, Rezept) und die
  übrigen Positionen samt Reihenfolge bleiben gleich. Der Aufbau des `NewMeal`
  folgt `withHiding` (`meal.ts:95`). Gemeinsames lässt sich in eine kleine Hilfe
  `newMealOf(meal)` ziehen, wenn sich das anbietet.
- [x] Test zuerst, dann in `announcements.ts`:
  - `usingMealsHeading(0)` → "Gerichte, keine", `(3)` → "Gerichte, 3"
  - `itemRemovedFromMealAnnouncement('Mehl', 'Pizza', 2)` → "Mehl aus Pizza
    entfernt, noch 2 Gerichte.", `1` → "…, noch 1 Gericht.", `0` → "…, in keinem
    Gericht mehr."
- [x] `src/shopping/ui/UsingMeals.tsx` anlegen. Props: `usingMeals: readonly
  MealUsingItem[]`, `onRemove: (usingMeal: MealUsingItem) => void`. Inhalt: `h2`
  mit `usingMealsHeading`, `tabIndex={-1}` und Ref als Fallback. Danach
  `ul.itemList` mit `li.mealItemRow` je Gericht (`key` = `mealId`): `span` mit
  `mealName`, `iconButton` mit `TrashIcon` und `aria-label` `Entfernen,
  ${mealName}`. Bei leerer Liste `p` "In keinem Gericht verwendet.". Fokus über
  `useFocusAfterRemoval(usingMeals.map((one) => one.mealId), headingRef)`:
  `keepRow` an den Mülleimer-Knöpfen. Beim Tipp `rowRemovedAt(position)`. Ist es
  das einzige Gericht der Liste, stattdessen `fallbackAfterRemoval()`. Danach
  `onRemove`.
- [x] `KnownItemFormPage`: optionale Prop `usingMeals` und `onRemoveFromMeal`. Ist
  sie gesetzt, steht `<UsingMeals …/>` nach der Fehlerzeile und vor der `BottomBar`.
  Die Feldzustände bleiben unberührt, da die Seite gemountet bleibt.
- [x] `KnownItemsArea`: neue Prop `onRemoveItemFromMeal: (mealId: string, name:
  string) => void`. Im Fall `form` werden `usingMeals={mealsUsingItem(
  addressedKnownItem.name)}` und ein Handler übergeben. Der Handler ruft
  `onRemoveItemFromMeal(usingMeal.mealId, addressedKnownItem.name)` und sagt
  `itemRemovedFromMealAnnouncement(addressedKnownItem.name, usingMeal.mealName,
  usingMeals.length - 1)` an.
- [x] `SignedInApp`:
  ```tsx
  function removeItemFromMeal(mealId: MealId, name: string) {
    const meal = meals.meals.find((one) => one.id === mealId)
    if (meal !== undefined) meals.changeMeal(mealId, withoutItem(meal, name))
  }
  ```
- [x] `KnownItemsArea.test.tsx`: Die Fake-Zuordnung aus Phase 2 wird zustandsbehaftet.
  Der Test hält die Gerichte in einem kleinen Objekt, `onRemoveItemFromMeal` streicht
  daraus und rendert neu (`rerender`). Neue Fälle:
  - "Artikel bearbeiten" zeigt `h2` "Gerichte, 2" und "Pfannkuchen", "Pizza" in
    dieser Reihenfolge. Ohne Gerichte erscheinen "Gerichte, keine" und "In keinem
    Gericht verwendet.".
  - "Artikel anlegen" hat keine `h2`
  - Mülleimer "Entfernen, Pizza": Rückruf mit `(pizzaId, 'Mehl')`, Ansage "Mehl aus
    Pizza entfernt, noch 1 Gericht.", Fokus auf "Entfernen, Pfannkuchen"
  - letztes Gericht entfernen: Fokus auf der `h2`, Text "In keinem Gericht
    verwendet."
  - vorher geänderter Name und Kategorie stehen nach dem Entfernen noch in den Feldern
  - axe ohne Befund mit Gerichteliste
- [x] `SignedInApp.test.tsx`: Gericht "Pizza" mit "Mehl, 500 g" und "Hefe" anlegen.
  Unter Einstellungen → Artikel → "Mehl" auf "Entfernen, Pizza" tippen. Danach
  enthält das Gericht im In-Memory-`MealsClient` nur noch "Hefe", die Art und die
  Kategorien sind unverändert.
- [x] `e2e/settings.spec.ts`: neuer Test "removes an item from a meal in the item
  management". Gericht mit zwei Artikeln anlegen, in Einstellungen → Artikel den
  einen öffnen und aus dem Gericht entfernen. Nach dem Neuladen zeigt das Gericht
  nur noch den anderen Artikel.

**Automatisierte Verifikation**:
- [x] `npm run test` läuft grün
- [x] `npm run lint` läuft durch
- [x] `npm run build` läuft durch
- [x] `npm run test:e2e` läuft grün, inklusive des neuen Tests

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver einen Artikel öffnen: Nach der Kategorie folgt
  "Gerichte, N", die Gerichte lassen sich durchwischen. Ein Doppeltipp auf "Entfernen,
  Pizza" sagt an, dass der Artikel entfernt wurde, und der VoiceOver-Cursor steht auf
  dem nächsten Gericht. Auf dem anderen Gerät fehlt der Artikel im Gericht.

### Phase 4: Umbenennen in den Gerichten nachziehen

Abhängigkeiten: Phase 2

Wer einen Artikel umbenennt, findet den neuen Namen auch in den Gerichten.

**Aufgaben**:
- [x] Test zuerst (`meal.test.ts`), dann `withItemRenamed(meals, from, to):
  readonly Meal[]` in `meal.ts`:
  - Positionen mit normalisiert gleichem `from` heißen danach exakt `to`, die Menge
    bleibt
  - steht `to` schon im Gericht, bleiben beide Positionen getrennt
  - "mehl" → "Mehl" ändert die Schreibweise
  - es werden nur Gerichte zurückgegeben, deren Positionen sich tatsächlich ändern.
    Steht dort schon exakt `to`, wird nichts geliefert.
  - die übrigen Felder bleiben unverändert, die `id` bleibt erhalten
- [x] Test zuerst, dann `knownItemSavedAnnouncement(name, renamedMealCount)` in
  `announcements.ts`: `0` → "Weizenmehl gespeichert.", `1` → "Weizenmehl
  gespeichert, in 1 Gericht umbenannt.", `3` → "…, in 3 Gerichten umbenannt.". Die
  bestehenden Aufrufer und Tests anpassen.
- [x] `KnownItemsArea`: neue Prop `onKnownItemRenamed: (from: string, to: string) =>
  number`. In `changeKnownItem` nach `knownItems.renameKnownItem(rename)` aufrufen:
  `const renamedMealCount = onKnownItemRenamed(knownItem.name,
  rename.written.name)`. Die Zahl geht in `knownItemSavedAnnouncement`, das Ergebnis
  wie bisher durch `withCreatedCategoryPhrase`.
- [x] `SignedInApp`:
  ```tsx
  function renameItemInMeals(from: string, to: string): number {
    const changed = withItemRenamed(meals.meals, from, to)
    meals.changeMeals(changed)
    return changed.length
  }
  ```
- [x] `KnownItemsArea.test.tsx`: Der Fake zählt die Aufrufe und liefert eine
  vorgegebene Zahl. Neue Fälle:
  - Umbenennen ruft den Fake mit `('Mehl', 'Weizenmehl')` auf und sagt "Weizenmehl
    gespeichert, in 2 Gerichten umbenannt." an
  - bei 0 bleibt die Ansage "Weizenmehl gespeichert."
  - bei neu angelegter Kategorie folgt der Kategorie-Zusatz hinter "umbenannt."
- [x] `SignedInApp.test.tsx`: Zwei Gerichte mit "Mehl" (eines davon ausgeblendet) und
  eines ohne. "Mehl" in "Weizenmehl" umbenennen: Beide Gerichte enthalten
  "Weizenmehl" mit unveränderter Menge, das dritte bleibt unberührt, und die
  Artikelzeile lautet "Weizenmehl, 2 Gerichte".

**Automatisierte Verifikation**:
- [x] `npm run test` läuft grün
- [x] `npm run lint` läuft durch
- [x] `npm run build` läuft durch

**Manuelle Verifikation**:
- [x] Auf dem Gerät einen Artikel umbenennen, der in Gerichten steckt: Die Ansage
  nennt die Zahl, im Gericht steht der neue Name. Beim Tippen eines Artikels taucht
  der alte Name nicht mehr in den Vorschlägen auf.

## Notizen zur Umsetzung

- `KnownItemFormPage` bekommt `usingMeals` und `onRemoveFromMeal` gebündelt als eine
  optionale Prop `usedInMeals`, damit nicht nur eine der beiden gesetzt sein kann.
- Phase 3 und 4 wurden gemeinsam umgesetzt. Die manuellen Prüfungen aller Phasen
  stehen gesammelt am Ende aus (Wunsch des Nutzers).

## Verweise

- Vorgänger: `docs/agents/plans/2026-10-30-artikel-einer-kategorie-anzeigen.md`
  (MZP-047), `docs/agents/plans/2026-09-24-gerichte-nach-kategorie-filtern.md`
- Filtervorbild: `src/meals/ui/MealFilterSelect.tsx`, `src/meals/ui/SuppliesArea.tsx:52-60`
- `src/shopping/ui/KnownItemsArea.tsx`, `KnownItemListPage.tsx`, `KnownItemListRow.tsx`,
  `KnownItemFormPage.tsx`, `DeleteKnownItemPage.tsx`
- `src/meals/domain/meal.ts`, `src/meals/ui/MealItemsEditor.tsx:100`
- `src/SignedInApp.tsx:196-227`, `:262`
- `docs/architektur/05-bausteinsicht.md`
