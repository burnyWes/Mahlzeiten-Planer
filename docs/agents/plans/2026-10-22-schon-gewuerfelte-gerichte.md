---
date: 2026-10-22T06:14:26.105392+00:00
git_commit: 4f90e9ad7ea327c0637566d0cb82ddcd3c8a99d3
branch: main
story: MZP-044
topic: "Schon gewürfelte Gerichte beim Einzelwürfeln merken"
tags: [plan, meals, randomPlanning, rollingRules, rollMemory, useWeekPlan, WeekPlanArea, RollingRulesPage, announcements, voiceover, e2e]
status: done
---

# PLAN: MZP-044 — Schon gewürfelte Gerichte beim Einzelwürfeln merken

Wer einen einzelnen Platz im Wochenplan mehrmals würfelt, soll nicht dieselben
Gerichte wieder und wieder sehen. Jeder Platz merkt sich, welche Gerichte in der
laufenden Runde schon dort standen. Erst wenn alle passenden Gerichte dran waren,
beginnt ein neuer Durchgang. Das Gedächtnis gilt, bis der Plan festgelegt wird, und
lässt sich in der Regel-Verwaltung als Regel „Schon gewürfelte Gerichte“ abschalten.

Alle Entscheidungen stammen aus der Befragung vom 2026-10-22.

Beispiel mit den Gerichten G1, G2, G3 an einem anfangs leeren Platz:

```
Würfeln 1 → G2      gemerkt {G2}
Würfeln 2 → G1      gemerkt {G2, G1}
Würfeln 3 → G3      gemerkt {G2, G1, G3} = alle
Würfeln 4 → neuer Durchgang, gezogen aus allen außer G3 (steht gerade im Platz)
            → G1    gemerkt {G3, G1}     Ansage beginnt mit
                                         „Alle passenden Gerichte waren schon dran.“
Würfeln 5 → G2      gemerkt {G3, G1, G2} = alle
Würfeln 6 → neuer Durchgang …
```

## Akzeptanzkriterien

- Würfeln eines einzelnen Platzes („Zufallsgericht für …“) bringt kein Gericht, das in
  der laufenden Runde schon an diesem Platz stand. Gemerkt werden bei jedem Würfeln
  **das ersetzte und das neue Gericht**. Das gilt auch für ein Gericht, das vorher aus
  dem Gesamtplan oder von Hand im Platz stand.
- Das Gedächtnis gilt je Platz (Datum und Tageszeit). Würfeln an Montag Mittag
  beeinflusst Dienstag Mittag und Montag Abend nicht.
- „Ausgeschöpft“ heißt: Jedes Gericht, das nach der harten Grenze (sichtbar, passende
  Art zur Tageszeit) und den Verboten („Anderes Gericht“, „Kategorien“) übrig bleibt,
  steht schon im Gedächtnis. Dann beginnt ein neuer Durchgang. Gezogen wird aus diesen
  Gerichten außer dem, das gerade im Platz steht, und das Gedächtnis des Platzes
  enthält danach nur das ersetzte und das neue Gericht.
- Gibt es nur ein einziges mögliches Gericht, kommt es wieder, und es gilt als neuer
  Durchgang.
- Verbote gehen vor: Ein Gericht, das „Kategorien“ ausschließt, kommt auch dann nicht,
  wenn es noch nicht gewürfelt wurde (es sei denn, „Kategorien“ ist abgeschaltet oder
  würde alle Gerichte ausschließen, wie heute).
- Die Vorlieben „Frühstück und Snack wiederholen“ und „Abwechslung“ wählen nur noch
  unter den Gerichten, die in dieser Runde nicht gewürfelt wurden.
- Bei einem neuen Durchgang beginnt die Ansage mit
  „Alle passenden Gerichte waren schon dran.“, gefolgt von der gewohnten Ansage,
  etwa „Alle passenden Gerichte waren schon dran. Mittagessen, Bolognese.“ Ohne
  Neustart bleibt die Ansage wie heute.
