---
date: 2026-09-25T12:14:15+00:00
git_commit: 3fe14254dc1c257330a4a71bb8bd05eaf23fee85
branch: main
story: MZP-031
topic: "Regeln für die Zufallsauswahl im Wochenplan"
tags: [plan, meals, weekPlan, randomPlanning, domain, ui, e2e]
status: ready
---

# PLAN: MZP-031 — Regeln für die Zufallsauswahl im Wochenplan

Beim Würfeln (ganze Woche oder eine einzelne Zeile) kommt künftig nur noch ein Gericht, das zum
Platz passt. Pro Tag steht genau ein Hauptgericht, mittags oder abends. Gerichte mit
derselben Kategorie folgen nicht direkt aufeinander. Frühstück und Snack bleiben gern
mehrere Tage gleich. Von Hand lässt sich weiterhin jedes Gericht auf jeden Platz setzen.

Das Vorhaben steht in `docs/notes.txt` unter „Regeln für die Zufallsauswahl“ und in den
Einträgen „Zufallsregeln …“. Alle Entscheidungen stammen aus der Befragung vom 2026-09-25.

## Akzeptanzkriterien

- Von Hand (Eintippen + Vorschlag) lässt sich weiterhin jedes Gericht auf jeden Platz
  setzen, auch gegen die Regeln.
- Gewürfelt wird nur, was zum Platz passt (harte Regel):

  ```
                Frühstück   Mittag   Snack   Abend
  mainMeal         –          ✓        –       ✓
  breakfast        ✓          –        –       –
  snack            ✓          ✓        ✓       ✓
  none             –          ✓        –       ✓
  ```

- Mittags und abends gilt zusätzlich „genau ein Hauptgericht pro Tag“ (harte Regel):
  - Woche würfeln: Pro Tag entscheidet ein Münzwurf (50/50), ob das Hauptgericht mittags
    oder abends steht. Der andere Platz bekommt ein `none`-Gericht oder einen Snack.
  - Einzelne Zeile würfeln, abhängig vom **anderen** Platz des Tages (Mittag ↔ Abend):

    ```
    anderer Platz                          →  dieser Platz darf bekommen
    Hauptgericht                           →  none / Snack
    anderes Gericht (none, Snack, auch
      ein von Hand gesetztes Frühstück)    →  nur Hauptgericht
    leer                                   →  Münzwurf
    ```

- Passt kein Gericht, bleibt der Platz beim Würfeln der Woche leer. Beim Würfeln einer
  einzelnen Zeile bleibt er unverändert.
- Der Würfel an einer Zeile bringt immer ein anderes Gericht als das eingetragene,
  sofern ein anderes passt (weich).
- Kategorie-Abstand (weich): Ein gewürfeltes Gericht der Art `mainMeal` oder `none` teilt
  keine Kategorie mit einem `mainMeal`- oder `none`-Gericht mittags oder abends am
  selben Tag, am Vortag oder am Folgetag. Groß- und Kleinschreibung spielen keine Rolle.
- Frühstücks- und Snack-Spalte (weich): Ab Dienstag bleibt der Platz mit 50 % beim
  Gericht des Vortags, sofern es hier erlaubt ist. Sonst wechselt er auf ein anderes
  Gericht.
- Danach gilt wie heute: bevorzugt das Gericht, das im Plan am seltensten steht (weich).
- Eine weiche Regel, die nichts übrig lässt, wird übersprungen (wie heute `narrowedBy`).
- Ansagen:
  - nach dem Würfeln der Woche: `Wochenplan neu gewürfelt, 21 von 28 Gerichten.` (die
    Zahl ist die der tatsächlich belegten Plätze)
  - Würfel an einer Zeile ohne passendes Gericht: `Frühstück, kein passendes Gericht.`,
    in der Wochenansicht `Montag, kein passendes Gericht.`
- „Zufallsauswahl generieren“ würfelt wie bisher die ganze Woche neu und überschreibt
  dabei auch von Hand gesetzte Plätze.
