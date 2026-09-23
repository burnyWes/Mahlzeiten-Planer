---
date: 2026-09-23T12:58:35+00:00
git_commit: b646d96d8178794abde07d1d088663ea60e5ee99
branch: main
story: MZP-016
topic: "Gericht ausblenden"
tags: [plan, meals, weekPlan, randomPlanning]
status: done
---

# PLAN: MZP-016 — Gericht ausblenden

Ein Gericht soll bewusst aus der Zufallsauswahl des Wochenplans genommen und wieder
hineingegeben werden können — für die Zeit, in der niemand Eintopf will, ohne das
Gericht samt Rezept zu löschen. Der Umschalter wird ein vierter Knopf auf der
Gericht-Seite mit Glühbirnen-Icon: leuchtend heißt »wird gewürfelt«, erloschen heißt
»ruht«.

Löst den Punkt `- Gericht im Wochenplan ausblenden können` aus `docs/notes.txt`.
Alle Entscheidungen stammen aus der Befragung vom 2026-09-23.

## Akzeptanzkriterien

- Die Gericht-Seite zeigt unten **vier** gleich breite Knöpfe in dieser Reihenfolge:
  Einkaufswagen, Glühbirne, Stift, Mülleimer. Keiner zeigt sichtbaren Text.
- Ist das Gericht sichtbar, leuchtet die Birne und VoiceOver liest den Knopf als
  `Ausblenden`. Ist es ausgeblendet, ist die Birne erloschen und der Knopf heißt
  `Einblenden`.
- Der Druck schaltet um, die Gericht-Seite bleibt stehen, und die Ansage lautet
  `Bolognese ausgeblendet.` beziehungsweise `Bolognese eingeblendet.`
- Der Zustand überlebt ein Neuladen und erscheint auf dem zweiten Gerät.
- In der Gerichteliste liest VoiceOver ein ausgeblendetes Gericht als
  `Bolognese, ausgeblendet`, ein sichtbares weiter nur `Bolognese`. Sichtbar steht
  links vom Namen eines ausgeblendeten Gerichts eine erloschene Birne
  (`aria-hidden`); der Zeilentext bleibt der reine Name.
- Die Überschrift der Liste bleibt `Gerichte, 12` und zählt alle Gerichte.
- Ein ausgeblendetes Gericht bearbeiten und speichern lässt es ausgeblendet. Ein neu
  angelegtes Gericht ist sichtbar.
- `Zufallsauswahl generieren` und der Würfel je Tag wählen **nie** ein ausgeblendetes
  Gericht.
- Sind alle Gerichte ausgeblendet, sind der Wochen-Würfel und alle sieben
  Tages-Würfel gesperrt. Ohne jedes Gericht sind sie das wie bisher.
- Ein ausgeblendetes Gericht bleibt überall sonst erreichbar: Tippvorschläge im
  Wochenplan, Gerichteliste, Vorräte-Seite, Einkaufsliste, Item-Namensvorschläge.
- Ausblenden räumt den Wochenplan nicht auf: ein bereits geplanter Tag behält sein
  Gericht. Nur `Zufallsauswahl generieren` ersetzt wie bisher die ganze Woche.
- Vorräte bleiben unberührt; ein ausgeblendetes Gericht darf im Eisfach liegen und
  deckt seine geplanten Tage weiter.

## Wesentliche Entscheidungen und Abwägungen

1. **Der Knopf sitzt auf der Gericht-Seite, nicht in der Liste:** vierter Knopf in
   der `BottomBar`.
   - Warum: Ausblenden ist ein seltener, bewusster Akt; die Liste wird oft
     durchgehört. Ein dritter Knopf je Zeile kostet bei 30 Gerichten 30 zusätzliche
     VoiceOver-Stopps für die *häufige* Handlung. Die Gericht-Seite ist schon der Ort
     für alles, was das ganze Gericht betrifft.
   - Auswirkung: `MealListRow` bleibt zweispaltig. Vier Knöpfe teilen sich die
     Breite (`.bottomBarContent button { flex: 1 }`, `index.css:341-349`); auf 375 px
     bleiben je Knopf rund 74 px, klar über den 44 px aus MZP-008.

2. **Der Überblick kommt aus dem Namen, nicht aus einem zweiten Knopf:** das
   `aria-label` des Namensknopfs lautet `Bolognese, ausgeblendet`.
   - Warum: sonst müsste man jedes Gericht öffnen, um zu erfahren, welche ruhen.
     Dasselbe Muster trägt schon die Schneeflocke im Wochenplan
     (`weekdayFieldLabel`, `announcements.ts:121-123`).
   - Auswirkung: der sichtbare Text der Zeile bleibt der Name — `shownMealNames()`
     in `MealsArea.test.tsx:134-138` liest `textContent` und bleibt grün. Wer ein
     ausgeblendetes Gericht im Test öffnet, muss aber den vollen Namen
     `Bolognese, ausgeblendet` verwenden.