- Das Gedächtnis liegt im Arbeitsspeicher des Geräts, auf Höhe der App. Es übersteht
  den Wechsel in einen anderen Bereich und zurück, „Zufallsauswahl generieren“,
  „Wochenplan leeren“, das Leeren eines Platzes, die Wahl von Hand und den Wechsel des
  Zeitraums. Nach einem Neuladen ist es leer. Es wird weder in Firestore noch im
  Browser gespeichert und nicht zwischen Geräten geteilt.
- Sobald der Plan festgelegt ist, ist das Gedächtnis leer. Das gilt für „Plan
  festlegen“ auf diesem Gerät ebenso wie für eine festgelegte Stufe, die vom anderen
  Gerät ankommt.
- „Zufallsauswahl generieren“ (Gesamtplan) verhält sich unverändert und liest oder
  schreibt das Gedächtnis nicht.
- Die Regel-Verwaltung zeigt direkt unter „Anderes Gericht“ die Gruppe „Schon
  gewürfelte Gerichte“ (Überschrift Ebene 2) mit der Erklärung „Neu würfeln bringt erst
  alle anderen passenden Gerichte, bevor eines wiederkommt. Gilt je Platz, bis der Plan
  festgelegt wird.“ und einem einzigen Schalter mit der sichtbaren Beschriftung
  „Einzelgericht“. Sein Zugänglichkeitsname ist „Schon gewürfelte Gerichte,
  Einzelgericht“, die Erklärung ist seine Beschreibung.
- Der Schalter ist nach dem Update ohne Migration eingeschaltet. Ausgeschaltet steht er
  als `'alreadyRolled.singleMeal'` in `switchedOff`, gilt für den Haushalt und übersteht
  ein Neuladen.
- Ist der Schalter aus, würfelt der Platz wie heute. Das Gedächtnis wird dann weder
  angewendet noch fortgeschrieben, aber auch nicht geleert.

## Wesentliche Entscheidungen und Abwägungen

1. **Gemerkt wird das ersetzte und das neue Gericht.**
   - Warum: Wer würfelt, lehnt das Gericht ab, das gerade im Platz steht, egal woher es
     kam.
   - Auswirkung: Auch ein neuer Durchgang startet mit dem zuletzt abgelehnten Gericht
     im Gedächtnis. Es kommt erst wieder, wenn alle anderen dran waren, und zwar
     unabhängig von „Anderes Gericht“.
2. **Stellung in der Kette: Verbote → Gedächtnis → Vorlieben.**
   - Warum: „Kategorien“ soll vorgehen (Wunsch des Nutzers). Hinter „Frühstück
     wiederholen“ würde das Gedächtnis abgelehnte Vortags-Gerichte zurückbringen, und
     hinter „Abwechslung“ wäre es nach zwei Würfen „ausgeschöpft“.
   - Auswirkung: `PLANNING_RULE_ORDER` wird zu `otherMeal → categories → alreadyRolled →
     repeatingBreakfastAndSnack → variety`.
3. **Das Gedächtnis ist eine Planungsregel `alreadyRolled`.** `PlanningRule` bekommt
   die gemerkten Gerichte des Platzes als sechsten Parameter `rolledBefore`.
   - Warum: Die Regel fügt sich in `narrowedBy` ein. Dessen „Regel wird übersprungen,
     wenn nichts übrig bleibt“ erledigt den Fall „nur ein Gericht möglich“.
   - Auswirkung: Die bestehenden Regeln ignorieren den neuen Parameter. Gesamtplan
     und alle bisherigen Aufrufe übergeben `[]`.
4. **Neustart wird am Ergebnis erkannt:** Steht das gezogene Gericht schon im
   Gedächtnis, war die Runde ausgeschöpft.
   - Warum: Solange es ungewürfelte Gerichte gibt, verengen alle späteren Regeln nur
     innerhalb dieser, und das gezogene Gericht ist neu. Ist alles ausgeschöpft, kommt
     es zwangsläufig aus dem Gedächtnis. Es braucht also keinen zusätzlichen
     Rückgabekanal aus der Kette.
   - Auswirkung: `rememberedRoll` in `rollMemory.ts` entscheidet allein aus Gedächtnis,
     ersetztem und gezogenem Gericht und liefert `startedOver` für die Ansage.
