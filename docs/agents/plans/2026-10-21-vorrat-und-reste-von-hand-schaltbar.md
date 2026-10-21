---
date: 2026-10-21T06:10:56.023512+00:00
git_commit: dcf3be7e2e2222471c5944524604fa77067898a1
branch: main
story: MZP-043
topic: "Vorrat abziehen und Reste von Hand als schaltbare Regeln"
tags: [plan, meals, rollingRules, leftovers, weekPlan, supplies, announcements, WeekPlanArea, RollingRulesPage, SignedInApp, voiceover, e2e]
status: ready
---

# PLAN: MZP-043 — Vorrat abziehen und Reste von Hand als schaltbare Regeln

Die Regel-Verwaltung bekommt zwei neue Schalter:

1. **„Vorrat, Auf die Einkaufsliste“**: Ist er an, zieht „Auf die Einkaufsliste“ wie
   heute die gedeckten Gerichte vom Vorrat ab. Ist er aus, deckt der Vorrat weiter,
   wird aber nicht heruntergezählt.
2. **„Reste, Von Hand“**: Ist er an, wird ein Platz auch dann zum Reste-Platz, wenn man
   ihn von Hand gleich dem Vortag setzt (oder den Vortag gleich dem Folgetag). Das
   Reste-Icon erscheint dann wie beim Würfeln.

Alle Entscheidungen stammen aus der Befragung vom 2026-10-21.

## Akzeptanzkriterien

- Die Regel-Verwaltung zeigt in der Gruppe „Reste“ einen dritten Schalter mit der
  sichtbaren Beschriftung „Von Hand“. Sein Zugänglichkeitsname ist „Reste, Von Hand“.
- Die Erklärung der Gruppe „Reste“ lautet: „Ein Gericht mit Resten kommt am nächsten
  Tag noch einmal. Von Hand: steht es an zwei Tagen hintereinander, ist der zweite
  Reste.“
- Ganz unten, nach „Anderes Gericht“, steht die neue Gruppe „Vorrat“ (Überschrift
  Ebene 2) mit der Erklärung „Auf die Einkaufsliste zieht die Gerichte aus dem Vorrat
  ab.“ und einem Schalter mit der sichtbaren Beschriftung „Auf die Einkaufsliste“. Sein
  Zugänglichkeitsname ist „Vorrat, Auf die Einkaufsliste“. Die Erklärung ist wie bei
  allen Schaltern die Beschreibung (`aria-describedby`).
- Beide neuen Schalter sind nach dem Update eingeschaltet, ohne Migration. Sie gelten
  für den ganzen Haushalt, überleben ein Neuladen und kommen auf dem anderen Gerät an.
  In Firestore stehen sie ausgeschaltet als `'leftovers.manualChoice'` bzw.
  `'supplies.transfer'` in `switchedOff`.
- **Vorrat an:** „Auf die Einkaufsliste“ verhält sich wie heute.
- **Vorrat aus:** „Auf die Einkaufsliste“ lässt gedeckte Plätze weiterhin von der
  Einkaufsliste weg und friert die Schneeflocken wie heute ein, zählt den Vorrat aber
  **nicht** herunter. Die Ansage sagt „gedeckt“ statt „entnommen“:
  - `Wochenplan, 2 Artikel hinzugefügt. 1 Gericht aus dem Vorrat gedeckt.`
  - `Wochenplan, alle Gerichte aus dem Vorrat gedeckt, nichts hinzugefügt.`
  - Deckt kein Vorrat etwas, bleibt die Ansage wie heute ohne Vorrat-Satz.
- **Reste von Hand an.** Wird ein Gericht von Hand gewählt (Vorschlagsfeld), gilt:
  - **Fall 1 (Vortag):** Steht am Vortag zur selben Tageszeit dasselbe Gericht, hat
    das Gericht das Häkchen „Reste“, ist der Vortag-Platz nicht durch den Vorrat
    gedeckt und selbst kein Reste-Platz, dann wird der gewählte Platz zum Reste-Platz.
    Die Ansage hängt wie gewohnt „, Reste“ an (`slotPlannedAnnouncement`): in der
    Tagesansicht „Abendessen, Bolognese, Reste.“, in der Wochenansicht „Dienstag,
    22. September, Bolognese, Reste.“
  - **Fall 2 (Folgetag):** Wird der gewählte Platz nicht nach Fall 1 zum Reste-Platz,
    steht am Folgetag zur selben Tageszeit dasselbe Gericht, hat das Gericht das
    Häkchen „Reste“ und ist der gewählte Platz nicht durch den Vorrat gedeckt, dann
    wird der Folgetag zum Reste-Platz. Die Ansage nennt ihn wie beim Würfeln, in der
    Tagesansicht „Abendessen, Bolognese. Dienstag, 22. September, Abendessen, Reste von
    Bolognese.“, in der Wochenansicht beginnt sie mit „Montag, 21. September,
    Bolognese.“
  - Wird ein Platz so zum Reste-Platz, verliert der Platz am Tag danach (selbe
    Tageszeit) sein Reste-Kennzeichen, denn Reste erzeugen keine Reste. Sein Gericht
    bleibt stehen.
  - Am ersten Tag des Zeitraums entfällt Fall 1, am letzten Tag Fall 2.
  - Es zählen nur die direkten Nachbartage. Greift Fall 1, wird Fall 2 nicht mehr
    geprüft. Beispiel: So Bolognese, Mo Bolognese, Di Reste von Mo. Wird Mo erneut
    von Hand Bolognese, wird Mo Reste von So, und Di verliert sein Kennzeichen.