3. **Ausgeblendet heißt nur »wird nicht gewürfelt«:** gefiltert wird allein, was in
   `randomPlanning` geht.
   - Warum: wer ein ruhendes Gericht ausnahmsweise doch einplanen will, tippt seinen
     Namen in den Tag; sonst bliebe nur einblenden, planen, wieder ausblenden. In der
     Liste muss es stehen bleiben, sonst ist der Einblenden-Knopf unerreichbar.
   - Auswirkung: fünf der sechs `meals`-Verbraucher bleiben unverändert. Die
     Reichweite steht im Namen der Filterfunktion `randomCandidates`, deshalb darf
     das Feld kurz `hidden` heißen.

4. **Feld `hidden` am Gericht, Umschalten über das vorhandene `changeMeal`:** kein
   neues Client-Verfahren, keine neue Sammlung, keine Änderung an
   `firestore.rules`.
   - Warum: `changeMeal` schreibt das Dokument mit `setDoc` sowieso komplett neu
     (`firestoreMealsClient.ts:86-88`). Ein fehlendes Feld in Firestore bedeutet
     sichtbar, also braucht kein bestehendes Dokument eine Migration.
   - Auswirkung: `hidden` wird **Pflichtfeld** von `NewMeal`. Neun Test-Fabriken,
     zwei `NewMeal`-Literale in `announcements.test.ts` und vier vollständige
     Erwartungsobjekte ziehen nach; der Compiler findet jede Stelle. Optional (`hidden?: boolean`) wäre billiger, würde aber `?? false` durch
     den Code streuen.

5. **`createMeal` bekommt `hidden` als dritten Parameter ohne Standardwert.**
   - Warum: das ist der wahrscheinlichste Fehler des Vorhabens — reicht
     `MealFormPage` den Zustand nicht durch, löscht jedes Speichern das Ausblenden
     still weg. Ein Standardwert `false` würde genau diesen Fehler verstecken.
   - Auswirkung: die sechs `createMeal`-Aufrufe in `meal.test.ts` bekommen das
     Argument, und ein eigener Test deckt das Bearbeiten eines ausgeblendeten
     Gerichts ab.

6. **Icon zeigt den Zustand, `aria-label` die Handlung.**
   - Warum: das Auge soll sehen, wie es gerade steht; VoiceOver muss hören, was der
     Druck tut.
   - Auswirkung: zwei neue Icon-Dateien im Stil der vorhandenen (Lucide, `viewBox
     0 0 24 24`, `strokeWidth 2`, `aria-hidden`), `LightbulbIcon` und
     `LightbulbOffIcon` unter `src/meals/ui/`.

7. **Die Birne in der Liste belegt keinen Platz, wenn nichts ausgeblendet ist:** die
   Marke wird nur für ausgeblendete Gerichte gerendert.
   - Warum: anders als im Wochenplan, wo die Tagesfelder untereinander ausgerichtet
     bleiben müssen (`.supplyMark` mit fester Breite, `index.css:373-379`), gibt es
     in der Gerichteliste keine Spalten zum Ausrichten. 24 px plus Abstand in jeder
     Zeile gingen dem Namen verloren.
   - Auswirkung: `.hiddenMark` bekommt nur `flex: none`, keine feste Breite.

8. **Die Würfel werden anhand der Kandidaten gesperrt**, nicht anhand aller
   Gerichte.
   - Warum: sonst tut ein bedienbarer Knopf beim Druck stumm nichts, sobald alles
     ausgeblendet ist — für VoiceOver die schlechteste Rückmeldung.
   - Auswirkung: `WeekPlanPage` und `WeekPlanRow` bekommen `randomCandidateCount`
     von `WeekPlanArea`, das `randomCandidates` einmal bildet.

9. **`useMeals` bleibt ohne `unconfirmedWrites`-Schutz.**
   - Warum: eigenständiges Thema, das Wochenplan, Vorräte und Gerichte gleichermaßen
     betrifft und in `docs/notes.txt` offen steht.
   - Auswirkung: theoretisch kann eine verspätete Momentaufnahme den gerade
     umgeschalteten Zustand kurz zurücksetzen. Beim Umschalten fällt das kaum auf,
     weil danach nichts weiter passiert; ein zweiter Druck korrigiert es. Kein neuer
     Eintrag in `notes.txt` nötig.