- Die Würfel-Knöpfe sind wie heute nur gesperrt, wenn es gar kein würfelbares
  (nicht ausgeblendetes) Gericht gibt.

## Wesentliche Entscheidungen und Abwägungen

1. **Harte Platzregeln, weiche Vorlieben:** Platz/Art und „ein Hauptgericht pro Tag“
   filtern die Kandidaten vorab hart. Die Vorlieben laufen danach durch `narrowedBy`.
   - Warum: „darf nur“ und „muss“ in den Notizen sind feste Regeln. Ein leerer Platz ist
     ehrlicher als ein falsches Gericht und lässt sich jederzeit von Hand füllen.
   - Auswirkung: `pickMealFor` kann auch bei vorhandenen Kandidaten `null` liefern.
     Eine einzelne Bolognese füllt künftig 7 statt 28 Plätze.
2. **Münzwurf als eigene Funktion `mainMealTimeOf`:** `filledWeekPlan` wirft die Münze
   einmal pro Tag und reicht das Ergebnis an `pickMealFor` weiter. `pickMealFor` wirft
   selbst nur, wenn der Gegenplatz leer ist und nichts mitgegeben wurde.
   - Warum: Das Einstellungs-Dropdown aus den Notizen („Hauptmahlzeit: Nur Mittags | Nur
     Abends | Mittags und Abends“) muss später nur diese Stelle ersetzen. Das Dropdown
     selbst gehört nicht zu diesem Plan.
   - Auswirkung: Pro Tag verbraucht der Wochenwurf genau einen Zufallswert mehr.
3. **Eine Kette weicher Regeln:** `otherThanPlanned` → `apartFromSameCategory` →
   `stayingLikeTheDayBefore` → `rarestInThePlan`. `PlanningRule` bekommt die
   `RandomSource` als viertes Argument.
   - Warum: ein Mechanismus für alle Vorlieben. Beim Würfeln der Woche ist jeder Platz
     vorher leer, `otherThanPlanned` greift also nur beim Einzelwurf.
   - Auswirkung: Die bestehenden Tests mit festen Zufallsfolgen werden angepasst.
4. **Die Regeln bekommen alle Gerichte, nicht nur die Kandidaten:** `pickMealFor` und
   `filledWeekPlan` nehmen künftig `meals` (alle, auch ausgeblendete) und bilden die
   Kandidaten intern über `randomCandidates`.
   - Warum: Art und Kategorien eines von Hand gesetzten, ausgeblendeten Gerichts auf dem
     Gegenplatz oder am Nachbartag müssen bekannt sein.
   - Auswirkung: `WeekPlanArea` übergibt `meals` statt `candidates`. Eine nicht mehr
     vorhandene Gericht-ID im Plan zählt wie ein leerer Platz (`shownMealIn`).
5. **Die Wahrscheinlichkeit zu bleiben ist eine Konstante** `STAYING_CHANCE = 0.5` in
   `randomPlanning.ts`.
   - Warum: vom Nutzer so festgelegt, eine Einstellung ist nicht gewünscht.
6. **Die Kategorie-Regel gilt auch am selben Tag** (Mittag ↔ Abend), nicht nur zwischen
   Tagen.
   - Warum: vom Nutzer so entschieden (Frage 7, Variante B).
7. **Der Kategorievergleich wird wiederverwendet:** `sameCategory` aus `mealCategory.ts`
   wird exportiert, nicht nachgebaut.

## Ausgangslage

