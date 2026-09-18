---
date: 2026-09-18T09:18:20.939867+00:00
git_commit: e9411e748f696a3aaa5818423916b2748b63351f
branch: main
story: MZP-007
topic: "Artikelverwaltung und Einstellungen"
tags: [plan, shopping, shared, ui, accessibility]
status: ready
---

# PLAN: MZP-007 — Artikelverwaltung und Einstellungen

Die Navigationsleiste bekommt rechts einen schmalen Zahnrad-Knopf. Dahinter liegt eine
Einstellungen-Seite mit vorerst einem Eintrag: der Artikelverwaltung. Dort steht der
Artikelkatalog (`knownItems`) alphabetisch als Liste im Design der Gerichte-Liste. Jeder
Eintrag lässt sich löschen und umbenennen — aus "hackfleisch" wird "Hackfleisch", und
diese Schreibweise setzt sich ab dann auch auf der Einkaufsliste durch.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-18. Die beiden TODO-Punkte
"Einstellungen" und "Vorschläge verwalten" aus `docs/notes.txt` werden damit erledigt.

## Akzeptanzkriterien

- [ ] In der Navigationsleiste steht rechts ein schmaler Knopf mit Zahnrad-Icon ohne
      sichtbaren Text. VoiceOver liest ihn als "Einstellungen"; ist er aktiv, trägt er
      `aria-current="page"` wie die anderen Bereiche.
- [ ] Die Einstellungen-Seite trägt die Navigationsleiste und zeigt genau einen Eintrag
      "Artikelverwaltung".
- [ ] Die Artikelverwaltung zeigt alle Katalogeinträge alphabetisch (`de-DE`), je Zeile
      einen vollbreiten Namens-Knopf und rechts einen Mülleimer-Knopf — im Design der
      Gerichte-Liste. Die Überschrift nennt die Anzahl.
- [ ] Der Mülleimer führt auf eine Bestätigungsseite mit "Löschen" und "Abbrechen".
      Nach dem Löschen: zurück zur Liste, Ansage "<Name> gelöscht, noch N Vorschläge."
- [ ] Ein Klick auf den Namen öffnet eine Seite mit Namensfeld und "Speichern" in der
      unteren Knopfleiste. Speichern führt zurück zur Liste, Ansage
      "<Name> gespeichert."
- [ ] Ein leerer Name meldet "Bitte einen Namen eingeben.", über 100 Zeichen "Der Name
      ist zu lang." — dieselben Texte wie im Artikel-Formular.
- [ ] Wird auf einen Namen umbenannt, den es bereits gibt, entsteht **ein** Eintrag: die
      Verwendungen werden addiert, das jüngere `lastUsedAt` gewinnt, der alte Eintrag
      verschwindet.
- [ ] Nach einer Korrektur der Schreibweise landet der gepflegte Name auf der
      Einkaufsliste, auch wenn abweichend getippt und kein Vorschlag angeklickt wurde.
- [ ] Alle neuen Seiten sind ohne axe-Befund.
- [ ] Die bestehenden Abläufe für Einkaufsliste und Gerichte bleiben unverändert; die
      E2E-Tests laufen ohne Anpassung grün.

### Bewusste Grenzen

Diese drei Punkte sind besprochen und werden **nicht** gelöst:

- Ein Name, der als Item in einem Gericht steht, wird über `withNamesInUse`
  (`src/shopping/domain/knownItem.ts:54-69`) weiter vorgeschlagen, auch wenn der
  Katalogeintrag gelöscht wurde. Korrigiert wird er im Gericht.
- Das Umbenennen fasst die Einkaufsliste nicht an. Ein Artikel, der schon offen auf der
  Liste steht, behält seine Schreibweise; erst der nächste Zugang wird kanonisiert.
- `useKnownItems` startet mit einer leeren Liste, bis der erste Firestore-Snapshot da
  ist (`src/shopping/ui/useKnownItems.ts:6`). Ein Artikel, der in dieser Zeitspanne
  hinzugefügt wird, wird nicht kanonisiert — er behält die getippte Schreibweise, und
  `recordUse` schreibt sie in den Katalog. Das ist dasselbe Fenster, das heute schon
  ohne Vorschläge auskommt.

## Wesentliche Entscheidungen und Abwägungen

1. **Einstellungen sind ein Bereich, kein Sonderknopf.** Dritter Eintrag in `AREAS`,
   `Area` bekommt ein optionales Icon, der Eintrag teilt sich die Breite nicht.
   - Warum: Eine Liste, ein Muster — VoiceOver liest "Einstellungen, Taste, aktuelle
     Seite" genau wie bei den anderen Bereichen. Der in `docs/notes.txt` geplante
     Wochenplaner passt später ohne Umbau daneben.
   - Auswirkung: `NavigationBar.tsx` und `.navigationBar` in `index.css` werden
     erweitert, nicht umgebaut.

2. **Die Artikelverwaltung gehört fachlich zu `shopping`, die Einstellungsseite zu
   `shared`.** `KnownItemsArea.tsx` in `src/shopping/ui`, generische `SettingsPage.tsx`
   in `src/shared/ui`, verdrahtet in `SignedInApp.tsx`.
   - Warum: Die ESLint-Grenzen verbieten `shared` → `shopping`
     (`eslint.config.js:23-29` und `eslint.config.js:40-53`). Die Einstellungsseite
     kennt ihre Einträge deshalb nur als Daten, genau wie `NavigationBar` ihre Bereiche.
     `src/SignedInApp.tsx` fällt unter keines der Globs und darf beides verdrahten.
   - Auswirkung: `SignedInApp` hält zusätzlich die offene Einstellungs-Unterseite.

