---
date: 2026-10-30T12:43:21.862770+00:00
git_commit: 2ccfb245a2fd85a471351ec2bb2e53bd32ae7927
branch: main
story: MZP-047
topic: "Artikel einer Artikelkategorie anzeigen"
tags: [plan, shopping, settings, ui, voiceover]
status: done
---

# PLAN: MZP-047 — Artikel einer Artikelkategorie anzeigen

Wer in den Einstellungen unter "Artikelkategorien" eine Kategorie öffnet, sieht dort
alle Artikel des Artikelkatalogs, die ihr zugeordnet sind. Zusätzlich gibt es eine
Sicht "Ohne Kategorie" auf alle Artikel ohne gültige Kategorie, damit sich der
Katalog gezielt aufräumen lässt. Beide Listen sind reine Lesesichten.

Alle Entscheidungen stammen aus der Befragung vom 2026-10-30.

## Akzeptanzkriterien

### Artikel auf "Kategorie bearbeiten"

- Die Seite "Kategorie bearbeiten" zeigt unter dem Spinner "Position" und über der
  Fehlerzeile eine `h2` "Artikel, N" (bei null "Artikel, keine").
- Darunter steht eine `ul.itemList` mit den Namen aller Katalogartikel, deren
  `categoryId` die geöffnete Kategorie ist. Die Liste ist alphabetisch wie in der
  Artikel-Verwaltung (`knownItemsByName`) und enthält keine Knöpfe.
- Ohne zugeordnete Artikel steht statt der Liste "Noch keine Artikel in dieser
  Kategorie.".
- "Kategorie anlegen" zeigt weder `h2` noch Liste.
- Ändert das andere Gerät die Zuordnung eines Artikels, während die Seite offen ist,
  aktualisieren sich Überschrift und Liste. Getippter Name und gewählte Position
  bleiben erhalten.

### "Ohne Kategorie"

- Hat mindestens ein Katalogartikel keine gültige Kategorie (`categoryId` ist `null`
  oder zeigt auf eine Kategorie, die es nicht mehr gibt), steht unter der
  Kategorienliste in einer eigenen `ul.itemList` die Zeile mit dem Knopf "Ohne
  Kategorie, 8 Artikel". Die Zeile hat keine Nummer und keinen Mülleimer.
- Die Zeile erscheint auch, wenn es noch keine Kategorien gibt, dann unter "Noch keine
  Kategorien.". Haben alle Artikel eine gültige Kategorie oder ist der Katalog leer,
  fehlt sie.
- Ein Tipp öffnet die Seite mit dem Knopf "Zurück zu den Artikelkategorien", der `h1`
  "Ohne Kategorie" (bekommt den Fokus), der `h2` "Artikel, N" und der alphabetischen
  Liste dieser Artikel, ohne Knöpfe in der Liste.
- Bekommen alle diese Artikel auf dem anderen Gerät eine Kategorie, während die Seite
  offen ist, bleibt sie offen und zeigt "Artikel, keine" und "Alle Artikel haben eine
  Kategorie.".
- "Zurück zu den Artikelkategorien" führt zur Kategorienliste.

### Übergreifend

- Alle neuen und geänderten Seiten sind ohne axe-Befund.
- Die bestehenden Tests laufen grün, auch die Zählungen "12 Artikel" in den Zeilen und
  im Löschdialog.

### Bewusste Grenzen

- Die Listen sind nur zum Lesen da. Einen Artikel umhängen geht weiter über
  Einstellungen → Artikel.
- Gezeigt werden Katalogartikel (`knownItems`), nicht die Artikel der aktuellen
  Einkaufsliste.

## Wesentliche Entscheidungen und Abwägungen

1. **Die Artikel stehen auf "Kategorie bearbeiten", es gibt keine eigene
   Detailseite.**
   - Warum: Ein Tipp bleibt ein Tipp. Mit VoiceOver ist die Liste nach dem Spinner
     direkt erreichbar, außerdem über den Überschriften-Rotor (`h2`).
   - Auswirkung: `ItemCategoryFormPage` bekommt eine optionale Prop
     `assignedKnownItems`. Nur der Bearbeiten-Fall übergibt sie.