```
WeekPlanArea (ui)
 ├─ candidates = randomCandidates(meals)       nicht ausgeblendete Gerichte
 ├─ Würfel an einer Zeile ──────→ pickMealFor(candidates, plan, slot, random)
 │                                 null → still nichts (WeekPlanArea.tsx:117)
 └─ "Zufallsauswahl generieren" → filledWeekPlan(candidates, random)
                                    leerer Plan, Mo-Frühstück … So-Abendessen der Reihe nach
                                    announce("Wochenplan neu gewürfelt, 28 Gerichte.")

pickMealFor (randomPlanning.ts:47)
 └─ narrowedBy(PLANNING_RULES, candidates, plan, slot)
      PLANNING_RULES = [rarestInThePlan]
      eine Regel, die nichts übrig lässt, wird übersprungen
 └─ left[floor(random() * left.length)]
```

- `PlanningRule` = `(candidates, plan, slot) => Meal[]` (`randomPlanning.ts:13`).
- `Meal.kind`: `'mainMeal' | 'breakfast' | 'snack' | 'none'` (`meal.ts:13`), neue
  Gerichte starten als `mainMeal` (`MealFormPage.tsx:35`).
- `Meal.categories` wird über `sameCategory` (`mealCategory.ts:19`, bisher nicht
  exportiert) ohne Groß-/Kleinschreibung verglichen.
- Plan: 7 Tage × `breakfast | lunch | snack | dinner` (`weekPlan.ts:17`), Nachbartage
  über `weekdayBefore`/`weekdayAfter` (`weekPlan.ts:46-52`).
- Ansage nach dem Wochenwurf fest mit 28 (`announcements.ts:337`). `plannedMealsPhrase`
  (`announcements.ts:254`) liefert `keine von 28` bzw. `21 von 28`.
- Die Zufallsquelle kommt in der App aus `Math.random` (`SignedInApp.tsx:97`), in den
  Komponententests aus `alwaysFirst` (liefert immer 0).

## Zielbild

```
pickMealFor(meals, plan, slot, random, mainMealTime?)
 ├─ candidates = randomCandidates(meals)
 ├─ allowed    = candidates.filter(kind passt zu slot)            hart  (Phase 1)
 │               lunch/dinner: + ein Hauptgericht pro Tag         hart  (Phase 1)
 │                 Gegenplatz leer → mainMealTime ?? mainMealTimeOf(random)
 ├─ allowed leer → null
 ├─ left = narrowedBy(PLANNING_RULES, allowed, plan, slot, random, meals)   weich
 │     otherThanPlanned        anderes als eingetragen          (Phase 2)
 │     apartFromSameCategory   Kategorie-Abstand                (Phase 2)
 │     stayingLikeTheDayBefore 50 % wie Vortag                  (Phase 3)
 │     rarestInThePlan         seltenstes (wie heute)
 └─ left[floor(random() * left.length)]

filledWeekPlan(meals, random)
 └─ je Tag: mainMealTime = mainMealTimeOf(random)
            je Zeit: pickMealFor(meals, plan, slot, random, mainMealTime)
```

Reihenfolge der Zufallswerte je Platz, damit die Tests mit festen Folgen planbar sind:
1. Münzwurf (nur Wochenwurf einmal zu Tagesbeginn oder Einzelwurf mit leerem
   Gegenplatz): `random() < 0.5` → `lunch`, sonst `dinner`.
2. Bleiben-Münze (nur Frühstücks-/Snack-Spalte, nur wenn am Vortag ein hier erlaubtes
   Gericht steht und es noch unter den Kandidaten ist): `random() < STAYING_CHANCE` →
   bleiben.
3. Auswahl aus dem Rest: `floor(random() * left.length)`, wie heute.

`alwaysFirst` (0) bedeutet also: Hauptgericht mittags, und in Frühstück und Snack wird
geblieben.

## Abstraktionen und Wiederverwendung

