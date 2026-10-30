---
date: 2026-10-30T07:18:43.502645+00:00
git_commit: fbf2ce83061dbbc5b8064bc788c6dfc222e3d8ba
branch: main
story: MZP-045
topic: "Einstellungen umbenennen und umsortieren"
tags: [plan, settings, shopping, meals, announcements, SignedInApp, KnownItemsArea, KnownUnitsArea, CategoriesArea, RollingRulesPage, voiceover, e2e]
status: ready
---

# PLAN: MZP-045 — Einstellungen umbenennen und umsortieren

Die Einträge im Optionsmenü verlieren das Anhängsel „-Verwaltung“ und heißen im Plural
nach dem, was man dort findet: Regeln, Artikel, Einheiten, Gerichtskategorien. Die
Einheiten rücken vor die Gerichtskategorien. Überschriften und Zurück-Knöpfe der
Unterseiten ziehen mit, ebenso Bezeichner und Testnamen im Code.

## Akzeptanzkriterien

- Die Einstellungen zeigen in dieser Reihenfolge: Farben invertieren, Regeln, Artikel,
  Einheiten, Gerichtskategorien.
- Die Überschriften der Unterseiten heißen „Regeln“, „Artikel, <n>“ / „Artikel, keine“,
  „Einheiten, <n>“ / „Einheiten, keine“ und „Gerichtskategorien, <n>“ /
  „Gerichtskategorien, keine“.
- Die Zurück-Knöpfe der Bearbeiten- und Löschen-Seiten heißen „Zurück zu den Artikeln“,
  „Zurück zu den Einheiten“ und „Zurück zu den Gerichtskategorien“.
- In `src` und `e2e` kommt weder „Verwaltung“ noch „management“ vor.
- Lint, Unit-Tests, E2E-Tests und Build sind grün.

## Wesentliche Entscheidungen und Abwägungen

1. **Namen im Plural, ohne „-Verwaltung“:** Regeln, Artikel, Einheiten,
   Gerichtskategorien (mit Fugen-s).
   - Warum: Das ist kürzer und sagt, was man auf der Seite findet. Ein bloßes
     „Kategorien“ ist schon zweimal vergeben: als Überschrift auf der Gerichtseite
     (`MealPage.tsx:72`, „Kategorien, 2“) und als Regel-Schalter („Kategorien,
     Gesamtplan“, `meals/domain/announcements.ts:124`).
   - Auswirkung: VoiceOver liest jeden Namen eindeutig vor.
2. **Neue Reihenfolge:** Farben invertieren, Regeln, Artikel, Einheiten,
   Gerichtskategorien.
   - Warum: Die beiden Einträge der Einkaufsliste stehen dann zusammen.
   - Auswirkung: `settingsEntries` in `SignedInApp.tsx` wird umsortiert.
3. **Zurück-Knöpfe nach dem Muster „Zurück zu den …“:**
   - Warum: So lauten schon „Zurück zu den Vorräten“, „Zurück zu den Gerichten“ und
     „Zurück zu den Einstellungen“.
   - Auswirkung: sechs Seiten in `shopping/ui` und `meals/ui` ändern ihren Knopftext.
4. **Der Code zieht mit:** `categoriesManagementHeading` wird zu
   `categoriesListHeading`, und die Testnamen sprechen von „the rules“, „the meal
   categories“ und „the units“.
   - Warum: Code und Oberfläche sollen dieselbe Sprache sprechen. `mealCategoriesHeading`
     ist schon für die Gerichtseite vergeben; `categoriesListHeading` passt zur
     verwendenden `CategoryListPage`.
   - Auswirkung: Nur Namen ändern sich, das Verhalten bleibt gleich.
5. **Alte Pläne bleiben unverändert.** Sie halten den damaligen Stand fest. In
   `docs/notes.txt` gibt es keinen Eintrag zu diesem Vorhaben.

## Ausgangslage

```
┌ Einstellungen ───────────────┐      Unterseite (Beispiel Artikel)
│ Farben invertieren   [ Aus ] │      ┌──────────────────────────────┐
│ Regel-Verwaltung           > │      │ < Zurück zu den Einstellungen│
│ Artikel-Verwaltung         > │ ───► │ # Artikel-Verwaltung, 42     │
│ Kategorie-Verwaltung       > │      │   Hafermilch               > │ ─► Bearbeiten
│ Einheiten-Verwaltung       > │      │   …                          │    < Zurück zur
└──────────────────────────────┘      └──────────────────────────────┘      Artikel-Verwaltung
```