3. **`TrashIcon` und `SaveIcon` ziehen nach `src/shared/ui`.**
   - Warum: `shopping` darf `meals` nicht importieren (`eslint.config.js:43`), beide
     Icons werden jetzt in beiden Kontexten gebraucht. Die Dateien haben keine eigenen
     Importe, der Umzug ist ein reines Verschieben.
   - Auswirkung: Importe in `MealPage.tsx`, `MealItemsEditor.tsx` und `MealFormPage.tsx`
     werden angepasst. `EditIcon` und `AddToShoppingListIcon` bleiben in `meals/ui`.
     Der Architekturtest bekommt einen Fall für die bisher ungeprüfte Richtung
     `shopping/ui` → `meals/ui`.

4. **`useKnownItems` liefert wie `useMeals` ein Objekt mit Daten und Operationen.**
   `KnownItems = { knownItems, removeKnownItem, renameKnownItem }`.
   - Warum: `MealsArea` bekommt `Meals` und nicht den Client
     (`src/meals/ui/useMeals.ts:5-10`, `src/meals/ui/MealsArea.tsx:20`). Die
     Artikelverwaltung braucht Schreibzugang und soll demselben Muster folgen, statt den
     Client durch die Oberfläche zu reichen.
   - Auswirkung: Die beiden Aufrufstellen `src/SignedInApp.tsx:53` und
     `src/shopping/ui/ShoppingArea.test.tsx:50` greifen künftig auf
     `knownItems.knownItems` zu. Das Objekt entsteht in Phase 1, die Operationen kommen
     in Phase 2 und 3 dazu.

5. **Umbenennen ist eine Rechnung in der Domäne, das Schreiben ist atomar und
   additiv.** `planKnownItemRename(knownItems, from, newName)` liefert den lokalen
   Zielzustand, den zu löschenden Namen und die mitgebrachten Verwendungen; der
   Firestore-Adapter schreibt sie in einem `writeBatch` mit `increment`.
   - Warum: Das Zusammenführen ist Fachlogik und ohne Firestore test-getrieben prüfbar.
     `increment(addedUses)` statt einer absoluten Zahl verhindert, dass eine Verwendung
     verlorengeht, die das andere Gerät zwischen Snapshot und Commit gezählt hat — genau
     der Grund, aus dem `recordUse` es schon so macht
     (`src/shopping/api/firestoreKnownItemsClient.ts:99-105`). Bei reiner Korrektur der
     Schreibweise ist `addedUses` gleich `0`, der Zähler bleibt also unberührt. Ohne
     Batch könnte bei Verbindungsverlust eine Dublette oder ein Verlust stehenbleiben.
   - Auswirkung: `KnownItemsClient` bekommt `removeKnownItem` und `renameKnownItem`.
     `lastUsedAt` wird dabei absolut geschrieben; ein gleichzeitiges `recordUse` auf dem
     anderen Gerät kann es um seinen Wert zurücksetzen. Das wirkt sich nur auf die
     Rangfolge der Vorschläge aus und wird hingenommen.

6. **Der Katalogname gewinnt beim Hinzufügen.** `canonicalName(knownItems, typed)` in
   `knownItem.ts`, angewandt in `useShoppingList` vor `planAddition`.
   - Warum: Ohne diesen Schritt ist die Artikelverwaltung ein Sieb (siehe Ausgangslage,
     Befund 1). Eine Stelle deckt Artikel-Formular **und** Gericht-Übertrag ab.
   - Auswirkung: `useShoppingList` bekommt die `knownItems` als Parameter. Beide
     Aufrufstellen (`src/SignedInApp.tsx:54`, `src/shopping/ui/ShoppingArea.test.tsx:51`)
     werden angepasst, und ein bestehender Testfall ändert sein erwartetes Ergebnis.

7. **Die Namensregel wird geteilt, nicht verdoppelt.** `readName` aus
   `shoppingItem.ts:36-43` wird als `createItemName` exportiert und vom Katalog
   mitbenutzt.
   - Warum: Gleiche Grenze, gleiche Meldungen, eine Quelle. Eine eigene
     Katalog-Validierung wäre ein Wrapper ohne Inhalt.
   - Auswirkung: Die Fehlermeldungen kommen über `additionFailureMessage` wie im
     Artikel-Formular.

8. **Keine Änderung an `firestore.rules`, aber ein Beleg dafür.**
   - Warum: `allow read, write` auf `knownItems` schließt `delete` ein
     (`firestore.rules:17-19`). Belegt ist das bisher nicht: `firestore.rules.test.ts`
     prüft nur `setDoc` und `getDoc` (Zeilen 106-122).
   - Auswirkung: Ein Regeltest für das Löschen kommt dazu. Er läuft über
     `npm run test:rules`, nicht über `npm run test` (`vitest.rules.config.ts`). Der
     TODO-Punkt zum fehlenden Rules-Deployment in `docs/notes.txt` bleibt unberührt,
     weil sich die Regeln nicht ändern.

9. **Die Liste zeigt nur den Katalog, nicht die Gericht-Item-Namen.**
   - Warum: Nur Katalogeinträge lassen sich löschen und umbenennen. Zeilen ohne
     Mülleimer wären beim Wischen mit VoiceOver eine Falle.
   - Auswirkung: Siehe *Bewusste Grenzen*; die Bestätigungsseite sagt deshalb dazu, dass
     ein Name bei erneuter Verwendung wieder entsteht.

## Ausgangslage

Woher die Vorschläge kommen (`src/SignedInApp.tsx:67-72`):

```
   Firestore: knownItems/<id>                 Gerichte (meals)
   { name, lastUsedAt, timesUsed }            item.name je Gericht-Item
            |                                          |
   useKnownItems ------------------> withNamesInUse <---+
                                            |
                                      suggestNames(typed)
                                            |
                              NameSuggestions in AddItemPage
                                      und MealItemsEditor
```