5. **Zustand im Arbeitsspeicher in `useWeekPlan`.**
   - Warum: `useWeekPlan` lebt dauerhaft in `SignedInApp` (`WeekPlanArea` wird beim
     Bereichswechsel abgebaut) und sieht als Einziges die Stufenwechsel beider Geräte.
   - Auswirkung: neues Feld `rollMemory` und Funktion `rememberRolls`. Das Gedächtnis
     wird in `changeStage` und im `observeStage`-Rückruf geleert, sobald die Stufe
     festgelegt ist (`isFixed`).
6. **Neue schaltbare Regel `alreadyRolled`, nur `singleMeal`.**
   - Warum: gleiches Muster wie `otherMeal`. Gespeichert wird nur Abgeschaltetes.
   - Auswirkung: keine Migration. `RollingRulesPage` rendert die Gruppe ohne eigenen
     Code. In `SWITCHABLE_RULES` steht sie direkt hinter `'otherMeal'`.
7. **Eine Phase.**
   - Warum: Die Regel muss als `SwitchableRule` in der Kette stehen, damit ihre
     Stellung stimmt. Damit erscheint der Schalter sofort, und ein Schnitt „erst
     Gedächtnis, dann Schalter“ wäre künstlich.

## Ausgangslage

```
WeekPlanRow [Zufallsgericht für …] ─▶ WeekPlanArea.shuffleSlot(slot)   WeekPlanArea.tsx:151
   pickMealFor(meals, plan, slot, random, rules, 'singleMeal')         randomPlanning.ts:265
     ├─ allowedFor: sichtbar + Art passt zur Tageszeit                  :114
     ├─ narrowedBy(planningRulesFor(rules, 'singleMeal'), …)            :251
     │     otherMeal → categories → repeatingBreakfastAndSnack → variety   :234
     │     (Regel ohne Rest wird übersprungen)                           :261
     └─ Zufallsgriff                                                    :291
   rolledInto(…) → weekPlanning.replacePlan → Firestore
   announce(plannedAnnouncement(…))   „Mittagessen, Bolognese.“
```

- `otherMeal` (`randomPlanning.ts:149`) schließt nur das Gericht aus, das gerade im
  Platz steht. Bei drei Gerichten ist deshalb 2 → 1 → 2 möglich.
- „Plan festlegen“ ist `WeekPlanArea.toggleStage` → `weekPlanning.changeStage(FIXED_STAGE)`
  (`WeekPlanArea.tsx:200`). Die Stufe des anderen Geräts kommt über
  `client.observeStage` in `useWeekPlan.ts:62` an.
- `useWeekPlan` wird in `SignedInApp.tsx:136` aufgerufen und lebt über alle
  Bereichswechsel. `WeekPlanArea` existiert nur, solange der Wochenplan offen ist
  (`SignedInApp.tsx:275`).
- Schaltbare Regeln: `SwitchableRule`, `SWITCHABLE_RULES` und `SCOPES_OF_RULE` in
  `rollingRules.ts:25-49`. Namen und Erklärungen stehen in `announcements.ts:123-141`.

## Zielbild

Ablauf nachher:

```
WeekPlanArea.shuffleSlot(slot)
  roll = rollSingleMeal(meals, plan, slot, random, rules, weekPlanning.rollMemory)
  │   ├─ pickMealFor(…, 'singleMeal', null, rolledAt(memory, slot))
  │   │    allowedFor
  │   │    → otherMeal → categories → alreadyRolled → repeating… → variety
  │   │    → Zufallsgriff
  │   └─ appliesIn(rules, 'alreadyRolled', 'singleMeal')
  │        ? rememberedRoll(memory, slot, mealIn(plan, slot), picked.id)
  │        : { memory, startedOver: false }
  roll === null → „…, kein passendes Gericht.“ (wie heute)
  weekPlanning.rememberRolls(roll.memory)
  rolledInto(…) → replacePlan
  announce(roll.startedOver
             ? „Alle passenden Gerichte waren schon dran. “ + plannedAnnouncement
             : plannedAnnouncement)

useWeekPlan
  rollMemory: RollMemory  (useState, EMPTY_ROLL_MEMORY)
  changeStage(written)        → isFixed(written)  ⇒ rollMemory leeren
  observeStage(arriving)      → isFixed(arriving) ⇒ rollMemory leeren
```