- `src/meals/domain/`
  - `randomPlanning.ts` - Kern der Änderung
    - `MainMealTime` - neu: `'lunch' | 'dinner'`
    - `mainMealTimeOf(random)` - neu: Münzwurf, später durch die Einstellung ersetzbar
    - `allowedFor(meals, plan, slot, mainMealTime)` - neu (intern): harte Filter
    - `PlanningRule` - bekommt `random` und `meals` dazu
    - `otherThanPlanned`, `apartFromSameCategory`, `stayingLikeTheDayBefore` - neu
    - `rarestInThePlan` - unverändert in der Logik, neue Signatur
    - `narrowedBy`, `pickMealFor`, `filledWeekPlan` - neue Signaturen (siehe Zielbild)
  - `mealCategory.ts` - `sameCategory` exportieren
  - `announcements.ts` - `weekPlanShuffledAnnouncement(plannedMeals)`,
    neu `noMatchingMealAnnouncement(slot, naming)`
  - `randomPlanning.test.ts`, `announcements.test.ts` - Tests
- `src/meals/ui/`
  - `WeekPlanArea.tsx` - übergibt `meals`, sagt „kein passendes Gericht“ und die
    tatsächliche Zahl an
  - `WeekPlanArea.test.tsx` - bestehende Würfel-Tests auf passende Gerichtsarten
    umstellen, neue Tests
- `e2e/weekPlan.spec.ts` - Erwartungen an die Regeln anpassen, ein Regeltest

## Umsetzung

### Phase 1: Platzregeln und ein Hauptgericht pro Tag

Abhängigkeiten: keine

Nach dieser Phase würfelt die App nur noch passende Gerichte. Jeder Tag hat genau ein
Hauptgericht, und VoiceOver hört, wie viele Plätze belegt sind oder dass nichts passt.

**Aufgaben**:

- [x] `randomPlanning.test.ts`: Die Hilfsfunktion `meal(id)` bekommt einen optionalen
  Parameter `kind` (Standard `'mainMeal'`) und `categories`. Zuerst die fehlschlagenden
  Tests für die folgenden Punkte schreiben.
- [x] `randomPlanning.ts`: `MainMealTime` und `mainMealTimeOf` einführen.
  ```ts
  export type MainMealTime = 'lunch' | 'dinner'

  export function mainMealTimeOf(random: RandomSource): MainMealTime {
    return random() < 0.5 ? 'lunch' : 'dinner'
  }
  ```
  Die 0,5 bekommt einen sprechenden Namen (`EVEN_CHANCE`).
- [x] `randomPlanning.ts`: harte Filter nach Platz und Art.
  ```ts
  const KINDS_ROLLED_AT: Record<MealTime, readonly MealKind[]> = {
    breakfast: ['breakfast', 'snack'],
    lunch: ['mainMeal', 'none', 'snack'],
    snack: ['snack'],
    dinner: ['mainMeal', 'none', 'snack'],
  }
  ```
  Mittag/Abend zusätzlich über den Gegenplatz (`lunch` ↔ `dinner`, Gericht über
  `shownMealIn(plan, other, meals)`):
  - Gegenplatz ist ein `mainMeal` → nur `none`/`snack`
  - Gegenplatz belegt, aber kein `mainMeal` → nur `mainMeal`
  - Gegenplatz leer → `slot.time === (mainMealTime ?? mainMealTimeOf(random))`
    ? nur `mainMeal` : nur `none`/`snack`
- [x] `randomPlanning.ts`: `pickMealFor(meals, plan, slot, random, mainMealTime = null)`
  bildet `randomCandidates(meals)`, wendet die harten Filter an und gibt bei leerer Menge
  `null` zurück. Danach folgen `narrowedBy` und die Auswahl wie heute.
- [x] `randomPlanning.ts`: `filledWeekPlan(meals, random)` wirft pro Tag einmal
  `mainMealTimeOf(random)` (vor dem Frühstück des Tages) und reicht den Wert an jedes
  `pickMealFor` des Tages weiter. Plätze ohne passendes Gericht bleiben `null`.
