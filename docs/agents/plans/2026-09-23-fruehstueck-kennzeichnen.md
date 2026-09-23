---
date: 2026-09-23T15:02:48+00:00
git_commit: 3d3e862b9da8b8ded47d460dbb54d12681e10bd3
branch: main
story: MZP-019
topic: "Frühstück kennzeichnen"
tags: [plan, meals, mealForm, domain, firestore]
status: ready
---

# PLAN: MZP-019 — Frühstück kennzeichnen

Ein Gericht soll sagen können, ob es ein Frühstück ist. Die Bearbeiten-Seite bekommt
dafür unter `Hauptgericht` eine zweite Checkbox `Frühstück`, standardmäßig leer, in
derselben Optik. Die beiden schließen sich aus: wer eines anhakt, hakt das andere ab.
Beide leer ist erlaubt.

Zugleich heißt die vorhandene Zeile künftig `Hauptgericht` statt `Hauptmahlzeit`.

Damit dieser Ausschluss nicht als Regel irgendwo mitlaufen muss, löst ein Feld
`kind: MealKind` das seit MZP-017 bestehende `mainMeal: boolean` ab. Der ungültige
Zustand „beides zugleich" ist danach nicht mehr darstellbar.

Das Feld wirkt — wie `mainMeal` bisher — noch nirgends. Es ist Grundlage für die
späteren Zufallsregeln im Wochenplan (`docs/notes.txt:118-119`).

Alle Entscheidungen stammen aus der Befragung vom 2026-09-23. Der Punkt
`- Checkbox für Frühstück` (`docs/notes.txt:120`) ist die Vorlage.

## Akzeptanzkriterien

- Die Bearbeiten-Seite zeigt unter der Zeile `Hauptgericht` und über der Fehlerzeile
  eine zweite Zeile `Frühstück`, in derselben Optik: `.toggleField`, 40×40-Kasten am
  rechten Rand, die ganze Zeile ist Klickfläche, `min-height` 44 px.
- VoiceOver liest sie als `Frühstück, Kontrollkästchen, aktiviert` beziehungsweise
  `deaktiviert` — kein Schalter.
- `Gericht anlegen` zeigt `Hauptgericht` gesetzt und `Frühstück` leer. Ein neu
  angelegtes Gericht ist Hauptgericht.
- Ein Haken auf `Frühstück` nimmt den Haken von `Hauptgericht` und umgekehrt.
  Unmittelbar danach kommt die Ansage `Hauptgericht abgewählt.` beziehungsweise
  `Frühstück abgewählt.`
- Einen gesetzten Haken wegzunehmen lässt beide Zeilen leer und sagt **nichts** an —
  VoiceOver meldet das `deaktiviert` schon selbst.
- Beide Haken sind nie gleichzeitig gesetzt. Auch nicht durch Daten aus Firestore, weil
  die Domäne nur **einen** Wert kennt.
- `Gericht bearbeiten` zeigt den gespeicherten Zustand. `Speichern` schreibt ihn,
  `Zurück zum Gericht` verwirft ihn. Er überlebt ein Neuladen und erscheint auf dem
  zweiten Gerät.
- Ein Firestore-Dokument ohne die Felder gilt weiter als Hauptgericht. Ein Dokument mit
  `mainMeal: false` aus der Zeit vor dieser Story zeigt beide Zeilen leer.
- Ausblenden ist unabhängig: ein ausgeblendetes Gericht bearbeiten und speichern lässt
  beide Zustände stehen.
- Zufallsauswahl, Gerichteliste, Gericht-Seite, Wochenplan und Vorräte verhalten sich
  unverändert — auch für ein Gericht, das Frühstück ist.
- Die erste Zeile heißt `Hauptgericht`. Das Wort `Hauptmahlzeit` steht danach nirgends
  mehr in `src` und `e2e` — weder als Beschriftung noch in einer Ansage noch in einer
  Tasthilfe der Tests. Aussehen und Verhalten der Zeile sind unverändert, ebenso die
  Haken der Einkaufsliste und der Einstellungen.

## Wesentliche Entscheidungen und Abwägungen

1. **Ein Feld `kind: MealKind` statt zweier Booleans.** `'mainMeal' | 'breakfast' |
   'none'` löst `mainMeal: boolean` ab.
   - Warum: „höchstens eins von beiden" ist dann der Typ selbst und keine Regel, die
     man an einer Stelle vergessen kann. Der Architektur-Skill verlangt Invarianten in
     der Domäne, und ein Aggregat darf nie in einem ungültigen Zustand existieren. Zwei
     Booleans ließen `{ mainMeal: true, breakfast: true }` zu — auch beim Lesen aus
     Firestore.
   - Auswirkung: zwölf Test-Fabriken und fünf vollständige Erwartungsobjekte ziehen
     nach. Die Fabriken findet der Compiler, die Erwartungsobjekte nicht — `toEqual`
     ist in Vitest nicht typgebunden, sie fallen erst im Testlauf auf (dieselbe Falle
     wie in MZP-017).