- **Reste von Hand aus:** Die Wahl von Hand verhält sich wie heute und erzeugt keine
  Reste.
- Leeren eines Platzes, Würfeln eines Platzes und „Zufallsauswahl generieren“ bleiben
  unverändert. Sie hängen nur an den Schaltern „Reste, Einzelgericht“ und
  „Reste, Gesamtplan“.
- War vor MZP-041 „Reste einplanen“ aus (Altfeld `leftovers: false` ohne
  `switchedOff`), sind weiterhin nur „Reste, Einzelgericht“ und „Reste, Gesamtplan“
  aus. „Reste, Von Hand“ ist an, weil der alte Schalter nur das Würfeln betraf.
- Ein Reste-Platz, der von Hand entstanden ist, verhält sich in allem wie ein
  gewürfelter: Box-Icon, „, Reste“ bei VoiceOver, kein Einkauf, kein Abbuchen, zählt
  nicht für den Vorrat.

## Wesentliche Entscheidungen und Abwägungen

1. **Vorrat aus heißt: decken ja, abziehen nein.**
   - Warum: Gewünscht ist nur, dass der Vorrat nicht automatisch heruntergezählt
     wird. Wer abzieht, macht das von Hand auf der Vorräte-Seite.
   - Auswirkung: `weekPlanTransfer` rechnet unverändert, bekommt aber das Merkmal
     `takesSupplies`. `SignedInApp` bucht nur ab, wenn es gesetzt ist. Die Ansage
     wechselt das Verb.
2. **Reste von Hand greifen in beide Richtungen.**
   - Warum: Entscheidung des Nutzers. Es soll keine Rolle spielen, in welcher
     Reihenfolge die zwei Tage eingetragen werden.
   - Auswirkung: In Fall 2 ändert sich ein zweiter Platz. Die Ansage nennt ihn deshalb
     mit, so wie beim Würfeln eines Platzes.
   - Dies dreht MZP-039, Entscheidung 2 („Nur Würfeln erzeugt Reste“), um, solange der
     Schalter an ist.
3. **Die Bedingungen sind dieselben wie beim Würfeln:** Häkchen „Reste“, das Original
   ist nicht durch den Vorrat gedeckt und selbst kein Reste-Platz.
   - Warum: Einkaufsliste und Vorrat rechnen dann wie heute. Eine aufgetaute Portion
     reicht für einen Tag.
   - Auswirkung: eine gemeinsame Prüfung `leavesLeftoversFrom` in `leftovers.ts`, die
     `chosenInto` nutzt.
4. **Beide Schalter starten eingeschaltet.**
   - Warum: Regel 2 ist ausdrücklich gewünscht, und Regel 1 ist das heutige Verhalten.
     Gespeichert wird nur Ausgeschaltetes.
   - Auswirkung: keine Migration, `DEFAULT_ROLLING_RULES` bleibt unverändert.
5. **Darstellung:** Reste bekommt den dritten Schalter „Von Hand“. Für „Vorrat“ gibt es
   eine eigene Gruppe ganz unten mit dem Schalter „Auf die Einkaufsliste“.
   - Warum: Die Schalterbeschriftung nennt durchgängig, *wo* die Regel wirkt. Beide
     Reste-Themen stehen beisammen.
   - Auswirkung: `RollingRulesPage` rendert die neuen Schalter ohne eigenen Code aus
     `SWITCHABLE_RULES` und `SCOPES_OF_RULE`.
