---
date: 2026-09-22T12:25:41+00:00
git_commit: f36aedb09d827dd319459de16cdc1e8bdfda68fb
branch: main
story: MZP-013
topic: "Vorräte-Verbrauch im Wochenplan"
tags: [plan, meals, weekPlan, supplies, shoppingList]
status: done
---

# PLAN: MZP-013 — Vorräte-Verbrauch im Wochenplan

Der Wochenplan kennt die Vorräte heute nicht. Wer ein Gericht einplant, das längst
im Eisfach liegt, kauft dessen Zutaten trotzdem ein. Dieser Plan bringt die Vorräte
in den Wochenplan: eine Schneeflocke markiert den gedeckten Tag, und die Übertragung
auf die Einkaufsliste lässt die Zutaten gedeckter Gerichte weg.

## Akzeptanzkriterien

- Ein Vorrat von `n` Portionen deckt die **ersten `n` Tage** der Woche, an denen
  das Gericht geplant ist. Genau diese Tage zeigen zwischen Wochentag-Kürzel und
  Eingabefeld eine Schneeflocke — bei manueller Auswahl wie bei Zufallsauswahl.
- Bolognese mit Vorrat 1, geplant am Montag und am Mittwoch: die Schneeflocke
  steht nur am Montag, der Mittwoch bleibt offen.
- Die Schneeflocke verschwindet sofort, wenn der Vorrat auf der Vorräte-Seite auf
  null geht oder am Tag ein anderes Gericht gewählt wird. Wird ein gedeckter Tag
  geleert, wandert die Marke an den nächsten Tag desselben Gerichts.
- VoiceOver liest das Eingabefeld eines gedeckten Tages als `Montag, im Vorrat`
  statt `Montag`. Das Icon selbst ist `aria-hidden` und erzeugt keinen
  zusätzlichen Wisch-Stopp.
- Der Platz für das Icon steht in jeder der sieben Zeilen, auch ohne Vorrat; alle
  Eingabefelder beginnen bündig untereinander.
- Tages-Würfel und Vorschlagsauswahl sagen `Montag, Chili con Carne, im Vorrat.`
  bzw. `Montag, Nudeln.` an. Das Wochen-Würfeln bleibt bei
  `Wochenplan neu gewürfelt, 7 Gerichte.`
- Das Leeren eines Feldes bleibt still.
- »Auf die Einkaufsliste« lässt die Zutaten der gedeckten **Tage** weg und
  überträgt die der ungedeckten. Bolognese mit Vorrat 1 an zwei Tagen liefert
  seine Zutaten also einmal.
- Die Ansage danach nennt die gedeckten Tage:
  `Wochenplan, 6 Artikel hinzugefügt. 3 Tage aus dem Vorrat.` — bei einem Tag
  `1 Tag aus dem Vorrat.`
- Sind alle geplanten Tage gedeckt, bleibt der Knopf bedienbar und sagt
  `Wochenplan, alle Gerichte aus dem Vorrat, nichts hinzugefügt.`
- Bleibt nach dem Vorrat nur noch ein Gericht ohne Einkaufs-Items übrig, beginnt
  die Ansage trotzdem mit dem Wochenplan und nicht mit einer nackten Zahl:
  `Wochenplan, nichts hinzugefügt. 2 Tage aus dem Vorrat. Suppe hat keine Einkaufs-Items.`
- Ein Gericht ohne Einkaufs-Items löst den Hinweis
  `… hat keine Einkaufs-Items.` nur noch aus, wenn mindestens einer seiner Tage
  ungedeckt ist.
- Der Vorrat wird durch die Übertragung nicht verändert.
- Die Überschrift `Wochenplan, 3 von 7` zählt weiterhin alle geplanten Tage,
  gedeckte eingeschlossen.

## Wesentliche Entscheidungen und Abwägungen

1. **Deckung nach Portionen:** ein Vorrat von `n` Portionen deckt die ersten `n`
   Tage in Wochentag-Reihenfolge, an denen das Gericht geplant ist.
   - Warum: der Vorrat ist gezählt, also zählt er auch hier. Chili mit Vorrat 2, an
     Montag, Mittwoch und Freitag geplant, deckt Montag und Mittwoch; der Freitag
     wird gekauft.
   - Auswirkung: die Deckung hängt am Tag, nicht am Gericht. `isSuppliedOn` zählt
     die früheren Tage desselben Gerichts, und die Übertragung entscheidet je Tag
     statt je Gericht.
   - Abgelöst: die erste Fassung deckte jeden Tag, an dem das Gericht stand
     (`count >= 1`), ohne Portionsrechnung. Phase 1 ist noch so gebaut, Phase 2
     zieht sie nach.