2. **Firestore behält zwei Boolean-Felder**, der Adapter übersetzt in beide Richtungen.
   - Warum: kein Migrationslauf von Hand, Altdokumente bleiben lesbar, und ein Gerät,
     auf dem die PWA noch nicht aktualisiert ist, liest weiter `mainMeal` und schreibt
     es auch. Ein Feld `kind: "breakfast"` wäre für die alte App unsichtbar und würde
     beim nächsten Speichern dort still zu „Hauptmahlzeit".
   - Auswirkung: die Leseregel bekommt eine Reihenfolge — `breakfast` vor `mainMeal`.
     `firestoreMealsClient` hat keinen Unit-Test, die Reihenfolge und die Standardwerte
     sichern deshalb e2e-Tests gegen den Emulator ab. Bewusst in Kauf genommen: das
     Dokument wird bei jedem `setDoc` ganz ersetzt (`firestoreMealsClient.ts:91`).
     Speichert jemand ein Gericht auf einem Gerät, dessen PWA noch nicht aktualisiert
     ist, fällt `breakfast` aus dem Dokument und das Frühstück wird zu `'none'` — ein
     sichtbarer Verlust statt eines stillen Umsprungs auf „Hauptmahlzeit", und er
     verschwindet, sobald beide Geräte die neue Fassung haben.

3. **Zwei Checkboxen, keine Radiogruppe.**
   - Warum: „beide aus" ist ein natürlicher Zustand; eine Radiogruppe bräuchte eine
     dritte Zeile mit einem Namen, den es fachlich nicht gibt (`keine Angabe`). Die
     Checkbox-Optik ist seit MZP-017 auf dem Gerät erprobt, Klickfläche und Ansage
     eingeschlossen.
   - Auswirkung: **keine** CSS-Änderung — `.toggleField` (`index.css:223-262`) trägt
     die zweite Zeile unverändert. Dafür braucht das automatische Abwählen eine Ansage
     (Entscheidung 4).

4. **Ansage nur, wenn wirklich etwas umkippt.**
   - Warum: VoiceOver sagt nur den Kasten unter dem Finger an. Der zweite ändert sich
     außerhalb des Fokus und bliebe sonst still — genau der Fall, für den `announce` da
     ist. MZP-017 kam ohne Ansage aus, weil dort nur der eigene Kasten kippte.
   - Auswirkung: ein neuer Eintrag in `announcements.ts`, in der Domäne test-getrieben.
     `Announcer` ist `role="status"` (`Announcer.tsx:1-7`), also höflich: die Ansage
     kommt hinter VoiceOvers eigenem `aktiviert` und schneidet es nicht ab.

5. **Die Ausschlussregel lebt in der Domäne**, als `withChosenKind`.
   - Warum: sie ist eine Fachregel und wird nach `CLAUDE.md` test-getrieben entwickelt.
     Im Formular wäre sie nur über Komponententests erreichbar.
   - Auswirkung: `MealFormPage` bekommt keine einzige Bedingung, nur einen Aufruf. Die
     Funktion ist schon für **eine** Checkbox sinnvoll (Haken weg → `'none'`) und
     entsteht deshalb in Phase 1.

6. **Die Zeilenbeschriftungen bleiben Literale im JSX.**
   - Warum: so steht es seit MZP-017 dort und so stehen alle anderen Beschriftungen des
     Formulars. Die Ansage in `announcements.ts` führt die Namen ein zweites Mal.
   - Auswirkung: zwei Stellen mit demselben Wort. Auseinanderlaufen fangen die Tests
     ab: sie greifen die Checkbox über ihren zugänglichen Namen und prüfen den
     Ansagetext.

7. **Die Beschriftung wird auf `Hauptgericht` umbenannt, die Bezeichner bleiben
   `mainMeal`.**
   - Warum: `Hauptgericht` ist das Wort des Haushalts. Der englische Bezeichner bildet
     dagegen die Achse ab, auf der die Werte liegen — Mahlzeiten des Tages, nicht Gänge
     eines Menüs: `'mainMeal'` neben `'breakfast'` ist das stimmige Paar, `'mainCourse'`
     neben `'breakfast'` wäre keines. Dazu muss das Firestore-Feld ohnehin `mainMeal`
     heißen (Entscheidung 2).
   - Auswirkung: fünf Stellen im Code tragen das deutsche Wort — `MealFormPage.tsx:121`,
     `MealsArea.test.tsx:125` und `e2e/meals.spec.ts:83`, `:94`, `:111`. Sie ändern sich
     alle in Phase 2, zusammen mit der Ansage. Phase 1 bleibt damit für den Nutzer
     unsichtbar, und die beiden vorhandenen e2e-Tests laufen dort unverändert durch.

8. **Das Feld bleibt außerhalb des Formulars unsichtbar.** Weder Gerichteliste noch
   Gericht-Seite nennen es, die Zufallsauswahl kennt es nicht.
   - Warum: unverändert die Begründung aus MZP-017 — solange keine Regel darauf
     zugreift, verlängerte ein Zusatz im `aria-label` jedes Durchhören der Liste ohne
     Gegenwert.
   - Auswirkung: `randomPlanning.ts`, `MealListRow.tsx`, `MealPage.tsx`, `MealsArea.tsx`
     und `useMeals.ts` bleiben unberührt.

## Ausgangslage

Das Gericht führt seit MZP-017 genau ein Ja/Nein für die Art der Mahlzeit
(`meal.ts:15-33`):