6. **Wirkort statt Würfelart:** Neuer Typ `RuleScope = RollingMode | 'manualChoice' |
   'transfer'`. Aus `RuleInMode` wird `RuleInScope` (`{ rule, scope }`), aus
   `MODES_OF_RULE` wird `SCOPES_OF_RULE`. `RollingMode` bleibt unverändert der Typ der
   Würfelfunktionen.
   - Warum: Die Namen stimmen wieder, und `pickMealFor`/`rolledInto` nehmen weiterhin
     nur sinnvolle Werte an.
   - Auswirkung: Umbenennungen in Domäne, Hook, Seite und Tests. Das Firestore-Format
     (`'<rule>.<scope>'`) bleibt gleich, gespeicherte Schlüssel gelten weiter.
7. **`takesSupplies` als Wahrheitswert an `weekPlanTransfer`** statt der ganzen
   `RollingRules`.
   - Warum: `rollingRules.ts` importiert Typen aus `weekPlan.ts`. Ein Rückimport
     erzeugte einen Zirkel, und die Übertragung braucht nur dieses eine Merkmal.
   - Auswirkung: `WeekPlanArea` ermittelt es mit `appliesIn(rollingRules, 'supplies',
     'transfer')`.

## Ausgangslage

Die Regel-Verwaltung (`src/meals/ui/RollingRulesPage.tsx`) rendert je Regel aus
`SWITCHABLE_RULES` eine Gruppe und je Modus aus `MODES_OF_RULE` einen Schalter
(`src/meals/domain/rollingRules.ts:19-50`). Gespeichert wird `switchedOff` mit
Schlüsseln wie `'leftovers.singleMeal'` in `weekPlan/rollingRules`.

Übertragen auf die Einkaufsliste:

```
WeekPlanArea.addToShoppingList()                        WeekPlanArea.tsx:206
  ├─ changeStage(transferredStage(coveredSlots))      → Schneeflocken eingefroren
  └─ onAddToShoppingList(weekPlanTransfer(plan, meals, supplies))
        SignedInApp.addWeekPlanToShoppingList()         SignedInApp.tsx:153
          ├─ mealsToBuy     → Einkaufsliste
          ├─ spentSupplies  → supplies.changeSupply(withoutPortions)   ← Abbuchen
          └─ weekPlanTransferAnnouncement(…)   „… 1 Gericht aus dem Vorrat entnommen.“
```

Wahl von Hand:

```
WeekPlanArea.chooseMeal(slot, id)                       WeekPlanArea.tsx:114
  ├─ weekPlanning.chooseMeal(slot, id)  → withMealIn    weekPlan.ts:125
  │     (entfernt Reste-Kennzeichen des Platzes und des Folgetags)
  └─ slotPlannedAnnouncement(…, slotMarkOf(…))
```

Reste entstehen nur beim Würfeln über `rolledInto` (`src/meals/domain/leftovers.ts:40`).

## Zielbild

Regel-Verwaltung, geänderte Ausschnitte:

```
Vorher                                   Nachher
├─────────────────────────────────────┤  ├─────────────────────────────────────┤
│ Reste                               │  │ Reste                               │
│ Ein Gericht mit Resten kommt am     │  │ Ein Gericht mit Resten kommt am     │
│ nächsten Tag noch einmal.           │  │ nächsten Tag noch einmal. Von Hand: │
│   Einzelgericht               [ ● ] │  │ steht es an zwei Tagen hinter-      │
│   Gesamtplan                  [ ● ] │  │ einander, ist der zweite Reste.     │
├─────────────────────────────────────┤  │   Einzelgericht               [ ● ] │
│ …                                   │  │   Gesamtplan                  [ ● ] │
├─────────────────────────────────────┤  │   Von Hand                    [ ● ] │
│ Anderes Gericht                     │  ├─────────────────────────────────────┤
│ Neu würfeln bringt ein anderes      │  │ …                                   │
│ Gericht als das bisherige.          │  ├─────────────────────────────────────┤
│   Einzelgericht               [ ● ] │  │ Anderes Gericht                     │
└─────────────────────────────────────┘  │ …                                   │
                                         │   Einzelgericht               [ ● ] │
                                         ├─────────────────────────────────────┤
                                         │ Vorrat                              │
                                         │ Auf die Einkaufsliste zieht die     │
                                         │ Gerichte aus dem Vorrat ab.         │
                                         │   Auf die Einkaufsliste       [ ● ] │
                                         └─────────────────────────────────────┘
```

VoiceOver: „Vorrat, Auf die Einkaufsliste, Schalter, ein. Auf die Einkaufsliste zieht
die Gerichte aus dem Vorrat ab.“

Reste von Hand, beide Fälle (Bolognese mit Häkchen „Reste“, abends):