- [x] `randomPlanning.test.ts`: neue Tests, u. a.:
  - Frühstück würfelt nur `breakfast`/`snack`, Snack-Spalte nur `snack`
  - mittags/abends nie `breakfast`
  - Gegenplatz Hauptgericht → `none`/`snack`; Gegenplatz `none`, Snack oder von Hand
    gesetztes Frühstück → nur Hauptgericht; Gegenplatz leer → Münzwurf entscheidet
    (Folge `[0, …]` → mittags Hauptgericht, `[0.5, …]` → abends)
  - Gegenplatz mit ausgeblendetem Hauptgericht zählt als Hauptgericht
  - Gegenplatz mit unbekannter ID zählt als leer
  - kein passendes Gericht → `null`, auch wenn es Kandidaten gibt
  - `filledWeekPlan` mit je einem Gericht jeder Art: jeder Tag hat genau ein
    Hauptgericht mittags oder abends, der andere Platz `none` oder Snack
  - `filledWeekPlan` nur mit Hauptgerichten: 7 belegte Plätze, Frühstück, Snack und der
    jeweils andere Platz leer
  - `mainMealTimeOf`: `0` → `lunch`, `0.49` → `lunch`, `0.5` → `dinner`
- [x] `randomPlanning.test.ts`: bestehende Tests der neuen Signatur anpassen. Die
  Verteilungstests (`fills 28 slots with 28 meals …`, `spreads three meals …`,
  `walks through the candidates …`) so umbauen, dass sie mit passenden Arten dieselbe
  Aussage treffen, also keine Wiederholung bei genug Gerichten und gleichmäßige
  Verteilung innerhalb einer Art.
- [x] `announcements.ts`: `weekPlanShuffledAnnouncement(plannedMeals: number)` →
  `Wochenplan neu gewürfelt, ${plannedMealsPhrase(plannedMeals)} Gerichten.`
  Neu `noMatchingMealAnnouncement(slot, naming)` →
  `${slotName(slot, naming)}, kein passendes Gericht.` Dazu die Tests in
  `announcements.test.ts` (21, 28, 0 → `keine von 28`, Tages- und Wochenansicht).
- [x] `WeekPlanArea.tsx`:
  - `shuffleSlot` ruft `pickMealFor(meals, weekPlanning.plan, slot, random)`. Bei `null`
    folgt `announce(noMatchingMealAnnouncement(slot, slotNamingIn(shownView)))`, der
    Plan bleibt unverändert.
  - `shuffleWeek` berechnet den Plan einmal, schreibt ihn und sagt
    `weekPlanShuffledAnnouncement(plannedMealCount(rolled, meals))` an.
  - `randomCandidateCount` bleibt `randomCandidates(meals).length`.
- [x] `WeekPlanArea.test.tsx`: Fixtures ergänzen (`meal(id, name, items, kind)` oder
  eigene Helfer `breakfastMeal`, `snackMeal`, `sideMeal` für `none`). Diese Tests auf
  passende Arten umstellen:
  - `rolls a meal for one meal time and says which one it is` (Frühstück → Frühstücksgericht)
  - `leaves the other meal times alone while it rolls one` (Snack → Snack-Gericht)
  - `rolls the other meal on the second press` (Frühstück → zwei Frühstücksgerichte;
    hält bis Phase 3 nur über `rarestInThePlan`, siehe dort)
  - `rolls the whole week over a meal time that was chosen by hand` (erwartete Belegung
    aus den Regeln ableiten, Ansage `…, 28 von 28 Gerichten.` nur bei vollständiger
    Belegung durch Gerichte aller Arten)
  - `rolls the whole week and not only the shown day`
  - `never rolls a hidden meal for a meal time`, `never rolls a hidden meal into the week`
- [x] `WeekPlanArea.test.tsx`: neue Tests:
  - nur Hauptgerichte → Woche würfeln → `Wochenplan, 7 von 28` und Ansage
    `Wochenplan neu gewürfelt, 7 von 28 Gerichten.`
  - Würfel an Frühstück bei nur Hauptgerichten → Ansage
    `Frühstück, kein passendes Gericht.`, von Hand gesetztes Gericht bleibt stehen
  - dasselbe in der Wochenansicht → `Montag, kein passendes Gericht.`
  - von Hand lässt sich ein Hauptgericht ins Frühstück setzen (Vorschlag), Ansage wie heute
  - Mittag hat von Hand ein Hauptgericht → Würfel an Abendessen bringt `none`/Snack
