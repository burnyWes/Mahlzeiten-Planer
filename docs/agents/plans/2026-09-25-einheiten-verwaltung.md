---
date: 2026-09-25T15:03:10.821111+00:00
git_commit: 7e999604d3dcf4835a53acb7bab2f2c22b7ad33c
branch: main
story: MZP-034
topic: "Einheiten-Verwaltung"
tags: [plan, shopping, meals, shared, firestore, ui, voiceover]
status: ready
---

# PLAN: MZP-034 — Einheiten-Verwaltung

Einheiten wie "g", "ml" oder "Zehe" werden wie die Artikelnamen in einem eigenen
Katalog gemerkt. Er liegt in der Firestore-Sammlung `units`. Beim Tippen einer Einheit
erscheinen Vorschläge als Knöpfe, und eine getippte Einheit wird an die Schreibweise im
Katalog angeglichen. In den Einstellungen kommt nach der Kategorie-Verwaltung die
"Einheiten-Verwaltung" hinzu. Dort lassen sich Einheiten umbenennen, verschmelzen und
löschen. Anlegen kann man dort keine Einheiten.

Vorlage ist der TODO-Punkt *"Einheit ebenfalls merken und Vorschläge machen. Neuer
Eintrag im Optionsmenü: Einheiten-Verwaltung"* aus `docs/notes.txt`. Alle
Entscheidungen stammen aus der Befragung vom 2026-09-25.

## Akzeptanzkriterien

- Die Einstellungen zeigen nach "Kategorie-Verwaltung" den Eintrag
  "Einheiten-Verwaltung".
- Die Einheiten-Verwaltung zeigt `h1` "Einheiten-Verwaltung, N" (bei null
  "Einheiten-Verwaltung, keine") und alle Einheiten alphabetisch (`de-DE`), je Zeile
  einen Namensknopf und einen Mülleimer "Löschen, <Einheit>". Ohne Einheiten steht dort
  "Noch keine Einheiten.". Es gibt keinen "+"-Knopf.
- Ein Tipp auf den Namen öffnet `h1` "Einheit bearbeiten" mit dem Feld "Name" (Fokus,
  bisheriger Name) und "Speichern" in der unteren Knopfleiste. Nach dem Speichern geht
  es zurück zur Liste, die Ansage lautet "<Einheit> gespeichert.".
- Ist der neue Name schon vergeben (Vergleich normalisiert: getrimmt, Leerzeichen
  vereinheitlicht, klein geschrieben), verschmelzen beide Einträge. Übrig bleibt einer
  unter dem neuen Namen, `timesUsed` wird addiert, `lastUsedAt` ist das spätere der
  beiden Daten.
- Ein leerer Name ergibt "Bitte einen Namen eingeben.", einer mit mehr als 100 Zeichen
  "Der Name ist zu lang.". Die Meldung steht in der Fehlerzeile und wird angesagt.