2. **Kein Abbuchen:** die Übertragung lässt die Vorräte unberührt.
   - Warum: der Knopf ist mehrfach drückbar — nach einer Planänderung etwa — und
     würde den Vorrat sonst jedes Mal erneut leeren.
   - Auswirkung: `WeekPlanArea` bekommt die Vorräte nur lesend als
     `readonly Supply[]`, nicht das ganze `Supplies`-Objekt mit seinen Schreibwegen.

3. **VoiceOver über das Feld-Label:** `aria-label` wird zu `Montag, im Vorrat`.
   - Warum: VoiceOver ist der Hauptbedienweg; ein eigenes Icon-Element wäre ein
     zusätzlicher Wisch-Stopp pro gedecktem Tag. Das Kürzel `Mo.` ist `aria-hidden`
     und kann die Information nicht tragen.
   - Auswirkung: Tests, die per `getByRole('textbox', { name: 'Montag' })` oder
     `getByLabel('Montag', { exact: true })` greifen, treffen einen gedeckten Tag
     nicht mehr — sie müssen das volle Label verwenden.

4. **Fachlogik in der Domäne:** `supply.ts` bekommt die Abfrage, `weekPlan.ts` die
   Aufteilung des Plans in »zu kaufen« und »gedeckte Tage« als ein Ergebnis-Objekt
   `WeekPlanTransfer`.
   - Warum: `WeekPlanArea` und `SignedInApp` bleiben Verdrahtung ohne Fachregeln.
   - Auswirkung: `onAddToShoppingList` reicht künftig `WeekPlanTransfer` durch statt
     der rohen Gerichteliste.

5. **Ansage-Formulierungen** bleiben in `meals/domain/announcements.ts` und werden
   dort test-getrieben festgelegt.
   - Warum: alle übrigen Ansagen der Domäne liegen schon dort.
   - Auswirkung: `dayPlannedAnnouncement` und `weekPlanTransferAnnouncement`
     bekommen je einen zusätzlichen Parameter, `weekdayFieldLabel` kommt dazu.

## Ausgangslage

Wochenplan und Vorräte laufen heute nebeneinander her:

```
SignedInApp.tsx
 ├─ useMeals      → meals.meals            Meal { id, name, items[] }
 ├─ useWeekPlan   → weekPlanning.plan      Record<Weekday, MealId|null>
 ├─ useSupplies   → supplies.supplies      Supply[] { mealId, count }
 │
 ├─ WeekPlanArea(meals, weekPlanning, …)   ← kennt supplies NICHT
 │    └─ WeekPlanPage → WeekPlanRow × 7
 └─ SuppliesArea(meals, supplies, …)       ← einziger Ort, der supplies liest
```

Die Zeile eines Tages, `src/meals/ui/WeekPlanRow.tsx:48-77`:

```
┌────────────────────────────────────────────────┐
│ Mo.   [ Chili con Carne              ]   [🎲]  │
└────────────────────────────────────────────────┘
   ^                    ^                    ^
 .weekday          aria-label=            iconButton
 aria-hidden       "Montag"               ShuffleIcon
```

Die Übertragung, `src/meals/ui/WeekPlanArea.tsx:53-55` und
`src/SignedInApp.tsx:114-123`:

```
WeekPlanArea:  onAddToShoppingList( plannedMeals(plan, meals) )
                                     └─ ein Gericht so oft, wie es geplant ist
SignedInApp:   shoppingItemsOf(planned)      alle items aller geplanten Gerichte
               shoppingList.addItems(items)  fasst gleiche Namen zusammen
               announce( weekPlanTransferAnnouncement(additions,
                                                      mealsWithoutItems(planned)) )
```

Ansagen heute:

| Auslöser | Ansage |
|---|---|
| Tages-Würfel | `Montag, Bolognese.` (`dayPlannedAnnouncement`) |
| Vorschlag angetippt | *keine* — `WeekPlanRow.tsx:38-41` setzt nur |
| Feld geleert | *keine* |
| Wochen-Würfel | `Wochenplan neu gewürfelt, 7 Gerichte.` |
| Übertragung | `Wochenplan, 14 Artikel hinzugefügt. 3 zusammengefasst. Suppe hat keine Einkaufs-Items.` |

Vorhandene Bausteine, die getragen werden:

- `SnowflakeIcon` (`src/shared/ui/SnowflakeIcon.tsx`) — schon die Marke der
  Vorräte in der Navigationsleiste, `currentColor`, `aria-hidden`, 24 px.
- `supplyOf(supplies, mealId)` (`src/meals/domain/supply.ts`) — findet den Vorrat.
- `plannedMeals`, `mealsWithoutItems` (`src/meals/domain/weekPlan.ts`).

## Zielbild