- [x] `e2e/weekPlan.spec.ts`, `plans a week and puts its items on the shopping list`:
  Nach dem Wochenwurf mit der einzigen Bolognese (Hauptgericht) ergibt sich
  `Wochenplan, 7 von 28`, die Ansage `…, 7 von 28 Gerichten.`, 7 belegte Plätze auf dem
  Server und auf der Einkaufsliste `Hackfleisch, 3500 g` und `Spaghetti, 7`.
- [x] `e2e/weekPlan.spec.ts`, `never rolls a hidden meal into the week`: 7 statt 28
  Einträge, weiterhin nur Bolognese. Die Frühstücks- und Sonntagsprüfung ersetzen durch:
  Jeder Tag hat Bolognese entweder mittags oder abends (über `weekPlanOnServer`).
- [x] `e2e/weekPlan.spec.ts`: neuer Test `rolls every meal into a slot that suits it`.
  Über `storeMealOnServer` werden Müsli (`breakfast`), Apfel (`snack`), Brot (ohne
  Flags → `none`) und Bolognese (`mainMeal`) angelegt, dann wird die Woche gewürfelt.
  Auf dem Server liegt danach in jeder Frühstücks-Spalte Müsli oder Apfel, in jeder
  Snack-Spalte Apfel, und jeder Tag hat genau eine Bolognese mittags oder abends. Die
  genauen Flag-Namen von `StoredMealFlags` beim Umsetzen in `e2e/emulatorHousehold.ts`
  nachsehen.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/meals/domain/randomPlanning.test.ts` grün
- [x] `npx vitest run src/meals/domain/announcements.test.ts` grün
- [x] `npx vitest run src/meals/ui/WeekPlanArea.test.tsx` grün
- [x] `npm run test` grün (inkl. Architekturtest `domainLayerBoundary`)
- [x] `npm run lint` und `npm run build` fehlerfrei
- [x] E2E `e2e/weekPlan.spec.ts` grün

**Manuelle Verifikation**:

- [ ] Auf dem Gerät mit echten Gerichten die Woche würfeln: Frühstück nur Frühstück
  oder Snack, Snack-Spalte nur Snacks, pro Tag genau ein Hauptgericht, mal mittags und
  mal abends.
- [ ] Mit VoiceOver: Ansage nach dem Wochenwurf nennt die richtige Zahl. Ein Würfel an
  einer Zeile ohne passendes Gericht sagt „…, kein passendes Gericht.“

### Phase 2: Abwechslung — anderes Gericht beim Einzelwurf und Kategorie-Abstand

Abhängigkeiten: Phase 1

**Aufgaben**:

- [x] `randomPlanning.ts`: `PlanningRule` auf
  `(candidates, plan, slot, random, meals) => readonly Meal[]` erweitern. `narrowedBy`
  reicht beides durch, `rarestInThePlan` ignoriert die neuen Argumente.
- [x] `randomPlanning.ts`: `otherThanPlanned` entfernt das Gericht, das gerade in
  `slot` steht. Auf einem leeren Platz ändert die Regel nichts.
- [x] `mealCategory.ts`: `sameCategory` exportieren.
- [x] `randomPlanning.ts`: `apartFromSameCategory`
  - greift nur für Kandidaten der Art `mainMeal`/`none`. Frühstück und Snack lässt sie
    durch.
  - Nachbarn sind `lunch` und `dinner` von Vortag, selbem Tag und Folgetag
    (`weekdayBefore`/`weekdayAfter`), ohne `slot` selbst. Es zählen nur Gerichte der
    Art `mainMeal`/`none` (über `shownMealIn` mit allen `meals`).
  - Sie entfernt Kandidaten, die mit einem Nachbarn eine Kategorie teilen
    (`sameCategory`).
- [x] `PLANNING_RULES = [otherThanPlanned, apartFromSameCategory, rarestInThePlan]`
- [x] `randomPlanning.test.ts`: Tests für
  - `otherThanPlanned`: entfernt das eingetragene Gericht, lässt einen leeren Platz in
    Ruhe, wird bei einem einzigen passenden Gericht übersprungen (also wieder dasselbe)
  - `apartFromSameCategory`: Vortag, Folgetag, selber Tag (Mittag ↔ Abend), Groß-/
    Kleinschreibung (`Nudeln` = `nudeln`), Snack- oder Frühstücksnachbar mit gleicher
    Kategorie zählt nicht, Snack-Kandidat mit gleicher Kategorie bleibt, Montag hat
    keinen Vortag, Sonntag keinen Folgetag, ausgeblendetes Nachbargericht zählt
  - Kette: Kategorie-Abstand vor `rarestInThePlan`. Lässt der Abstand nichts übrig,
    entscheidet `rarestInThePlan` allein.
  - `filledWeekPlan` mit zwei Kategorien im Wechsel: keine zwei Tage hintereinander
    mit derselben Kategorie bei Hauptgerichten
- [x] `WeekPlanArea.test.tsx`: `rolls the other meal on the second press` hält jetzt über
  `otherThanPlanned`. Neuer Test: Mittag Lasagne [Nudeln] von Hand, Würfel an
  Abendessen mit Carbonara [Nudeln] (`none`) und Brot [Brot] (`none`) → Brot.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/meals/domain/randomPlanning.test.ts` grün
