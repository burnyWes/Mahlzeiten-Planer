---
date: 2026-09-24T13:04:24.148379+00:00
git_commit: 1ddcee8be7c31d6275cbb7c18d419253a0a7cb44
branch: main
story: MZP-023
topic: "Glühbirne in der Gerichte-Überschrift"
tags: [plan, meals, announcements, MealListPage, LightbulbOffIcon]
status: ready
---

# PLAN: MZP-023 — Glühbirne in der Gerichte-Überschrift

Mit ausgeblendeten Gerichten ist die Überschrift der Gerichteliste lang geworden:
`Gerichte, 12 (3 ausgeblendet)`. Sichtbar ersetzt jetzt die durchgestrichene Glühbirne
das Wort „ausgeblendet“: `Gerichte, 12 (3 💡̸)`. VoiceOver liest weiterhin den ganzen
Text.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-24.

## Akzeptanzkriterien

- Bei 3 Gerichten, davon 1 ausgeblendet, zeigt die Überschrift sichtbar
  `Gerichte, 3 (1 💡̸)`. Das Icon ist `LightbulbOffIcon`, so hoch wie die Schrift und in
  derselben Zeile wie der Text.
- VoiceOver liest diese Überschrift als `Gerichte, 3 (1 ausgeblendet)`. Der zugängliche
  Name kommt aus dem `aria-label`.
- Ohne ausgeblendete Gerichte bleibt es bei `Gerichte, 3`, ohne Gerichte bei
  `Gerichte, keine`. In beiden Fällen gibt es kein Icon.
- Wer ein Gericht ausblendet und zur Liste zurückkehrt, findet den Fokus auf der
  Überschrift mit dem Namen `Gerichte, 1 (1 ausgeblendet)`.

## Wesentliche Entscheidungen und Abwägungen

1. **`aria-label` an der Überschrift:** Das `aria-label` ist `mealsHeading(meals)`,
   sichtbar sind Zahl und Icon.
   - Warum: VoiceOver ist der wichtigste Bedienweg. Das Icon allein ergäbe den Namen
     „Gerichte, 3 (1)“, und die Zahl hätte keine Bedeutung. `MealListRow` macht es schon
     genauso (`aria-label="Suppe, ausgeblendet"`, sichtbar `Suppe` mit Icon).
   - Auswirkung: Entscheidung 3 aus MZP-022 („kein `aria-label`“) gilt für diese
     Überschrift nicht mehr. Das `aria-label` wird immer gesetzt. Ohne ausgeblendete
     Gerichte stimmt es mit dem sichtbaren Text überein.
2. **Sichtbares Format `Gerichte, n (h 💡̸)`:** Das Icon steht, wo bisher das Wort stand.
   - Warum: Das ist die kleinste Änderung, und die Anzeige gleicht dem gesprochenen Text.
   - Auswirkung: `MealListPage` rendert `Gerichte, {n} ({h} `, danach das Icon und `)`.
     Ohne ausgeblendete Gerichte bleibt nur der reine Text aus `mealsHeading`.
3. **`countHiddenMeals` in `meal.ts`:** `mealsHeading` und `MealListPage` nutzen beide
   diese Funktion.
   - Warum: Gezählt wird an einer Stelle in der Domäne, mit reinen Unit-Tests. Die Seite
     rechnet nichts selbst.
   - Auswirkung: `mealsHeading` bekommt dasselbe Verhalten, nur anders umgesetzt. Die
     bestehenden Tests in `announcements.test.ts` bleiben unverändert.
4. **Icon mit eigener Klasse `.headingIcon`:** `LightbulbOffIcon` bekommt ein optionales
   `className`, der Standard bleibt `buttonIcon`.
   - Warum: `.buttonIcon` ist `display: block` mit 24 px und würde die Überschrift
     umbrechen.
   - Auswirkung: `MealListRow` und `MealPage` bleiben unverändert.

## Ausgangslage

```
MealsArea ──meals──▶ MealListPage ──meals──▶ mealsHeading(meals)   announcements.ts:50
                     <h1>{text}</h1>          zählt hidden selbst
```