Die Navigationsleiste heute — zwei gleich breite Text-Knöpfe, gespeist aus `AREAS`
(`src/SignedInApp.tsx:17-20`), gerendert in `src/shared/ui/NavigationBar.tsx`:

```
┌──────────────────────────────────┐
│ [ Einkaufsliste ] [  Gerichte  ] │  nav aria-label "Bereiche"
└──────────────────────────────────┘
   li { flex: 1 } je Bereich, aria-current="page" auf dem aktiven Knopf
```

Drei Befunde aus dem Code, die das Vorhaben berühren:

**Befund 1 — die Korrektur hält heute nicht.** `recordUse` schreibt bei *jeder*
Verwendung den getippten Namen in den Katalog (`useShoppingList.ts:105-107` →
`firestoreKnownItemsClient.ts:99-105`). `suggestNames` blendet zudem den exakten Treffer
aus (`knownItem.ts:93`), man bekommt beim vollständigen Ausschreiben also gar keinen
Vorschlag zum Anklicken:

```
Katalog nach der Korrektur:  "Hackfleisch"
du tippst "hackfleisch" + Speichern
  → kein Vorschlag (exakter Treffer ausgeblendet)
  → recordUse("hackfleisch")
  → Katalog: "hackfleisch"          Korrektur verloren
```

**Befund 2 — Gelöschtes kann zurückkommen.** `withNamesInUse` (`knownItem.ts:54-69`)
mischt alle Gericht-Item-Namen in die Vorschläge. Ein Name, der aus einem Gericht
stammt, erscheint nach dem Löschen im Katalog sofort wieder.

**Befund 3 — die Dokument-ID ist der normalisierte Name** (`knownItem.ts:8-13`,
`normalizeItemName` = trimmen, Leerzeichen vereinheitlichen, kleinschreiben):

```
"hackfleisch" → "Hackfleisch"     ID bleibt hackfleisch  → reines Feld-Update
"Hackfleish"  → "Hackfleisch"     ID wechselt            → Neuanlage + Löschen,
                                                            Ziel kann belegt sein
```

Vorbilder im Code:

| wofür | Datei | was davon |
|---|---|---|
| Listenseite | `src/meals/ui/MealListPage.tsx` | `.pageHeader`, `useHeadingFocus`, `ul.itemList`, leerer Zustand |
| Listenzeile | `src/meals/ui/MealListRow.tsx` | `.mealRow` mit `.mealNameButton` und `.iconButton` |
| Formularseite | `src/meals/ui/MealFormPage.tsx` | Anfangsfokus, `p.failure`, `aria-describedby`, `BottomBar` mit `SaveIcon`, `announce` im Fehlerfall (Zeile 65) |
| Bestätigungsseite | `src/meals/ui/DeleteMealPage.tsx` | `.pageActions` mit "Löschen" und "Abbrechen" |
| Daten und Operationen | `src/meals/ui/useMeals.ts` | Typ `Meals`, `useCallback` je Operation |

Die zugehörigen Stile stehen in `src/index.css`: `.pageHeader` 121-132, `.itemList`
139-149, `.mealRow` 222-229, `.pageActions` 235-240, `.mealNameButton` 242-249,
`.iconButton` 298-306, `.buttonIcon` 307-311. Der Navigationsknopf ist heute über
`.navigationBar button { width: 100% }` (54-58) auf volle Breite gestellt.

## Zielbild

```
 Einstellungen (Bereich)              Artikelverwaltung (Unterseite)
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ [ Einkaufsliste ][ Gerichte ][⚙] │ │ [Zurück zu den Einstellungen]    │
│                                  │ │                                  │
│ Einstellungen                 h1 │ │ Artikelverwaltung, 42         h1 │
│ ──────────────────────────────── │ │ ──────────────────────────────── │
│ [ Artikelverwaltung            ] │ │ [ Butter               ]    [🗑] │
│                                  │ │ [ Hackfleisch          ]    [🗑] │
│                                  │ │ [ hackfleisch          ]    [🗑] │
│                                  │ │ [ Spaghetti            ]    [🗑] │
└──────────────────────────────────┘ └──────────────────────────────────┘
        │                                    │              │
        └──── "Artikelverwaltung" ───────────┘              │
                                                            │
        ┌──── Klick auf den Namen ──────────────────────────┘
        ▼                                     ▼ Klick auf den Mülleimer
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ [Zurück zur Artikelverwaltung]   │ │ [Zurück zur Artikelverwaltung]   │
│                                  │ │                                  │
│ Vorschlag bearbeiten          h1 │ │ hackfleisch löschen?          h1 │
│                                  │ │                                  │
│ Name                             │ │ Der Vorschlag wird für beide     │
│ ┌──────────────────────────────┐ │ │ Geräte entfernt. Wird der Name   │
│ │ hackfleisch                  │ │ │ wieder verwendet, entsteht er    │
│ └──────────────────────────────┘ │ │ neu.                             │
│ <Fehlerzeile>                    │ │                                  │
│ ┌──────────────────────────────┐ │ │ [ Löschen ]    [ Abbrechen ]     │
│ │        💾 Speichern          │ │ │                                  │
│ └──────────────────────────────┘ │ └──────────────────────────────────┘
└──────────────────────────────────┘
```

Das Umbenennen als Rechnung in der Domäne:

```
vorher:  Hackfleish   timesUsed 3,  lastUsedAt Montag
         Hackfleisch  timesUsed 12, lastUsedAt Freitag
             │
   planKnownItemRename(knownItems, "Hackfleish", "Hackfleisch")
             ▼
   { written:     { name: "Hackfleisch", timesUsed: 15, lastUsedAt: Freitag },
     removedName: "Hackfleish",
     addedUses:   3 }
             │
   renameKnownItem  →  ein writeBatch:
                         set(hackfleisch, { name, lastUsedAt,
                                            timesUsed: increment(3) }, merge)
                         delete(hackfleish)
```