```
Fall 1         Mo            Di
vorher         Bolognese     —
von Hand                     Bolognese
nachher        Bolognese     Bolognese 📦      Ansage: „Abendessen, Bolognese, Reste.“

Fall 2         Mo            Di
vorher         —             Bolognese
von Hand       Bolognese
nachher        Bolognese     Bolognese 📦      Ansage: „Abendessen, Bolognese.
                                                Dienstag, 22. September, Abendessen,
                                                Reste von Bolognese.“

Kette          Mo            Di            Mi
vorher         Bolognese     —             Bolognese 📦 (Reste von „Di“, Altstand)
von Hand                     Bolognese
nachher        Bolognese     Bolognese 📦  Bolognese      ← Mi verliert das Kennzeichen

Kein Reste     Mo            Di
               Bolognese ❄   Bolognese      ← Mo durch Vorrat gedeckt
```

Modell (`src/meals/domain/rollingRules.ts`):

```ts
export type RollingMode = 'singleMeal' | 'wholePlan'
export type RuleScope = RollingMode | 'manualChoice' | 'transfer'

export type SwitchableRule =
  | 'categories'
  | 'leftovers'
  | 'repeatingBreakfastAndSnack'
  | 'variety'
  | 'otherMeal'
  | 'supplies'

export const SCOPES_OF_RULE: Record<SwitchableRule, readonly RuleScope[]> = {
  categories: ROLLING_MODES,
  leftovers: [...ROLLING_MODES, 'manualChoice'],
  repeatingBreakfastAndSnack: ROLLING_MODES,
  variety: ROLLING_MODES,
  otherMeal: ['singleMeal'],
  supplies: ['transfer'],
}

export type RuleInScope = { rule: SwitchableRule; scope: RuleScope }
```

Ablauf nachher:

```
WeekPlanArea.chooseMeal(slot, id)
  planned = chosenInto(plan, slot, id, meals, supplies, rollingRules)
  weekPlanning.replacePlan(planned)
  announce(plannedAnnouncement(planned, slot, chosen))   ← vorher rolledAnnouncement

WeekPlanArea.addToShoppingList()
  weekPlanTransfer(plan, meals, supplies, appliesIn(rollingRules, 'supplies', 'transfer'))
SignedInApp.addWeekPlanToShoppingList(transfer)
  if (transfer.takesSupplies) → spentSupplies abbuchen
  weekPlanTransferAnnouncement(…, suppliedMealCount(transfer), transfer.takesSupplies)
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `rollingRules.ts`: `RuleScope`, `RuleInScope`, `SCOPES_OF_RULE`, Regel `supplies`.
    Umbenannt werden `RuleInMode` → `RuleInScope`, `MODES_OF_RULE` → `SCOPES_OF_RULE`,
    `ruleInModeKey` → `ruleInScopeKey`, `sameRuleInMode` → `sameRuleInScope`.
    `appliesIn(rules, rule, scope: RuleScope)`.
  - `randomPlanning.ts`: `NarrowingRule` schließt `'supplies'` aus, `planningRulesFor`
    fragt `SCOPES_OF_RULE`.
  - `leftovers.ts`: neu `leavesLeftoversFrom` und `chosenInto`. `rolledInto` nutzt
    `leavesLeftoversFrom` mit. Wiederverwendet werden `withLeftoversIn` (setzt das
    Kennzeichen und bricht die Kette, weil `withMealIn` das Kennzeichen am Folgetag
    entfernt), `leftoverSlotAfter` und `leftoversRolledAfter`.
  - `weekPlan.ts`: `WeekPlanTransfer.takesSupplies`, `weekPlanTransfer(…, takesSupplies)`.
  - `announcements.ts`: Name und Erklärung für `supplies`, neue Reste-Erklärung,
    `rollingModeName` → `ruleScopeName` mit „Von Hand“ und „Auf die Einkaufsliste“,
    `weekPlanTransferAnnouncement(…, takesSupplies)`.
- `src/meals/ui`
  - `RollingRulesPage.tsx`: nur Umbenennungen (`SCOPES_OF_RULE`, `scope`).
  - `useWeekPlan.ts`: `switchRule(ruleInScope: RuleInScope, on)`.
  - `WeekPlanArea.tsx`: `chooseMeal` über `chosenInto` und `replacePlan`,
    `rolledAnnouncement` → `plannedAnnouncement`, `addToShoppingList` übergibt
    `takesSupplies`.
- `src/SignedInApp.tsx`: Abbuchen nur bei `transfer.takesSupplies`.
- `e2e/settings.spec.ts`, `e2e/weekPlan.spec.ts`: neue Szenarien.
- `src/meals/api/firestoreWeekPlanClient.ts`: nur die Umbenennung `ruleInScopeKey`.
- `docs/architektur/`: keine Änderung. `05-bausteinsicht.md:176` nennt `rollingRules`
  und `leftovers` schon, Modi oder `RollingMode` kommen dort nicht vor.

## Umsetzung

### Phase 1: Wirkort-Modell und Schalter „Vorrat, Auf die Einkaufsliste“

Abhängigkeiten: keine

Die Schalter werden auf Wirkorte umgestellt. Die Gruppe „Vorrat“ erscheint, und mit dem
Schalter aus zieht „Auf die Einkaufsliste“ nichts mehr vom Vorrat ab.

**Aufgaben**:

Domäne (test-getrieben, erst der rote Test):

- [ ] `src/meals/domain/rollingRules.ts`: Umbenennungen laut *Abstraktionen*
      durchziehen (Feld `mode` → `scope` in `RuleInScope`). Alle Importe und Tests
      anpassen (`rollingRules.test.ts`, `randomPlanning.test.ts`, `leftovers.test.ts`,
      `announcements.test.ts`, `useWeekPlan.test.tsx`, `WeekPlanArea.test.tsx`,
      `SignedInApp.test.tsx`) sowie den Adapter
      `src/meals/api/firestoreWeekPlanClient.ts:25,164` (`ruleInModeKey` →
      `ruleInScopeKey`). Die Tests bleiben inhaltlich gleich und grün.
- [ ] `RuleScope` einführen und `SwitchableRule` um `'supplies'` erweitern. Zunächst
      gilt `SCOPES_OF_RULE.supplies = ['transfer']`, `leftovers` bleibt bei
      `ROLLING_MODES` (`'manualChoice'` folgt in Phase 2). `SWITCHABLE_RULES` bekommt
      `'supplies'` als letzten Eintrag. Tests:
  - `rollingRulesFromStored` liest `'supplies.transfer'`
  - `rollingRulesFromStored` verwirft `'supplies.singleMeal'`
  - `withRuleSwitched` schaltet `{ rule: 'supplies', scope: 'transfer' }` aus und ein
  - `appliesIn(DEFAULT_ROLLING_RULES, 'supplies', 'transfer')` ist `true`
- [ ] `src/meals/domain/randomPlanning.ts`: `NarrowingRule = Exclude<SwitchableRule,
      'leftovers' | 'supplies'>`, `planningRulesFor` mit `SCOPES_OF_RULE`. Test: Mit
      `supplies.transfer` aus gleicht `planningRulesFor(…, 'wholePlan')` der Liste mit
      allem an.
- [ ] `src/meals/domain/weekPlan.ts`:
  ```ts
  export type WeekPlanTransfer = {
    mealsToBuy: readonly Meal[]
    spentSupplies: readonly Supply[]
    takesSupplies: boolean
  }
  export function weekPlanTransfer(plan, meals, supplies, takesSupplies: boolean): WeekPlanTransfer
  ```
  `mealsToBuy` und `spentSupplies` rechnen unverändert, `spentSupplies` bleibt die
  Zahl der gedeckten Portionen (für die Ansage). Tests in `weekPlan.test.ts`:
  `takesSupplies` wird durchgereicht, und bei `false` sind `mealsToBuy` und
  `spentSupplies` gleich wie bei `true`. Die neun bestehenden Aufrufe
  (`weekPlan.test.ts:689-786`) bekommen `true` und erwarten `takesSupplies: true`.
- [ ] `src/meals/domain/announcements.ts`:
  - `switchableRuleName('supplies')` → `'Vorrat'`
  - `switchableRuleExplanation('supplies')` → `'Auf die Einkaufsliste zieht die
    Gerichte aus dem Vorrat ab.'`
  - `rollingModeName` → `ruleScopeName(scope: RuleScope)`, mit `transfer` → `'Auf die
    Einkaufsliste'` (und Platz für `manualChoice` in Phase 2). Ist `Record<RuleScope,
    string>` sofort vollständig zu füllen, kommt `manualChoice: 'Von Hand'` gleich hier
    hinein.
  - `ruleSwitchName({ rule, scope })` → `'Vorrat, Auf die Einkaufsliste'`
  - `weekPlanTransferAnnouncement(additions, mealsWithoutItems, suppliedMeals,
    takesSupplies)`: Bei `takesSupplies === false` heißt es „gedeckt“ statt
    „entnommen“, sowohl in `suppliedMealPhrase` als auch im Satz „alle Gerichte aus
    dem Vorrat …“. Neue Tests für beide Sätze mit `false`. Die bestehenden Aufrufe
    in `announcements.test.ts` (`:1091`, `:1101`, `:1108` und weitere) bekommen
    `true`.

Oberfläche:

- [ ] `src/meals/ui/useWeekPlan.ts`: `switchRule(ruleInScope: RuleInScope, on)`.
- [ ] `src/meals/ui/RollingRulesPage.tsx`: Umbenennungen (`SCOPES_OF_RULE`, `scope`,
      `ruleScopeName`, Props-Typ `RuleInScope`).