- Menüeinträge: `src/SignedInApp.tsx:215-218`
- Überschriften: `rollingRulesHeading` (`src/meals/domain/announcements.ts:111`),
  `categoriesManagementHeading` (`src/meals/domain/announcements.ts:231`),
  `knownItemsHeading` (`src/shopping/domain/announcements.ts:58`),
  `knownUnitsHeading` (`src/shopping/domain/announcements.ts:82`)
- Zurück-Knöpfe: `src/shopping/ui/KnownItemFormPage.tsx:45`,
  `src/shopping/ui/DeleteKnownItemPage.tsx:20`, `src/shopping/ui/KnownUnitFormPage.tsx:45`,
  `src/shopping/ui/DeleteKnownUnitPage.tsx:20`, `src/meals/ui/CategoryFormPage.tsx:45`,
  `src/meals/ui/DeleteCategoryPage.tsx:21`

## Zielbild

```
Vorher                           Nachher
┌ Einstellungen ─────────────┐   ┌ Einstellungen ─────────────┐
│ Farben invertieren   [Aus] │   │ Farben invertieren   [Aus] │
│ Regel-Verwaltung         > │   │ Regeln                   > │
│ Artikel-Verwaltung       > │   │ Artikel                  > │
│ Kategorie-Verwaltung     > │   │ Einheiten                > │
│ Einheiten-Verwaltung     > │   │ Gerichtskategorien       > │
└────────────────────────────┘   └────────────────────────────┘
```

| Stelle | Vorher | Nachher |
|---|---|---|
| Überschrift Regeln | `Regel-Verwaltung` | `Regeln` |
| Überschrift Artikel | `Artikel-Verwaltung, 42` / `…, keine` | `Artikel, 42` / `Artikel, keine` |
| Überschrift Einheiten | `Einheiten-Verwaltung, 7` / `…, keine` | `Einheiten, 7` / `Einheiten, keine` |
| Überschrift Kategorien | `Kategorie-Verwaltung, 3` / `…, keine` | `Gerichtskategorien, 3` / `Gerichtskategorien, keine` |
| Zurück (Artikel bearbeiten/löschen) | `Zurück zur Artikel-Verwaltung` | `Zurück zu den Artikeln` |
| Zurück (Einheit bearbeiten/löschen) | `Zurück zur Einheiten-Verwaltung` | `Zurück zu den Einheiten` |
| Zurück (Kategorie bearbeiten/löschen) | `Zurück zur Kategorie-Verwaltung` | `Zurück zu den Gerichtskategorien` |

## Abstraktionen und Wiederverwendung

Keine neuen Abstraktionen. Die Überschriften liegen schon als reine Funktionen in den
`announcements`-Modulen der Domäne, die Menüeinträge als `SettingsEntry`-Liste.

- `src`
  - `SignedInApp.tsx` - `settingsEntries` umbenannt und umsortiert
  - `SignedInApp.test.tsx` - Knopf- und Überschriftsnamen, Reihenfolge, Testnamen
  - `meals/domain/announcements.ts`
    - `rollingRulesHeading` - liefert `Regeln`
    - `categoriesManagementHeading` → `categoriesListHeading` - `Gerichtskategorien, …`
  - `meals/domain/announcements.test.ts` - Erwartungen und `describe`-Name
  - `meals/domain/rollingRules.test.ts` - Testname
  - `meals/ui/CategoryListPage.tsx` - Import und Aufruf von `categoriesListHeading`
  - `meals/ui/CategoryFormPage.tsx`, `meals/ui/DeleteCategoryPage.tsx` - Zurück-Knopf
  - `meals/ui/CategoriesArea.test.tsx` - Überschriften, Testnamen, neuer Test für den Zurück-Knopf
  - `shopping/domain/announcements.ts` - `knownItemsHeading`, `knownUnitsHeading`
  - `shopping/domain/announcements.test.ts` - Erwartungen
  - `shopping/ui/KnownItemFormPage.tsx`, `shopping/ui/DeleteKnownItemPage.tsx` - Zurück-Knopf
  - `shopping/ui/KnownUnitFormPage.tsx`, `shopping/ui/DeleteKnownUnitPage.tsx` - Zurück-Knopf
  - `shopping/ui/KnownItemsArea.test.tsx`, `shopping/ui/KnownUnitsArea.test.tsx` - Überschriften, neuer Test für den Zurück-Knopf
