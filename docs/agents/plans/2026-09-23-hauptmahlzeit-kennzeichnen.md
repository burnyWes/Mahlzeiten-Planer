---
date: 2026-09-23T13:45:46+00:00
git_commit: 0b3fd34a5100a9e33aec9742991f66f18e22b08e
branch: main
story: MZP-017
topic: "Hauptmahlzeit kennzeichnen"
tags: [plan, meals, mealForm, css]
status: ready
---

# PLAN: MZP-017 — Hauptmahlzeit kennzeichnen

Ein Gericht soll sagen können, ob es eine Hauptmahlzeit ist. Die Bearbeiten-Seite
bekommt dafür ganz unten eine Checkbox `Hauptmahlzeit`, standardmäßig gesetzt, in der
Optik des Umschalters `Farben invertieren` aus den Einstellungen. Das Feld wirkt in
dieser Story noch nirgends — es ist die Grundlage für eine spätere Zufallsregel im
Wochenplan.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-23.

## Akzeptanzkriterien

- Die Bearbeiten-Seite zeigt unter dem Rezept-Feld und über der Fehlerzeile eine Zeile
  `Hauptmahlzeit` mit einem Kasten am rechten Rand. Die Optik ist die des Umschalters
  `Farben invertieren`: 40×40, Rahmen links und unten 3 px in `--ink`, großer Haken in
  `--checkMark`, die ganze Zeile ist Klickfläche, `min-height` 44 px. **Ohne**
  Trennlinie und ohne das vertikale Padding der Listenzeile — beides kommt in den
  Einstellungen aus `.itemList li` (`index.css:182-185`) und hat im Formular, wo kein
  zweiter Eintrag folgt, nichts zu trennen.
- VoiceOver liest die Zeile als `Hauptmahlzeit, Kontrollkästchen, aktiviert`
  beziehungsweise `deaktiviert` — kein Schalter und keine Ansage beim Umschalten.
- `Gericht anlegen` zeigt den Haken gesetzt; ein neu angelegtes Gericht ist
  Hauptmahlzeit.
- `Gericht bearbeiten` zeigt den gespeicherten Zustand. Der Druck auf `Speichern`
  schreibt ihn, `Zurück zum Gericht` verwirft ihn.
- Ein bestehendes Gericht, dessen Firestore-Dokument das Feld noch nicht hat, gilt als
  Hauptmahlzeit. Es gibt keine Migration von Hand.
- Ausblenden und Hauptmahlzeit sind unabhängig: ein ausgeblendetes Gericht bearbeiten
  und speichern lässt beide Zustände stehen.
- Der Zustand überlebt ein Neuladen und erscheint auf dem zweiten Gerät.
- Zufallsauswahl, Gerichteliste, Gericht-Seite, Wochenplan und Vorräte verhalten sich
  unverändert — auch für ein Gericht, das keine Hauptmahlzeit ist.
- Die Haken der Einkaufsliste und der Einstellungen sehen aus wie vorher, in beiden
  Farbstellungen.

## Wesentliche Entscheidungen und Abwägungen

1. **Eigenes Feld `mainMeal: boolean` am Gericht**, unabhängig von den noch offenen
   Kategorien.
   - Warum: die spätere Zufallsregel fragt genau ein Ja/Nein. `- Kategorien in
     Gerichten` und `- Kategorie-Verwaltung in Einstellungen als dritte Option` stehen
     in `docs/notes.txt` als eigenes, größeres Thema und würden hier Modell, Oberfläche
     und Migration aufblähen.
   - Auswirkung: `mainMeal` wird **Pflichtfeld** von `NewMeal`, wie `hidden` seit
     MZP-016. Vierzehn Test-Fabriken und Literale sowie fünf vollständige
     Erwartungsobjekte ziehen nach. Die Fabriken und Literale findet der Compiler,
     die Erwartungsobjekte nicht — `toEqual` ist in Vitest nicht typgebunden, sie
     fallen erst im Testlauf auf.