Regel `alreadyRolled` (`randomPlanning.ts`):

```ts
export const notRolledBefore: PlanningRule = (
  candidates, plan, slot, _random, _meals, rolledBefore,
) => {
  const unrolled = candidates.filter((meal) => !rolledBefore.includes(meal.id))
  if (unrolled.length > 0) return unrolled
  return candidates.filter((meal) => meal.id !== mealIn(plan, slot))
}
```

Ist auch nach dem Neustart nichts übrig (nur das gerade stehende Gericht ist möglich),
liefert die Regel `[]`. `narrowedBy` überspringt sie dann, und dieses Gericht kommt
wieder.

Gedächtnis (`src/meals/domain/rollMemory.ts`, neu):

```ts
export type RollMemory = readonly { slot: PlanSlot; meals: readonly MealId[] }[]

export const EMPTY_ROLL_MEMORY: RollMemory = []

export function rolledAt(memory: RollMemory, slot: PlanSlot): readonly MealId[]

export type RememberedRoll = { memory: RollMemory; startedOver: boolean }

export function rememberedRoll(
  memory: RollMemory,
  slot: PlanSlot,
  replaced: MealId | null,
  rolled: MealId,
): RememberedRoll
```

`rememberedRoll`:
- `startedOver = rolledAt(memory, slot).includes(rolled)`
- Gemerkt bleiben bei `startedOver` keine bisherigen Gerichte, sonst alle bisherigen.
  Dazu kommen `replaced` (wenn nicht `null`) und `rolled`, ohne Doppelte.
- Andere Plätze bleiben unverändert. Ein Platz wird über `sameSlot` gefunden.

Regel-Verwaltung, Ausschnitt:

```
Vorher                                    Nachher
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ Anderes Gericht                      │  │ Anderes Gericht                      │
│ Neu würfeln bringt ein anderes       │  │ Neu würfeln bringt ein anderes       │
│ Gericht als das bisherige.           │  │ Gericht als das bisherige.           │
│   Einzelgericht                [ ● ] │  │   Einzelgericht                [ ● ] │
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ Vorrat                               │  │ Schon gewürfelte Gerichte            │
│ Auf die Einkaufsliste zieht die      │  │ Neu würfeln bringt erst alle anderen │
│ Gerichte aus dem Vorrat ab.          │  │ passenden Gerichte, bevor eines      │
│   Auf die Einkaufsliste        [ ● ] │  │ wiederkommt. Gilt je Platz, bis der  │
└──────────────────────────────────────┘  │ Plan festgelegt wird.                │
                                          │   Einzelgericht                [ ● ] │
                                          ├──────────────────────────────────────┤
                                          │ Vorrat                               │
                                          │ …                                    │
                                          └──────────────────────────────────────┘
```

VoiceOver: „Schon gewürfelte Gerichte, Einzelgericht, Schalter, ein. Neu würfeln bringt
erst alle anderen passenden Gerichte, bevor eines wiederkommt. Gilt je Platz, bis der
Plan festgelegt wird.“

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `rollMemory.ts` (neu): `RollMemory`, `EMPTY_ROLL_MEMORY`, `rolledAt`,
    `RememberedRoll`, `rememberedRoll`. Nutzt `sameSlot` und `PlanSlot` aus
    `weekPlan.ts` sowie `MealId` aus `meal.ts`.
  - `rollingRules.ts`: `SwitchableRule` um `'alreadyRolled'`,
    `SWITCHABLE_RULES` mit `'alreadyRolled'` direkt hinter `'otherMeal'`,
    `SCOPES_OF_RULE.alreadyRolled = ['singleMeal']`.
  - `randomPlanning.ts`:
    - `PlanningRule` mit sechstem Parameter `rolledBefore: readonly MealId[]`
    - neue Regel `notRolledBefore`, in `PLANNING_RULE_OF` und an dritter Stelle in
      `PLANNING_RULE_ORDER`
    - `narrowedBy(…, rolledBefore)` reicht ihn an jede Regel weiter
    - `pickMealFor(…, mainMealTime = null, rolledBefore: readonly MealId[] = [])`.
      Die 56 bestehenden Aufrufe in `randomPlanning.test.ts` und `filledDay` bleiben
      ohne den Parameter.
    - neu `SingleRoll = { meal: Meal; memory: RollMemory; startedOver: boolean }` und
      `rollSingleMeal(meals, plan, slot, random, rules, memory): SingleRoll | null`
  - `announcements.ts`: Name und Erklärung für `alreadyRolled`, neue Funktion
    `allMealsRolledAnnouncement()` → `'Alle passenden Gerichte waren schon dran.'`