- `e2e`
  - `settings.spec.ts`, `meals.spec.ts`, `weekPlan.spec.ts` - Knopf- und Überschriftsnamen

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine

Alle sichtbaren Namen der vier Einstellungsseiten werden umbenannt, das Menü wird
umsortiert, und Code und Tests ziehen mit. Die Überschriften entstehen test-getrieben
in der Domäne, danach folgen Oberfläche und E2E-Tests.

**Aufgaben**:

Überschriften in der Domäne (erst die Tests anpassen und rot sehen, dann den Code):

- [x] `src/shopping/domain/announcements.test.ts`: Erwartungen auf `Artikel, 42`,
      `Artikel, keine`, `Einheiten, 7` und `Einheiten, keine` ändern
- [x] `src/shopping/domain/announcements.ts`: `knownItemsHeading` und `knownUnitsHeading`
      liefern die neuen Texte
- [x] `src/meals/domain/announcements.test.ts`: `rollingRulesHeading()` erwartet `Regeln`.
      Den Import und den `describe`-Block auf `categoriesListHeading` umstellen, mit den
      Erwartungen `Gerichtskategorien, keine` und `Gerichtskategorien, 3`
- [x] `src/meals/domain/announcements.ts`: `rollingRulesHeading` liefert `Regeln`.
      `categoriesManagementHeading` heißt jetzt `categoriesListHeading` und liefert
      `Gerichtskategorien, …`
      ```ts
      export function categoriesListHeading(categoryCount: number): string {
        return categoryCount === 0
          ? 'Gerichtskategorien, keine'
          : `Gerichtskategorien, ${categoryCount}`
      }
      ```
- [x] `src/meals/ui/CategoryListPage.tsx`: Import und Aufruf auf `categoriesListHeading`
      umstellen
- [x] `src/meals/domain/rollingRules.test.ts:176`: Testname
      `'lists the rules in the order of the rules page'`

Menü in den Einstellungen:

- [x] `src/SignedInApp.test.tsx`: zuerst die Tests anpassen
  - `openRollingRules` (`:197`) drückt `Regeln`
  - `'opens the known items from the settings'` (`:1548`): Knopf `Artikel`, Überschrift
    `Artikel, 1`
  - `'opens the category management …'` (`:1567`) heißt jetzt
    `'opens the meal categories from the settings'`: Knopf `Gerichtskategorien`,
    Überschrift `Gerichtskategorien, 1`
  - `'opens the unit management …'` (`:1583`) heißt jetzt
    `'opens the units from the settings'`: Knopf `Einheiten`, Überschrift
    `` `Einheiten, ${DEFAULT_UNITS.length}` ``
  - `'offers to invert the colours above the rule management'` (`:1598`) heißt jetzt
    `'offers to invert the colours above the rules'` und erwartet
    `['Farben invertieren', 'Regeln', 'Artikel', 'Einheiten', 'Gerichtskategorien']`
  - `:1615`, `:1625`, `:1889`, `:1923`, `:1931`: in den Testnamen wird „rule management“
    zu „rules“, z. B. `'opens the rules from the settings and puts the focus on its
    heading'`. Die Überschrift-Erwartung in `:1621` lautet
    `{ level: 1, name: 'Regeln' }`
- [x] `src/SignedInApp.tsx:215-218`: `settingsEntries` umbenennen und umsortieren
      ```ts
      { kind: 'page', id: ROLLING_RULES_ENTRY, label: 'Regeln' },
      { kind: 'page', id: KNOWN_ITEMS_ENTRY, label: 'Artikel' },
      { kind: 'page', id: KNOWN_UNITS_ENTRY, label: 'Einheiten' },
      { kind: 'page', id: CATEGORIES_ENTRY, label: 'Gerichtskategorien' },
      ```

Unterseiten:

- [x] `src/shopping/ui/KnownItemsArea.test.tsx`: Überschriften auf `Artikel, …`
      umstellen. Neuer Test: Der Knopf `Zurück zu den Artikeln` auf der Bearbeiten-Seite
      führt zurück zur Liste, mit Überschrift `Artikel, …`. Den Aufbau aus den
      vorhandenen Bearbeiten-Tests übernehmen
