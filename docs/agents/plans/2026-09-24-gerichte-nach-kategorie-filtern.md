---
date: 2026-09-24T13:58:29.466810+00:00
git_commit: 7e6436397e18f4a4cfd81e4fd88ce535929aa93c
branch: main
story: MZP-024
topic: "Gerichte nach Kategorie filtern"
tags: [plan, meals, announcements, MealListPage, MealsArea, voiceover]
status: done
---

# PLAN: MZP-024 — Gerichte nach Kategorie filtern

Auf der Gerichte-Seite steht zwischen Überschrift und Liste eine Filterzeile
„Kategorie [Auswahl ▾] [✕]“. Mit einer gewählten Kategorie zeigt die Liste nur die
Gerichte, die diese Kategorie tragen. Das ✕ setzt den Filter zurück.

Vorlage ist der erste Teil des TODO-Punkts „Kategorien nutzen: Gerichteliste nach
Kategorie filtern, im Wochenplan nach Kategorie wuerfeln“ aus `docs/notes.txt`. Das
Würfeln im Wochenplan gehört nicht zu diesem Plan. Alle Entscheidungen stammen aus der
Befragung vom 2026-09-24.

## Akzeptanzkriterien

- Zwischen Überschrift und Liste steht die Zeile mit dem sichtbaren Label „Kategorie“
  und einer Auswahl (`<select>`), sobald mindestens ein Gericht eine Kategorie trägt.
  Ohne Kategorien und ohne Gerichte fehlt die Zeile.
- Erster Eintrag der Auswahl ist „Alle“. Danach folgen alle Kategorien alphabetisch
  (`de-DE`), nur mit Namen, ohne Anzahl. Kategorien, die nur ausgeblendete Gerichte
  tragen, stehen mit drin.
- Mit einer gewählten Kategorie zeigt die Liste nur die Gerichte, die sie tragen
  (normalisiert verglichen), ausgeblendete eingeschlossen, weiter nach Namen sortiert.
- Überschrift bei aktivem Filter: sichtbar `Gerichte, 4 / 12 (1 💡̸)`, zugänglicher Name
  `Gerichte, 4 von 12 (1 ausgeblendet)`. Die Zahl der ausgeblendeten bezieht sich auf die
  gefilterten Gerichte, ohne ausgeblendete entfällt die Klammer. Auch wenn alle Gerichte
  passen, steht dort `12 / 12`. Ohne Filter bleibt die Überschrift wie heute.
- Nach der Wahl einer Kategorie lautet die Ansage „Suppe, 4 von 12 Gerichten.“ (bei
  einem Gericht insgesamt „Suppe, 1 von 1 Gericht.“). Nach der Wahl von „Alle“ lautet
  sie „Filter zurückgesetzt, 12 Gerichte.“ (bzw. „1 Gericht.“).
- Bei aktivem Filter steht rechts neben der Auswahl ein Knopf mit ✕-Icon und dem Namen
  „Filter zurücksetzen“. Er setzt auf „Alle“, sagt „Filter zurückgesetzt, 12 Gerichte.“
  an und legt den Fokus auf die Auswahl. Ohne Filter fehlt der Knopf.
- Der Filter bleibt erhalten, wenn man ein Gericht öffnet, bearbeitet, anlegt, löscht
  oder abbricht und zur Liste zurückkehrt. Bei der Rückkehr liegt der Fokus wie heute
  auf der Überschrift. Nach einem Tabwechsel oder Neuladen gilt wieder „Alle“.
- Verschwindet die gewählte Kategorie (anderes Gerät löscht oder benennt sie um, oder
  das letzte Gericht mit ihr wird geändert oder gelöscht), gilt stillschweigend „Alle“.
  Ändert sich nur die Schreibweise, bleibt der Filter und die Auswahl zeigt die neue
  Schreibweise.
- Die Liste mit Filterzeile, mit und ohne aktiven Filter, ist ohne axe-Befund. Die
  bestehenden Unit-, Komponenten- und E2E-Tests bleiben grün.

### Bewusste Grenzen

- Genau eine Kategorie zur Zeit, keine Mehrfachauswahl.
- Kein Filter nach Art (Hauptgericht/Frühstück), Sichtbarkeit oder Name.
- Der Filter gilt nur auf der Gerichteliste. Wochenplan, Vorschläge und Vorräte bleiben
  unberührt.
