---
date: 2026-09-28T06:06:13.281714+00:00
git_commit: e582be44387a1c4f8c081c071746d4d4dd8b564f
branch: main
story: MZP-037
topic: "Artikel statt Item und Vorräte filtern"
tags: [plan, meals, announcements, MealItemsEditor, SupplyListPage, SuppliesArea, mealFilter, voiceover]
status: ready
---

# PLAN: MZP-037 — Artikel statt Item und Vorräte filtern

Zwei Wünsche aus der Befragung vom 2026-09-28:

1. Wo die Oberfläche noch „Item“ sagt, heißt es künftig „Artikel“, wie schon auf der
   Einkaufsliste.
2. Die Vorräte-Seite bekommt dieselbe Filterzeile wie die Gerichte-Seite: Alle, Art,
   Kategorie.

Die Filterzeile selbst stammt aus MZP-024 und MZP-032.

## Akzeptanzkriterien

- Im Gericht-Formular heißt die Überschrift des Abschnitts „Einkaufs-Artikel, n“ bzw.
  „Einkaufs-Artikel, keine“. Das Formular heißt „Einkaufs-Artikel hinzufügen“, das
  Feld „Artikel“, der Button „Artikel hinzufügen“.
- Die Ansagen lauten „Hackfleisch, 500 g als Artikel übernommen.“, „Hackfleisch
  entfernt, noch 1 Artikel.“, „… noch 3 Artikel.“, „… keine Artikel mehr.“ und
  „Suppe hat keine Einkaufs-Artikel.“. Letzteres gilt auch in der Ansage der
  Wochenplan-Übertragung.
- Kein sichtbarer oder vorgelesener Text der App enthält mehr das Wort „Item“.
- Die Vorräte-Seite zeigt unter der Überschrift dieselbe Filterzeile wie die
  Gerichte-Seite: Label „Filter“, zuerst „Alle“, dann die Gruppe „Art“, dann die
  Gruppe „Kategorie“, bei aktivem Filter ein ✕ „Filter zurücksetzen“. Nach dem ✕
  liegt der Fokus auf der Auswahl.
- Angeboten werden nur Arten und Kategorien, die unter den Gerichten **im Vorrat**
  vorkommen. Gibt es keine, fehlt die Filterzeile.
- Die Liste zeigt dann nur die passenden Vorräte, weiter alphabetisch sortiert.
- Mit Filter ist die Überschrift sichtbar „Vorräte, 2 / 5“ und wird „Vorräte, 2 von
  5“ vorgelesen. Ohne Filter bleibt sie unverändert „Vorräte, 5“ bzw. „Vorräte,
  keine“. Gezählt werden die Zeilen, nicht die Portionen.
- Nach einer Filterwahl kommt die Ansage „Vegetarisch, 2 von 5 Vorräten.“, bei einem
  einzigen Vorrat insgesamt „Vegetarisch, 1 von 1 Vorrat.“. Nach dem Zurücksetzen
  kommt „Filter zurückgesetzt, 5 Vorräte.“ bzw. „Filter zurückgesetzt, 1 Vorrat.“.
- Der Filter bleibt beim Anlegen, Öffnen, Ändern und Löschen eines Vorrats innerhalb
  des Bereichs bestehen. Nach einem Wechsel über die Navigationsleiste steht er wieder
  auf „Alle“. Mit dem Filter der Gerichte-Seite ist er nicht verbunden.
- Verschwindet die gewählte Option, springt der Filter still auf „Alle“. Das
  passiert, wenn kein Vorrat mehr passt, auch durch ein anderes Gerät. Er ist dann
  wirklich zurückgesetzt: Kommt später wieder ein passender Vorrat hinzu, bleibt die
  Auswahl auf „Alle“.
- Nimmt „−“ die letzte Portion der **einzigen** gefilterten Zeile, liegt der Fokus
  danach auf der Überschrift. Sie lautet dann ungefiltert, zum Beispiel „Vorräte, 4“.
  Sonst springt der Fokus wie bisher auf die nächste Zeile der gefilterten Liste.
- Die Entfernen-Ansage „… entfernt, noch n Vorräte.“ zählt weiterhin alle Vorräte,
  nicht nur die gefilterten.
- Die Vorräte-Liste mit gewähltem Filter ist ohne axe-Befund.

### Bewusste Grenzen

- Im Code wird nichts umbenannt: `item`, `MealItem`, `mealItemsHeading`, `itemList`
  und so weiter bleiben.
- Die alten Einträge in `docs/notes.txt` („Shopping-Items“, „Items“) bleiben, wie sie
  sind. Sie gehören dem Nutzer.
- Die Gerichte-Seite merkt sich eine verschwundene Option weiter und wählt sie still
  wieder, sobald sie zurückkommt. Das wird hier nicht behoben, sondern als `b` in
  `docs/notes.txt` festgehalten.