## Ausgangslage

Das Gericht kennt heute keine Sichtbarkeit (`meal.ts:16-25`):

```
NewMeal { name, items[], ingredientNotes, recipe }
Meal    = NewMeal + { id }
```

Alle sechs Verbraucher bekommen denselben Strom `meals.meals` — nach Namen sortiert
in `useMeals.ts:29`:

```
SignedInApp.tsx:104   useMeals(mealsClient) -> { meals, addMeal, changeMeal, removeMeal }
       |
       +-- WeekPlanArea.tsx:57   pickMealForDay(meals, ...)     Wuerfel je Tag
       +-- WeekPlanArea.tsx:63   filledWeekPlan(meals, ...)     Wuerfel fuer die Woche
       +-- WeekPlanRow.tsx:84    suggestMeals(meals, typed)     Tippvorschlaege
       +-- MealsArea.tsx:106     MealListPage                   Gerichteliste
       +-- SuppliesArea          AddSupplyPage.tsx:87            Vorrat anlegen
       +-- SignedInApp.tsx:138   suggestKnownNames               Item-Namen
```

Gesperrt wird heute anhand aller Gerichte:

```
WeekPlanPage.tsx:68   disabled={meals.length === 0}   "Zufallsauswahl generieren"
WeekPlanRow.tsx:77    disabled={meals.length === 0}   "Zufallsgericht fuer <Tag>"
```

Die Gericht-Seite und die Listenzeile:

```
MealPage.tsx:66-80                          MealListRow.tsx:10-35
+-----------------------------------+       +----------------------------------+
| Bolognese                         |       | [ Bolognese          ] [Wagen]   |
| Einkaufs-Items, 4                 |       | [ Chili              ] [Wagen]   |
| Zutaten / Rezept ...              |       | [ Pizza              ] [Wagen]   |
+-----------------------------------+       +----------------------------------+
| [Wagen]  [Stift]  [Muelleimer]    |         Name flex:1, Icon-Knopf rechts
+-----------------------------------+
  aria-labels: "Auf die Einkaufsliste",
  "Bearbeiten", "Loeschen" (MZP-008)
```

Der Schreibweg eines geänderten Gerichts — das Dokument wird immer ganz ersetzt:

```
MealsArea.tsx:52-60  saveMeal -> meals.changeMeal(id, newMeal)
       |
       v
useMeals.ts:25-28    client.changeMeal(id, meal)
       |
       v
firestoreMealsClient.ts:86-88   setDoc(mealDocument(id), toDocument(changed))
                                `- toDocument schreibt genau vier Felder
```

## Zielbild

```
NewMeal { name, items[], ingredientNotes, recipe, hidden }
```

Die Gericht-Seite, beide Zustände:

```
sichtbar                                    ausgeblendet
+-----------------------------------+       +-----------------------------------+
| Bolognese                         |       | Bolognese                         |
| Einkaufs-Items, 4                 |       | Einkaufs-Items, 4                 |
+-----------------------------------+       +-----------------------------------+
| [Wagen] [ (*) ] [Stift] [Muell]   |       | [Wagen] [ (o) ] [Stift] [Muell]   |
+-----------------------------------+       +-----------------------------------+
  (*) LightbulbIcon                          (o) LightbulbOffIcon
  aria-label "Ausblenden"                    aria-label "Einblenden"
  Druck -> "Bolognese ausgeblendet."         Druck -> "Bolognese eingeblendet."
```

Die Gerichteliste, Chili ruht:

```
+----------------------------------+
| [ Bolognese          ] [Wagen]   |   VoiceOver: "Bolognese"
| (o) [ Chili          ] [Wagen]   |   VoiceOver: "Chili, ausgeblendet"
| [ Pizza              ] [Wagen]   |   VoiceOver: "Pizza"
+----------------------------------+
  (o) = erloschene Birne, aria-hidden, nur fuer ausgeblendete Zeilen
  Ueberschrift unveraendert: "Gerichte, 3"
```

Der Weg des Umschalters:

```
MealPage  [Birne]
   |
   v
MealsArea  switchHiding(meal)
   1. meals.changeMeal(meal.id, withHiding(meal, !meal.hidden))
   2. announce(mealHidingAnnouncement(meal, !meal.hidden))
   -- die Seite bleibt auf { kind: 'meal', id }, das Label kippt mit
      der naechsten Momentaufnahme