```
SignedInApp.tsx
 ├─ useSupplies   → supplies.supplies ──┐
 │                                      │  nur lesend
 ├─ WeekPlanArea(meals, weekPlanning, supplies, …)
 │    └─ WeekPlanPage(… supplies) → WeekPlanRow(… supplies)
 │                                       └─ isInSupply → Schneeflocke + Label
 │
 └─ onAddToShoppingList( WeekPlanTransfer )
        { mealsToBuy: Meal[], suppliedDays: number }
```

Die Zeile eines gedeckten Tages — Chili con Carne liegt einmal im Eisfach:

```
vorher                                     nachher
┌──────────────────────────────┐           ┌──────────────────────────────┐
│ Mo.  [ Chili con Carne ] [🎲]│           │ Mo. ❄ [ Chili con Carne ] [🎲]│
│ Di.  [ Nudeln          ] [🎲]│           │ Di.   [ Nudeln          ] [🎲]│
│ Mi.  [ Chili con Carne ] [🎲]│           │ Mi.   [ Chili con Carne ] [🎲]│
│ Do.  [                 ] [🎲]│           │ Do.   [                 ] [🎲]│
└──────────────────────────────┘           └──────────────────────────────┘
                                                 ^ Spalte steht in jeder Zeile
                                             die eine Portion ist am Montag
                                             verbraucht, der Mittwoch wird gekauft
```

VoiceOver beim Durchwischen — die Zahl der Stopps bleibt gleich:

```
"Montag, im Vorrat, Chili con Carne, Textfeld"
"Zufallsgericht für Montag, Taste"
"Dienstag, Nudeln, Textfeld"
"Zufallsgericht für Dienstag, Taste"
```

Ansagen danach:

| Auslöser | Ansage |
|---|---|
| Tages-Würfel, gedeckt | `Montag, Chili con Carne, im Vorrat.` |
| Tages-Würfel, offen | `Montag, Nudeln.` |
| Vorschlag angetippt | dieselben beiden Formen |
| Feld geleert | *keine* (unverändert) |
| Wochen-Würfel | `Wochenplan neu gewürfelt, 7 Gerichte.` (unverändert) |
| Übertragung, teils gedeckt | `Wochenplan, 6 Artikel hinzugefügt. 3 Tage aus dem Vorrat.` |
| Übertragung, ein Tag gedeckt | `Wochenplan, 6 Artikel hinzugefügt. 1 Tag aus dem Vorrat.` |
| Übertragung, alles gedeckt | `Wochenplan, alle Gerichte aus dem Vorrat, nichts hinzugefügt.` |
| Übertragung, Rest ohne Items | `Wochenplan, nichts hinzugefügt. 2 Tage aus dem Vorrat. Suppe hat keine Einkaufs-Items.` |
| Übertragung, nichts gedeckt | unverändert wie heute |

## Abstraktionen und Wiederverwendung

Genutzt wird, was da ist: `SnowflakeIcon`, `supplyOf`, `plannedMeals`,
`mealsWithoutItems`, `weekdayName`. Neu sind eine Abfrage in `supply.ts`, ein
Ergebnistyp in `weekPlan.ts` und drei Ansage-Formen.

- `src/meals/domain`
  - `supply.ts` — Abfrage ergänzen
    - `isInSupply(supplies, mealId): boolean` — neu, gebaut auf `supplyOf`
  - `weekPlan.ts` — Aufteilung des Plans ergänzen
    - `WeekPlanTransfer` — neuer Typ `{ mealsToBuy, suppliedDays }`
    - `weekPlanTransfer(plan, meals, supplies)` — neu, entscheidet je Tag
    - `isSuppliedOn(plan, day, meals, supplies)` — neu, für die Zeile; zählt die
      früheren Tage desselben Gerichts gegen die Portionen
    - `timesPlannedBefore(plan, day, mealId)` — neu, privat
    - `plannedDays(plan, meals)` — neu, privat, trägt `plannedMeals` mit
  - `announcements.ts`
    - `weekdayFieldLabel(day, inSupply)` — neu
    - `dayPlannedAnnouncement(day, meal, inSupply)` — Parameter ergänzt
    - `weekPlanTransferAnnouncement(additions, mealsWithoutItems, suppliedDays)` —
      Parameter ergänzt, Alles-gedeckt-Fall
- `src/meals/ui`
  - `WeekPlanRow.tsx` — `supplies` entgegennehmen, Icon-Spalte, Feld-Label
  - `WeekPlanPage.tsx` — `supplies` durchreichen
  - `WeekPlanArea.tsx` — `supplies` entgegennehmen, Ansage beim Wählen,
    `onAddToShoppingList` liefert `WeekPlanTransfer`