- Liefert „−“ an der letzten Portion wider Erwarten doch einen Vorrat zurück, weil
  das andere Gerät die Anzahl inzwischen erhöht hat, bleibt die ausstehende
  Fokussierung stehen und greift beim nächsten Rendern. So verhält sich
  `rowRemovedAt` schon heute. `fallbackAfterRemoval` übernimmt das, ohne es zu
  beheben.
- Entfernt das andere Gerät den einzigen gefilterten Vorrat, während der Fokus auf
  seiner Zeile liegt, geht der Fokus verloren wie heute beim Entfernen ohne Filter.
- Legt man bei aktivem Filter einen nicht passenden Vorrat an, bleibt der Filter
  stehen. Der Vorrat ist erst nach dem Zurücksetzen zu sehen. Die Ansage
  „Lasagne, 2.“ bestätigt das Anlegen trotzdem.

## Wesentliche Entscheidungen und Abwägungen

1. **Nur die Oberflächentexte ändern.**
   - Warum: „item“ ist die englische Entsprechung von „Artikel“, und der Code ist
     Englisch. `article` wäre eher ein Zeitungsartikel.
   - Auswirkung: Es ändern sich die Strings in `MealItemsEditor.tsx` und
     `announcements.ts` sowie die Erwartungen in den Unit-, Komponenten- und
     E2E-Tests.
2. **Wortlaut „Einkaufs-Artikel“** statt eines schlichten „Artikel“ in Überschrift,
   Formularname und in der Ansage „hat keine Einkaufs-Artikel“.
   - Warum: Im Gericht-Formular zeigt das „Einkaufs-“, dass die Artikel auf die
     Einkaufsliste gehen und nicht in den Freitext „Zutaten“.
3. **Die Filterlogik der Domäne wiederverwenden.** `mealFilter.ts` bekommt
   `suppliesMatching(supplied, filter)`. Arten und Kategorien liefern die vorhandenen
   `usedMealKinds` und `mealCategories`, angewandt auf die Gerichte der Vorräte. Die
   Gültigkeit prüft `knownFilter`.
   - Warum: Beide Seiten folgen denselben Regeln. Dazu gehören die Schreibweise der
     Kategorien über `sameCategory` und die Trennung zwischen der Art Snack und einer
     Kategorie „Snack“. In der UI bleibt keine Filterlogik.
   - Auswirkung: Die Tests entstehen test-getrieben in `mealFilter.test.ts`. Es gibt
     keinen neuen Port und keinen neuen Adapter.
4. **Optionen nur aus den Vorräten (Variante A).**
   - Warum: Jede Wahl liefert mindestens einen Treffer. VoiceOver muss keine Optionen
     durchgehen, die ins Leere führen. So macht es die Gerichte-Seite auch.
5. **`MealFilterSelect` unverändert wiederverwenden.**
   - Warum: Die Komponente kennt nur Arten, Kategorien, den aktiven Filter und einen
     Rückruf. Sie weiß nichts von Gerichten oder Vorräten. Die feste id `mealFilter`
     ist eindeutig, weil immer nur eine Seite zu sehen ist.
   - Auswirkung: `SupplyListPage` bindet sie ein, `SuppliesArea` hält den Zustand.
6. **Eigener, unabhängiger Filterzustand in `SuppliesArea`.**
   - Warum: Das entspricht `MealsArea`. `SignedInApp` zeigt nur den aktiven Bereich
     (`SignedInApp.tsx:299-322`), also setzt ein Bereichswechsel den Zustand zurück.
   - Anders als `MealsArea` wird `chosenFilter` auf `null` gesetzt, sobald
     `knownFilter` ihn verwirft (Befragung, Frage 7, Variante A).
   - Warum: Sonst würde die Auswahl ohne Ansage wieder auf die alte Option springen,
     wenn das andere Gerät einen passenden Vorrat anlegt. Mit VoiceOver ist das nicht
     nachvollziehbar.
7. **Eigene Vorräte-Ansagen in `announcements.ts`.** Dazu gehören
   `suppliesHeading(count, filteredFromCount)`, `supplyFilterAnnouncement` und
   `supplyFilterResetAnnouncement`. Die sichtbare Zahl „2 / 5“ liefert das vorhandene
   `shownMealsCount`.
8. **Fokus auf die Überschrift, wenn die letzte gefilterte Zeile verschwindet.**
   `useFocusAfterRemoval` bekommt dafür `fallbackAfterRemoval()`. Damit landet der
   Fokus nach dem nächsten Rendern auf dem Rückfallziel, also der Überschrift.
   - Warum: Die Liste ist dann plötzlich ungefiltert. Eine beliebige Zeile im Fokus
     wäre mit VoiceOver unverständlich. Der Fokus wird erst **nach** dem Rendern
     gesetzt, damit VoiceOver die neue Überschrift „Vorräte, 4“ liest und nicht die
     alte „Vorräte, 1 von 5“.
   - Auswirkung: Die Einkaufsliste nutzt denselben Hook und bleibt unverändert, denn
     sie ruft die neue Funktion nicht auf.

## Ausgangslage

