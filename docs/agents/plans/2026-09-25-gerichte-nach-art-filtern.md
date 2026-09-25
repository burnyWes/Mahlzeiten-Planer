---
date: 2026-09-25T12:59:05.309971+00:00
git_commit: 44f6f28437a33d07a38fdf15180af8bfcd092e2c
branch: main
story: MZP-032
topic: "Gerichte nach Art filtern"
tags: [plan, meals, announcements, MealListPage, MealsArea, voiceover]
status: ready
---

# PLAN: MZP-032 — Gerichte nach Art filtern

Die Filterzeile der Gerichte-Seite filtert künftig nicht nur nach Kategorie, sondern
auch nach Art: Hauptgericht, Frühstück oder Snack. Es bleibt bei einer einzigen
Auswahl, in der immer nur eine Sache gewählt ist, entweder eine Art oder eine
Kategorie.

Vorlage ist der TODO-Punkt „Hauptgericht, Frühstück und Snack in den Filter mit
aufnehmen“ aus `docs/notes.txt`. Alle Entscheidungen stammen aus der Befragung vom
2026-09-25. Die Filterzeile selbst stammt aus MZP-024.

## Akzeptanzkriterien

- Die Filterzeile trägt das sichtbare Label „Filter“, und so heißt auch die Auswahl.
  Sie steht da, sobald mindestens ein Gericht eine Art oder eine Kategorie trägt.
  Tragen alle Gerichte weder Art noch Kategorie, oder gibt es keine Gerichte, fehlt
  sie.
- Im Rad steht zuerst „Alle“. Danach folgt die Gruppe `<optgroup label="Art">` mit den
  Arten, die mindestens ein Gericht trägt, fest in der Reihenfolge Hauptgericht,
  Frühstück, Snack. Danach die Gruppe `<optgroup label="Kategorie">` mit den
  Kategorien in alphabetischer Reihenfolge wie heute. Eine leere Gruppe entfällt.
  Ausgeblendete Gerichte zählen mit. Einen Eintrag „Ohne Art“ gibt es nicht.
- Mit einer gewählten Art zeigt die Liste nur die Gerichte, die genau diese Art
  tragen, ausgeblendete eingeschlossen, weiter nach Namen sortiert.
- Überschrift und Ansage folgen dem Muster der Kategorien: sichtbar
  `Gerichte, 3 / 12 (1 💡̸)`, zugänglicher Name „Gerichte, 3 von 12 (1 ausgeblendet)“,
  Ansage „Frühstück, 3 von 12 Gerichten.“ (bei einem Gericht insgesamt
  „Frühstück, 1 von 1 Gericht.“).
- Eine Kategorie namens „Snack“ und die Art Snack sind zwei getrennte Einträge. Die
  Wahl des einen filtert nicht nach dem anderen.
- Für Arten gilt alles, was heute für Kategorien gilt: „Alle“ und das ✕ setzen zurück
  („Filter zurückgesetzt, 12 Gerichte.“, beim ✕ geht der Fokus auf die Auswahl), der
  Filter bleibt bei der Rückkehr aus einem Gericht erhalten, und verschwindet die
  gewählte Art (das letzte Gericht dieser Art wird geändert oder gelöscht, auch auf
  einem anderen Gerät), gilt stillschweigend „Alle“.
- Die bisherigen Kategorie-Fälle bleiben inhaltlich unverändert grün, nur angepasst
  an das neue Label und die neuen Optionswerte. Die Liste mit gewählter Art ist ohne
  axe-Befund.

### Bewusste Grenzen

- Art und Kategorie lassen sich nicht kombinieren, es gibt genau einen Filter zur
  Zeit.
- Kein Eintrag „Ohne Art“ für Gerichte ohne Haken.
- Der Filter gilt nur auf der Gerichteliste. Wochenplan, Vorschläge und Vorräte
  bleiben unberührt.
- Heißt eine Kategorie genauso wie eine Art, klingen die Ansagen beider Wahlen gleich.
  Im Rad unterscheiden die Gruppen die beiden.