2. **Der Wert lebt im `MealDraft`**, nicht als vierter Parameter von `createMeal`.
   - Warum: `MealDraft` ist der Zustand des Formulars, und `mainMeal` wird im Formular
     bearbeitet — anders als `hidden`, das am Formular vorbeigereicht wird, weil es auf
     der Gericht-Seite umgeschaltet wird. Ein vierter Parameter stünde als zweiter
     Boolean direkt neben `hidden` und wäre an jeder Aufrufstelle vertauschbar, ohne
     dass der Compiler etwas merkt.
   - Auswirkung: `createMeal(draft, items, hidden)` bleibt dreistellig. `draftOf()`
     muss `mainMeal` führen, sonst übersetzt es nicht — genau der Fehler, der sonst
     still bei jedem Speichern den Zustand zurücksetzen würde (dieselbe Überlegung wie
     Entscheidung 5 in MZP-016).

3. **Echte Checkbox, kein `role="switch"`** — optisch identisch zu den Einstellungen.
   - Warum: der Wert gilt erst mit `Speichern`. Ein Schalter verspricht sofortige
     Wirkung; `Farben invertieren` löst sie auch aus, diese Checkbox nicht.
   - Auswirkung: kein `onToggle` nach außen, keine Ansage, kein neuer Eintrag in
     `announcements.ts`. Nur Formularzustand. Die Zeile bricht bewusst mit dem
     `<p className="field">` plus `htmlFor`/`id` der übrigen Felder und übernimmt das
     umschließende `<label>` aus `SettingsPage.tsx:40-48`: so ist die ganze Zeile
     Klickfläche, und die Optik kommt ohne eine zweite Auszeichnung aus.

4. **Ein fehlendes Feld in Firestore heißt Hauptmahlzeit:** `mainMeal: stored.mainMeal
   !== false`.
   - Warum: der Standard ist `true`, und **jedes** heute gespeicherte Gericht hat das
     Feld nicht. Die Prüfung ist spiegelbildlich zu `hidden: stored.hidden === true`
     (`firestoreMealsClient.ts:42`) und muss deshalb bewusst anders herum stehen.
   - Auswirkung: `firestoreMealsClient` hat keinen Unit-Test, die Regel wäre sonst
     nirgends abgesichert. Ein e2e-Test legt darum ein Dokument ohne das Feld ab und
     erwartet den gesetzten Haken.

5. **Die vorhandenen CSS-Regeln bekommen `.toggleField` als zweiten Selektor**, statt
   einer neuen Klasse an allen Kästen.
   - Warum: die Kastenoptik hängt an `.itemList input[type='checkbox']`
     (`index.css:223-251`) und trägt auch die Haken der Einkaufsliste. Rein optische
     Regressionen fängt kein Test ab; die Einkaufsliste ist der meistbenutzte Teil der
     App.
   - Auswirkung: zwei Selektorlisten werden länger, eine Regel `.toggleField` kommt
     dazu. `ShoppingItemRow.tsx` und `SettingsPage.tsx` bleiben unverändert.

6. **Die Zufallsregel bleibt draußen:** `randomPlanning.ts` und `PLANNING_RULES` werden
   nicht angefasst.
   - Warum: ausdrücklich auf später gelegt. Eine Regel ohne gepflegte Daten würde die
     Zufallsauswahl sofort einschränken, obwohl noch kein Gericht bewusst abgewählt
     ist.
   - Auswirkung: ein neuer Punkt unter TODO in `docs/notes.txt` hält sie offen.

7. **Das Feld bleibt außerhalb des Formulars unsichtbar:** weder Gerichteliste noch
   Gericht-Seite nennen es.
   - Warum: solange keine Regel darauf zugreift, hat der Zustand keine spürbare
     Wirkung. Ein Zusatz im `aria-label` der Zeile — wie `, ausgeblendet` aus MZP-016 —
     verlängerte jedes Durchhören der Liste ohne Gegenwert.
   - Auswirkung: `MealListRow.tsx`, `MealPage.tsx` und `announcements.ts` bleiben
     unverändert.

## Ausgangslage

Das Gericht kennt fünf Felder (`meal.ts:15-25`), der Formularzustand drei
(`meal.ts:27-31`):