- `src/meals/ui`
  - `useWeekPlan.ts`: `WeekPlanning.rollMemory` und
    `WeekPlanning.rememberRolls(memory: RollMemory)`. Leeren in `changeStage` und im
    `observeStage`-Rückruf bei `isFixed`.
  - `WeekPlanArea.tsx`: `shuffleSlot` über `rollSingleMeal` und `rememberRolls`, mit
    vorangestellter Neustart-Ansage. `pickMealFor` wird dort nicht mehr importiert.
  - `RollingRulesPage.tsx`: keine Änderung, die Gruppe erscheint aus
    `SWITCHABLE_RULES`.
- `src/meals/api`: keine Änderung. `firestoreWeekPlanClient.ts` liest und schreibt
  `switchedOff` generisch über `ruleInScopeKey`/`rollingRulesFromStored`.
- `docs/architektur/05-bausteinsicht.md:176`: Im Knoten `weekPlan` kommt `rollMemory`
  dazu.

## Umsetzung

Abhängigkeiten: keine

**Aufgaben**:

Domäne (test-getrieben, erst der rote Test):

- [x] `src/meals/domain/rollMemory.ts` mit Tests in `rollMemory.test.ts`:
  - `rolledAt(EMPTY_ROLL_MEMORY, slot)` ist `[]`
  - Erster Wurf in einen leeren Platz: `rememberedRoll(EMPTY, mo, null, 'g2')` →
    gemerkt `['g2']`, `startedOver: false`
  - Ersetztes zählt mit: `rememberedRoll(EMPTY, mo, 'g3', 'g1')` → `['g3', 'g1']`
  - Fortschreiben: `{mo: ['g2']}` mit ersetzt `'g2'`, gezogen `'g1'` → `['g2', 'g1']`
    ohne Doppelte, `startedOver: false`
  - Neustart: `{mo: ['g2', 'g1', 'g3']}` mit ersetzt `'g3'`, gezogen `'g1'` →
    `['g3', 'g1']`, `startedOver: true`
  - Einziges Gericht: `{mo: ['g1']}` mit ersetzt `'g1'`, gezogen `'g1'` → `['g1']`,
    `startedOver: true`
  - Andere Plätze bleiben unberührt: Gedächtnis für Mo Mittag und Di Mittag, Wurf an Mo
    Mittag ändert Di Mittag nicht, und Mo Abend bleibt `[]`
- [x] `src/meals/domain/rollingRules.ts`: `'alreadyRolled'` ergänzen (siehe
      *Abstraktionen*). Tests in `rollingRules.test.ts`:
  - die Listen-Erwartungen an `SWITCHABLE_RULES` (`:164`) und `SCOPES_OF_RULE`
    (`:177`) um `alreadyRolled` mit `['singleMeal']` hinter `otherMeal` ergänzen
  - `appliesIn(DEFAULT_ROLLING_RULES, 'alreadyRolled', 'singleMeal')` ist `true`
  - `rollingRulesFromStored` liest `'alreadyRolled.singleMeal'` und verwirft
    `'alreadyRolled.wholePlan'`
  - `withRuleSwitched` ignoriert `{ rule: 'alreadyRolled', scope: 'wholePlan' }`