```

Die Zufallsauswahl bekommt künftig gefilterte Kandidaten:

```
WeekPlanArea
   const candidates = randomCandidates(meals)      randomPlanning.ts, neu
   shuffleDay:   pickMealForDay(candidates, plan, day, random)
   shuffleWeek:  filledWeekPlan(candidates, random)
   WeekPlanPage randomCandidateCount={candidates.length}
                     |
                     +-- BottomBar   disabled={randomCandidateCount === 0}
                     +-- WeekPlanRow disabled={randomCandidateCount === 0}
                         `- suggestMeals bekommt weiter ALLE meals
```

Ein Durchlauf mit zwei von drei Gerichten sichtbar:

```
Gerichte:    Bolognese (sichtbar), Chili (ausgeblendet), Pizza (sichtbar)
candidates:  [Bolognese, Pizza]

"Zufallsauswahl generieren" -> Mo..So nur Bolognese und Pizza, nie Chili
Ansage unveraendert:           "Wochenplan neu gewuerfelt, 7 Gerichte."

Chili bleibt trotzdem: in der Liste, in den Tippvorschlaegen des Wochenplans,
auf der Vorraete-Seite und als Quelle fuer die Einkaufsliste.
```

## Abstraktionen und Wiederverwendung

Neu entstehen vier reine Funktionen und zwei Icon-Komponenten. Alles andere nutzt
vorhandene Muster: `withHiding` reiht sich an `withSupply` und `withMealOnDay`,
`mealNameLabel` an `weekdayFieldLabel`, die Marke in der Zeile an `.supplyMark`.

- `src/meals/domain`
  - `meal.ts` — das Gericht kennt seine Sichtbarkeit
    - `NewMeal` — Pflichtfeld `hidden: boolean`
    - `createMeal` — dritter Parameter `hidden`, ohne Standardwert
    - `withHiding` — neu, `(meal: Meal, hidden: boolean) => NewMeal`
  - `meal.test.ts` — Fabrik und sechs `createMeal`-Aufrufe, Tests für `withHiding`
  - `randomPlanning.ts` — die Kandidaten der Zufallsauswahl
    - `randomCandidates` — neu, `(meals) => meals.filter((meal) => !meal.hidden)`
  - `randomPlanning.test.ts` — Fabrik, Tests für `randomCandidates`
  - `announcements.ts` — Beschriftungen und Ansage
    - `hidingLabel` — neu, `Ausblenden` / `Einblenden`
    - `mealNameLabel` — neu, `Bolognese, ausgeblendet` / `Bolognese`
    - `mealHidingAnnouncement` — neu, `Bolognese ausgeblendet.` / `… eingeblendet.`
  - `announcements.test.ts` — Tests für die drei, Literale um `hidden` ergänzt
  - `mealSuggestions.test.ts`, `supply.test.ts`, `weekPlan.test.ts` — Fabriken
- `src/meals/api`
  - `firestoreMealsClient.ts` — Feld lesen und schreiben
    - `toMeal` — `hidden: stored.hidden === true`
    - `toDocument` — `hidden: meal.hidden`
- `src/meals/ui`
  - `LightbulbIcon.tsx` — neu, leuchtende Birne
  - `LightbulbOffIcon.tsx` — neu, erloschene Birne
  - `MealPage.tsx` — vierter Knopf zwischen Wagen und Stift
  - `MealListRow.tsx` — Marke und `aria-label` am Namensknopf
  - `MealsArea.tsx` — `switchHiding`, an `MealPage` verdrahtet
  - `MealFormPage.tsx` — `hidden` des bearbeiteten Gerichts durchreichen
  - `MealsArea.test.tsx` — Fabrik, fünf Erwartungsobjekte, neue Tests
  - `WeekPlanArea.tsx` — `randomCandidates` einmal bilden und weitergeben
  - `WeekPlanPage.tsx`, `WeekPlanRow.tsx` — `randomCandidateCount` statt
    `meals.length` für `disabled`
  - `WeekPlanArea.test.tsx`, `SuppliesArea.test.tsx` — Fabriken, neue Tests
- `src`
  - `SignedInApp.test.tsx` — Fabrik
- `src/index.css`
  - `.hiddenMark` — neu, neben `.supplyMark`
- `e2e`
  - `emulatorHousehold.ts` — `hiddenMealNamesOnServer`, neu, nach dem Vorbild von
    `supplyCountsOnServer`
  - `meals.spec.ts` — Umschalten überlebt das Neuladen
  - `weekPlan.spec.ts` — der Würfel meidet das ausgeblendete Gericht
- `docs`
  - `notes.txt` — den offenen Punkt auf `x` setzen und nach DONE verschieben