```
NewMeal   { name, items[], ingredientNotes, recipe, hidden, mainMeal }
Meal      = NewMeal + { id }
MealDraft { name, ingredientNotes, recipe, mainMeal }   <- Formularzustand
```

Der Wert fließt durch den Draft, `hidden` läuft daran vorbei (`draftOf` Zeile 30-38,
`change` Zeile 60-62, der Aufruf in `saveMeal` Zeile 66):

```
editedMeal --> draftOf() --> MealDraft --+
                   ^                      |
   change({ mainMeal }) <- Checkbox ------+
                                          v
                        createMeal(draft, items, hidden) --> NewMeal
```

Das untere Ende der Bearbeiten-Seite heute (`MealFormPage.tsx:111-130`):

```
+------------------------------------------+
| Rezept                                   |
| [ textarea rows=8 ]                      |
|                                          |
| Hauptmahlzeit                   [ ✓ ]    |  <label class="toggleField">
|                                          |  echte Checkbox, kein switch
| <p id="mealFailure" class="failure">     |  Standard beim Anlegen: gesetzt
+------------------------------------------+
| [ Speichern ]                  BottomBar |
+------------------------------------------+
```

Persistenz (`firestoreMealsClient.ts:35-59`). Die beiden Standardwerte stehen bewusst
gegeneinander, und das Dokument wird bei jedem Schreiben ganz ersetzt:

```
toMeal      hidden:   stored.hidden === true      fehlt -> sichtbar
            mainMeal: stored.mainMeal !== false   fehlt -> Hauptmahlzeit
toDocument  name, items[], ingredientNotes, recipe, hidden, mainMeal
```

Was schon da ist und wiederverwendet wird:

```
index.css:223-262        .toggleField + geteilte Kastenoptik   -> unveraendert nutzbar
MealsArea.test.tsx:124-130  mainMealBox(), switchMainMeal()    -> Vorbild fuer Fruehstueck
e2e/keyboard.ts:9-12     switchCheckbox(page, label)           -> unveraendert nutzbar
e2e/emulatorHousehold.ts:112-120  ListedMeals                  -> ein Feld mehr
e2e/emulatorHousehold.ts:136-148  nonMainMealNamesOnServer     -> Vorbild
e2e/emulatorHousehold.ts:150-162  storeMealOnServer(name)      -> ein Parameter mehr
e2e/meals.spec.ts:74-113 zwei Tests zu mainMeal                -> bleiben gueltig
```

`mainMeal` steht heute in 54 Zeilen in `src`, `test` und `e2e` — davon 42 in Tests.

## Zielbild

```
MealKind        = 'mainMeal' | 'breakfast' | 'none'
ChosenMealKind  = 'mainMeal' | 'breakfast'

NewMeal   { name, items[], ingredientNotes, recipe, hidden, kind }
MealDraft { name, ingredientNotes, recipe, kind }
```

Die Bearbeiten-Seite, alle drei Zustände:

```
Hauptgericht (Standard)      Frühstück                    keins von beiden
+---------------------------+ +---------------------------+ +---------------------------+
| Rezept                    | | Rezept                    | | Rezept                    |
| [ textarea rows=8 ]       | | [ textarea rows=8 ]       | | [ textarea rows=8 ]       |
|                           | |                           | |                           |
| Hauptgericht      [ ✓ ]   | | Hauptgericht      [   ]   | | Hauptgericht      [   ]   |
| Frühstück         [   ]   | | Frühstück         [ ✓ ]   | | Frühstück         [   ]   |
|                           | |                           | |                           |
| <p class="failure">       | | <p class="failure">       | | <p class="failure">       |
+---------------------------+ +---------------------------+ +---------------------------+
   kind === 'mainMeal'           kind === 'breakfast'          kind === 'none'
```

Der Übergang, so wie ihn die Domäne rechnet:

```
Ausgangswert   Druck auf       Kasten danach   Ergebnis
'mainMeal'     Frühstück       gesetzt         'breakfast'
'mainMeal'     Hauptgericht    leer            'none'
'breakfast'    Hauptgericht    gesetzt         'mainMeal'
'breakfast'    Frühstück       leer            'none'
'none'         Frühstück       gesetzt         'breakfast'
'none'         Hauptgericht    gesetzt         'mainMeal'

withChosenKind(previous, chosen, checked)
  checked            -> chosen
  previous === chosen -> 'none'
  sonst               -> previous          (kommt aus der Oberflaeche nie vor)
```

Angesagt wird nur die mittlere Spalte der ersten Zeile — der Fall, in dem ein **anderer**
Kasten still den Haken verliert:

```
previous    next         Ansage
'mainMeal'  'breakfast'  "Hauptgericht abgewählt."
'breakfast' 'mainMeal'   "Frühstück abgewählt."
alles mit 'none'         keine
previous === next        keine
```

Lesen und Schreiben in Firestore, drei Werte auf zwei Boolean-Felder:

```
kind          mainMeal   breakfast
'mainMeal'    true       false
'breakfast'   false      true
'none'        false      false

toMeal   stored.breakfast === true   -> 'breakfast'
         stored.mainMeal !== false   -> 'mainMeal'     <- auch: Feld fehlt ganz
         sonst                       -> 'none'
```