### „Item“ in der Oberfläche

| Fundstelle | Heute |
|---|---|
| `src/meals/ui/MealItemsEditor.tsx:115` | `aria-label="Einkaufs-Item hinzufügen"` |
| `src/meals/ui/MealItemsEditor.tsx:119` | `<label htmlFor="mealItemName">Item</label>` |
| `src/meals/ui/MealItemsEditor.tsx:160-162` | Button „Item hinzufügen“ |
| `src/meals/domain/announcements.ts:117-121` | `mealItemsHeading`: „Einkaufs-Items, keine“ / „Einkaufs-Items, n“ |
| `src/meals/domain/announcements.ts:123-125` | `mealItemAddedAnnouncement`: „… als Item übernommen.“ |
| `src/meals/domain/announcements.ts:127-130` | `remainingItemPhrase`: „keine Items mehr“ / „noch 1 Item“ / „noch n Items“ |
| `src/meals/domain/announcements.ts:236-238` | `mealWithoutItemsAnnouncement`: „… hat keine Einkaufs-Items.“ |

Die zugehörigen Test-Erwartungen stehen in:

- `src/meals/domain/announcements.test.ts:296`, `:300`, `:404`, `:412`, `:418`,
  `:424`, `:550`, `:920`, `:925`, `:949`
- `src/meals/ui/MealsArea.test.tsx:158`, `:160`, `:166`, `:360`, `:378`, `:594`,
  `:623`, `:639`, `:1683`, `:1696`, `:1699`, `:1707`, `:1760`, `:1783`
- `src/SignedInApp.test.tsx:143`, `:147`, `:657`, `:760`, `:1145`, `:1250`
- `e2e/keyboard.ts:25`, `:28` (`takeOverItem`)

Die Einkaufsliste sagt schon „Artikel“ (`src/shopping/ui/AddItemPage.tsx:70-73`,
`src/shopping/ui/ShoppingListPage.tsx:61`).

### Filter und Vorräte

```
MealsArea                                   src/meals/ui/MealsArea.tsx:66-90
  useState chosenFilter: MealFilter | null
  categories   = mealCategories(meals)
  kinds        = usedMealKinds(meals)
  activeFilter = knownFilter(kinds, categories, chosenFilter)
  → MealListPage → MealFilterSelect (nur wenn kinds/categories nicht leer)

SuppliesArea                                src/meals/ui/SuppliesArea.tsx
  supplied = suppliedMeals(supplies, meals)       (alphabetisch, count > 0)
  → SupplyListPage(supplied, …)                   src/meals/ui/SupplyListPage.tsx
       h1 = suppliesHeading(supplied.length)      „Vorräte, 5“ / „Vorräte, keine“
       useFocusAfterRemoval(ids, heading)         Fokus nach dem letzten „−“
       ul.itemList → SupplyListRow × supplied
```

```
┌──────────────────────────────────┐
│ [Liste][Plan][Gerichte][Vor.][⚙] │
│ Vorräte, 5                    [+]│
├──────────────────────────────────┤
│ Gemüsesuppe        [−] 1 [+]     │
│ Lasagne            [−] 2 [+]     │
│ Müsli              [−] 3 [+]     │
│ …                                │
└──────────────────────────────────┘
```

- `src/meals/domain/mealFilter.ts`: `MealFilter`, `usedMealKinds`, `knownFilter`,
  `mealsMatching` auf `readonly Meal[]`.
- `src/meals/domain/supply.ts:10-13`: `SuppliedMeal = { meal: Meal; count: number }`.
- `src/meals/domain/announcements.ts:78-85` `shownMealsCount` liefert „n / m“,
  `:87-89` `mealFilterName`, `:101-115` die Gerichte-Filteransagen, `:458-460`
  `suppliesHeading`, `:487-499` die Entfernen-Ansage der Vorräte.
- `src/shared/ui/useFocusAfterRemoval.ts`: `rowRemovedAt(position)` fokussiert nach
  dem nächsten Rendern die Zeile an dieser Position der neuen Liste oder die letzte.
  Ist die Liste leer, fokussiert er das Rückfallziel.
- `src/meals/ui/SuppliesArea.test.tsx:15-26`: Die Hilfe `meal(id, name)` setzt fest
  `kind: 'mainMeal'`. Mit dem neuen Filter zeigt deshalb jeder bestehende Test mit
  Vorräten die Filterzeile mit „Hauptgericht“.

## Zielbild

### Gericht-Formular

```
vorher                                   nachher
┌──────────────────────────────────┐     ┌──────────────────────────────────┐
│ Einkaufs-Items, 2                │     │ Einkaufs-Artikel, 2              │
│ Hackfleisch, 500 g          [🗑] │     │ Hackfleisch, 500 g          [🗑] │
│ Zwiebeln, 2                 [🗑] │     │ Zwiebeln, 2                 [🗑] │
│ Item    [                 ]      │     │ Artikel [                 ]      │
│ Menge [    ]  Einheit [     ]    │     │ Menge [    ]  Einheit [     ]    │
│ [ Item hinzufügen ]              │     │ [ Artikel hinzufügen ]           │
└──────────────────────────────────┘     └──────────────────────────────────┘
```