```
NewMeal   { name, items[], ingredientNotes, recipe, hidden }
Meal      = NewMeal + { id }
MealDraft { name, ingredientNotes, recipe }
```

`hidden` ist seit MZP-016 dabei, wird aber **nicht** im Formular bearbeitet, sondern auf
der Gericht-Seite umgeschaltet. Es läuft deshalb am `MealDraft` vorbei
(`MealFormPage.tsx:60`):

```
saveMeal()
  onSave(createMeal(draft, items, editedMeal?.hidden ?? false))
                    ^^^^^         ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                    Formular      am Formular vorbei
```

Die Bearbeiten-Seite heute (`MealFormPage.tsx:70-124`):

```
+------------------------------------------+
| [Zurück zum Gericht]                     |
| Gericht bearbeiten            <h1>       |
|                                          |
| Name                                     |
| [__________________________]             |
|                                          |
| Einkaufs-Items ... (MealItemsEditor)     |
|                                          |
| Zutaten                                  |
| [ textarea rows=3 ]                      |
|                                          |
| Rezept                                   |
| [ textarea rows=8 ]                      |
|                                          |
| <p id="mealFailure" class="failure">     |   leer, bis etwas schiefgeht
+------------------------------------------+
| [ Speichern ]                   BottomBar
+------------------------------------------+
```

Der Umschalter, der als Vorbild dient (`SettingsPage.tsx:40-48`):

```
<li class="mealRow">                    +-----------------------------------+
  <label class="settingsToggle">        | Farben invertieren        [ ✓ ]   |
    <span>Farben invertieren</span>     +-----------------------------------+
    <input type=checkbox role=switch>     Label links, Kasten rechts,
  </label>                                ganze Zeile ist Klickfläche
</li>
```

Sein Aussehen kommt aus drei Regeln, die alle auf `.itemList` geschnitten sind
(`index.css:211-251`):

```
.itemList label                      display:flex, align-items:center,
                                     gap:.75rem, min-height:44px
.settingsToggle                      flex:1, justify-content:space-between
.itemList input[type='checkbox']     appearance:none, 40x40,
                                     border-left/bottom 3px var(--ink)
  :checked::before                   15x29 gedreht, 5px var(--checkMark)
```

Dieselbe Kastenregel trägt die Haken der Einkaufsliste (`ShoppingItemRow.tsx`). Im
Formular greift sie nicht — dort gibt es keine `.itemList`.

Der Schreibweg, das Dokument wird immer ganz ersetzt:

```
MealFormPage.tsx:58-68   saveMeal -> onSave(createMeal(...))
       |
       v
MealsArea.tsx:57-65      saveMeal -> meals.changeMeal(id, newMeal)
       |
       v
useMeals.ts:19-22        client.changeMeal(id, meal)
       |
       v
firestoreMealsClient.ts:88-90   setDoc(mealDocument(id), toDocument(changed))
                                `- toDocument schreibt genau fünf Felder
```

Gelesen wird mit Standardwert für fehlende Felder (`firestoreMealsClient.ts:35-44`):

```
toMeal   name: String(stored.name ?? '')
         hidden: stored.hidden === true      <- fehlt == sichtbar
```

## Zielbild

```
NewMeal   { name, items[], ingredientNotes, recipe, hidden, mainMeal }
MealDraft { name, ingredientNotes, recipe, mainMeal }
```

Die Bearbeiten-Seite, beide Zustände:

```
Hauptmahlzeit (Standard)                  keine Hauptmahlzeit
+------------------------------------+    +------------------------------------+
| Rezept                             |    | Rezept                             |
| [ textarea rows=8 ]                |    | [ textarea rows=8 ]                |
|                                    |    |                                    |
| Hauptmahlzeit            [ ✓ ]     |    | Hauptmahlzeit            [   ]     |
|                                    |    |                                    |
| <p class="failure">                |    | <p class="failure">                |
+------------------------------------+    +------------------------------------+
| [ Speichern ]            BottomBar |    | [ Speichern ]            BottomBar |
+------------------------------------+    +------------------------------------+
  VoiceOver: "Hauptmahlzeit,               VoiceOver: "Hauptmahlzeit,
              Kontrollkästchen,                        Kontrollkästchen,
              aktiviert"                               deaktiviert"