- Der Mülleimer öffnet `h1` "<Einheit> löschen?" mit dem Text "Die Einheit wird für
  beide Geräte entfernt. Wird sie wieder verwendet, entsteht sie neu." sowie den Knöpfen
  "Löschen" und "Abbrechen". Nach dem Löschen zeigt die Seite die Liste, die Ansage
  lautet "<Einheit> gelöscht, noch N Einheiten." (bzw. "noch 1 Einheit.", "keine
  Einheiten mehr.").
- Umbenennen und Löschen ändern nur den Katalog. Einkaufsartikel und Gerichte behalten
  ihre gespeicherte Einheit.
- Verschwindet die geöffnete Einheit, weil das andere Gerät sie entfernt hat, zeigt die
  Verwaltung wieder die Liste.
- Ist `units` auf dem Server leer, wird die Sammlung einmalig befüllt: mit `Stück`, `g`,
  `kg`, `ml`, `l` und `Pck.`, mit allen Einheiten aus der Einkaufslisten-Historie
  (`items`) und mit allen Einheiten aus den gespeicherten Gerichten (`meals`).
  `timesUsed` zählt jede Fundstelle, die sechs Standard-Einheiten ohne Fundstelle haben
  `0`. Einheiten, die sich nur in der Schreibweise unterscheiden, werden unter der
  jüngsten Schreibweise zusammengefasst.
- Unter dem Feld "Einheit" erscheinen, in "Artikel hinzufügen" wie im Gericht-Formular,
  ab dem ersten getippten Zeichen bis zu 5 Knöpfe in einer Liste namens
  "Einheiten-Vorschläge". Vorgeschlagen werden Einheiten, die das Getippte enthalten,
  aber nicht genau ihm entsprechen. Reihenfolge: erst die, die mit dem Getippten
  beginnen, dann nach `timesUsed`, dann nach dem letzten Gebrauch, dann alphabetisch.
- Ein Tipp auf einen Einheiten-Vorschlag trägt die Einheit ins Feld ein und setzt den
  Fokus auf den Absendeknopf ("Hinzufügen" bzw. "Item hinzufügen").
- Die `datalist` in beiden Formularen und die feste Liste `UNITS` entfallen.
- Die Vorschläge werden beim Öffnen der Seite eingefroren, wie bei den Namen. Im
  Gericht-Formular werden zusätzlich Namen und Einheiten der Items dazugemischt, die
  gerade im offenen Formular stehen. Die Einheiten aller gespeicherten Gerichte werden
  ebenfalls dazugemischt.
- Eine getippte Einheit, die normalisiert einer Katalog-Einheit entspricht, wird in der
  Schreibweise des Katalogs übernommen ("G" → "g"). Das gilt auf der Einkaufsliste für
  jeden Weg (von Hand, über ein Gericht, über den Wochenplan) und für neue
  Gericht-Items.
- Landet ein Artikel mit Einheit auf der Einkaufsliste, wird die Einheit gemerkt
  (`timesUsed + 1`, `lastUsedAt` = Zeitpunkt des Artikels).
- Beim Speichern eines Gerichts werden Name und Einheit jedes neu hinzugekommenen Items
  gemerkt, im Artikel- und im Einheiten-Katalog. Namen und Einheiten, die das Gericht
  vorher schon trug, zählen nicht erneut. Ein Formular, das nicht gespeichert wird,
  merkt nichts.
- Die Firestore-Regeln erlauben `units` nur dem Haushalt. Alle neuen Seiten sind ohne
  axe-Befund, die bestehenden Tests laufen grün.

### Bewusste Grenzen

- Tippfehler in schon gespeicherten Gerichten und Artikeln bleiben stehen, auch nach
  dem Umbenennen im Katalog. Sie werden im Gericht selbst korrigiert.
- Die Verwaltung kann keine Einheit vorab anlegen. Eine Einheit entsteht durch
  Benutzung oder bei der Erstbefüllung.
- Die Einheit im Mengen-Stepper der Einkaufsliste bleibt unberührt.
- Die Erstbefüllung schreibt mit `batch.set` ohne `merge`, wie beim Artikel-Katalog
  (`firestoreKnownItemsClient.ts:68-79`). Ein `recordUse` zwischen der Leer-Prüfung und
  dem Commit geht verloren. Das betrifft höchstens den allerersten Start und nur einen
  Zähler.

## Wesentliche Entscheidungen und Abwägungen

1. **Eigene Sammlung `units`, gebaut wie `knownItems`.** Ein Eintrag ist
   `KnownUnit = { name, lastUsedAt, timesUsed }`, die Dokument-ID ist
   `knownItemIdOf(name)` (normalisiert und kodiert).
   - Warum: Einheiten sollen unabhängig von einzelnen Gerichten bestehen, und die
     Vorschläge sollen nach Gebrauch sortiert sein. Das Vorbild ist der Artikel-Katalog
     (`src/shopping/api/firestoreKnownItemsClient.ts`).
   - Auswirkung: `firestore.rules` bekommt `match /units/{unitId}`. Die Regel wirkt in
     der Produktion erst, wenn sie von Hand deployt ist (TODO in `docs/notes.txt`).

2. **Der Katalog liegt im Kontext `shopping`, neben `knownItems`.** Die Gerichte
   erreichen ihn nur über `SignedInApp`.
   - Warum: Das ist dieselbe Bauart wie beim Artikel-Katalog. Der Architekturtest
     verbietet Importe zwischen `shopping` und `meals` in beide Richtungen
     (`test/domainLayerBoundary.test.ts:111-173`).
   - Auswirkung: `MealsArea` bekommt Props für Vorschläge, Angleichung und das Merken.
     Über die Grenze gehen nur Strings.

3. **Die Namens-Katalog-Logik wird geteilt statt kopiert.** `knownItem.ts` enthält
   heute Funktionen, die nur mit `{ name, lastUsedAt, timesUsed }` arbeiten
   (`recordUse`, `canonicalName`, `planKnownItemRename`, `applyRename`,
   `knownItemsByName`, `withNamesInUse`, Vorschlagsranking). `knownUnit.ts` delegiert an
   sie. Nur Einheiten-Eigenes entsteht neu: die Standard-Einheiten, die Erstbefüllung
   und die Vorschlagsschwelle von einem Zeichen.
   - Warum: Die Regeln für Schreibweise, Verschmelzen und Zählen sollen für Artikel und
     Einheiten gleich sein und nicht auseinanderlaufen.
   - Auswirkung: `suggestNames` wird intern auf eine Funktion
     `suggestFromCatalog(entries, typed, minimumTypedLength)` zurückgeführt, die auch
     `suggestUnits` nutzt. `KnownUnit` ist strukturell gleich `KnownItem`, trägt aber
     einen eigenen Namen.

4. **Die Erstbefüllung bekommt die Einheiten der Gerichte als Funktion gereicht.**
   `MealsClient.unitsOnServer(): Promise<readonly string[]>` liest die Gerichte vom
   Server. `SignedInApp` reicht die Funktion an `KnownUnitsClient.takeOverIfEmpty(...)`
   weiter.
   - Warum: `shopping` darf `meals` nicht importieren und soll auch nicht wissen, wie
     Gerichte gespeichert werden.
   - Auswirkung: `MealsClient` bekommt eine Methode im Port, im Firestore-Adapter
     (`getDocsFromServer`) und im In-Memory-Adapter.

5. **Knöpfe statt `datalist`, ab dem ersten Zeichen.** `NameSuggestions` bekommt eine
   Prop `label` mit dem Standardwert `"Vorschläge"`. Die Einheiten nutzen
   `label="Einheiten-Vorschläge"`.
   - Warum: Unter VoiceOver ist die `datalist` schwer erreichbar, und Safari bestimmt
     Treffer und Reihenfolge selbst (MZP-003, Entscheidung 4). Einheiten sind oft nur
     ein Zeichen lang ("g", "l").
   - Auswirkung: Die bestehenden Tests, die die Liste "Vorschläge" suchen, bleiben
     unverändert. VoiceOver kann beide Listen am Namen unterscheiden.

6. **Die Formular-Items fließen in die Vorschläge ein.** Die Vorschlagsfunktionen
   bekommen einen zweiten Parameter `alsoInUse: readonly string[]`, der zu den
   eingefrorenen Einträgen dazugemischt wird. Im Gericht-Formular sind das die Namen
   bzw. Einheiten der Items des offenen Formulars, in "Artikel hinzufügen" ist es `[]`.
   - Warum: Gemerkt wird erst beim Speichern (Entscheidung 7). Eine Einheit, die gerade
     im Formular übernommen wurde, soll trotzdem schon beim nächsten Item vorgeschlagen
     werden.
   - Auswirkung: Die zweiparametrige Signatur gilt nur in `MealsArea`, `MealFormPage`
     und `MealItemsEditor`. `ShoppingArea` und `AddItemPage` bleiben bei `(typed) => …`,
     `SignedInApp` reicht dort `(typed) => suggestKnownNames(typed, [])` bzw.
     `(typed) => suggestKnownUnits(typed, [])` weiter.

7. **Gemerkt wird beim Speichern des Gerichts, und zwar nur Neues.**
   `newlyUsedNames(before, after)` und `newlyUsedUnits(before, after)` in
   `src/meals/domain/meal.ts` liefern die Namen bzw. Einheiten aus `after`, die in
   `before` normalisiert nicht vorkommen, je Gericht nur einmal.
   - Warum: Abgebrochene Formulare und wieder entfernte Items sollen den Katalog nicht
     verschmutzen. Ein erneutes Speichern soll nichts hochzählen.
   - Auswirkung: `MealsArea` ruft nach dem Speichern
     `onItemsUsed(names, units)`. `SignedInApp` schreibt beide Kataloge mit
     `Date.now()`. Vorher gleicht es jeden Namen über `canonicalName` an, weil
     `recordUse` die gespeicherte Schreibweise überschreibt
     (`src/shopping/domain/knownItem.ts:37-41`). Sonst würde ein Item "hackfleisch"
     den Katalogeintrag "Hackfleisch" umschreiben. Die Einheiten sind schon im Editor
     angeglichen.

8. **Die Schreibweise wird im Hook bzw. im Formular angeglichen, nicht im Katalog.**
   `useShoppingList` erweitert `underGroomedName` um die Einheit
   (`canonicalUnit(knownUnits, unit)`). `MealItemsEditor` gleicht die Einheit des
   Entwurfs vor `createMealItem` über die Prop `canonicalUnit` an.
   - Warum: Das ist dieselbe Stelle, an der heute schon der Name angeglichen wird
     (`src/shopping/ui/useShoppingList.ts:149-155`).
   - Auswirkung: Gleich geschriebene Einheiten lassen sich wieder zusammenrechnen
     (`canAddQuantities`, `src/shared/domain/quantity.ts:76-81`).

9. **Die Verwaltung ist eine Kopie der Artikel-Verwaltung.** `KnownUnitsArea`,
   `KnownUnitListPage`, `KnownUnitListRow`, `KnownUnitFormPage` und
   `DeleteKnownUnitPage` in `src/shopping/ui` folgen den `KnownItem…`-Dateien Zeile für
   Zeile.
   - Warum: Gleiche Bedienung für VoiceOver, gleiche Tests. Eine gemeinsame
     Catalog-Komponente wäre eine Abstraktion für nur zwei Fälle, und die Texte
     unterscheiden sich überall.
   - Auswirkung: Die Validierung nutzt `createItemName` und `additionFailureMessage`,
     also dieselben Meldungen wie die Artikel-Verwaltung.

## Ausgangslage

```
shared/domain/quantity.ts   UNITS = ['Stück','g','kg','ml','l','Pck.']
        │
        ├──► shopping/ui/AddItemPage.tsx:101        <datalist id="units">
        └──► meals/ui/MealItemsEditor.tsx:130       <datalist id="mealUnits">

Einkaufsliste:  useShoppingList.addItem/addItems
                  ├─ underGroomedName  → Name in Katalog-Schreibweise   (:149-155)
                  └─ carryOutAll       → knownItemsClient.recordUse(name) (:127-132)

Gericht speichern: MealsArea.saveMeal → meals.addMeal/changeMeal      (nichts gemerkt)

Einstellungen (SignedInApp.tsx:165-189):
  Farben invertieren · Hauptgericht würfeln · Artikel-Verwaltung · Kategorie-Verwaltung
```

- `NameSuggestions` (`src/shared/ui/NameSuggestions.tsx`) rendert
  `<ul aria-label="Vorschläge">` mit einem Knopf je Name.
- `MealFormPage` friert `suggestNames` beim Öffnen ein (`MealFormPage.tsx:65`) und
  reicht es an `MealItemsEditor` weiter.
- `useKnownItems` stößt einmal je Client `takeOverHistoryIfEmpty()` an
  (`src/shopping/ui/useKnownItems.ts:17-21`).
- `SignedInApp` baut die Clients über `create…Client`-Props (`src/SignedInApp.tsx:76-92`),
  `App.tsx` und `main.tsx` reichen sie durch. Der Test-Helfer `renderSignedInApp`
  (`src/SignedInApp.test.tsx:50-80`) nimmt die Clients als Positionsparameter.

## Zielbild

Artikel hinzufügen, vorher und nachher:

```
 vorher                                 nachher
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│ [Zurück zur Liste]               │   │ [Zurück zur Liste]               │
│ Artikel hinzufügen            h1 │   │ Artikel hinzufügen            h1 │
│ Name     [Knoblauch_______]      │   │ Name     [Knoblauch_______]      │
│ Menge [2 ]  Einheit [Ze____▾]    │   │ Menge [2 ]  Einheit [Ze_____]    │
│             (datalist, fest)     │   │ ┌ Einheiten-Vorschläge ───────┐  │
│                                  │   │ │ [ Zehe ]                    │  │
│                                  │   │ └─────────────────────────────┘  │
│ <Fehlerzeile>                    │   │ <Fehlerzeile>                    │
│ [ Hinzufügen ]                   │   │ [ Hinzufügen ]  ◄ Fokus nach Tipp│
└──────────────────────────────────┘   └──────────────────────────────────┘
```

Das Gericht-Formular ändert sich im Item-Teil genauso: "Einheiten-Vorschläge" unter den
Mengenfeldern, der Fokus geht nach dem Tipp auf "Item hinzufügen".

Einstellungen und Einheiten-Verwaltung:

```
 Einstellungen                        Einheiten-Verwaltung
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ [Liste][Plan][Gerichte][Vor.][⚙] │ │ [Zurück zu den Einstellungen]    │
│ Einstellungen                 h1 │ │ Einheiten-Verwaltung, 7       h1 │
│ Farben invertieren          (o ) │ │ [ g                       ] [🗑] │
│ Hauptgericht würfeln  [……    ▾]  │ │ [ kg                      ] [🗑] │
│ [ Artikel-Verwaltung           ] │ │ [ l                       ] [🗑] │
│ [ Kategorie-Verwaltung         ] │ │ [ ml                      ] [🗑] │
│ [ Einheiten-Verwaltung         ] │ │ [ Pck.                    ] [🗑] │
└──────────────────────────────────┘ │ [ Stück                   ] [🗑] │
                                     │ [ Zehe                    ] [🗑] │
                                     └──────────────────────────────────┘
                                        │ Name                  │ Mülleimer
                                        ▼                       ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ [Zurück zur Einheiten-Verwaltung]│ │ [Zurück zur Einheiten-Verwaltung]│
│ Einheit bearbeiten            h1 │ │ Zehe löschen?                 h1 │
│ Name                             │ │ Die Einheit wird für beide       │
│ [Zehe________________________]   │ │ Geräte entfernt. Wird sie wieder │
│ <Fehlerzeile>                    │ │ verwendet, entsteht sie neu.     │
│ ┌────────── 💾 Speichern ──────┐ │ │ [ Löschen ]    [ Abbrechen ]     │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

Datenfluss:

```
                           SignedInApp
        ┌───────────────────────┼───────────────────────────────┐
        │                       │                               │
 useKnownUnits(client, mealsClient.unitsOnServer)        MealsArea
   └─ takeOverIfEmpty ──► units leer? → DEFAULT_UNITS      ├─ suggestUnits(typed, formUnits)
                                       + items-Historie    ├─ canonicalUnit(typed)
                                       + unitsOnServer()   └─ onItemsUsed(names, units)
 useShoppingList(…, knownUnitsClient, knownUnits)                 │
   ├─ underGroomedName: Name UND Einheit angleichen               ▼
   └─ carryOutAll: recordUse(name) + recordUse(unit)   knownItemsClient.recordUse(name)
                                                       knownUnitsClient.recordUse(unit)
```

## Abstraktionen und Wiederverwendung

- `src/shared/domain/quantity.ts` - `UNITS` entfällt
- `src/shared/ui/NameSuggestions.tsx` - Prop `label?: string`, Standard `"Vorschläge"`
- `src/shopping/domain`
  - `knownItem.ts`
    - `suggestFromCatalog(entries, typed, minimumTypedLength)` - NEU, exportiert; der
      bisherige Rumpf von `suggestNames`
    - `suggestNames` - ruft `suggestFromCatalog(…, 2)`
  - `knownUnit.ts` - NEU
    - `KnownUnit = { name: string; lastUsedAt: number; timesUsed: number }`
    - `DEFAULT_UNITS = ['Stück', 'g', 'kg', 'ml', 'l', 'Pck.']`
    - `suggestUnits(knownUnits, typed)` - `suggestFromCatalog(…, 1)`
    - `canonicalUnit(knownUnits, typed)` - delegiert an `canonicalName`
    - `recordUnitUse(knownUnits, unit, usedAt)` - delegiert an `recordUse`
    - `withUnitsInUse(knownUnits, units)` - delegiert an `withNamesInUse`
    - `knownUnitsByName`, `planKnownUnitRename`, `applyUnitRename` - delegieren
    - `knownUnitsFromHistory(items, mealUnits)` - Erstbefüllung
  - `announcements.ts` - `knownUnitsHeading`, `knownUnitSavedAnnouncement`,
    `knownUnitDeletedAnnouncement`
- `src/shopping/api`
  - `knownUnitsClient.ts` - NEU, Port
    ```ts
    export interface KnownUnitsClient {
      observeKnownUnits(
        onKnownUnits: (knownUnits: readonly KnownUnit[]) => void,
      ): () => void
      recordUse(unit: string, usedAt: number): void
      removeKnownUnit(unit: string): void
      renameKnownUnit(rename: KnownUnitRename): void
      takeOverIfEmpty(unitsOfMeals: () => Promise<readonly string[]>): void
    }
    ```
  - `firestoreKnownUnitsClient.ts` - NEU, Muster `firestoreKnownItemsClient.ts`,
    Sammlung `units`
  - `inMemoryKnownUnitsClient.ts` - NEU, Muster `inMemoryKnownItemsClient.ts`
- `src/shopping/ui`
  - `useKnownUnits.ts` - NEU, Muster `useKnownItems.ts`
  - `useShoppingList.ts` - Parameter `knownUnitsClient`, `knownUnits`; Einheit
    angleichen und merken
  - `AddItemPage.tsx`, `ShoppingArea.tsx` - Prop `suggestUnits`, `datalist` raus
  - `KnownUnitsArea.tsx`, `KnownUnitListPage.tsx`, `KnownUnitListRow.tsx`,
    `KnownUnitFormPage.tsx`, `DeleteKnownUnitPage.tsx` - NEU
- `src/meals/domain/meal.ts` - `newlyUsedNames`, `newlyUsedUnits`
- `src/meals/api`
  - `mealsClient.ts` - `unitsOnServer(): Promise<readonly string[]>`
  - `firestoreMealsClient.ts` - `getDocsFromServer(meals)`, Einheiten der Items
  - `inMemoryMealsClient.ts` - Einheiten der gespeicherten Gerichte
- `src/meals/ui`
  - `MealsArea.tsx` - Props `suggestUnits`, `canonicalUnit`, `onItemsUsed`
  - `MealFormPage.tsx` - `suggestUnits` einfrieren, Formular-Items mitgeben
  - `MealItemsEditor.tsx` - Einheiten-Vorschläge, Angleichung, `datalist` raus
- `src/SignedInApp.tsx`, `src/App.tsx`, `src/main.tsx` - `createKnownUnitsClient`
- `firestore.rules`, `firestore.rules.test.ts` - Sammlung `units`
- `e2e/emulatorHousehold.ts` - `knownUnitNamesOnServer()`
- `e2e/shoppingList.spec.ts`, `e2e/meals.spec.ts`, `e2e/settings.spec.ts` - je ein
  neuer Ablauf

Keine neue Abhängigkeit.

## Umsetzung

### Phase 1: Einheiten-Katalog mit Vorschlägen in "Artikel hinzufügen"

Abhängigkeiten: keine

Der Katalog `units` entsteht samt Erstbefüllung. Auf der Einkaufsliste werden
Einheiten angeglichen und gemerkt, und "Artikel hinzufügen" zeigt Einheiten-Vorschläge
statt der `datalist`. Das Gericht-Formular behält in dieser Phase noch seine
`datalist` und damit `UNITS`.

**Aufgaben**:

- [x] Test zuerst: `src/shopping/domain/knownItem.test.ts`, `describe('suggestFromCatalog')`:
      - `suggests from the first typed character when asked to`
      - `suggests nothing below the given number of typed characters`
      Die bestehenden `suggestNames`-Fälle bleiben unverändert grün.
- [x] `src/shopping/domain/knownItem.ts`: `suggestFromCatalog` extrahieren und
      exportieren, `suggestNames` ruft sie mit `MINIMUM_TYPED_LENGTH` auf.
- [x] Test zuerst: `src/shopping/domain/knownUnit.test.ts`:
      - `suggestUnits`: `suggests a unit from a single typed character`,
        `puts units starting with the typed text first`, `leaves out the unit that
        equals what was typed`, `suggests five units at most`
      - `canonicalUnit`: `answers with the spelling of a known unit` ("G" → "g"),
        `keeps a unit the catalog does not know`
      - `knownUnitsFromHistory`:
        - `holds the default units as never used` (`timesUsed` 0, `lastUsedAt` 0)
        - `counts every item that carries a unit` (zwei Artikel "g" → `timesUsed` 2,
          `lastUsedAt` = jüngstes `createdAt`)
        - `counts every unit of the meals` (ein Standard-Eintrag wird hochgezählt, eine
          neue Einheit "Zehe" kommt mit `lastUsedAt` 0 dazu)
        - `gathers spellings under the newest one` ("G" jünger als "g" → ein Eintrag "G")
        - `keeps the default spelling against an undated meal unit` (Gericht mit "G",
          keine Historie → ein Eintrag "g" mit `timesUsed` 1)
        - `ignores items without a unit`
      - `withUnitsInUse`: `adds a unit unknown so far as never used`
- [x] `src/shopping/domain/knownUnit.ts` nach *Abstraktionen* anlegen.
      `knownUnitsFromHistory(items: readonly ShoppingItem[], mealUnits: readonly string[])`
      arbeitet in dieser Reihenfolge:
      1. Artikel mit Einheit nach `createdAt` absteigend einsetzen. Die jüngste
         Schreibweise gewinnt, wie in `knownItemsFromHistory`.
      2. Fehlende `DEFAULT_UNITS` mit `timesUsed` 0 und `lastUsedAt` 0 ergänzen.
      3. Die Einheiten aus `mealUnits` hochzählen, ohne die Schreibweise zu ändern.
         Unbekannte werden mit `lastUsedAt` 0 angelegt.

      Gerichts-Einheiten haben kein Datum und verdrängen deshalb keine vorhandene
      Schreibweise.
- [x] Test zuerst: `src/shopping/domain/announcements.test.ts`
      - `knownUnitsHeading`: `0` → "Einheiten-Verwaltung, keine", `7` →
        "Einheiten-Verwaltung, 7"
      - `knownUnitDeletedAnnouncement`: "g gelöscht, keine Einheiten mehr." /
        "… noch 1 Einheit." / "… noch 3 Einheiten."
- [x] `src/shopping/domain/announcements.ts`: die Funktionen umsetzen, dazu
      `knownUnitSavedAnnouncement(name)` → "<Name> gespeichert." (für Phase 3).
- [x] `src/shopping/api/knownUnitsClient.ts`: Port wie unter *Abstraktionen*.
      `KnownUnitRename` ist ein Alias von `KnownItemRename`, exportiert aus
      `knownUnit.ts`.
- [x] `src/shopping/api/inMemoryKnownUnitsClient.ts`: Muster
      `inMemoryKnownItemsClient.ts`, Signatur
      `createInMemoryKnownUnitsClient(initialKnownUnits: readonly KnownUnit[] = [], history: readonly ShoppingItem[] = [])`,
      mit `knownUnitsArriveFromElsewhere` und `storedKnownUnits`.
      `takeOverIfEmpty(unitsOfMeals)` folgt derselben Reihenfolge wie Firestore: Zuerst
      prüft es, ob der Katalog leer ist, und bricht sonst ab. Dann wartet es auf
      `unitsOfMeals()`. Danach befüllt es mit `knownUnitsFromHistory(history, mealUnits)`
      und veröffentlicht.
- [x] `src/shopping/api/firestoreKnownUnitsClient.ts`: Muster
      `firestoreKnownItemsClient.ts`, Sammlung `units`, Dokument-ID
      `knownItemIdOf(unit)`. `takeOverIfEmpty` prüft `catalogIsEmptyOnServer`, liest
      `items` vom Server (`toShoppingItem`) und die Gerichts-Einheiten über die gereichte
      Funktion, dann schreibt es in Batches. `inBatches` und `ignoreFailure` werden
      dazu aus `firestoreKnownItemsClient.ts` exportiert und wiederverwendet.
- [x] `firestore.rules`: `match /units/{unitId} { allow read, write: if isHousehold(); }`
      vor dem Auffang-`match`.
- [x] `firestore.rules.test.ts`: `const knownUnitsOf = collectionOf('units')` und die
      fünf Fälle nach dem Muster der `knownItems`-Fälle (Zeile 160-181): Der Haushalt
      schreibt, liest und löscht, ein Fremder liest nicht, ein nicht angemeldeter
      Besucher wird abgewiesen.
- [x] `src/meals/api/mealsClient.ts`: `unitsOnServer(): Promise<readonly string[]>`.
      Geprüft wird die Methode über die Erstbefüllungs-Fälle in `SignedInApp.test.tsx`
      (siehe Verifikation).
- [x] `src/meals/api/firestoreMealsClient.ts`: `unitsOnServer` liest
      `getDocsFromServer(meals)`, bildet mit `toMeal` ab und liefert die Einheiten aller
      Items ohne `null`, eine je Fundstelle. Doppelte bleiben stehen, weil sie
      `timesUsed` hochzählen. Ist der Server nicht erreichbar, schlägt das Versprechen
      fehl, `takeOverIfEmpty` verwirft den Fehler (`ignoreFailure`), und der nächste
      Start versucht es erneut.
- [x] `src/meals/api/inMemoryMealsClient.ts`: `unitsOnServer` liefert dasselbe aus
      `meals`.
- [x] `src/shopping/ui/useKnownUnits.ts`: Muster `useKnownItems.ts`, Signatur
      `useKnownUnits(client, unitsOfMeals)`. Der Effekt für `takeOverIfEmpty` läuft
      einmal je Client, die Funktion wird über einen `useRef` gehalten, damit ein neuer
      Funktionswert keinen zweiten Lauf auslöst.
- [x] `src/shopping/ui/useShoppingList.ts`: zusätzliche Parameter
      `knownUnitsClient: KnownUnitsClient` und `knownUnits: readonly KnownUnit[]`.
      `underGroomedName` gleicht auch `quantity.unit` über `canonicalUnit` an
      (`quantity` `null` oder `unit` `null` bleiben unverändert). `carryOutAll` ruft je
      Ergebnis mit Einheit `knownUnitsClient.recordUse(unit, createdAt)`.
- [x] `src/shared/ui/NameSuggestions.tsx`: Prop `label?: string` mit Standard
      `'Vorschläge'`, als `aria-label` der Liste.
- [x] `src/shopping/ui/AddItemPage.tsx`: Prop `suggestUnits: (typed: string) => readonly string[]`,
      beim Öffnen einfrieren wie `suggestNames`. `datalist` und `list="units"` entfernen,
      unter `div.quantityFields` ein `<NameSuggestions label="Einheiten-Vorschläge"
      names={suggestUnitsOnOpen(draft.unit)} onChoose={chooseUnit} />`. `chooseUnit`
      setzt `unit` und fokussiert den Knopf "Hinzufügen" (neuer `ref`).
- [x] `src/shopping/ui/ShoppingArea.tsx`: Prop `suggestUnits` durchreichen.
- [x] `src/SignedInApp.tsx`: Prop `createKnownUnitsClient: () => KnownUnitsClient`,
      `useKnownUnits(knownUnitsClient, mealsClient.unitsOnServer)`,
      `useShoppingList(…, knownUnitsClient, knownUnits.knownUnits)`. Die Einheiten der
      Gerichte ergeben sich als
      `meals.meals.flatMap((meal) => meal.items.flatMap((item) => item.quantity?.unit ?? []))`.
      Neue Funktion `suggestKnownUnits(typed, alsoInUse)` =
      `suggestUnits(withUnitsInUse(knownUnits.knownUnits, [...mealItemUnits, ...alsoInUse]), typed)`.
      An `ShoppingArea` geht `(typed) => suggestKnownUnits(typed, [])`.
- [x] `src/App.tsx`, `src/main.tsx`: `createKnownUnitsClient` durchreichen,
      `main.tsx` baut `createFirestoreKnownUnitsClient(firestore)`.
- [x] `src/App.test.tsx`, `src/SignedInApp.test.tsx`: `createKnownUnitsClient`
      ergänzen. `renderSignedInApp` bekommt als letzten Positionsparameter
      `knownUnitsClient = createInMemoryKnownUnitsClient(DEFAULT_UNITS.map((name) => ({ name, lastUsedAt: 0, timesUsed: 0 })))`
      und gibt ihn zurück. Der Standard-Client ist also schon befüllt und löst keine
      asynchrone Erstbefüllung aus. So entstehen in den bestehenden, synchronen Tests
      keine State-Änderungen außerhalb von `act`. Dasselbe gilt für `App.test.tsx`. Nur
      die Befüllungs-Tests reichen ausdrücklich einen leeren Client herein und prüfen
      mit `await waitFor(...)`.
- [x] `src/shopping/ui/ShoppingArea.test.tsx`: Der Harness `ShoppingAreaUnderTest`
      (Zeile 44-63) bekommt einen `createInMemoryKnownUnitsClient` mit den
      Standard-Einheiten, dazu `useKnownUnits(client, async () => [])`,
      `useShoppingList(…, knownUnitsClient, knownUnits.knownUnits)` und
      `suggestUnits={(typed) => suggestUnits(knownUnits.knownUnits, typed)}`. Ohne
      diese Anpassung scheitern `tsc -b` und jeder Test mit Einheit.
- [x] `e2e/emulatorHousehold.ts`: `knownUnitNamesOnServer(): Promise<readonly string[]>`
      nach dem Muster von `itemNamesOnServer`, Sammlung `units`.
- [x] `e2e/shoppingList.spec.ts`: `suggests a unit and takes over its spelling`.
      - Zuerst mit `expect.poll(knownUnitNamesOnServer)` warten, bis die sechs
        Standard-Einheiten auf dem Server liegen. Die Erstbefüllung läuft asynchron,
        und "Artikel hinzufügen" friert die Vorschläge beim Öffnen ein.
      - Dann über einen neuen Helfer `openAddItemPageUntilUnitSuggested` (Muster
        `openAddItemPageUntilSuggested`, Zeile 34-53, mit `toPass()`) den Artikel
        "Mehl" mit Menge 1 anlegen. "k" ins Feld "Einheit" tippen, per Tipp auf "kg" in
        "Einheiten-Vorschläge" wählen und hinzufügen.
      - Danach den Artikel "Zucker" mit Menge 500 und getipptem "G" hinzufügen.
      - Erwartet: Die Zeile von "Mehl" zeigt "kg", die von "Zucker" zeigt "g".

**Automatisierte Verifikation**:

- [x] Die neuen Fälle in `knownItem.test.ts`, `knownUnit.test.ts` und
      `announcements.test.ts` schlagen vor der Umsetzung fehl und laufen danach grün.
- [x] Neue Fälle in `src/shopping/ui/ShoppingArea.test.tsx`:
      - `suggests units from the first typed character` - "k" tippen → Liste
        "Einheiten-Vorschläge" mit "kg"
      - `takes over a suggested unit and moves on to the add button` - Tipp auf "kg",
        das Feld zeigt "kg", der Fokus liegt auf "Hinzufügen"
      - `offers no unit list without a typed unit`
      - `keeps the name suggestions apart from the unit suggestions` - beide Listen
        gleichzeitig, jeweils am Namen gefunden
      - `has no accessibility violations with unit suggestions`
- [x] Neue Fälle in `src/SignedInApp.test.tsx`:
      - `fills an empty unit catalog with the defaults, the history and the meals` -
        leerer `knownUnitsClient`, ein Artikel "Mehl, 500 g" in der Historie, ein
        Gericht mit "Knoblauch, 2 Zehe"; `storedKnownUnits()` enthält die sechs
        Standard-Einheiten und "Zehe", "g" mit `timesUsed` 1
      - `leaves a unit catalog that is already filled alone`
      - `takes over the spelling of a known unit on the shopping list` - Katalog "g",
        Artikel mit "G" → gespeicherte Menge mit Einheit "g"
      - `remembers the unit of an item that lands on the shopping list` - auch über
        "Auf die Einkaufsliste" an einem Gericht
      - `remembers nothing for an item without a unit`
      - `suggests the units of the meals on the shopping list`
- [x] `npm run test:rules` läuft grün, samt den neuen `units`-Fällen.
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [x] `npm run test:e2e` läuft grün, samt dem neuen Ablauf.

**Manuelle Verifikation**:

- [x] `npx firebase deploy --only firestore:rules --project mahlzeiten-planer-ecd26`
      ist ausgeführt, bevor die App ausgerollt wird.
- [x] Auf dem iPhone mit VoiceOver: In "Artikel hinzufügen" "k" ins Feld "Einheit"
      tippen. VoiceOver erreicht per Wischen "Einheiten-Vorschläge, Liste", ein
      Doppeltipp auf "kg" setzt den Fokus auf "Hinzufügen".

### Phase 2: Einheiten im Gericht-Formular und Merken beim Speichern

Abhängigkeiten: Phase 1

Das Gericht-Formular schlägt Einheiten vor und gleicht sie an. Beim Speichern merkt
es Namen und Einheiten neuer Items. Die Items des offenen Formulars erscheinen sofort in
den Vorschlägen. `UNITS` verschwindet.

**Aufgaben**:

- [x] Test zuerst: `src/meals/domain/meal.test.ts`
      - `newlyUsedNames`: `names every item of a new meal once` (Aufruf mit `[]` als
        `before`), `leaves out names the meal carried before, whatever their spelling`,
        `names an item added twice only once`
      - `newlyUsedUnits`: `names every unit of a new meal once`, `leaves out units the
        meal carried before`, `ignores items without a unit`
- [x] `src/meals/domain/meal.ts`: beide Funktionen, Vergleich über `normalizeMealName`,
      Ergebnis in der Schreibweise und Reihenfolge von `after`.
- [x] `src/meals/ui/MealItemsEditor.tsx`: Props
      `suggestNames: (typed: string, alsoInUse: readonly string[]) => readonly string[]`,
      `suggestUnits` gleicher Form und `canonicalUnit: (typed: string) => string`.
      `datalist` und den `UNITS`-Import entfernen, `NameSuggestions` mit
      `label="Einheiten-Vorschläge"` unter `div.quantityFields`. Vorschläge mit den
      Namen bzw. Einheiten aus `items` als `alsoInUse`. `takeOverItem` ruft
      `createMealItem({ ...draft, unit: canonicalUnit(draft.unit) })`. Ein Tipp auf einen
      Einheiten-Vorschlag fokussiert "Item hinzufügen".
- [x] `src/meals/ui/MealFormPage.tsx`: `suggestUnits` wie `suggestNames` beim Öffnen
      einfrieren, beide sowie `canonicalUnit` an den Editor reichen. `onSave` bleibt
      unverändert, der Vergleich alt/neu geschieht in `MealsArea`.
- [x] `src/meals/ui/MealsArea.tsx`: Props `suggestNames` in neuer Signatur,
      `suggestUnits`, `canonicalUnit`,
      `onItemsUsed: (names: readonly string[], units: readonly string[]) => void`.
      `saveMeal` bestimmt `before` = Items des bisherigen Gerichts bzw. `[]` und ruft
      nach dem Schreiben `onItemsUsed(newlyUsedNames(before, newMeal.items),
      newlyUsedUnits(before, newMeal.items))`, nur wenn eine der Listen nicht leer ist.
- [x] `src/SignedInApp.tsx`: `suggestKnownNames(typed, alsoInUse)` mischt `alsoInUse`
      zu `withNamesInUse`. `ShoppingArea` bekommt weiterhin eine einparametrige Funktion
      `(typed) => suggestKnownNames(typed, [])`. `MealsArea` bekommt
      `suggestKnownNames`, `suggestKnownUnits`,
      `canonicalUnit={(typed) => canonicalUnit(knownUnits.knownUnits, typed)}` und
      `onItemsUsed`. Dieses ruft mit einem gemeinsamen `Date.now()` je Name
      `knownItemsClient.recordUse(canonicalName(knownItems.knownItems, name), usedAt)`
      und je Einheit `knownUnitsClient.recordUse(unit, usedAt)`.
- [x] `src/shared/domain/quantity.ts`: `UNITS` entfernen.
- [x] `src/meals/ui/MealsArea.test.tsx`: Der Harness `MealsAreaUnderTest` (Zeile 25-49)
      bekommt die Props `suggestUnits`, `canonicalUnit` und `onItemsUsed`, wobei
      `onItemsUsed` die Aufrufe in einer Liste sammelt. `suggestingFrom` (Zeile 52-58)
      mischt `alsoInUse` zu den vorgegebenen Namen, und ein gleich gebautes
      `suggestingUnitsFrom` kommt dazu.
- [x] `e2e/meals.spec.ts`: `remembers the unit of a new meal item`. Gericht "Aioli"
      anlegen, Item "Knoblauch", Menge 2, Einheit "Zehe", speichern; warten, bis
      `knownUnitNamesOnServer()` "Zehe" enthält. Dann "Artikel hinzufügen" über
      `openAddItemPageUntilUnitSuggested` (aus Phase 1, dafür nach
      `e2e/emulatorHousehold.ts` oder in eine gemeinsame Hilfsdatei verschoben) öffnen,
      "Ze" tippen und "Zehe" in "Einheiten-Vorschläge" sehen.

**Automatisierte Verifikation**:

- [x] Die neuen Fälle in `meal.test.ts` schlagen vor der Umsetzung fehl und laufen
      danach grün.
- [x] Neue Fälle in `src/meals/ui/MealsArea.test.tsx`:
      - `suggests units in the meal form` - "Einheiten-Vorschläge" mit einem Treffer
      - `suggests the unit of an item taken over in the same form` - Item mit "Zehe"
        übernehmen, beim nächsten Item "Ze" tippen → "Zehe"
      - `suggests the name of an item taken over in the same form`
      - `takes over the spelling of a known unit for a new item` - "G" → Item mit "g"
      - `reports the new items when a new meal is saved` - `onItemsUsed` mit Namen und
        Einheiten
      - `reports only the items added while editing` - vorhandenes "Spaghetti, 500 g",
        neu "Knoblauch, 2 Zehe" → `(['Knoblauch'], ['Zehe'])`
      - `reports nothing when a meal is saved unchanged`
      - `reports nothing when the form is left without saving`
      - `has no accessibility violations with unit suggestions in the meal form`
- [x] Neue Fälle in `src/SignedInApp.test.tsx`:
      - `remembers the name and the unit of a new meal item in both catalogs`
      - `keeps the catalog spelling of a name remembered from a meal` - Katalog
        "Hackfleisch", neues Gericht-Item "hackfleisch" → der Katalog heißt weiter
        "Hackfleisch", `timesUsed` + 1
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch; `UNITS` kommt in
      `src` nicht mehr vor.
- [x] `npm run test:e2e` läuft grün, samt dem neuen Ablauf.

### Phase 3: Einheiten-Verwaltung in den Einstellungen

Abhängigkeiten: Phase 1

Die Einstellungen bekommen den Eintrag "Einheiten-Verwaltung" mit Liste, Umbenennen
samt Verschmelzen und Löschen.

**Aufgaben**:

- [x] Test zuerst: `src/shopping/domain/knownUnit.test.ts`
      - `planKnownUnitRename`: `merges the unit into the one that holds the name
        already` ("gr" → "g": `timesUsed` addiert, `removedName` "gr"), `only corrects
        the spelling` ("Zehe" → "zehe": `removedName` `null`), `refuses an empty name`
        (`InvalidShoppingItem` mit `nameMissing`)
      - `knownUnitsByName`: `sorts the units the German way`
- [x] `src/shopping/domain/knownUnit.ts`: `planKnownUnitRename`, `applyUnitRename` und
      `knownUnitsByName` als Delegation an die `knownItem`-Funktionen.
- [x] `src/shopping/ui/useKnownUnits.ts`: `removeKnownUnit` und `renameKnownUnit` in
      `KnownUnits`, Muster `useKnownItems.ts:23-33`.
- [x] `src/shopping/ui/KnownUnitListRow.tsx`, `KnownUnitListPage.tsx`: Kopie der
      `KnownItem…`-Dateien. Überschrift `knownUnitsHeading`, Leertext "Noch keine
      Einheiten.", sortiert mit `knownUnitsByName`, Mülleimer
      `aria-label={`Löschen, ${knownUnit.name}`}`.
- [x] `src/shopping/ui/KnownUnitFormPage.tsx`: Kopie von `KnownItemFormPage.tsx`,
      Rückknopf "Zurück zur Einheiten-Verwaltung", `h1` "Einheit bearbeiten", Feld
      `id="knownUnitName"`, Fehlerzeile `id="knownUnitFailure"`.
- [x] `src/shopping/ui/DeleteKnownUnitPage.tsx`: Kopie von `DeleteKnownItemPage.tsx`,
      Text "Die Einheit wird für beide Geräte entfernt. Wird sie wieder verwendet,
      entsteht sie neu.".
- [x] `src/shopping/ui/KnownUnitsArea.tsx`: Kopie von `KnownItemsArea.tsx` mit
      `planKnownUnitRename`, `knownUnitSavedAnnouncement` und
      `knownUnitDeletedAnnouncement`. Adressiert wird über `normalizeItemName`.
- [x] `src/SignedInApp.tsx`: `const KNOWN_UNITS_ENTRY = 'knownUnits'`, Eintrag
      `{ kind: 'page', id: KNOWN_UNITS_ENTRY, label: 'Einheiten-Verwaltung' }` nach der
      Kategorie-Verwaltung, `KnownUnitsArea` rendern wie `KnownItemsArea`.
- [x] `src/SignedInApp.test.tsx`: der Test `offers to invert the colours above the
      known items` (Zeile 1175-1190) erwartet zusätzlich "Einheiten-Verwaltung" am Ende.
- [x] `e2e/settings.spec.ts`: `merges a misspelt unit into the right one`. In der App
      den Artikel "Mehl" mit Menge 500 und getippter Einheit "gr" hinzufügen und warten,
      bis `knownUnitNamesOnServer()` "gr" enthält. Dann Einstellungen →
      "Einheiten-Verwaltung" → "gr" → Name "g" → "Speichern". Die Liste zeigt kein "gr"
      mehr, und `knownUnitNamesOnServer()` enthält "g", aber nicht "gr".

**Automatisierte Verifikation**:

- [x] Die neuen Fälle in `knownUnit.test.ts` schlagen vor der Umsetzung fehl und laufen
      danach grün.
- [x] `src/shopping/ui/KnownUnitsArea.test.tsx` mit den Fällen aus
      `KnownItemsArea.test.tsx:95-282`, übertragen auf Einheiten:
      `lists the units in alphabetical order`, `shows an empty catalog`, `leads back to
      the settings`, `asks before deleting a unit`, `keeps the unit when the deletion is
      cancelled`, `deletes the unit after the confirmation`, `returns to the list when
      the unit disappears`, `starts the form with the current name in focus`, `corrects
      the spelling of a unit`, `merges a unit into an existing one`, `refuses an empty
      name`, `refuses a name that is too long`, `returns to the list when the unit to be
      renamed is already gone` sowie die drei axe-Fälle für Formular, Liste und
      Löschseite.
- [x] Neuer Fall in `src/SignedInApp.test.tsx`: `opens the unit management from the
      settings` - `h1` "Einheiten-Verwaltung, N".
- [x] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [x] `npm run test:e2e` läuft grün, samt dem neuen Ablauf.

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: Einstellungen → "Einheiten-Verwaltung". Die Liste
      zeigt die übernommenen Einheiten. Eine Einheit umbenennen und eine löschen, die
      Ansagen stimmen, und das zweite Gerät zeigt den neuen Stand.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: Die Einheiten aller Items einer Gerichtsliste bildet die neue
  Domänenfunktion `unitsOfMeals` in `src/meals/domain/meal.ts`. Sie wird von
  `firestoreMealsClient`, `inMemoryMealsClient` und `SignedInApp` genutzt statt des
  im Plan inline notierten `flatMap`.
- Phase 1: Das Angleichen der Einheit einer Menge ist als `withCanonicalUnit` in
  `knownUnit.ts` gelandet (mit Tests), `useShoppingList` ruft es nur auf.
- Phase 1: `openAddItemPageUntilUnitSuggested` liegt gleich in `e2e/keyboard.ts`, damit
  Phase 2 es ohne Umzug nutzen kann.
- Phase 1: Der Tipp "k" in "Einheit" schlägt mit den Standard-Einheiten "kg", "Pck."
  und "Stück" vor, weil jede davon ein "k" enthält.
- Phase 2: `unitsOfItems` in `meal.ts` ist exportiert und wird von `unitsOfMeals`,
  `newlyUsedUnits` und `MealItemsEditor` (Einheiten des offenen Formulars) geteilt.
- Phase 2: Die Sammlungs-Konstante im Firestore-Adapter heisst `KNOWN_UNITS`, damit
  `UNITS` in `src` nicht mehr vorkommt.
- Phase 2: Zusätzlicher Komponententest `takes a suggested unit and moves the focus to
  the item button` in `MealsArea.test.tsx`.
- Phase 3: `inMemoryKnownUnitsClient` nutzt jetzt `applyUnitRename` statt
  `applyRename` aus `knownItem.ts`.
- Phase 3: Der E2E-Ablauf `merges a misspelt unit into the right one` wartet zuerst,
  bis die Erstbefüllung "g" auf den Server gebracht hat, damit das Verschmelzen auf
  einen vorhandenen Eintrag trifft.
- Nach Abschluss in `docs/notes.txt` den TODO-Punkt "Einheit ebenfalls merken und
  Vorschläge machen. Neuer Eintrag im Optionsmenü: Einheiten-Verwaltung" auf `x`
  setzen und nach DONE verschieben.

## Verweise

- `docs/notes.txt` - TODO "Einheit ebenfalls merken …" und TODO zum manuellen
  Regel-Deployment
- `docs/agents/plans/2026-09-16-artikelvorschlaege-beim-tippen.md` (MZP-003) -
  Knöpfe statt `datalist`, Einfrieren der Vorschläge
- `docs/agents/plans/2026-09-18-artikelverwaltung-und-einstellungen.md` - Vorbild
  der Verwaltung
- `docs/agents/plans/2026-09-24-kategorien-fuer-gerichte.md` (MZP-021) - Muster
  der Einstellungs-Einträge
- `src/shopping/domain/knownItem.ts`, `src/shopping/api/firestoreKnownItemsClient.ts`,
  `src/shopping/ui/KnownItemsArea.tsx`
- `test/domainLayerBoundary.test.ts` - Kontextgrenzen