Beim reinen Korrigieren der Schreibweise ist `removedName` gleich `null` und `addedUses`
gleich `0` — dieselbe Schreiboperation lässt den Zähler dann in Ruhe.

Der gepflegte Name beim Hinzufügen:

```
getippt "hackfleisch"  ──►  canonicalName(knownItems, "hackfleisch")  ──►  "Hackfleisch"
                                        │
                                        ▼
                          planAddition / recordUse arbeiten
                          ab hier nur noch mit "Hackfleisch"
```

## Abstraktionen und Wiederverwendung

- `src/shared/ui`
  - `NavigationBar.tsx` - `Area` bekommt ein optionales `icon`, der Knopf zeigt dann
    das Icon statt des Textes und trägt `aria-label={area.label}`
  - `SettingsIcon.tsx` - NEU, Zahnrad im Stil von `TrashIcon` (24er viewBox, `stroke`
    `currentColor`, Strichstärke 2, `aria-hidden`, `focusable="false"`, `.buttonIcon`)
  - `SettingsPage.tsx` - NEU, generische Eintragsliste, kennt `shopping` nicht
  - `TrashIcon.tsx` - VERSCHOBEN aus `src/meals/ui`, inhaltlich unverändert
  - `SaveIcon.tsx` - VERSCHOBEN aus `src/meals/ui`, inhaltlich unverändert
- `src/shopping/domain`
  - `shoppingItem.ts`
    - `createItemName` - `readName` wird exportiert und umbenannt
  - `knownItem.ts`
    - `knownItemsByName` - NEU, alphabetisch nach `localeCompare(…, 'de-DE')`
    - `planKnownItemRename` - NEU, liefert `KnownItemRename`
    - `applyRename` - NEU, führt einen `KnownItemRename` auf einer Liste aus
    - `canonicalName` - NEU, gepflegte Schreibweise zu einem getippten Namen
  - `announcements.ts`
    - `knownItemsHeading`, `knownItemDeletedAnnouncement`,
      `knownItemSavedAnnouncement` - NEU, Muster von `mealsHeading` und
      `mealDeletedAnnouncement`
- `src/shopping/api`
  - `knownItemsClient.ts` - `removeKnownItem` und `renameKnownItem` ergänzen
  - `firestoreKnownItemsClient.ts` - `deleteDoc` und `writeBatch` mit `increment`
  - `inMemoryKnownItemsClient.ts` - dieselben Operationen über `applyRename`
- `src/shopping/ui`
  - `useKnownItems.ts` - liefert `KnownItems` statt eines nackten Arrays
  - `KnownItemsArea.tsx` - NEU, hält die Seitenauswahl wie `MealsArea`
  - `KnownItemListPage.tsx` - NEU, Liste im Design der Gerichte-Liste
  - `KnownItemListRow.tsx` - NEU, Muster von `MealListRow`
  - `KnownItemFormPage.tsx` - NEU, Muster von `MealFormPage`
  - `DeleteKnownItemPage.tsx` - NEU, Muster von `DeleteMealPage`
  - `useShoppingList.ts` - nimmt `knownItems` entgegen und kanonisiert
- `src/meals/ui`
  - `MealPage.tsx`, `MealItemsEditor.tsx`, `MealFormPage.tsx` - nur Importpfade
- `src/SignedInApp.tsx` - dritter Bereich, Einstellungs-Unterseite, Verdrahtung
- `src/index.css` - `.navigationBarIcon` für den Zahnrad-Knopf
- `test/domainLayerBoundary.test.ts` - Fall für `shopping/ui` → `meals/ui`
- `firestore.rules.test.ts` - Fall für das Löschen eines Katalogeintrags

Neue Komponente, keine neue Abhängigkeit: Das Zahnrad wird wie die übrigen Icons als
eigenes SVG geschrieben (Stilvorlage Lucide `settings`).

## Umsetzung

### Phase 1: Einstellungen-Bereich mit Zahnrad und der Katalog als Liste

Abhängigkeiten: keine

Der Zahnrad-Knopf erscheint, die Einstellungen-Seite zeigt "Artikelverwaltung", und
dahinter steht der Katalog alphabetisch als Liste. Noch ohne Löschen und Bearbeiten.

**Aufgaben**:

- [ ] Test zuerst: `src/shopping/domain/knownItem.test.ts` um `knownItemsByName`
      ergänzen — sortiert alphabetisch nach `de-DE`, Groß- und Kleinschreibung desselben
      Namens stehen beieinander, die Eingabe wird nicht verändert.
- [ ] Test zuerst: `src/shopping/domain/announcements.test.ts` um `knownItemsHeading`
      ergänzen — `0` ergibt "Artikelverwaltung, keine", sonst "Artikelverwaltung, <n>".
- [ ] `src/shopping/domain/knownItem.ts`: `knownItemsByName` ergänzen.
      ```ts
      export function knownItemsByName(
        knownItems: readonly KnownItem[],
      ): readonly KnownItem[] {
        return [...knownItems].sort((one, other) =>
          one.name.localeCompare(other.name, 'de-DE'),
        )
      }
      ```
- [ ] `src/shopping/domain/announcements.ts`: `knownItemsHeading` ergänzen.
- [ ] `src/shared/ui/TrashIcon.tsx` und `src/shared/ui/SaveIcon.tsx` anlegen, indem die
      Dateien aus `src/meals/ui` dorthin verschoben werden (Inhalt unverändert). Die
      Importe in `MealPage.tsx:8`, `MealItemsEditor.tsx:16` und `MealFormPage.tsx:13`
      auf `../../shared/ui/…` umstellen.
