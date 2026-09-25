---
date: 2026-09-25T06:52:20+00:00
git_commit: 72328943d1b7a905a90c72b39ff6ef48a42df5c1
branch: main
story: MZP-026
topic: "Snack kennzeichnen"
tags: [plan, meals, mealForm, domain, firestore]
status: done
---

# PLAN: MZP-026 — Snack kennzeichnen

Ein Gericht soll auch sagen können, dass es ein Snack ist. Die Bearbeiten-Seite bekommt
dafür unter `Hauptgericht` und `Frühstück` eine dritte Checkbox `Snack`, standardmäßig
leer und in derselben Optik. Von den drei Zeilen darf höchstens eine angehakt sein,
alle drei leer ist erlaubt.

Die Grundlage steht seit MZP-019: `kind: MealKind` ist ein einzelner Wert, die
Ausschlussregel `withChosenKind` ist allgemein geschrieben, und die Ansage beim
Umkippen liest ihre Namen aus einer `Record<ChosenMealKind, string>`. Der Snack ist
deshalb ein dritter Wert in diesem Typ und kein neues Feld am Gericht.

Das Feld wirkt weiter nirgends außer im Formular. Es ist die Grundlage für die späteren
Snack-Regeln der Zufallsauswahl (`docs/notes.txt:154-156`).

Alle Entscheidungen stammen aus der Befragung vom 2026-09-25.

## Akzeptanzkriterien

- Die Bearbeiten-Seite zeigt unter der Zeile `Frühstück` und über den Kategorien eine
  dritte Zeile `Snack`, in derselben Optik: `.toggleField`, 40×40-Kasten am rechten
  Rand, die ganze Zeile ist Klickfläche.
- VoiceOver liest sie als `Snack, Kontrollkästchen, aktiviert` beziehungsweise
  `deaktiviert`, nicht als Schalter.
- Höchstens einer der drei Haken ist gesetzt, auch nicht durch Daten aus Firestore,
  weil die Domäne nur **einen** Wert kennt.
- Wer einen Haken setzt, nimmt den gesetzten anderen weg. Unmittelbar danach wird die
  Zeile angesagt, die ihn verloren hat: `Hauptgericht abgewählt.`,
  `Frühstück abgewählt.` oder `Snack abgewählt.`
- Nimmt man einen gesetzten Haken nur weg, sind alle drei Zeilen leer und es kommt
  **keine** Ansage.
- `Gericht anlegen` zeigt unverändert `Hauptgericht` gesetzt, `Frühstück` und `Snack`
  leer. Ein neu angelegtes Gericht ist Hauptgericht.
- `Gericht bearbeiten` zeigt den gespeicherten Zustand. `Speichern` schreibt ihn,
  `Zurück zum Gericht` verwirft ihn. Ein Snack überlebt ein Neuladen und erscheint auf
  dem zweiten Gerät.
- Dokumente aus allen früheren Zeitaltern werden gelesen wie bisher: ohne Felder ist
  das Gericht ein Hauptgericht, `mainMeal: false` bedeutet nichts angehakt,
  `breakfast: true` bedeutet Frühstück.
- Ausblenden ist unabhängig: Einen ausgeblendeten Snack zu bearbeiten und zu speichern
  lässt beide Zustände stehen.
- Zufallsauswahl, Gerichteliste, Gericht-Seite, Wochenplan und Vorräte verhalten sich
  unverändert, auch für einen Snack.

## Wesentliche Entscheidungen und Abwägungen

1. **`'snack'` als dritter Wert von `MealKind`:**
   `'mainMeal' | 'breakfast' | 'snack' | 'none'`.
   - Warum: „höchstens eins“ ist dann weiter der Typ selbst. `withChosenKind`
     (`meal.ts:108-115`) braucht keine Änderung, weil es nur `chosen`, `previous` und
     `checked` vergleicht.
   - Auswirkung: Der Compiler erzwingt den Eintrag `snack` in `mealKindNames`
     (`announcements.ts:171-174`), also entsteht die Ansage `Snack abgewählt.` ohne
     weitere Bedingung. Neue Tests sichern die Übergänge mit `'snack'` ab.