## Wesentliche Entscheidungen und Abwägungen

1. **Eine Auswahl, ein Wert, gruppiert (B1).**
   - Warum: Die Seite bleibt kompakt, und das Zustandsmodell mit einem Wert bleibt
     erhalten. Die Optionsgruppen trennen Art und Kategorie sichtbar. Zeigt iOS die
     Gruppenüberschriften nicht an, bleibt eine flache Liste in derselben
     Reihenfolge übrig, und es geht nichts kaputt.
   - Auswirkung: Das Label wechselt von „Kategorie“ zu „Filter“.
2. **Neuer Domänentyp `MealFilter` in `src/meals/domain/mealFilter.ts`.**
   ```ts
   export type MealFilter =
     | { by: 'kind'; kind: ChosenMealKind }
     | { by: 'category'; category: string }
   ```
   - Warum: Nur so bleiben die Art Snack und eine Kategorie „Snack“ auseinander. Die
     Ableitungen sind reine Funktionen und entstehen test-getrieben, ohne React.
   - Auswirkung: `MealsArea` hält `chosenFilter: MealFilter | null` statt
     `chosenCategory`. Wirksam ist immer `knownFilter(...)` und wird bei jedem
     Rendern abgeleitet, wie heute `knownCategory`.
3. **Nur benutzte Arten im Rad.**
   - Warum: Das entspricht `mealCategories`. Die gefilterte Liste ist nie leer, und
     die Überschrift braucht keinen Fall „0 von 12“.
   - Auswirkung: `usedMealKinds(meals)` liefert die Arten in fester Reihenfolge.
     `knownFilter` gibt `null` zurück, wenn die gewählte Art nicht mehr benutzt wird.
4. **Ansage wie bei den Kategorien, ohne Gruppennamen.**
   - Warum: Die Ansage bleibt kurz, und die heutige Kategorie-Ansage ändert sich nicht.
   - Auswirkung: `categoryFilterAnnouncement(category, …)` wird zu
     `mealFilterAnnouncement(filter, …)`. Den Namen liefert `mealFilterName(filter)`,
     und das nutzt die bisher private Tabelle `mealKindNames`.
5. **Codierte Optionswerte, Rückübersetzung per Nachschlagen.** Das `value` einer
   Option ist `kind:breakfast` oder `category:Suppe`, „Alle“ bleibt `''`. Beim `onChange`
   wird unter den angezeigten Filtern der mit dem passenden Wert gesucht. Zerlegt wird
   dabei nichts.
   - Warum: Ein `<select>` kennt nur Zeichenketten. Durch das Nachschlagen muss man
     Kategorienamen mit Doppelpunkt nicht gesondert behandeln.
   - Auswirkung: Die Codierung lebt nur in der UI-Komponente. Die Tests prüfen den
     Text der gewählten Option statt `toHaveValue('Suppe')`.
6. **Umbenennung `MealCategoryFilter` → `MealFilterSelect`.** Die id wird `mealFilter`, die
   CSS-Klasse `.mealFilter`, die Props heißen `activeFilter` und `onChooseFilter`.
   - Warum: Die Komponente filtert nicht mehr nur nach Kategorie. `MealFilter` ist
     schon der Domänentyp, deshalb trägt die Komponente das Suffix `Select`.
7. **Keine neuen E2E-Tests, keine Firestore-Änderung, kein neuer Port.**
   - Warum: Es gibt weder einen neuen Adapter noch neue Persistenz. Das Verhalten
     decken Domänentests und `MealsArea.test.tsx` ab. Kein E2E-Test spricht die
     Filterzeile an.

## Ausgangslage