```

Der Wert fließt künftig durch den Draft, `hidden` weiter daran vorbei:

```
editedMeal (Meal)
   |
   +-- draftOf(meal) --> MealDraft { name, ingredientNotes, recipe, mainMeal }
   |                                                                ^
   |                          change({ mainMeal }) <- Checkbox ------+
   |
   +-- editedMeal?.hidden ?? false ----------------+
                                                   |
                          createMeal(draft, items, hidden) --> NewMeal
```

Lesen und Schreiben in Firestore, die beiden Standardwerte stehen bewusst
gegeneinander:

```
toMeal      hidden:   stored.hidden === true       fehlt -> sichtbar
            mainMeal: stored.mainMeal !== false    fehlt -> Hauptmahlzeit
toDocument  hidden: meal.hidden, mainMeal: meal.mainMeal
```

Ein Bestandsgericht aus der Zeit vor dieser Story:

```
Firestore-Dokument       { name: "Bolognese", items: [], ingredientNotes: "",
                           recipe: "" }          kein hidden, kein mainMeal
       |
       v
toMeal                   { ..., hidden: false, mainMeal: true }
       |
       v
Bearbeiten-Seite         Hauptmahlzeit  [ ✓ ]
```

Die Optik wird geteilt, ohne bestehende Zeilen anzufassen:

```
.itemList input[type='checkbox'],          <- Einkaufsliste, Einstellungen
.toggleField input[type='checkbox'] {      <- neu: Formular
  ... unverändert ...
}

