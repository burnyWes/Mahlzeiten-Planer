---
date: 2026-09-22
git_commit: c4088c4f4511682983e4d4037ed87a83320ea922
branch: main
story: MZP-011
topic: "Vorraete mit Anzahl je Gericht"
tags: [plan, meals, supplies, firestore, ui]
status: ready
---

# PLAN: MZP-011 — Vorraete mit Anzahl je Gericht

Die Vorraete-Seite ist seit MZP-010 eine leere Huelle mit Ueberschrift. Sie soll das
"Eisfach-Memory" aus `docs/notes.txt` werden: eine Liste von Gerichten, die
portionsweise vorgehalten werden, mit einer Anzahl je Gericht, die sich direkt in der
Liste erhoehen und vermindern laesst.

## Akzeptanzkriterien

- Die Vorraete-Seite zeigt die Kopfzeile "Vorraete, 3" (ohne Vorraete: "Vorraete,
  keine") und rechts einen Knopf mit `aria-label` "Vorrat hinzufuegen".
- Der Knopf oeffnet eine Seite mit einem Feld "Gericht" samt Vorschlagsliste, einem
  Feld "Menge" (vorbelegt mit `1`) und unten fixiert "Speichern".
- Gespeichert wird nur, wenn der eingegebene Text zu einem vorhandenen Gericht passt —
  ueber einen angetippten Vorschlag oder ueber den vollstaendig getippten Namen.
  Andernfalls erscheint "Dieses Gericht gibt es nicht.", es wird nichts gespeichert
  und der Fokus steht im Feld "Gericht".
- Steht das Gericht schon in den Vorraeten, werden die Mengen addiert; die Ansage nennt
  den Zuwachs und den neuen Stand.
- Die Liste ist alphabetisch nach Gerichtnamen sortiert. Jede Zeile traegt links den
  Gerichtnamen als Knopf und rechts `[−] Anzahl [+]`.
- Die Stepper-Knoepfe heissen "Weniger, <Gericht>" und "Mehr, <Gericht>"; jede
  Aenderung wird als "<Gericht>, <Anzahl>." angesagt.
- Bei 99 ist "Mehr" inaktiv. Eine Eingabe ueber 99 wird mit "Die Anzahl ist zu gross."
  abgewiesen, ebenso eine gebrochene Zahl mit "Die Anzahl muss eine ganze Zahl sein."
- "Weniger" bei Anzahl 1 entfernt den Vorrat, sagt "<Gericht> entfernt, noch 2
  Vorraete." und setzt den Fokus auf den Namensknopf der folgenden Zeile; war es die
  letzte Zeile, auf die vorhergehende; war es die einzige, auf die Ueberschrift.
- Ein Klick auf den Gerichtnamen oeffnet den Vorrat: der Name steht als Ueberschrift,
  aenderbar ist nur die Menge, Speichern **ersetzt** sie. "Loeschen" fuehrt auf eine
  Bestaetigungsseite.
- Wird ein Gericht geloescht, verschwindet sein Vorrat mit.
- Vorraete ueberleben ein Neuladen und erscheinen auf dem zweiten Geraet.
- Die axe-Pruefung bleibt auf allen neuen Seiten ohne Befund, auch mit invertierten
  Farben.

## Wesentliche Entscheidungen und Abwaegungen

1. **Untergrenze:** "Weniger" bei Anzahl 1 entfernt den Vorrat ohne Rueckfrage.
   - Warum: ein Eintrag mit 0 Stueck ist kein Vorrat.
   - Auswirkung: der Fokus muss gezielt weitergereicht werden, sonst faellt VoiceOver
     beim Verschwinden der Zeile auf den Seitenanfang zurueck. Dafuer entsteht
     `useFocusAfterRemoval` in `shared/ui`.

2. **Gerichtauswahl ueber den Namen, nicht ueber eine gemerkte Id:** Das Formular haelt
   nur den getippten Text; beim Speichern loest die Domaene ihn gegen die Gerichtnamen
   auf. Ein angetippter Vorschlag schreibt lediglich den vollen Namen ins Feld.
   - Warum: `suggestMeals` blendet den exakten Volltreffer aus
     (`mealSuggestions.ts:30`) — wer "Bolognese" ausschreibt, haette sonst keinen
     Vorschlag mehr zum Antippen und kaeme nicht weiter.
   - Auswirkung: ein Zustand weniger im Formular, die Regel liegt pruefbar in
     `domain/supply.ts`. Preis: bei zwei Gerichten gleichen Namens trifft es das erste
     der alphabetischen Liste. Beide sind fuer den Nutzer ohnehin nicht
     unterscheidbar — die Vorschlagsliste zeigt zweimal denselben Text.

3. **Anlegen addiert, Bearbeiten ersetzt.**
   - Warum: anlegen heisst nachfuellen, bearbeiten heisst richtigstellen.
   - Auswirkung: zwei Ansagen und zwei Domaenenfunktionen (`combinedSupply`,
     `recountedSupply`); das Bearbeiten-Formular hat kein Gericht-Feld.

4. **Speicherform:** Sammlung `supplies`, Dokument-Id = `mealId`, ein Feld `count`.
   - Warum: ein Antippen am Stepper schreibt genau ein kleines Dokument; zwei Geraete
     stossen sich nicht. Dass ein Gericht hoechstens einmal vorkommt, steckt im
     Schluessel statt in einer Pruefung.
   - Auswirkung: `firestore.rules` bekommt einen Block und muss **von Hand** ausgerollt
     werden, sonst ist die Sammlung in Produktion gesperrt (TODO in `docs/notes.txt`).

5. **Verwaiste Vorraete gibt es nicht:** das Loeschen eines Gerichts loescht seinen
   Vorrat.
   - Warum: kein Datenmuell, und keine Zeile, die stillschweigend verschwindet.
   - Auswirkung: `MealsArea` bekommt `onMealDeleted`, das `SignedInApp` mit
     `supplies.removeSupply` verdrahtet. Zusaetzlich blendet `suppliedMeals` einen
     Vorrat ohne Gericht aus — der Schutz gegen einen Loeschvorgang vom anderen Geraet.

6. **Menge ist eine ganze Zahl von 1 bis 99.**
   - Warum: Portionen im Eisfach; die Obergrenze faengt Vertipper wie 555 ab.
   - Auswirkung: "Mehr" ist bei 99 inaktiv; ein Addieren ueber 99 wird abgewiesen statt
     still gedeckelt.

7. **Sortierung alphabetisch nach Gerichtnamen** ueber das vorhandene `byName`.
   - Warum: dieselbe Reihenfolge wie die Gerichte-Liste nebenan.
   - Auswirkung: die Dokumente brauchen kein `createdAt`; `suppliedMeals` laeuft ueber
     die sortierten Gerichte und blendet dabei verwaiste Vorraete aus.

8. **Reihenfolge der Phasen:** Bearbeiten und Loeschen (Phase 2) kommen vor dem Stepper
   (Phase 3).
   - Warum: das Fokusziel nach dem Entfernen ist der Namensknopf der Nachbarzeile. Den
     gibt es erst, wenn die Zeile sich oeffnen laesst. Andersherum muesste die
     Fokusfuehrung zweimal gebaut werden.
   - Auswirkung: Phase 1 zeigt Name und Anzahl als reinen Text; Phase 2 macht den Namen
     zum Knopf.

9. **Die optimistische Anzeige bekommt keinen Schutz fuer unbestaetigte Schreibvorgaenge**
   — `useSupplies` uebernimmt jede Momentaufnahme, wie `useWeekPlan` es tut.
   - Warum: `unconfirmedWrites` (MZP-006) haengt an der Einkaufsliste und ihren
     Zeitstempeln; es hierher zu ziehen ist ein eigenes Vorhaben.
   - Auswirkung: wer sehr schnell hintereinander antippt, kann die Zahl fuer einen
     Moment zurueckspringen sehen, bis die naechste Momentaufnahme kommt. Da jeder
     Vorrat ein eigenes Dokument ist, betrifft das nur die gerade angetippte Zeile —
     nicht die ganze Liste wie beim Wochenplan. Der offene Punkt steht bereits unter
     TODO in `docs/notes.txt`.

## Ausgangslage

Der Bereich existiert, die Seite ist leer (`src/meals/ui/SuppliesArea.tsx:4-19`,
eingehaengt in `src/SignedInApp.tsx:173`).

```
Kontext meals
  domain/   meal.ts           Meal, MealItem, NewMeal, createMeal, byName
            weekPlan.ts       WeekPlan = Record<Weekday, MealId | null>
            mealSuggestions.ts suggestMeals + private normalizeMealName
            announcements.ts  alle gesprochenen Texte des Kontexts
  api/      mealsClient.ts    Port + firestore- und inMemory-Adapter
            weekPlanClient.ts Port + firestore- und inMemory-Adapter
  ui/       MealsArea         Seitenschalter list | meal | form | delete
            MealListPage/-Row, MealFormPage, MealPage, DeleteMealPage
            WeekPlanArea, WeekPlanPage, WeekPlanRow, MealSuggestions
            useMeals, useWeekPlan
            SuppliesArea      <- leer
```

Die Gerichte-Liste gibt das Muster fuer Kopfzeile und Zeilen vor
(`MealListPage.tsx:24-56`, `MealListRow.tsx:15-33`):

```
+-------------------------------------------+
| [L][K][T][F][Z]                           |  NavigationBar
+-------------------------------------------+
| Gerichte, 3                          [ + ]|  .pageHeader + .addItemButton
+-------------------------------------------+
| Bolognese                           [Korb]|  .mealRow
| Linsensuppe                         [Korb]|    .mealNameButton (flex:1)
+-------------------------------------------+    .iconButton     (flex:none)
```

`MealsArea.tsx:13-39` haelt den Seitenzustand als Summentyp und sucht das adressierte
Gericht ueber seine Id aus der Liste — nie wird ein Objekt im Zustand festgehalten.

Die Gerichtauswahl im Wochenplan (`WeekPlanRow.tsx:29-74`): ein Textfeld, dessen Wert
das Getippte oder der Name des geplanten Gerichts ist, darunter `MealSuggestions`.
Gewaehlt wird ausschliesslich durch Antippen eines Vorschlags. `suggestMeals`
(`mealSuggestions.ts:21-34`) liefert ab zwei Zeichen bis zu fuenf Treffer und filtert
den exakten Volltreffer heraus.

Formularseiten tragen keine Navigation: "Zurueck"-Knopf, `h1` mit `useHeadingFocus`,
Felder als `p.field`, unten `BottomBar` mit Speichern (`MealFormPage.tsx:70-123`).
Fehlermeldungen stehen in einem `p.failure`, auf das der Speichern-Knopf per
`aria-describedby` zeigt.

Persistenz, zwei Muster nebeneinander:

```
meals     Sammlung, ein Dokument je Gericht, Id von Firestore
          firestoreMealsClient.ts:80-84   addMeal -> doc(meals) + setDoc
weekPlan  ein Dokument weekPlan/current, bei jeder Aenderung komplett neu
          firestoreWeekPlanClient.ts:39-41
```

Jede Sammlung ist in `firestore.rules` einzeln freigegeben und in
`firestore.rules.test.ts` mit vier Faellen abgedeckt (Haushalt schreibt, Haushalt
liest, fremdes Konto scheitert, nicht angemeldet scheitert).

Kontextgrenzen werden maschinell erzwungen (`eslint.config.js:8`,
`test/domainLayerBoundary.test.ts`). Vorraete liegen in `meals` (MZP-010,
Entscheidung 3), beides bleibt unberuehrt.

## Zielbild

```
+-------------------------------------------+
| [L][K][T][F][Z]                           |
+-------------------------------------------+
| Vorraete, 3                          [ + ]|
+-------------------------------------------+
| Bolognese              [−]  5  [+]        |
| Linsensuppe            [−]  2  [+]        |
| Pizza                  [−] 12  [+]        |
+-------------------------------------------+
   Knopf "Bolognese"  |  "Weniger, Bolognese"  Text 5  "Mehr, Bolognese"
```

Vorrat hinzufuegen:

```
+--------------------------------+     Antippen von "Bolognese"
| [Zurueck zu den Vorraeten]     |     schreibt den vollen Namen
|                                |     ins Feld und springt auf
| Vorrat hinzufuegen             |     das Mengenfeld.
|                                |
| Gericht                        |
| [ bolo                       ] |
|   Vorschlaege                  |
|   [ Bolognese              ]   |
| Menge                          |
| [ 1   ]                        |
|                                |
| (Fehlermeldung)                |
+--------------------------------+
| [        Speichern           ] |  BottomBar
+--------------------------------+
```

Vorrat oeffnen und loeschen:

```
+--------------------------------+     +--------------------------------+
| [Zurueck zu den Vorraeten]     |     | [Zurueck zum Vorrat]           |
|                                |     |                                |
| Bolognese                      |     | Bolognese entfernen?           |
|                                |     |                                |
| Menge                          |     | Der Vorrat wird fuer beide     |
| [ 5   ]                        |     | Geraete entfernt.              |
|                                |     |                                |
| (Fehlermeldung)                |     | [ Loeschen ] [ Abbrechen ]     |
+--------------------------------+     +--------------------------------+
| [  Speichern  ] [  Loeschen  ] |
+--------------------------------+
```

Datenfluss:

```
SignedInApp
  useSupplies(suppliesClient) ---> Supplies { supplies, keepSupply, removeSupply }
        |                                          ^
        v                                          |
  SuppliesArea(meals, supplies, announce)          |
        |  suppliedMeals(supplies, meals)          |
        v                                          |
  SupplyListPage -> SupplyListRow --- [−] [+] -----+
        |
        +-> AddSupplyPage   createSupply(meals, draft) + combinedSupply
        +-> SupplyPage      recountedSupply(mealId, written)
        +-> DeleteSupplyPage

  MealsArea --- onMealDeleted(id) ---> supplies.removeSupply(id)
```

Firestore:

```
supplies/
  <mealId>  { count: 5 }
```

## Abstraktionen und Wiederverwendung

Wiederverwendet wird fast alles: `byName` sortiert, `suggestMeals` und
`MealSuggestions` liefern die Gerichtauswahl, `BottomBar`, `useHeadingFocus`,
`.page`, `.pageHeader`, `.addItemButton`, `.itemList`, `.mealNameButton` und
`.failure` tragen das Aussehen, `mealFailureMessage` buendelt die Fehlermeldungen,
`DeleteMealPage` ist die Vorlage der Bestaetigungsseite, `MealsArea` die des
Seitenschalters. Neu sind ein Aggregat, ein Port mit zwei Adaptern, fuenf
UI-Bausteine und ein Fokus-Hook.

- `src/meals/domain`
  - `supply.ts` — neu, das Aggregat
    - `Supply`, `SuppliedMeal`, `SupplyDraft`, `InvalidSupply`, `MAXIMUM_COUNT`
    - `createSupply`, `recountedSupply`, `combinedSupply`
    - `withOneMore`, `withOneLess`, `isFull`
    - `supplyOf`, `withSupply`, `withoutSupply`, `suppliedMeals`
  - `supply.test.ts` — neu, test-getrieben
  - `meal.ts` — `normalizeMealName` (aus `mealSuggestions.ts` hierher) und
    `mealNamed` ergaenzt
  - `mealSuggestions.ts` — nutzt `normalizeMealName` aus `meal.ts`
  - `announcements.ts` — Texte der Vorraete ergaenzt, `mealFailureMessage` kennt
    `InvalidSupply`
- `src/meals/api`
  - `suppliesClient.ts` — neu, Port
  - `inMemorySuppliesClient.ts` — neu, Fake mit `suppliesArriveFromElsewhere`
  - `firestoreSuppliesClient.ts` — neu, Adapter auf die Sammlung `supplies`
- `src/meals/ui`
  - `useSupplies.ts` — neu, Zustand mit optimistischem Schreiben
  - `SuppliesArea.tsx` — Seitenschalter `list | add | supply | delete`
  - `SupplyListPage.tsx` — neu, Kopfzeile, Liste, Fokusfuehrung
  - `SupplyListRow.tsx` — neu, Namensknopf und Stepper
  - `AddSupplyPage.tsx` — neu, Gericht und Menge
  - `SupplyPage.tsx` — neu, Menge aendern, Loeschen anstossen
  - `DeleteSupplyPage.tsx` — neu, Bestaetigung
  - `SuppliesArea.test.tsx` — neu
  - `MealsArea.tsx` — `onMealDeleted` ergaenzt
- `src/shared/ui`
  - `useFocusAfterRemoval.ts` — neu, generische Fokusfuehrung fuer Listen
- `src`
  - `SignedInApp.tsx` — `createSuppliesClient`, `useSupplies`, Vorraete-Zweig,
    Verdrahtung des Aufraeumens
  - `App.tsx` — `createSuppliesClient` durchreichen
  - `main.tsx` — `openSupplies`
  - `SignedInApp.test.tsx`, `App.test.tsx` — neuer Prop, Vorraete-Tests
  - `index.css` — `.supplyRow`, `.supplyStepper`, `.supplyCount`, `.stepperButton`
- Projektwurzel
  - `firestore.rules`, `firestore.rules.test.ts` — Sammlung `supplies`
- `e2e`
  - `supplies.spec.ts` — neu
  - `emulatorHousehold.ts` — `supplyCountsOnServer`
- `docs/notes.txt` — "Eisfach-Memory" abhaken

## Logging und Beobachtbarkeit

Keine neuen Kanaele. Alles Hoerbare laeuft ueber den vorhandenen `Announcer`:

```
Vorrat angelegt, neu:        "Bolognese, 2."
Vorrat angelegt, addiert:    "Bolognese, 2 dazu, jetzt 5."
Menge bearbeitet:            "Bolognese, 5."
Stepper:                     "Bolognese, 6."
Entfernt:                    "Bolognese entfernt, noch 2 Vorraete."
Entfernt, letzter:           "Bolognese entfernt, keine Vorraete mehr."
Unbekanntes Gericht:         "Dieses Gericht gibt es nicht."
Zu grosse Anzahl:            "Die Anzahl ist zu gross."
```

Schreibfehler melden die Adapter wie bisher ueber `onWriteFailure` mit "Konnte nicht
gespeichert werden."

## Umsetzung

### Phase 1: Vorrat anlegen und sehen

Abhaengigkeiten: keine

Das Aggregat, die Speicherung und der Weg vom `+`-Knopf zur sichtbaren Zeile. Die
Liste zeigt Name und Anzahl als Text; geaendert wird noch nichts.

**Aufgaben**:

- [x] `src/meals/domain/meal.ts`: `normalizeMealName` aus `mealSuggestions.ts`
      hierher ziehen und exportieren, `mealNamed` ergaenzen. Test zuerst in
      `meal.test.ts`: findet bei abweichender Gross-/Kleinschreibung und
      Randleerzeichen, findet nicht bei leerem Text.

      ```ts
      export function normalizeMealName(name: string): string {
        return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE')
      }

      export function mealNamed(
        meals: readonly Meal[],
        written: string,
      ): Meal | null {
        const wanted = normalizeMealName(written)
        if (wanted === '') return null
        return (
          meals.find((meal) => normalizeMealName(meal.name) === wanted) ?? null
        )
      }
      ```

- [x] `src/meals/domain/mealSuggestions.ts`: die private Kopie loeschen und
      `normalizeMealName` aus `./meal` importieren. `mealSuggestions.test.ts` bleibt
      unveraendert gruen.

- [x] `src/meals/domain/supply.test.ts` anlegen und die Regeln zuerst als Tests
      schreiben: `createSupply` weist unbekanntes Gericht, leere, nicht numerische,
      gebrochene, nicht positive und zu grosse Anzahl zurueck; nimmt einen Namen mit
      abweichender Schreibweise an; `combinedSupply` addiert auf einen vorhandenen
      Vorrat, nimmt `null` als "noch keiner" und wirft ueber 99;
      `suppliedMeals` sortiert alphabetisch und blendet Vorraete ohne Gericht aus.

- [x] `src/meals/domain/supply.ts` anlegen.

      ```ts
      export type Supply = { mealId: MealId; count: number }
      export type SuppliedMeal = { meal: Meal; count: number }
      export type SupplyDraft = { meal: string; count: string }

      export type InvalidSupplyReason =
        | 'mealUnknown'
        | 'countNotANumber'
        | 'countNotWhole'
        | 'countNotPositive'
        | 'countTooLarge'

      export const MAXIMUM_COUNT = 99

      export function createSupply(
        meals: readonly Meal[],
        draft: SupplyDraft,
      ): Supply {
        const meal = mealNamed(meals, draft.meal)
        if (meal === null) throw new InvalidSupply('mealUnknown')
        return { mealId: meal.id, count: readCount(draft.count) }
      }

      export function combinedSupply(kept: Supply | null, added: Supply): Supply {
        if (kept === null) return added
        const count = kept.count + added.count
        if (count > MAXIMUM_COUNT) throw new InvalidSupply('countTooLarge')
        return { mealId: added.mealId, count }
      }

      export function suppliedMeals(
        supplies: readonly Supply[],
        meals: readonly Meal[],
      ): readonly SuppliedMeal[] {
        return byName(meals)
          .map((meal) => ({ meal, count: supplyOf(supplies, meal.id)?.count ?? 0 }))
          .filter((supplied) => supplied.count > 0)
      }
      ```

      `readCount` prueft in dieser Reihenfolge: leer oder keine Zahl, nicht
      ganzzahlig, kleiner als 1, groesser als `MAXIMUM_COUNT`. `supplyOf`,
      `withSupply` und `withoutSupply` arbeiten auf der Liste; `withSupply` ersetzt
      einen vorhandenen Eintrag desselben Gerichts, statt ihn zu doppeln.

- [x] `src/meals/domain/announcements.ts`: `mealFailureMessage` um `InvalidSupply`
      erweitern und die neuen Texte ergaenzen.

      ```ts
      const messagesBySupplyReason: Record<InvalidSupplyReason, string> = {
        mealUnknown: 'Dieses Gericht gibt es nicht.',
        countNotANumber: 'Die Anzahl muss eine Zahl sein.',
        countNotWhole: 'Die Anzahl muss eine ganze Zahl sein.',
        countNotPositive: 'Die Anzahl muss größer als null sein.',
        countTooLarge: 'Die Anzahl ist zu groß.',
      }

      export function suppliesHeading(supplyCount: number): string {
        return supplyCount === 0 ? 'Vorräte, keine' : `Vorräte, ${supplyCount}`
      }

      export function supplyAddedAnnouncement(
        meal: NewMeal,
        added: number,
        total: number,
      ): string {
        return added === total
          ? `${meal.name}, ${total}.`
          : `${meal.name}, ${added} dazu, jetzt ${total}.`
      }
      ```

      Test zuerst in `announcements.test.ts`, mindestens: Ueberschrift ohne und mit
      Vorraeten, beide Faelle von `supplyAddedAnnouncement`, `mealFailureMessage`
      liefert fuer jeden `InvalidSupplyReason` einen Text.

- [x] `src/meals/api/suppliesClient.ts` anlegen.

      ```ts
      export interface SuppliesClient {
        observeSupplies(onSupplies: (supplies: readonly Supply[]) => void): () => void
        writeSupply(supply: Supply): void
        removeSupply(mealId: MealId): void
      }
      ```

- [x] `src/meals/api/inMemorySuppliesClient.ts` anlegen — nach dem Vorbild von
      `inMemoryMealsClient.ts` mit `suppliesArriveFromElsewhere` und
      `storedSupplies`.

- [x] `src/meals/api/firestoreSuppliesClient.ts` anlegen — Sammlung `supplies`,
      Dokument-Id ist die `mealId`, ein Feld `count`. Fehlerbehandlung wie in
      `firestoreMealsClient.ts:67-69`.

      ```ts
      const SUPPLIES = 'supplies'

      function toSupply(id: MealId, stored: DocumentData): Supply {
        return { mealId: id, count: Number(stored.count ?? 0) }
      }
      ```

- [x] `firestore.rules`: Block fuer `supplies` neben `meals` ergaenzen.

      ```
      match /supplies/{mealId} {
        allow read, write: if isHousehold();
      }
      ```

- [x] `firestore.rules.test.ts`: `suppliesOf` ergaenzen und die vier Faelle nach dem
      Vorbild der `knownItems` schreiben — Haushalt schreibt, liest und loescht,
      fremdes Konto scheitert, nicht angemeldeter Besucher scheitert.

- [x] `src/meals/ui/useSupplies.ts` anlegen — beobachtet den Port und schreibt
      optimistisch, damit die Zeile nicht auf die Bestaetigung wartet.

      ```ts
      export type Supplies = {
        supplies: readonly Supply[]
        keepSupply: (supply: Supply) => void
        removeSupply: (mealId: MealId) => void
      }
      ```

- [x] `src/meals/ui/AddSupplyPage.tsx` anlegen — Aufbau wie `MealFormPage`, Felder
      "Gericht" und "Menge", Vorschlaege ueber `suggestMeals` und `MealSuggestions`
      mit dem Label "Vorschläge". Der Fokus steht beim Oeffnen im Gericht-Feld;
      ein angetippter Vorschlag schreibt den vollen Namen und springt auf das
      Mengenfeld (wie `AddItemPage.tsx:36-39`). `onSave` wird im `try` gerufen, damit
      auch ein zu grosser Gesamtstand im `p.failure` landet.

      Der Fokus geht auf das Feld, das den Fehler traegt: bei `mealUnknown` auf
      "Gericht", bei jeder Anzahl-Meldung auf "Menge".

      ```tsx
      const EMPTY_DRAFT: SupplyDraft = { meal: '', count: '1' }

      function saveSupply() {
        try {
          onSave(createSupply(meals, draft))
        } catch (error) {
          const message = mealFailureMessage(error)
          if (message === null) throw error
          setFailureMessage(message)
          announce(message)
          fieldOfFailure(error).current?.focus()
        }
      }
      ```

- [x] `src/meals/ui/SupplyListPage.tsx` anlegen — Kopfzeile mit `suppliesHeading` und
      `+`-Knopf (`aria-label` "Vorrat hinzufügen"), darunter die Liste oder
      "Noch keine Vorräte.". In dieser Phase je Zeile zwei `span` in einer
      `li.supplyRow`: Name und Anzahl.

- [x] `src/meals/ui/SuppliesArea.tsx` umbauen — Seitenschalter `list | add` nach dem
      Vorbild von `MealsArea.tsx`, mit `suppliedMeals` als Ansicht.

      `addSupply` darf werfen — `AddSupplyPage` ruft es innerhalb ihres `try` auf, und
      der zu grosse Gesamtstand landet so in ihrer Fehlermeldung. Das Gericht zur Id
      ist sicher vorhanden, weil `createSupply` die Id daraus gezogen hat.

      ```tsx
      function addSupply(added: Supply) {
        const combined = combinedSupply(supplyOf(supplies.supplies, added.mealId), added)
        const meal = meals.find((known) => known.id === added.mealId)
        if (meal === undefined) return
        supplies.keepSupply(combined)
        showList()
        announce(supplyAddedAnnouncement(meal, added.count, combined.count))
      }
      ```

- [x] `src/index.css`: `.supplyRow` ergaenzen (Flex, `space-between`, `gap: 0.5rem`)
      und `.supplyCount` (`min-width: 2rem`, zentriert). Keine eigenen Farben — sonst
      schlaegt `test/palette.test.ts` an.

- [x] `src/App.tsx`, `src/main.tsx`, `src/SignedInApp.tsx`: `createSuppliesClient`
      durchreichen, `useSupplies` aufrufen und `SuppliesArea` mit `meals.meals`,
      `supplies` und `announce` versorgen.

- [x] `src/meals/ui/SuppliesArea.test.tsx` anlegen — mit `createInMemoryMealsClient`
      und `createInMemorySuppliesClient`, Aufbau wie `MealsArea.test.tsx`. Faelle:
      leere Seite, Vorrat ueber einen Vorschlag anlegen, Vorrat ueber den
      ausgeschriebenen Namen anlegen, unbekanntes Gericht wird abgewiesen, Addieren
      auf einen vorhandenen Vorrat samt Ansage, Addieren ueber 99 wird abgewiesen,
      gebrochene Anzahl wird abgewiesen, alphabetische Reihenfolge, ein Vorrat ohne
      Gericht erscheint nicht, axe ohne Befund auf Liste und Formular.

- [x] `src/App.test.tsx` und `src/SignedInApp.test.tsx`: den neuen Prop ergaenzen; den
      Test "leaves the supplies empty for now" durch einen ersetzen, der die
      Kopfzeile "Vorräte, keine" und den Knopf "Vorrat hinzufügen" prueft.

- [x] `e2e/emulatorHousehold.ts`: `supplyCountsOnServer()` ergaenzen, das die Sammlung
      `supplies` liest und die `count`-Werte zurueckgibt.

- [x] `e2e/supplies.spec.ts` anlegen — Gericht anlegen, Vorrat mit Menge 3 ueber einen
      Vorschlag anlegen, Zeile pruefen, auf den Server warten, neu laden und die Zeile
      erneut pruefen. Das Mengenfeld ist vorbelegt, deshalb `fill('3')` statt
      `typeInto`.

- [x] `firestore.rules` ausrollen, damit die Sammlung auf dem Geraet nicht gesperrt
      ist: `npx firebase deploy --only firestore:rules --project mahlzeiten-planer-ecd26`

**Automatisierte Verifikation**:

- [x] `npm run test` laeuft gruen, einschliesslich `supply.test.ts`, der neuen Faelle
      in `meal.test.ts` und `announcements.test.ts` sowie `SuppliesArea.test.tsx`.
- [x] `mealSuggestions.test.ts` bleibt unveraendert gruen — Beleg, dass das Verschieben
      von `normalizeMealName` nichts am Verhalten geaendert hat.
- [x] Die axe-Tests der neuen Seiten und die bestehenden in `SignedInApp.test.tsx`
      bleiben ohne Befund.
- [x] `test/domainLayerBoundary.test.ts` bleibt gruen — `supply.ts` importiert nur aus
      `./meal`, `suppliesClient.ts` nur aus `../domain`.
- [x] `test/palette.test.ts` bleibt gruen.
- [x] `npm run test:rules` laeuft gruen, einschliesslich der neuen `supplies`-Faelle.
- [x] `npm run lint` laeuft ohne Befund, `npm run build` uebersetzt fehlerfrei.
- [x] `npm run test:e2e` laeuft durch, einschliesslich `e2e/supplies.spec.ts`.

**Manuelle Verifikation**:

- [ ] Auf dem Geraet mit VoiceOver: "Vorrat hinzufügen" antippen, "bolo" tippen,
      den Vorschlag "Bolognese" antippen — der Fokus steht danach im Mengenfeld und
      der volle Name im Gericht-Feld.
- [ ] Speichern sagt "Bolognese, 3." und die Zeile steht in der Liste; ein zweites
      Anlegen mit 2 sagt "Bolognese, 2 dazu, jetzt 5.".
- [ ] Der Vorrat ist nach einem Neuladen und auf dem zweiten Geraet da — Beleg, dass
      die ausgerollten Regeln greifen.

### Phase 2: Vorrat oeffnen, bearbeiten und loeschen

Abhaengigkeiten: Phase 1

Der Gerichtname wird zum Knopf und oeffnet den Vorrat. Dort laesst sich die Menge
ersetzen und der Vorrat ueber eine Bestaetigungsseite entfernen. Ausserdem raeumt das
Loeschen eines Gerichts seinen Vorrat mit weg.

**Aufgaben**:

- [ ] `src/meals/domain/supply.ts`: `recountedSupply(mealId, written)` ergaenzen —
      dieselbe Pruefung der Anzahl wie beim Anlegen, ohne Gerichtauflösung. Test
      zuerst.

- [ ] `src/meals/domain/announcements.ts`: `supplyChangedAnnouncement(meal, count)` und
      `supplyRemovedAnnouncement(meal, remainingSupplies)` ergaenzen, letztere mit den
      drei Faellen "keine Vorräte mehr", "noch 1 Vorrat", "noch N Vorräte" nach dem
      Vorbild von `remainingMealPhrase` (`announcements.ts:61-66`). Test zuerst.

- [ ] `src/meals/ui/SupplyListRow.tsx` anlegen und in `SupplyListPage` einsetzen: der
      Name wird ein `button.mealNameButton`, der `onOpenSupply` ausloest; die Anzahl
      bleibt vorerst Text.

- [ ] `src/meals/ui/SupplyPage.tsx` anlegen — Aufbau wie `MealFormPage`: "Zurueck zu
      den Vorräten", `h1` mit dem Gerichtnamen und Fokus, Feld "Menge" mit der
      heutigen Anzahl vorbelegt, `p.failure`, `BottomBar` mit "Speichern" und
      "Löschen".

- [ ] `src/meals/ui/DeleteSupplyPage.tsx` anlegen — Abbild von `DeleteMealPage.tsx`
      mit der Ueberschrift "<Gericht> entfernen?" und dem Satz "Der Vorrat wird für
      beide Geräte entfernt.".

- [ ] `src/meals/ui/SuppliesArea.tsx`: Seitenschalter um `supply` und `delete`
      erweitern. Speichern ersetzt die Menge und sagt `supplyChangedAnnouncement`;
      Loeschen entfernt den Vorrat, kehrt zur Liste zurueck und sagt
      `supplyRemovedAnnouncement`. Wie in `MealsArea` wird das adressierte Gericht
      ueber die Id aus `suppliedMeals` geholt; verschwindet es, faellt die Ansicht auf
      die Liste zurueck.

- [ ] `src/meals/ui/MealsArea.tsx`: Prop `onMealDeleted: (id: MealId) => void`
      ergaenzen und in `deleteMeal` nach `meals.removeMeal(meal.id)` aufrufen.

- [ ] `src/SignedInApp.tsx`: `onMealDeleted={supplies.removeSupply}` verdrahten.

- [ ] `src/meals/ui/SuppliesArea.test.tsx`: Faelle ergaenzen — Zeile oeffnen zeigt den
      Namen als Ueberschrift und die Menge im Feld, Speichern ersetzt (5 statt
      5+2=7) samt Ansage, ungueltige Anzahl bleibt im Formular stehen, "Löschen"
      fuehrt auf die Bestaetigung, "Abbrechen" kehrt zum Vorrat zurueck, "Löschen"
      entfernt den Vorrat samt Ansage, axe ohne Befund auf beiden neuen Seiten.

- [ ] `src/meals/ui/MealsArea.test.tsx`: Fall ergaenzen, dass das Loeschen eines
      Gerichts `onMealDeleted` mit dessen Id meldet.

- [ ] `src/SignedInApp.test.tsx`: Fall ergaenzen, dass ein geloeschtes Gericht auch
      aus den Vorraeten verschwindet — Gericht mit Vorrat anlegen, Gericht loeschen,
      Vorraete oeffnen, Kopfzeile steht auf "Vorräte, keine".

- [ ] `e2e/supplies.spec.ts`: Ablauf ergaenzen — Vorrat oeffnen, Menge ersetzen,
      loeschen, und die Liste ist leer.

**Automatisierte Verifikation**:

- [ ] `npm run test` laeuft gruen, einschliesslich der neuen Faelle in
      `supply.test.ts`, `announcements.test.ts`, `SuppliesArea.test.tsx`,
      `MealsArea.test.tsx` und `SignedInApp.test.tsx`.
- [ ] Die axe-Tests der Vorrats- und der Bestaetigungsseite bleiben ohne Befund.
- [ ] `npm run lint` laeuft ohne Befund, `npm run build` uebersetzt fehlerfrei.
- [ ] `npm run test:e2e` laeuft durch.

**Manuelle Verifikation**:

- [ ] Auf dem Geraet mit VoiceOver: der Gerichtname wird als Knopf gelesen, Antippen
      oeffnet den Vorrat, die Ueberschrift bekommt den Fokus.
- [ ] Menge 5 eintragen, speichern: Ansage "Bolognese, 5.", die Liste zeigt 5.
- [ ] "Löschen", dann "Abbrechen" fuehrt zurueck zum Vorrat; "Löschen", dann
      "Löschen" entfernt ihn mit der Ansage.

### Phase 3: Menge an der Zeile aendern

Abhaengigkeiten: Phase 2

Der Stepper in der Zeile — der taeglich benutzte Weg. Dazu die Fokusfuehrung fuer den
Fall, dass die Zeile beim Vermindern verschwindet.

**Aufgaben**:

- [ ] `src/meals/domain/supply.ts`: `withOneMore`, `withOneLess` und `isFull`
      ergaenzen. Test zuerst: `withOneMore` zaehlt hoch und bleibt bei
      `MAXIMUM_COUNT` stehen, `withOneLess` zaehlt herunter und liefert bei 1 `null`,
      `isFull` ist erst bei `MAXIMUM_COUNT` wahr.

- [ ] `src/meals/domain/announcements.ts`: `lessSupplyLabel(meal)` und
      `moreSupplyLabel(meal)` ergaenzen ("Weniger, <Name>", "Mehr, <Name>"). Test
      zuerst.

- [ ] `src/shared/ui/useFocusAfterRemoval.ts` anlegen — meldet eine Zeile an und setzt
      nach dem Entfernen den Fokus auf die Zeile, die nun an derselben Stelle steht;
      gibt es keine mehr, auf das Ausweichziel.

      ```ts
      export function useFocusAfterRemoval<Key>(
        keys: readonly Key[],
        fallback: RefObject<HTMLElement | null>,
      ) {
        const rows = useRef(new Map<Key, HTMLElement>())
        const [removedPosition, setRemovedPosition] = useState<number | null>(null)

        useEffect(() => {
          if (removedPosition === null) return
          setRemovedPosition(null)
          const following = keys[Math.min(removedPosition, keys.length - 1)]
          const row = following === undefined ? null : rows.current.get(following)
          ;(row ?? fallback.current)?.focus()
        }, [removedPosition, keys, fallback])

        return { keepRow, rowRemovedAt: setRemovedPosition }
      }
      ```

      `keepRow(key)` liefert die `ref`-Funktion fuer den Namensknopf und traegt das
      Element ein beziehungsweise aus.

- [ ] `src/meals/ui/SupplyListRow.tsx`: den Stepper ergaenzen — `button` "Weniger",
      `span.supplyCount` mit der Anzahl, `button` "Mehr", bei `isFull` inaktiv. Die
      Zeichen `−` und `+` stehen im Knopf; gelesen wird das `aria-label`.

      ```tsx
      <li className="supplyRow">
        <button
          type="button"
          className="mealNameButton"
          ref={keepRow(meal.id)}
          onClick={() => onOpenSupply(supplied)}
        >
          {meal.name}
        </button>
        <span className="supplyStepper">
          <button
            type="button"
            className="stepperButton"
            aria-label={lessSupplyLabel(meal)}
            onClick={onLess}
          >
            −
          </button>
          <span className="supplyCount">{count}</span>
          <button
            type="button"
            className="stepperButton"
            aria-label={moreSupplyLabel(meal)}
            disabled={isFull(count)}
            onClick={onMore}
          >
            +
          </button>
        </span>
      </li>
      ```

- [ ] `src/meals/ui/SupplyListPage.tsx`: `useFocusAfterRemoval` einsetzen, mit den
      Gerichte-Ids als Schluessel und dem Ueberschrift-Ref als Ausweichziel. Beim
      Vermindern auf null meldet die Seite die Position der entfernten Zeile.

- [ ] `src/meals/ui/SuppliesArea.tsx`: `changeCount` ergaenzen — `withOneMore` bzw.
      `withOneLess`; liefert `withOneLess` `null`, wird der Vorrat entfernt und
      `supplyRemovedAnnouncement` gesprochen, sonst `supplyChangedAnnouncement`.

- [ ] `src/index.css`: `.supplyStepper` (Flex, `flex: none`, `gap: 0.25rem`) und
      `.stepperButton` (`min-width: 44px`, `font-size: 1.5rem`, `line-height: 1`)
      ergaenzen. Bei 280 px Geraetebreite bleiben dem Namen damit rund 140 px; er
      bricht wie `.mealNameButton` ueber `overflow-wrap: anywhere` um.

- [ ] `src/meals/ui/SuppliesArea.test.tsx`: Faelle ergaenzen — "Mehr" erhoeht, schreibt
      und sagt an; "Weniger" vermindert; "Weniger" bei 1 entfernt den Vorrat samt
      Ansage; der Fokus landet auf dem Namensknopf der folgenden Zeile, bei der
      letzten Zeile auf dem der vorhergehenden und beim einzigen Vorrat auf der
      Ueberschrift; "Mehr" ist bei 99 inaktiv; axe ohne Befund.

- [ ] `e2e/supplies.spec.ts`: Ablauf ergaenzen — zweimal "Mehr", einmal "Weniger", der
      Server traegt den erwarteten Stand; dann bis auf null vermindern und die Liste
      ist leer.

- [ ] `docs/notes.txt`: "Eisfach-Memory" unter TODO auf `x` setzen und nach DONE
      verschieben. Nichts umsortieren, nichts umformulieren.

**Automatisierte Verifikation**:

- [ ] `npm run test` laeuft gruen, einschliesslich der neuen Faelle in
      `supply.test.ts`, `announcements.test.ts` und `SuppliesArea.test.tsx` — darunter
      die drei Fokusfaelle.
- [ ] Die axe-Tests bleiben ohne Befund, auch mit invertierten Farben.
- [ ] `test/palette.test.ts` bleibt gruen — der Stepper setzt keine eigenen Farben.
- [ ] `npm run lint` laeuft ohne Befund, `npm run build` uebersetzt fehlerfrei.
- [ ] `npm run test:e2e` laeuft durch.

**Manuelle Verifikation**:

- [ ] Auf dem Geraet: die drei Bedienelemente der Zeile lassen sich mit dem Daumen
      sicher treffen, auch bei langem Gerichtnamen; nichts bricht aus der Zeile.
- [ ] VoiceOver liest beim Wischen "Bolognese, Taste", "Weniger, Bolognese, Taste",
      "5", "Mehr, Bolognese, Taste"; jedes Antippen wird mit "Bolognese, 6." quittiert.
- [ ] Bei Anzahl 1 auf "Weniger": die Ansage kommt und der Fokus steht auf dem
      naechsten Gericht — VoiceOver bleibt an der Stelle der Liste.
- [ ] Mit invertierten Farben sind `−`, Zahl und `+` gut lesbar.

## Notizen zur Umsetzung

Hier waehrend der Umsetzung Rueckmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `src/meals/ui/SuppliesArea.tsx` — die leere Seite aus MZP-010
- `src/meals/ui/MealsArea.tsx` — Vorbild fuer den Seitenschalter
- `src/meals/ui/MealListPage.tsx`, `MealListRow.tsx` — Vorbild fuer Kopfzeile und Zeile
- `src/meals/ui/WeekPlanRow.tsx:29-74` — Gerichtauswahl mit Vorschlaegen
- `src/meals/domain/mealSuggestions.ts:21-34` — `suggestMeals`, blendet den
  Volltreffer aus
- `src/meals/ui/MealFormPage.tsx:58-68` — Fehlerbehandlung beim Speichern
- `src/meals/ui/DeleteMealPage.tsx` — Vorbild der Bestaetigungsseite
- `src/meals/api/firestoreMealsClient.ts` — Vorbild des Adapters auf eine Sammlung
- `firestore.rules`, `firestore.rules.test.ts` — Freigabe je Sammlung
- `docs/agents/plans/2026-09-22-navigationsleiste-mit-icons-und-vorraeten.md` —
  Herkunft des Bereichs, Entscheidung 3 zur Kontextzugehoerigkeit
- `docs/notes.txt` — "Eisfach-Memory" unter TODO, Hinweis zum Ausrollen der
  Firestore-Regeln