2. **Firestore bekommt ein drittes Boolean-Feld `snack`.** Gelesen wird in der
   Reihenfolge `breakfast` → `snack` → `mainMeal !== false` → `'none'`.
   - Warum: Das folgt MZP-019, Entscheidung 2. Es braucht keinen Migrationslauf,
     Altdokumente bleiben lesbar, und ein Gerät mit veralteter PWA schreibt weiter
     gültige Dokumente.
   - Auswirkung: Wir nehmen bewusst in Kauf, dass ein Gerät mit noch nicht
     aktualisierter PWA ein Snack-Dokument als `mainMeal: false, breakfast: false`
     liest, also als „nichts“. Speichert es das Gericht, fällt `snack` aus dem Dokument
     (`setDoc` ersetzt es ganz). Dieser Verlust ist sichtbar statt still und endet,
     sobald beide Geräte die neue Fassung haben. Die Lesereihenfolge sichert ein
     e2e-Test gegen den Emulator ab, weil `firestoreMealsClient` keinen Unit-Test hat.

3. **Der Standard beim Anlegen bleibt `Hauptgericht`, die neue Zeile steht unter
   `Frühstück`.**
   - Warum: So bleibt das bisherige Verhalten erhalten, und die Zeile steht dort, wo
     der Haushalt sie erwartet.
   - Auswirkung: `EMPTY_DRAFT` bleibt unverändert, `index.css` bleibt unverändert, und
     es kommt eine JSX-Zeile nach dem Muster der beiden vorhandenen dazu.

4. **Die Beschriftung bleibt ein Literal im JSX, der Bezeichner heißt `snack`.**
   - Warum: So stehen seit MZP-017 alle Beschriftungen des Formulars. `snack` ist
     Englisch und zugleich das Wort des Haushalts.
   - Auswirkung: Das Wort `Snack` steht zweimal, im JSX und in `mealKindNames`. Laufen
     die beiden Stellen auseinander, fangen die Tests es ab, weil sie die Checkbox über
     ihren zugänglichen Namen greifen und den Ansagetext prüfen.

## Ausgangslage

Das Gericht führt seit MZP-019 genau einen Wert für seine Art (`meal.ts:10-12`):

```
MealKind        = 'mainMeal' | 'breakfast' | 'none'
ChosenMealKind  = Exclude<MealKind, 'none'>

withChosenKind(previous, chosen, checked)      meal.ts:108-115
  checked             -> chosen
  previous === chosen -> 'none'
  sonst               -> previous
```

Ansage (`announcements.ts:171-182`):

```
mealKindNames: Record<ChosenMealKind, string> = { mainMeal: 'Hauptgericht',
                                                  breakfast: 'Frühstück' }
replacedKindAnnouncement(previous, next)
  previous === 'none' || next === 'none' || previous === next -> null
  sonst -> `${mealKindNames[previous]} abgewählt.`
```

Formular heute (`MealFormPage.tsx:130-168`):

```
+------------------------------------------+
| Rezept                                   |
| [ textarea rows=8 ]                      |
|                                          |
| Hauptgericht                    [ ✓ ]    |  <label class="toggleField">
| Frühstück                       [   ]    |  <label class="toggleField">
|                                          |
| Kategorien ...                           |  <MealCategoriesEditor>
| <p id="mealFailure" class="failure">     |
+------------------------------------------+
| [ Speichern ]                  BottomBar |
+------------------------------------------+
```

Persistenz (`firestoreMealsClient.ts:40-43`, `:69-70`):

```
toKind      stored.breakfast === true  -> 'breakfast'
            stored.mainMeal !== false  -> 'mainMeal'    <- auch: Feld fehlt ganz
            sonst                      -> 'none'
toDocument  mainMeal:  kind === 'mainMeal'
            breakfast: kind === 'breakfast'
```