- `src`
  - `SignedInApp.tsx` — `supplies.supplies` an `WeekPlanArea`,
    `addWeekPlanToShoppingList` rechnet mit `WeekPlanTransfer`
  - `index.css` — `.supplyMark` als feste Spalte

Keine neue Sammlung in Firestore, keine Regeländerung, kein Datenmodell-Umbau.
Die Vorräte werden nur gelesen.

## Logging und Beobachtbarkeit

Keine Logs oder Metriken im Projekt. Beobachtbar ist die Änderung allein über die
Ansagen im `role="status"`-Bereich (`src/shared/ui/Announcer.tsx`), die oben
vollständig festgelegt sind.

## Umsetzung

### Phase 1: Schneeflocke am gedeckten Tag

Abhängigkeiten: keine

Der Wochenplan bekommt die Vorräte lesend, markiert gedeckte Tage optisch und im
Feld-Label und meldet die Deckung beim Wählen eines Gerichts an.

**Aufgaben**:

- [x] `src/meals/domain/supply.test.ts`: fehlschlagende Tests für `isInSupply` —
      wahr bei vorhandenem Vorrat, falsch bei unbekanntem Gericht.
- [x] `src/meals/domain/supply.ts`: `isInSupply` ergänzen.
      ```ts
      export function isInSupply(
        supplies: readonly Supply[],
        mealId: MealId,
      ): boolean {
        return supplyOf(supplies, mealId) !== null
      }
      ```
- [x] `src/meals/domain/weekPlan.test.ts`: fehlschlagende Tests für `isSuppliedOn` —
      gedeckter Tag, geplanter Tag ohne Vorrat, leerer Tag.
- [x] `src/meals/domain/weekPlan.ts`: `isSuppliedOn` ergänzen; `Supply` und
      `isInSupply` aus `./supply` importieren (gleicher Kontext, gleiche Schicht).
      ```ts
      export function isSuppliedOn(
        plan: WeekPlan,
        day: Weekday,
        meals: readonly Meal[],
        supplies: readonly Supply[],
      ): boolean {
        const planned = shownMealOn(plan, day, meals)
        return planned !== null && isInSupply(supplies, planned.id)
      }
      ```
- [x] `src/meals/domain/announcements.test.ts`: fehlschlagende Tests für
      `weekdayFieldLabel` (`Montag` / `Montag, im Vorrat`) und für
      `dayPlannedAnnouncement` in beiden Formen. Der bestehende Test in Zeile 263-269
      ruft `dayPlannedAnnouncement('monday', bolognese)` mit zwei Argumenten und
      bekommt das dritte.
- [x] `src/meals/domain/announcements.ts`: `weekdayFieldLabel` ergänzen und
      `dayPlannedAnnouncement` um `inSupply` erweitern.
      ```ts
      export function weekdayFieldLabel(day: Weekday, inSupply: boolean): string {
        return inSupply ? `${weekdayName(day)}, im Vorrat` : weekdayName(day)
      }

      export function dayPlannedAnnouncement(
        day: Weekday,
        meal: NewMeal,
        inSupply: boolean,
      ): string {
        const planned = `${weekdayName(day)}, ${meal.name}`
        return inSupply ? `${planned}, im Vorrat.` : `${planned}.`
      }
      ```
- [x] `src/meals/ui/WeekPlanRow.tsx`: `supplies` als Prop entgegennehmen, das
      geplante Gericht einmal bestimmen, Icon-Spalte vor dem Feld setzen und das
      Feld-Label aus `weekdayFieldLabel` ziehen.
      ```tsx
      const planned = shownMealOn(plan, day, meals)
      const plannedName = planned?.name ?? ''
      const inSupply = isSuppliedOn(plan, day, meals, supplies)
      …
      <span className="weekday" aria-hidden="true">{weekdayAbbreviation(day)}</span>
      <span className="supplyMark" aria-hidden="true">
        {inSupply && <SnowflakeIcon />}
      </span>
      <input aria-label={weekdayFieldLabel(day, inSupply)} … />
      ```
- [x] `src/index.css`: `.supplyMark` als feste Spalte neben `.weekday`, Breite wie
      `.buttonIcon` (24 px), `flex: none`, mittig — der Platz bleibt auch ohne Icon
      stehen.
- [x] `src/meals/ui/WeekPlanPage.tsx`: `supplies` als Prop entgegennehmen und an
      jede `WeekPlanRow` durchreichen.