- [ ] `test/domainLayerBoundary.test.ts`: Fall `rejects an import of meals inside the
      user interface of shopping` ergänzen — Muster der bestehenden Fälle in Zeile
      126-133. Diese Richtung ist bisher ungeprüft und trägt den Umzug der Icons.
- [ ] `src/shared/ui/SettingsIcon.tsx` anlegen: Zahnrad im Stil der übrigen Icons, zum
      Beispiel ein Kreis `M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z` und der Zahnkranz als
      `path` (Lucide `settings`).
- [ ] `src/shared/ui/NavigationBar.tsx`: `Area` bekommt `icon?: ReactNode`. Trägt ein
      Bereich ein Icon, zeigt der Knopf das Icon, trägt `aria-label={area.label}` und
      sein `li` die Klasse `navigationBarIcon`.
      ```tsx
      <li key={area.id} className={area.icon ? 'navigationBarIcon' : undefined}>
        <button
          type="button"
          aria-current={area.id === activeArea ? 'page' : undefined}
          aria-label={area.icon ? area.label : undefined}
          onClick={() => onSelectArea(area.id)}
        >
          {area.icon ?? area.label}
        </button>
      </li>
      ```
- [ ] `src/index.css`: Regel für den Icon-Eintrag ergänzen. `.navigationBar button` setzt
      `width: 100%` (Zeile 54-58), das muss ausdrücklich zurückgenommen werden, sonst
      wird der Knopf nicht schmal.
      ```css
      .navigationBar li.navigationBarIcon {
        flex: none;
      }

      .navigationBar li.navigationBarIcon button {
        width: auto;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      ```
- [ ] `src/shared/ui/SettingsPage.tsx` anlegen: generische Eintragsliste, kennt nur
      `id` und `label`.
      ```tsx
      type SettingsEntry = { id: string; label: string }

      type SettingsPageProps = {
        navigation: ReactNode
        entries: readonly SettingsEntry[]
        onOpenEntry: (id: string) => void
      }
      ```
      Aufbau wie `MealListPage`: `{navigation}`, `main.page.pageBelowNavigation`,
      `h1` mit `useHeadingFocus` und Text "Einstellungen", darunter eine `ul.itemList`
      mit je einem vollbreiten Knopf (`.mealNameButton`-Aussehen) je Eintrag.
- [ ] `src/shopping/ui/useKnownItems.ts`: Rückgabe auf den Typ `KnownItems` umstellen.
      Die Operationen kommen in Phase 2 und 3 dazu.
      ```ts
      export type KnownItems = {
        knownItems: readonly KnownItem[]
      }
      ```
- [ ] `src/SignedInApp.tsx:53` und `src/shopping/ui/ShoppingArea.test.tsx:50`: auf
      `knownItems.knownItems` umstellen. In `SignedInApp` betrifft das `suggestKnownNames`
      (Zeile 67-72).
- [ ] `src/shopping/ui/KnownItemListRow.tsx` anlegen: Muster von `MealListRow`, Zeile
      `.mealRow` mit `.mealNameButton` für den Namen und `.iconButton` mit `TrashIcon`,
      `aria-label={`Löschen, ${knownItem.name}`}`. Der Namens-Knopf ruft in dieser Phase
      schon `onOpenKnownItem`, die Zielseite kommt in Phase 3.
- [ ] `src/shopping/ui/KnownItemListPage.tsx` anlegen: Zurück-Knopf "Zurück zu den
      Einstellungen", `h1` mit `knownItemsHeading` und `useHeadingFocus`, bei leerem
      Katalog "Noch keine Vorschläge.", sonst `ul.itemList` über
      `knownItemsByName(knownItems)`.
- [ ] `src/shopping/ui/KnownItemsArea.tsx` anlegen: hält die Seitenauswahl wie
      `MealsArea`, in dieser Phase nur `{ kind: 'list' }`.
      ```tsx
      type KnownItemsPage =
        | { kind: 'list' }
        | { kind: 'form'; name: string }
        | { kind: 'delete'; name: string }
      ```
      Der adressierte Eintrag wird über `normalizeItemName` in `knownItems` gesucht.
      Wird er nicht mehr gefunden — der andere Haushalt hat ihn gelöscht, während die
      Seite offen war —, zeigt die Area die Liste. Das gilt für `form` und `delete`
      gleichermaßen, analog `MealsArea.tsx:36-39` und den dortigen Bedingungen.
- [ ] `src/SignedInApp.tsx`: `AREAS` um
      `{ id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> }` ergänzen,
      einen Zustand für die offene Einstellungs-Unterseite halten und den Bereich
      rendern.
      ```tsx
      if (activeArea === 'settings')
        return settingsEntry === 'knownItems' ? (
          <KnownItemsArea
            knownItems={knownItems}
            announce={announce}
            onBack={() => setSettingsEntry(null)}
          />
        ) : (
          <SettingsPage
            navigation={navigation}
            entries={SETTINGS_ENTRIES}
            onOpenEntry={setSettingsEntry}
          />
        )
      ```

**Automatisierte Verifikation**:

- [ ] Die neuen Fälle zu `knownItemsByName` und `knownItemsHeading` schlagen vor der
      Umsetzung fehl und laufen danach grün.
- [ ] Der neue Fall in `test/domainLayerBoundary.test.ts` schlägt fehl, solange
      `TrashIcon` noch in `src/meals/ui` liegt und aus `shopping` importiert wird.
- [ ] Neu in `src/SignedInApp.test.tsx`: `reaches the settings through the gear button`
      — der Knopf "Einstellungen" hat leeres `textContent`, nach dem Drücken trägt er
      `aria-current="page"` und die Überschrift "Einstellungen" ist da.