- [x] `src/meals/domain/randomPlanning.ts`: `PlanningRule` um `rolledBefore`,
      `notRolledBefore`, Reihenfolge, `narrowedBy`, `pickMealFor`, `rollSingleMeal`
      (siehe *Zielbild*). Tests in `randomPlanning.test.ts`:
  - `notRolledBefore` lässt nur ungewürfelte Kandidaten übrig
  - `notRolledBefore` liefert bei ausgeschöpftem Gedächtnis alle außer dem Gericht im
    Platz, und `[]`, wenn nur dieses möglich ist
  - `planningRulesFor(DEFAULT_ROLLING_RULES, 'singleMeal')` ist
    `[otherThanPlanned, apartFromSameCategory, notRolledBefore,
    stayingLikeTheDayBefore, rarestInThePlan]`, für `'wholePlan'` unverändert ohne
    `notRolledBefore`. Bestehende Erwartungen (um `:1701`) entsprechend anpassen.
  - Mit `alreadyRolled.singleMeal` aus fehlt `notRolledBefore` in der Einzelliste
  - `rollSingleMeal`, Beispiel aus der Einleitung mit drei Hauptgerichten an einem
    leeren Platz, Würfe nacheinander mit fortgeschriebenem Plan und Gedächtnis: Würfe 1
    bis 3 bringen drei verschiedene Gerichte mit `startedOver: false`. Wurf 4 bringt
    eines der ersten beiden, nicht das dritte, mit `startedOver: true`, und das
    Gedächtnis enthält nur noch das dritte und das neue.
  - Verbot geht vor: G1 und G2 (Nudeln), G3 (Reis), Di Mittag Reis, Mo Mittag
    gemerkt `{G1, G2}`, Mo Mittag steht G2 → G1 mit `startedOver: true`, nie G3
  - Gegenprobe mit `categories.singleMeal` aus: gleiche Lage → G3,
    `startedOver: false`
  - Vorliebe nach dem Gedächtnis: Frühstück am Dienstag, Montag Müsli, Platz enthält
    Toast, gemerkt `{Müsli, Toast}`, Porridge noch frei, Zufall wählt „wie am Vortag“
    (`random` < 0,5) → Porridge mit `startedOver: false`. Stünde das Gedächtnis hinter
    der Vorliebe, käme Müsli.
  - Abwechslung nach dem Gedächtnis: das seltenste Gericht ist schon gemerkt, ein
    häufigeres nicht → das häufigere kommt, `startedOver: false`
  - Ersetztes zählt: Platz enthält G3 aus dem Gesamtplan, `otherMeal.singleMeal` aus,
    zwei Würfe bringen nie G3
  - Einziges mögliches Gericht im Platz → es kommt wieder, `startedOver: true`
  - Mit `alreadyRolled.singleMeal` aus: Gedächtnis kommt unverändert zurück,
    `startedOver: false`, gemerkte Gerichte können wieder kommen
  - Kein passendes Gericht → `null`
- [x] `src/meals/domain/announcements.ts` mit Tests in `announcements.test.ts`:
  - `switchableRuleName('alreadyRolled')` → `'Schon gewürfelte Gerichte'`
  - `switchableRuleExplanation('alreadyRolled')` → `'Neu würfeln bringt erst alle
    anderen passenden Gerichte, bevor eines wiederkommt. Gilt je Platz, bis der Plan
    festgelegt wird.'`
  - `ruleSwitchName({ rule: 'alreadyRolled', scope: 'singleMeal' })` →
    `'Schon gewürfelte Gerichte, Einzelgericht'`
  - `allMealsRolledAnnouncement()` → `'Alle passenden Gerichte waren schon dran.'`

Oberfläche:

- [x] `src/meals/ui/useWeekPlan.ts`: `rollMemory` (Start `EMPTY_ROLL_MEMORY`) und
      `rememberRolls`. Leeren bei festgelegter Stufe in `changeStage` und im
      `observeStage`-Rückruf (nach der `isStaleSnapshot`-Prüfung). Tests in
      `useWeekPlan.test.tsx`:
  - `rememberRolls` setzt `rollMemory`
  - `changeStage(FIXED_STAGE)` leert es, `changeStage(EDITING_STAGE)` nicht
  - Eine festgelegte Stufe, die über den Client ankommt (anderes Gerät), leert es
  - `replacePlan` und `chooseMeal` lassen es stehen