- [x] `src/meals/ui/WeekPlanArea.tsx`: `supplies: readonly Supply[]` als Prop
      entgegennehmen und das Wählen eines Gerichts über eine eigene Funktion
      führen, die ansagt; `shuffleDay` nutzt sie mit.
      ```tsx
      function chooseMeal(day: Weekday, id: MealId | null) {
        weekPlanning.chooseMeal(day, id)
        const chosen = meals.find((meal) => meal.id === id)
        if (chosen === undefined) return
        announce(dayPlannedAnnouncement(day, chosen, isInSupply(supplies, chosen.id)))
      }

      function shuffleDay(day: Weekday) {
        const picked = pickMealForDay(meals, weekPlanning.plan, day, random)
        if (picked === null) return
        chooseMeal(day, picked.id)
      }
      ```
      Das Leeren eines Feldes ruft `chooseMeal(day, null)` — `find` liefert dann
      `undefined` und es wird nichts angesagt.
- [x] `src/meals/ui/WeekPlanArea.tsx`: `onChooseMeal={weekPlanning.chooseMeal}` auf
      `onChooseMeal={chooseMeal}` umstellen — ohne das bleibt die Vorschlagsauswahl
      still.
- [x] `src/meals/ui/WeekPlanRow.tsx`: den dann unbenutzten Import `weekdayName`
      entfernen, sonst wird `npm run lint` rot. `weekdayAbbreviation`,
      `randomMealLabel` und `mealSuggestionsLabel` bleiben.
- [x] `src/SignedInApp.tsx`: `supplies={supplies.supplies}` an `WeekPlanArea`
      übergeben.
- [x] `src/meals/ui/WeekPlanArea.test.tsx`: `renderWeekPlanArea` um einen Parameter
      für die Vorräte erweitern; Tests für die Schneeflocke am gedeckten Tag, für
      das Feld-Label `Montag, im Vorrat`, für das Verschwinden der Marke beim
      Wechsel auf ein Gericht ohne Vorrat, für beide Ansage-Formen beim
      Tages-Würfeln und beim Antippen eines Vorschlags sowie für die Stille beim
      Leeren des Feldes.
      Achtung beim Greifen der Felder: `dayField(name)` und `typeIntoDay(name)`
      (Zeile 105-112) suchen über den vollen Namen. Ein Tag ist erst **nach** der
      Auswahl gedeckt — vorher und direkt nach `userEvent.clear` heisst das Feld
      weiterhin `Montag`. Die neuen Tests greifen den gedeckten Tag deshalb nur in
      den Prüfungen mit `Montag, im Vorrat`, nicht beim Tippen.