- [ ] `src/meals/ui/WeekPlanArea.tsx`: `addToShoppingList` ruft
      `weekPlanTransfer(plan, meals, supplies, appliesIn(rollingRules, 'supplies',
      'transfer'))`. In `WeekPlanArea.test.tsx` erwarten die bestehenden
      Transfer-Objekte (`:1195`, `:1214`, `:1231`, `:1255`, `:1274`, `:2574`, `:2591`)
      zusätzlich `takesSupplies: true`. Neuer Test: Mit `supplies.transfer` aus kommt
      bei `onAddToShoppingList` ein Transfer mit `takesSupplies: false` an.
- [ ] `src/SignedInApp.tsx`: `addWeekPlanToShoppingList` bucht `spentSupplies` nur ab,
      wenn `transfer.takesSupplies`, und reicht `takesSupplies` an die Ansage weiter.
      Tests in `SignedInApp.test.tsx`:
  - Die Gruppen-Überschriften enden mit „Anderes Gericht“, „Vorrat“.
  - Der Schalter „Vorrat, Auf die Einkaufsliste“ hat die Erklärung als Beschreibung.
    Ausgeschaltet wird `switchedOff` mit `{ rule: 'supplies', scope: 'transfer' }`
    gespeichert.
  - Plan mit gedecktem Gericht, Schalter aus, festlegen und „Auf die Einkaufsliste“:
    Der Vorrat ist unverändert, die gedeckten Zutaten stehen nicht auf der Liste, die
    Ansage lautet „… 1 Gericht aus dem Vorrat gedeckt.“
  - Gegenprobe mit dem Schalter an: Der Vorrat wird abgebucht, wie heute.

E2E:

- [ ] `e2e/settings.spec.ts`: neuer Test „switches off taking meals from the supply“.
      Schalter „Vorrat, Auf die Einkaufsliste“ per Leertaste ausschalten. Auf dem
      Server steht `switchedOff: ['supplies.transfer']`, nach dem Neuladen ist er aus.
- [ ] `e2e/weekPlan.spec.ts`: neuer Test „keeps the supply when the household does not
      want it taken“. Aufbau wie „buys only the meal that the supply no longer covers“
      (`:103`), vorher über die Regel-Verwaltung den Vorrat-Schalter aus. Danach ist
      die Ansage „Wochenplan, 2 Artikel hinzugefügt. 1 Gericht aus dem Vorrat
      gedeckt.“ und `supplyCountsOnServer` ist weiter `[1]`.

**Automatisierte Verifikation**:
- [ ] `npm run test`: grün, darunter die neuen Tests in `rollingRules.test.ts`,
      `weekPlan.test.ts`, `announcements.test.ts`, `WeekPlanArea.test.tsx` und
      `SignedInApp.test.tsx`
- [ ] `npm run lint`: ohne Befund
- [ ] `npm run build`: übersetzt
- [ ] `npx playwright test e2e/settings.spec.ts e2e/weekPlan.spec.ts`: grün
- [ ] `grep -rn "RuleInMode\|MODES_OF_RULE\|ruleInModeKey\|rollingModeName" src e2e`
      findet nichts

**Manuelle Verifikation**:
- [ ] Auf dem iPhone mit VoiceOver: Regel-Verwaltung bis zum Ende wischen. „Vorrat,
      Überschrift Ebene 2“, dann die Erklärung, dann „Vorrat, Auf die Einkaufsliste,
      Schalter, ein“ samt Erklärung.
- [ ] Schalter aus, einen Plan mit Vorrats-Gericht festlegen und übertragen: Die
      Vorräte-Seite zeigt die alte Zahl, die Ansage sagt „gedeckt“.

### Phase 2: Schalter „Reste, Von Hand“

Abhängigkeiten: Phase 1

Wer ein Reste-Gericht von Hand an zwei Tagen hintereinander einträgt, bekommt am zweiten
Tag das Reste-Icon, in welcher Reihenfolge auch immer.

**Aufgaben**:

Domäne (test-getrieben):

- [ ] `src/meals/domain/rollingRules.ts`: `SCOPES_OF_RULE.leftovers = [...ROLLING_MODES,
      'manualChoice']`. Tests: `rollingRulesFromStored` liest
      `'leftovers.manualChoice'`, und `appliesIn` ist für `manualChoice`
      standardmäßig `true`.