Drei Dokumente aus drei Zeitaltern, alle lesbar:

```
vor MZP-017   { name, ingredientNotes, recipe }                   -> 'mainMeal'
seit MZP-017  { ..., hidden: false, mainMeal: false }             -> 'none'
seit MZP-019  { ..., hidden: false, mainMeal: false,
                     breakfast: true }                            -> 'breakfast'
```

Was sich **nicht** ändert: `index.css` (kein Zeichen), `randomPlanning.ts` würfelt
weiter über alle sichtbaren Gerichte, `MealListRow` zeigt weiter Name, Wagen und den
Platz für die Glühbirne, `MealPage` weiter vier Knöpfe, Vorräte und Wochenplan kennen
das Feld nicht.

## Abstraktionen und Wiederverwendung

Es entsteht ein neuer fachlicher Typ (`MealKind`) samt zwei Funktionen darauf. Die
Zeile, ihre Optik, die Tasthilfen und die Emulator-Hilfen sind vorhanden und werden
verlängert, nicht ersetzt.

- `src/meals/domain`
  - `meal.ts` — das Gericht kennt seine Art
    - `MealKind`, `ChosenMealKind` — neu
    - `NewMeal`, `MealDraft` — `kind: MealKind` statt `mainMeal: boolean`
    - `createMeal`, `withHiding` — tragen `kind` statt `mainMeal`
    - `withChosenKind` — neu, die Ausschlussregel
  - `announcements.ts`
    - `replacedKindAnnouncement` — neu, `string | null`
  - `meal.test.ts` — `emptyDraft` (Zeile 16), Fabrik (Zeile 18-27), Tests für
    `createMeal`, `withHiding` und `withChosenKind`
  - `announcements.test.ts` — zwei `NewMeal`-Literale (Zeile 41-48, 338-345), Tests für
    die neue Ansage
  - `mealSuggestions.test.ts`, `randomPlanning.test.ts`, `supply.test.ts`,
    `weekPlan.test.ts` — Fabriken
- `src/meals/api`
  - `firestoreMealsClient.ts` — drei Werte auf zwei Felder
    - `toMeal` — Reihenfolge `breakfast` vor `mainMeal`
    - `toDocument` — `mainMeal` und `breakfast` aus `kind`
- `src/meals/ui`
  - `MealFormPage.tsx` — `EMPTY_DRAFT`, `draftOf`, `chooseKind`, Umbenennung der
    ersten Zeile, zweite Zeile
  - `MealsArea.test.tsx` — Fabrik, zwei Erwartungsobjekte, `mainMealBox()` greift
    `Hauptgericht`, `breakfastBox()`, `switchBreakfast()`, neue Tests
  - `SuppliesArea.test.tsx`, `WeekPlanArea.test.tsx` — Fabriken
- `src`
  - `SignedInApp.test.tsx` — Fabrik
- `e2e`
  - `emulatorHousehold.ts` — `ListedMeals` um `breakfast`, `breakfastMealNamesOnServer`
    neu, `storeMealOnServer` bekommt einen zweiten Parameter
  - `meals.spec.ts` — zwei Tests dazu; die zwei vorhandenen bleiben inhaltlich gleich
    und greifen die Zeile künftig als `Hauptgericht`
- `docs`
  - `notes.txt` — `- Checkbox für Frühstück` auf `x` und nach DONE, ein neuer Punkt zum
    Feldnamen

Nicht angefasst werden `index.css`, `randomPlanning.ts`, `MealPage.tsx`,
`MealListRow.tsx`, `MealsArea.tsx`, `useMeals.ts`, `mealsClient.ts`,
`inMemoryMealsClient.ts` (verteilt `NewMeal` per Spread), `SettingsPage.tsx`,
`ShoppingItemRow.tsx`, `e2e/keyboard.ts` und `firestore.rules`.

## Logging und Beobachtbarkeit

Die App hat kein Logging; beobachtbar ist sie allein über die VoiceOver-Ansagen aus
`announce`. Neu ist **eine** Ansage, und sie kommt nur beim Umkippen zwischen zwei
gesetzten Arten:

```
"Hauptgericht abgewählt."
"Frühstück abgewählt."
```

Gespeichert wird weiter mit `Bolognese gespeichert.` Scheitert das Schreiben in
Firestore, greift wie bisher `onWriteFailure` (`SignedInApp.tsx:94`) mit
`Konnte nicht gespeichert werden.`

## Umsetzung

### Phase 1: Das Gericht kennt seine Art

Abhängigkeiten: keine.

`mainMeal: boolean` wird zu `kind: MealKind`, der Firestore-Adapter übersetzt in beide
Richtungen, die vorhandene Checkbox liest und schreibt `kind`. Für den Nutzer ändert
sich **nichts**: das Formular zeigt weiter genau eine Zeile `Hauptmahlzeit`, und die
beiden vorhandenen e2e-Tests laufen unverändert durch. Sie sind damit der Beleg, dass
die Übersetzung in Firestore stimmt.

**Aufgaben**:

- [x] `MealKind` und `ChosenMealKind` in `src/meals/domain/meal.ts` einführen und
      `NewMeal` (Zeile 15-22) sowie `MealDraft` (Zeile 28-33) auf `kind` umstellen.
      `createMeal` (Zeile 70-83) und `withHiding` (Zeile 85-94) tragen `kind` statt
      `mainMeal`. Erst die Tests in `meal.test.ts`: `createMeal` mit `kind: 'mainMeal'`
      im Draft liefert `'mainMeal'`, mit `'breakfast'` liefert es `'breakfast'`, mit
      `'none'` liefert es `'none'`.
      ```ts
      export type MealKind = 'mainMeal' | 'breakfast' | 'none'
      export type ChosenMealKind = Exclude<MealKind, 'none'>

      export type MealDraft = {
        name: string
        ingredientNotes: string
        recipe: string
        kind: MealKind
      }
      ```
      Der Draft bekommt **keinen** Standardwert: `kind` ist Pflichtfeld, damit `draftOf`
      und `EMPTY_DRAFT` es führen müssen.
- [x] `withHiding` in `meal.ts` auf `kind: meal.kind` umstellen. Die vorhandenen Tests
      (`meal.test.ts:188-199`, im Block ab Zeile 166) werden mitgezogen: Umschalten der Sichtbarkeit lässt `kind`
      unverändert — geprüft mit `'mainMeal'` und mit `'breakfast'`.
- [x] `withChosenKind` in `meal.ts` ergänzen. Erst die Tests in `meal.test.ts`, alle
      sieben Übergänge aus dem Zielbild.
      ```ts
      export function withChosenKind(
        previous: MealKind,
        chosen: ChosenMealKind,
        checked: boolean,
      ): MealKind {
        if (checked) return chosen
        return previous === chosen ? 'none' : previous
      }
      ```
- [x] Die Test-Fabriken und Literale von `mainMeal: true` auf `kind: 'mainMeal'`
      umstellen: `meal.test.ts:16` (`emptyDraft`), `:26`, `:75`, `:86`, `:147`, `:174`,
      `:184` sowie die beiden `createMeal`-Aufrufe `:153` und `:160`;
      `announcements.test.ts:47` und `:344`; `mealSuggestions.test.ts:13`;
      `randomPlanning.test.ts:27`; `supply.test.ts:29`; `weekPlan.test.ts:27`;
      `MealsArea.test.tsx:19`, `:210`, `:403`; `SuppliesArea.test.tsx:23`;
      `WeekPlanArea.test.tsx:33`; `SignedInApp.test.tsx:81`. Dazu die Erwartungen
      `meal.test.ts:189-197` und `MealsArea.test.tsx:604`, `:615`, `:649`,
      `:679` auf `kind` ziehen. Und die vier Fabrik-Überschreibungen
      `{ mainMeal: false }` auf `{ kind: 'none' }`: `MealsArea.test.tsx:620`, `:641`,
      `:663` und `:740`. Die letzte gehört zum Zugänglichkeitstest und muss **hier**
      mit umgestellt werden, sonst übersetzt Phase 1 nicht.
- [x] `firestoreMealsClient.ts` auf die Übersetzung umstellen: `toMeal` (Zeile 35-45)
      liest über eine eigene Funktion, `toDocument` (Zeile 47-59) schreibt beide
      Boolean-Felder. Die Reihenfolge `breakfast` vor `mainMeal` ist Pflicht, sonst
      gewinnt ein altes `mainMeal: true` gegen ein neues `breakfast: true`. `MealKind`
      kommt zum Typimport aus `'../domain/meal'` (Zeile 11) dazu, `DocumentData` ist
      schon da (Zeile 7).
      ```ts
      function toKind(stored: DocumentData): MealKind {
        if (stored.breakfast === true) return 'breakfast'
        return stored.mainMeal !== false ? 'mainMeal' : 'none'
      }
      ```
      In `toDocument` treten an die Stelle von `mainMeal: meal.mainMeal`:
      ```ts
        mainMeal: meal.kind === 'mainMeal',
        breakfast: meal.kind === 'breakfast',
      ```
- [x] `MealFormPage.tsx` auf `kind` umstellen, ohne die Oberfläche zu verändern:
      `EMPTY_DRAFT` (Zeile 23-28) auf `kind: 'mainMeal'`, `draftOf` (Zeile 30-38) auf
      `kind: meal.kind`, die vorhandene Checkbox (Zeile 120-127) auf `withChosenKind`,
      das zum Import aus `'../domain/meal'` (Zeile 6-12) dazukommt.
      ```tsx
      <input
        type="checkbox"
        checked={draft.kind === 'mainMeal'}
        onChange={(event) =>
          change({
            kind: withChosenKind(draft.kind, 'mainMeal', event.target.checked),
          })
        }
      />
      ```
- [x] `ListedMeals` in `e2e/emulatorHousehold.ts` (Zeile 112-120) um
      `breakfast?: { booleanValue?: boolean }` ergänzen. `nonMainMealNamesOnServer`
      bleibt, wie es ist: `mainMeal === false` gilt nach der Umstellung für
      `'none'` **und** `'breakfast'`, und der Test, der sie nutzt, hakt nur
      `Hauptmahlzeit` ab.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `withChosenKind` ist für alle sieben Übergänge aus dem Zielbild grün, besonders
      `withChosenKind('mainMeal', 'breakfast', true) === 'breakfast'` und
      `withChosenKind('mainMeal', 'mainMeal', false) === 'none'`.