```
MealsArea                                   src/meals/ui/MealsArea.tsx:50-72,144-155
  useState chosenCategory: string | null
  categories     = mealCategories(meals)
  activeCategory = knownCategory(categories, chosenCategory)
  shownMeals     = mealsInCategory(meals, activeCategory)
        │
        ▼
MealListPage                                src/meals/ui/MealListPage.tsx
  h1 aria = mealsHeading(meals, activeCategory === null ? null : totalCount)
  MealCategoryFilter  (nur wenn categories.length > 0)   MealListPage.tsx:70-76
     <label for="mealCategoryFilter">Kategorie</label>
     <select> Alle | Auflauf | Suppe …   [✕] bei aktivem Filter
  ul.itemList → MealListRow × shownMeals
```

```
┌────────────────────────────────────┐
│ [Liste][Plan][Gerichte][Vor.][⚙]   │
│ Gerichte, 4 / 12 (1 💡̸)      [ + ]│
│ Kategorie [ Suppe         ▾] [ ✕ ] │
├────────────────────────────────────┤
│    Linsensuppe                [🛒] │
│ 💡̸ Zwiebelsuppe               [🛒] │
└────────────────────────────────────┘
```

- `src/meals/domain/meal.ts:11-13`: `MealKind = 'mainMeal' | 'breakfast' | 'snack' | 'none'`,
  `ChosenMealKind = Exclude<MealKind, 'none'>`. Ein Gericht hat genau eine Art.
- `src/meals/domain/mealCategory.ts:47-55` (`knownCategory`) und `:57-63`
  (`mealsInCategory`) enthalten die heutige Filterlogik.
- `src/meals/domain/announcements.ts:82-88`: `categoryFilterAnnouncement`. In
  `:177-181` steht `mealKindNames` (Hauptgericht, Frühstück, Snack), nicht
  exportiert.
- `src/meals/ui/MealCategoryFilter.tsx`: Label, `<select>` mit `value={activeCategory ?? ''}`,
  ✕ samt Fokus auf die Auswahl.
- `src/index.css:500-510`: `.categoryFilter`.
- `src/meals/ui/MealsArea.test.tsx:11-23`: Die Hilfe `meal(...)` setzt als Standard
  `kind: 'mainMeal'`. Ohne weitere Angabe trägt also jedes Testgericht eine Art.
  `:209-215`: die Hilfen `categoryFilter()` (`combobox` „Kategorie“) und
  `chooseCategory(name)`. `:844-1030`: die Filterfälle aus MZP-024, darunter vier
  Prüfungen mit `toHaveValue` (`:929`, `:951`, `:973`, `:998`).

## Zielbild

```
MealsArea
  useState chosenFilter: MealFilter | null
  categories   = mealCategories(meals)                  (auch fürs Formular)
  kinds        = usedMealKinds(meals)
  activeFilter = knownFilter(kinds, categories, chosenFilter)
  shownMeals   = mealsMatching(meals, activeFilter)
        │
        ▼
MealListPage(meals = shownMeals, totalCount, kinds, categories, activeFilter, onChooseFilter)
  h1 aria = mealsHeading(shownMeals, activeFilter === null ? null : totalCount)
  MealFilterSelect  (nur wenn kinds.length + categories.length > 0)
     <label for="mealFilter">Filter</label>
     <select id="mealFilter">
       <option value="">Alle</option>
       <optgroup label="Art">        kind:mainMeal | kind:breakfast | kind:snack
       <optgroup label="Kategorie">  category:Auflauf | category:Suppe …
     [✕] bei aktivem Filter
```

```
mit Art „Frühstück“                          Rad
┌────────────────────────────────────┐      ┌────────────────────┐
│ [Liste][Plan][Gerichte][Vor.][⚙]   │      │ Alle               │
│ Gerichte, 3 / 12 (1 💡̸)      [ + ]│      │ Art                │
│ Filter [ Frühstück        ▾] [ ✕ ] │      │   Hauptgericht     │
├────────────────────────────────────┤      │   Frühstück   ✓    │
│    Müsli                      [🛒] │      │   Snack            │
│    Pfannkuchen                [🛒] │      │ Kategorie          │
│ 💡̸ Porridge                   [🛒] │      │   Auflauf          │
└────────────────────────────────────┘      │   Suppe            │
 h1-Name: "Gerichte, 3 von 12 (1 ausgeblendet)" └────────────────────┘
 Auswahl: "Filter, Frühstück, Einblendmenü"
```