- [x] `src/SignedInApp.test.tsx`: den Test
      `says nothing of its own about a day that was planned by hand` durch einen
      ersetzen, der die neue Ansage `Montag, Bolognese.` erwartet; einen Test
      ergänzen, der bei einem Vorrat für Bolognese `Montag, Bolognese, im Vorrat.`
      erwartet.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/meals/domain/supply.test.ts` — `isInSupply` grün
- [x] `npx vitest run src/meals/domain/weekPlan.test.ts` — `isSuppliedOn` grün
- [x] `npx vitest run src/meals/domain/announcements.test.ts` — Label und
      Tages-Ansage grün
- [x] `npx vitest run src/meals/ui/WeekPlanArea.test.tsx` — Schneeflocke, Label
      und Ansagen grün
- [x] `npx vitest run src/SignedInApp.test.tsx` — angepasste Wochenplan-Tests grün,
      insbesondere `has no accessibility violations on the week plan`
- [x] `npm run lint` und `npm run test` laufen durch (Architekturtest
      `test/domainLayerBoundary.test.ts` eingeschlossen)

**Manuelle Verifikation**:

- [x] Mit VoiceOver über die Wochenplan-Zeilen wischen: ein gedeckter Tag wird als
      `Montag, im Vorrat, <Gericht>, Textfeld` gelesen, ein offener als
      `Dienstag, <Gericht>, Textfeld`; die Zahl der Stopps ist in beiden Fällen
      gleich.
- [x] Bei invertierten Farben prüfen, dass die Schneeflocke sichtbar bleibt und
      die sieben Eingabefelder bündig untereinander stehen.

### Phase 2: Vorrat nach Portionen zuteilen

Abhängigkeiten: Phase 1

Phase 1 markiert jeden Tag, an dem ein Gericht mit Vorrat steht. Diese Phase
schränkt das auf die Zahl der Portionen ein: der Vorrat wandert die Woche entlang
und ist irgendwann aufgebraucht.

**Aufgaben**:

- [x] `src/meals/domain/weekPlan.test.ts`: fehlschlagende Tests für `isSuppliedOn`
      — ein Vorrat von 1 deckt bei zwei geplanten Tagen nur den früheren; ein
      Vorrat von 2 deckt bei drei Tagen die ersten zwei; ein Vorrat, der größer
      ist als die Zahl der Tage, deckt alle. Die drei Tests aus Phase 1 bleiben
      gültig, weil sie mit einem einzigen geplanten Tag arbeiten.
- [x] `src/meals/domain/weekPlan.ts`: `isSuppliedOn` auf die Portionen umstellen,
      `supplyOf` statt `isInSupply` importieren.
      ```ts
      function timesPlannedBefore(
        plan: WeekPlan,
        day: Weekday,
        mealId: MealId,
      ): number {
        return WEEKDAYS.slice(0, WEEKDAYS.indexOf(day)).filter(
          (earlier) => plan[earlier] === mealId,
        ).length
      }

      export function isSuppliedOn(
        plan: WeekPlan,
        day: Weekday,
        meals: readonly Meal[],
        supplies: readonly Supply[],
      ): boolean {
        const planned = shownMealOn(plan, day, meals)
        if (planned === null) return false
        const supply = supplyOf(supplies, planned.id)
        return (
          supply !== null &&
          timesPlannedBefore(plan, day, planned.id) < supply.count
        )
      }
      ```
      `isInSupply` bleibt in `supply.ts`, wo es steht — es beantwortet weiter die
      Frage der Vorräte-Seite. Nur der Wochenplan fragt jetzt genauer.
- [x] `src/meals/ui/WeekPlanArea.tsx`: die Ansage beim Wählen auf den Plan **nach**
      der Wahl stützen und `isInSupply` gegen `isSuppliedOn` tauschen.
      `weekPlanning.plan` ist im selben Durchlauf noch der alte Plan, deshalb
      bildet `chooseMeal` den neuen selbst.
      ```tsx
      function chooseMeal(day: Weekday, id: MealId | null) {
        weekPlanning.chooseMeal(day, id)
        const chosen = meals.find((meal) => meal.id === id)
        if (chosen === undefined) return
        const planned = withMealOnDay(weekPlanning.plan, day, id)
        announce(
          dayPlannedAnnouncement(
            day,
            chosen,
            isSuppliedOn(planned, day, meals, supplies),
          ),
        )
      }
      ```
      Danach importiert `WeekPlanArea` `isSuppliedOn` und `withMealOnDay` aus
      `../domain/weekPlan` und `isInSupply` nicht mehr — sonst wird `npm run lint`
      rot.
- [x] `src/meals/ui/WeekPlanArea.test.tsx`: Tests — bei Vorrat 1 und zwei geplanten
      Tagen trägt nur der frühere die Marke; das Würfeln eines zweiten Tages auf
      dasselbe Gericht sagt `Mittwoch, Bolognese.` ohne Vorrat-Zusatz; das Leeren
      des gedeckten Tages lässt die Marke an den späteren Tag wandern. Achtung:
      nach dem Wandern heißt das späte Feld `Mittwoch, im Vorrat`.
- [x] `src/SignedInApp.test.tsx`: Test, dass das zweite Vorkommen eines Gerichts
      mit Vorrat 1 ohne `im Vorrat` angesagt wird.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/meals/domain/weekPlan.test.ts` — Portionszuteilung grün
- [x] `npx vitest run src/meals/ui/WeekPlanArea.test.tsx` — wandernde Marke und
      Ansagen grün
- [x] `npx vitest run src/SignedInApp.test.tsx` — grün
- [x] `npm run lint` und `npm run test` laufen durch

**Manuelle Verifikation**:

- [x] Auf dem Gerät: ein Gericht mit Vorrat 1 an zwei Tagen einplanen und mit
      VoiceOver prüfen, dass nur der frühere Tag `im Vorrat` sagt. Dann den
      früheren Tag leeren und hören, dass der spätere die Marke übernimmt.

### Phase 3: Vorrat-Gerichte nicht auf die Einkaufsliste

Abhängigkeiten: Phase 2

Die Übertragung lässt gedeckte Gerichte aus und meldet, wie viele Tage der Vorrat
abgedeckt hat.

**Aufgaben**:

- [x] `src/meals/domain/weekPlan.test.ts`: fehlschlagende Tests für
      `weekPlanTransfer` — ohne Vorräte bleibt alles zu kaufen; ein Vorrat von 2
      fällt an seinen ersten zwei Tagen heraus und zählt diese zwei Tage; ein
      Vorrat von 1 bei zwei geplanten Tagen lässt das Gericht einmal auf der
      Kaufliste stehen; alles gedeckt ergibt eine leere Kaufliste.