### Vorräte-Seite

```
SuppliesArea
  useState chosenFilter: MealFilter | null
  supplied        = suppliedMeals(supplies, meals)
  suppliedDishes  = supplied.map((one) => one.meal)
  kinds           = usedMealKinds(suppliedDishes)
  categories      = mealCategories(suppliedDishes)
  activeFilter    = knownFilter(kinds, categories, chosenFilter)
  shownSupplied   = suppliesMatching(supplied, activeFilter)
        │
        ▼
SupplyListPage(supplied = shownSupplied, totalCount = supplied.length,
               kinds, categories, activeFilter, onChooseFilter, …)
  h1 aria = suppliesHeading(shown.length, filteredFromCount)
  MealFilterSelect (nur wenn kinds.length > 0 || categories.length > 0)
  ul.itemList → SupplyListRow × shownSupplied
```

```
ungefiltert                              mit Kategorie „Vegetarisch“
┌──────────────────────────────────┐     ┌──────────────────────────────────┐
│ [Liste][Plan][Gerichte][Vor.][⚙] │     │ [Liste][Plan][Gerichte][Vor.][⚙] │
│ Vorräte, 5                    [+]│     │ Vorräte, 2 / 5                [+]│
│ Filter [ Alle             ▾]     │     │ Filter [ Vegetarisch      ▾] [✕] │
├──────────────────────────────────┤     ├──────────────────────────────────┤
│ Gemüsesuppe        [−] 1 [+]     │     │ Gemüsesuppe        [−] 1 [+]     │
│ Lasagne            [−] 2 [+]     │     │ Müsli              [−] 3 [+]     │
│ Müsli              [−] 3 [+]     │     └──────────────────────────────────┘
│ …                                │      h1-Name: „Vorräte, 2 von 5“
└──────────────────────────────────┘
```

Ablauf mit VoiceOver:

```
Fokus „Filter, Alle“ ─Doppeltipp─▶ Rad ─„Vegetarisch“─▶
   Ansage: „Vegetarisch, 2 von 5 Vorräten.“        Fokus bleibt auf der Auswahl
Wischen ─▶ „Filter zurücksetzen, Taste“ ─Doppeltipp─▶
   Ansage: „Filter zurückgesetzt, 5 Vorräte.“      Fokus: „Filter, Alle“

Filter „Snack“, einzige Zeile „Nüsse, 1“ ─„Weniger, Nüsse“─▶
   Ansage: „Nüsse entfernt, noch 4 Vorräte.“
   Filter springt still auf „Alle“, Fokus: Überschrift „Vorräte, 4“
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `announcements.ts`
    - `mealItemsHeading`, `mealItemAddedAnnouncement`, `remainingItemPhrase`,
      `mealWithoutItemsAnnouncement`: nur neue Texte
    - `suppliesHeading(supplyCount, filteredFromCount = null)`: um „n von m“
      erweitert
    - `supplyFilterAnnouncement(filter, shownCount, totalCount)`: neu
    - `supplyFilterResetAnnouncement(totalCount)`: neu
    - `supplyCountPhrase` (Dativ: „1 Vorrat“ / „n Vorräten“) und `supplyTotalPhrase`
      („1 Vorrat“ / „n Vorräte“): neu und privat, nach dem Muster von
      `mealCountPhrase` und `mealTotalPhrase`
  - `announcements.test.ts`: Erwartungen angepasst, neue Fälle
  - `mealFilter.ts`: `suppliesMatching(supplied, filter)` neu. Dazu kommt
    `matchesMealFilter(meal, filter)` als gemeinsames Prädikat, auf das
    `mealsMatching` umgestellt wird.
  - `mealCategory.ts`: `carriesCategory` wird exportiert. `mealsInCategory` entfällt,
    weil es danach nur noch von Tests gerufen würde.
  - `mealCategory.test.ts`: `describe('mealsInCategory')` entfällt, die Fälle wandern
    nach `mealFilter.test.ts`.
  - `mealFilter.test.ts`: `describe('suppliesMatching')` neu, Fälle aus
    `mealsInCategory` übernommen
- `src/meals/ui`
  - `MealItemsEditor.tsx`: drei Texte
  - `SupplyListPage.tsx`: Filterzeile, Überschrift „n / m“, Fokusregel
  - `SuppliesArea.tsx`: Zustand, Ableitungen, Ansagen
  - `SuppliesArea.test.tsx`: Hilfe `meal(id, name, parts)`, neue Fälle
  - `MealsArea.test.tsx`: Erwartungen angepasst
- `src/shared/ui/useFocusAfterRemoval.ts`: `fallbackAfterRemoval()` neu
- `src/SignedInApp.test.tsx`, `e2e/keyboard.ts`: Erwartungen und Beschriftungen
  angepasst

Wiederverwendet werden `MealFilterSelect`, `usedMealKinds`, `mealCategories`,
`knownFilter`, `mealFilterName`, `shownMealsCount`, `CrossIcon` und `.mealFilter`
aus `src/index.css`. Es gibt keine neue Abhängigkeit und keine Firestore-Änderung.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: „Artikel“ statt „Item“ im Gericht-Formular und in den Ansagen

Abhängigkeiten: keine

Das Gericht-Formular und alle Ansagen rund um seine Einkaufs-Artikel sagen „Artikel“
statt „Item“.

**Aufgaben**:

- [ ] Test zuerst: `src/meals/domain/announcements.test.ts`, die Erwartungen anpassen:
      - `:296` „Einkaufs-Artikel, keine“, `:300` „Einkaufs-Artikel, 3“
      - `:404` „Hackfleisch, 500 g als Artikel übernommen.“
      - `:412` „Hackfleisch entfernt, noch 2 Artikel.“, `:418` „… noch 1 Artikel.“,
        `:424` „… keine Artikel mehr.“
      - `:550`, `:920`, `:925`, `:949` „… hat keine Einkaufs-Artikel.“

      Die Fälle schlagen fehl.
- [ ] `src/meals/domain/announcements.ts`: die Texte ändern.
      ```ts
      export function mealItemsHeading(itemCount: number): string {
        return itemCount === 0
          ? 'Einkaufs-Artikel, keine'
          : `Einkaufs-Artikel, ${itemCount}`
      }

      export function mealItemAddedAnnouncement(item: MealItem): string {
        return `${formatMealItem(item)} als Artikel übernommen.`
      }

      function remainingItemPhrase(remainingItems: number): string {
        if (remainingItems === 0) return 'keine Artikel mehr'
        return `noch ${remainingItems} Artikel`
      }
      ```
      `mealWithoutItemsAnnouncement` liefert `${meal.name} hat keine Einkaufs-Artikel.`.
      „Artikel“ hat keine eigene Pluralform, deshalb fällt die Unterscheidung
      zwischen 1 und n in `remainingItemPhrase` weg.
- [ ] `src/meals/ui/MealItemsEditor.tsx`:
      `aria-label="Einkaufs-Artikel hinzufügen"`,
      `<label htmlFor="mealItemName">Artikel</label>`, Button-Text „Artikel
      hinzufügen“.
- [ ] `src/meals/ui/MealsArea.test.tsx`: `name: 'Einkaufs-Artikel hinzufügen'`
      (`:158`), `getByLabelText('Artikel')` (`:160`, `:1683`, `:1696`, `:1699`,
      `:1707`, `:1783`), Button „Artikel hinzufügen“ (`:166`, `:1760`), Ansagen
      (`:360`, `:378`) und Überschriften „Einkaufs-Artikel, keine“ / „Einkaufs-Artikel,
      1“ / `/Einkaufs-Artikel/` (`:594`, `:623`, `:639`).
- [ ] `src/SignedInApp.test.tsx`: `getByLabelText('Artikel')` (`:143`, `:1250`),
      Button „Artikel hinzufügen“ (`:147`), Ansagen mit „Einkaufs-Artikel“ (`:657`,
      `:760`, `:1145`).

      Mit `getByLabelText('Artikel')` besteht keine Verwechslungsgefahr: Der Abgleich
      ist exakt, und das Formular heißt „Einkaufs-Artikel hinzufügen“. Auf der
      Gericht-Seite gibt es keinen zweiten Button „Artikel hinzufügen“. Der „+“-Button
      der Einkaufsliste ist dort nicht zu sehen.
- [ ] `e2e/keyboard.ts`: In `takeOverItem` `typeInto(page, 'Artikel', name)` und
      `pressButton(page, 'Artikel hinzufügen')` setzen. Beide Hilfen gleichen exakt
      ab.

**Automatisierte Verifikation**:

- [ ] Die angepassten Fälle in `announcements.test.ts` schlagen vor der Umsetzung fehl
      und laufen danach grün.
- [ ] `grep -rnwE "Items?" src e2e` findet nichts mehr. Das Wort steht heute nur in
      Texten, Bezeichner wie `MealItem` trifft der Wortabgleich nicht.
- [ ] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [ ] `npm run test:e2e` läuft grün.

### Phase 2: Vorräte nach Art und Kategorie filtern

Abhängigkeiten: Phase 1. Fachlich sind die Phasen unabhängig, aber beide ändern
`announcements.ts` und `announcements.test.ts`, deshalb nacheinander umsetzen.

Die Vorräte-Seite bekommt die Filterzeile der Gerichte-Seite mit eigener Überschrift,
eigenen Ansagen und der Fokusregel für die letzte gefilterte Zeile.

**Aufgaben**:

- [ ] Test zuerst: `src/meals/domain/mealFilter.test.ts`, `describe('suppliesMatching')`,
      mit einer Hilfe `supplied(meal, count)`:
      - `keeps every supply without a filter`
      - `keeps the supplies whose meal has the chosen kind`
      - `keeps the supplies whose meal carries the chosen category`, wobei die
        Schreibweise egal ist (`suppe` findet „Suppe“)
      - `tells a kind from a category of the same name`
      - `keeps the order and the counts of the supplies`
- [ ] Test zuerst: Die Fälle aus `describe('mealsInCategory')`
      (`src/meals/domain/mealCategory.test.ts:341-364`) nach
      `describe('mealsMatching')` in `mealFilter.test.ts` übertragen. Übertragen wird,
      was dort noch fehlt: die Schreibweise („SUPPE“ findet „Suppe“) und
      ausgeblendete Gerichte mit der Kategorie. Danach `describe('mealsInCategory')`
      und seinen Import entfernen.
- [ ] `src/meals/domain/mealCategory.ts`: `carriesCategory` exportieren und
      `mealsInCategory` entfernen.
- [ ] `src/meals/domain/mealFilter.ts`: das Prädikat herausziehen und
      `suppliesMatching` ergänzen:
      ```ts
      export function matchesMealFilter(meal: Meal, filter: MealFilter): boolean {
        return filter.by === 'kind'
          ? meal.kind === filter.kind
          : carriesCategory(meal, filter.category)
      }

      export function mealsMatching(
        meals: readonly Meal[],
        filter: MealFilter | null,
      ): readonly Meal[] {
        if (filter === null) return meals
        return meals.filter((meal) => matchesMealFilter(meal, filter))
      }

      export function suppliesMatching(
        supplied: readonly SuppliedMeal[],
        filter: MealFilter | null,
      ): readonly SuppliedMeal[] {
        if (filter === null) return supplied
        return supplied.filter((one) => matchesMealFilter(one.meal, filter))
      }
      ```
      Die Importe lauten dann `carriesCategory`, `knownCategory` und
      `type CategoryOverview` aus `./mealCategory` sowie `type SuppliedMeal` aus
      `./supply`. Einen Zyklus gibt es nicht, weil `supply.ts` und `mealCategory.ts`
      nur `./meal` importieren. Die bestehenden `mealsMatching`-Fälle bleiben grün.
- [ ] Test zuerst: `src/meals/domain/announcements.test.ts`
      - `suppliesHeading`: `(0)` → „Vorräte, keine“, `(5)` → „Vorräte, 5“, `(2, 5)` →
        „Vorräte, 2 von 5“
      - `supplyFilterAnnouncement`: `{ by: 'category', category: 'Vegetarisch' }`,
        2, 5 → „Vegetarisch, 2 von 5 Vorräten.“; `{ by: 'kind', kind: 'snack' }`,
        1, 1 → „Snack, 1 von 1 Vorrat.“
      - `supplyFilterResetAnnouncement`: 5 → „Filter zurückgesetzt, 5 Vorräte.“,
        1 → „Filter zurückgesetzt, 1 Vorrat.“
- [ ] `src/meals/domain/announcements.ts`:
      ```ts
      export function suppliesHeading(
        supplyCount: number,
        filteredFromCount: number | null = null,
      ): string {
        if (supplyCount === 0) return 'Vorräte, keine'
        return filteredFromCount === null
          ? `Vorräte, ${supplyCount}`
          : `Vorräte, ${supplyCount} von ${filteredFromCount}`
      }

      export function supplyFilterAnnouncement(
        filter: MealFilter,
        shownCount: number,
        totalCount: number,
      ): string {
        return `${mealFilterName(filter)}, ${shownCount} von ${supplyCountPhrase(totalCount)}.`
      }

      export function supplyFilterResetAnnouncement(totalCount: number): string {
        return `Filter zurückgesetzt, ${supplyTotalPhrase(totalCount)}.`
      }
      ```
      Dazu kommen die privaten Hilfen `supplyCountPhrase` („1 Vorrat“ / „n
      Vorräten“) und `supplyTotalPhrase` („1 Vorrat“ / „n Vorräte“).
- [ ] `src/shared/ui/useFocusAfterRemoval.ts`: Neben `rowRemovedAt(position)` kommt
      `fallbackAfterRemoval()` dazu. Sie sorgt dafür, dass nach dem nächsten Rendern
      das Rückfallziel den Fokus bekommt, egal welche Zeilen dann zu sehen sind. Der
      Ref für die ausstehende Fokussierung unterscheidet dafür zwischen „Zeile an
      Position n“ und „Rückfallziel“, zum Beispiel
      `useRef<number | 'fallback' | null>(null)`.
- [ ] `src/meals/ui/SupplyListPage.tsx`: neue Props
      ```ts
      totalCount: number
      kinds: readonly ChosenMealKind[]
      categories: readonly CategoryOverview[]
      activeFilter: MealFilter | null
      onChooseFilter: (filter: MealFilter | null) => void
      ```
      - `filteredFromCount = activeFilter === null ? null : totalCount`
      - `<h1 aria-label={suppliesHeading(supplied.length, filteredFromCount)}>`. Der
        sichtbare Text ist ohne Filter `suppliesHeading(supplied.length)`, mit Filter
        `Vorräte, ${shownMealsCount(supplied.length, filteredFromCount)}`. Einen
        aktiven Filter ohne Treffer gibt es nicht, weil `knownFilter` ihn dann
        verwirft.
      - `MealFilterSelect` zwischen `.pageHeader` und der Liste, nur bei
        `kinds.length > 0 || categories.length > 0`, genau wie in `MealListPage`.
      - `takeOneLess`: Ist es die letzte Portion, ist ein Filter aktiv und ist dies
        die einzige gezeigte Zeile, wird `fallbackAfterRemoval()` aufgerufen, sonst
        wie bisher `rowRemovedAt(position)`. Die Bedingung bekommt einen sprechenden
        Namen, zum Beispiel `removesLastFilteredRow`.
- [ ] `src/meals/ui/SuppliesArea.tsx`:
      - `useState<MealFilter | null>(null)` als `chosenFilter`
      - Ableitungen wie im Zielbild: `kinds` und `categories` aus den Gerichten von
        `supplied`, `activeFilter = knownFilter(...)`,
        `shownSupplied = suppliesMatching(supplied, activeFilter)`
      - Verwirft `knownFilter` die gewählte Option (`chosenFilter !== null &&
        activeFilter === null`), wird `chosenFilter` noch im Rendern auf `null`
        gesetzt. Das ist das Muster „Informationen aus vorherigen Renderings
        speichern“ aus
        https://react.dev/reference/react/useState#storing-information-from-previous-renders.
        Ein Effekt ist dafür nicht nötig. Die Bedingung bekommt einen sprechenden
        Namen, zum Beispiel `chosenFilterIsGone`.
      - `chooseFilter(filter)` setzt den Zustand und sagt an:
        `filter === null ? supplyFilterResetAnnouncement(supplied.length) : supplyFilterAnnouncement(filter, suppliesMatching(supplied, filter).length, supplied.length)`
      - `SupplyListPage` bekommt `supplied={shownSupplied}`,
        `totalCount={supplied.length}`, `kinds`, `categories`, `activeFilter`,
        `onChooseFilter={chooseFilter}`.
      - `changeCount` und `deleteSupply` zählen für die Entfernen-Ansage weiter
        `supplied.length - 1`, also alle Vorräte.
- [ ] `src/meals/ui/SuppliesArea.test.tsx`: Die Hilfe wird zu
      `meal(id, name, parts: Partial<Meal> = {})`. Dazu kommen die Hilfen
      `supplyFilter()` (`getByRole('combobox', { name: 'Filter' })`),
      `chooseFilter(nameOrValue)`, `chosenFilterText()` und `offeredFilters()`, nach
      dem Muster von `MealsArea.test.tsx:258-275`. Die bestehenden Fälle bleiben
      unverändert grün. Weil die Standard-Gerichte `kind: 'mainMeal'` tragen, prüft
      der bestehende axe-Test der Liste (`:510-517`) künftig auch die Filterzeile mit.
- [ ] `src/meals/ui/SuppliesArea.test.tsx`, neue Fälle:
      - `offers no filter when no supplied meal has a kind or a category`: alle
        Gerichte `kind: 'none'`, keine Kategorien, also keine Combobox „Filter“.
      - `offers only the kinds and categories of supplied meals`: Im Vorrat sind
        „Lasagne“ (Hauptgericht, Kategorie „Vegetarisch“) und „Nüsse“ (Snack). Ohne
        Vorrat ist „Müsli“ (Frühstück, Kategorie „Asiatisch“). Im Vorrat ist außerdem
        das ausgeblendete „Porridge“ (Snack, `hidden: true`) und „Brot“ ohne Art
        (`kind: 'none'`) und ohne Kategorie. Angeboten werden genau
        `['Alle', 'Hauptgericht', 'Snack', 'Vegetarisch']`, in den Gruppen „Art“ und
        „Kategorie“.
      - `shows only the supplies of the chosen category`: „Vegetarisch“ wählen, dann
        zeigt `shownSupplyNames()` nur die passenden, alphabetisch.
      - `shows only the supplies of the chosen kind`
      - `counts and announces the filtered supplies`: Die Überschrift heißt „Vorräte,
        2 von 5“ (zugänglicher Name) und zeigt sichtbar „Vorräte, 2 / 5“. Die Ansage
        lautet „Vegetarisch, 2 von 5 Vorräten.“.
      - `resets the filter with the cross`: Die Ansage lautet „Filter zurückgesetzt, 5
        Vorräte.“, die Auswahl zeigt „Alle“ und hat den Fokus. Die Überschrift heißt
        wieder „Vorräte, 5“.
      - `keeps the filter while a supply is added`: Filter wählen, per `addSupply(…)`
        einen passenden Vorrat anlegen. Zurück auf der Liste zeigt die Auswahl weiter
        den Filter, und der neue Vorrat ist zu sehen.
      - `keeps the filter when returning from a supply`: Filter wählen, Vorrat
        öffnen, zurück. Der Filter bleibt.
      - `shows every supply when no supply matches the chosen filter anymore`: Filter
        „Snack“ wählen, dann über den Supplies-Client (in `act`) den einzigen
        Snack-Vorrat entfernen. Die Filterzeile zeigt „Alle“, alle Vorräte sind zu
        sehen.
      - `keeps showing every supply when a matching supply comes back`: wie eben,
        danach legt der Supplies-Client (in `act`) wieder einen Snack-Vorrat an. Die
        Auswahl zeigt weiter „Alle“, alle Vorräte sind zu sehen.
      - `leaves the focus on the heading when the last filtered row is removed`:
        Filter „Snack“ mit einer einzigen Zeile „Nüsse, 1“, dazu weitere Vorräte.
        „Weniger, Nüsse“ drücken. Die Ansage lautet „Nüsse entfernt, noch n
        Vorräte.“ (alle gezählt), und die Überschrift „Vorräte, n“ hat den Fokus.
      - `leaves the focus on the following filtered row after a removal`: Filter mit
        zwei Zeilen. Bei der ersten die letzte Portion nehmen, dann hat die zweite
        gefilterte Zeile den Fokus.
      - `counts every supply when a filtered supply is removed`: gefiltert löschen
        über die Detailseite. Die Ansage nennt die Anzahl aller verbleibenden
        Vorräte.
      - `has no accessibility violations on the filtered list`
- [ ] `src/SignedInApp.test.tsx`, neuer Fall `shows every supply again after leaving
      the supplies`: Auf der Vorräte-Seite einen Filter wählen, über die
      Navigationsleiste zu „Gerichte“ und zurück wechseln. Die Auswahl zeigt „Alle“.
- [ ] `docs/notes.txt`: unter TODO einen Bug anhängen:
      `b Gerichte: eine verschwundene Filteroption bleibt gemerkt und wird still wieder gewählt, sobald ein passendes Gericht zurueckkommt (MealsArea.tsx:66-70). Auf der Vorraete-Seite seit MZP-037 behoben.`
- [ ] `src/shopping/ui/ShoppingListPage.tsx` bleibt unverändert. Die Fokusfälle der
      Einkaufsliste laufen weiter grün.

**Automatisierte Verifikation**:

- [ ] Die neuen Fälle in `mealFilter.test.ts` und `announcements.test.ts` schlagen vor
      der Umsetzung fehl und laufen danach grün.
- [ ] Alle Fälle in `SuppliesArea.test.tsx`, `MealsArea.test.tsx` und
      `ShoppingArea.test.tsx` laufen grün.
- [ ] `npm run test`, `npm run lint` und `npm run build` laufen durch, der
      Architekturtest eingeschlossen.
- [ ] `npm run test:e2e` läuft grün.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA, VoiceOver an):

- [ ] Im Gericht-Formular liest VoiceOver „Einkaufs-Artikel, n“, das Feld „Artikel“ und
      den Button „Artikel hinzufügen“. Nach dem Übernehmen kommt „… als Artikel
      übernommen.“.
- [ ] Auf der Vorräte-Seite steht die Filterzeile unter der Überschrift. Das Rad bietet
      nur Arten und Kategorien an, die es unter den Vorräten gibt.
- [ ] Nach der Wahl einer Kategorie kommt „<Kategorie>, n von m Vorräten.“, und die
      Überschrift liest „Vorräte, n von m“.
- [ ] Das ✕ setzt zurück, die Ansage lautet „Filter zurückgesetzt, m Vorräte.“, und
      der VoiceOver-Cursor steht auf „Filter, Alle“.
- [ ] Nach „Weniger“ auf der letzten Portion der einzigen gefilterten Zeile kommt die
      Entfernen-Ansage, und der VoiceOver-Cursor steht auf der Überschrift „Vorräte,
      m“.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/agents/plans/2026-09-24-gerichte-nach-kategorie-filtern.md` (MZP-024): die
  Filterzeile, Überschrift „n / m“, Ansagen, ✕
- `docs/agents/plans/2026-09-25-gerichte-nach-art-filtern.md` (MZP-032):
  `MealFilter`, `MealFilterSelect`, gruppierte Optionen
- `docs/agents/plans/2026-09-22-vorraete-mit-anzahl.md`: Vorräte-Liste mit „−“ und
  „+“
- `src/meals/domain/mealFilter.ts`, `src/meals/domain/mealCategory.ts`,
  `src/meals/domain/announcements.ts`, `src/meals/domain/supply.ts`,
  `src/meals/ui/MealFilterSelect.tsx`, `src/meals/ui/MealItemsEditor.tsx`,
  `src/meals/ui/SupplyListPage.tsx`, `src/meals/ui/SuppliesArea.tsx`,
  `src/shared/ui/useFocusAfterRemoval.ts`, `e2e/keyboard.ts`