- [ ] `switchedOffBeforeTheSwitches` (`rollingRules.ts:123-129`) schaltet beim Altfeld
      `leftovers: false` nur die Reste-Schalter der Würfelarten aus
      (`ROLLING_MODES`), nicht `manualChoice`. Der Test „takes over leftovers switched
      off before …“ (`rollingRules.test.ts:241-246`) erwartet weiter genau
      `[singleMeal, wholePlan]` und bleibt so grün.
- [ ] `src/meals/domain/leftovers.ts`: gemeinsame Prüfung
  ```ts
  function leavesLeftoversFrom(
    plan: WeekPlan,
    original: PlanSlot,
    meals: readonly Meal[],
    supplies: readonly Supply[],
  ): boolean
  ```
  Sie ist `true`, wenn auf `original` ein Gericht mit `leftovers` steht,
  `original` kein Reste-Platz ist und `!isSuppliedIn(plan, original, meals, supplies)`
  gilt. `rolledInto` nutzt sie für seine Bedingungen (Häkchen, Vorrat). Die
  bestehenden Tests in `leftovers.test.ts` bleiben grün.
- [ ] `leftoverSlotBefore(plan, slot): PlanSlot | null` über `dateBefore(plan.period,
      slot.date)`, entsprechend `leftoverSlotAfter`.
- [ ] `chosenInto`:
  ```ts
  export function chosenInto(
    plan: WeekPlan,
    slot: PlanSlot,
    id: MealId | null,
    meals: readonly Meal[],
    supplies: readonly Supply[],
    rules: RollingRules,
  ): WeekPlan
  ```
  Ablauf:
  1. `planned = withMealIn(plan, slot, id)`. Ist `id` `null` oder
     `!appliesIn(rules, 'leftovers', 'manualChoice')`, wird `planned` zurückgegeben.
  2. Fall 1: Gibt es `before = leftoverSlotBefore(planned, slot)` mit
     `mealIn(planned, before) === id` und `leavesLeftoversFrom(planned, before, …)`,
     dann `withLeftoversIn(planned, slot, id)`.
  3. Sonst Fall 2: Gibt es `after = leftoverSlotAfter(planned, slot)` mit
     `mealIn(planned, after) === id` und `leavesLeftoversFrom(planned, slot, …)`,
     dann `withLeftoversIn(planned, after, id)`.
  4. Sonst `planned`.

  Tests in `leftovers.test.ts` (Bolognese mit Häkchen „Reste“, abends):
  - Fall 1: Mo Bolognese, Di von Hand Bolognese → Di ist Reste-Platz
  - Fall 2: Di Bolognese, Mo von Hand Bolognese → Di ist Reste-Platz
  - ohne Häkchen „Reste“ → kein Reste-Platz
  - andere Tageszeit (Mo mittags, Di abends) → kein Reste-Platz
  - anderes Gericht am Vortag → kein Reste-Platz
  - Vortag durch Vorrat gedeckt (Fall 1) → kein Reste-Platz
  - gewählter Platz durch Vorrat gedeckt (Fall 2) → Folgetag kein Reste-Platz
  - Vortag selbst Reste-Platz (Mo, Di(R), Mi von Hand) → Mi kein Reste-Platz
  - Kette brechen: Mo Bolognese, Mi Bolognese als Reste-Platz, Di von Hand Bolognese
    → Di ist Reste-Platz, Mi nicht mehr, sein Gericht bleibt
  - Fall 2 bricht die Kette: Di und Mi Bolognese, Mi Reste, Mo von Hand Bolognese →
    Di ist Reste-Platz, Mi nicht mehr
  - erster Tag des Zeitraums (Fall 1 entfällt) und letzter Tag (Fall 2 entfällt)
  - `leftovers.manualChoice` aus → verhält sich wie `withMealIn`
  - nur `leftovers.singleMeal` und `leftovers.wholePlan` aus → von Hand entstehen
    trotzdem Reste
  - `id === null` → gleich `withMealIn`
  - nur direkte Nachbarn: So Bolognese, Mo Bolognese, Di Reste von Mo, Mo erneut von
    Hand Bolognese → Mo ist Reste-Platz, Di nicht mehr
  - Mo und Di Bolognese ohne Kennzeichen, Mi von Hand Bolognese → Mi ist
    Reste-Platz, Di bleibt ohne Kennzeichen
  - Die Helfer in `leftovers.test.ts:39-50` bleiben für das Würfeln. Für die neuen
    Tests kommt ein Helfer dazu, der `manualChoice` ausschaltet.
- [ ] `src/meals/domain/announcements.ts`: `switchableRuleExplanation('leftovers')` →
      „Ein Gericht mit Resten kommt am nächsten Tag noch einmal. Von Hand: steht es an
      zwei Tagen hintereinander, ist der zweite Reste.“ `ruleScopeName('manualChoice')`
      → „Von Hand“, sofern nicht schon in Phase 1 gesetzt. Tests anpassen, dazu
      `ruleSwitchName({ rule: 'leftovers', scope: 'manualChoice' })` → „Reste, Von Hand“.