2. **Die Listen sind nur zum Lesen da.**
   - Warum: keine verschachtelten Dialoge und keine Frage nach ungespeicherten Eingaben
     von Name oder Position.
   - Auswirkung: eine schlichte Komponente `AssignedKnownItems` mit `h2`, `ul` oder
     Leertext. Beide Seiten nutzen sie.

3. **"Ohne Kategorie" umfasst auch verwaiste `categoryId`s.**
   - Warum: Das passt zur Gruppierung der Einkaufsliste aus MZP-046, wo eine gelöschte
     Kategorie wie "Ohne Kategorie" wirkt.
   - Auswirkung: Die neue Domänenfunktion `knownItemsWithoutCategory` prüft gegen den
     Kategorienkatalog (`findItemCategory`).

4. **`ItemCategoriesArea` bekommt die Katalogartikel statt fertiger Zählungen.**
   - Warum: Beide Seiten brauchen die Artikel selbst, nicht nur Zahlen.
   - Auswirkung: Die Prop `assignedCounts` wird durch `knownItems: readonly
     KnownItem[]` ersetzt. Die Area berechnet `assignedCounts(knownItems)` selbst.
     `SignedInApp` übergibt `knownItems.knownItems`.

## Ausgangslage

```
SignedInApp.tsx:275
  <ItemCategoriesArea itemCategories assignedCounts={assignedCounts(knownItems.knownItems)} …/>

ItemCategoriesArea.tsx   Seitenzustand: list | create | form(id) | delete(id)
 ├─ ItemCategoryListPage   "1. Obst/Gemüse, 12 Artikel" [🗑]   bzw. "Noch keine Kategorien."
 │    └─ Tipp ──► ItemCategoryFormPage  h1 "Kategorie bearbeiten": Name, Position, [Speichern]
 └─ 🗑 ──► DeleteItemCategoryPage   (nutzt assignedCounts für "7 Artikel haben dann …")
```

- Die Zuordnung steht am Katalogeintrag: `KnownItem.categoryId`
  (`src/shopping/domain/knownItem.ts`). Gezählt wird mit `assignedCounts`
  (`src/shopping/domain/knownItem.ts:129`), das auch verwaiste IDs mitzählt. Sie
  werden aber nie angezeigt.
- Alphabetisch sortiert `knownItemsByName` (`src/shopping/domain/knownItem.ts:139`).
- Den Fokus auf die Überschrift setzt `useHeadingFocus`
  (`src/shared/ui/useHeadingFocus.ts`).

Heute: "Kategorie bearbeiten"

```
[Zurück zu den Artikelkategorien]
# Kategorie bearbeiten
Name      [Obst/Gemüse     ]
Position  [ 1 von 6  − + ]

─────────────────────────────
            [Speichern]
```

Heute: Kategorienliste

```
[Zurück zu den Einstellungen]
# Artikelkategorien, 2                 [+]
Nach Kategorien sortieren         [ an ]
1. Obst/Gemüse, 3 Artikel          [🗑]
2. Backwaren, 5 Artikel            [🗑]
```

## Zielbild

Neu: "Kategorie bearbeiten"

```
[Zurück zu den Artikelkategorien]
# Kategorie bearbeiten
Name      [Obst/Gemüse     ]
Position  [ 1 von 6  − + ]

## Artikel, 3
  Äpfel
  Bananen
  Gurken

─────────────────────────────
            [Speichern]
```

leer:

```
## Artikel, keine
Noch keine Artikel in dieser Kategorie.
```

Neu: Kategorienliste

```
[Zurück zu den Einstellungen]
# Artikelkategorien, 2                 [+]
Nach Kategorien sortieren         [ an ]
1. Obst/Gemüse, 3 Artikel          [🗑]
2. Backwaren, 5 Artikel            [🗑]
Ohne Kategorie, 8 Artikel
```

ohne Kategorien:

```
# Artikelkategorien, keine             [+]
Nach Kategorien sortieren         [ an ]
Noch keine Kategorien.
Ohne Kategorie, 40 Artikel
```