- [ ] Neu in `src/shopping/ui/KnownItemsArea.test.tsx` (mit
      `createInMemoryKnownItemsClient` als Fake): `lists the known items in alphabetical
      order` — prüft die Reihenfolge der Namen **und** dass jede Zeile einen Knopf
      "Löschen, <Name>" trägt (Muster `MealsArea.test.tsx:128-132`).
- [ ] Neu in `src/shopping/ui/KnownItemsArea.test.tsx`: `shows an empty catalog` — bei
      leerem Katalog steht "Noch keine Vorschläge." und die Überschrift lautet
      "Artikelverwaltung, keine".
- [ ] Neu in `src/SignedInApp.test.tsx`: `has no accessibility violations on the
      settings`; neu in `KnownItemsArea.test.tsx`: `has no accessibility violations on
      the known items`.
- [ ] Die bestehenden Fälle in `SignedInApp.test.tsx` zum Wechsel zwischen
      Einkaufsliste und Gerichte laufen unverändert grün.
- [ ] Die bestehenden Fälle in `ShoppingArea.test.tsx` laufen nach der Umstellung auf
      `knownItems.knownItems` unverändert grün.
- [ ] `npm run test`, `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Das Zahnrad steht rechts in der Leiste, ist gut zu treffen und schiebt
      "Einkaufsliste" und "Gerichte" nicht zusammen.
- [ ] Mit VoiceOver: Der Knopf wird als "Einstellungen, Taste" gelesen, im aktiven
      Zustand zusätzlich als aktuelle Seite.

### Phase 2: Vorschlag löschen

Abhängigkeiten: Phase 1

Der Mülleimer führt auf eine Bestätigungsseite; nach dem Löschen steht der Eintrag nicht
mehr im Katalog und wird nicht mehr vorgeschlagen.

**Aufgaben**:

- [ ] Test zuerst: `src/shopping/domain/announcements.test.ts` um
      `knownItemDeletedAnnouncement` ergänzen — "<Name> gelöscht, keine Vorschläge
      mehr." / "… noch 1 Vorschlag." / "… noch 5 Vorschläge." (Muster
      `mealDeletedAnnouncement`).
- [ ] `src/shopping/domain/announcements.ts`: `knownItemDeletedAnnouncement` ergänzen.
- [ ] `src/shopping/api/knownItemsClient.ts`: `removeKnownItem(name: string): void`
      ergänzen.
- [ ] `src/shopping/api/inMemoryKnownItemsClient.ts`: `removeKnownItem` filtert über
      `normalizeItemName` und veröffentlicht.
- [ ] `src/shopping/api/firestoreKnownItemsClient.ts`: `removeKnownItem` ruft
      `deleteDoc(knownItemDocument(name)).catch(ignoreFailure)` — dieselbe
      Fehlerbehandlung wie `recordUse`.
- [ ] `src/shopping/ui/useKnownItems.ts`: `removeKnownItem` als `useCallback` in
      `KnownItems` aufnehmen (Muster `useMeals.ts:17-27`).
- [ ] `src/shopping/ui/DeleteKnownItemPage.tsx` anlegen: Muster von `DeleteMealPage`,
      Zurück-Knopf "Zurück zur Artikelverwaltung", `h1` "<Name> löschen?", Text "Der
      Vorschlag wird für beide Geräte entfernt. Wird der Name wieder verwendet, entsteht
      er neu.", `.pageActions` mit "Löschen" und "Abbrechen".
- [ ] `src/shopping/ui/KnownItemsArea.tsx`: Seite `{ kind: 'delete' }` bedienen, nach
      dem Löschen zurück zur Liste und `knownItemDeletedAnnouncement` ansagen.
- [ ] `firestore.rules.test.ts`: Fall `lets the household delete a known item` ergänzen
      (Muster der Fälle in Zeile 106-122, mit `deleteDoc`).

**Automatisierte Verifikation**:

- [ ] Der neue Fall zu `knownItemDeletedAnnouncement` schlägt vor der Umsetzung fehl und
      läuft danach grün.
- [ ] Neue Fälle in `src/shopping/ui/KnownItemsArea.test.tsx`:
      - `asks before deleting a known item` — der Mülleimer öffnet die Bestätigung, der
        Eintrag ist noch in `storedKnownItems()`.
      - `keeps the known item when the deletion is cancelled` — "Abbrechen" führt
        zurück zur Liste, `storedKnownItems()` ist unverändert.
      - `deletes the known item after the confirmation` — nach "Löschen" fehlt der Name
        in `storedKnownItems()`, die Liste ist wieder da, die Ansage stimmt.
      - `returns to the list when the known item disappears` — über
        `knownItemsArriveFromElsewhere` einen Katalog ohne den geöffneten Eintrag
        schicken, während die Bestätigung offen ist; die Liste erscheint.
      - `has no accessibility violations on the deletion page`.
- [ ] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [ ] `npm run test:rules` läuft durch und enthält den neuen Lösch-Fall.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Ein gelöschter Vorschlag verschwindet auf beiden Geräten aus der Liste und wird
      beim Tippen nicht mehr vorgeschlagen.

### Phase 3: Vorschlag umbenennen

Abhängigkeiten: Phase 2

Ein Klick auf den Namen öffnet die Bearbeiten-Seite. Speichern schreibt den neuen Namen;
trifft er einen vorhandenen Eintrag, werden beide zu einem zusammengeführt.

**Aufgaben**:

- [ ] Test zuerst: `src/shopping/domain/knownItem.test.ts` um `planKnownItemRename`
      ergänzen:
      - Nur die Schreibweise geändert: `written.name` ist der neue Name, `timesUsed` und
        `lastUsedAt` bleiben, `removedName` ist `null`, `addedUses` ist `0`.
      - Auf einen freien Namen umbenannt: `removedName` ist der alte Name, die Zähler
        wandern mit, `addedUses` ist `timesUsed` des alten Eintrags.
      - Auf einen belegten Namen umbenannt: `written.timesUsed` ist die Summe,
        `written.lastUsedAt` das Maximum, `removedName` ist der alte Name, `addedUses`
        ist `timesUsed` des alten Eintrags.
      - Unveränderter Name: `written` entspricht dem Eintrag, `removedName` ist `null`.
      - Der alte Name steht nicht mehr im Katalog: liefert `null`, damit die Oberfläche
        zur Liste zurückkehren kann, statt einen Eintrag aus dem Nichts zu schreiben.
- [ ] Test zuerst: `applyRename` prüfen — führt einen `KnownItemRename` auf einer Liste
      aus, sodass genau ein Eintrag mit dem neuen Namen übrig bleibt.
- [ ] Test zuerst: `src/shopping/domain/announcements.test.ts` um
      `knownItemSavedAnnouncement` ergänzen — "<Name> gespeichert.".
- [ ] `src/shopping/domain/shoppingItem.ts`: `readName` als `createItemName`
      exportieren; der Aufruf in `createShoppingItem` (Zeile 46-52) nutzt den neuen
      Namen. Die bestehenden Fälle in `shoppingItem.test.ts` bleiben unverändert
      gültig, weil sie über `createShoppingItem` prüfen.
- [ ] `src/shopping/domain/knownItem.ts`: `planKnownItemRename` und `applyRename`
      ergänzen. Der Name wird mit `createItemName` validiert.
      ```ts
      export type KnownItemRename = {
        written: KnownItem
        removedName: string | null
        addedUses: number
      }
      ```
      `removedName` ist `null`, wenn `knownItemIdOf(from) === knownItemIdOf(newName)`;
      `addedUses` ist dann `0`.
- [ ] `src/shopping/domain/announcements.ts`: `knownItemSavedAnnouncement` ergänzen.
- [ ] `src/shopping/api/knownItemsClient.ts`: `renameKnownItem(rename: KnownItemRename):
      void` ergänzen.
- [ ] `src/shopping/api/inMemoryKnownItemsClient.ts`: `renameKnownItem` setzt
      `knownItems = applyRename(knownItems, rename)` und veröffentlicht.
- [ ] `src/shopping/api/firestoreKnownItemsClient.ts`: `renameKnownItem` schreibt in
      einem `writeBatch` und zählt additiv.
      ```ts
      renameKnownItem({ written, removedName, addedUses }) {
        const batch = writeBatch(firestore)
        batch.set(
          knownItemDocument(written.name),
          {
            name: written.name,
            lastUsedAt: written.lastUsedAt,
            timesUsed: increment(addedUses),
          },
          { merge: true },
        )
        if (removedName !== null)
          batch.delete(knownItemDocument(removedName))
        batch.commit().catch(ignoreFailure)
      }
      ```
- [ ] `src/shopping/ui/useKnownItems.ts`: `renameKnownItem` als `useCallback` in
      `KnownItems` aufnehmen.
- [ ] `src/shopping/ui/KnownItemFormPage.tsx` anlegen: Muster von `MealFormPage` —
      Zurück-Knopf "Zurück zur Artikelverwaltung", `h1` "Vorschlag bearbeiten",
      Namensfeld mit Anfangsfokus und dem bisherigen Namen, `p.failure` mit fester `id`,
      `BottomBar` mit `SaveIcon` und "Speichern", `aria-describedby` auf dem Knopf. Im
      Fehlerfall wird die Meldung über `additionFailureMessage` gesetzt **und**
      `announce` gerufen, wie in `MealFormPage.tsx:58-68`.
- [ ] `src/shopping/ui/KnownItemsArea.tsx`: Seite `{ kind: 'form' }` bedienen, beim
      Speichern `planKnownItemRename` rechnen, `renameKnownItem` aufrufen, zurück zur
      Liste und `knownItemSavedAnnouncement` ansagen.

**Automatisierte Verifikation**:

- [ ] Die neuen Fälle zu `planKnownItemRename`, `applyRename` und
      `knownItemSavedAnnouncement` schlagen vor der Umsetzung fehl und laufen danach
      grün.
- [ ] Neue Fälle in `src/shopping/ui/KnownItemsArea.test.tsx`:
      - `corrects the spelling of a known item` — "hackfleisch" öffnen, zu
        "Hackfleisch" ändern, speichern; `storedKnownItems()` enthält genau einen
        Eintrag mit dem neuen Namen und unverändertem `timesUsed`, die Ansage stimmt.
      - `merges a known item into an existing one` — aus "Hackfleish" wird
        "Hackfleisch", obwohl es das schon gibt; danach ein Eintrag, `timesUsed` ist die
        Summe, `lastUsedAt` das jüngere Datum.
      - `starts the form with the current name in focus` — das Namensfeld hat den
        bisherigen Namen als Wert und `toHaveFocus()` (Muster
        `SignedInApp.test.tsx:85-97`).
      - `refuses an empty name` — Feld leeren und speichern: Meldung "Bitte einen Namen
        eingeben." steht auf der Seite **und** in den Ansagen, der Katalog ist
        unverändert, die Seite bleibt offen.
      - `refuses a name that is too long` — über 100 Zeichen ergibt "Der Name ist zu
        lang.".
      - `has no accessibility violations on the form`.
- [ ] `npm run test`, `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Eine Korrektur auf einem Gerät steht kurz darauf auch auf dem anderen in der
      Liste.