Nicht angefasst werden `mealSuggestions.ts`, `weekPlan.ts`, `supply.ts`,
`useMeals.ts`, `inMemoryMealsClient.ts` (verteilt `NewMeal` per Spread),
`AddSupplyPage.tsx`, `SuppliesArea.tsx`, `firestore.rules` und
`useWeekPlan.ts`.

## Logging und Beobachtbarkeit

Die App hat kein Logging; beobachtbar ist sie allein über die VoiceOver-Ansagen aus
`announce`. Neu kommt genau eine Ansage hinzu:

```
Bolognese ausgeblendet.
Bolognese eingeblendet.
```

Scheitert das Schreiben in Firestore, greift wie bisher `onWriteFailure`, das in
`SignedInApp.tsx:94` auf `announce` verdrahtet ist und `Konnte nicht gespeichert
werden.` sagt.

## Umsetzung

### Phase 1: Das Gericht kennt das Ausblenden und der Knopf schaltet es um

Abhängigkeiten: keine.

Das Gericht bekommt `hidden`, die Gericht-Seite den vierten Knopf, die Listenzeile
den Zustand im Namen. Die Zufallsauswahl **ignoriert das Feld in dieser Phase noch**
— sie würfelt weiter über alle Gerichte. Damit bleiben `WeekPlanArea.tsx`,
`WeekPlanPage.tsx` und `WeekPlanRow.tsx` unberührt und deren Tests ohne Änderung
grün. Der Umschalter ist am Ende dieser Phase aber vollständig, bis hinunter zum
gespeicherten Dokument.

**Aufgaben**:

- [x] `NewMeal` in `src/meals/domain/meal.ts` um `hidden: boolean` erweitern und
      `createMeal` einen dritten Parameter geben. Erst die Tests in `meal.test.ts`:
      ein neu angelegtes Gericht ist sichtbar, `createMeal(draft, items, true)`
      liefert ein ausgeblendetes.
      ```ts
      export function createMeal(
        draft: MealDraft,
        items: readonly MealItem[],
        hidden: boolean,
      ): NewMeal
      ```
- [x] `withHiding` in `meal.ts` test-getrieben anlegen — gibt ein `NewMeal` zurück,
      lässt alle anderen Felder unverändert und trägt die `id` nicht mit, weil
      `changeMeal` sie getrennt bekommt.
      ```ts
      export function withHiding(meal: Meal, hidden: boolean): NewMeal {
        return {
          name: meal.name,
          items: meal.items,
          ingredientNotes: meal.ingredientNotes,
          recipe: meal.recipe,
          hidden,
        }
      }
      ```
- [x] `hidingLabel`, `mealNameLabel` und `mealHidingAnnouncement` in
      `src/meals/domain/announcements.ts` test-getrieben ergänzen, neben
      `mealSavedAnnouncement`.
      ```ts
      export function hidingLabel(hidden: boolean): string {
        return hidden ? 'Einblenden' : 'Ausblenden'
      }

      export function mealNameLabel(meal: NewMeal): string {
        return meal.hidden ? `${meal.name}, ausgeblendet` : meal.name
      }

      export function mealHidingAnnouncement(
        meal: NewMeal,
        hidden: boolean,
      ): string {
        return hidden
          ? `${meal.name} ausgeblendet.`
          : `${meal.name} eingeblendet.`
      }
      ```
      `hidingLabel` bekommt den **heutigen** Zustand und nennt die Handlung: ein
      sichtbares Gericht (`hidden: false`) zeigt `Ausblenden`.
- [x] Die Test-Fabriken um `hidden: false` ergänzen: `meal.test.ts:18`,
      `mealSuggestions.test.ts:6`, `randomPlanning.test.ts:19`,
      `supply.test.ts:22`, `weekPlan.test.ts:20`, `MealsArea.test.tsx:12`,
      `SuppliesArea.test.tsx:16`, `WeekPlanArea.test.tsx:26`,
      `SignedInApp.test.tsx:74`, dazu die Literale in `announcements.test.ts:38-43`
      und `announcements.test.ts:296-302`.
- [x] `firestoreMealsClient.ts` Feld lesen und schreiben lassen:
      `toMeal` mit `hidden: stored.hidden === true` (fehlendes Feld heißt sichtbar),
      `toDocument` mit `hidden: meal.hidden`.
