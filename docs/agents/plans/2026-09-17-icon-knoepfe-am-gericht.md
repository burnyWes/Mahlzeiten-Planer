---
date: 2026-09-17T06:02:46.387428+00:00
git_commit: ed17eb8a5a34e78fcb7fd76e3c5120a1a0625a92
branch: main
story: MZP-004
topic: "Icon-Knöpfe am Gericht"
tags: [plan, meals, ui, accessibility]
status: ready
---

# PLAN: MZP-004 — Icon-Knöpfe am Gericht

Die Knöpfe am Gericht zeigen Symbole statt Text. Im Gericht-Editor steht neben jedem
übernommenen Item ein Mülleimer statt "Entfernen". Auf der Gerichtsansicht stehen unten
drei gleich breite Knöpfe nebeneinander: Einkaufswagen statt "Auf die Einkaufsliste",
Stift statt "Bearbeiten", Mülleimer statt "Löschen". Für VoiceOver ändert sich nichts.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-17.

## Akzeptanzkriterien

- [ ] Im Gericht-Editor steht neben jedem übernommenen Item ein quadratischer Knopf
      (mindestens 44 px) mit Mülleimer-Icon statt des Textes "Entfernen".
- [ ] VoiceOver liest diesen Knopf weiter als "Entfernen, <Item>", zum Beispiel
      "Entfernen, Hackfleisch, 500 g".
- [ ] Die Gerichtsansicht zeigt unten **eine** Zeile mit drei gleich breiten Knöpfen
      über die ganze Breite, in dieser Reihenfolge: Einkaufswagen, Stift, Mülleimer.
- [ ] VoiceOver liest diese Knöpfe weiter als "Auf die Einkaufsliste", "Bearbeiten"
      und "Löschen".
- [ ] Keiner der Icon-Knöpfe zeigt sichtbaren Text. Die Icons sind für VoiceOver
      ausgeblendet (`aria-hidden`).
- [ ] Alle Knöpfe bleiben grün gefüllt mit weißem Icon.
- [ ] Die Bestätigungsseite zum Löschen bleibt unverändert: "Löschen" und "Abbrechen"
      als Text.
- [ ] Die axe-Prüfungen des Formulars und der Gerichtsansicht bleiben ohne Befund.

## Wesentliche Entscheidungen und Abwägungen

1. **Die gesprochenen Namen bleiben unverändert und stehen im `aria-label`.**
   - Warum: VoiceOver ist der Hauptbedienweg einer Person im Haushalt. Beim Wagen in der
     Gerichteliste (`MealListRow.tsx`) ist es schon so gelöst.
   - Auswirkung: Bestehende Unit- und E2E-Tests finden die Knöpfe weiter über ihren
     Namen. Neue Tests prüfen, dass kein sichtbarer Text mehr da ist.
2. **Drei gleich breite Knöpfe über die ganze Breite statt kompakter Quadrate.**
   - Warum: Die Tippflächen sind groß und schwer zu verfehlen.
   - Auswirkung: Die Aktionszeile bekommt eine eigene CSS-Klasse, deren Knöpfe sich die
     Breite teilen (`flex: 1`).
3. **Die Mülleimer bleiben grün wie alle anderen Knöpfe, nicht rot.**
   - Warum: Das passt zum übrigen Erscheinungsbild. Ein versehentliches Löschen des
     Gerichts fängt die Bestätigungsseite ab, ein falsch entferntes Item fällt vor dem
     Speichern auf.
   - Auswirkung: Es kommt keine neue Farbe hinzu, die Grundregel für `button` in
     `index.css` gilt weiter.
4. **Die Icons sind eigene SVG-Komponenten im Lucide-Stil, ohne neue Abhängigkeit.**
   - Warum: `AddToShoppingListIcon.tsx` gibt das Muster vor, eine Icon-Bibliothek lohnt
     sich für drei Symbole nicht.
   - Auswirkung: Neu sind `TrashIcon.tsx` und `EditIcon.tsx` in `src/meals/ui`.
5. **Die Bestätigungsseite behält Text.**
   - Warum: Sie wurde nicht angesprochen, und beim endgültigen Löschen ist ein klares
     Wort sicherer.
   - Auswirkung: `DeleteMealPage.tsx` und `.pageActions` bleiben unberührt.

## Ausgangslage

Die Änderung betrifft nur die Oberfläche des Kontexts **meals**. Domäne und
Anwendungsfälle bleiben unberührt.

Gerichtsansicht (`src/meals/ui/MealPage.tsx:62-74`), zwei Zeilen `.pageActions`:

```
┌────────────────────────────────┐
│ [Zurück zu den Gerichten]      │
│ Bolognese                    h1│
│ Einkaufs-Items, 2            h2│
│  Hackfleisch, 500 g            │
│  Spaghetti                     │
│ Rezept                       h2│
│  …                             │
│                                │
│ [ Auf die Einkaufsliste ]      │
│ [ Bearbeiten ]  [ Löschen ]    │
└────────────────────────────────┘
```

Item-Editor (`src/meals/ui/MealItemsEditor.tsx:76-87`), Zeile `.mealItemRow`:

```
│ Einkaufs-Items, 2            h2│
│  Hackfleisch, 500 g [Entfernen]│   aria-label "Entfernen, Hackfleisch, 500 g"
│  Spaghetti          [Entfernen]│   aria-label "Entfernen, Spaghetti"
```

Das Vorbild für Icon-Knöpfe ist der Wagen in `src/meals/ui/MealListRow.tsx:24-31`: Der
Knopf trägt die Klasse `.mealTransferButton` (quadratisch, mindestens 44 px, Icon
zentriert), das SVG trägt `.buttonIcon` (24 px), `aria-hidden="true"` und
`focusable="false"` (`src/index.css:220-233`).

Diese Tests hängen an den gesprochenen Namen und bleiben unverändert gültig:

- `src/meals/ui/MealsArea.test.tsx:105-113` sucht "Bearbeiten" und "Löschen".
- `src/meals/ui/MealsArea.test.tsx:209` sucht "Entfernen, Hackfleisch, 500 g".
- `src/meals/ui/MealsArea.test.tsx:453` sucht "Auf die Einkaufsliste".
- `e2e/meals.spec.ts:33` sucht "Auf die Einkaufsliste".

## Zielbild

Gerichtsansicht:

```
┌────────────────────────────────┐
│ [Zurück zu den Gerichten]      │
│ Bolognese                    h1│
│ Einkaufs-Items, 2            h2│
│  Hackfleisch, 500 g            │
│  Spaghetti                     │
│ Rezept                       h2│
│  …                             │
│                                │
│ [   🛒+   ] [   ✎    ] [   🗑   ] │
└────────────────────────────────┘
   "Auf die     "Bearbeiten" "Löschen"
    Einkaufsliste"
```

Item-Editor:

```
│ Einkaufs-Items, 2            h2│
│  Hackfleisch, 500 g        [🗑]│   aria-label "Entfernen, Hackfleisch, 500 g"
│  Spaghetti                 [🗑]│   aria-label "Entfernen, Spaghetti"
```

Die Bestätigungsseite bleibt unverändert:

```
│ Bolognese löschen?           h1│
│ Das Gericht wird für beide     │
│ Geräte entfernt.               │
│ [ Löschen ]   [ Abbrechen ]    │
```

## Abstraktionen und Wiederverwendung

- `src/meals/ui`
  - `AddToShoppingListIcon.tsx` - unverändert, wird zusätzlich auf `MealPage` genutzt
  - `TrashIcon.tsx` - NEU, Mülleimer im selben SVG-Stil (24er viewBox, `stroke`
    `currentColor`, Strichstärke 2, `aria-hidden`, `focusable="false"`, `.buttonIcon`)
  - `EditIcon.tsx` - NEU, Stift im selben Stil
  - `MealListRow.tsx` - Klasse `mealTransferButton` wird zu `iconButton`
  - `MealItemsEditor.tsx` - Entfernen-Knopf mit `iconButton` und `TrashIcon`
  - `MealPage.tsx` - eine Aktionszeile `iconActions` mit drei Icon-Knöpfen und
    `aria-label`
- `src/index.css`
  - `.mealTransferButton` wird zu `.iconButton`. Die Regel gilt jetzt für Liste und
    Editor, das Aussehen bleibt gleich.
  - `.iconActions` - NEU, Zeile mit `display: flex`, `gap`, `margin-top` wie
    `.pageActions`. Ihre Knöpfe bekommen `flex: 1` und zentrieren das Icon.

## Umsetzung

Abhängigkeiten: keine

Beide Stellen erhalten ihre Icon-Knöpfe in einem Zug, weil sie dieselben Icons und
dieselbe Knopfform teilen.

**Aufgaben**:

- [ ] Test zuerst: In `src/meals/ui/MealsArea.test.tsx` den Fall
      `shows the removal of a taken over item as an icon only` ergänzen. Er öffnet das
      Formular, übernimmt "Hackfleisch", "500", "g" und prüft für den Knopf
      "Entfernen, Hackfleisch, 500 g", dass `textContent` leer ist.
      `toHaveTextContent('')` taugt nicht, weil ein leerer Text immer passt.
      ```ts
      expect(
        screen.getByRole('button', { name: 'Entfernen, Hackfleisch, 500 g' })
          .textContent,
      ).toBe('')
      ```
