---
date: 2026-09-24T09:53:40.840323+00:00
git_commit: 19aa229bc71a18e1dc5790485a29fe8be3f0d7e5
branch: main
story: MZP-022
topic: "Ausgeblendete Gerichte in der Überschrift"
tags: [plan, meals, announcements, MealListPage]
status: ready
---

# PLAN: MZP-022 — Ausgeblendete Gerichte in der Überschrift

Die Überschrift der Gerichteliste soll neben der Gesamtzahl sagen, wie viele Gerichte
gerade ausgeblendet sind: `Gerichte, 12 (3 ausgeblendet)`. So hört man beim Öffnen der
Seite sofort, dass Gerichte ruhen, ohne die Liste durchzuhören.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-24.

## Akzeptanzkriterien

- Bei 12 Gerichten, davon 3 ausgeblendet, heißt die Überschrift der Gerichteliste
  `Gerichte, 12 (3 ausgeblendet)`. VoiceOver liest genau diesen Text, es gibt kein
  eigenes `aria-label`.
- Ist kein Gericht ausgeblendet, bleibt es bei `Gerichte, 12`.
- Ohne Gerichte bleibt es bei `Gerichte, keine`.
- Ein ausgeblendetes Gericht ergibt `Gerichte, 5 (1 ausgeblendet)`. Sind alle
  ausgeblendet, heißt es `Gerichte, 3 (3 ausgeblendet)`.
- Wer ein Gericht auf der Gericht-Seite aus- oder einblendet und zur Liste zurückkehrt,
  findet den Fokus auf der Überschrift mit der neuen Zahl.

## Wesentliche Entscheidungen und Abwägungen

1. **Die erste Zahl zählt alle Gerichte:** wie schon in MZP-016 festgelegt
   (`2026-09-23-gericht-ausblenden.md:36`).
   - Warum: Sie passt zur Zahl der Zeilen, die VoiceOver danach vorliest, denn
     ausgeblendete Gerichte bleiben in der Liste.
   - Auswirkung: Die Gesamtzahl ist weiter die Länge der Liste, die Klammer kommt dazu.
2. **Die Klammer nur bei mindestens einem ausgeblendeten Gericht.**
   - Warum: `useHeadingFocus` lässt die Überschrift bei jedem Seitenwechsel vorlesen.
     `(keine ausgeblendet)` wäre im Normalfall ein Zusatz ohne Information.
   - Auswirkung: `mealsHeading` hat drei Fälle: keine Gerichte, ohne Ausgeblendete, mit
     Ausgeblendeten.
3. **Ein Text für Anzeige und Sprache:** kein `aria-label` an der Überschrift.
   - Warum: So machen es alle Überschriften der App. VoiceOver spricht Klammern bei der
     Standard-Interpunktion nicht aus und macht dort eine kurze Pause.
   - Auswirkung: Die Aussprache wird einmal manuell auf dem iPhone geprüft.
4. **`mealsHeading` bekommt die Gerichte statt einer Zahl:**
   `mealsHeading(meals: readonly NewMeal[])`.
   - Warum: Was die Überschrift zählt, steht dann an einer Stelle in der Domäne und wird
     mit reinen Unit-Tests abgedeckt. Die Seite rechnet nichts. Viele Funktionen in
     `announcements.ts` nehmen schon `NewMeal`.
   - Auswirkung: Der einzige Aufrufer `MealListPage.tsx:30` übergibt `meals` statt
     `meals.length`. Die Unit-Tests bauen Gericht-Listen aus der vorhandenen
     `bolognese`-Vorlage.

## Ausgangslage

```
MealsArea ──meals──▶ MealListPage ──meals.length──▶ mealsHeading(mealCount)
                                                     announcements.ts:50
                                                     0 → "Gerichte, keine"
                                                     n → "Gerichte, n"
```

- `src/meals/domain/announcements.ts:50-52`: `mealsHeading(mealCount: number)`.
- `src/meals/ui/MealListPage.tsx:29-31`: `<h1>` mit `useHeadingFocus`, Text aus
  `mealsHeading(meals.length)`.
- `Meal.hidden` (`src/meals/domain/meal.ts:25`) gibt es seit MZP-016. Ausgeblendete
  Gerichte stehen weiter in der Liste, mit erloschener Birne und dem Namen
  `Suppe, ausgeblendet`.

Bildschirm heute (3 Gerichte, 1 ausgeblendet):

```
┌────────────────────────────────────┐
│ Gerichte, 3                   [ + ]│  h1
├────────────────────────────────────┤
│    Eintopf                    [🛒] │
│    Pizza                      [🛒] │
│ 💡̸ Suppe                      [🛒] │
└────────────────────────────────────┘
```

## Zielbild