Neu: Seite "Ohne Kategorie"

```
[Zurück zu den Artikelkategorien]
# Ohne Kategorie
## Artikel, 8
  Backpapier
  Kaffee
  …
```

leer (nur erreichbar, wenn das andere Gerät die Lage ändert):

```
# Ohne Kategorie
## Artikel, keine
Alle Artikel haben eine Kategorie.
```

Seitenzustand der Area danach: `list | create | form(id) | delete(id) | uncategorized`.

## Abstraktionen und Wiederverwendung

- `src/shopping/domain`
  - `knownItem.ts`
    - `knownItemsInCategory(knownItems, categoryId)` - neu, alphabetisch über
      `knownItemsByName`
    - `knownItemsWithoutCategory(knownItems, catalog)` - neu, `categoryId` `null`
      oder nicht in `catalog` (über `findItemCategory`), alphabetisch
  - `knownItem.test.ts` - Tests für beide Funktionen
  - `announcements.ts`
    - `assignedKnownItemsHeading(count)` - neu: "Artikel, N" / "Artikel, keine"
    - `uncategorizedRowLabel(count)` - neu: "Ohne Kategorie, N Artikel"
  - `announcements.test.ts` - Tests für beide Texte
- `src/shopping/ui`
  - `AssignedKnownItems.tsx` - neu: `h2`, `ul.itemList` mit `li` je Name oder
    `p` mit dem übergebenen Leertext (Props `knownItems`, `emptyText`)
  - `ItemCategoryFormPage.tsx` - optionale Prop `assignedKnownItems`, rendert
    `AssignedKnownItems` zwischen Position und Fehlerzeile
  - `ItemCategoryListPage.tsx` - Props `uncategorizedCount`, `onOpenUncategorized`,
    zweite `ul` mit der Zeile "Ohne Kategorie"
  - `UncategorizedKnownItemsPage.tsx` - neu: Zurück-Knopf, `h1` per
    `useHeadingFocus`, `AssignedKnownItems`
  - `ItemCategoriesArea.tsx` - Prop `knownItems` statt `assignedCounts`,
    Seitenzustand `uncategorized`
  - `ItemCategoriesArea.test.tsx` - Testaufbau auf `knownItems` umstellen, neue Fälle
- `src/SignedInApp.tsx` - `knownItems={knownItems.knownItems}` übergeben, Import von
  `assignedCounts` entfällt

Die Zeile "Ohne Kategorie" nutzt dieselben Klassen wie die Kategoriezeilen (`mealRow`,
`mealNameButton`), damit sie gleich aussieht. Neues CSS ist nicht nötig. Die Artikel
in `AssignedKnownItems` stehen als Text in `li` innerhalb von `ul.itemList`. Wirkt die
Darstellung auf dem Gerät gedrängt, wird das in der Umsetzung nachgezogen.

## Umsetzung

### Phase 1: Artikel einer Kategorie auf "Kategorie bearbeiten"

Abhängigkeiten: keine

Die Bearbeiten-Seite zeigt die zugeordneten Katalogartikel. Die Area erhält dafür die
Katalogartikel statt der Zählungen.

**Aufgaben**:
- [x] Test zuerst: `knownItemsInCategory` liefert nur Artikel mit genau dieser
  `categoryId`, alphabetisch, und für eine Kategorie ohne Artikel ein leeres Array
  (`src/shopping/domain/knownItem.test.ts`).
- [x] `knownItemsInCategory` in `src/shopping/domain/knownItem.ts` umsetzen:
  ```ts
  export function knownItemsInCategory(
    knownItems: readonly KnownItem[],
    categoryId: ItemCategoryId,
  ): readonly KnownItem[] {
    return knownItemsByName(
      knownItems.filter((knownItem) => knownItem.categoryId === categoryId),
    )
  }
  ```
- [x] Test zuerst, dann `assignedKnownItemsHeading` in
  `src/shopping/domain/announcements.ts`: 0 → "Artikel, keine", 3 → "Artikel, 3".