Was schon da ist und wiederverwendet wird:

```
index.css                         .toggleField                     -> unveraendert
MealFormPage.tsx:76-81            chooseKind                       -> unveraendert
MealsArea.test.tsx:150-164        mainMealBox/breakfastBox, switch -> Vorbild fuer snack
MealsArea.test.tsx:1132-1345      Tests zu Hauptgericht/Fruehstueck -> Vorbild
e2e/keyboard.ts                   switchCheckbox(page, label)      -> unveraendert
e2e/emulatorHousehold.ts:198-210  ListedMeals                      -> ein Feld mehr
e2e/emulatorHousehold.ts:240-252  breakfastMealNamesOnServer       -> Vorbild
e2e/emulatorHousehold.ts:275      StoredMealFlags                  -> ein Feld mehr
e2e/meals.spec.ts:120-165         zwei Tests zu Fruehstueck        -> Vorbild
```

## Zielbild

```
MealKind        = 'mainMeal' | 'breakfast' | 'snack' | 'none'
ChosenMealKind  = 'mainMeal' | 'breakfast' | 'snack'
```

Die Bearbeiten-Seite:

```
+------------------------------------------+
| Rezept                                   |
| [ textarea rows=8 ]                      |
|                                          |
| Hauptgericht                    [   ]    |
| Frühstück                       [   ]    |
| Snack                           [ ✓ ]    |  <- neu, kind === 'snack'
|                                          |
| Kategorien ...                           |
| <p id="mealFailure" class="failure">     |
+------------------------------------------+
```

Neue Übergänge, gerechnet von `withChosenKind` ohne Codeänderung:

```
Ausgangswert   Druck auf       Kasten danach   Ergebnis     Ansage
'mainMeal'     Snack           gesetzt         'snack'      "Hauptgericht abgewählt."
'breakfast'    Snack           gesetzt         'snack'      "Frühstück abgewählt."
'snack'        Hauptgericht    gesetzt         'mainMeal'   "Snack abgewählt."
'snack'        Frühstück       gesetzt         'breakfast'  "Snack abgewählt."
'none'         Snack           gesetzt         'snack'      keine
'snack'        Snack           leer            'none'       keine
```

Firestore, vier Werte auf drei Boolean-Felder:

```
kind          mainMeal   breakfast   snack
'mainMeal'    true       false       false
'breakfast'   false      true        false
'snack'       false      false       true
'none'        false      false       false

toKind   stored.breakfast === true  -> 'breakfast'
         stored.snack === true      -> 'snack'
         stored.mainMeal !== false  -> 'mainMeal'     <- auch: Feld fehlt ganz
         sonst                      -> 'none'
```

`snack` muss **vor** `mainMeal` gelesen werden, sonst würde ein Dokument ohne
`mainMeal`-Feld mit `snack: true` zum Hauptgericht. Die Reihenfolge zwischen
`breakfast` und `snack` ist gleichgültig, weil die App nie beide setzt.

Dokumente aus vier Zeitaltern, alle lesbar:

```
vor MZP-017   { name, ingredientNotes, recipe }                       -> 'mainMeal'
seit MZP-017  { ..., mainMeal: false }                                -> 'none'
seit MZP-019  { ..., mainMeal: false, breakfast: true }               -> 'breakfast'
seit MZP-026  { ..., mainMeal: false, breakfast: false, snack: true } -> 'snack'
```

Was sich **nicht** ändert: `index.css`, `randomPlanning.ts`, `MealListRow.tsx`,
`MealPage.tsx`, `MealsArea.tsx`, `useMeals.ts`, `mealsClient.ts`,
`inMemoryMealsClient.ts`, Wochenplan und Vorräte.

## Abstraktionen und Wiederverwendung

