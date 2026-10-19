---
date: 2026-10-19T07:49:09.859236+00:00
git_commit: 9da8fc7374363912200e66bd7337ae7aeb4a212a
branch: main
story: MZP-041
topic: "Regel-Verwaltung für die Zufallsauswahl"
tags: [plan, meals, randomPlanning, rollingRules, leftovers, WeekPlanArea, SettingsPage, RollingRulesPage, firestoreWeekPlanClient, voiceover, e2e]
status: done
---

# PLAN: MZP-041 — Regel-Verwaltung für die Zufallsauswahl

In den Einstellungen gibt es künftig über der Artikel-Verwaltung den Button
„Regel-Verwaltung“. Er führt auf eine eigene Seite. Dort lassen sich die Regeln der
Zufallsauswahl einzeln ein- und ausschalten, getrennt für das Würfeln eines
Einzelgerichts und für das Würfeln des Gesamtplans. Die Auswahl „Hauptgericht würfeln“
und der Schalter „Reste einplanen“ ziehen von der Einstellungsseite auf die neue Seite.

Alle Entscheidungen stammen aus der Befragung vom 2026-10-19.

## Akzeptanzkriterien

- In den Einstellungen steht direkt über „Artikel-Verwaltung“ ein Button
  „Regel-Verwaltung“. Er öffnet eine Seite mit der Überschrift „Regel-Verwaltung“ und dem
  Button „Zurück zu den Einstellungen“.
- Die Einstellungsseite zeigt die Auswahl „Hauptgericht würfeln“ und den Schalter
  „Reste einplanen“ nicht mehr. Ihre Einträge sind dann: Farben invertieren,
  Regel-Verwaltung, Artikel-Verwaltung, Kategorie-Verwaltung, Einheiten-Verwaltung.
- Die Regel-Verwaltung zeigt in dieser Reihenfolge je eine Gruppe mit Überschrift
  (Ebene 2) und Erklärungssatz:

  | Gruppe | Bedienelement | Erklärung |
  |---|---|---|
  | Hauptgericht | Auswahl „Mittags oder abends“ / „Nur mittags“ / „Nur abends“ | Genau ein Hauptgericht pro Tag, zu dieser Tageszeit. |
  | Kategorien | Schalter Einzelgericht, Gesamtplan | Hauptgerichte und Gerichte ohne Art mit gleicher Kategorie kommen nicht an zwei Tagen hintereinander. |
  | Reste | Schalter Einzelgericht, Gesamtplan | Ein Gericht mit Resten kommt am nächsten Tag noch einmal. |
  | Frühstück und Snack wiederholen | Schalter Einzelgericht, Gesamtplan | Frühstück und Snack bleiben gern wie am Vortag. |
  | Abwechslung | Schalter Einzelgericht, Gesamtplan | Bevorzugt Gerichte, die im Plan noch selten vorkommen. |
  | Anderes Gericht | Schalter Einzelgericht | Neu würfeln bringt ein anderes Gericht als das bisherige. |

- Jeder Schalter zeigt sichtbar „Einzelgericht“ oder „Gesamtplan“. Sein
  Zugänglichkeitsname lautet „<Regel>, Einzelgericht“ bzw. „<Regel>, Gesamtplan“, die
  Erklärung ist seine Beschreibung (`aria-describedby`). Die Auswahl heißt für
  VoiceOver „Hauptgericht“ und hat die Erklärung ebenfalls als Beschreibung.
- Ein ausgeschalteter Einzelgericht-Schalter wirkt nur, wenn ein einzelner Platz
  gewürfelt wird. Ein ausgeschalteter Gesamtplan-Schalter wirkt nur bei
  „Zufallsauswahl generieren“.
- Die Hauptgericht-Auswahl gilt wie heute für beide Einstiege.
- Fest und nicht schaltbar bleibt die Regel, welche Art von Gericht auf welchen Platz
  gewürfelt werden darf (Frühstück nur morgens usw.).
- Alle Schalter und die Auswahl gelten für den ganzen Haushalt. Sie überleben ein
  Neuladen und kommen auf dem anderen Gerät an.
- Ohne Änderung würfelt die App genau wie heute, alle Schalter sind eingeschaltet. Ist
  heute `leftovers: false` gespeichert, sind beide Reste-Schalter aus.

## Wesentliche Entscheidungen und Abwägungen

1. **Regelauswahl:** Kategorien, Reste, Frühstück/Snack wiederholen und Abwechslung
   sind je für Einzelgericht und Gesamtplan schaltbar. „Anderes Gericht“ ist nur für das
   Einzelgericht schaltbar. Welche Art auf welchen Platz darf (`KINDS_ROLLED_AT`), bleibt
   fest.
   - Warum: `otherThanPlanned` hat im Gesamtplan keine Wirkung, weil `filledWeekPlan`
     mit einem leeren Plan startet. Ein Schalter ohne Wirkung verwirrt gerade unter
     VoiceOver. Ohne die Platz-Passung zerfällt der Tagesaufbau (Hauptgericht pro Tag).
   - Auswirkung: `MODES_OF_RULE` legt fest, welche Schalter es gibt.