- [ ] Mit VoiceOver: Der Speichern-Knopf wird als "Speichern, Taste" gelesen, die
      Rückkehr zur Liste ist durch die Ansage nachvollziehbar.

### Phase 4: Der gepflegte Name gewinnt

Abhängigkeiten: Phase 3

Eine korrigierte Schreibweise überlebt das nächste Hinzufügen und setzt sich auf der
Einkaufsliste durch.

**Aufgaben**:

- [ ] Test zuerst: `src/shopping/domain/knownItem.test.ts` um `canonicalName` ergänzen —
      bekannter Name in anderer Schreibweise liefert den gepflegten Namen, unbekannter
      Name liefert den getippten unverändert, ein leerer Katalog liefert den getippten
      Namen.
- [ ] `src/shopping/domain/knownItem.ts`: `canonicalName` ergänzen.
      ```ts
      export function canonicalName(
        knownItems: readonly KnownItem[],
        typed: string,
      ): string {
        return (
          knownItems.find((knownItem) => hasName(knownItem, typed))?.name ?? typed
        )
      }
      ```
- [ ] `src/shopping/ui/useShoppingList.ts`: Parameter `knownItems: readonly KnownItem[]`
      ergänzen und in `addItem` und `addItems` den Namen vor `planAddition`
      kanonisieren. Damit greift es für das Artikel-Formular und für Gerichte, die auf
      die Liste wandern.