- [ ] Test zuerst: den Fall `shows the actions of a meal as icons only in one row`
      ergänzen. Er öffnet ein Gericht und prüft:
      - "Auf die Einkaufsliste", "Bearbeiten" und "Löschen" haben leeres `textContent`.
      - Alle drei liegen im selben Elternelement, in dieser Reihenfolge.
- [ ] Test zuerst: Die axe-Prüfung des Formulars bekommt einen Fall mit übernommenem
      Item. So wird der Icon-Knopf im Editor mitgeprüft:
      `has no accessibility violations on the form with an item taken over`.
- [ ] `src/meals/ui/TrashIcon.tsx` anlegen: Mülleimer im Stil von
      `AddToShoppingListIcon`, zum Beispiel Deckel `M3 6h18`, Griff
      `M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2`, Korpus
      `M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6` und zwei senkrechte Striche
      `M10 11v6` und `M14 11v6`.
- [ ] `src/meals/ui/EditIcon.tsx` anlegen: Stift im selben Stil, zum Beispiel
      `M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z` und `m15 5 4 4`.
- [ ] `src/index.css`: `.mealTransferButton` in `.iconButton` umbenennen und
      `.iconActions` ergänzen:
      ```css
      .iconActions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .iconActions button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      ```
- [ ] `src/meals/ui/MealListRow.tsx`: `className="iconButton"` statt
      `mealTransferButton`.
- [ ] `src/meals/ui/MealItemsEditor.tsx`: Der Entfernen-Knopf bekommt
      `className="iconButton"`, das `aria-label` bleibt, der Text "Entfernen" wird zu
      `<TrashIcon />`.
- [ ] `src/meals/ui/MealPage.tsx`: Die beiden `.pageActions`-Zeilen werden zu einer
      Zeile.
      ```tsx
      <div className="iconActions">
        <button type="button" onClick={onAddToShoppingList} aria-label="Auf die Einkaufsliste">
          <AddToShoppingListIcon />
        </button>
        <button type="button" onClick={onEdit} aria-label="Bearbeiten">
          <EditIcon />
        </button>
        <button type="button" onClick={onDelete} aria-label="Löschen">
          <TrashIcon />
        </button>
      </div>
      ```
- [ ] `src/index.css`: Der Item-Text in `.mealItemRow` darf schrumpfen und umbrechen
      (`min-width: 0; overflow-wrap: anywhere;` für `.mealItemRow span`). Sonst
      schiebt ein langer Name den Mülleimer aus der Zeile, denn `.iconButton` ist
      `flex: none`.

**Automatisierte Verifikation**:

- [ ] Die neuen Fälle in `MealsArea.test.tsx` schlagen vor der Umsetzung fehl und laufen
      danach grün.
- [ ] Die bestehenden Fälle zu Entfernen, Bearbeiten, Löschen und Übertragen laufen
      unverändert grün.
- [ ] Die axe-Fälle `on a meal`, `on the form` und
      `on the form with an item taken over` sind grün.
- [ ] `npm run test` läuft durch.
- [ ] `npm run lint` läuft durch.
- [ ] `npm run build` läuft durch.
- [ ] `npm run test:e2e` läuft durch. `e2e/meals.spec.ts` drückt
      "Auf die Einkaufsliste" weiterhin über den gesprochenen Namen.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Auf der Gerichtsansicht stehen unten drei gleich breite grüne Knöpfe mit Wagen,
      Stift und Mülleimer in einer Zeile. Die Symbole sind gut erkennbar.
- [ ] Im Editor steht rechts neben jedem Item ein quadratischer Mülleimer-Knopf. Lange
      Item-Namen brechen um, ohne den Knopf zu verdrängen.
- [ ] Mit VoiceOver: Die drei Knöpfe werden als "Auf die Einkaufsliste, Taste",
      "Bearbeiten, Taste" und "Löschen, Taste" gelesen, der Mülleimer im Editor als
      "Entfernen, Hackfleisch, 500 g, Taste".
- [ ] Die Bestätigungsseite zum Löschen sieht aus wie bisher.

## Notizen zur Umsetzung

## Verweise

- `src/meals/ui/MealListRow.tsx`, `src/meals/ui/AddToShoppingListIcon.tsx`: Vorbild
  für Icon-Knöpfe (Commit `41f9693`)
- `docs/agents/plans/2026-09-15-gerichteseite-und-navigationsleiste.md`: Entstehung von
  Gerichtsansicht und Item-Editor
- Lucide-Icons als Stilvorlage: https://lucide.dev/icons/trash-2,
  https://lucide.dev/icons/pencil