- [x] `src/shopping/ui/AssignedKnownItems.tsx` anlegen: Props `knownItems: readonly
  KnownItem[]` und `emptyText: string`. Rendert `h2` mit
  `assignedKnownItemsHeading`, danach entweder `ul.itemList` mit `li` je
  `knownItem.name` (`key` = Name) oder `p` mit `emptyText`.
- [x] `ItemCategoryFormPage`: optionale Prop `assignedKnownItems?: readonly
  KnownItem[]`. Ist sie gesetzt, steht
  `<AssignedKnownItems knownItems={assignedKnownItems} emptyText="Noch keine Artikel
  in dieser Kategorie." />` zwischen dem Positions-`div` und der Fehlerzeile.
- [x] `ItemCategoriesArea`: Prop `assignedCounts` durch `knownItems: readonly
  KnownItem[]` ersetzen, die Zählungen intern mit `assignedCounts(knownItems)`
  berechnen (für Liste und Löschdialog). Im Fall `form` übergeben:
  `assignedKnownItems={knownItemsInCategory(knownItems, addressed.category.id)}`.
- [x] `src/SignedInApp.tsx`: `knownItems={knownItems.knownItems}` übergeben und den
  dann ungenutzten Import `assignedCounts` entfernen.
- [x] `src/shopping/ui/ItemCategoriesArea.test.tsx`: `ItemCategoriesAreaUnderTest` und
  `renderItemCategoriesArea` nehmen `knownItems: readonly KnownItem[]` statt
  `assignedCounts`. Die bestehenden Fälle mit Zählungen bekommen passende
  Katalogartikel (z. B. drei Artikel mit `categoryId: 'c1'` für "3 Artikel"). Die
  Hilfsfunktion `shownRows` muss weiterhin nur die Kategoriezeilen liefern. Hierzu
  auf die erste `list` in `main` einschränken, weil Phase 2 eine zweite Liste
  hinzufügt.
- [x] Neue UI-Tests in `ItemCategoriesArea.test.tsx`:
  - "Kategorie bearbeiten" zeigt `h2` "Artikel, 2" und die Listeneinträge "Äpfel",
    "Bananen" in dieser Reihenfolge, Artikel anderer Kategorien fehlen
  - eine Kategorie ohne Artikel zeigt "Artikel, keine" und "Noch keine Artikel in
    dieser Kategorie."
  - "Kategorie anlegen" hat keine `h2`
  - Rendern mit geänderten `knownItems` (`rerender`) bei geöffneter Seite: Die Liste
    ist aktualisiert, das Feld "Name" behält den getippten Text
  - axe ohne Befund auf "Kategorie bearbeiten" mit Artikelliste

**Automatisierte Verifikation**:
- [x] `npm run test` läuft grün, inklusive der neuen Tests in `knownItem.test.ts`,
  `announcements.test.ts` und `ItemCategoriesArea.test.tsx`
- [x] `npm run lint` läuft durch (inklusive Architekturregel: `domain` importiert
  nichts aus `ui`/`api`)
- [x] `npm run build` läuft durch

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver eine Kategorie öffnen: Nach dem Spinner "Position"
  folgen die Überschrift "Artikel, N" und die Namen. Über den Überschriften-Rotor ist
  die `h2` erreichbar.

### Phase 2: Sicht "Ohne Kategorie"

Abhängigkeiten: Phase 1

Die Kategorienliste bekommt die Zeile "Ohne Kategorie", ein Tipp öffnet die Seite mit
den Artikeln ohne gültige Kategorie.

**Aufgaben**:
- [x] Test zuerst: `knownItemsWithoutCategory` liefert Artikel mit `categoryId: null`
  und mit einer `categoryId`, die im Katalog fehlt, alphabetisch. Artikel mit
  gültiger Kategorie fehlen. Bei leerem Katalog sind alle Artikel ohne Kategorie
  (`src/shopping/domain/knownItem.test.ts`).