.toggleField {
  display:flex; align-items:center; justify-content:space-between;
  gap:.75rem; min-height:44px; margin:0 0 1rem;
}
```

Was sich **nicht** ändert: `randomPlanning.ts` würfelt weiter über alle sichtbaren
Gerichte, `MealListRow` zeigt weiter nur Name und Wagen, `MealPage` weiter vier Knöpfe,
und weder Vorräte noch Wochenplan kennen das Feld.

## Abstraktionen und Wiederverwendung

Es entsteht keine neue Abstraktion. Das Feld reiht sich an `hidden`, die Zeile an den
vorhandenen Umschalter, die CSS-Regel an die vorhandene Kastenoptik. Neu sind allein
eine CSS-Klasse und zwei e2e-Hilfsfunktionen.

- `src/meals/domain`
  - `meal.ts` — das Gericht weiß, ob es Hauptmahlzeit ist
    - `NewMeal` — Pflichtfeld `mainMeal: boolean`
    - `MealDraft` — Feld `mainMeal: boolean`
    - `createMeal` — übernimmt `draft.mainMeal`, Signatur unverändert
    - `withHiding` — trägt `mainMeal` mit
  - `meal.test.ts` — `emptyDraft` (Zeile 16), Fabrik (Zeile 18-27), Tests für
    `createMeal` und `withHiding`
  - `announcements.test.ts` — die beiden `NewMeal`-Literale (Zeile 41-47, 337-343)
  - `mealSuggestions.test.ts`, `randomPlanning.test.ts`, `supply.test.ts`,
    `weekPlan.test.ts` — Fabriken
- `src/meals/api`
  - `firestoreMealsClient.ts` — Feld lesen und schreiben
    - `toMeal` — `mainMeal: stored.mainMeal !== false`
    - `toDocument` — `mainMeal: meal.mainMeal`
- `src/meals/ui`
  - `MealFormPage.tsx` — die Checkbox, `EMPTY_DRAFT` und `draftOf` um `mainMeal`
  - `MealsArea.test.tsx` — Fabrik, zwei Erwartungsobjekte, neue Tests
  - `SuppliesArea.test.tsx`, `WeekPlanArea.test.tsx` — Fabriken
- `src`
  - `SignedInApp.test.tsx` — Fabrik
- `src/index.css`
  - `.toggleField` — neu, plus zwei erweiterte Selektorlisten
- `e2e`
  - `emulatorHousehold.ts` — `nonMainMealNamesOnServer` und `storeMealOnServer`, neu,
    nach dem Vorbild von `hiddenMealNamesOnServer` (Zeile 121-133) und
    `storeItemOnServer` (Zeile 94-110)
  - `keyboard.ts` — `switchCheckbox`, neu
  - `meals.spec.ts` — zwei Tests: der abgewählte Zustand überlebt das Neuladen, ein
    Bestandsgericht ohne das Feld ist Hauptmahlzeit
- `docs`
  - `notes.txt` — neuer TODO-Punkt für die Zufallsregel

Nicht angefasst werden `randomPlanning.ts`, `announcements.ts`, `MealPage.tsx`,
`MealListRow.tsx`, `MealsArea.tsx`, `SettingsPage.tsx`, `ShoppingItemRow.tsx`,
`useMeals.ts`, `inMemoryMealsClient.ts` (verteilt `NewMeal` per Spread) und
`firestore.rules`.

## Logging und Beobachtbarkeit

Die App hat kein Logging; beobachtbar ist sie allein über die VoiceOver-Ansagen aus
`announce`. **Es kommt keine Ansage hinzu** — die Checkbox meldet sich über ihren
eigenen Zustand, und gespeichert wird weiter mit `Bolognese gespeichert.`

Scheitert das Schreiben in Firestore, greift wie bisher `onWriteFailure`, verdrahtet in
`SignedInApp.tsx:94`, mit `Konnte nicht gespeichert werden.`

## Umsetzung

Abhängigkeiten: keine.

Das Gericht bekommt `mainMeal`, das Formular die Checkbox, der Firestore-Adapter beide
Richtungen. Die Zufallsauswahl bleibt unberührt.

**Aufgaben**:

- [x] `NewMeal` und `MealDraft` in `src/meals/domain/meal.ts` um `mainMeal: boolean`
      erweitern und `createMeal` den Wert aus dem Draft übernehmen lassen. Erst die
      Tests in `meal.test.ts`: `createMeal` mit `mainMeal: true` im Draft liefert eine
      Hauptmahlzeit, mit `false` keine.
      ```ts
      export type MealDraft = {
        name: string
        ingredientNotes: string
        recipe: string
        mainMeal: boolean
      }

      export function createMeal(
        draft: MealDraft,
        items: readonly MealItem[],
        hidden: boolean,
      ): NewMeal {
        return {
          name: readName(draft.name),
          items,
          ingredientNotes: readText(draft.ingredientNotes),
          recipe: readText(draft.recipe),
          hidden,
          mainMeal: draft.mainMeal,
        }
      }
      ```
      Der Draft bekommt **keinen** Standardwert: `mainMeal` ist Pflichtfeld, damit
      `draftOf` und `EMPTY_DRAFT` es führen müssen.
- [x] `withHiding` in `meal.ts` um `mainMeal: meal.mainMeal` ergänzen. Erst der Test in
      `meal.test.ts:148-181`: Umschalten der Sichtbarkeit lässt `mainMeal` unverändert,
      in beiden Zuständen.
- [x] Die Test-Fabriken und Literale um `mainMeal: true` ergänzen: `meal.test.ts:16`
      (`emptyDraft`) und `meal.test.ts:18-27`, `mealSuggestions.test.ts:6`,
      `randomPlanning.test.ts:19-28`, `supply.test.ts:22`, `weekPlan.test.ts:20`,
      `announcements.test.ts:41-47` und `:337-343`, `MealsArea.test.tsx:11-21`,
      `SuppliesArea.test.tsx:16`, `WeekPlanArea.test.tsx:26`, `SignedInApp.test.tsx:74`.
      Die Fabriken nehmen `parts` entgegen, deshalb genügt das Feld im Rumpf. Dazu die
      zwei Literale, die an keiner Fabrik hängen: der Draft in `meal.test.ts:70-74` und
      das `Meal` `bolognese` im `withHiding`-Block, `meal.test.ts:149-156`.
- [x] `firestoreMealsClient.ts` Feld lesen und schreiben lassen: in `toMeal`
      `mainMeal: stored.mainMeal !== false` (Zeile 42 ff.), in `toDocument`
      `mainMeal: meal.mainMeal` (Zeile 55 ff.). Die Ungleichheit ist Absicht und steht
      bewusst anders herum als `hidden === true`.
- [x] `.toggleField` in `src/index.css` ergänzen und die beiden vorhandenen
      Selektorlisten erweitern (Zeile 223 und 240). Die Kastenregeln selbst bleiben
      Zeichen für Zeichen, wie sie sind — besonders `min-height: 40px` (Zeile 230),
      das die globale Regel `button, input, textarea { min-height: 44px }`
      (Zeile 92-97) überschreibt und den Kasten quadratisch hält.
      ```css
      .toggleField {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        min-height: 44px;
        margin: 0 0 1rem;
      }

      .itemList input[type='checkbox'],
      .toggleField input[type='checkbox'] {
        /* unverändert */
      }

      .itemList input[type='checkbox']:checked::before,
      .toggleField input[type='checkbox']:checked::before {
        /* unverändert */
      }
      ```
- [x] `MealFormPage.tsx` die Checkbox geben: `EMPTY_DRAFT` (Zeile 23) und `draftOf`
      (Zeile 25-33) um `mainMeal` ergänzen, die Zeile zwischen das Rezept-Feld
      (Zeile 105-113) und die Fehlerzeile (Zeile 114-116) setzen. Das `<label>` umfasst
      den Kasten, damit die ganze Zeile trifft — wie in `SettingsPage.tsx:40-48`. Kein
      `role="switch"`.
      ```tsx
      const EMPTY_DRAFT: MealDraft = {
        name: '',
        ingredientNotes: '',
        recipe: '',
        mainMeal: true,
      }

      <label className="toggleField">
        <span>Hauptmahlzeit</span>
        <input
          type="checkbox"
          checked={draft.mainMeal}
          onChange={(event) => change({ mainMeal: event.target.checked })}
        />
      </label>
      ```
      `change` nimmt `Partial<MealDraft>` und trägt den Boolean ohne Änderung
      (Zeile 54-56).
- [x] Die zwei vollständigen Erwartungsobjekte in `MealsArea.test.tsx` um
      `mainMeal: true` ergänzen (Zeile 189-197 und 380-388) sowie die in
      `meal.test.ts:78-84`, `:138-144` und `:159-165`.
- [x] Tests in `MealsArea.test.tsx` ergänzen. Die Checkbox wird über eine eigene Hilfe
      angesprochen, neben `editMeal` (Zeile 118-120) und im selben Stil — die Hilfe gibt
      das Versprechen zurück, statt selbst `async` zu sein:
      ```tsx
      function mainMealBox() {
        return screen.getByRole('checkbox', { name: 'Hauptmahlzeit' })
      }

      function switchMainMeal() {
        return userEvent.click(mainMealBox())
      }
      ```
      Über die Rolle statt über `getByLabelText`, weil damit zugleich geprüft ist, dass
      die Zeile eine Checkbox ist und keinen `switch` ergibt.
      - `marks a new meal as a main meal` — Formular öffnen, Namen eintragen,
        speichern; der Haken war gesetzt, `client.storedMeals()` steht auf
        `mainMeal: true`.
      - `keeps a meal that is no main meal` — Formular öffnen, Namen eintragen, die
        Checkbox `Hauptmahlzeit` drücken, speichern; `storedMeals()` steht auf
        `mainMeal: false`.
      - `shows whether the edited meal is a main meal` — ein Gericht mit
        `mainMeal: false` öffnen und bearbeiten; die Checkbox ist nicht gesetzt. Ein
        Gericht mit `mainMeal: true` zeigt sie gesetzt.
      - `takes a meal back into the main meals` — Gericht mit `mainMeal: false`
        bearbeiten, Checkbox drücken, speichern; `storedMeals()` steht auf `true`.
      - `keeps a meal hidden when its main meal state changes` — ein ausgeblendetes
        Gericht bearbeiten, die Checkbox umschalten, speichern; `hidden` bleibt `true`
        und `mainMeal` kippt. Sichert Entscheidung 2 ab.
      - `forgets the main meal state that was not saved` — Gericht bearbeiten,
        Checkbox drücken, `Zurück zum Gericht`, erneut bearbeiten; die Checkbox steht
        wieder auf dem gespeicherten Wert.
      - `opens a known meal for editing with everything filled in` (Zeile 347) um die
        Checkbox erweitern.
      - `has no accessibility violations on the form` (Zeile 612) deckt die neue Zeile
        mit ab; zusätzlich einen Lauf mit `mainMeal: false` im bearbeiteten Gericht.
- [x] `switchCheckbox` in `e2e/keyboard.ts` ergänzen, nach dem Vorbild von `typeInto`:
      ```ts
      export async function switchCheckbox(page: Page, label: string) {
        await page.getByLabel(label, { exact: true }).focus()
        await page.keyboard.press('Space')
      }
      ```
- [x] `nonMainMealNamesOnServer` und `storeMealOnServer` in `e2e/emulatorHousehold.ts`
      ergänzen. `ListedMeals` (Zeile 112-119) bekommt das Feld dazu. Die Lesefunktion
      nennt die Gerichte, die **ausdrücklich keine** Hauptmahlzeit sind — genau wie
      `hiddenMealNamesOnServer` den seltenen Zustand nennt. Nur so wartet
      `expect.poll` wirklich: eine Funktion, die die Hauptmahlzeiten nennt, lieferte
      schon `[]`, solange das Dokument noch gar nicht auf dem Server ist.
      ```ts
      type ListedMeals = {
        documents?: readonly {
          fields: {
            name: { stringValue: string }
            hidden?: { booleanValue?: boolean }
            mainMeal?: { booleanValue?: boolean }
          }
        }[]
      }

      export async function nonMainMealNamesOnServer(): Promise<readonly string[]> {
        // GET .../documents/meals wie in hiddenMealNamesOnServer
        return (listed.documents ?? [])
          .filter((document) => document.fields.mainMeal?.booleanValue === false)
          .map((document) => document.fields.name.stringValue)
      }

      export async function storeMealOnServer(name: string): Promise<void> {
        // POST .../documents/meals wie in storeItemOnServer,
        // bewusst OHNE hidden, OHNE mainMeal und OHNE items
        await callEmulator(url, 'POST', {
          fields: {
            name: { stringValue: name },
            ingredientNotes: { stringValue: '' },
            recipe: { stringValue: '' },
          },
        })
      }
      ```
      `callEmulator` (Zeile 20-32) ist nicht exportiert, liegt aber in derselben Datei.
      `items` fehlt im geschriebenen Dokument mit Absicht: `toMealItems` prüft
      `Array.isArray(stored.items)` (`firestoreMealsClient.ts:31-33`), damit deckt der
      Test denselben Weg ab, den ein echtes Altdokument nimmt.
- [x] `e2e/meals.spec.ts` um einen Test `keeps a meal out of the main meals after a
      reload` ergänzen: Gericht `Bolognese` anlegen, `Bearbeiten`,
      `switchCheckbox(page, 'Hauptmahlzeit')`, `Speichern`, dann
      `await expect.poll(nonMainMealNamesOnServer).toEqual(['Bolognese'])`,
      `page.reload()`,
      `Gerichte`, `Bolognese`, `Bearbeiten` — die Checkbox ist nicht gesetzt
      (`toBeChecked({ checked: false })`). **Das Warten auf den Server ist Pflicht**,
      nicht Vorsicht: ausstehende Schreibvorgänge überleben kein Neuladen (offener
      Punkt zu `persistentLocalCache` in `docs/notes.txt`), und `keeps a meal hidden
      after a reload` (`e2e/meals.spec.ts:47-69`) macht es deshalb genauso.
- [x] `e2e/meals.spec.ts` um einen Test `treats a stored meal without the field as a
      main meal` ergänzen: `storeMealOnServer('Erbsensuppe')` **vor** dem Anmelden,
      dann anmelden, `Gerichte`, `Erbsensuppe`, `Bearbeiten` — die Checkbox ist
      gesetzt. Sichert Entscheidung 4 ab, die sonst nirgends geprüft wäre.
- [x] In `docs/notes.txt` unten unter TODO einen Punkt anhängen, ohne etwas anderes zu
      berühren:
      ```
      - Zufallsregeln im Wochenplan: nur Hauptmahlzeiten wuerfeln (Feld mainMeal am
        Gericht steht seit MZP-017 bereit, PLANNING_RULES ist der Platz dafuer)
      ```

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `createMeal({ ...emptyDraft, name: 'Suppe', mainMeal: true }, [], false)` liefert
      `mainMeal: true`, mit `mainMeal: false` liefert es `false`.
- [x] `withHiding(meal, true)` lässt `mainMeal` unverändert — in beiden Zuständen.
- [x] Der Test `marks a new meal as a main meal` ist grün: ein neu angelegtes Gericht
      ist ohne Zutun Hauptmahlzeit.
- [x] Der Test `keeps a meal hidden when its main meal state changes` ist grün — das
      Formular verliert `hidden` nicht, und `mainMeal` kommt nicht am Draft vorbei.
- [x] Der Test `forgets the main meal state that was not saved` ist grün: ohne
      `Speichern` wird nichts geschrieben.
- [x] Die Zugänglichkeitsprüfungen auf dem Formular sind in beiden Zuständen grün, und
      die Checkbox ist über `getByRole('checkbox', { name: 'Hauptmahlzeit' })`
      erreichbar — sie hat also einen zugänglichen Namen und ist kein `switch`.
- [x] `WeekPlanArea.test.tsx`, `SuppliesArea.test.tsx` und `SignedInApp.test.tsx`
      bleiben inhaltlich unverändert grün — nur ihre Fabriken haben ein Feld mehr.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `npm run test:e2e` läuft durch, einschließlich `keeps a meal out of the main
      meals after a reload` und `treats a stored meal without the field as a main
      meal`.

**Manuelle Verifikation**:

- [ ] Auf dem Gerät mit VoiceOver: ein Gericht bearbeiten, bis ans Ende des Formulars
      wischen und `Hauptmahlzeit, Kontrollkästchen, aktiviert` hören. Umschalten,
      `Speichern`, erneut bearbeiten — der Zustand steht.
- [ ] Die Zeile ist mit dem Finger auf ihrer ganzen Breite zu treffen, nicht nur auf
      dem Kasten.
- [ ] Der Kasten sieht aus wie der Umschalter `Farben invertieren` in den
      Einstellungen, und der Haken ist bei eingeschalteter Farbumkehr genauso gut zu
      sehen wie dort.
- [ ] Die Haken der Einkaufsliste und der Einstellungen sehen unverändert aus, in
      beiden Farbstellungen.
- [ ] Ein Gericht, das vor dieser Änderung angelegt wurde, zeigt beim Bearbeiten den
      gesetzten Haken.
- [ ] Die App auf dem zweiten Gerät öffnen und prüfen, dass der Zustand dort ebenso
      steht.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/agents/plans/2026-09-23-gericht-ausblenden.md` — MZP-016, führt `hidden` ein
  und begründet, warum das Formular den Zustand durchreichen muss.
- `docs/agents/plans/2026-09-18-farben-invertieren.md` — MZP-008, legt den Umschalter
  in den Einstellungen an, dessen Optik hier geteilt wird.
- `docs/agents/plans/2026-09-18-groessere-check-haken.md` — MZP-006, legt die
  Kastenoptik unter `.itemList` fest.
- `docs/agents/plans/2026-09-19-wochenplan-mit-zufallsauswahl.md` — MZP-009, führt
  `randomPlanning` und `PLANNING_RULES` ein, wo die spätere Regel andockt.
- `docs/notes.txt` — der neue Punkt zur Zufallsregel sowie die offenen Punkte
  `- Kategorien in Gerichten` und `- Kategorie-Verwaltung in Einstellungen als dritte
  Option`.