- [x] `LightbulbIcon.tsx` und `LightbulbOffIcon.tsx` unter `src/meals/ui/` anlegen,
      Aufbau wie `ShuffleIcon.tsx` — `className="buttonIcon"`, `viewBox="0 0 24 24"`,
      `fill="none"`, `stroke="currentColor"`, `strokeWidth="2"`,
      `aria-hidden="true"`, `focusable="false"`. Pfade aus dem Lucide-Satz
      (`lightbulb`, `lightbulb-off`), die erloschene Birne mit dem durchgehenden
      Schrägstrich.
- [x] `MealPage.tsx` einen vierten Knopf zwischen Wagen und Stift geben, mit
      `onSwitchHiding` als neuer Prop.
      ```tsx
      <button
        type="button"
        onClick={onSwitchHiding}
        aria-label={hidingLabel(meal.hidden)}
      >
        {meal.hidden ? <LightbulbOffIcon /> : <LightbulbIcon />}
      </button>
      ```
- [x] `MealsArea.tsx` `switchHiding` geben und an `MealPage` verdrahten. Der
      künftige Zustand wird einmal berechnet und für Schreiben und Ansage benutzt.
      ```tsx
      function switchHiding(meal: Meal) {
        const hidden = !meal.hidden
        meals.changeMeal(meal.id, withHiding(meal, hidden))
        announce(mealHidingAnnouncement(meal, hidden))
      }
      ```
- [x] `MealListRow.tsx` die Marke und das `aria-label` geben. Die Marke steht als
      Geschwister **vor** dem Namensknopf, damit `shownMealNames()` weiter den
      reinen Namen liest.
      ```tsx
      {meal.hidden && (
        <span className="hiddenMark" aria-hidden="true">
          <LightbulbOffIcon />
        </span>
      )}
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenMeal(meal)}
        aria-label={mealNameLabel(meal)}
      >
        {meal.name}
      </button>
      ```
- [x] `.hiddenMark` in `src/index.css` neben `.supplyMark` ergänzen: `flex: none`
      und `display: flex` für die senkrechte Mitte, **keine** feste Breite.
- [x] `MealFormPage.tsx:60` den Zustand durchreichen:
      `onSave(createMeal(draft, items, editedMeal?.hidden ?? false))`.
- [x] Die vier vollständigen Erwartungsobjekte um `hidden: false` ergänzen:
      `MealsArea.test.tsx:177-186` und `:367-376` sowie `meal.test.ts:59-75` und
      `:114-119`. Die `meal(…, { … })`-Aufrufe mit `parts` brauchen nichts, weil die
      Fabrik das Feld setzt.
- [x] Tests in `MealsArea.test.tsx` ergänzen:
      - `hides a meal and says so` — Gericht öffnen,
        `Ausblenden` drücken; `client.storedMeals()` steht auf `hidden: true`, die
        Ansage lautet `Suppe ausgeblendet.`, die Überschrift `Suppe` ist noch da und
        der Knopf heißt jetzt `Einblenden`.
      - `shows a hidden meal again` — zweiter Druck, `hidden: false`, Ansage
        `Suppe eingeblendet.`
      - `names a hidden meal as hidden in the list` — die Zeile ist über
        `getByRole('button', { name: 'Suppe, ausgeblendet' })` zu finden, ihr
        `textContent` bleibt `Suppe`, und ein sichtbares Gericht heißt weiter `Suppe`.
      - `keeps a meal hidden when it is edited` — ausgeblendetes Gericht öffnen,
        `Bearbeiten`, Rezept ändern, `Speichern`; `storedMeals()` steht danach
        weiter auf `hidden: true`.
      - `shows the actions of a meal as icons only in one row` (Zeile 491) um den
        vierten Knopf erweitern: die Reihenfolge ist
        `['Auf die Einkaufsliste', 'Ausblenden', 'Bearbeiten', 'Löschen']`, alle vier
        ohne sichtbaren Text und alle vier Kinder desselben Elternelements.
      - `has no accessibility violations on a meal` (Zeile 585) zusätzlich mit einem
        ausgeblendeten Gericht prüfen.
- [x] `hiddenMealNamesOnServer` in `e2e/emulatorHousehold.ts` ergänzen, nach dem
      Vorbild von `supplyCountsOnServer` (Zeile 116-129).
      ```ts
      type ListedMeals = {
        documents?: readonly {
          fields: {
            name: { stringValue: string }
            hidden?: { booleanValue?: boolean }
          }
        }[]
      }

      export async function hiddenMealNamesOnServer(): Promise<readonly string[]> {
        // GET .../documents/meals wie in itemNamesOnServer
        return (listed.documents ?? [])
          .filter((document) => document.fields.hidden?.booleanValue === true)
          .map((document) => document.fields.name.stringValue)
      }
      ```