Es entsteht kein neuer Typ und keine neue Funktion. Ein vorhandener Typ bekommt einen
Wert, eine vorhandene Tabelle einen Eintrag, und der Adapter, das Formular und die
Testhilfen werden verlängert.

- `src/meals/domain`
  - `meal.ts`
    - `MealKind`: bekommt den Wert `'snack'`
  - `announcements.ts`
    - `mealKindNames`: bekommt `snack: 'Snack'`
  - `meal.test.ts`: Tests für `createMeal`, `withHiding` und `withChosenKind` mit
    `'snack'`
  - `announcements.test.ts`: Tests für `replacedKindAnnouncement` mit `'snack'`
- `src/meals/api`
  - `firestoreMealsClient.ts`
    - `toKind`: liest `snack` vor `mainMeal`
    - `toDocument`: schreibt `snack`
- `src/meals/ui`
  - `MealFormPage.tsx`: dritte Zeile `Snack`
  - `MealsArea.test.tsx`: `snackBox()`, `switchSnack()`, neue Tests, vorhandene
    Tests um die dritte Zeile ergänzt
- `e2e`
  - `emulatorHousehold.ts`: `ListedMeals` bekommt `snack`, `snackMealNamesOnServer`
    ist neu, `StoredMealFlags` bekommt `snack`
  - `meals.spec.ts`: zwei neue Tests
- `docs`
  - `notes.txt`: ein neuer Punkt unter TODO zum erweiterten Wertebereich

## Logging und Beobachtbarkeit

Die App hat kein Logging. Beobachtbar ist sie über die VoiceOver-Ansagen aus
`announce`. Neu ist ein Satz, der wie die vorhandenen nur beim Umkippen kommt:

```
"Snack abgewählt."
```

`Hauptgericht abgewählt.` und `Frühstück abgewählt.` kommen künftig auch dann, wenn
`Snack` angehakt wird.

## Umsetzung

Abhängigkeiten: keine.

**Aufgaben**:

- [x] Die Tests in `src/meals/domain/meal.test.ts` zuerst schreiben.
  - Im `createMeal`-Block (nach `creates a breakfast when the draft says so`, ab
    Zeile 190) den Test `creates a snack when the draft says so` ergänzen.
  - Im `withHiding`-Block (nach `leaves a breakfast a breakfast`, Zeile 247) den Test
    `leaves a snack a snack` ergänzen.
  - Im `withChosenKind`-Block (Zeile 304-328) die Tests für die neuen Übergänge
    ergänzen:
    - `makes a main meal a snack`: `('mainMeal', 'snack', true)` ergibt `'snack'`.
    - `makes a breakfast a snack`: `('breakfast', 'snack', true)` ergibt `'snack'`.
    - `makes a snack a main meal or a breakfast`: `('snack', 'mainMeal', true)`
      ergibt `'mainMeal'`, `('snack', 'breakfast', true)` ergibt `'breakfast'`.
    - In die vorhandenen Tests zusätzliche `expect`-Zeilen einfügen:
      `('none', 'snack', true)` ergibt `'snack'`, `('snack', 'snack', false)` ergibt
      `'none'`, `('snack', 'mainMeal', false)` ergibt `'snack'`.

  Die Tests übersetzen erst, wenn `'snack'` im Typ steht (nächste Aufgabe). Das ist der
  rote Schritt.
- [x] `MealKind` in `src/meals/domain/meal.ts:10` erweitern:
  ```ts
  export type MealKind = 'mainMeal' | 'breakfast' | 'snack' | 'none'
  ```
  `withChosenKind`, `createMeal` und `withHiding` bleiben unverändert.