- Ein neu angelegtes Gericht außerhalb der gewählten Kategorie erscheint nach der
  Rückkehr nicht in der Liste. Die Überschrift `n / m` zeigt, dass gefiltert ist.

## Wesentliche Entscheidungen und Abwägungen

1. **Nur Kategorie, eine zur Zeit, natives `<select>`.**
   - Warum: Das iOS-Auswahlrad ist mit VoiceOver, dem wichtigsten Bedienweg, das
     robusteste Element. Bei einer einzigen Kategorie stellt sich die Frage nach UND
     oder ODER nicht.
   - Auswirkung: Der Zustand ist `string | null`. Eine spätere Mehrfachauswahl wäre
     eine Erweiterung, kein Umbau.
2. **„Alle“ plus ✕, das ✕ nur bei aktivem Filter.**
   - Warum: Ein `<select>` braucht einen Wert für „kein Filter“. Das ✕ ist die
     Abkürzung mit einem Tipp. Ein deaktivierter Knopf würde unter VoiceOver nur
     „abgeblendet“ vorlesen.
   - Auswirkung: Nach dem ✕ verschwindet der Knopf. Deshalb geht der Fokus ausdrücklich
     auf die Auswahl, sonst fiele er ins Leere.
3. **Überschrift sichtbar `4 / 12`, gesprochen `4 von 12`.**
   - Warum: „von“ ist vorgelesen verständlich, „/“ ist sichtbar kürzer. Das
     `aria-label` an der Überschrift gibt es seit MZP-023 ohnehin.
   - Auswirkung: `mealsHeading` bekommt die Zahl, aus der gefiltert wurde. Den sichtbaren
     Zähler liefert die neue Funktion `shownMealsCount`. Sichtbarer Text und
     `aria-label` unterscheiden sich jetzt auch ohne ausgeblendete Gerichte.
4. **Ansage bei jeder Änderung des Filters.** „Suppe, 4 von 12 Gerichten.“ bzw.
   „Filter zurückgesetzt, 12 Gerichte.“
   - Warum: Nach der Wahl bleibt der Fokus auf der Auswahl, dass die Liste kleiner
     geworden ist, würde man sonst nicht mitbekommen. Der Kategoriename bestätigt die
     Wahl, weil das Rad leicht einen Eintrag zu weit dreht.
   - Auswirkung: Die Wahl von „Alle“ im Rad und der Tipp auf das ✕ klingen gleich.
5. **Filterlogik als reine Funktionen in `mealCategory.ts`.**
   `knownCategory(known, chosen)` liefert die bekannte Schreibweise oder `null`,
   `mealsInCategory(meals, category)` die passenden Gerichte.
   - Warum: TDD ohne React. Das Verschwinden einer Kategorie wird bei jedem Rendern
     abgeleitet, es gibt keinen Effekt, der nachträglich zurücksetzt. Dasselbe Prinzip
     nutzt `CategoriesArea` für eine verschwundene Kategorie.
   - Auswirkung: `MealsArea` hält nur die Wahl, wie getippt. Wirksam ist immer
     `knownCategory(mealCategories(meals), chosen)`.
6. **Zustand in `MealsArea` per `useState`.**
   - Warum: `SignedInApp` rendert nur einen Bereich zur Zeit (`src/SignedInApp.tsx:188-230`).
     Ein Tabwechsel baut `MealsArea` ab, und genau das ist gewollt: Ein unsichtbar
     weiterlaufender Filter wäre unter VoiceOver eine Falle.
   - Auswirkung: kein localStorage-Adapter, keine Änderung an `SignedInApp`.
7. **Eigene Komponente `MealCategoryFilter`.** Sie enthält Label, Auswahl, ✕ und den
   Fokus nach dem Zurücksetzen.
   - Warum: `MealListPage` bleibt übersichtlich, und die Ref auf die Auswahl lebt dort,
     wo sie gebraucht wird.
8. **Keine neuen E2E-Tests.**
   - Warum: kein neuer Adapter, keine Persistenz. Die Architekturvorgabe verlangt einen
     Integrationstest je Adapter, das Verhalten decken die Komponententests in
     `MealsArea.test.tsx` ab.

## Ausgangslage