- [x] `knownItemsWithoutCategory` in `src/shopping/domain/knownItem.ts` umsetzen:
  ```ts
  export function knownItemsWithoutCategory(
    knownItems: readonly KnownItem[],
    catalog: ItemCategoryCatalog,
  ): readonly KnownItem[] {
    return knownItemsByName(
      knownItems.filter(
        (knownItem) => findItemCategory(catalog, knownItem.categoryId) === null,
      ),
    )
  }
  ```
  `findItemCategory` nimmt `null` an und liefert dann `null`
  (`src/shopping/domain/itemCategory.ts:185`). Der Import von `ItemCategoryCatalog`
  und `findItemCategory` aus `./itemCategory` erzeugt keinen Zyklus, denn
  `itemCategory.ts` importiert nichts aus `knownItem.ts`.
- [x] Test zuerst, dann `uncategorizedRowLabel` in `announcements.ts`: 8 → "Ohne
  Kategorie, 8 Artikel", 1 → "Ohne Kategorie, 1 Artikel".
- [x] `ItemCategoryListPage`: Props `uncategorizedCount: number` und
  `onOpenUncategorized: () => void`. Bei `uncategorizedCount > 0` steht nach der
  Kategorienliste bzw. nach "Noch keine Kategorien." eine zweite `ul.itemList` mit
  einer `li.mealRow` und dem Knopf `mealNameButton` mit
  `uncategorizedRowLabel(uncategorizedCount)`.
- [x] `src/shopping/ui/UncategorizedKnownItemsPage.tsx` anlegen: Props `knownItems`
  und `onBack`. Inhalt: `main.page`, Knopf "Zurück zu den Artikelkategorien",
  `h1` "Ohne Kategorie" mit `useHeadingFocus` und `tabIndex={-1}`, dann
  `<AssignedKnownItems knownItems={knownItems} emptyText="Alle Artikel haben eine
  Kategorie." />`.
- [x] `ItemCategoriesArea`: Seitenzustand `{ kind: 'uncategorized' }`. Berechnet
  `knownItemsWithoutCategory(knownItems, catalog)` einmal, übergibt die Anzahl an die
  Liste und die Artikel an die neue Seite. Zurück führt über `showList`.
- [x] Neue UI-Tests in `ItemCategoriesArea.test.tsx`:
  - die Liste zeigt "Ohne Kategorie, 2 Artikel" bei einem Artikel mit `null` und
    einem mit verwaister ID, die Kategoriezeilen bleiben unverändert
  - ohne Kategorien, aber mit Artikeln: "Noch keine Kategorien." und darunter "Ohne
    Kategorie, N Artikel"
  - haben alle Artikel eine gültige Kategorie, fehlt die Zeile
  - Tipp öffnet `h1` "Ohne Kategorie" mit Fokus, `h2` "Artikel, 2" und den Namen
    alphabetisch, "Zurück zu den Artikelkategorien" führt zur Liste
  - `rerender` mit lauter kategorisierten Artikeln bei offener Seite: Die Seite bleibt
    offen und zeigt "Artikel, keine" und "Alle Artikel haben eine Kategorie."
  - axe ohne Befund auf der Liste mit Zeile "Ohne Kategorie" und auf der Seite "Ohne
    Kategorie"

**Automatisierte Verifikation**:
- [x] `npm run test` läuft grün
- [x] `npm run lint` läuft durch
- [x] `npm run build` läuft durch

**Manuelle Verifikation**:
- [x] Auf dem iPhone mit VoiceOver: In "Artikelkategorien" folgt nach der letzten
  Kategorie die Zeile "Ohne Kategorie, N Artikel". Ein Doppeltipp öffnet die Seite,
  VoiceOver landet auf "Ohne Kategorie", und die Artikel lassen sich einzeln
  durchwischen.

## Notizen zur Umsetzung

## Verweise

- Vorgänger und Datenmodell: `docs/agents/plans/2026-10-30-artikel-nach-kategorien-sortieren.md` (MZP-046)
- `src/shopping/ui/ItemCategoriesArea.tsx`, `ItemCategoryFormPage.tsx`, `ItemCategoryListPage.tsx`
- `src/shopping/domain/knownItem.ts` (`assignedCounts`, `knownItemsByName`)
- `src/SignedInApp.tsx:275`