2. **Seite nach Regel gruppiert:** eine Gruppe je Regel mit Überschrift, Erklärung und
   Schaltern.
   - Warum: Die Erklärung steht direkt bei der Regel. Über die Überschriften springt
     man mit dem VoiceOver-Rotor von Regel zu Regel.
   - Auswirkung: Es entsteht eine eigene `RollingRulesPage`, `SettingsPage` wird dafür
     nicht wiederverwendet.
3. **Eine Hauptgericht-Auswahl für beide Einstiege.**
   - Warum: Zwei Auswahlen könnten sich widersprechen, und ein Nachwürfeln würde den
     Wochenaufbau zerreißen.
   - Auswirkung: `mainMealTime` bleibt ein einzelnes Feld.
4. **Gespeichert wird nur, was ausgeschaltet ist (`switchedOff`).**
   - Warum: Eine neue Regel gilt ohne Migration als eingeschaltet. Ein Schalter, den es
     nicht gibt (`otherMeal` im Gesamtplan), lässt sich gar nicht erst speichern.
   - Auswirkung: Firestore bekommt `switchedOff: string[]` mit Einträgen wie
     `'leftovers.wholePlan'`. Das alte Feld `leftovers` wird nur noch gelesen, solange
     `switchedOff` fehlt, und nicht mehr geschrieben.
5. **Neue Regeln starten eingeschaltet. Reste übernehmen die heutige Einstellung.**
   - Warum: Nach dem Update würfelt die App unverändert.
   - Auswirkung: `DEFAULT_ROLLING_RULES.switchedOff` ist leer. `leftovers: false` ohne
     `switchedOff` wird zu beiden Reste-Schaltern aus.
6. **Restrisiko altes Gerät:** Läuft auf dem zweiten Gerät noch die alte Version und
   ändert sie die Hauptgericht-Auswahl, überschreibt `setDoc` das ganze Dokument. Die
   neuen Schalter stehen danach wieder auf „ein“.
   - Warum: Die alte Version bietet das Update aktiv an. Ein Abfangen lohnt sich nicht.
   - Auswirkung: keine.
7. **Die Regeln greifen über den Modus:** `pickMealFor`, `filledWeekPlan` und
   `rolledInto` bekommen die ganzen `RollingRules` und einen `RollingMode`.
   `PLANNING_RULES` wird zu `planningRulesFor(rules, mode)`, Reihenfolge unverändert.
   - Warum: Die Regellogik bleibt in der Domäne. `WeekPlanArea` übergibt nur den Modus.
   - Auswirkung: Die Tests in `randomPlanning.test.ts` und `leftovers.test.ts` werden
     umgestellt.
8. **Regeltypen in eine eigene Datei `rollingRules.ts`:** `MainMealTime`,
   `MainMealTimeRule`, `RollingRules` und die neuen Typen ziehen aus `randomPlanning.ts`
   um.
   - Warum: `randomPlanning.ts` ist schon groß. Außerdem entfällt der Typ-Zirkel
     `leftovers.ts` ↔ `randomPlanning.ts`.
   - Auswirkung: Die Importe in `announcements.ts`, `SignedInApp.tsx`, den API-Clients,
     `useWeekPlan.ts` und den Tests werden angepasst.

## Ausgangslage

Die Einstellungsseite (`src/SignedInApp.tsx:208-244`, Darstellung
`src/shared/ui/SettingsPage.tsx`):

```
┌─────────────────────────────────────┐
│ [Navigationsleiste]                 │
│ Einstellungen                       │
├─────────────────────────────────────┤
│ Farben invertieren            [ ○ ] │  toggle
│ Hauptgericht würfeln                │  choice
│ [Mittags oder abends         ▾]     │
│ Reste einplanen               [ ● ] │  toggle
│ [Artikel-Verwaltung]                │  page
│ [Kategorie-Verwaltung]              │  page
│ [Einheiten-Verwaltung]              │  page
└─────────────────────────────────────┘
```

Gespeichert wird in `weekPlan/rollingRules` als `{ mainMealTime, leftovers }`
(`src/meals/api/firestoreWeekPlanClient.ts:157-171`). Die Firestore-Regeln prüfen dort
keine Felder (`firestore.rules:21-23`), ein Regel-Deployment ist also nicht nötig.

So läuft das Würfeln heute (`src/meals/ui/WeekPlanArea.tsx:141-176`,
`src/meals/domain/randomPlanning.ts`):