```
MealsArea ──meals.meals (byName)──▶ MealListPage
  MealsArea.tsx:120-127               h1 aria-label = mealsHeading(meals)   MealListPage.tsx:31
                                      sichtbar: mealsHeading oder "Gerichte, n (h 💡̸)"
                                      ul.itemList → MealListRow × n
```

```
┌────────────────────────────────────┐
│ [Liste][Plan][Gerichte][Vor.][⚙]   │
│ Gerichte, 12 (3 💡̸)          [ + ]│  h1, Fokus beim Anzeigen (useHeadingFocus)
├────────────────────────────────────┤
│    Bolognese                  [🛒] │
│    Linsensuppe                [🛒] │
│ 💡̸ Pfannkuchen                [🛒] │
└────────────────────────────────────┘
```

- `src/meals/domain/meal.ts:19-27`: `NewMeal.categories: readonly string[]` seit MZP-021.
- `src/meals/domain/mealCategory.ts:42-55`: `mealCategories(meals)` liefert alle
  Kategorien alphabetisch mit Anzahl, ausgeblendete Gerichte zählen mit.
  `carriesCategory` (Zeile 101-103) und `sameCategory` (Zeile 18-20) vergleichen über
  `normalizeMealName`, sind aber nicht exportiert.
- `src/meals/domain/announcements.ts:51-57`: `mealsHeading(meals)` mit den Fällen
  „keine“, „n“, „n (h ausgeblendet)“. `mealCountPhrase` (Zeile 115-117) liefert „1
  Gericht“ bzw. „n Gerichten“ (Dativ).
- `src/meals/ui/MealListPage.tsx:24-40`: `hiddenCount = countHiddenMeals(meals)`,
  sichtbar entweder der reine Text oder `Gerichte, {n} ({h} <LightbulbOffIcon
  className="headingIcon" />)`.
- `src/meals/ui/MealsArea.tsx:43`: der einzige Zustand ist `page`. `announce` liegt
  schon als Prop vor.
- `src/index.css:92-118`: Schrift, Mindesthöhe 44 px, Rahmen und Farben gelten für
  `input` und `textarea`, nicht für `select`.
- `src/index.css:425-438`: `.iconButton` (44 px Tippfläche) und `.buttonIcon` (24 px).
- Tests: `src/meals/ui/MealsArea.test.tsx:785-808` prüfen die Überschrift über
  `getByRole('heading', { name })` und `textContent`,
  `src/meals/domain/announcements.test.ts:61-82` prüfen `mealsHeading`.

## Zielbild

```
MealsArea
  useState chosenCategory: string | null            (wie gewählt)
  categories = mealCategories(meals.meals)
  activeCategory = knownCategory(categories, chosenCategory)   → Schreibweise oder null
  shownMeals = mealsInCategory(meals.meals, activeCategory)
        │
        ▼
MealListPage(meals = shownMeals, totalCount, categories, activeCategory, onChooseCategory)
  h1 aria-label = mealsHeading(shownMeals, activeCategory === null ? null : totalCount)
     sichtbar   = "Gerichte, " + shownMealsCount(...) [+ " (h 💡̸)"]
  MealCategoryFilter  (nur wenn categories.length > 0)
     <label for> Kategorie   <select> Alle | Auflauf | Suppe …   [✕] nur bei aktivem Filter
  ul.itemList → MealListRow × shownMeals
```

```
ohne Filter                                 mit Filter „Suppe“
┌────────────────────────────────────┐      ┌────────────────────────────────────┐
│ [Liste][Plan][Gerichte][Vor.][⚙]   │      │ [Liste][Plan][Gerichte][Vor.][⚙]   │
│ Gerichte, 12 (3 💡̸)          [ + ]│      │ Gerichte, 4 / 12 (1 💡̸)      [ + ]│
│ Kategorie [ Alle            ▾]     │      │ Kategorie [ Suppe         ▾] [ ✕ ] │
├────────────────────────────────────┤      ├────────────────────────────────────┤
│    Bolognese                  [🛒] │      │    Linsensuppe                [🛒] │
│    Linsensuppe                [🛒] │      │    Minestrone                 [🛒] │
│ 💡̸ Pfannkuchen                [🛒] │      │    Tomatensuppe               [🛒] │
│    ...                             │      │ 💡̸ Zwiebelsuppe               [🛒] │
└────────────────────────────────────┘      └────────────────────────────────────┘
 h1-Name: "Gerichte, 12 (3 ausgeblendet)"    h1-Name: "Gerichte, 4 von 12 (1 ausgeblendet)"
                                             Auswahl: "Kategorie, Suppe, Einblendmenü"
                                             ✕-Name:  "Filter zurücksetzen"
```