Ablauf mit VoiceOver:

```
Fokus auf "Filter, Alle" ─Doppeltipp─▶ Rad ─"Frühstück"─▶ fertig
   Ansage: "Frühstück, 3 von 12 Gerichten."   Fokus bleibt auf der Auswahl
Wischen ─▶ "Filter zurücksetzen, Taste" ─Doppeltipp─▶
   Ansage: "Filter zurückgesetzt, 12 Gerichte."   Fokus: "Filter, Alle"
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `mealFilter.ts`: neu
    - `MealFilter`: Typ, siehe Entscheidung 2
    - `usedMealKinds(meals: readonly Meal[]): readonly ChosenMealKind[]`: benutzte Arten
      in der Reihenfolge `mainMeal`, `breakfast`, `snack`
    - `knownFilter(kinds, categories, chosen): MealFilter | null`: Die Art bleibt, wenn
      sie in `kinds` steht. Die Kategorie geht über `knownCategory` und liefert deren
      heutige Schreibweise.
    - `mealsMatching(meals, filter): readonly Meal[]`: `null` gibt alle zurück, eine Art
      vergleicht `meal.kind`, eine Kategorie delegiert an `mealsInCategory`.
  - `mealFilter.test.ts`: neu
  - `announcements.ts`
    - `mealFilterName(filter: MealFilter): string`: neu, der Name der Art aus
      `mealKindNames` oder die Kategorie
    - `mealFilterAnnouncement(filter, shownCount, totalCount)`: ersetzt
      `categoryFilterAnnouncement`
  - `announcements.test.ts`: `describe('categoryFilterAnnouncement')` wird zu
    `describe('mealFilterAnnouncement')`, `describe('mealFilterName')` kommt dazu
- `src/meals/ui`
  - `MealCategoryFilter.tsx` → `MealFilterSelect.tsx`: Label „Filter“, Optionsgruppen,
    codierte Werte, das ✕ unverändert
  - `MealListPage.tsx`: Props `kinds`, `activeFilter`, `onChooseFilter` statt
    `activeCategory`, `onChooseCategory`
  - `MealsArea.tsx`: Zustand `chosenFilter`, Ableitungen, Ansage
  - `MealsArea.test.tsx`: Hilfen `mealFilter()` und `chooseFilter(name)`, bestehende
    Fälle angepasst, neue Fälle für Arten
- `src/index.css`: `.categoryFilter` → `.mealFilter`

Wiederverwendet werden `mealCategories`, `knownCategory`, `mealsInCategory`,
`mealKindNames`, `mealCountPhrase`, `filterResetAnnouncement`, `shownMealsCount`,
`CrossIcon` und `.iconButton`. Es gibt keine neue Abhängigkeit.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine

Die Filterzeile heißt „Filter“, bietet Arten und Kategorien in Gruppen an und filtert
die Liste nach der gewählten Art oder Kategorie.

**Aufgaben**:

- [x] Test zuerst: `src/meals/domain/mealFilter.test.ts`, `describe('usedMealKinds')`
      - `finds no kind without meals` → `[]`
      - `finds no kind when no meal carries one` (nur `kind: 'none'`) → `[]`
      - `lists each used kind once in the fixed order` (Snack, Hauptgericht, Snack,
        Frühstück) → `['mainMeal', 'breakfast', 'snack']`
      - `counts hidden meals` (nur ein ausgeblendetes Frühstück) → `['breakfast']`
- [x] Test zuerst: `describe('knownFilter')` mit `kinds = ['mainMeal', 'snack']` und
      den Kategorien „Auflauf“ und „Suppe“
      - `finds nothing when nothing is chosen` → `null`
      - `finds the chosen kind` → `{ by: 'kind', kind: 'snack' }`
      - `finds nothing when the chosen kind is no longer used` (`breakfast`) → `null`
      - `finds the chosen category with its known spelling` (`suppe`) →
        `{ by: 'category', category: 'Suppe' }`
      - `finds nothing when the chosen category is gone` → `null`
- [x] Test zuerst: `describe('mealsMatching')`
      - `keeps every meal without a filter`
      - `keeps the meals of the chosen kind, hidden ones included`
      - `keeps the meals carrying the chosen category`
      - `tells a kind from a category of the same name`: das Gericht mit der Art
        Snack und das Gericht mit der Kategorie „Snack“ werden jeweils nur vom
        passenden Filter behalten
      - `keeps the order of the meals`
- [x] `src/meals/domain/mealFilter.ts` anlegen:
      ```ts
      export type MealFilter =
        | { by: 'kind'; kind: ChosenMealKind }
        | { by: 'category'; category: string }

      const KIND_ORDER: readonly ChosenMealKind[] = ['mainMeal', 'breakfast', 'snack']

      export function usedMealKinds(meals: readonly Meal[]): readonly ChosenMealKind[] {
        return KIND_ORDER.filter((kind) => meals.some((meal) => meal.kind === kind))
      }

      export function knownFilter(
        kinds: readonly ChosenMealKind[],
        categories: readonly CategoryOverview[],
        chosen: MealFilter | null,
      ): MealFilter | null {
        if (chosen === null) return null
        if (chosen.by === 'kind') return kinds.includes(chosen.kind) ? chosen : null
        const category = knownCategory(categories, chosen.category)
        return category === null ? null : { by: 'category', category }
      }

      export function mealsMatching(
        meals: readonly Meal[],
        filter: MealFilter | null,
      ): readonly Meal[] {
        if (filter === null) return meals
        if (filter.by === 'kind') return meals.filter((meal) => meal.kind === filter.kind)
        return mealsInCategory(meals, filter.category)
      }
      ```
- [x] Test zuerst: `src/meals/domain/announcements.test.ts`
      - `mealFilterName`: `{ by: 'kind', kind: 'mainMeal' }` → „Hauptgericht“,
        `breakfast` → „Frühstück“, `snack` → „Snack“,
        `{ by: 'category', category: 'Suppe' }` → „Suppe“
      - `mealFilterAnnouncement`: die bisherigen Fälle mit
        `{ by: 'category', category: 'Suppe' }` (4, 12 → „Suppe, 4 von 12 Gerichten.“;
        1, 1 → „Suppe, 1 von 1 Gericht.“), dazu
        `{ by: 'kind', kind: 'breakfast' }`, 3, 12 → „Frühstück, 3 von 12 Gerichten.“
- [x] `src/meals/domain/announcements.ts`: `mealFilterName` neu,
      `categoryFilterAnnouncement` ersetzen durch
      ```ts
      export function mealFilterAnnouncement(
        filter: MealFilter,
        shownCount: number,
        totalCount: number,
      ): string {
        return `${mealFilterName(filter)}, ${shownCount} von ${mealCountPhrase(totalCount)}.`
      }
      ```
      `mealKindNames` bleibt privat und wird von `mealFilterName` genutzt.
- [x] `src/meals/ui/MealCategoryFilter.tsx` per `git mv` zu
      `src/meals/ui/MealFilterSelect.tsx` umbenennen, die Komponente
      `MealFilterSelect` mit den Props
      ```ts
      type MealFilterProps = {
        kinds: readonly ChosenMealKind[]
        categories: readonly CategoryOverview[]
        activeFilter: MealFilter | null
        onChooseFilter: (filter: MealFilter | null) => void
      }
      ```
      Umsetzung:
      - `filterValue(filter)` liefert `kind:${kind}` oder `category:${category}`,
        `NO_FILTER = ''`.
      - Die angebotenen Filter sind `kinds` als Art-Filter plus `categories` als
        Kategorie-Filter. `onChange` sucht darunter den mit
        `filterValue(filter) === event.target.value`, bei `NO_FILTER` (und nichts
        gefunden) gibt es `null` weiter.
      - `<label htmlFor="mealFilter">Filter</label>`,
        `<select id="mealFilter" value={activeFilter === null ? NO_FILTER : filterValue(activeFilter)}>`.
      - Zuerst `<option value="">Alle</option>`, dann bei `kinds.length > 0` ein
        `<optgroup label="Art">` mit Optionen `mealFilterName(...)`, dann bei
        `categories.length > 0` ein `<optgroup label="Kategorie">`.
      - `<div className="mealFilter">`, ✕ und Fokus wie bisher, die Ref heißt
        `filterSelect`.
- [x] `src/meals/ui/MealListPage.tsx`: Props `kinds: readonly ChosenMealKind[]`,
      `activeFilter`, `onChooseFilter` statt `activeCategory`, `onChooseCategory`.
      `filteredFromCount = activeFilter === null ? null : totalCount`.
      `MealFilterSelect` nur bei `kinds.length > 0 || categories.length > 0`.
- [x] `src/meals/ui/MealsArea.tsx`: `useState<MealFilter | null>(null)` als
      `chosenFilter`, dazu `kinds = usedMealKinds(meals.meals)`,
      `activeFilter = knownFilter(kinds, categories, chosenFilter)` und
      `mealsMatching(meals.meals, activeFilter)` für die Liste. `chooseFilter(filter)`
      setzt den Zustand und sagt an:
      `filter === null ? filterResetAnnouncement(total) : mealFilterAnnouncement(filter, mealsMatching(meals.meals, filter).length, total)`.
- [x] `src/index.css`: `.categoryFilter` und `.categoryFilter select` in `.mealFilter`
      umbenennen, die Regeln bleiben gleich.
- [x] `src/meals/ui/MealsArea.test.tsx`, bestehende Filterfälle anpassen:
      - Die Hilfen heißen `mealFilter()` (`getByRole('combobox', { name: 'Filter' })`)
        und `chooseFilter(name)` (`userEvent.selectOptions(mealFilter(), name)`).
        Dazu kommt `chosenFilterText()`, der Text von `selectedOptions[0]`.
      - `toHaveValue('Suppe')`, `toHaveValue('suppe')` und `toHaveValue('')`
        (`:929`, `:951`, `:973`, `:998`) prüfen stattdessen `chosenFilterText()` mit
        „Suppe“, „suppe“ bzw. „Alle“.
      - `offers no category filter without categories` wird zu
        `offers no filter without kinds and categories`, das Gericht bekommt
        `kind: 'none'`.
      - `offers every category to filter by, hidden meals included`: Die Gerichte
        bekommen `kind: 'none'`, die erwarteten Optionen bleiben
        `['Alle', 'Auflauf', 'Suppe']`.
- [x] `src/meals/ui/MealsArea.test.tsx`, neue Fälle:
      - `offers the used kinds and the categories in groups`: Gerichte mit Snack,
        Hauptgericht, Frühstück (ausgeblendet) und der Kategorie „Suppe“. Die Gruppen
        (`getAllByRole('group')`) heißen „Art“ und „Kategorie“, die Optionen lauten
        `['Alle', 'Hauptgericht', 'Frühstück', 'Snack', 'Suppe']`.
      - `offers only the kinds that meals carry`: nur Hauptgerichte und keine
        Kategorien, also Optionen `['Alle', 'Hauptgericht']`, keine Gruppe
        „Kategorie“.
      - `shows only the meals of the chosen kind`: „Frühstück“ wählen, dann zeigt
        `shownMealNames()` nur die Frühstücke, ausgeblendete eingeschlossen,
        sortiert.
      - `counts and announces the meals of the chosen kind`: Die Überschrift heißt
        „Gerichte, 2 von 4 (1 ausgeblendet)“, die Ansage lautet „Frühstück, 2 von 4
        Gerichten.“
      - `tells the kind from a category of the same name`: ein Gericht mit der Art
        Snack, ein Hauptgericht mit der Kategorie „Snack“. Wahl per
        `userEvent.selectOptions(mealFilter(), 'kind:snack')` bzw. `'category:Snack'`,
        und jeweils nur das passende Gericht ist sichtbar.
      - `shows every meal when the chosen kind is gone`: „Snack“ wählen, dann über
        `client.changeMeals` (in `act`) das einzige Snack-Gericht auf `mainMeal`
        setzen. Die Auswahl zeigt „Alle“, alle Gerichte sind sichtbar.
      - `resets a chosen kind with the cross`: „Frühstück“ wählen, „Filter
        zurücksetzen“ drücken. Die Ansage lautet „Filter zurückgesetzt, n
        Gerichte.“, die Auswahl zeigt „Alle“ und hat den Fokus.
      - `has no accessibility violations with a chosen kind`.
- [ ] `docs/notes.txt`: den TODO-Punkt „Hauptgericht, Frühstück und Snack in den
      Filter mit aufnehmen“ nach der manuellen Prüfung auf `x` setzen und nach DONE
      verschieben.

**Automatisierte Verifikation**:

- [x] Die neuen Fälle in `mealFilter.test.ts` und `announcements.test.ts` schlagen vor
      der Umsetzung fehl und laufen danach grün.
- [x] Alle Filterfälle in `MealsArea.test.tsx` laufen grün, die angepassten wie die
      neuen.
- [x] `grep -rn "MealCategoryFilter\|categoryFilter\|chooseCategory" src` findet nichts
      mehr.
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [x] `npm run test:e2e` läuft unverändert grün.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA, VoiceOver an):

- [ ] VoiceOver liest die Auswahl als „Filter, Alle, Einblendmenü“ (oder sinngemäß).
- [ ] Das Rad zeigt „Alle“, darunter die Arten und die Kategorien. Notieren, ob iOS
      die Überschriften „Art“ und „Kategorie“ anzeigt und ob VoiceOver sie vorliest.
      Beides ist erwünscht, aber keine Bedingung.
- [ ] Nach der Wahl von „Frühstück“ kommt „Frühstück, n von m Gerichten.“, die Liste
      zeigt nur Frühstücke, und die Überschrift liest „Gerichte, n von m“.
- [ ] Das ✕ setzt auch eine gewählte Art zurück, und der VoiceOver-Cursor steht danach
      auf „Filter, Alle“.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Die neuen Fälle in `MealsArea.test.tsx` liefen sofort grün, weil die Komponente
  schon umgebaut war. Test-getrieben entstanden sind die Domänenfälle
  (`mealFilter.test.ts`, `announcements.test.ts`), die vorher rot waren.
- Der grep `categoryFilter` findet noch die neue lokale Variable `categoryFilters` in
  `MealFilterSelect.tsx`. Von den alten Symbolen `MealCategoryFilter`,
  `.categoryFilter`, `categoryFilterAnnouncement` und `chooseCategory` ist nichts
  übrig.
- `npm run test`: 1142 grün, `npm run test:e2e`: 36 grün, Lint und Build sauber.

## Verweise

- `docs/notes.txt`: TODO „Hauptgericht, Frühstück und Snack in den Filter mit
  aufnehmen“
- `docs/agents/plans/2026-09-24-gerichte-nach-kategorie-filtern.md` (MZP-024): die
  Filterzeile, Überschrift `n / m`, Ansagen, ✕
- `docs/agents/plans/2026-09-25-snack-kennzeichnen.md` (MZP-026): `kind` mit `snack`
- `src/meals/domain/meal.ts`, `src/meals/domain/mealCategory.ts`,
  `src/meals/domain/announcements.ts`, `src/meals/ui/MealCategoryFilter.tsx`,
  `src/meals/ui/MealListPage.tsx`, `src/meals/ui/MealsArea.tsx`
