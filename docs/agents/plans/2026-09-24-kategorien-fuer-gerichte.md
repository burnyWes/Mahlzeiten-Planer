---
date: 2026-09-24T06:43:57.585559+00:00
git_commit: ad52f0407e40c58395d87f3e910b9be910ae36e8
branch: main
story: MZP-021
topic: "Kategorien für Gerichte"
tags: [plan, meals, shared, firestore, ui, voiceover]
status: ready
---

# PLAN: MZP-021 — Kategorien für Gerichte

Ein Gericht bekommt beliebig viele frei geschriebene Kategorien wie "Nudelgericht". Sie
werden ganz unten im Gericht-Formular gepflegt, genau wie die Einkaufs-Items: Textfeld,
Knopf, Liste mit Mülleimer. In den Einstellungen kommt als dritter Eintrag die
"Kategorie-Verwaltung" dazu. Dort lassen sich Kategorien über alle Gerichte hinweg
umbenennen und löschen.

Vorlage sind die TODO-Punkte "Kategorien in Gerichten" und "Kategorie-Verwaltung in
Einstellungen als dritte Option" aus `docs/notes.txt`. Alle Entscheidungen stammen aus
der Befragung vom 2026-09-24.

## Akzeptanzkriterien

- Das Gericht-Formular zeigt ganz unten, unter "Frühstück" und über der Fehlerzeile des
  Gerichts, den Abschnitt `h2` "Kategorien, N" ("Kategorien, keine" bei null). Darunter
  steht die Liste der Kategorien mit einem Mülleimer je Zeile ("Entfernen, <Name>"),
  dann ein Formular "Kategorie hinzufügen" mit dem Textfeld "Kategorie" und dem Knopf
  "Kategorie hinzufügen". Enter im Textfeld übernimmt die Kategorie ebenfalls.
- Nach dem Hinzufügen lautet die Ansage "<Name> als Kategorie übernommen.", das Feld
  wird geleert und bekommt den Fokus.
- Nach dem Entfernen lautet die Ansage "<Name> entfernt, noch N Kategorien." (bzw.
  "noch 1 Kategorie.", "keine Kategorien mehr."), der Fokus geht ins Textfeld.
- Bei leerem Feld erscheint "Bitte einen Namen eingeben.", bei über 100 Zeichen "Der
  Name ist zu lang." Die Meldung steht in der Fehlerzeile der Kategorie und wird
  angesagt.
- Trägt das Gericht die Kategorie schon (verglichen normalisiert: getrimmt, Leerzeichen
  vereinheitlicht, klein geschrieben), wird nichts hinzugefügt. Die Meldung "<Name> ist
  schon eingetragen." wird angezeigt und angesagt, das Feld behält den Text.
- Gibt es die Kategorie in einem anderen Gericht in anderer Schreibweise, wird die
  vorhandene Schreibweise übernommen ("nudelgericht" → "Nudelgericht").
- Ab zwei getippten Zeichen erscheinen bis zu fünf Vorschläge aus den Kategorien aller
  Gerichte, ohne die, die das Gericht schon trägt. Ein Klick auf einen Vorschlag
  übernimmt die Kategorie sofort, mit derselben Ansage.
- Die Kategorien werden mit dem Gericht gespeichert und erscheinen nach einem Neuladen
  und auf dem anderen Gerät. Gerichte ohne das Feld laden mit einer leeren Liste.
- Die Detailseite eines Gerichts zeigt ganz unten den Abschnitt `h2` "Kategorien" mit
  einer Liste, nur wenn das Gericht Kategorien hat.
- Die Einstellungen zeigen die Einträge "Farben invertieren", "Artikelverwaltung" und
  "Kategorie-Verwaltung".
- Die Kategorie-Verwaltung zeigt `h1` "Kategorie-Verwaltung, N" und alle Kategorien
  alphabetisch (`de-DE`), je Zeile einen Knopf "<Name>, <Anzahl Gerichte>" und einen
  Mülleimer "Löschen, <Name>". Ausgeblendete Gerichte zählen mit. Ohne Kategorien steht
  dort "Noch keine Kategorien.".