- [x] `src/meals/domain/weekPlan.ts`: `WeekPlanTransfer` und `weekPlanTransfer`
      ergänzen — je Tag entschieden, mit derselben Regel wie die Schneeflocke.
      ```ts
      type PlannedDay = { day: Weekday; meal: Meal }

      function plannedDays(
        plan: WeekPlan,
        meals: readonly Meal[],
      ): readonly PlannedDay[] {
        return WEEKDAYS.flatMap((day) => {
          const meal = shownMealOn(plan, day, meals)
          return meal === null ? [] : [{ day, meal }]
        })
      }

      export type WeekPlanTransfer = {
        mealsToBuy: readonly Meal[]
        suppliedDays: number
      }

      export function weekPlanTransfer(
        plan: WeekPlan,
        meals: readonly Meal[],
        supplies: readonly Supply[],
      ): WeekPlanTransfer {
        const days = plannedDays(plan, meals)
        const toBuy = days.filter(
          ({ day }) => !isSuppliedOn(plan, day, meals, supplies),
        )
        return {
          mealsToBuy: toBuy.map(({ meal }) => meal),
          suppliedDays: days.length - toBuy.length,
        }
      }
      ```
      `plannedMeals` wird dabei zu `plannedDays(plan, meals).map(({ meal }) => meal)`
      — dieselbe Reihenfolge, eine Quelle für beide Wege.
- [x] `src/meals/domain/announcements.test.ts`: die drei bestehenden Aufrufe von
      `weekPlanTransferAnnouncement` (Zeile 287-306) um `suppliedDays` von `0`
      erweitern — ihr Ergebnis bleibt unverändert. Fehlschlagende Tests ergänzen
      für mehrere gedeckte Tage, für genau einen Tag, für den Alles-gedeckt-Fall
      und für den gemischten Fall ohne Zugänge, aber mit einem Gericht ohne Items.
- [x] `src/meals/domain/announcements.ts`: `weekPlanTransferAnnouncement` um
      `suppliedDays` erweitern.
      ```ts
      function suppliedDayPhrase(suppliedDays: number): string {
        return suppliedDays === 1
          ? '1 Tag aus dem Vorrat.'
          : `${suppliedDays} Tage aus dem Vorrat.`
      }

      function additionsPhrase(additions: string): string {
        return additions === '' ? 'nichts hinzugefügt.' : additions
      }

      export function weekPlanTransferAnnouncement(
        additions: string,
        mealsWithoutItems: readonly NewMeal[],
        suppliedDays: number,
      ): string {
        const hints = mealsWithoutItems.map(mealWithoutItemsAnnouncement)
        if (suppliedDays === 0)
          return additions === ''
            ? hints.join(' ')
            : [`Wochenplan, ${additions}`, ...hints].join(' ')
        if (additions === '' && hints.length === 0)
          return 'Wochenplan, alle Gerichte aus dem Vorrat, nichts hinzugefügt.'
        return [
          `Wochenplan, ${additionsPhrase(additions)}`,
          suppliedDayPhrase(suppliedDays),
          ...hints,
        ].join(' ')
      }
      ```
      Der Zweig für `suppliedDays === 0` hält die heutigen Ansagen Wort für Wort
      und hält zugleich `0 Tage aus dem Vorrat.` unerreichbar. Ohne gedeckten Tag
      und ohne Zugänge bleibt es wie bisher bei den blossen Hinweisen.
- [x] `src/meals/ui/WeekPlanArea.tsx`: `onAddToShoppingList` auf
      `(transfer: WeekPlanTransfer) => void` umstellen und mit
      `weekPlanTransfer(weekPlanning.plan, meals, supplies)` aufrufen.
- [x] `src/SignedInApp.tsx`: `addWeekPlanToShoppingList` rechnet mit dem Transfer.
      ```tsx
      function addWeekPlanToShoppingList(transfer: WeekPlanTransfer) {
        const items = shoppingItemsOf(transfer.mealsToBuy)
        const additions =
          items.length === 0
            ? ''
            : additionsAnnouncement(shoppingList.addItems(items))
        announce(
          weekPlanTransferAnnouncement(
            additions,
            mealsWithoutItems(transfer.mealsToBuy),
            transfer.suppliedDays,
          ),
        )
      }
      ```
- [x] `src/meals/ui/WeekPlanArea.test.tsx`: den Typ im Test-Wrapper (Zeile 37) und
      die Sammelliste `transferred` (Zeile 70, 79-81) auf `WeekPlanTransfer`
      umstellen; die beiden bestehenden Erwartungen `toEqual([[pizza, bolognese]])`
      (Zeile 369) und `toEqual([[bolognese]])` (Zeile 384) auf die neue Form
      nachziehen.
- [x] `src/meals/ui/WeekPlanArea.test.tsx`: Test, dass der Knopf den Transfer mit
      den ungedeckten Gerichten und der Zahl gedeckter Tage übergibt, und dass er
      auch dann bedienbar bleibt, wenn alle geplanten Tage gedeckt sind.