- [x] `src/meals/ui/WeekPlanArea.tsx`: `shuffleSlot` laut *Zielbild*, mit
      `allMealsRolledAnnouncement()` und Leerzeichen vor der gewohnten Ansage. Tests in
      `WeekPlanArea.test.tsx` (Würfel-Block um `:769`, Zufall `alwaysFirst`):
  - Drei Hauptgerichte, Mittagessen viermal würfeln: Die ersten drei Würfe bringen
    drei verschiedene Gerichte, der vierte ist keines der zuletzt gesehenen, und seine
    Ansage beginnt mit „Alle passenden Gerichte waren schon dran.“
  - Die ersten drei Ansagen sind ohne diesen Satz
  - Das Gedächtnis gilt je Platz: Drei Hauptgerichte ohne Kategorien. Montag
    Mittagessen zweimal würfeln (erst das erste, dann das zweite Gericht). Das erste
    Würfeln am Dienstag Mittag bringt dann das erste Gericht, obwohl es am Montag schon
    gewürfelt wurde (Abwechslung zieht es dem zweiten vor, das im Plan steht).
  - „Plan festlegen“, dann „Plan bearbeiten“: Danach ist das Gedächtnis leer, und
    ein früher gewürfeltes Gericht kann wieder kommen
  - „Zufallsauswahl generieren“ und „Wochenplan leeren“ lassen es stehen
  - Mit `alreadyRolled.singleMeal` aus gibt es nie den Neustart-Satz, und das
    Würfeln verhält sich wie heute
  - Bestehende Tests, die einen Platz mehr als zweimal würfeln, erwarten notfalls
    das neue Verhalten. Jede Anpassung kommt in die *Notizen zur Umsetzung*.
- [x] `src/SignedInApp.test.tsx`:
  - Die Überschriften der Regel-Verwaltung (`:1642`) lauten nun „Hauptgericht“,
    „Kategorien“, „Reste“, „Frühstück und Snack wiederholen“, „Abwechslung“,
    „Anderes Gericht“, „Schon gewürfelte Gerichte“, „Vorrat“.
  - „Schon gewürfelte Gerichte, Einzelgericht“ ist eingeschaltet, hat die Erklärung
    als Beschreibung, und „…, Gesamtplan“ gibt es nicht. Ausschalten speichert
    `{ rule: 'alreadyRolled', scope: 'singleMeal' }`.
  - Das Gedächtnis übersteht den Bereichswechsel: zweimal Mittagessen würfeln, zur
    Einkaufsliste und zurück, das dritte Würfeln bringt das noch nicht gewürfelte
    Gericht.
- [x] `docs/architektur/05-bausteinsicht.md:176`: `rollMemory` im Knoten `weekPlan`.

E2E:

- [x] `e2e/settings.spec.ts`: neuer Test „switches off remembering the meals already
      rolled“. Schalter „Schon gewürfelte Gerichte, Einzelgericht“ per Leertaste
      ausschalten. Auf dem Server steht `switchedOff: ['alreadyRolled.singleMeal']`,
      nach dem Neuladen ist er aus.
- [x] `e2e/weekPlan.spec.ts`: neuer Test „rolls every other meal before one comes
      again“. Zwei Snacks per `storeMealOnServer('Apfel', { snack: true })` und
      `storeMealOnServer('Banane', { snack: true })` anlegen. Am Montag (erster Tag,
      also ohne „wie am Vortag“) dreimal „Zufallsgericht für Snack“ drücken. Der Snack-Platz
      erlaubt nur Snacks, deshalb hängt der Ausgang nicht vom Zufall ab: Wurf 2 bringt
      das andere Gericht, Wurf 3 wieder das erste. Erst die Ansage von Wurf 3 enthält
      „Alle passenden Gerichte waren schon dran.“ Danach „Plan festlegen“ und „Plan
      bearbeiten“, noch einmal würfeln: Es kommt das zweite Gericht, ohne den
      Neustart-Satz.