- [x] Die Tests für `replacedKindAnnouncement` in
  `src/meals/domain/announcements.test.ts` (ab Zeile 385) zuerst schreiben:
  - `names the main meal mark that a snack took away`:
    `('mainMeal', 'snack')` ergibt `Hauptgericht abgewählt.`
  - `names the breakfast mark that a snack took away`:
    `('breakfast', 'snack')` ergibt `Frühstück abgewählt.`
  - `names the snack mark that another kind took away`: `('snack', 'mainMeal')` und
    `('snack', 'breakfast')` ergeben jeweils `Snack abgewählt.`
  - In die drei vorhandenen „says nothing“-Tests zusätzliche Zeilen einfügen:
    `('snack', 'none')`, `('none', 'snack')` und `('snack', 'snack')` ergeben `null`.
- [x] `mealKindNames` in `src/meals/domain/announcements.ts:171-174` ergänzen.
  Solange der Eintrag fehlt, meldet der Compiler einen Fehler:
  ```ts
  const mealKindNames: Record<ChosenMealKind, string> = {
    mainMeal: 'Hauptgericht',
    breakfast: 'Frühstück',
    snack: 'Snack',
  }
  ```
- [x] `src/meals/api/firestoreMealsClient.ts` anpassen: `toKind` (Zeile 40-43) liest
  `snack` **vor** `mainMeal`, und `toDocument` (Zeile 69-70) schreibt das dritte Feld.
  ```ts
  function toKind(stored: DocumentData): MealKind {
    if (stored.breakfast === true) return 'breakfast'
    if (stored.snack === true) return 'snack'
    return stored.mainMeal !== false ? 'mainMeal' : 'none'
  }
  ```
  ```ts
    mainMeal: meal.kind === 'mainMeal',
    breakfast: meal.kind === 'breakfast',
    snack: meal.kind === 'snack',
  ```
- [x] In `src/meals/ui/MealFormPage.tsx` die dritte Zeile direkt hinter die Zeile
  `Frühstück` (Zeile 147-154) und vor `<MealCategoriesEditor>` setzen:
  ```tsx
  <label className="toggleField">
    <span>Snack</span>
    <input
      type="checkbox"
      checked={draft.kind === 'snack'}
      onChange={(event) => chooseKind('snack', event.target.checked)}
    />
  </label>
  ```
  Die Zeile bekommt kein `role="switch"` und keine `id`/`htmlFor`. `chooseKind` und
  `EMPTY_DRAFT` bleiben unverändert.
- [x] In `src/meals/ui/MealsArea.test.tsx` die Hilfen `snackBox()` und `switchSnack()`
  hinter `switchBreakfast()` (Zeile 163-165) ergänzen, im selben Stil und über die
  Rolle:
  ```tsx
  function snackBox() {
    return screen.getByRole('checkbox', { name: 'Snack' })
  }

  function switchSnack() {
    return userEvent.click(snackBox())
  }
  ```
- [x] In `src/meals/ui/MealsArea.test.tsx` die vorhandenen Tests um die dritte Zeile
  ergänzen:
  - `leaves a new meal out of the breakfasts` (Zeile 1132): zusätzlich
    `expect(snackBox()).not.toBeChecked()`.
  - `says nothing when a mark is only taken away` (Zeile 1201): zusätzlich
    `snackBox()` ist leer, und die Ansagen enthalten nicht `Snack abgewählt.`
  - `shows a meal without any kind again` (Zeile 1214): zusätzlich `snackBox()` ist
    leer.
  - `opens a known meal for editing with everything filled in` (Zeile 595):
    zusätzlich `snackBox()` ist leer.