- [x] `src/SignedInApp.test.tsx`: Tests für die Einkaufsliste — die Zutaten eines
      gedeckten Gerichts fehlen, die Ansage nennt die gedeckten Tage, der
      Alles-gedeckt-Fall sagt seinen eigenen Satz, ein gedecktes Gericht ohne
      Items löst keinen `hat keine Einkaufs-Items`-Hinweis mehr aus, und die
      Vorräte stehen nach der Übertragung unverändert (`suppliesClient`
      abgefragt).
- [x] `e2e/weekPlan.spec.ts`: einen Lauf ergänzen, der zwei Gerichte anlegt, für
      eines einen Vorrat von 1 hinterlegt, dieses an zwei Tagen und das andere an
      einem Tag einplant, überträgt und prüft, dass auf der Einkaufsliste die
      Zutaten des gedeckten Gerichts genau einmal und die des ungedeckten
      vollständig stehen und die Ansage `1 Tag aus dem Vorrat.` nennt. `chooseSuggestion`
      (`e2e/keyboard.ts:28-36`) tippt in das noch leere Feld — dort heisst das
      Label weiterhin `Montag`. Erst Prüfungen **nach** der Auswahl brauchen das
      volle Label `Montag, im Vorrat`.
- [x] `docs/notes.txt`: unter TODO nichts Offenes — keine Änderung nötig, sofern
      bei der Umsetzung kein neuer Punkt auffällt.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/meals/domain/weekPlan.test.ts` — `weekPlanTransfer` grün
- [x] `npx vitest run src/meals/domain/announcements.test.ts` — alle vier
      Transfer-Fälle grün
- [x] `npx vitest run src/SignedInApp.test.tsx` — Einkaufsliste, Ansagen und
      unveränderte Vorräte grün
- [x] `npm run test` läuft vollständig durch
- [x] `npm run lint` und `npm run build` laufen durch
- [x] `npx playwright test e2e/weekPlan.spec.ts` — der neue Lauf und die beiden
      bestehenden grün

**Manuelle Verifikation**:

- [x] Auf dem Gerät mit VoiceOver: Woche mit einem gedeckten und einem offenen
      Gericht planen, `Auf die Einkaufsliste` drücken und hören, dass die Ansage
      die Artikel **und** die gedeckten Tage nennt; anschließend auf der
      Vorräte-Seite prüfen, dass die Anzahl unverändert ist.
- [x] Dasselbe mit einem Gericht, das bei Vorrat 1 an zwei Tagen steht: seine
      Zutaten stehen einmal auf der Einkaufsliste.

## Notizen zur Umsetzung

- Phase 1: In `WeekPlanRow` bleibt es bei `plannedName` aus `shownMealOn`; die im
  Plan skizzierte Zwischenvariable `planned` entfällt, weil `isSuppliedOn` das
  geplante Gericht selbst bestimmt und ein nur zum Namen genutztes Objekt nichts
  aussagt.
- Phase 1: `renderWeekPlanArea` bekommt die Vorräte als dritten Parameter vor
  `random` — `random` wurde von keinem Test gesetzt, so bleiben alle Aufrufe
  unverändert.
- Nach Phase 1 hat der Nutzer die Deckungsregel gedreht: der Vorrat wird nun nach
  Portionen auf die Tage verteilt, statt jeden Tag des Gerichts zu decken. Die
  Akzeptanzkriterien und Entscheidung 1 sind daraufhin umgeschrieben, die neue
  Phase 2 zieht Phase 1 nach, und die Übertragung ist zu Phase 3 geworden.
  Angenommen dabei: »der erste« Tag ist der frühere Wochentag, gezählt von Montag
  bis Sonntag.
- Phase 2: Der Test »lets the mark move on« brauchte drei geplante Tage statt
  zwei — mit zwei Tagen wäre er auch unter der abgelösten Regel grün gewesen und
  hätte nichts geprüft. Ein Gegenlauf mit zurückgedrehter Regel bestätigt, dass
  die vier neuen Oberflächen-Tests rot werden.

## Verweise

- `src/meals/ui/WeekPlanRow.tsx:48-77` — Aufbau der Tageszeile heute
- `src/meals/ui/WeekPlanArea.tsx:32-54` — Würfeln und Übertragung heute
- `src/SignedInApp.tsx:114-123` — `addWeekPlanToShoppingList`
- `src/meals/domain/weekPlan.ts` — `plannedMeals`, `mealsWithoutItems`
- `src/meals/domain/supply.ts` — `Supply`, `supplyOf`
- `src/meals/domain/announcements.ts:111-136` — Wochenplan-Ansagen
- `src/shared/ui/SnowflakeIcon.tsx` — Marke der Vorräte
- `src/index.css:361-396` — Layout der Tageszeile
- `docs/agents/plans/2026-09-19-wochenplan-mit-zufallsauswahl.md` — MZP-009
- `docs/agents/plans/2026-09-22-vorraete-mit-anzahl.md` — MZP-011