- [x] `npx vitest run src/meals/ui/WeekPlanArea.test.tsx` grün
- [x] `npm run test`, `npm run lint`, `npm run build` fehlerfrei

**Manuelle Verifikation**:

- [ ] Auf dem Gerät mehrfach die Woche würfeln: Kein Hauptgericht und kein `none`-Gericht
  mit gleicher Kategorie steht am selben Tag oder an zwei Tagen hintereinander, sofern
  genug Gerichte anderer Kategorien vorhanden sind.
- [ ] Ein zweiter Druck auf den Würfel einer Zeile bringt ein anderes Gericht.

### Phase 3: Frühstück und Snack bleiben gern wie am Vortag

Abhängigkeiten: Phase 2

**Aufgaben**:

- [x] `randomPlanning.ts`: `STAYING_CHANCE = 0.5` und `stayingLikeTheDayBefore`
  - greift nur für `slot.time` `breakfast` oder `snack` und nur, wenn am Vortag
    (`weekdayBefore`) auf derselben Zeit ein Gericht steht, das unter den Kandidaten ist.
    Sonst lässt sie alles durch und verbraucht **keinen** Zufallswert.
  - `random() < STAYING_CHANCE` → nur das Vortagsgericht
  - sonst → alle Kandidaten ohne das Vortagsgericht (lässt das nichts übrig, wird die
    Regel übersprungen, und das Vortagsgericht bleibt möglich)
- [x] `PLANNING_RULES = [otherThanPlanned, apartFromSameCategory,
  stayingLikeTheDayBefore, rarestInThePlan]`
- [x] `randomPlanning.test.ts`: Tests für
  - bleiben bei `0`, wechseln bei `0.5` und `0.99`
  - Montag: keine Münze, kein Verbrauch eines Zufallswerts
  - Vortag leer oder mit einem hier nicht erlaubten Gericht (von Hand gesetzte
    Bolognese im Frühstück): keine Münze
  - Mittag/Abend: Regel greift nie, auch nicht bei einem Snack
  - Einzelwurf: Dienstag Müsli eingetragen, Montag Müsli → `otherThanPlanned` entfernt
    Müsli, bleiben wird übersprungen, es kommt ein anderes Gericht
  - `filledWeekPlan` mit `sequence([0])` und drei Frühstücksgerichten: alle 7
    Frühstücke gleich. Mit einer Folge, die ab Dienstag ≥ 0.5 an der Bleiben-Stelle
    liefert, wechselt das Frühstück jeden Tag.