- [x] In `src/meals/ui/MealsArea.test.tsx` neue Tests hinter
  `keeps a meal hidden when its kind changes` (Zeile 1250-1263) anlegen:
  - `marks a meal as snack`: Formular öffnen, Namen eintragen, `Snack` drücken,
    speichern. Danach ist `client.storedMeals()[0].kind` gleich `'snack'`.
  - `takes the other marks away when a meal becomes a snack`: Das neue Formular hat
    `Hauptgericht` gesetzt. Nach einem Druck auf `Snack` ist `mainMealBox()` leer und
    `snackBox()` gesetzt. Dasselbe ausgehend von einem Gericht mit
    `kind: 'breakfast'`: Danach ist `breakfastBox()` leer und `snackBox()` gesetzt.
  - `takes the snack mark away when a meal becomes a main meal or a breakfast`: Ein
    Gericht mit `kind: 'snack'` öffnen und `Hauptgericht` drücken. Danach ist
    `snackBox()` leer und `mainMealBox()` gesetzt. Anschließend `Frühstück` drücken:
    `mainMealBox()` ist leer, `breakfastBox()` gesetzt.
  - `says which mark a snack took away`: Aus einem Hauptgericht heraus `Snack`
    drücken, die Ansage lautet `Hauptgericht abgewählt.` Dann `Frühstück` drücken,
    die Ansage lautet `Snack abgewählt.` Geprüft wird wie in `says which mark it took
    away` (Zeile 1178) mit `toContain` auf `announcements`.
  - `shows whether the edited meal is a snack`: Ein Gericht mit `kind: 'snack'`
    öffnen. `snackBox()` ist gesetzt, `mainMealBox()` und `breakfastBox()` sind leer.
  - `forgets the snack that was not saved`: Bearbeiten, `Snack` drücken,
    `Zurück zum Gericht`, erneut bearbeiten. Danach ist `snackBox()` leer, und
    `client.storedMeals()[0].kind` ist `'mainMeal'`.
  - `keeps a snack hidden when it is saved`: Einen ausgeblendeten Snack bearbeiten
    und speichern. `client.storedMeals()[0]` entspricht
    `meal('soup', 'Suppe', { hidden: true, kind: 'snack' })`.
- [x] In `src/meals/ui/MealsArea.test.tsx` den Test
  `has no accessibility violations on the form of a snack` hinter den Test für das
  Frühstück (Zeile 1333-1343) setzen, nach demselben Muster mit `kind: 'snack'` und
  `expect(snackBox()).toBeChecked()`.
- [x] In `e2e/emulatorHousehold.ts` `snack?: { booleanValue?: boolean }` in
  `ListedMeals` (Zeile 198-210) aufnehmen. `snackMealNamesOnServer` nach dem Vorbild
  von `breakfastMealNamesOnServer` (Zeile 240-252) anlegen:
  ```ts
  .filter((document) => document.fields.snack?.booleanValue === true)
  ```
  `StoredMealFlags` (Zeile 275) um `snack?: boolean` erweitern. `storeMealOnServer`
  übernimmt das Feld über `flagFields` ohne weitere Änderung.
- [x] In `e2e/meals.spec.ts` hinter
  `treats a stored meal that is no main meal as neither` (Zeile 147-165) zwei Tests
  anlegen:
  - `keeps a meal as a snack after a reload`: `Bolognese` anlegen, `Bearbeiten`,
    `switchCheckbox(page, 'Snack')`, `Speichern`, dann
    `await expect.poll(snackMealNamesOnServer).toEqual(['Bolognese'])`,
    `page.reload()`, `Gerichte`, `Bolognese`, `Bearbeiten`. Danach ist `Snack`
    gesetzt, `Hauptgericht` und `Frühstück` sind leer (`exact: true`). Das Warten auf
    den Server ist Pflicht: Ausstehende Schreibvorgänge überleben kein Neuladen
    (`docs/notes.txt:95-100`).
  - `reads a stored snack without the main meal field as a snack`:
    `storeMealOnServer('Nussmix', { snack: true })` **vor** dem Anmelden, dann
    anmelden, `Gerichte`, `Nussmix`, `Bearbeiten`. Danach ist `Snack` gesetzt und
    `Hauptgericht` leer. Der Test sichert ab, dass `toKind` `snack` vor der Regel
    „fehlendes `mainMeal` heißt Hauptgericht“ liest.