- [x] `src/shopping/ui/KnownItemFormPage.tsx:45`, `src/shopping/ui/DeleteKnownItemPage.tsx:20`:
      `Zurück zu den Artikeln`
- [x] `src/shopping/ui/KnownUnitsArea.test.tsx`: Überschriften auf `Einheiten, …`
      umstellen. Neuer Test, analog zu den Artikeln, mit `Zurück zu den Einheiten`
- [x] `src/shopping/ui/KnownUnitFormPage.tsx:45`, `src/shopping/ui/DeleteKnownUnitPage.tsx:20`:
      `Zurück zu den Einheiten`
- [x] `src/meals/ui/CategoriesArea.test.tsx`: Überschriften auf `Gerichtskategorien, …`
      umstellen. Die Testnamen `:121` und `:294` heißen jetzt
      `'shows empty meal categories'` und `'has no accessibility violations on the meal
      categories'`. Neuer Test, analog zu den Artikeln, mit
      `Zurück zu den Gerichtskategorien`
- [x] `src/meals/ui/CategoryFormPage.tsx:45`, `src/meals/ui/DeleteCategoryPage.tsx:21`:
      `Zurück zu den Gerichtskategorien`

E2E-Tests:

- [x] `e2e/settings.spec.ts:29`: `pressButton(page, 'Regeln')`
- [x] `e2e/settings.spec.ts:205`: `pressButton(page, 'Einheiten')`. Die Überschrift-Erwartung
      in `:212` lautet `/^Einheiten, /`. Das Komma ist wichtig, damit der Ausdruck nicht
      auf andere Überschriften trifft, die mit „Einheiten“ beginnen
- [x] `e2e/meals.spec.ts:360`: `pressButton(page, 'Gerichtskategorien')`
- [x] `e2e/weekPlan.spec.ts:170`, `:411`, `:449`: `pressButton(page, 'Regeln')`

`pressButton` vergleicht schon exakt (`e2e/keyboard.ts:15`, `exact: true`). Die kurzen
Namen `Artikel` und `Einheiten` treffen also nicht versehentlich „Artikel hinzufügen“
oder Ähnliches.

**Automatisierte Verifikation**:

- [x] Die angepassten Domänentests schlagen vor der Codeänderung fehl und laufen
      danach grün
- [x] Die neuen Zurück-Knopf-Tests in `KnownItemsArea.test.tsx`, `KnownUnitsArea.test.tsx`
      und `CategoriesArea.test.tsx` laufen grün
- [x] `grep -rniE "verwaltung|management" src e2e` findet nichts
- [x] `npm run lint` läuft durch
- [x] `npm run test` läuft durch
- [x] Die E2E-Tests (`e2e/settings.spec.ts`, `e2e/meals.spec.ts`, `e2e/weekPlan.spec.ts`)
      laufen durch
- [x] `npm run build` läuft durch

**Manuelle Verifikation**:

- [ ] Auf dem iPhone mit VoiceOver die Einstellungen öffnen: Die Einträge werden als
      „Farben invertieren“, „Regeln“, „Artikel“, „Einheiten“ und „Gerichtskategorien“
      in dieser Reihenfolge vorgelesen
- [ ] Jede der vier Unterseiten öffnen: Die Überschrift wird mit dem neuen Namen
      vorgelesen, bei Artikeln, Einheiten und Gerichtskategorien mit der Anzahl
- [ ] Einen Artikel, eine Einheit und eine Gerichtskategorie zum Bearbeiten öffnen: Die
      Zurück-Knöpfe heißen „Zurück zu den Artikeln“, „Zurück zu den Einheiten“ und
      „Zurück zu den Gerichtskategorien“ und führen zur Liste zurück

## Notizen zur Umsetzung

## Verweise

- `docs/agents/plans/2026-10-19-regel-verwaltung.md` (MZP-041, Einführung der Regelseite)
- `docs/agents/plans/2026-09-25-einheiten-verwaltung.md` (MZP-034, Einführung der Einheitenseite)
- `docs/agents/plans/2026-09-24-kategorien-fuer-gerichte.md` (MZP-021, Einführung der Kategorieseite)