Ablauf mit VoiceOver:

```
Fokus auf "Kategorie, Alle" ─Doppeltipp─▶ Auswahlrad ─"Suppe"─▶ fertig
   Ansage: "Suppe, 4 von 12 Gerichten."   Fokus bleibt auf der Auswahl
Wischen ─▶ "Filter zurücksetzen, Taste" ─Doppeltipp─▶
   Ansage: "Filter zurückgesetzt, 12 Gerichte."   Fokus: "Kategorie, Alle"
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `mealCategory.ts`
    - `knownCategory(known: readonly CategoryOverview[], chosen: string | null): string | null`: neu
    - `mealsInCategory(meals: readonly Meal[], category: string | null): readonly Meal[]`:
      neu, nutzt das vorhandene `carriesCategory`
  - `mealCategory.test.ts`: `describe('knownCategory')`, `describe('mealsInCategory')`
  - `announcements.ts`
    - `mealsHeading(meals, filteredFromCount: number | null = null)`: „n von m“ bei Filter
    - `shownMealsCount(shownCount: number, filteredFromCount: number | null): string`:
      neu, „4 / 12“ bzw. „12“
    - `categoryFilterAnnouncement(category, shownCount, totalCount)`: neu, nutzt
      `mealCountPhrase`
    - `filterResetAnnouncement(totalCount)`: neu
  - `announcements.test.ts`: Fälle zu allen vier Funktionen
- `src/meals/ui`
  - `MealCategoryFilter.tsx`: neu, Label, Auswahl, in Phase 2 das ✕ samt Fokus
  - `CrossIcon.tsx`: neu (Phase 2), SVG im Stil von `TrashIcon`, `aria-hidden`
  - `MealListPage.tsx`: neue Props, Überschrift mit `shownMealsCount`, Filterzeile
  - `MealsArea.tsx`: Zustand `chosenCategory`, Ableitung, Ansage
  - `MealsArea.test.tsx`: neue Fälle, Hilfen `categoryFilter()`, `chooseCategory(name)`
- `src/index.css`
  - `select` in die Regeln für `input, textarea` aufnehmen
  - `.categoryFilter`: neu, Flex-Zeile, Auswahl füllt den Platz

Wiederverwendet werden `mealCategories`, `normalizeMealName`, `carriesCategory`,
`mealCountPhrase`, `countHiddenMeals`, `LightbulbOffIcon` und `.iconButton`. Es gibt
keine neue Abhängigkeit, keinen neuen Port und keine Änderung an Firestore.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Nach Kategorie filtern

Abhängigkeiten: keine

Die Filterzeile mit Label und Auswahl steht auf der Seite. Die Wahl filtert die Liste,
die Überschrift zeigt `n / m`, und jede Änderung wird angesagt. Zurücksetzen geht in
dieser Phase nur über „Alle“.

**Aufgaben**:

- [x] Test zuerst: `src/meals/domain/mealCategory.test.ts`, `describe('knownCategory')`
      - `finds nothing when nothing is chosen` → `null`
      - `finds the chosen category` → „Suppe“
      - `answers with the known spelling` (gewählt „suppe“, bekannt „Suppe“) → „Suppe“
      - `finds nothing when the chosen category is gone` → `null`
- [x] Test zuerst: `src/meals/domain/mealCategory.test.ts`, `describe('mealsInCategory')`
      - `keeps every meal without a category chosen` (dieselben Gerichte, dieselbe
        Reihenfolge)
      - `keeps the meals carrying the category, whatever its spelling`
      - `keeps hidden meals carrying the category`
      - `keeps the order of the meals`
- [x] `src/meals/domain/mealCategory.ts`:
      ```ts
      export function knownCategory(
        known: readonly CategoryOverview[],
        chosen: string | null,
      ): string | null {
        if (chosen === null) return null
        return known.find((category) => sameCategory(category.name, chosen))?.name ?? null
      }

      export function mealsInCategory(
        meals: readonly Meal[],
        category: string | null,
      ): readonly Meal[] {
        if (category === null) return meals
        return meals.filter((meal) => carriesCategory(meal, category))
      }
      ```
      `carriesCategory` bleibt, wo es ist. `withoutCategory` nutzt es heute schon vor
      seiner Deklaration (`mealCategory.ts:92`, `:101`).
- [x] Test zuerst: `src/meals/domain/announcements.test.ts`
      - `mealsHeading`: `counts the shown meals out of all meals` →
        `mealsHeading([bolognese, bolognese], 5)` = „Gerichte, 2 von 5“
      - `mealsHeading`: `names the hidden meals among the shown ones` →
        `mealsHeading([bolognese, hiddenBolognese], 5)` = „Gerichte, 2 von 5 (1 ausgeblendet)“
      - `mealsHeading`: `says out of how many even when every meal is shown` →
        `mealsHeading([bolognese, bolognese], 2)` = „Gerichte, 2 von 2“
      - Die bestehenden vier Fälle bleiben unverändert (Standardwert `null`).
      - `shownMealsCount`: `(12, null)` → „12“, `(4, 12)` → „4 / 12“
      - `categoryFilterAnnouncement`: `('Suppe', 4, 12)` → „Suppe, 4 von 12 Gerichten.“,
        `('Suppe', 1, 1)` → „Suppe, 1 von 1 Gericht.“
      - `filterResetAnnouncement`: `12` → „Filter zurückgesetzt, 12 Gerichte.“, `1` →
        „Filter zurückgesetzt, 1 Gericht.“
- [x] `src/meals/domain/announcements.ts`:
      ```ts
      export function shownMealsCount(
        shownCount: number,
        filteredFromCount: number | null,
      ): string {
        return filteredFromCount === null
          ? `${shownCount}`
          : `${shownCount} / ${filteredFromCount}`
      }

      export function mealsHeading(
        meals: readonly NewMeal[],
        filteredFromCount: number | null = null,
      ): string {
        if (meals.length === 0) return 'Gerichte, keine'
        const count =
          filteredFromCount === null
            ? `${meals.length}`
            : `${meals.length} von ${filteredFromCount}`
        const hiddenCount = countHiddenMeals(meals)
        return hiddenCount === 0
          ? `Gerichte, ${count}`
          : `Gerichte, ${count} (${hiddenCount} ausgeblendet)`
      }
      ```
      `categoryFilterAnnouncement` nutzt `` `${category}, ${shownCount} von ${mealCountPhrase(totalCount)}.` ``,
      `filterResetAnnouncement` eine neue Hilfe für den Nominativ („1 Gericht“ /
      „n Gerichte“). Mit Filter ist die Liste nie leer, weil eine bekannte Kategorie
      immer an mindestens einem Gericht hängt. Der Fall „keine“ bleibt deshalb
      unverändert.
- [x] `src/meals/ui/MealCategoryFilter.tsx` anlegen:
      ```tsx
      type MealCategoryFilterProps = {
        categories: readonly CategoryOverview[]
        activeCategory: string | null
        onChooseCategory: (category: string | null) => void
      }
      ```
      `<div className="categoryFilter">` mit `<label htmlFor="mealCategoryFilter">Kategorie</label>`
      und `<select id="mealCategoryFilter" value={activeCategory ?? ''}>`. Erste Option
      `<option value="">Alle</option>`, dann eine `<option value={name}>` je Kategorie.
      `onChange` gibt `''` als `null` weiter, sonst den Namen. Die Id unterscheidet sich
      von `mealCategoryName` im Formular.
- [x] `src/meals/ui/MealListPage.tsx`: neue Props `totalCount: number`,
      `categories: readonly CategoryOverview[]`, `activeCategory: string | null`,
      `onChooseCategory`. `filteredFromCount = activeCategory === null ? null : totalCount`.
      `aria-label={mealsHeading(meals, filteredFromCount)}`, sichtbar:
      - ohne ausgeblendete und ohne Filter: `mealsHeading(meals)` wie heute (deckt
        „keine“ ab),
      - sonst `Gerichte, {shownMealsCount(meals.length, filteredFromCount)}`, bei
        ausgeblendeten dahinter ` ({h} <LightbulbOffIcon className="headingIcon" />)`.

      `MealCategoryFilter` zwischen `div.pageHeader` und der Liste, nur bei
      `categories.length > 0`. Die Bedingung für „Noch keine Gerichte.“ prüft weiter die
      angezeigten Gerichte. Mit Filter ist die Liste nie leer, also greift sie nur ohne
      Gerichte.
- [x] `src/meals/ui/MealsArea.tsx`: `const [chosenCategory, setChosenCategory] = useState<string | null>(null)`,
      `categories = mealCategories(meals.meals)` (auch für `knownCategories` des Formulars
      verwenden, statt es dort erneut zu berechnen), `activeCategory`, `shownMeals` wie im
      Zielbild. `chooseCategory(category)` setzt den Zustand und sagt an:
      `category === null ? filterResetAnnouncement(meals.meals.length) : categoryFilterAnnouncement(category, mealsInCategory(meals.meals, category).length, meals.meals.length)`.
- [x] `src/index.css`: `select` in die Regeln `button, input, textarea` (Zeile 92-97) und
      `input, textarea` (Zeile 111-118) aufnehmen. Neu:
      ```css
      .categoryFilter {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 1rem 0 0;
      }

      .categoryFilter select {
        flex: 1;
        min-width: 0;
      }
      ```

**Automatisierte Verifikation**:

- [x] Die neuen Fälle in `mealCategory.test.ts` und `announcements.test.ts` schlagen vor
      der Umsetzung fehl und laufen danach grün, die bestehenden `mealsHeading`-Fälle
      bleiben unverändert grün.
- [x] Neue Fälle in `src/meals/ui/MealsArea.test.tsx`, mit den Hilfen
      `categoryFilter()` (`screen.getByRole('combobox', { name: 'Kategorie' })`) und
      `chooseCategory(name)` (`userEvent.selectOptions(categoryFilter(), name)`):
      - `offers no category filter without categories`: Gerichte ohne Kategorien, keine
        `combobox`.
      - `offers every category to filter by, hidden meals included`: Optionen „Alle“,
        „Auflauf“, „Suppe“ in dieser Reihenfolge, „Auflauf“ hängt nur an einem
        ausgeblendeten Gericht, der Wert ist anfangs „Alle“.
      - `shows only the meals of the chosen category`: `shownMealNames()` enthält nur die
        Suppen, sortiert.
      - `counts the shown meals out of all meals in the heading`: 3 Gerichte, 2 Suppen,
        davon 1 ausgeblendet. Der Name der Überschrift ist „Gerichte, 2 von 3 (1
        ausgeblendet)“, `textContent` ist „Gerichte, 2 / 3 (1 )“ mit `svg`.
      - `counts out of all meals even when every meal carries the category`: Überschrift
        „Gerichte, 2 von 2“, `textContent` „Gerichte, 2 / 2“.
      - `announces the chosen category with the shown meals`: Ansage „Suppe, 2 von 3
        Gerichten.“
      - `shows every meal again when all are chosen`: nach „Suppe“ wieder „Alle“; alle
        Gerichte sichtbar, Überschrift „Gerichte, 3“, Ansage „Filter zurückgesetzt, 3
        Gerichte.“
      - `keeps the filter when returning from a meal`: filtern, Gericht öffnen, zurück;
        Filter und Liste unverändert, Fokus auf der Überschrift „Gerichte, 2 von 3“.
      - `shows every meal when the chosen category is gone`: filtern, danach über
        `client.changeMeals` die Kategorie aus allen Gerichten entfernen (in `act`); die
        Auswahl steht auf „Alle“, alle Gerichte sichtbar, keine neue Ansage.
      - `keeps the filter when only the spelling of the category changes`: „Suppe“
        wählen, über den Client in „suppe“ umbenennen; der Filter bleibt, die Auswahl
        zeigt „suppe“.
      - `has no accessibility violations with a chosen category`: `accessibilityViolations`
        auf der gefilterten Liste.
- [x] Die bestehenden Fälle in `MealsArea.test.tsx` laufen unverändert grün, auch die
      Überschrift-Tests (Zeile 785-808).
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [x] `npm run test:e2e` läuft unverändert grün.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA, VoiceOver an):

- [x] Die Filterzeile steht unter der Überschrift. Die Auswahl hat dieselbe Höhe und
      denselben Rahmen wie die Eingabefelder und ist auch mit invertierten Farben gut
      lesbar.
- [x] VoiceOver liest die Auswahl als „Kategorie, Alle, Einblendmenü“ (oder
      sinngemäß). Das Auswahlrad zeigt „Alle“ und die Kategorien.
- [x] Nach der Wahl von „Suppe“ klingen die Ansage des Rads und „Suppe, n von m
      Gerichten.“ zusammen verständlich und nicht störend doppelt.
- [x] Nach Öffnen eines Gerichts und „Zurück zu den Gerichten“ ist der Filter noch
      aktiv, die Überschrift liest „Gerichte, n von m“.

### Phase 2: Filter per ✕ zurücksetzen

Abhängigkeiten: Phase 1

Rechts neben der Auswahl erscheint bei aktivem Filter der Knopf „Filter zurücksetzen“.
Er setzt auf „Alle“ zurück und gibt den Fokus an die Auswahl.

**Aufgaben**:

- [x] `src/meals/ui/CrossIcon.tsx` anlegen, Muster `TrashIcon`
      (`src/shared/ui/TrashIcon.tsx`): `svg.buttonIcon`, `viewBox="0 0 24 24"`, Striche
      `M18 6 6 18` und `m6 6 12 12`, `aria-hidden="true"`, `focusable="false"`.
- [x] `src/meals/ui/MealCategoryFilter.tsx`: `useRef<HTMLSelectElement>` an der
      Auswahl. Bei `activeCategory !== null` nach der Auswahl ein
      `<button type="button" className="iconButton" aria-label="Filter zurücksetzen">`
      mit `CrossIcon`. `onClick`: `onChooseCategory(null)`, dann
      `categorySelect.current?.focus()`.

**Automatisierte Verifikation**:

- [x] Neue Fälle in `src/meals/ui/MealsArea.test.tsx`:
      - `offers no reset without a chosen category`: kein Knopf „Filter zurücksetzen“.
      - `resets the filter with the cross`: „Suppe“ wählen, „Filter zurücksetzen“
        drücken. Alle Gerichte sind sichtbar, die Auswahl steht auf „Alle“, die letzte
        Ansage ist „Filter zurückgesetzt, 3 Gerichte.“, die Auswahl hat den Fokus, der
        Knopf ist verschwunden.
      - `shows the reset as an icon only`: der Knopf hat keinen Text, enthält ein `svg`
        (Muster `shows the removal of a taken over item as an icon only`, Zeile 289).
- [x] `has no accessibility violations with a chosen category` aus Phase 1 läuft mit dem
      Knopf weiter grün.
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA, VoiceOver an):

- [x] Das ✕ steht rechts neben der Auswahl in derselben Zeile, hat den Knopfrahmen wie
      die übrigen Icon-Knöpfe und ist mit invertierten Farben gut sichtbar.
- [x] VoiceOver liest „Filter zurücksetzen, Taste“. Nach dem Doppeltipp kommt „Filter
      zurückgesetzt, m Gerichte.“, und der VoiceOver-Cursor steht auf „Kategorie, Alle“.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1, `shows every meal when the chosen category is gone`: Entfernt man die
  Kategorien aus *allen* Gerichten, verschwindet planmäßig die ganze Filterzeile und die
  Auswahl lässt sich nicht mehr prüfen. Der Test entfernt deshalb nur die Suppen-Kategorie,
  „Nudelgericht“ an der Bolognese bleibt stehen.
- Phase 1, `npm run test:e2e`: Im ersten Lauf war „buys only the day that the supply no
  longer covers“ rot (Ansage „1 Artikel“ statt „2 Artikel“), der Wiederholungslauf war
  26/26 grün. Das ist der bekannte useSupplies-Bug aus `docs/notes.txt`, nicht diese
  Änderung.

## Verweise

- `docs/notes.txt`: TODO „Kategorien nutzen: Gerichteliste nach Kategorie filtern, im
  Wochenplan nach Kategorie wuerfeln“
- `docs/agents/plans/2026-09-24-kategorien-fuer-gerichte.md` (MZP-021): Feld
  `categories`, `mealCategories`, normalisierter Vergleich
- `docs/agents/plans/2026-09-24-gluehbirne-in-der-gerichte-ueberschrift.md` (MZP-023):
  `aria-label` an der Überschrift, `.headingIcon`
- `src/meals/ui/MealListPage.tsx`, `src/meals/ui/MealsArea.tsx`,
  `src/meals/domain/mealCategory.ts`, `src/meals/domain/announcements.ts`