- [x] `createMeal` übernimmt `kind` aus dem Draft, in allen drei Werten.
- [x] `withHiding` lässt `kind` unverändert, mit `'mainMeal'` und mit `'breakfast'`.
- [x] `MealsArea.test.tsx` bleibt inhaltlich unverändert grün — die sechs Tests zur
      Hauptmahlzeit (Zeile 594-680) prüfen jetzt `kind` statt `mainMeal`, das Verhalten
      ist dasselbe.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler. `grep -rn "mainMeal:" src` findet die
      Objekteigenschaft `mainMeal` nur noch in `firestoreMealsClient.ts`. Der **Wert**
      `'mainMeal'` und die Hilfsnamen `mainMealBox`/`switchMainMeal` bleiben stehen.
- [x] `npm run test:e2e` läuft durch, einschließlich der zwei unveränderten Tests
      `keeps a meal out of the main meals after a reload` und `treats a stored meal
      without the field as a main meal`. Sie belegen beide Richtungen der Übersetzung.

### Phase 2: Die Frühstücks-Zeile

Abhängigkeiten: Phase 1.

Die zweite Checkbox, die Ansage beim Umkippen und die Absicherung gegen den Emulator.

**Aufgaben**:

- [x] `replacedKindAnnouncement` in `src/meals/domain/announcements.ts` ergänzen, bei
      den übrigen Gericht-Ansagen (nach `mealSavedAnnouncement`, Zeile 71-73). Erst die
      Tests in `announcements.test.ts`: die zwei Umkipp-Fälle liefern den Satz, alles
      mit `'none'` und `previous === next` liefert `null`.
      ```ts
      const mealKindNames: Record<ChosenMealKind, string> = {
        mainMeal: 'Hauptgericht',
        breakfast: 'Frühstück',
      }

      export function replacedKindAnnouncement(
        previous: MealKind,
        next: MealKind,
      ): string | null {
        if (previous === 'none' || next === 'none' || previous === next) return null
        return `${mealKindNames[previous]} abgewählt.`
      }
      ```
      `previous` ist an dieser Stelle nachweislich kein `'none'` mehr, der Zugriff auf
      `mealKindNames` ist also typsicher — dafür ist `ChosenMealKind` da. Beide Typen
      kommen zum Import aus `'./meal'` (Zeile 5-11) dazu; der Aufbau folgt
      `messagesByReason` (Zeile 15-19).
- [x] `chooseKind` in `MealFormPage.tsx` ergänzen, neben `change` (Zeile 60-62), und
      beide Zeilen darüber verdrahten. Die Komponente bekommt **keine** Bedingung über
      die Mahlzeitenart, sie reicht durch.
      ```tsx
      function chooseKind(chosen: ChosenMealKind, checked: boolean) {
        const kind = withChosenKind(draft.kind, chosen, checked)
        const replaced = replacedKindAnnouncement(draft.kind, kind)
        if (replaced !== null) announce(replaced)
        change({ kind })
      }
      ```
- [x] Die zweite Zeile in `MealFormPage.tsx` direkt unter die erste setzen, vor die
      Fehlerzeile (Zeile 128-130). Beide Zeilen sehen danach gleich aus:
      ```tsx
      <label className="toggleField">
        <span>Hauptgericht</span>
        <input
          type="checkbox"
          checked={draft.kind === 'mainMeal'}
          onChange={(event) => chooseKind('mainMeal', event.target.checked)}
        />
      </label>
      <label className="toggleField">
        <span>Frühstück</span>
        <input
          type="checkbox"
          checked={draft.kind === 'breakfast'}
          onChange={(event) => chooseKind('breakfast', event.target.checked)}
        />
      </label>
      ```
      Kein `role="switch"`, keine `id`/`htmlFor` — das umschließende `<label>` macht die
      ganze Zeile zur Klickfläche, wie in `SettingsPage.tsx:40-48`; von dort kommt
      allein das umschließende `<label>`, nicht das `role="switch"` in Zeile 44.
      Die Beschriftung der ersten Zeile wechselt hier von `Hauptmahlzeit` auf
      `Hauptgericht` (`MealFormPage.tsx:121`).
- [x] Die drei übrigen Stellen mit dem alten Wort nachziehen, damit die Tests die Zeile
      wiederfinden: `MealsArea.test.tsx:125` (`mainMealBox()` greift künftig
      `{ name: 'Hauptgericht' }`) sowie `e2e/meals.spec.ts:83`, `:94` und `:111`. Die
      Testnamen bleiben englisch und unverändert — es ändert sich nur die Beschriftung,
      die sie ansprechen. `mainMealBox`, `switchMainMeal` und
      `nonMainMealNamesOnServer` behalten ihre Namen, weil das Feld weiter `mainMeal`
      heißt.