**Automatisierte Verifikation**:
- [x] `npm run test`: grün, darunter die neuen Tests in `rollMemory.test.ts`,
      `rollingRules.test.ts`, `randomPlanning.test.ts`, `announcements.test.ts`,
      `useWeekPlan.test.tsx`, `WeekPlanArea.test.tsx` und `SignedInApp.test.tsx`
- [x] `npm run lint`: ohne Befund
- [x] `npm run build`: übersetzt
- [x] `npx playwright test e2e/settings.spec.ts e2e/weekPlan.spec.ts`: grün
- [x] `grep -rn "pickMealFor" src/meals/ui` findet nichts

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver: einen Platz so oft würfeln, bis alle passenden
      Gerichte dran waren. Kein Gericht kommt doppelt, und beim nächsten Würfeln sagt
      VoiceOver „Alle passenden Gerichte waren schon dran.“ vor dem Gericht.
- [x] Zwischendurch in die Gerichte und zurück: Das Gedächtnis ist noch da.
- [x] „Plan festlegen“ und „Plan bearbeiten“: Danach können die alten Gerichte sofort
      wieder kommen.
- [x] Regel-Verwaltung: VoiceOver liest „Schon gewürfelte Gerichte, Überschrift Ebene
      2“, die Erklärung und „Schon gewürfelte Gerichte, Einzelgericht, Schalter, ein“.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- **Das Gericht im Platz zählt als schon gewürfelt, auch vor dem ersten Wurf.** Die
  Skizze von `notRolledBefore` im *Zielbild* prüfte nur das Gedächtnis. Damit wären die
  geplanten Tests „Ersetztes zählt“ (bei abgeschaltetem „Anderes Gericht“) und „Einziges
  Gericht im Platz → `startedOver: true`“ nicht aufgegangen. Umgesetzt nach
  Akzeptanzkriterium 1 und Entscheidung 1: `notRolledBefore` schließt Gedächtnis und
  Gericht im Platz aus, beim Neustart nur das Gericht im Platz. `rememberedRoll` meldet
  `startedOver` auch, wenn das gezogene Gericht das ersetzte ist.
- Folge: Abgeschaltetes „Anderes Gericht“ allein bringt das Gericht im Platz nicht mehr
  sofort zurück, solange das Gedächtnis an ist. Angepasst:
  `randomPlanning.test.ts` („may roll the planned meal again …“ schaltet nun beide
  Regeln ab, neuer Gegentest mit nur „Anderes Gericht“ aus) und
  `WeekPlanArea.test.tsx` („WeekPlanArea with the other meal switched off“, gleiche
  Anpassung).
- Der Test „Ersetztes zählt“ würfelt mit Zufall 0,99 zweimal und erwartet
  `meal-2`, `meal-1`, nie `meal-3` (statt „zwei beliebige Würfe“).
- Die Gerichte kommen in der Oberfläche alphabetisch an („Ährensuppe“ vor
  „Bolognese“). Die Erwartungen der neuen `WeekPlanArea`-Tests folgen dieser
  Reihenfolge.
- `renderSignedInApp` hat als letzten Parameter eine optionale `RandomSource` bekommen,
  damit der Bereichswechsel-Test deterministisch ist.
- `e2e/weekPlan.spec.ts`: Der neue Test wartet wie seine Nachbarn, bis
  „Zufallsauswahl generieren“ aktiv ist, sonst sind die Gerichte noch nicht geladen.
- Die 12 direkten Regel-Aufrufe in `randomPlanning.test.ts` übergeben `[]` als
  `rolledBefore`. `narrowedBy` hat den Parameter als Pflicht.

## Verweise

- `docs/agents/plans/2026-10-19-regel-verwaltung.md` (MZP-041): Regel-Verwaltung,
  `otherMeal` und das Speichermodell `switchedOff`
- `docs/agents/plans/2026-10-21-vorrat-und-reste-von-hand-schaltbar.md` (MZP-043):
  `RuleScope`/`SCOPES_OF_RULE`
- `docs/agents/plans/2026-09-25-regeln-fuer-die-zufallsauswahl.md`: Planungsregeln und
  `narrowedBy`