Oberfläche:

- [ ] `src/meals/ui/WeekPlanArea.tsx`:
  ```ts
  function chooseMeal(slot: PlanSlot, id: MealId | null) {
    const planned = chosenInto(weekPlanning.plan, slot, id, meals, supplies, rollingRules)
    weekPlanning.replacePlan(planned)
    const chosen = meals.find((meal) => meal.id === id)
    if (chosen === undefined) return
    announce(plannedAnnouncement(planned, slot, chosen))
  }
  ```
  `rolledAnnouncement` heißt jetzt `plannedAnnouncement` und dient Würfeln und Wahl von
  Hand. `clearSlot` bleibt bei `weekPlanning.chooseMeal(slot, null)`. Tests in
  `WeekPlanArea.test.tsx`:
  - Fall 1: Die Ansage lautet in der Tagesansicht „Abendessen, Bolognese, Reste.“,
    das Feld heißt „Abendessen, Reste“.
  - Fall 2: Die Ansage nennt „Dienstag, 22. September, Abendessen, Reste von
    Bolognese.“
  - Mit `leftovers.manualChoice` aus entsteht kein Reste-Platz, und die Ansage ist wie
    heute.
- [ ] `src/meals/ui/useWeekPlan.ts`: Wird `chooseMeal` nach der Änderung nur noch von
      `clearSlot` gebraucht, bleibt die Funktion. Fällt ihr letzter Nutzer weg,
      entfernen und `useWeekPlan.test.tsx` anpassen.
- [ ] `src/SignedInApp.test.tsx`: Die Reste-Gruppe hat die Schalter „Reste,
      Einzelgericht“, „Reste, Gesamtplan“, „Reste, Von Hand“ in dieser Reihenfolge und
      die neue Erklärung als Beschreibung. Ausschalten speichert `{ rule: 'leftovers',
      scope: 'manualChoice' }`.

E2E:

- [ ] `e2e/settings.spec.ts`: neuer Test „switches off leftovers chosen by hand“.
      Schalter „Reste, Von Hand“ per Leertaste ausschalten. Auf dem Server steht
      `switchedOff: ['leftovers.manualChoice']`, nach dem Neuladen ist er aus.
- [ ] `e2e/weekPlan.spec.ts`: neuer Test „marks a meal chosen by hand as leftovers of
      the day before“. Bolognese mit Häkchen „Reste“ und nur dem
      Artikel „Hackfleisch, 500 g“ anlegen, Montag Abendessen von
      Hand Bolognese, zum Dienstag wechseln, Abendessen von Hand Bolognese. Das Feld
      „Abendessen, Reste“ hat den Wert „Bolognese“, und `leftoverSlotsOnServer` liefert
      `['2026-09-22.dinner']`. „Plan festlegen“ und „Auf die Einkaufsliste“ ergeben
      „Wochenplan, 1 Artikel hinzugefügt.“ mit `Hackfleisch, 500 g`.

**Automatisierte Verifikation**:
- [ ] `npm run test`: grün, darunter die neuen Szenarien in `leftovers.test.ts`,
      `WeekPlanArea.test.tsx` und `SignedInApp.test.tsx`
- [ ] `npm run lint`: ohne Befund
- [ ] `npm run build`: übersetzt
- [ ] `npx playwright test e2e/settings.spec.ts e2e/weekPlan.spec.ts`: grün
- [ ] `grep -n "rolledAnnouncement" -r src` findet nichts

**Manuelle Verifikation**:
- [ ] Auf dem iPhone mit VoiceOver: Montag abends Bolognese von Hand, Dienstag abends
      Bolognese von Hand. VoiceOver sagt „, Reste“ an, und das Box-Icon erscheint.
- [ ] Umgekehrte Reihenfolge (erst Dienstag, dann Montag): Die Ansage nennt den
      Dienstag als Reste, und dort erscheint das Box-Icon.
- [ ] Auf dem zweiten Gerät erscheint das Box-Icon ohne Neuladen.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/agents/plans/2026-10-19-regel-verwaltung.md` (MZP-041): Regel-Verwaltung und
  Speichermodell `switchedOff`
- `docs/agents/plans/2026-10-07-reste-am-naechsten-tag.md` (MZP-039): Reste-Regel,
  Entscheidung 2 wird hier für die Wahl von Hand umgedreht
- `docs/agents/plans/2026-09-23-vorrat-beim-uebertragen-verbrauchen.md` (MZP-015):
  Abbuchen des Vorrats beim Übertragen