- [x] Bestehende Tests, deren feste Zufallsfolgen durch die zusätzliche Münze
  verschoben werden, anpassen (vor allem die Verteilungstests aus Phase 1 und
  `WeekPlanArea.test.tsx` mit `alwaysFirst`).
- [x] `docs/notes.txt`: die erledigten Einträge „Regeln für die Zufallsauswahl“ und
  die zugehörigen „Zufallsregeln …“-Punkte auf `x` setzen und nach DONE verschieben.
  „Kategorien nutzen“ und das Dropdown „Hauptmahlzeit“ bleiben offen.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/meals/domain/randomPlanning.test.ts` grün
- [x] `npm run test`, `npm run lint`, `npm run build` fehlerfrei
- [x] E2E `e2e/weekPlan.spec.ts` grün

**Manuelle Verifikation**:

- [ ] Auf dem Gerät mit mehreren Frühstücks- und Snack-Gerichten die Woche würfeln:
  Frühstück und Snack wiederholen sich in Blöcken (z. B. Müsli, Müsli, Brot, Joghurt,
  Joghurt), statt jeden Tag zu wechseln.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: `useMeals` liefert die Gerichte nach Namen sortiert. In
  `rolls the whole week over a meal time that was chosen by hand` steht deshalb am
  Montag früh der Apfel (vor Müsli), ab Dienstag das seltenere Müsli.
- Phase 1: Ein Gericht ohne Flags gilt laut `toKind` (`firestoreMealsClient.ts`) als
  `mainMeal`, nicht als `none`. Im E2E-Test wird Brot deshalb mit
  `{ mainMeal: false }` angelegt.
- Phase 1: Neuer E2E-Helfer `weekPlanMealNamesOnServer` (Plan mit Gerichtnamen statt
  IDs). Der neue E2E-Test wartet vor dem Würfeln, bis der Knopf freigegeben ist, weil
  die direkt auf dem Server angelegten Gerichte erst geladen sein müssen.
- Phase 2: `may pick the same meal again …` würfelte den Platz, auf dem das Müsli
  selbst steht; `otherThanPlanned` nimmt es dort jetzt heraus. Der Test belegt
  stattdessen Dienstag und würfelt den leeren Montag.
- Phase 2: Der Kategorie-Abstand zählt nur Nachbarn mittags/abends der Art
  `mainMeal`/`none`; ein Frühstück oder Snack dort zählt nicht, auch von Hand gesetzt.
- Phase 3: Mit `alwaysFirst` bleibt jetzt jedes Frühstück und jeder Snack wie am
  Vortag. `rolls the whole week over a meal time that was chosen by hand` erwartet
  deshalb an jedem Tag Apfel, Bolognese, Apfel, Brot.
- Phase 3: Die Verteilungstests (`fills every slot …`, `spreads the meals …`) laufen
  mit `sequence([0.99])`, also ohne Bleiben; sonst widerspräche das Bleiben ihrer
  Aussage.

## Verweise

- `docs/notes.txt`: „Regeln für die Zufallsauswahl“, „Zufallsregeln …“, „Dropdown in
  Einstellungen: Hauptmahlzeit …“
- `docs/agents/plans/2026-09-19-wochenplan-mit-zufallsauswahl.md` (Ursprung von
  `PLANNING_RULES`)
- `docs/agents/plans/2026-09-25-wochenplan-tagesansicht-mit-vier-mahlzeiten.md`
  (MZP-028, vier Plätze pro Tag)
- `docs/agents/plans/2026-09-25-snack-kennzeichnen.md` (MZP-026, `kind: 'snack'`)
- `docs/agents/plans/2026-09-24-kategorien-fuer-gerichte.md` (MZP-021, `categories`)