```
shuffleSlot (ein Platz)                 shuffleWeek (ganze Woche)
  pickMealFor(…, mainMealTime)            filledWeekPlan(…, rollingRules)
  rolledInto(…, rollingRules)               └ pro Tag: pickMealFor + rolledInto
        │                                         │
        └──────────┬──────────────────────────────┘
                   ▼
   allowedFor        fest: Art passt zum Platz + ein Hauptgericht pro Tag
   narrowedBy(PLANNING_RULES)
                     otherThanPlanned → apartFromSameCategory →
                     stayingLikeTheDayBefore → rarestInThePlan
                     (eine Regel, die alles wegfiltert, wird übersprungen)
   rolledInto        Reste am Folgetag, wenn plansLeftovers
```

## Zielbild

Die Einstellungsseite nachher:

```
┌─────────────────────────────────────┐
│ [Navigationsleiste]                 │
│ Einstellungen                       │
├─────────────────────────────────────┤
│ Farben invertieren            [ ○ ] │
│ [Regel-Verwaltung]                  │
│ [Artikel-Verwaltung]                │
│ [Kategorie-Verwaltung]              │
│ [Einheiten-Verwaltung]              │
└─────────────────────────────────────┘
```

Die neue Seite Regel-Verwaltung (am Ende von Phase 2):

```
┌─────────────────────────────────────┐
│ [Zurück zu den Einstellungen]       │
│ Regel-Verwaltung                    │  h1
├─────────────────────────────────────┤
│ Hauptgericht                        │  h2
│ Genau ein Hauptgericht pro Tag, zu  │
│ dieser Tageszeit.                   │
│ [Mittags oder abends         ▾]     │
├─────────────────────────────────────┤
│ Kategorien                          │  h2
│ Hauptgerichte und Gerichte ohne Art │
│ mit gleicher Kategorie kommen nicht │
│ an zwei Tagen hintereinander.       │
│   Einzelgericht               [ ● ] │
│   Gesamtplan                  [ ● ] │
├─────────────────────────────────────┤
│ Reste                               │
│ Ein Gericht mit Resten kommt am     │
│ nächsten Tag noch einmal.           │
│   Einzelgericht               [ ● ] │
│   Gesamtplan                  [ ● ] │
├─────────────────────────────────────┤
│ Frühstück und Snack wiederholen     │
│ Frühstück und Snack bleiben gern    │
│ wie am Vortag.                      │
│   Einzelgericht               [ ● ] │
│   Gesamtplan                  [ ● ] │
├─────────────────────────────────────┤
│ Abwechslung                         │
│ Bevorzugt Gerichte, die im Plan     │
│ noch selten vorkommen.              │
│   Einzelgericht               [ ● ] │
│   Gesamtplan                  [ ● ] │
├─────────────────────────────────────┤
│ Anderes Gericht                     │
│ Neu würfeln bringt ein anderes      │
│ Gericht als das bisherige.          │
│   Einzelgericht               [ ● ] │
└─────────────────────────────────────┘
```

VoiceOver liest beim Wischen zum Beispiel: „Reste, Überschrift Ebene 2“ → „Ein Gericht
mit Resten …“ → „Reste, Einzelgericht, Schalter, ein. Ein Gericht mit Resten …“.

Das Würfeln nachher:

```
shuffleSlot                               shuffleWeek
  pickMealFor(…, rules, 'singleMeal')       filledWeekPlan(…, rules, …)
  rolledInto(…, rules, 'singleMeal')          └ pickMealFor(…, rules, 'wholePlan')
                                                rolledInto(…, rules, 'wholePlan')
                   ▼
   narrowedBy(planningRulesFor(rules, mode), …)
   rolledInto: appliesIn(rules, 'leftovers', mode)
```

Das Modell (`src/meals/domain/rollingRules.ts`):

```ts
export type RollingMode = 'singleMeal' | 'wholePlan'

export type SwitchableRule =
  | 'categories'
  | 'leftovers'
  | 'repeatingBreakfastAndSnack'
  | 'variety'
  | 'otherMeal'

export type RuleInMode = { rule: SwitchableRule; mode: RollingMode }

export const SWITCHABLE_RULES: readonly SwitchableRule[] = [ /* Reihenfolge der Seite */ ]

export const MODES_OF_RULE: Record<SwitchableRule, readonly RollingMode[]> = { … }

export type RollingRules = {
  mainMealTime: MainMealTimeRule
  switchedOff: readonly RuleInMode[]
}
```

In Firestore steht danach:

```
weekPlan/rollingRules
  mainMealTime: 'dinner'
  switchedOff:  ['leftovers.singleMeal', 'categories.wholePlan']
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `rollingRules.ts` *(neu)*: Regeltypen und reine Funktionen
    - aus `randomPlanning.ts` hierher: `MainMealTime`, `MainMealTimeRule`,
      `MAIN_MEAL_TIME_RULES`, `DEFAULT_MAIN_MEAL_TIME_RULE`, `isMainMealTimeRule`,
      `RollingRules`, `DEFAULT_ROLLING_RULES`, `sameRollingRules`
    - neu: `RollingMode`, `SwitchableRule`, `RuleInMode`, `SWITCHABLE_RULES`,
      `MODES_OF_RULE`, `appliesIn`, `withRuleSwitched`, `ruleInModeKey`,
      `rollingRulesFromStored`
  - `randomPlanning.ts`: `pickMealFor`/`filledWeekPlan` mit `rules` und `mode`, neu
    `planningRulesFor`
  - `leftovers.ts`: `rolledInto` bekommt `mode` und fragt `appliesIn`
  - `announcements.ts`: Texte `switchableRuleName`, `switchableRuleExplanation`,
    `rollingModeName`, `mainMealTimeExplanation`. `mainMealTimeRuleName` bleibt.
- `src/meals/api`
  - `firestoreWeekPlanClient.ts`: `toRollingRules` delegiert an
    `rollingRulesFromStored`, `fromRollingRules` schreibt `switchedOff`
  - `inMemoryWeekPlanClient.ts`, `weekPlanClient.ts`: nur Importpfade
- `src/meals/ui`
  - `RollingRulesPage.tsx` *(neu)*: die Seite
  - `useWeekPlan.ts`: `changeLeftoverPlanning` wird zu `switchRule`
  - `WeekPlanArea.tsx`: übergibt `rollingRules` und Modus
- `src/shared/ui/SettingsPage.tsx`: Eintragsart `choice` entfällt
- `src/SignedInApp.tsx`: neuer Eintrag `rollingRules`, alte Einträge entfallen,
  `RollingRulesPage` wird eingebunden
- `src/index.css`: `.settingsChoice` wird zu `.ruleGroup` umgebaut
- `e2e/emulatorHousehold.ts`: `rollingRulesOnServer` liefert `switchedOff`, neu
  `storeRollingRulesOnServer`
- `docs/architektur/05-bausteinsicht.md`: `rollingRules` im Baustein-Diagramm ergänzen

Wiederverwendet werden: `useHeadingFocus`, das Muster „Zurück zu den Einstellungen“ aus
`KnownItemListPage`, der Schalter `<input type="checkbox" role="switch">` aus
`SettingsPage` und der Schutz vor veralteten Momentaufnahmen (`isStaleSnapshot` mit
`sameRollingRules`) in `useWeekPlan`.

## Umsetzung

### Phase 1: Regel-Verwaltung mit Hauptgericht und Reste

Abhängigkeiten: keine

Die neue Seite gibt es mit den Gruppen „Hauptgericht“ und „Reste“. Reste lassen sich
getrennt für Einzelgericht und Gesamtplan schalten. Gespeichert wird die neue Form, das
Altfeld wird gelesen, und die Einstellungsseite ist aufgeräumt.

**Aufgaben**:

Domäne (test-getrieben, erst der rote Test):

- [x] `src/meals/domain/rollingRules.ts` anlegen. Die oben genannten Typen und
      Funktionen aus `randomPlanning.ts` hierher verschieben und alle Importe
      anpassen. Die zugehörigen Tests (`isMainMealTimeRule`, `MAIN_MEAL_TIME_RULES`,
      `sameRollingRules`) ziehen nach `rollingRules.test.ts`.
- [x] Neue Typen einführen. `SwitchableRule` ist in dieser Phase nur `'leftovers'`,
      Phase 2 erweitert die Union.
  ```ts
  export type RollingMode = 'singleMeal' | 'wholePlan'
  export type SwitchableRule = 'leftovers'
  export type RuleInMode = { rule: SwitchableRule; mode: RollingMode }
  export const ROLLING_MODES: readonly RollingMode[] = ['singleMeal', 'wholePlan']
  export const SWITCHABLE_RULES: readonly SwitchableRule[] = ['leftovers']
  export const MODES_OF_RULE: Record<SwitchableRule, readonly RollingMode[]> = {
    leftovers: ROLLING_MODES,
  }
  export type RollingRules = {
    mainMealTime: MainMealTimeRule
    switchedOff: readonly RuleInMode[]
  }
  export const DEFAULT_ROLLING_RULES: RollingRules = {
    mainMealTime: DEFAULT_MAIN_MEAL_TIME_RULE,
    switchedOff: [],
  }
  ```
- [x] `appliesIn(rules, rule, mode): boolean`. Tests:
  - alles ein, wenn `switchedOff` leer ist
  - aus nur im ausgeschalteten Modus, der andere Modus bleibt ein
- [x] `withRuleSwitched(rules, ruleInMode, on): RollingRules`. Tests:
  - Ausschalten nimmt den Eintrag auf, ein zweites Ausschalten verdoppelt ihn nicht
  - Einschalten entfernt den Eintrag
  - `mainMealTime` bleibt erhalten
  - ein Modus, den `MODES_OF_RULE` für die Regel nicht kennt, ändert nichts
- [x] `sameRollingRules` vergleicht `switchedOff` unabhängig von der Reihenfolge. Test:
      `[a, b]` gleicht `[b, a]`, `[a]` gleicht nicht `[a, b]`.
- [x] `ruleInModeKey(ruleInMode): string` liefert `'leftovers.wholePlan'`.
- [x] `rollingRulesFromStored(stored: { mainMealTime?: unknown; switchedOff?: unknown; leftovers?: unknown }): RollingRules`.
      Tests:
  - ein leeres Dokument ergibt `DEFAULT_ROLLING_RULES`
  - eine unbekannte `mainMealTime` fällt auf `DEFAULT_MAIN_MEAL_TIME_RULE` zurück (wie heute)
  - `switchedOff: ['leftovers.singleMeal']` ergibt genau diesen Eintrag
  - unbekannte, kaputte oder nicht erlaubte Schlüssel werden übergangen
    (`'otherMeal.wholePlan'`, `'foo'`, `42`)
  - fehlt `switchedOff` und ist `leftovers: false`, sind beide Reste-Modi aus
  - ist `switchedOff` vorhanden, wird `leftovers` ignoriert
- [x] `src/meals/domain/leftovers.ts`: `rolledInto(plan, slot, meal, meals, supplies, rules, mode)`
      prüft `appliesIn(rules, 'leftovers', mode)` statt `rules.plansLeftovers`.
      `leftovers.test.ts` umstellen. Neue Tests: Reste aus nur für `singleMeal`, dann
      `rolledInto(…, 'singleMeal')` ohne und `rolledInto(…, 'wholePlan')` mit
      Reste-Platz. Dasselbe umgekehrt.
- [x] `src/meals/domain/randomPlanning.ts`: `filledDay` ruft
      `rolledInto(…, rules, 'wholePlan')`. Test in `randomPlanning.test.ts`: Reste nur
      für `singleMeal` ausgeschaltet, `filledWeekPlan` plant trotzdem Reste. Der
      Test-Helfer `rollingRules(mainMealTime)` liefert `{ mainMealTime, switchedOff: [] }`,
      die Literale `{ mainMealTime, plansLeftovers }` werden ersetzt.
- [x] `src/meals/domain/announcements.ts`: neue Texte plus Tests in
      `announcements.test.ts`.
  ```ts
  rollingRulesHeading(): 'Regel-Verwaltung'
  mainMealTimeHeading(): 'Hauptgericht'
  mainMealTimeExplanation(): 'Genau ein Hauptgericht pro Tag, zu dieser Tageszeit.'
  switchableRuleName('leftovers'): 'Reste'
  switchableRuleExplanation('leftovers'): 'Ein Gericht mit Resten kommt am nächsten Tag noch einmal.'
  rollingModeName('singleMeal' | 'wholePlan'): 'Einzelgericht' | 'Gesamtplan'
  ruleSwitchName({ rule, mode }): 'Reste, Einzelgericht'
  ```
  Ob reine Konstanten wie die Überschrift als Funktion oder als `const` kommen, richtet
  sich nach dem Stil der Datei.

Adapter:

- [x] `src/meals/api/firestoreWeekPlanClient.ts`: `toRollingRules` ruft
      `rollingRulesFromStored(stored ?? {})`. `fromRollingRules` schreibt
      `{ mainMealTime, switchedOff: rules.switchedOff.map(ruleInModeKey) }` und kein
      `leftovers` mehr.
- [x] `src/meals/api/inMemoryWeekPlanClient.ts`, `weekPlanClient.ts`: Importe auf
      `rollingRules.ts` umstellen.

Oberfläche:

- [x] `src/meals/ui/useWeekPlan.ts`: `changeLeftoverPlanning` ersetzen durch
  ```ts
  switchRule: (ruleInMode: RuleInMode, on: boolean) => void
  ```
  Sie ruft `changeRollingRules(withRuleSwitched(rollingRules, ruleInMode, on))`.
  `useWeekPlan.test.tsx` umstellen. Die Tests „keeps its own rules …“ und „takes the
  rules of the other device …“ bleiben sinngemäß, dazu kommt ein Test für `switchRule`,
  der `mainMealTime` erhält.
- [x] `src/meals/ui/WeekPlanArea.tsx`: `shuffleSlot` ruft
      `rolledInto(…, rollingRules, 'singleMeal')`. `filledWeekPlan` bleibt mit
      `rollingRules`. In `WeekPlanArea.test.tsx` den Helfer `renderRollingAtDinner`
      und die Literale `plansLeftovers` auf `switchedOff` umstellen. Neuer Test: Reste
      nur für `singleMeal` aus, ein Platz wird gewürfelt, kein Reste-Platz entsteht.
      Mit Reste nur für `wholePlan` aus entsteht dagegen einer.
- [x] `src/meals/ui/RollingRulesPage.tsx` neu. Props:
  ```ts
  type RollingRulesPageProps = {
    rollingRules: RollingRules
    onChooseMainMealTime: (rule: MainMealTimeRule) => void
    onSwitchRule: (ruleInMode: RuleInMode, on: boolean) => void
    onBack: () => void
  }
  ```
  Aufbau: `<main className="page">`, Button „Zurück zu den Einstellungen“,
  `<h1 ref={useHeadingFocus()} tabIndex={-1}>Regel-Verwaltung</h1>`. Darunter je
  Gruppe ein `<section className="ruleGroup" aria-labelledby=…>` mit `<h2 id>`,
  `<p id>` für die Erklärung und den Bedienelementen:
  - Hauptgericht: `<select aria-labelledby={headingId} aria-describedby={explanationId}>`
    mit den Optionen aus `MAIN_MEAL_TIME_RULES`/`mainMealTimeRuleName`. Ein unbekannter
    Wert wird über `isMainMealTimeRule` verworfen.
  - jede Regel aus `SWITCHABLE_RULES`: je Modus aus `MODES_OF_RULE[rule]` ein
    `<label className="settingsToggle">` mit sichtbarem `rollingModeName(mode)` und
    `<input type="checkbox" role="switch" aria-label={ruleSwitchName(…)} aria-describedby={explanationId} checked={appliesIn(…)}>`.
  Die IDs leiten sich aus Regel und Modus ab, etwa `rule-leftovers-explanation`.
- [x] `src/shared/ui/SettingsPage.tsx`: Eintragsart `choice` samt
      `SettingsChoiceOption` entfernen.
- [x] `src/index.css`: `.settingsChoice` und `.settingsChoice select` entfernen.
      `.ruleGroup` anlegen: Abstand zwischen den Gruppen, Trennlinie wie bei
      `.mealRow`, `select` mit `width: 100%; min-width: 0`. Die Farben laufen über die
      vorhandenen Tokens, damit die Farbumkehr greift (`test/palette.test.ts` muss grün
      bleiben).
- [x] `src/SignedInApp.tsx`:
  - `ROLLING_RULES_ENTRY = 'rollingRules'`
  - Eintrag `{ kind: 'page', id: ROLLING_RULES_ENTRY, label: 'Regel-Verwaltung' }` vor
    `KNOWN_ITEMS_ENTRY`
  - die Einträge `mainMealTimeRule` und `leftoverPlanning` entfernen, ebenso die nicht
    mehr gebrauchten Importe
  - neuer Zweig `activeArea === 'settings' && settingsEntry === ROLLING_RULES_ENTRY`
    rendert `RollingRulesPage` mit `weekPlanning.rollingRules`,
    `weekPlanning.changeMainMealTimeRule`, `weekPlanning.switchRule` und
    `onBack={() => setSettingsEntry(null)}`
- [x] `src/SignedInApp.test.tsx` umstellen:
  - „offers to invert the colours …“ erwartet die neue Eintragsliste
  - die Tests zu Hauptgericht und Reste öffnen erst „Regel-Verwaltung“. Combobox-Name
    ist dann „Hauptgericht“, Schalter heißen „Reste, Einzelgericht“ / „Reste, Gesamtplan“
  - neu: „Zurück zu den Einstellungen“ führt zurück, die Überschrift
    „Regel-Verwaltung“ bekommt den Fokus
  - neu: die Gruppen-Überschriften stehen in der Reihenfolge Hauptgericht, Reste
  - neu: Schalter tragen die Erklärung als Beschreibung (`toHaveAccessibleDescription`)
  - neu: „Reste, Einzelgericht“ ausschalten speichert
    `switchedOff: [{ rule: 'leftovers', mode: 'singleMeal' }]`, und
    „Reste, Gesamtplan“ bleibt eingeschaltet
  - der vorhandene Test „rolls the main meal of the week at the time chosen in the
    settings“ geht über die Regel-Verwaltung
  - Barrierefreiheitsprüfung der neuen Seite über `src/testSupport/accessibility.ts`,
    so wie die anderen Seiten geprüft werden

E2E:

- [x] `e2e/emulatorHousehold.ts`: `rollingRulesOnServer` liefert
      `{ mainMealTime, switchedOff: string[] | null, leftovers: boolean | null }`.
      Neu `storeRollingRulesOnServer(fields)` zum Vorbelegen des Altzustands.
- [x] `e2e/settings.spec.ts`:
  - „remembers the main meal time …“ geht über „Regel-Verwaltung“, Combobox
    „Hauptgericht“
  - „switches off planning leftovers …“ wird zu „switches off leftovers for a single
    meal only“: Schalter „Reste, Einzelgericht“ per Leertaste, auf dem Server steht
    `switchedOff: ['leftovers.singleMeal']`, nach dem Neuladen ist er aus und
    „Reste, Gesamtplan“ an
  - neu: „takes over leftovers switched off before the update“: Server mit
    `{ mainMealTime: 'lunchOrDinner', leftovers: false }` vorbelegen, beide
    Reste-Schalter sind aus
- [x] `e2e/weekPlan.spec.ts:379-382` und `:415-418`: über „Regel-Verwaltung“ zur
      Combobox „Hauptgericht“.

Dokumentation:

- [x] `docs/architektur/05-bausteinsicht.md:176`: `rollingRules` in den
      Baustein-Knoten aufnehmen. Bei `SettingsPage` (`:208`) ändert sich nichts.

**Automatisierte Verifikation**:
- [x] `npm run test`: grün, darunter die neuen Tests in `rollingRules.test.ts`,
      `leftovers.test.ts`, `randomPlanning.test.ts`, `useWeekPlan.test.tsx`,
      `WeekPlanArea.test.tsx`, `SignedInApp.test.tsx` und `domainLayerBoundary.test.ts`
- [x] `npm run lint`: ohne Befund
- [x] `npm run build`: übersetzt
- [x] `npx playwright test e2e/settings.spec.ts e2e/weekPlan.spec.ts`: grün
- [x] `grep -rn "plansLeftovers\|changeLeftoverPlanning\|settingsChoice\|kind: 'choice'" src e2e`
      findet nichts

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver: Einstellungen → Regel-Verwaltung. Die Überschrift
      wird angesagt, die Schalter werden als „Reste, Einzelgericht, Schalter, ein“ mit
      der Erklärung danach vorgelesen, der Rotor springt über die Überschriften.
- [x] Auf dem zweiten Gerät erscheint ein umgelegter Schalter ohne Neuladen.
- [x] Mit invertierten Farben ist die Seite gut lesbar, Trennlinien und Schalter sind
      erkennbar.

### Phase 2: Kategorien, Frühstück und Snack, Abwechslung, Anderes Gericht schaltbar

Abhängigkeiten: Phase 1

Die übrigen vier weichen Regeln werden schaltbar und erscheinen auf der Seite.
`pickMealFor` und `filledWeekPlan` wenden nur noch die eingeschalteten Regeln des
jeweiligen Modus an.

**Aufgaben**:

Domäne (test-getrieben):

- [x] `src/meals/domain/rollingRules.ts`: Union und Konstanten erweitern.
  ```ts
  export type SwitchableRule =
    | 'categories'
    | 'leftovers'
    | 'repeatingBreakfastAndSnack'
    | 'variety'
    | 'otherMeal'
  export const SWITCHABLE_RULES: readonly SwitchableRule[] = [
    'categories', 'leftovers', 'repeatingBreakfastAndSnack', 'variety', 'otherMeal',
  ]
  export const MODES_OF_RULE = {
    categories: ROLLING_MODES,
    leftovers: ROLLING_MODES,
    repeatingBreakfastAndSnack: ROLLING_MODES,
    variety: ROLLING_MODES,
    otherMeal: ['singleMeal'],
  }
  ```
  Tests: `rollingRulesFromStored` liest `'categories.wholePlan'` und verwirft weiter
  `'otherMeal.wholePlan'`. `withRuleSwitched` ignoriert `otherMeal` im Gesamtplan.
- [x] `src/meals/domain/randomPlanning.ts`: `PLANNING_RULES` ersetzen durch
  ```ts
  const PLANNING_RULE_OF: Record<Exclude<SwitchableRule, 'leftovers'>, PlanningRule> = {
    otherMeal: otherThanPlanned,
    categories: apartFromSameCategory,
    repeatingBreakfastAndSnack: stayingLikeTheDayBefore,
    variety: rarestInThePlan,
  }
  const PLANNING_RULE_ORDER = ['otherMeal', 'categories', 'repeatingBreakfastAndSnack', 'variety'] as const

  export function planningRulesFor(rules: RollingRules, mode: RollingMode): readonly PlanningRule[]
  ```
  Die Reihenfolge entspricht dem heutigen `PLANNING_RULES`. Tests:
  - alles ein: die Liste gleicht der heutigen Reihenfolge
  - `categories` nur im Gesamtplan aus: fehlt dort, im Einzelgericht vorhanden
  - `otherMeal` erscheint im Gesamtplan nie (wirkungslos, aber eindeutig)
- [x] `pickMealFor(meals, plan, slot, random, rules: RollingRules, mode: RollingMode, mainMealTime = null)`
      nutzt `rules.mainMealTime` und `planningRulesFor(rules, mode)`.
      `filledDay` übergibt `'wholePlan'`. Die vorhandenen Tests übergeben
      `rollingRules(…)` und `'singleMeal'`/`'wholePlan'` passend zum bisherigen Aufruf.
      Neue Tests, je ein Szenario pro Regel und Modus, mit Zufallsquelle `alwaysFirst`:
  - Kategorien aus (Gesamtplan): zwei Hauptgerichte mit gleicher Kategorie dürfen an
    aufeinanderfolgenden Tagen stehen. Mit Kategorien an tun sie das nicht.
  - Frühstück und Snack wiederholen aus: das Frühstück vom Vortag wird nicht bevorzugt
    übernommen. Ist es die einzige weitere Möglichkeit, gilt die Regel „leere Menge
    überspringen“ wie heute.
  - Abwechslung aus: ein schon geplantes Gericht kann wieder gewählt werden, obwohl
    ein seltener geplantes zur Wahl steht.
  - Anderes Gericht aus (Einzelgericht): neu würfeln darf dasselbe Gericht bringen.
  - Gegenprobe: das Ausschalten im jeweils anderen Modus ändert das Ergebnis nicht.
- [x] `src/meals/domain/announcements.ts`: Namen und Erklärungen der vier Regeln laut
      Tabelle in den Akzeptanzkriterien, mit Tests.

Oberfläche:

- [x] `src/meals/ui/WeekPlanArea.tsx`: `shuffleSlot` ruft
      `pickMealFor(meals, plan, slot, random, rollingRules, 'singleMeal')`.
      Neuer Test in `WeekPlanArea.test.tsx`: mit „Anderes Gericht“ aus und nur einem
      passenden Gericht plus einem bereits geplanten bringt neues Würfeln das
      geplante. Die Gegenprobe mit „Anderes Gericht“ an liefert ein anderes Gericht.
- [x] `src/meals/ui/RollingRulesPage.tsx`: braucht keine Änderung, weil sie aus
      `SWITCHABLE_RULES` und `MODES_OF_RULE` rendert. Falls doch etwas fehlt, hier
      nachziehen.
- [x] `src/SignedInApp.test.tsx`: die Gruppen-Überschriften stehen in der Reihenfolge
      Hauptgericht, Kategorien, Reste, Frühstück und Snack wiederholen, Abwechslung,
      Anderes Gericht. „Anderes Gericht“ hat nur „Anderes Gericht, Einzelgericht“, es
      gibt keinen Schalter „Anderes Gericht, Gesamtplan“. Ein umgelegter Schalter
      „Kategorien, Gesamtplan“ wird gespeichert.

E2E:

- [x] `e2e/settings.spec.ts`: neuer Test „switches off the category rule for the whole
      plan“. Schalter per Leertaste, auf dem Server steht
      `switchedOff: ['categories.wholePlan']`, nach dem Neuladen ist er aus.

**Automatisierte Verifikation**:
- [x] `npm run test`: grün, darunter die neuen Regel-Szenarien in
      `randomPlanning.test.ts` und die Seiten-Tests in `SignedInApp.test.tsx`
- [x] `npm run lint`: ohne Befund
- [x] `npm run build`: übersetzt
- [x] `npx playwright test e2e/settings.spec.ts e2e/weekPlan.spec.ts`: grün
- [x] `grep -n "PLANNING_RULES" -r src` findet nichts mehr

**Manuelle Verifikation**:
- [x] Mit VoiceOver alle sechs Gruppen durchgehen: Namen, Erklärungen und
      Schalterzustände werden korrekt angesagt, „Anderes Gericht“ hat nur einen
      Schalter.
- [x] „Kategorien, Gesamtplan“ ausschalten und „Zufallsauswahl generieren“: Gerichte
      gleicher Kategorie dürfen nun aufeinanderfolgen. Würfelt man danach einen
      einzelnen Platz, achtet das Einzelgericht weiter auf Kategorien.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: Das Aussehen der Schalter hing an `.itemList input[type='checkbox']`. Die
  Selektoren für Label und Schalter gelten jetzt zusätzlich für `.ruleGroup`, damit die
  Regel-Verwaltung ohne Liste dieselben Schalter zeigt.
- Phase 1: `rollingRulesFromStored` liest ein `switchedOff`, das keine Liste ist, als
  „nichts ausgeschaltet“. Der Altwert `leftovers` zählt nur, solange `switchedOff` ganz
  fehlt.
- Phase 1: Die Regel-Verwaltung hat wie die anderen Unterseiten keine
  Navigationsleiste. Der Weg zum Wochenplan führt über „Zurück zu den Einstellungen“.
- Phase 2: `planningRulesFor` lässt `otherThanPlanned` im Gesamtplan ganz weg. Das
  Würfeln ändert sich dadurch nicht, weil `filledWeekPlan` jeden Platz leer vorfindet.
  Alle bisherigen Tests in `randomPlanning.test.ts` blieben grün.

## Verweise

- `docs/agents/plans/2026-09-25-regeln-fuer-die-zufallsauswahl.md` (MZP-031): Herkunft
  der Regeln
- `docs/agents/plans/2026-09-25-hauptgericht-zeit-einstellen.md`: Hauptgericht-Auswahl
- `docs/agents/plans/2026-10-07-reste-am-naechsten-tag.md` (MZP-039): Reste-Regel und
  ihr Schalter
- `docs/agents/plans/2026-09-18-artikelverwaltung-und-einstellungen.md`: Muster der
  Unterseiten in den Einstellungen