- [x] `e2e/meals.spec.ts` einen Test `keeps a meal hidden after a reload` ergänzen:
      Gericht anlegen, `Ausblenden` drücken, dann
      `await expect.poll(hiddenMealNamesOnServer).toEqual(['Bolognese'])`,
      `page.reload()`, `Gerichte` öffnen, die Zeile über
      `getByRole('button', { name: 'Bolognese, ausgeblendet' })` anklicken und
      erwarten, dass der Knopf `Einblenden` heißt. **Das Warten auf den Server ist
      Pflicht**, nicht Vorsicht: ausstehende Schreibvorgänge überleben kein
      Neuladen (offener Punkt zu `persistentLocalCache` in `docs/notes.txt`), und
      `keeps the week plan after a reload` (`e2e/weekPlan.spec.ts:113-136`) macht es
      deshalb genauso. Ein erneutes Anmelden ist nicht nötig.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `createMeal({ name: 'Suppe', ingredientNotes: '', recipe: '' }, [], false)`
      liefert ein Gericht mit `hidden: false`.
- [x] `withHiding(meal, true)` lässt Name, Items, Zutaten und Rezept unverändert und
      enthält keine `id`.
- [x] `hidingLabel(false)` ergibt `Ausblenden`, `hidingLabel(true)` ergibt
      `Einblenden`.
- [x] `mealNameLabel` ergibt `Bolognese, ausgeblendet` für ein ausgeblendetes und
      `Bolognese` für ein sichtbares Gericht.
- [x] `mealHidingAnnouncement(bolognese, true)` ergibt
      `Bolognese ausgeblendet.`, mit `false` `Bolognese eingeblendet.`
- [x] Der Test `keeps a meal hidden when it is edited` ist grün — das Formular
      verliert den Zustand nicht.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `WeekPlanArea.test.tsx` und `SignedInApp.test.tsx` bleiben inhaltlich
      unverändert grün — nur ihre Fabriken haben ein Feld mehr.
- [x] `npm run test:e2e` läuft durch; `keeps a meal hidden after a reload` sieht das
      ausgeblendete Gericht auf dem Server und nach dem Neuladen in der App.

### Phase 2: Die Würfel überspringen ausgeblendete Gerichte

Abhängigkeiten: Phase 1.

Beide Würfel bekommen nur noch die sichtbaren Gerichte und sperren, wenn keines
übrig ist.

**Aufgaben**:

- [x] `randomCandidates` in `src/meals/domain/randomPlanning.ts` test-getrieben
      anlegen. Erst die Tests in `randomPlanning.test.ts`: ausgeblendete Gerichte
      fallen heraus, die Reihenfolge der übrigen bleibt, ohne Gerichte kommt eine
      leere Liste.
      ```ts
      export function randomCandidates(
        meals: readonly Meal[],
      ): readonly Meal[] {
        return meals.filter((meal) => !meal.hidden)
      }
      ```
- [x] `WeekPlanArea.tsx` die Kandidaten einmal bilden und an beide Würfel geben:
      `pickMealForDay(candidates, ...)` in `shuffleDay` (Zeile 57) und
      `filledWeekPlan(candidates, random)` in `shuffleWeek` (Zeile 63).
      `chooseMeal` sucht das Gericht weiter in **allen** `meals`, damit ein per
      Vorschlag gewähltes ausgeblendetes Gericht seine Ansage behält.
- [x] `WeekPlanPage.tsx` eine Prop `randomCandidateCount: number` geben, damit
      `disabled={randomCandidateCount === 0}` (Zeile 68) gilt, und sie an
      `WeekPlanRow` weitergeben. `meals` bleibt für `plannedDayCount` und die
      Vorschläge unverändert.
- [x] `WeekPlanRow.tsx` dieselbe Prop annehmen und `disabled={meals.length === 0}`
      (Zeile 77) darauf umstellen. `suggestMeals(meals, …)` (Zeile 84) bleibt auf
      allen Gerichten.
- [x] Tests in `WeekPlanArea.test.tsx` ergänzen:
      - `never rolls a hidden meal for a day` — zwei Gerichte, eines ausgeblendet;
        der Tages-Würfel liefert mit jedem Zufallswert das sichtbare.
      - `never rolls a hidden meal into the week` — `Zufallsauswahl generieren`
        füllt alle sieben Tage, keiner trägt das ausgeblendete Gericht.
      - `offers no rolling when every meal is hidden` — analog zu
        `offers no rolling without a stored meal` (Zeile 492): Wochen-Würfel und
        alle sieben Tages-Würfel sind gesperrt.
      - `suggests a hidden meal for a day anyway` — Tippen auf drei Buchstaben des
        ausgeblendeten Gerichts zeigt es als Vorschlag, und der Druck darauf plant
        es mit der gewohnten Ansage ein.
      - `leaves a hidden meal standing where it was planned` — ein ausgeblendetes
        Gericht bleibt auf seinem Tag, und die Überschrift zählt den Tag mit.