- `src/meals/domain/announcements.ts:50-56`: `mealsHeading` hat drei Fälle, der
  Zähler steht inline (`meals.filter((meal) => meal.hidden).length`).
- `src/meals/ui/MealListPage.tsx:29-31`: `<h1 ref={heading} tabIndex={-1}>` mit dem Text
  aus `mealsHeading(meals)`, ohne `aria-label`.
- `src/meals/ui/LightbulbOffIcon.tsx`: `svg` mit fester Klasse `buttonIcon`,
  `aria-hidden`. Genutzt in `MealListRow.tsx:20` und `MealPage.tsx:93`.
- `src/index.css:165-168`: `.pageHeader h1` mit `font-size: 1.5rem`.
- `src/index.css:434-438`: `.buttonIcon` mit 24×24 px und `display: block`.

```
┌────────────────────────────────────┐
│ Gerichte, 3 (1 ausgeblendet)  [ + ]│  h1, Name = sichtbarer Text
├────────────────────────────────────┤
│    Eintopf                    [🛒] │
│    Pizza                      [🛒] │
│ 💡̸ Suppe                      [🛒] │
└────────────────────────────────────┘
```

## Zielbild

```
MealsArea ──meals──▶ MealListPage
                       aria-label = mealsHeading(meals)        "Gerichte, 3 (1 ausgeblendet)"
                       hiddenCount = countHiddenMeals(meals)   meal.ts
                         0 → sichtbar mealsHeading(meals)      "Gerichte, 3" / "Gerichte, keine"
                         h → sichtbar "Gerichte, n (h " + LightbulbOffIcon + ")"
```