- [ ] `src/SignedInApp.tsx:54`: `knownItems.knownItems` an `useShoppingList`
      durchreichen. Die Reihenfolge der Hooks bleibt: `useKnownItems` steht bereits
      davor (Zeile 53).
- [ ] `src/shopping/ui/ShoppingArea.test.tsx:51`: zweite Aufrufstelle anpassen; die
      Testhilfe hat `knownItems` in Zeile 50 bereits zur Hand.
- [ ] `src/shopping/ui/ShoppingArea.test.tsx:331-344`: Der bestehende Fall `counts an
      added item in the catalog, also when it is merged into an open one` erwartet
      heute `{ name: 'milch', timesUsed: 2 }`, obwohl der Katalog "Milch" führt. Genau
      das dreht diese Phase um: erwartet wird künftig `{ name: 'Milch', timesUsed: 2 }`.
      Die Anpassung ist der Beleg für die Änderung, nicht ein Kollateralschaden.

**Automatisierte Verifikation**:

- [ ] Der neue Fall zu `canonicalName` schlägt vor der Umsetzung fehl und läuft danach
      grün.
- [ ] Neu in `src/shopping/ui/ShoppingArea.test.tsx`: `adds a typed item under its
      groomed name` — Katalog enthält "Hackfleisch", "hackfleisch" wird hinzugefügt; die
      Zeile auf der Einkaufsliste heißt "Hackfleisch".
- [ ] Neu in `src/SignedInApp.test.tsx`: `keeps the groomed name when a meal is
      transferred` — ein Gericht mit Item "hackfleisch" wandert auf die Liste und
      erscheint dort als "Hackfleisch".
- [ ] Der angepasste Fall `counts an added item in the catalog, also when it is merged
      into an open one` läuft grün.
- [ ] Die übrigen bestehenden Fälle zum Hinzufügen, Zusammenfassen und Abhaken laufen
      unverändert grün.
- [ ] `npm run test`, `npm run lint` und `npm run build` laufen durch.
- [ ] `npm run test:e2e` läuft durch; `e2e/shoppingList.spec.ts` und `e2e/meals.spec.ts`
      bleiben unverändert. `e2e/keyboard.ts:15` greift auf `main` zu und ist von der
      erweiterten Navigationsleiste nicht betroffen.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Nach einer Korrektur in der Artikelverwaltung landet der Artikel auch dann mit der
      gepflegten Schreibweise auf der Liste, wenn man den Namen anders tippt und keinen
      Vorschlag anklickt.

### Abschluss

Abhängigkeiten: Phase 4

- [ ] `docs/notes.txt`: Die TODO-Punkte "Einstellungen" und "Vorschläge verwalten:
      Tippfehler aus dem Artikelkatalog (knownItems) löschen können, z. B. unter
      Einstellungen." auf `x` setzen und nach DONE verschieben. Der Punkt
      "Später erweitern zu … Wochenplaner …" bleibt offen, ebenso die übrigen Punkte.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `src/meals/ui/MealListPage.tsx`, `src/meals/ui/MealListRow.tsx`: Design-Vorbild für
  die Artikelverwaltung
- `src/meals/ui/MealFormPage.tsx`, `src/meals/ui/DeleteMealPage.tsx`: Vorbild für
  Bearbeiten- und Bestätigungsseite
- `src/meals/ui/useMeals.ts`: Vorbild für `KnownItems`
- `src/shopping/domain/knownItem.ts:8-13`: `knownItemIdOf` — Grund für die
  Fallunterscheidung beim Umbenennen
- `src/shopping/api/firestoreKnownItemsClient.ts:99-105`: `increment` in `recordUse` —
  Vorbild für das additive Zählen beim Umbenennen
- `eslint.config.js:23-29`, `eslint.config.js:40-53`: die Modulgrenzen, die den Umzug
  der Icons nötig machen
- `test/domainLayerBoundary.test.ts:126-133`: Muster für den neuen Grenzfall
- `firestore.rules:17-19`, `firestore.rules.test.ts:106-122`: die Regeln für
  `knownItems` und ihre bisherige Absicherung
- `docs/agents/plans/2026-09-16-artikelvorschlaege-beim-tippen.md`: Entstehung des
  Artikelkatalogs
- `docs/agents/plans/2026-09-17-icon-knoepfe-am-gericht.md`: Muster für Icon-Knöpfe
- Lucide als Stilvorlage für das Zahnrad: https://lucide.dev/icons/settings