- [x] `breakfastBox()` und `switchBreakfast()` in `MealsArea.test.tsx` ergänzen, neben
      `mainMealBox()`/`switchMainMeal()` (Zeile 124-130) und im selben Stil — über die
      Rolle, damit zugleich geprüft ist, dass es eine Checkbox ist und kein `switch`.
      ```tsx
      function breakfastBox() {
        return screen.getByRole('checkbox', { name: 'Frühstück' })
      }

      function switchBreakfast() {
        return userEvent.click(breakfastBox())
      }
      ```
- [x] Tests in `MealsArea.test.tsx` ergänzen, hinter den Hauptgericht-Block
      (Zeile 594-680):
      - `leaves a new meal out of the breakfasts` — Formular öffnen; `Frühstück` ist
        leer, `Hauptgericht` gesetzt. Nach dem Speichern steht `kind` auf
        `'mainMeal'`.
      - `marks a meal as breakfast` — Namen eintragen, `Frühstück` drücken, speichern;
        `client.storedMeals()[0].kind` ist `'breakfast'`.
      - `takes the main meal mark away when a meal becomes breakfast` — `Frühstück`
        drücken; `mainMealBox()` ist danach nicht mehr gesetzt, `breakfastBox()` schon.
      - `takes the breakfast mark away when a meal becomes a main meal` — die
        Gegenrichtung, ausgehend von einem Gericht mit `kind: 'breakfast'`.
      - `says which mark it took away` — `Frühstück` drücken; die Ansage lautet
        `Hauptgericht abgewählt.` In der Gegenrichtung `Frühstück abgewählt.`
      - `says nothing when a mark is only taken away` — `Hauptgericht` drücken; beide
        Zeilen sind leer, und der Ansagebereich enthält weder `Hauptgericht
        abgewählt.` noch `Frühstück abgewählt.` Geprüft wird mit `not.toHaveTextContent`
        auf dem Bereich, **nicht** gegen eine leere Liste — im Formular werden auch
        Item- und Speicher-Ansagen gemacht.
      - `shows a meal without any kind again` — ein Gericht mit `kind: 'none'` öffnen;
        beide Zeilen sind leer. Ergänzt den vorhandenen Test `keeps a meal that is no
        main meal` (Zeile 607-616), der nach Phase 1 schon das Speichern von `'none'`
        abdeckt, um das Wiederanzeigen.
      - `shows whether the edited meal is a breakfast` — ein Gericht mit
        `kind: 'breakfast'` öffnen; `breakfastBox()` gesetzt, `mainMealBox()` nicht.
      - `forgets the kind that was not saved` — bearbeiten, `Frühstück` drücken,
        `Zurück zum Gericht`, erneut bearbeiten; der gespeicherte Zustand steht wieder.
      - `keeps a meal hidden when its kind changes` — ausgeblendetes Gericht bearbeiten,
        `Frühstück` drücken, speichern; `hidden` bleibt `true`, `kind` kippt.
      - `opens a known meal for editing with everything filled in` (Zeile 361) um
        `breakfastBox()` erweitern.
      - `has no accessibility violations on the form` (Zeile 730) deckt die neue Zeile
        mit ab; neben dem Lauf mit `kind: 'none'` (Zeile 738-748, in Phase 1 umgestellt)
        einen Lauf mit `kind: 'breakfast'` ergänzen.
      Wie die Ansage geprüft wird, richtet sich nach den vorhandenen Ansage-Tests in
      derselben Datei (`hides a meal and says so`, Zeile 521).
- [x] `breakfastMealNamesOnServer` in `e2e/emulatorHousehold.ts` ergänzen, nach dem
      Vorbild von `nonMainMealNamesOnServer` (Zeile 136-148). Sie nennt den seltenen
      Zustand, damit `expect.poll` wirklich wartet und nicht schon auf dem leeren Server
      grün wird.
      ```ts
      .filter((document) => document.fields.breakfast?.booleanValue === true)
      ```
- [x] `storeMealOnServer` (Zeile 150-162) einen zweiten Parameter geben, damit ein
      Altdokument mit `mainMeal: false` gelegt werden kann. Ohne den Parameter schreibt
      sie weiter genau dasselbe Dokument wie bisher — der Test `treats a stored meal
      without the field as a main meal` bleibt gültig. Die Felder brauchen die
      Firestore-REST-Hülle, sonst legt der Emulator kein gültiges Dokument an.
      ```ts
      type StoredMealFlags = { mainMeal?: boolean; breakfast?: boolean }

      export async function storeMealOnServer(
        name: string,
        flags: StoredMealFlags = {},
      ): Promise<void> {
        const flagFields = Object.fromEntries(
          Object.entries(flags).map(([field, value]) => [
            field,
            { booleanValue: value },
          ]),
        )
        ...
      }
      ```
      `flagFields` wird im vorhandenen `callEmulator`-Aufruf hinter die bisherigen
      Felder gespreizt.
- [x] `e2e/meals.spec.ts` um `keeps a meal as a breakfast after a reload` ergänzen:
      `Bolognese` anlegen, `Bearbeiten`, `switchCheckbox(page, 'Frühstück')`,
      `Speichern`, dann `await expect.poll(breakfastMealNamesOnServer).toEqual(
      ['Bolognese'])`, `page.reload()`, `Gerichte`, `Bolognese`, `Bearbeiten` —
      `Frühstück` gesetzt, `Hauptgericht` nicht. **Das Warten auf den Server ist
      Pflicht**, nicht Vorsicht: ausstehende Schreibvorgänge überleben kein Neuladen
      (offener Punkt zu `persistentLocalCache` in `docs/notes.txt`), und die
      Nachbartests machen es deshalb genauso.