```
MealsArea ──meals──▶ MealListPage ──meals──▶ mealsHeading(meals)
                                             0 Gerichte        → "Gerichte, keine"
                                             0 ausgeblendet    → "Gerichte, n"
                                             h ausgeblendet    → "Gerichte, n (h ausgeblendet)"
```

```
┌────────────────────────────────────┐
│ Gerichte, 3 (1 ausgeblendet)  [ + ]│  h1
├────────────────────────────────────┤
│    Eintopf                    [🛒] │
│    Pizza                      [🛒] │
│ 💡̸ Suppe                      [🛒] │
└────────────────────────────────────┘
```

Passt die Überschrift auf 375 px nicht in eine Zeile, bricht sie um. `.pageHeader` hält
den Plus-Knopf rechts. Neue Styles braucht es nicht.

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `announcements.ts`
    - `mealsHeading`: nimmt `readonly NewMeal[]`, zählt `hidden` selbst
  - `announcements.test.ts`
    - `describe('mealsHeading')`: Fälle auf Gericht-Listen umstellen und ergänzen
- `src/meals/ui`
  - `MealListPage.tsx`: `mealsHeading(meals)` statt `mealsHeading(meals.length)`
  - `MealsArea.test.tsx`: zwei neue Tests, vorhandene Helfer `openMeal`,
    `switchHiding`, `goBackToTheMeals`

`SignedInApp.test.tsx:679,692` und die bestehenden Überschriften-Tests in
`MealsArea.test.tsx` erwarten `Gerichte, keine` bzw. `Gerichte, n` ohne ausgeblendete
Gerichte. Sie bleiben unverändert grün.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine

Die Überschrift zählt die ausgeblendeten Gerichte mit, testgetrieben von der Domäne bis
zur Seite.

**Aufgaben**:

- [x] `announcements.test.ts`, `describe('mealsHeading')`: erst die Tests schreiben und
      rot sehen. Gericht-Listen aus `{ ...bolognese, hidden }` bauen. `bolognese` ist ein `NewMeal`
      und braucht keine `id`.
  - `says that no meal is known yet`: `mealsHeading([])` → `Gerichte, keine`
  - `counts the known meals`: zwei sichtbare → `Gerichte, 2`
  - `names the hidden meals in brackets`: drei Gerichte, eines ausgeblendet →
    `Gerichte, 3 (1 ausgeblendet)`
  - `counts every meal when all are hidden`: zwei Gerichte, beide ausgeblendet →
    `Gerichte, 2 (2 ausgeblendet)`
- [x] `announcements.ts`: `mealsHeading` umbauen, etwa so:

  ```ts
  export function mealsHeading(meals: readonly NewMeal[]): string {
    if (meals.length === 0) return 'Gerichte, keine'
    const hiddenCount = meals.filter((meal) => meal.hidden).length
    return hiddenCount === 0
      ? `Gerichte, ${meals.length}`
      : `Gerichte, ${meals.length} (${hiddenCount} ausgeblendet)`
  }
  ```

- [x] `MealListPage.tsx:30`: `mealsHeading(meals)`.
- [x] `MealsArea.test.tsx`: neue Tests neben `names a hidden meal as hidden in the list`.
  - `names the hidden meals in the heading`: Suppe ausgeblendet, Eintopf sichtbar →
    Überschrift `Gerichte, 2 (1 ausgeblendet)`.
  - `counts a meal that was just hidden in the heading`: ein sichtbares Gericht
    öffnen, `switchHiding('Ausblenden')`, `goBackToTheMeals()` → die Überschrift
    `Gerichte, 1 (1 ausgeblendet)` hat den Fokus.

**Automatisierte Verifikation**:

- [x] Die vier `mealsHeading`-Tests in `announcements.test.ts` laufen grün.
- [x] Die zwei neuen Tests in `MealsArea.test.tsx` laufen grün.
- [x] `npm run test` läuft vollständig grün, auch `SignedInApp.test.tsx` und die
      bestehenden Überschriften-Tests.
- [x] `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation**:

- [ ] Auf dem iPhone mit VoiceOver die Gerichteliste öffnen, während ein Gericht
      ausgeblendet ist. Die Überschrift klingt verständlich, etwa „Gerichte, zwölf,
      drei ausgeblendet“, und die Klammern werden nicht ausgesprochen.
- [ ] Auf 375 px Breite bleibt die Überschrift lesbar und verdrängt den Plus-Knopf nicht.

## Notizen zur Umsetzung

## Verweise

- `docs/agents/plans/2026-09-23-gericht-ausblenden.md`: MZP-016, Einführung von
  `hidden`, die Überschrift zählt alle Gerichte
- `src/meals/domain/announcements.ts:50`
- `src/meals/ui/MealListPage.tsx:30`
