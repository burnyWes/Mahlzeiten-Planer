---
date: 2026-09-22T12:25:41+00:00
git_commit: f36aedb09d827dd319459de16cdc1e8bdfda68fb
branch: main
story: MZP-013
topic: "Vorräte-Verbrauch im Wochenplan"
tags: [plan, meals, weekPlan, supplies, shoppingList]
status: ready
---

# PLAN: MZP-013 — Vorräte-Verbrauch im Wochenplan

Der Wochenplan kennt die Vorräte heute nicht. Wer ein Gericht einplant, das längst
im Eisfach liegt, kauft dessen Zutaten trotzdem ein. Dieser Plan bringt die Vorräte
in den Wochenplan: eine Schneeflocke markiert den gedeckten Tag, und die Übertragung
auf die Einkaufsliste lässt die Zutaten gedeckter Gerichte weg.

## Akzeptanzkriterien

- Steht ein geplantes Gericht im Vorrat (`count >= 1`), zeigt der Tag zwischen
  Wochentag-Kürzel und Eingabefeld eine Schneeflocke — bei manueller Auswahl wie
  bei Zufallsauswahl, und an jedem Tag, an dem das Gericht steht.
- Die Schneeflocke verschwindet sofort, wenn der Vorrat auf der Vorräte-Seite auf
  null geht oder am Tag ein anderes Gericht gewählt wird.
- VoiceOver liest das Eingabefeld eines gedeckten Tages als `Montag, im Vorrat`
  statt `Montag`. Das Icon selbst ist `aria-hidden` und erzeugt keinen
  zusätzlichen Wisch-Stopp.
- Der Platz für das Icon steht in jeder der sieben Zeilen, auch ohne Vorrat; alle
  Eingabefelder beginnen bündig untereinander.
- Tages-Würfel und Vorschlagsauswahl sagen `Montag, Chili con Carne, im Vorrat.`
  bzw. `Montag, Nudeln.` an. Das Wochen-Würfeln bleibt bei
  `Wochenplan neu gewürfelt, 7 Gerichte.`
- Das Leeren eines Feldes bleibt still.
- »Auf die Einkaufsliste« überträgt die Zutaten gedeckter Gerichte **nicht**.
- Die Ansage danach nennt die gedeckten Tage:
  `Wochenplan, 6 Artikel hinzugefügt. 3 Tage aus dem Vorrat.` — bei einem Tag
  `1 Tag aus dem Vorrat.`
- Sind alle geplanten Tage gedeckt, bleibt der Knopf bedienbar und sagt
  `Wochenplan, alle Gerichte aus dem Vorrat, nichts hinzugefügt.`
- Bleibt nach dem Vorrat nur noch ein Gericht ohne Einkaufs-Items übrig, beginnt
  die Ansage trotzdem mit dem Wochenplan und nicht mit einer nackten Zahl:
  `Wochenplan, nichts hinzugefügt. 2 Tage aus dem Vorrat. Suppe hat keine Einkaufs-Items.`
- Ein gedecktes Gericht ohne Einkaufs-Items löst den Hinweis
  `… hat keine Einkaufs-Items.` nicht mehr aus.
- Der Vorrat wird durch die Übertragung nicht verändert.
- Die Überschrift `Wochenplan, 3 von 7` zählt weiterhin alle geplanten Tage,
  gedeckte eingeschlossen.

## Wesentliche Entscheidungen und Abwägungen

1. **Deckung:** `count >= 1` deckt jeden Tag, an dem das Gericht steht.
   - Warum: der Nutzer will eine erkennbare Regel, keine Portionsrechnung. Chili mit
     Vorrat 2, an drei Tagen geplant, ist an allen drei Tagen gedeckt.
   - Auswirkung: die Domäne braucht nur ein `steht drin / steht nicht drin`, keine
     Zuteilung von Portionen auf Tage.

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

Die Zeile eines gedeckten Tages:

```
vorher                                     nachher
┌──────────────────────────────┐           ┌──────────────────────────────┐
│ Mo.  [ Chili con Carne ] [🎲]│           │ Mo. ❄ [ Chili con Carne ] [🎲]│
│ Di.  [ Nudeln          ] [🎲]│           │ Di.   [ Nudeln          ] [🎲]│
│ Mi.  [ Chili con Carne ] [🎲]│           │ Mi. ❄ [ Chili con Carne ] [🎲]│
│ Do.  [                 ] [🎲]│           │ Do.   [                 ] [🎲]│
└──────────────────────────────┘           └──────────────────────────────┘
                                                 ^ Spalte steht in jeder Zeile
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
    - `weekPlanTransfer(plan, meals, supplies)` — neu
    - `isSuppliedOn(plan, day, meals, supplies)` — neu, für die Zeile
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

- [ ] `src/meals/domain/supply.test.ts`: fehlschlagende Tests für `isInSupply` —
      wahr bei vorhandenem Vorrat, falsch bei unbekanntem Gericht.
- [ ] `src/meals/domain/supply.ts`: `isInSupply` ergänzen.
      ```ts
      export function isInSupply(
        supplies: readonly Supply[],
        mealId: MealId,
      ): boolean {
        return supplyOf(supplies, mealId) !== null
      }
      ```
- [ ] `src/meals/domain/weekPlan.test.ts`: fehlschlagende Tests für `isSuppliedOn` —
      gedeckter Tag, geplanter Tag ohne Vorrat, leerer Tag.
- [ ] `src/meals/domain/weekPlan.ts`: `isSuppliedOn` ergänzen; `Supply` und
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
- [ ] `src/meals/domain/announcements.test.ts`: fehlschlagende Tests für
      `weekdayFieldLabel` (`Montag` / `Montag, im Vorrat`) und für
      `dayPlannedAnnouncement` in beiden Formen. Der bestehende Test in Zeile 263-269
      ruft `dayPlannedAnnouncement('monday', bolognese)` mit zwei Argumenten und
      bekommt das dritte.
- [ ] `src/meals/domain/announcements.ts`: `weekdayFieldLabel` ergänzen und
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
- [ ] `src/meals/ui/WeekPlanRow.tsx`: `supplies` als Prop entgegennehmen, das
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
- [ ] `src/index.css`: `.supplyMark` als feste Spalte neben `.weekday`, Breite wie
      `.buttonIcon` (24 px), `flex: none`, mittig — der Platz bleibt auch ohne Icon
      stehen.
- [ ] `src/meals/ui/WeekPlanPage.tsx`: `supplies` als Prop entgegennehmen und an
      jede `WeekPlanRow` durchreichen.
- [ ] `src/meals/ui/WeekPlanArea.tsx`: `supplies: readonly Supply[]` als Prop
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
- [ ] `src/meals/ui/WeekPlanArea.tsx`: `onChooseMeal={weekPlanning.chooseMeal}` auf
      `onChooseMeal={chooseMeal}` umstellen — ohne das bleibt die Vorschlagsauswahl
      still.
- [ ] `src/meals/ui/WeekPlanRow.tsx`: den dann unbenutzten Import `weekdayName`
      entfernen, sonst wird `npm run lint` rot. `weekdayAbbreviation`,
      `randomMealLabel` und `mealSuggestionsLabel` bleiben.
- [ ] `src/SignedInApp.tsx`: `supplies={supplies.supplies}` an `WeekPlanArea`
      übergeben.
- [ ] `src/meals/ui/WeekPlanArea.test.tsx`: `renderWeekPlanArea` um einen Parameter
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
- [ ] `src/SignedInApp.test.tsx`: den Test
      `says nothing of its own about a day that was planned by hand` durch einen
      ersetzen, der die neue Ansage `Montag, Bolognese.` erwartet; einen Test
      ergänzen, der bei einem Vorrat für Bolognese `Montag, Bolognese, im Vorrat.`
      erwartet.

**Automatisierte Verifikation**:

- [ ] `npx vitest run src/meals/domain/supply.test.ts` — `isInSupply` grün
- [ ] `npx vitest run src/meals/domain/weekPlan.test.ts` — `isSuppliedOn` grün
- [ ] `npx vitest run src/meals/domain/announcements.test.ts` — Label und
      Tages-Ansage grün
- [ ] `npx vitest run src/meals/ui/WeekPlanArea.test.tsx` — Schneeflocke, Label
      und Ansagen grün
- [ ] `npx vitest run src/SignedInApp.test.tsx` — angepasste Wochenplan-Tests grün,
      insbesondere `has no accessibility violations on the week plan`
- [ ] `npm run lint` und `npm run test` laufen durch (Architekturtest
      `test/domainLayerBoundary.test.ts` eingeschlossen)

**Manuelle Verifikation**:

- [ ] Mit VoiceOver über die Wochenplan-Zeilen wischen: ein gedeckter Tag wird als
      `Montag, im Vorrat, <Gericht>, Textfeld` gelesen, ein offener als
      `Dienstag, <Gericht>, Textfeld`; die Zahl der Stopps ist in beiden Fällen
      gleich.
- [ ] Bei invertierten Farben prüfen, dass die Schneeflocke sichtbar bleibt und
      die sieben Eingabefelder bündig untereinander stehen.

### Phase 2: Vorrat-Gerichte nicht auf die Einkaufsliste

Abhängigkeiten: Phase 1

Die Übertragung lässt gedeckte Gerichte aus und meldet, wie viele Tage der Vorrat
abgedeckt hat.

**Aufgaben**:

- [ ] `src/meals/domain/weekPlan.test.ts`: fehlschlagende Tests für
      `weekPlanTransfer` — ohne Vorräte bleibt alles zu kaufen; ein gedecktes
      Gericht fällt an jedem seiner Tage heraus und zählt jeden dieser Tage;
      alles gedeckt ergibt eine leere Kaufliste.
- [ ] `src/meals/domain/weekPlan.ts`: `WeekPlanTransfer` und `weekPlanTransfer`
      ergänzen.
      ```ts
      export type WeekPlanTransfer = {
        mealsToBuy: readonly Meal[]
        suppliedDays: number
      }

      export function weekPlanTransfer(
        plan: WeekPlan,
        meals: readonly Meal[],
        supplies: readonly Supply[],
      ): WeekPlanTransfer {
        const planned = plannedMeals(plan, meals)
        const toBuy = planned.filter((meal) => !isInSupply(supplies, meal.id))
        return { mealsToBuy: toBuy, suppliedDays: planned.length - toBuy.length }
      }
      ```
- [ ] `src/meals/domain/announcements.test.ts`: die drei bestehenden Aufrufe von
      `weekPlanTransferAnnouncement` (Zeile 287-306) um `suppliedDays` von `0`
      erweitern — ihr Ergebnis bleibt unverändert. Fehlschlagende Tests ergänzen
      für mehrere gedeckte Tage, für genau einen Tag, für den Alles-gedeckt-Fall
      und für den gemischten Fall ohne Zugänge, aber mit einem Gericht ohne Items.
- [ ] `src/meals/domain/announcements.ts`: `weekPlanTransferAnnouncement` um
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
- [ ] `src/meals/ui/WeekPlanArea.tsx`: `onAddToShoppingList` auf
      `(transfer: WeekPlanTransfer) => void` umstellen und mit
      `weekPlanTransfer(weekPlanning.plan, meals, supplies)` aufrufen.
- [ ] `src/SignedInApp.tsx`: `addWeekPlanToShoppingList` rechnet mit dem Transfer.
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
- [ ] `src/meals/ui/WeekPlanArea.test.tsx`: den Typ im Test-Wrapper (Zeile 37) und
      die Sammelliste `transferred` (Zeile 70, 79-81) auf `WeekPlanTransfer`
      umstellen; die beiden bestehenden Erwartungen `toEqual([[pizza, bolognese]])`
      (Zeile 369) und `toEqual([[bolognese]])` (Zeile 384) auf die neue Form
      nachziehen.
- [ ] `src/meals/ui/WeekPlanArea.test.tsx`: Test, dass der Knopf den Transfer mit
      den ungedeckten Gerichten und der Zahl gedeckter Tage übergibt, und dass er
      auch dann bedienbar bleibt, wenn alle geplanten Tage gedeckt sind.
- [ ] `src/SignedInApp.test.tsx`: Tests für die Einkaufsliste — die Zutaten eines
      gedeckten Gerichts fehlen, die Ansage nennt die gedeckten Tage, der
      Alles-gedeckt-Fall sagt seinen eigenen Satz, ein gedecktes Gericht ohne
      Items löst keinen `hat keine Einkaufs-Items`-Hinweis mehr aus, und die
      Vorräte stehen nach der Übertragung unverändert (`suppliesClient`
      abgefragt).
- [ ] `e2e/weekPlan.spec.ts`: einen Lauf ergänzen, der zwei Gerichte anlegt, für
      eines einen Vorrat hinterlegt, beide im Wochenplan einplant, überträgt und
      prüft, dass auf der Einkaufsliste nur die Zutaten des ungedeckten Gerichts
      stehen und die Ansage die gedeckten Tage nennt. `chooseSuggestion`
      (`e2e/keyboard.ts:28-36`) tippt in das noch leere Feld — dort heisst das
      Label weiterhin `Montag`. Erst Prüfungen **nach** der Auswahl brauchen das
      volle Label `Montag, im Vorrat`.
- [ ] `docs/notes.txt`: unter TODO nichts Offenes — keine Änderung nötig, sofern
      bei der Umsetzung kein neuer Punkt auffällt.

**Automatisierte Verifikation**:

- [ ] `npx vitest run src/meals/domain/weekPlan.test.ts` — `weekPlanTransfer` grün
- [ ] `npx vitest run src/meals/domain/announcements.test.ts` — alle vier
      Transfer-Fälle grün
- [ ] `npx vitest run src/SignedInApp.test.tsx` — Einkaufsliste, Ansagen und
      unveränderte Vorräte grün
- [ ] `npm run test` läuft vollständig durch
- [ ] `npm run lint` und `npm run build` laufen durch
- [ ] `npx playwright test e2e/weekPlan.spec.ts` — der neue Lauf und die beiden
      bestehenden grün

**Manuelle Verifikation**:

- [ ] Auf dem Gerät mit VoiceOver: Woche mit einem gedeckten und einem offenen
      Gericht planen, `Auf die Einkaufsliste` drücken und hören, dass die Ansage
      die Artikel **und** die gedeckten Tage nennt; anschließend auf der
      Vorräte-Seite prüfen, dass die Anzahl unverändert ist.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

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