- [x] `e2e/meals.spec.ts` um `treats a stored meal that is no main meal as neither`
      ergänzen: `storeMealOnServer('Milchreis', { mainMeal: false })` **vor** dem
      Anmelden, dann anmelden, `Gerichte`, `Milchreis`, `Bearbeiten` — beide Zeilen
      leer. Sichert ab, dass ein Gericht aus MZP-017 nicht still zum Frühstück wird.
- [x] In `docs/notes.txt` den Punkt `- Checkbox für Frühstück` (Zeile 120) auf `x`
      setzen und in den DONE-Block über der TODO-Überschrift verschieben, ohne die
      Reihenfolge der übrigen Zeilen zu berühren.
- [x] In `docs/notes.txt` unten unter TODO einen Punkt anhängen, weil der Punkt zu den
      Zufallsregeln (Zeile 118-119) den alten Feldnamen nennt und nicht umformuliert
      werden darf:
      ```
      - Zufallsregeln: das Feld mainMeal heisst seit MZP-019 kind und traegt
        'mainMeal' | 'breakfast' | 'none'; der Punkt weiter oben meint dieses Feld.
        Die Zeile im Formular heisst seitdem Hauptgericht
      ```

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `replacedKindAnnouncement('mainMeal', 'breakfast')` liefert
      `Hauptgericht abgewählt.`, `('breakfast', 'mainMeal')` liefert
      `Frühstück abgewählt.`, jeder Fall mit `'none'` und jeder mit gleichem Wert
      liefert `null`.
- [x] Die Tests `takes the main meal mark away when a meal becomes breakfast` und
      `takes the breakfast mark away when a meal becomes a main meal` sind grün — beide
      Haken sind nie zugleich gesetzt.
- [x] `says nothing when a mark is only taken away` ist grün: kein doppeltes Sprechen,
      wenn VoiceOver ohnehin `deaktiviert` meldet.
- [x] `leaves a new meal out of the breakfasts` ist grün: der Standard beim Anlegen ist
      unverändert `Hauptgericht`.
- [x] `keeps a meal hidden when its kind changes` ist grün — das Formular verliert
      `hidden` nicht.
- [x] `forgets the kind that was not saved` ist grün: ohne `Speichern` wird nichts
      geschrieben.
- [x] Die Zugänglichkeitsprüfungen auf dem Formular sind in allen drei Zuständen grün,
      und beide Kästen sind über `getByRole('checkbox', { name: ... })` erreichbar — sie
      haben also einen zugänglichen Namen und sind keine `switch`.
- [x] `grep -rn "Hauptmahlzeit" src e2e` findet nichts mehr.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `npm run test:e2e` läuft durch, einschließlich `keeps a meal as a breakfast after
      a reload` und `treats a stored meal that is no main meal as neither`.

**Manuelle Verifikation**:

- [ ] Auf dem Gerät mit VoiceOver: ein Gericht bearbeiten, bis ans Ende des Formulars
      wischen und beide Zeilen hören — `Hauptgericht, Kontrollkästchen, aktiviert` und
      `Frühstück, Kontrollkästchen, deaktiviert`.
- [ ] `Frühstück` anhaken und `Hauptgericht abgewählt.` hören, ohne dass VoiceOvers
      eigenes `aktiviert` abgeschnitten wird. Zurückwischen: `Hauptgericht` ist leer.
- [ ] Den gesetzten Haken wieder wegnehmen — es kommt keine zusätzliche Ansage, und
      beide Zeilen sind leer.
- [ ] Die zweite Zeile ist mit dem Finger auf ihrer ganzen Breite zu treffen, nicht nur
      auf dem Kasten, und sieht aus wie die erste — auch bei eingeschalteter Farbumkehr.
- [ ] `Speichern`, erneut bearbeiten — der Zustand steht. `Zurück zum Gericht` nach
      einer Änderung verwirft sie.
- [ ] Ein Gericht, das vor dieser Änderung angelegt wurde, zeigt `Hauptgericht`
      gesetzt und `Frühstück` leer.
- [ ] Die App auf dem zweiten Gerät öffnen und prüfen, dass der Zustand dort ebenso
      steht.

## Notizen zur Umsetzung

Der e2e-Test `buys only the day that the supply no longer covers` war im ersten
vollständigen Lauf nach Phase 1 rot und im Wiederholungslauf grün — der bekannte
Wackler aus `docs/notes.txt` (useSupplies übernimmt jede Momentaufnahme ungeprüft).
Er rührt nicht an `kind`. Der Lauf nach Phase 2 war komplett grün, alle 22 Tests.

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/agents/plans/2026-09-23-hauptmahlzeit-kennzeichnen.md` — MZP-017, führt
  `mainMeal` und die Zeile `Hauptmahlzeit` ein
- `docs/agents/plans/2026-09-23-gericht-ausblenden.md` — MZP-016, führt `hidden` ein
- `docs/notes.txt:118-120` — die offenen Punkte zu Zufallsregeln und Frühstück