- Der Mülleimer öffnet die Bestätigung `h1` "<Name> löschen?" mit dem Text "Die
  Kategorie wird aus N Gerichten entfernt. Die Gerichte selbst bleiben erhalten." (bzw.
  "aus 1 Gericht") sowie den Knöpfen "Löschen" und "Abbrechen". Nach dem Löschen fehlt
  die Kategorie in allen Gerichten, die Seite zeigt wieder die Liste, die Ansage lautet
  "<Name> gelöscht, noch N Kategorien." (bzw. "noch 1 Kategorie.", "keine Kategorien
  mehr.").
- Ein Klick auf den Namen öffnet `h1` "Kategorie bearbeiten" mit dem Feld "Name" (Fokus,
  bisheriger Name) und "Speichern" in der unteren Knopfleiste. Speichern schreibt den
  neuen Namen in alle Gerichte, die die Kategorie tragen, führt zurück zur Liste und
  sagt "<Name> gespeichert." an.
- Ist der neue Name schon vergeben, verschmelzen beide Kategorien. In jedem Gericht
  steht sie danach genau einmal, an der Stelle der ersten, und in der neuen Schreibweise.
  Die neue Schreibweise gilt auch in den Gerichten, die nur die Zielkategorie trugen.
- Beim Umbenennen und Löschen werden alle betroffenen Gerichte gemeinsam in einem
  Firestore-`writeBatch` geschrieben.
- Verschwindet die geöffnete Kategorie, weil das andere Gerät sie entfernt hat, zeigt
  die Verwaltung wieder die Liste.
- Alle neuen Seiten sind ohne axe-Befund. Gerichteliste und Wochenplan bleiben
  unverändert, die bestehenden E2E-Tests laufen ohne Anpassung grün.

### Bewusste Grenzen

- Eine Kategorie existiert nur, solange mindestens ein Gericht sie trägt. Leere
  Kategorien lassen sich nicht vorab anlegen.
- Ändert das andere Gerät gleichzeitig ein betroffenes Gericht, gewinnt der letzte
  Schreibvorgang, weil ganze Dokumente geschrieben werden. Das gilt heute schon für
  jedes Speichern eines Gerichts (`src/meals/api/firestoreMealsClient.ts:96-98`).
- Ist ein Gericht-Formular offen, während in der Verwaltung umbenannt wird, schreibt
  sein Speichern die Kategorien, die beim Öffnen galten. Das Formular hält seine
  Kategorien lokal, wie heute schon die Items (`MealFormPage.tsx:54-56`).
- Filtern der Gerichteliste und Würfeln nach Kategorie im Wochenplan gehören nicht zu
  diesem Plan und kommen als TODO in `docs/notes.txt`.

## Wesentliche Entscheidungen und Abwägungen

1. **Kategorien sind ein Feld am Gericht, kein eigener Katalog.** `NewMeal` bekommt
   `categories: readonly string[]`. Die Verwaltung leitet ihre Liste mit
   `mealCategories(meals)` aus allen Gerichten ab.
   - Warum: Umbenennen und Löschen wirken direkt auf die Gerichte. Katalog und Gerichte
     können nicht auseinanderlaufen. Es gibt keine neue Sammlung, damit auch keine
     Regeländerung, die mangels automatischem Deployment in der Produktion gesperrt
     bliebe (TODO in `docs/notes.txt`).
   - Auswirkung: `firestore.rules` bleibt unberührt. Leere Kategorien sind nicht möglich.

2. **Die Fachlogik liegt als reine Funktionen in `src/meals/domain/mealCategory.ts`.**
   Hinzufügen samt Schreibweise und Doppelprüfung, Übersicht mit Anzahl, Vorschläge,
   Löschen und Umbenennen über alle Gerichte.
   - Warum: Test-getrieben ohne React und Firestore, wie `knownItem.ts` für die Artikel.
   - Auswirkung: Die Komponenten fragen nur ab. Die Namensregel (`readName`,
     `meal.ts:58-63`) wird als `createName` exportiert und geteilt, damit Grenzen und
     Meldungen dieselben bleiben wie bei Gericht und Item.

3. **Die Schreibweise einer vorhandenen Kategorie gewinnt beim Hinzufügen, Doppelte
   werden abgewiesen.** `categoryToAdd(taken, known, written)` liefert den zu
   übernehmenden Namen oder wirft `CategoryAlreadyTaken`.
   - Warum: So entsteht kein Wildwuchs wie "nudelgericht" neben "Nudelgericht". Das
     Prinzip ist dasselbe wie bei `canonicalName` (`src/shopping/domain/knownItem.ts:81-88`).
   - Auswirkung: `mealFailureMessage` (`announcements.ts:39-45`) übersetzt die neue
     Ausnahme in "<Name> ist schon eingetragen.". Der Vergleich nutzt
     `normalizeMealName` (`meal.ts:109-111`).

4. **`MealsClient.changeMeals(changed: readonly Meal[])` schreibt mehrere Gerichte in
   einem `writeBatch`.**
   - Warum: Beim Umbenennen und Löschen soll alles oder nichts ankommen, das Muster ist
     `renameKnownItem` (`src/shopping/api/firestoreKnownItemsClient.ts:112-125`). Ein
     Haushalt hat weit unter 500 Gerichten, dem Limit eines Batches.
   - Auswirkung: Firestore- und In-Memory-Adapter sowie `useMeals` werden erweitert. Eine
     leere Liste schreibt nichts.

5. **Die Verwaltung liegt in `src/meals/ui`, verdrahtet in `SignedInApp`.**
   `CategoriesArea` hält die Seitenauswahl wie `KnownItemsArea`.
   - Warum: `shared` darf `meals` nicht importieren (`eslint.config.js:22-29`),
     `SettingsPage` kennt ihre Einträge nur als Daten (`src/shared/ui/SettingsPage.tsx:4-12`).
   - Auswirkung: `SignedInApp` bekommt einen dritten Einstellungs-Eintrag. Der bestehende
     Test `offers to invert the colours above the known items`
     (`src/SignedInApp.test.tsx:980-993`) erwartet danach drei Einträge.

6. **Die Seiten der Verwaltung werden über den normalisierten Kategorienamen
   adressiert**, wie `KnownItemsArea` über `normalizeItemName`
   (`src/shopping/ui/KnownItemsArea.tsx:31-37`). Fehlt die Kategorie, zeigt die Area die
   Liste.

7. **Umbenennen ohne Wirkung schreibt nichts.** Liefert `withCategoryRenamed` keine
   geänderten Gerichte (etwa bei unverändertem Namen), führt Speichern zur Liste und sagt
   trotzdem "<Name> gespeichert." an.
   - Warum: Gleiche Rückmeldung wie beim Speichern eines unveränderten Vorschlags, ohne
     leeren Schreibvorgang.

## Ausgangslage

Das Gericht-Formular heute (`src/meals/ui/MealFormPage.tsx:88-157`):

```
┌──────────────────────────────────┐
│ [Zurück zum Gericht]             │
│ Gericht bearbeiten            h1 │
│ Name        [______________]     │
│ Einkaufs-Items, 2             h2 │  ← MealItemsEditor
│  Hackfleisch, 500 g        [🗑]  │
│  Spaghetti                 [🗑]  │
│ Item [____]  (Vorschläge)        │
│ Menge [__]  Einheit [__]         │
│ [ Item hinzufügen ]              │
│ Zutaten     [textarea]           │
│ Rezept      [textarea]           │
│ [x] Hauptgericht                 │
│ [ ] Frühstück                    │
│ <Fehlerzeile Gericht>            │
│ ┌────────── 💾 Speichern ──────┐ │
└──────────────────────────────────┘
```

- Items werden lokal im Formular gesammelt (`MealFormPage.tsx:54-56`) und erst beim
  Speichern über `createMeal(draft, items, hidden)` (`meal.ts:74-87`) Teil des Gerichts.
- Ein Gericht ist ein Dokument `meals/<id>` (`firestoreMealsClient.ts:52-65`).
  `toMeal` liest tolerant (Zeile 40-50), ein neues Feld braucht also keine Migration.
- `withHiding` (`meal.ts:89-98`) baut ein `NewMeal` Feld für Feld neu und muss jedes
  neue Feld mitnehmen.
- Die Einstellungen (`src/SignedInApp.tsx:148-180`) haben die Einträge "Farben
  invertieren" (Schalter) und "Artikelverwaltung" (Unterseite `KnownItemsArea`).

Gericht-Vorlagen mit allen Feldern stehen in diesen Testdateien. Ein neues Pflichtfeld
erzwingt über `tsc` jeweils `categories: []`:
`src/meals/domain/{announcements,meal,mealSuggestions,randomPlanning,supply,weekPlan}.test.ts`,
`src/meals/ui/{MealsArea,SuppliesArea,WeekPlanArea}.test.tsx`, `src/SignedInApp.test.tsx`.

## Zielbild

Formular und Detailseite:

```
 Gericht bearbeiten (unterer Teil)    Detailseite (unterer Teil)
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ [x] Hauptgericht                 │ │ Rezept                        h2 │
│ [ ] Frühstück                    │ │  Nudeln kochen ...               │
│ Kategorien, 2                 h2 │ │ Kategorien                    h2 │
│  Nudelgericht              [🗑]  │ │  Nudelgericht                    │
│  Schnell                   [🗑]  │ │  Schnell                         │
│ Kategorie [sup_________]         │ │                                  │
│   ┌ Vorschläge ─────────────┐    │ │ [🛒] [💡] [✎] [🗑]              │
│   │ [ Suppe ]               │    │ └──────────────────────────────────┘
│   └─────────────────────────┘    │   Abschnitt nur, wenn Kategorien da
│ [ Kategorie hinzufügen ]         │
│ <Fehlerzeile Kategorie>          │
│ <Fehlerzeile Gericht>            │
│ ┌────────── 💾 Speichern ──────┐ │
└──────────────────────────────────┘
```

Einstellungen und Kategorie-Verwaltung:

```
 Einstellungen                        Kategorie-Verwaltung
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ [Liste][Plan][Gerichte][Vor.][⚙] │ │ [Zurück zu den Einstellungen]    │
│ Einstellungen                 h1 │ │ Kategorie-Verwaltung, 3       h1 │
│ Farben invertieren          (o ) │ │ [ Auflauf, 2              ] [🗑] │
│ [ Artikelverwaltung            ] │ │ [ Nudelgericht, 5         ] [🗑] │
│ [ Kategorie-Verwaltung         ] │ │ [ Suppe, 1                ] [🗑] │
└──────────────────────────────────┘ └──────────────────────────────────┘
                                        │ Name                  │ Mülleimer
                                        ▼                       ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ [Zurück zur Kategorie-Verwaltung]│ │ [Zurück zur Kategorie-Verwaltung]│
│ Kategorie bearbeiten          h1 │ │ Nudelgericht löschen?         h1 │
│ Name                             │ │ Die Kategorie wird aus 5         │
│ [Nudelgericht________________]   │ │ Gerichten entfernt. Die Gerichte │
│ <Fehlerzeile>                    │ │ selbst bleiben erhalten.         │
│ ┌────────── 💾 Speichern ──────┐ │ │ [ Löschen ]    [ Abbrechen ]     │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

Umbenennen mit Zusammenführen als Rechnung in der Domäne:

```
vorher:  Bolognese   [Nudelgerichte, Schnell]
         Carbonara   [nudelgericht]
         Lasagne     [Nudelgerichte, Nudelgericht]
         Suppe       [Suppe]
             │
   withCategoryRenamed(meals, "Nudelgerichte", "Nudelgericht")
             ▼
geändert: Bolognese  [Nudelgericht, Schnell]
          Carbonara  [Nudelgericht]           ← Schreibweise angeglichen
          Lasagne    [Nudelgericht]           ← einmal, an erster Stelle
          (Suppe unverändert, nicht in der Rückgabe)
             │
   changeMeals(geändert)  →  ein writeBatch mit drei set()
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `meal.ts`
    - `NewMeal` - Feld `categories: readonly string[]`
    - `createName` - `readName` exportiert und umbenannt, Aufrufer angepasst
    - `createMeal` - neuer Parameter `categories` zwischen `items` und `hidden`
    - `withHiding` - nimmt `categories` mit
  - `mealCategory.ts` - NEU
    - `CategoryOverview = { name: string; mealCount: number }`
    - `CategoryAlreadyTaken` - Ausnahme mit dem Feld `category`
    - `categoryToAdd(taken, known, written)` - Schreibweise und Doppelprüfung
    - `mealCategories(meals)` - Übersicht, alphabetisch, mit Anzahl
    - `suggestCategories(known, taken, typed)` - Vorschläge
    - `withoutCategory(meals, name)` - geänderte Gerichte beim Löschen
    - `withCategoryRenamed(meals, from, newName)` - geänderte Gerichte beim Umbenennen
      oder `null`
  - `announcements.ts` - neue Überschriften, Ansagen, Zeilenbeschriftung, Lösch-Hinweis;
    `mealFailureMessage` kennt `CategoryAlreadyTaken`
- `src/meals/api`
  - `mealsClient.ts` - `changeMeals(changed: readonly Meal[]): void`
  - `firestoreMealsClient.ts` - `categories` lesen und schreiben, `changeMeals` per
    `writeBatch`
  - `inMemoryMealsClient.ts` - `changeMeals` ersetzt per `id`, veröffentlicht einmal
- `src/meals/ui`
  - `useMeals.ts` - `changeMeals` in `Meals`
  - `MealCategoriesEditor.tsx` - NEU, Muster von `MealItemsEditor`
  - `MealFormPage.tsx` - Zustand `categories`, Prop `knownCategories`, Editor unten
  - `MealsArea.tsx` - reicht `mealCategories(meals.meals)` an das Formular
  - `MealPage.tsx` - Abschnitt "Kategorien"
  - `CategoriesArea.tsx`, `CategoryListPage.tsx`, `CategoryListRow.tsx`,
    `DeleteCategoryPage.tsx`, `CategoryFormPage.tsx` - NEU, Muster der gleichnamigen
    `KnownItem…`-Dateien in `src/shopping/ui`
- `src/shared/ui/NameSuggestions.tsx` - unverändert wiederverwendet
- `src/SignedInApp.tsx` - Eintrag "Kategorie-Verwaltung", `CategoriesArea` rendern
- `e2e/emulatorHousehold.ts` - `ListedMeals` um `categories` erweitern, Hilfe
  `mealCategoriesOnServer()`
- `e2e/meals.spec.ts` - zwei neue Abläufe

Keine neue Abhängigkeit, keine neue Komponente in `shared`.

## Umsetzung

### Phase 1: Kategorien im Gericht pflegen

Abhängigkeiten: keine

Im Formular lassen sich Kategorien hinzufügen und entfernen. Sie werden mit dem Gericht
gespeichert und auf der Detailseite gezeigt. Noch ohne Vorschläge und ohne Angleichen
der Schreibweise an andere Gerichte, doppelte im selben Gericht werden aber schon
abgewiesen.

**Aufgaben**:

- [x] `src/meals/domain/meal.ts`: `categories: readonly string[]` in `NewMeal`. Alle
      Gericht-Vorlagen in den Testdateien aus der *Ausgangslage* um `categories: []`
      ergänzen, damit `tsc` wieder grün ist.
- [x] Test zuerst: `src/meals/domain/meal.test.ts`
      - `createMeal`: `keeps the categories` (Reihenfolge bleibt), bestehende Aufrufe auf
        die neue Signatur umstellen.
      - `withHiding`: `keeps the categories`.
- [x] `src/meals/domain/meal.ts`: `readName` als `createName` exportieren (Aufrufer
      `createMealItem`, `createMeal`), `createMeal(draft, items, categories, hidden)`,
      `withHiding` übernimmt `meal.categories`.
- [x] Test zuerst: `src/meals/domain/mealCategory.test.ts` für `categoryToAdd`, in dieser
      Phase mit leerem `known`:
      - `trims the written name`
      - `refuses a category without a name` → `InvalidMeal` mit `nameMissing`
      - `refuses a name longer than a hundred characters` → `nameTooLong`
      - `refuses a category the meal already carries, whatever its spelling` →
        `CategoryAlreadyTaken` mit `category` = vorhandene Schreibweise im Gericht
- [x] `src/meals/domain/mealCategory.ts` anlegen:
      ```ts
      export class CategoryAlreadyTaken extends Error {
        category: string

        constructor(category: string) {
          super(category)
          this.name = 'CategoryAlreadyTaken'
          this.category = category
        }
      }
      ```
      Muster ist `InvalidMeal` (`meal.ts:45-53`). Der Kategoriename steht in `category`,
      weil `name` bei `Error` schon den Fehlernamen trägt.
      ```ts
      export function categoryToAdd(
        taken: readonly string[],
        known: readonly string[],
        written: string,
      ): string
      ```
      Prüft mit `createName`, sucht in `taken` über `normalizeMealName` und wirft bei
      Treffer `new CategoryAlreadyTaken(<Treffer aus taken>)`. `known` wird erst in
      Phase 2 ausgewertet und hier nur durchgereicht.
- [x] Test zuerst: `src/meals/domain/announcements.test.ts`
      - `mealCategoriesHeading`: `0` → "Kategorien, keine", `2` → "Kategorien, 2"
      - `categoryAddedAnnouncement("Nudelgericht")` → "Nudelgericht als Kategorie
        übernommen."
      - `categoryRemovedAnnouncement(name, remaining)`: "… entfernt, keine Kategorien
        mehr." / "… noch 1 Kategorie." / "… noch 3 Kategorien."
      - `mealFailureMessage(new CategoryAlreadyTaken('Nudelgericht'))` →
        "Nudelgericht ist schon eingetragen."
- [x] `src/meals/domain/announcements.ts`: die vier Punkte umsetzen, Muster
      `mealItemsHeading` und `mealItemRemovedAnnouncement` (Zeile 51-71).
- [x] `src/meals/api/firestoreMealsClient.ts`: `toCategories(stored)` liest
      `Array.isArray(stored.categories) ? stored.categories.map(String) : []`, `toMeal`
      nutzt es, `toDocument` schreibt `categories: [...meal.categories]`.
- [x] `src/meals/ui/MealCategoriesEditor.tsx` anlegen, Muster von `MealItemsEditor`:
      ```tsx
      type MealCategoriesEditorProps = {
        categories: readonly string[]
        knownCategories: readonly string[]
        onAddCategory: (category: string) => void
        onRemoveCategory: (position: number) => void
        announce: (text: string) => void
      }
      ```
      `h2` mit `mealCategoriesHeading`, `ul.itemList` mit `li.mealItemRow` und Mülleimer
      (`aria-label={`Entfernen, ${category}`}`), `form` mit
      `aria-label="Kategorie hinzufügen"` und `aria-describedby="mealCategoryFailure"`,
      Feld `id="mealCategoryName"` mit Label "Kategorie", `p#mealCategoryFailure.failure`,
      Knopf `type="submit"` "Kategorie hinzufügen". Beim Übernehmen `categoryToAdd`
      rufen, Fehler über `mealFailureMessage` in die Fehlerzeile schreiben und ansagen,
      bei Erfolg Feld leeren, Fehlerzeile leeren, Fokus ins Feld, Ansage.
- [x] `src/meals/ui/MealFormPage.tsx`: Zustand `categories` aus
      `editedMeal?.categories ?? []`, Prop `knownCategories: readonly string[]`, Editor
      nach dem Frühstück-Schalter und vor `p#mealFailure` einsetzen, `createMeal` mit
      `categories` rufen.
- [x] `src/meals/ui/MealsArea.tsx`: `knownCategories` an `MealFormPage` reichen. In
      dieser Phase `[]`, ab Phase 2 aus `mealCategories`.
- [x] `src/meals/ui/MealPage.tsx`: nach dem Rezept, nur bei `meal.categories.length > 0`,
      `h2` "Kategorien" und `ul.itemList` mit einem `li` je Kategorie.
- [x] `e2e/emulatorHousehold.ts`: `ListedMeals.fields` um
      `categories?: { arrayValue?: { values?: readonly { stringValue: string }[] } }`
      erweitern, `mealCategoriesOnServer(): Promise<Record<string, readonly string[]>>`
      liefert die Kategorien je Gerichtsname (Muster `breakfastMealNamesOnServer`,
      Zeile 205-217).
- [x] `e2e/meals.spec.ts`: `keeps the categories of a meal after a reload`. Gericht
      "Bolognese" anlegen, bearbeiten, "Nudelgericht" und "Schnell" per `typeInto` und
      `pressButton('Kategorie hinzufügen')` eintragen, speichern, auf
      `mealCategoriesOnServer()` warten, neu laden, auf der Detailseite beide Kategorien
      sehen.

**Automatisierte Verifikation**:

- [x] Die neuen Fälle in `meal.test.ts`, `mealCategory.test.ts` und
      `announcements.test.ts` schlagen vor der Umsetzung fehl und laufen danach grün.
- [x] Neue Fälle in `src/meals/ui/MealsArea.test.tsx` (Hilfen nach dem Muster
      `addItem`, Zeile 105-120):
      - `adds categories to a meal` — zwei Kategorien eintragen, speichern;
        `storedMeals()` enthält sie in dieser Reihenfolge, die Ansage stimmt, das Feld
        ist leer und hat den Fokus.
      - `adds a category with the enter key` — tippen, Enter.
      - `removes a category from the meal` — Mülleimer "Entfernen, Nudelgericht"; die
        Zeile fehlt, die Ansage "Nudelgericht entfernt, noch 1 Kategorie.", nach dem
        Speichern fehlt sie in `storedMeals()`.
      - `refuses an empty category` — Meldung auf der Seite und in den Ansagen, nichts
        hinzugefügt.
      - `refuses a category the meal already carries` — "Nudelgericht" vorhanden,
        "nudelgericht" eintragen; Meldung "Nudelgericht ist schon eingetragen.", das Feld
        behält "nudelgericht".
      - `keeps the categories when a meal is hidden` — Ausblenden über die Detailseite
        lässt `categories` in `storedMeals()` unverändert.
      - `shows the categories on the meal page` — Überschrift "Kategorien" und beide
        Namen sind da.
      - `shows no categories section for a meal without categories`.
      - `has no accessibility violations on the form with categories`.
- [x] Die bestehenden Fälle in `MealsArea.test.tsx` laufen unverändert grün.
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [x] `npm run test:e2e` läuft durch, samt `keeps the categories of a meal after a
      reload`. Der bestehende Fall `treats a stored meal without the field as a main
      meal` belegt, dass ein Dokument ohne `categories` weiter lädt.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [x] Mit VoiceOver: Hinzufügen und Entfernen sind durch die Ansagen nachvollziehbar,
      der Fokus landet danach im Feld "Kategorie".
- [x] Eine auf einem Gerät eingetragene Kategorie steht kurz darauf auf dem anderen
      Gerät auf der Detailseite.

### Phase 2: Vorschläge und vorhandene Schreibweise

Abhängigkeiten: Phase 1

Beim Tippen erscheinen Kategorien aus anderen Gerichten, ein Klick übernimmt sie. Eine
getippte Kategorie, die es anderswo in anderer Schreibweise gibt, kommt in der
vorhandenen Schreibweise ins Gericht.

**Aufgaben**:

- [x] Test zuerst: `src/meals/domain/mealCategory.test.ts`
      - `mealCategories`:
        - `lists every category once with the number of meals carrying it`
        - `counts hidden meals as well`
        - `treats different spellings as one category` — Schreibweise des ersten
          Gerichts in `byName`-Reihenfolge, Anzahl über beide
        - `sorts alphabetically` (`de-DE`, Umlaut wie in `byName`, `meal.test.ts:272`)
        - `returns nothing for meals without categories`
      - `categoryToAdd`:
        - `takes over the spelling a known category already has`
        - `keeps the written spelling for a new category`
      - `suggestCategories`:
        - `suggests nothing below two typed characters`
        - `suggests categories that contain the typed text`
        - `leaves out categories the meal already carries`
        - `leaves out the exact match` (wie `suggestNames`, `knownItem.ts:151-165`)
        - `ranks categories starting with the typed text first, then by the number of
          meals, then alphabetically`
        - `suggests at most five categories`
- [x] `src/meals/domain/mealCategory.ts`:
      ```ts
      export type CategoryOverview = { name: string; mealCount: number }

      export function mealCategories(
        meals: readonly Meal[],
      ): readonly CategoryOverview[]

      export function suggestCategories(
        known: readonly CategoryOverview[],
        taken: readonly string[],
        typed: string,
      ): readonly string[]
      ```
      `categoryToAdd` gibt die Schreibweise aus `known` zurück, wenn es sie normalisiert
      gibt. Ein Gericht, das dieselbe Kategorie in zwei Schreibweisen trägt, zählt
      einmal.
- [x] `src/meals/ui/MealCategoriesEditor.tsx`: Prop `knownCategories` auf
      `readonly CategoryOverview[]` umstellen, `NameSuggestions` unter dem Feld mit
      `suggestCategories(knownCategories, categories, draft)`. `onChoose` übernimmt die
      Kategorie sofort über denselben Weg wie das Absenden, also mit derselben
      Doppelprüfung und Ansage.
- [x] `src/meals/ui/MealFormPage.tsx` und `src/meals/ui/MealsArea.tsx`:
      `knownCategories={mealCategories(meals.meals)}` durchreichen.

**Automatisierte Verifikation**:

- [x] Die neuen Fälle in `mealCategory.test.ts` schlagen vor der Umsetzung fehl und
      laufen danach grün.
- [x] Neue Fälle in `src/meals/ui/MealsArea.test.tsx`:
      - `suggests categories of other meals` — ein Gericht trägt "Nudelgericht", im
        neuen Gericht "nud" tippen; die Liste "Vorschläge" enthält "Nudelgericht".
      - `takes over a suggested category with one click` — Klick auf den Vorschlag; die
        Kategorie steht in der Liste, die Ansage stimmt, das Feld ist leer.
      - `takes over the spelling of a known category` — "nudelgericht" tippen und
        übernehmen; in der Liste steht "Nudelgericht".
      - `does not suggest a category the meal already carries`.
      - `has no accessibility violations with category suggestions`.
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [x] Mit VoiceOver: Die Vorschläge sind nach dem Feld erreichbar, ein Doppeltipp
      übernimmt die Kategorie und die Ansage bestätigt es.

### Phase 3: Kategorie-Verwaltung mit Liste und Löschen

Abhängigkeiten: Phase 2

In den Einstellungen steht "Kategorie-Verwaltung". Sie listet alle Kategorien mit der
Anzahl der Gerichte. Löschen entfernt eine Kategorie nach Bestätigung aus allen
Gerichten.

**Aufgaben**:

- [x] Test zuerst: `src/meals/domain/mealCategory.test.ts` für `withoutCategory`:
      - `removes the category from every meal carrying it, whatever its spelling`
      - `returns only the changed meals`
      - `keeps the order of the remaining categories`
      - `returns nothing when no meal carries the category`
- [x] Test zuerst: `src/meals/domain/announcements.test.ts`
      - `categoriesManagementHeading`: "Kategorie-Verwaltung, keine" / "…, 3"
      - `categoryRowLabel({ name: 'Nudelgericht', mealCount: 5 })` → "Nudelgericht, 5"
      - `categoryDeletionNote`: `1` → "Die Kategorie wird aus 1 Gericht entfernt. Die
        Gerichte selbst bleiben erhalten.", `5` → "… aus 5 Gerichten entfernt. …"
      - `categoryDeletedAnnouncement(name, remaining)`: "… gelöscht, keine Kategorien
        mehr." / "… noch 1 Kategorie." / "… noch 2 Kategorien."
- [x] `src/meals/domain/mealCategory.ts`: `withoutCategory(meals, name): readonly Meal[]`.
- [x] `src/meals/domain/announcements.ts`: die vier Punkte umsetzen.
- [x] `src/meals/api/mealsClient.ts`: `changeMeals(changed: readonly Meal[]): void`.
- [x] `src/meals/api/inMemoryMealsClient.ts`: `changeMeals` ersetzt jedes Gericht per
      `id` und veröffentlicht **einmal**.
- [x] `src/meals/api/firestoreMealsClient.ts`: `changeMeals` schreibt in einem Batch.
      ```ts
      changeMeals(changed) {
        if (changed.length === 0) return
        const batch = writeBatch(firestore)
        changed.forEach((meal) =>
          batch.set(mealDocument(meal.id), toDocument(meal)),
        )
        writeInBackground(batch.commit())
      },
      ```
      `toDocument` nimmt nur die Fachfelder, die `id` landet also nicht im Dokument.
- [x] `src/meals/ui/useMeals.ts`: `changeMeals` als `useCallback` in `Meals`.
- [x] `src/meals/ui/CategoryListRow.tsx` anlegen, Muster `KnownItemListRow`: Knopf
      `.mealNameButton` mit `categoryRowLabel(overview)`, Mülleimer `.iconButton` mit
      `aria-label={`Löschen, ${overview.name}`}`.
- [x] `src/meals/ui/CategoryListPage.tsx` anlegen, Muster `KnownItemListPage`: Knopf
      "Zurück zu den Einstellungen", `h1` mit `categoriesManagementHeading` und
      `useHeadingFocus`, leer "Noch keine Kategorien.", sonst `ul.itemList`.
- [x] `src/meals/ui/DeleteCategoryPage.tsx` anlegen, Muster `DeleteKnownItemPage`: Knopf
      "Zurück zur Kategorie-Verwaltung", `h1` "<Name> löschen?", Text aus
      `categoryDeletionNote`, `.pageActions` mit "Löschen" und "Abbrechen".
- [x] `src/meals/ui/CategoriesArea.tsx` anlegen:
      ```tsx
      type CategoriesPage =
        | { kind: 'list' }
        | { kind: 'form'; name: string }
        | { kind: 'delete'; name: string }

      type CategoriesAreaProps = {
        meals: Meals
        announce: (text: string) => void
        onBack: () => void
      }
      ```
      Die Übersicht kommt aus `mealCategories(meals.meals)`, die adressierte Kategorie
      wird über `normalizeMealName` gesucht, fehlt sie, erscheint die Liste. Löschen:
      `meals.changeMeals(withoutCategory(meals.meals, name))`, zur Liste,
      `categoryDeletedAnnouncement(name, overview.length - 1)`. Der Namens-Knopf setzt
      schon `{ kind: 'form' }`, bis Phase 4 fällt das auf die Liste zurück.
- [x] `src/SignedInApp.tsx`: `CATEGORIES_ENTRY = 'categories'`, Eintrag
      `{ kind: 'page', id: CATEGORIES_ENTRY, label: 'Kategorie-Verwaltung' }` nach der
      Artikelverwaltung, im Bereich `settings` bei diesem Eintrag
      `<CategoriesArea meals={meals} announce={announce} onBack={() => setSettingsEntry(null)} />`
      rendern.
- [x] `src/SignedInApp.test.tsx:980-993`: `offers to invert the colours above the known
      items` erwartet künftig `['Farben invertieren', 'Artikelverwaltung',
      'Kategorie-Verwaltung']`.
- [x] `e2e/meals.spec.ts`: `deletes a category from every meal`. Zwei Gerichte mit
      "Nudelgericht" anlegen, Einstellungen → Kategorie-Verwaltung → "Löschen,
      Nudelgericht" → "Löschen"; `mealCategoriesOnServer()` zeigt beide Gerichte ohne
      Kategorie. Das belegt den `writeBatch` gegen den echten Emulator.

**Automatisierte Verifikation**:

- [x] Die neuen Fälle zu `withoutCategory` und den Ansagen schlagen vor der Umsetzung fehl
      und laufen danach grün.
- [x] Neu in `src/SignedInApp.test.tsx`: `opens the category management from the
      settings` — ein Gericht mit Kategorie, Einstellungen → "Kategorie-Verwaltung";
      Überschrift "Kategorie-Verwaltung, 1".
- [x] Neue Fälle in `src/meals/ui/CategoriesArea.test.tsx` (mit
      `createInMemoryMealsClient` und `useMeals`, Muster `KnownItemsArea.test.tsx`):
      - `lists the categories in alphabetical order with their meal count` — Knöpfe
        "Auflauf, 2", "Nudelgericht, 1", je Zeile "Löschen, <Name>".
      - `shows an empty category management` — "Noch keine Kategorien." und
        "Kategorie-Verwaltung, keine".
      - `asks before deleting a category` — die Bestätigung nennt die Zahl der Gerichte,
        `storedMeals()` ist unverändert.
      - `keeps the category when the deletion is cancelled`.
      - `deletes the category from every meal after the confirmation` —
        `storedMeals()` ohne die Kategorie, andere Kategorien und Felder unverändert,
        Liste wieder da, Ansage stimmt.
      - `returns to the list when the category disappears` — während die Bestätigung
        offen ist, über `mealsArriveFromElsewhere` Gerichte ohne die Kategorie schicken.
      - `has no accessibility violations on the category management` und
        `has no accessibility violations on the deletion page`.
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [x] `npm run test:e2e` läuft durch, samt `deletes a category from every meal`.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Mit VoiceOver: Die Zeilen werden als "Nudelgericht, 5, Taste" gelesen, der
      Mülleimer als "Löschen, Nudelgericht, Taste".
- [ ] Eine gelöschte Kategorie verschwindet auf beiden Geräten aus allen Gerichten.

### Phase 4: Kategorie umbenennen und zusammenführen

Abhängigkeiten: Phase 3

Ein Klick auf eine Kategorie öffnet "Kategorie bearbeiten". Speichern schreibt den neuen
Namen in alle Gerichte. Ein vergebener Name führt beide Kategorien zusammen.

**Aufgaben**:

- [ ] Test zuerst: `src/meals/domain/mealCategory.test.ts` für `withCategoryRenamed`:
      - `corrects the spelling in every meal carrying the category`
      - `renames to a free name`
      - `merges into an existing category, keeping it once at the first position`
      - `spreads the new spelling to meals that carried only the target`
      - `returns only the changed meals`
      - `returns nothing when the name stays the same`
      - `refuses an empty name` / `refuses a name longer than a hundred characters`
        → `InvalidMeal`, auch wenn die Kategorie inzwischen fehlt
      - `returns null when no meal carries the category any more`
- [ ] Test zuerst: `src/meals/domain/announcements.test.ts`:
      `categorySavedAnnouncement("Nudelgericht")` → "Nudelgericht gespeichert."
- [ ] `src/meals/domain/mealCategory.ts`:
      ```ts
      export function withCategoryRenamed(
        meals: readonly Meal[],
        from: string,
        newName: string,
      ): readonly Meal[] | null
      ```
      Erst `createName(newName)`, dann `null`, wenn kein Gericht `from` trägt. Sonst in
      jedem Gericht, das `from` oder den neuen Namen trägt (normalisiert), jede solche
      Kategorie durch den neuen Namen ersetzen und Doppelte entfernen, wobei die erste
      Stelle bleibt. Zurück kommen nur Gerichte, deren `categories` sich tatsächlich
      ändern.
- [ ] `src/meals/domain/announcements.ts`: `categorySavedAnnouncement`.
- [ ] `src/meals/ui/CategoryFormPage.tsx` anlegen, Muster `KnownItemFormPage`: Knopf
      "Zurück zur Kategorie-Verwaltung", `h1` "Kategorie bearbeiten", Feld
      `id="categoryName"` mit Label "Name", Anfangsfokus und bisherigem Namen,
      `p#categoryFailure.failure`, `BottomBar` mit `SaveIcon` und "Speichern",
      `aria-describedby`. Im Fehlerfall `mealFailureMessage` setzen und ansagen.
- [ ] `src/meals/ui/CategoriesArea.tsx`: Seite `{ kind: 'form' }` bedienen. Beim
      Speichern `withCategoryRenamed` rechnen. Bei `null` zur Liste, sonst
      `meals.changeMeals(changed)`, zur Liste, `categorySavedAnnouncement(<validierter
      Name>)` ansagen. Ungültige Namen wirft `withCategoryRenamed`, die Formularseite
      fängt sie.
- [ ] `docs/notes.txt`: Die TODO-Punkte "Kategorien in Gerichten" und
      "Kategorie-Verwaltung in Einstellungen als dritte Option" auf `x` setzen und nach
      DONE verschieben. Unten unter TODO anhängen:
      `- Kategorien nutzen: Gerichteliste nach Kategorie filtern, im Wochenplan nach
      Kategorie wuerfeln (Feld categories am Gericht steht seit MZP-021 bereit)`.

**Automatisierte Verifikation**:

- [ ] Die neuen Fälle zu `withCategoryRenamed` und `categorySavedAnnouncement` schlagen
      vor der Umsetzung fehl und laufen danach grün.
- [ ] Neue Fälle in `src/meals/ui/CategoriesArea.test.tsx`:
      - `starts the form with the current name in focus`.
      - `corrects the spelling of a category in every meal` — "nudelgericht" →
        "Nudelgericht"; `storedMeals()` trägt überall die neue Schreibweise, Ansage
        stimmt, Liste wieder da.
      - `merges a category into an existing one` — "Nudelgerichte" → "Nudelgericht";
        die Liste zeigt eine Zeile mit der Summe der Gerichte, ein Gericht mit beiden
        trägt sie einmal.
      - `refuses an empty name` und `refuses a name that is too long` — Meldung auf der
        Seite und in den Ansagen, `storedMeals()` unverändert, die Seite bleibt offen.
      - `has no accessibility violations on the form`.
- [ ] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [ ] `npm run test:e2e` läuft durch.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Nach dem Umbenennen zeigt die Detailseite eines betroffenen Gerichts den neuen
      Namen, auch auf dem anderen Gerät.
- [ ] Mit VoiceOver: Der Speichern-Knopf wird als "Speichern, Taste" gelesen, die
      Rückkehr zur Liste ist durch die Ansage nachvollziehbar.

## Notizen zur Umsetzung

- Phase 1: `tsc` verbietet mit `noUnusedParameters` ein nur durchgereichtes `known` in
  `categoryToAdd`. Die beiden Fälle `takes over the spelling a known category already
  has` und `keeps the written spelling for a new category` aus Phase 2 sind deshalb
  schon in Phase 1 test-getrieben umgesetzt. `MealsArea` reicht bis Phase 2 weiter `[]`.

## Verweise

- `docs/agents/plans/2026-09-18-artikelverwaltung-und-einstellungen.md`: Vorbild für
  Verwaltung, Bestätigung und Umbenennen samt Zusammenführen
- `src/meals/ui/MealItemsEditor.tsx`: Vorbild für den Kategorien-Editor
- `src/shopping/ui/KnownItemsArea.tsx` und die `KnownItem…`-Seiten: Vorbild für die
  Seiten der Kategorie-Verwaltung
- `src/shopping/domain/knownItem.ts:81-88`, `151-165`: `canonicalName` und
  `suggestNames` als Vorbild für Schreibweise und Vorschläge
- `src/shopping/api/firestoreKnownItemsClient.ts:112-125`: `writeBatch` als Vorbild für
  `changeMeals`
- `src/meals/api/firestoreMealsClient.ts:40-65`: tolerantes Lesen, `toDocument`
- `src/shared/ui/NameSuggestions.tsx`: wiederverwendete Vorschlagsliste
- `eslint.config.js:8-53`: Modulgrenzen, die die Verdrahtung in `SignedInApp` erzwingen