- [x] `e2e/weekPlan.spec.ts` einen Test `never rolls a hidden meal into the week`
      ergänzen: zwei Gerichte anlegen, eines ausblenden, `Zufallsauswahl
      generieren`, dann über `expect.poll(weekPlanOnServer)` prüfen, dass alle
      sieben Tage dieselbe Gericht-Id tragen — die des sichtbaren.
- [x] Nach der Prüfung am Gerät in `docs/notes.txt` den Punkt
      `- Gericht im Wochenplan ausblenden können` auf `x` setzen und unverändert
      formuliert nach DONE verschieben.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `randomCandidates([bolognese, hiddenChili, pizza])` liefert
      `[bolognese, pizza]`.
- [x] `filledWeekPlan` und `pickMealForDay` bekommen in `WeekPlanArea` nie ein
      ausgeblendetes Gericht — belegt durch `never rolls a hidden meal for a day`
      und `never rolls a hidden meal into the week`.
- [x] Bei ausschließlich ausgeblendeten Gerichten sind `Zufallsauswahl generieren`
      und alle sieben `Zufallsgericht für …` gesperrt.
- [x] Die Tippvorschläge zeigen ein ausgeblendetes Gericht weiter an und planen es
      auf Druck ein.
- [x] `npm run lint` läuft durch.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `npm run test:e2e` läuft durch, einschließlich `never rolls a hidden meal
      into the week`.

**Manuelle Verifikation**:

- [x] Auf dem Gerät mit VoiceOver: ein Gericht öffnen, den zweiten Knopf der
      unteren Leiste finden — er heißt `Ausblenden` —, drücken und die Ansage
      `<Gericht> ausgeblendet.` hören. Der Knopf heißt danach `Einblenden`.
- [x] Auf der Gerichteliste hören, dass die Zeile jetzt
      `<Gericht>, ausgeblendet` gelesen wird, und sehen, dass links die erloschene
      Birne steht.
- [x] Im Wochenplan mehrfach `Zufallsauswahl generieren` drücken: das
      ausgeblendete Gericht kommt nicht vor. Seinen Namen in einen Tag tippen: der
      Vorschlag erscheint und lässt sich einplanen.
- [x] Die App auf dem zweiten Gerät öffnen und prüfen, dass das Gericht dort
      ebenfalls ausgeblendet ist.
- [x] Alle vier Knöpfe der unteren Leiste sind mit dem Finger gut zu treffen.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- `.hiddenMark` steht in `src/index.css` bei den Zeilenstilen der Gerichteliste,
  direkt vor `.mealNameButton`, statt bei `.supplyMark` im Wochenplan-Block. Die
  Regel selbst ist wie geplant: `flex: none` und `display: flex`, keine feste Breite.
- `createMeal` hat statt der geplanten sechs sieben Aufrufe in `meal.test.ts`; alle
  haben das dritte Argument bekommen.
- Der e2e-Test `never rolls a hidden meal into the week` prüft über
  `weekPlanOnServer`, dass alle sieben Tage **eine** Gericht-Id tragen, und liest
  zusätzlich Montag und Sonntag als `Bolognese` aus der Oberfläche.

**2026-09-23 — am Gerät geprüft.** Der Umschalter, die Ansagen, die Zeile in der
Gerichteliste, die Würfel und das zweite Gerät verhalten sich wie geplant. Die
manuelle Verifikation ist abgehakt, der Plan ist abgeschlossen.

## Verweise

- `docs/agents/plans/2026-09-17-icon-knoepfe-am-gericht.md` — MZP-008, legt die
  Knopfleiste der Gericht-Seite und die Regel »Name im `aria-label`« fest.
- `docs/agents/plans/2026-09-19-wochenplan-mit-zufallsauswahl.md` — MZP-011, führt
  `randomPlanning` und die Würfel ein.
- `docs/agents/plans/2026-09-22-vorraete-verbrauch-im-wochenplan.md` — MZP-013,
  Vorbild für Marke und `aria-label` im Wochenplan (`.supplyMark`,
  `weekdayFieldLabel`).
- `docs/notes.txt` — der offene Punkt `- Gericht im Wochenplan ausblenden können`.