```
┌────────────────────────────────────┐
│ Gerichte, 3 (1 💡̸)            [ + ]│  h1, Name = "Gerichte, 3 (1 ausgeblendet)"
├────────────────────────────────────┤
│    Eintopf                    [🛒] │
│    Pizza                      [🛒] │
│ 💡̸ Suppe                      [🛒] │
└────────────────────────────────────┘
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `meal.ts`
    - `countHiddenMeals(meals: readonly NewMeal[]): number`: neu, neben `withHiding`
  - `meal.test.ts`
    - `describe('countHiddenMeals')`: neu
  - `announcements.ts`
    - `mealsHeading`: nutzt `countHiddenMeals`, Ergebnis unverändert
- `src/meals/ui`
  - `LightbulbOffIcon.tsx`: optionale Prop `className`, Standard `buttonIcon`
  - `MealListPage.tsx`: `aria-label` am `h1`, sichtbarer Inhalt mit Icon
  - `MealsArea.test.tsx`: Test `names the hidden meals in the heading` erweitern
- `src/index.css`
  - `.headingIcon`: neu, Icon in Schriftgröße innerhalb einer Textzeile

Diese Tests prüfen den zugänglichen Namen per `getByRole('heading', { name })` und
bleiben unverändert grün: `SignedInApp.test.tsx:679,692`, die bestehenden
Überschriften-Tests in `MealsArea.test.tsx` und
`counts a meal that was just hidden in the heading`.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine

Die Domäne bekommt einen Zähler für ausgeblendete Gerichte. Die Überschrift zeigt die
Glühbirne statt des Worts und behält den gesprochenen Namen.

**Aufgaben**:

- [x] `meal.test.ts`: `describe('countHiddenMeals')` schreiben und die Tests rot sehen.
      Gerichte als `NewMeal` inline bauen oder die vorhandene Vorlage aus
      `describe('withHiding')` herausziehen, wenn beide Blöcke sie brauchen.
  - `counts no hidden meal in an empty list`: `[]` → `0`
  - `counts only the hidden meals`: drei Gerichte, eines ausgeblendet → `1`
  - `counts every meal when all are hidden`: zwei ausgeblendet → `2`
- [x] `meal.ts`: `countHiddenMeals` umsetzen.

  ```ts
  export function countHiddenMeals(meals: readonly NewMeal[]): number {
    return meals.filter((meal) => meal.hidden).length
  }
  ```

- [x] `announcements.ts`: `mealsHeading` auf `countHiddenMeals(meals)` umstellen. Die
      vier `mealsHeading`-Tests bleiben unverändert grün.
- [x] `MealsArea.test.tsx`: Test `names the hidden meals in the heading` erweitern und
      rot sehen.

  ```ts
  const heading = screen.getByRole('heading', {
    name: 'Gerichte, 2 (1 ausgeblendet)',
  })
  expect(heading.textContent).toBe('Gerichte, 2 (1 )')
  expect(heading.querySelector('svg')).not.toBeNull()
  ```

  Den genauen `textContent` (Leerzeichen vor dem Icon) an die Umsetzung anpassen. Er darf
  „ausgeblendet“ nicht enthalten.
- [x] `MealsArea.test.tsx`: neuer Test `shows no mark in the heading without hidden
      meals`: zwei sichtbare Gerichte → Überschrift `Gerichte, 2`, `textContent` gleich
      `Gerichte, 2`, kein `svg` in der Überschrift.
- [x] `LightbulbOffIcon.tsx`: `className` als optionale Prop, Standard `'buttonIcon'`.

  ```tsx
  type LightbulbOffIconProps = { className?: string }

  export function LightbulbOffIcon({
    className = 'buttonIcon',
  }: LightbulbOffIconProps) {
    return <svg className={className} … />
  }
  ```

- [x] `MealListPage.tsx`: Überschrift umbauen.

  ```tsx
  const hiddenCount = countHiddenMeals(meals)
  …
  <h1 ref={heading} tabIndex={-1} aria-label={mealsHeading(meals)}>
    {hiddenCount === 0 ? (
      mealsHeading(meals)
    ) : (
      <>
        Gerichte, {meals.length} ({hiddenCount}{' '}
        <LightbulbOffIcon className="headingIcon" />)
      </>
    )}
  </h1>
  ```

- [x] `index.css`: `.headingIcon` neben `.buttonIcon` anlegen.

  ```css
  .headingIcon {
    width: 1em;
    height: 1em;
    display: inline-block;
    vertical-align: -0.125em;
  }
  ```

**Automatisierte Verifikation**:

- [x] Die drei `countHiddenMeals`-Tests in `meal.test.ts` laufen grün.
- [x] Die `mealsHeading`-Tests in `announcements.test.ts` laufen unverändert grün.
- [x] `names the hidden meals in the heading` und `shows no mark in the heading without
      hidden meals` in `MealsArea.test.tsx` laufen grün.
- [x] `counts a meal that was just hidden in the heading` läuft unverändert grün.
- [x] `npm run test` läuft vollständig grün, auch `SignedInApp.test.tsx`.
- [x] `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation**:

- [ ] Auf dem iPhone ist ein Gericht ausgeblendet. Die Überschrift zeigt
      `Gerichte, n (1 💡̸)`. Das Icon ist so hoch wie die Schrift und sitzt auf der Zeile.
- [ ] Mit VoiceOver klingt die Überschrift wie vorher, etwa „Gerichte, zwölf, drei
      ausgeblendet, Überschrift“. Das Icon wird nicht eigens angesagt.
- [ ] Mit Farbumkehr ist das Icon in der Überschrift gut sichtbar (`currentColor`).

## Notizen zur Umsetzung

## Verweise

- `docs/agents/plans/2026-09-24-ausgeblendete-gerichte-in-der-ueberschrift.md`: MZP-022,
  Einführung der Klammer in der Überschrift
- `docs/agents/plans/2026-09-23-gericht-ausblenden.md`: MZP-016, Einführung von `hidden`
- `src/meals/ui/MealListRow.tsx:18-27`: Vorbild für `aria-label` mit Icon
- `src/meals/domain/announcements.ts:50`
- `src/meals/ui/MealListPage.tsx:29`
- `src/meals/ui/LightbulbOffIcon.tsx`