- [x] In `docs/notes.txt` unten unter TODO einen Punkt anhängen, weil der Punkt in
  Zeile 121-123 den alten Wertebereich nennt und nicht umformuliert werden darf:
  ```
  - Zufallsregeln: kind traegt seit MZP-026 auch 'snack' (Firestore-Feld snack);
    die Snack-Regeln weiter oben koennen darauf aufsetzen
  ```

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `withChosenKind` ist für alle neuen Übergänge mit `'snack'` grün, besonders
  `('mainMeal', 'snack', true) === 'snack'` und `('snack', 'snack', false) === 'none'`.
- [x] `replacedKindAnnouncement('snack', 'mainMeal')` liefert `Snack abgewählt.`, und
  `('mainMeal', 'snack')` liefert `Hauptgericht abgewählt.` Alle Fälle mit `'none'`
  oder gleichem Wert liefern `null`.
- [x] `takes the other marks away when a meal becomes a snack` und
  `takes the snack mark away when a meal becomes a main meal or a breakfast` sind grün.
  Es ist also nie mehr als ein Haken gesetzt.
- [x] `says nothing when a mark is only taken away` ist grün, auch für
  `Snack abgewählt.`
- [x] `leaves a new meal out of the breakfasts` ist grün: Der Standard beim Anlegen
  ist unverändert `Hauptgericht`.
- [x] Die Zugänglichkeitsprüfung `has no accessibility violations on the form of a
  snack` ist grün, und `snackBox()` ist über `getByRole('checkbox', …)` erreichbar.
- [x] `npm run lint` läuft durch, und `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `npm run test:e2e` läuft durch, einschließlich
  `keeps a meal as a snack after a reload`,
  `reads a stored snack without the main meal field as a snack` und der vier
  unveränderten Tests zu Hauptgericht und Frühstück.

**Manuelle Verifikation**:

- [x] Auf dem Gerät mit VoiceOver ein Gericht bearbeiten und bis ans Ende der Haken
  wischen. Die dritte Zeile liest sich als `Snack, Kontrollkästchen, deaktiviert`.
- [x] `Snack` anhaken. Man hört `Hauptgericht abgewählt.`, und VoiceOvers eigenes
  `aktiviert` wird dabei nicht abgeschnitten. Danach `Frühstück` anhaken, man hört
  `Snack abgewählt.`
- [x] Den gesetzten Haken wieder wegnehmen. Es kommt keine zusätzliche Ansage, und
  alle drei Zeilen sind leer.
- [x] Die Zeile `Snack` lässt sich mit dem Finger auf ihrer ganzen Breite treffen und
  sieht aus wie die beiden anderen, auch bei eingeschalteter Farbumkehr.
- [x] Einen Snack speichern und auf dem zweiten Gerät öffnen. Dort ist `Snack`
  gesetzt, sobald beide Geräte die neue Fassung haben.

## Notizen zur Umsetzung

**2026-09-25 — am Gerät geprüft.** Die Zeile `Snack` liest sich als Kontrollkästchen,
das Umkippen wird angesagt, das reine Abwählen bleibt still, und der gespeicherte Zustand
steht auf dem zweiten Gerät.

**2026-09-25 — Umsetzung.** Im ersten vollständigen e2e-Lauf waren
`changes the count of a supply at its row` und `buys only the day that the supply no
longer covers` rot. Das ist der bekannte Wackler aus `docs/notes.txt` (useSupplies
übernimmt jede Momentaufnahme ungeprüft), er rührt nicht an `kind`. Der
Wiederholungslauf war komplett grün, alle 30 Tests.

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/agents/plans/2026-09-23-fruehstueck-kennzeichnen.md`: MZP-019, führt `kind`,
  `withChosenKind`, `replacedKindAnnouncement` und das Firestore-Feld `breakfast` ein
- `docs/agents/plans/2026-09-23-hauptmahlzeit-kennzeichnen.md`: MZP-017, führt die
  Zeile und das Feld `mainMeal` ein
- `docs/notes.txt:147-159`: die Regeln für die Zufallsauswahl, darunter der Snack
