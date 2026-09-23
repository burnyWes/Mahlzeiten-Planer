---
date: 2026-09-23T14:26:58+00:00
git_commit: beb37d7c81ca104e87d2ef27003fd7b80d2b3d21
branch: main
story: MZP-018
topic: "Platz fuer die Gluehbirne freihalten"
tags: [plan, meals, mealList, css]
status: done
---

# PLAN: MZP-018 — Platz für die Glühbirne freihalten

Die Gerichteliste hält in **jeder** Zeile die 24 px der erloschenen Birne frei, auch
wenn das Gericht sichtbar ist. Alle Namen beginnen damit auf derselben senkrechten
Linie, und ausgeblendete Gerichte sind auf einen Blick zu erkennen, statt Zeile für
Zeile gelesen werden zu müssen.

Der offene Punkt aus `docs/notes.txt`: `- Gerichteliste: Immer gleichen Platz für
Glühbirne freihalten, auch wenn nicht sichtbar`. Alle Entscheidungen stammen aus der
Befragung vom 2026-09-23.

## Akzeptanzkriterien

- Jede Zeile der Gerichteliste hält 24 px plus den vorhandenen 1-rem-Abstand für die
  Marke frei — unabhängig davon, ob das einzelne Gericht ausgeblendet ist und
  unabhängig davon, ob überhaupt ein Gericht ausgeblendet ist.
- Alle Gerichtenamen beginnen auf derselben senkrechten Linie.
- Die erloschene Birne erscheint weiterhin **nur** bei ausgeblendeten Gerichten.
- VoiceOver liest die Zeilen unverändert als `Suppe` beziehungsweise
  `Suppe, ausgeblendet`. Der leere Platzhalter bleibt `aria-hidden` und taucht in
  keiner Ansage auf.
- Einstellungen und bekannte Artikel sehen unverändert aus, obwohl sie sich `.mealRow`
  mit der Gerichteliste teilen — sie verwenden `.hiddenMark` nicht. Die Vorräte-Liste
  steht auf `.supplyRow` und ist ohnehin nicht betroffen.
- Der Wochenplan sieht unverändert aus, obwohl seine Regel `.supplyMark` in eine
  gemeinsame Selektorliste wandert.
- Die Zugänglichkeitsprüfungen auf der Liste und auf dem ausgeblendeten Gericht
  bleiben grün.

## Wesentliche Entscheidungen und Abwägungen

1. **Der Span wird immer gerendert, das Icon bedingt.** Die Bedingung wandert aus dem
   Ausdruck um den Span **in den Span hinein**.
   - Warum: genau das Muster, das `WeekPlanRow.tsx:66-68` für die Schneeflocke fährt.
     Ein zweiter Weg für dieselbe Sache — etwa ein Platzhalter-Icon mit
     `visibility: hidden` oder ein Einzug am Namensknopf — hätte denselben Effekt und
     eine zweite Erklärung nötig.
   - Auswirkung: `MealListRow.tsx` verliert die äussere Bedingung, sonst ändert sich
     an der Zeile nichts. Der Span bleibt `aria-hidden="true"` und damit für VoiceOver
     unsichtbar, ob er nun ein Icon trägt oder nicht.

2. **`.hiddenMark` und `.supplyMark` teilen sich eine Regel.**
   - Warum: mit `width: 24px` ist der Regelkörper von `.hiddenMark` Zeichen für
     Zeichen der von `.supplyMark` (`index.css:391-397`). Zwei gleiche Regeln laufen
     beim nächsten Anfassen auseinander, und dann steht die Gerichteliste anders da
     als der Wochenplan, ohne dass es jemand entschieden hätte.
   - Auswirkung: die gemeinsame Liste steht an der Stelle von `.hiddenMark`
     (`index.css:318`), die Regel bei Zeile 391 entfällt. Im Wochenplan-Abschnitt des
     Stylesheets steht `.supplyMark` danach nicht mehr — dafür an einer Stelle, die
     beide Verwendungen nennt.

3. **Das ist eine bewusste Kehrtwende gegenüber MZP-016, Entscheidung 7.** Dort war
   die fehlende Breite Absicht: "24 px plus Abstand in jeder Zeile gingen dem Namen
   verloren" (`2026-09-23-gericht-ausblenden.md:107-113`).
   - Warum: der Befund vom Gerät wiegt schwerer als die Rechnung auf dem Papier. Gleich
     breite Textkästen sind schneller zu erfassen als unterschiedlich weit eingerückte
     Namen. Die damalige Begründung war nicht falsch, nur anders gewichtet.
   - Auswirkung: der alte Plan bleibt unangetastet — er ist ein Dokument seiner Zeit.
     Dieser Plan hält die Umkehr fest, damit niemand sie später als Versehen
     zurückdreht.

4. **Ein Komponententest nach dem Vorbild des Wochenplans**, mit demselben Namen.
   - Warum: `WeekPlanArea.test.tsx:225-235` heisst `keeps the room for the mark in
     every row` und prüft dort dasselbe über `row.querySelector('.supplyMark')`.
     Derselbe Gedanke bekommt denselben Namen.
   - Auswirkung: eine Hilfe `mealRows()` in `MealsArea.test.tsx`, die zugleich
     `shownMealNames()` (Zeile 156-160) trägt — wie `weekdayRows()` dort
     `shownWeekdays()` und `markedWeekdays()` trägt.

5. **Kein e2e-Test.**
   - Warum: rein optisch, kein Server, kein Neuladen, kein Zustand. Playwright prüfte
     hier nur, was der Komponententest schon prüft, und die eigentliche Wirkung — die
     Ausrichtung — sieht auch Playwright nicht ohne Bildvergleich.
   - Auswirkung: `e2e/` bleibt unberührt.

6. **Die Vorräte-Liste bekommt keine Marke.**
   - Warum: `SupplyListRow.tsx` zeigt Gerichtenamen ohne Birne — dort ist heute nichts
     auszurichten, weil es keine Marke gibt. Eine einzuführen wäre ein eigenes
     Vorhaben mit eigener fachlicher Frage (soll ein ausgeblendetes Gericht überhaupt
     einen Vorrat haben?).
   - Auswirkung: `SupplyListRow.tsx` und `.supplyRow` bleiben unverändert.

## Ausgangslage

Die Zeile der Gerichteliste (`MealListRow.tsx:17-40`):

```
<li class="mealRow">                       display:flex, align-items:center, gap:1rem
  {meal.hidden && <span class="hiddenMark" aria-hidden>   flex:none, KEINE Breite
                    <LightbulbOffIcon/>                   .buttonIcon = 24x24
                  </span>}
  <button class="mealNameButton">          flex:1, min-width:0, overflow-wrap:anywhere
  <button class="iconButton">              flex:none, min-width:44px
```

Weil der Span bei sichtbaren Gerichten gar nicht erst entsteht, entfällt mit ihm auch
sein Abstand. Das ergibt zwei Zeilenanfänge:

```
Gerichteliste heute
+----------------------------------------------------+
| (/) Bolognese                               [Wagen] |   ausgeblendet
| Eintopf                                     [Wagen] |   sichtbar
| (/) Milchreis                               [Wagen] |   ausgeblendet
| Suppe                                       [Wagen] |   sichtbar
+----------------------------------------------------+
  ^^^^^^
  24 px Birne + 1 rem Abstand, nur in den ausgeblendeten Zeilen;
  die sichtbaren Namen beginnen 40 px weiter links
```

Die beiden CSS-Regeln, um die es geht:

```
index.css:318-323                     index.css:391-397
.hiddenMark {                         .supplyMark {
  flex: none;                           flex: none;
                                        width: 24px;        <- der Unterschied
  display: flex;                        display: flex;
  align-items: center;                  align-items: center;
  justify-content: center;              justify-content: center;
}                                     }
```

Der Wochenplan macht es bereits so (`WeekPlanRow.tsx:61-74`):

```
<li class="weekPlanRow">
  <div class="weekPlanChoice">              display:flex, gap:0.75rem
    <span class="weekday" aria-hidden>      flex:none, min-width:2.5rem
    <span class="supplyMark" aria-hidden>   flex:none, width:24px
      {inSupply && <SnowflakeIcon/>}        <- Span immer, Icon bedingt
    </span>
    <input>                                 flex:1
    <button class="iconButton">
```

Wer `.mealRow` sonst noch trägt — und deshalb **nicht** betroffen ist, weil keiner von
beiden `.hiddenMark` verwendet:

```
MealListRow.tsx:18        <li class="mealRow">   <- diese Zeile ändert sich
SettingsPage.tsx:38       <li class="mealRow">   <- unverändert
KnownItemListRow.tsx:16   <li class="mealRow">   <- unverändert
```

## Zielbild

Die Zeile hält die Spalte immer frei, das Icon entscheidet sich im Inneren:

```
<li class="mealRow">
  <span class="hiddenMark" aria-hidden="true">      immer da, 24 px breit
    {meal.hidden && <LightbulbOffIcon/>}            nur bei ausgeblendeten Gerichten
  </span>
  <button class="mealNameButton">
  <button class="iconButton">
```

```
Gerichteliste danach
+----------------------------------------------------+
| (/) Bolognese                               [Wagen] |   ausgeblendet
|     Eintopf                                 [Wagen] |   sichtbar
| (/) Milchreis                               [Wagen] |   ausgeblendet
|     Suppe                                   [Wagen] |   sichtbar
+----------------------------------------------------+
  |<24>|<16>|<------- Name -------->|<16>|<--44-->|
   Marke      flex:1, min-width:0          Wagen

Und ohne jedes ausgeblendete Gericht — die Spalte bleibt trotzdem stehen:
+----------------------------------------------------+
|     Bolognese                               [Wagen] |
|     Eintopf                                 [Wagen] |
|     Suppe                                   [Wagen] |
+----------------------------------------------------+
```

Die gemeinsame Regel:

```
.hiddenMark,                <- Gerichteliste, neu in der Liste
.supplyMark {               <- Wochenplan, unverändertes Aussehen
  flex: none;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

Was sich **nicht** ändert: die Vorlesereihenfolge, die `aria-label` aus
`mealNameLabel` (`announcements.ts`), die Sortierung, der Wagen-Knopf, der Wochenplan,
die Einstellungen, die bekannten Artikel und die Vorräte-Liste.

## Abstraktionen und Wiederverwendung

Es entsteht keine neue Abstraktion. Die Zeile übernimmt das Muster des Wochenplans,
die Regel wird mit der vorhandenen zusammengelegt, der Test bekommt den Namen, den der
gleiche Test im Wochenplan schon trägt. Neu ist allein eine Testhilfe.

- `src/meals/ui`
  - `MealListRow.tsx` — die Marke steht in jeder Zeile
    - `MealListRow` — Bedingung wandert in den Span
  - `MealsArea.test.tsx` — Testhilfe und ein neuer Test
    - `mealRows` — neu, nach dem Vorbild von `weekdayRows`
      (`WeekPlanArea.test.tsx:147-149`)
    - `shownMealNames` — nutzt künftig `mealRows`
    - `keeps the room for the mark in every row` — neu
- `src`
  - `index.css` — `.hiddenMark` und `.supplyMark` in einer Selektorliste
- `docs`
  - `notes.txt` — der offene Punkt wird nach der Prüfung am Gerät auf `x` gesetzt und
    unverändert formuliert nach DONE verschoben

Nicht angefasst werden `MealListPage.tsx`, `MealPage.tsx`, `LightbulbOffIcon.tsx`,
`WeekPlanRow.tsx`, `SupplyListRow.tsx`, `SettingsPage.tsx`, `KnownItemListRow.tsx`,
`announcements.ts` und alles unter `e2e/`.

## Logging und Beobachtbarkeit

Die App hat kein Logging; beobachtbar ist sie allein über die VoiceOver-Ansagen aus
`announce`. **Es kommt keine Ansage hinzu und es ändert sich keine** — die Marke war
schon bisher `aria-hidden`, und ein leerer Span bleibt es ebenso. Was VoiceOver über
ein ausgeblendetes Gericht sagt, entscheidet weiterhin `mealNameLabel`.

## Umsetzung

Abhängigkeiten: keine.

Die Zeile hält die Spalte frei, die Regel bekommt ihre Breite, der Test hält beides
fest.

**Aufgaben**:

- [x] `MealListRow.tsx` die Marke in jeder Zeile rendern: die Bedingung `meal.hidden`
      wandert aus dem umschliessenden Ausdruck in den Span. Die Reihenfolge der
      Geschwister bleibt, damit `shownMealNames()` weiter den reinen Namen aus dem
      ersten Knopf liest.
      ```tsx
      <span className="hiddenMark" aria-hidden="true">
        {meal.hidden && <LightbulbOffIcon />}
      </span>
      ```
- [x] `.hiddenMark` in `src/index.css` (Zeile 318-323) zur Selektorliste mit
      `.supplyMark` erweitern und um `width: 24px` ergänzen; die Regel `.supplyMark`
      bei Zeile 391-397 entfällt dafür ersatzlos. Die übrigen vier Eigenschaften
      bleiben Zeichen für Zeichen, wie sie sind.
      ```css
      .hiddenMark,
      .supplyMark {
        flex: none;
        width: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      ```
- [x] `mealRows()` in `MealsArea.test.tsx` einführen und `shownMealNames()`
      (Zeile 156-160) darauf stützen — dieselbe Aufteilung wie `weekdayRows()` und
      `shownWeekdays()` in `WeekPlanArea.test.tsx:147-153`.
      ```tsx
      function mealRows() {
        return within(screen.getByRole('main')).getAllByRole('listitem')
      }

      function shownMealNames() {
        return mealRows().map(
          (row) => within(row).getAllByRole('button')[0].textContent,
        )
      }
      ```
- [x] Den Test `keeps the room for the mark in every row` in `MealsArea.test.tsx`
      ergänzen, neben den vorhandenen Tests zum Ausblenden. Er prüft beides in einem
      Durchgang: die Spalte steht in jeder Zeile, das Icon nur in der ausgeblendeten.
      ```tsx
      it('keeps the room for the mark in every row', () => {
        renderMealsArea([
          meal('soup', 'Suppe', { hidden: true }),
          meal('stew', 'Eintopf'),
        ])

        expect(
          mealRows().map((row) => row.querySelector('.hiddenMark') !== null),
        ).toEqual([true, true])
        expect(
          mealRows().map((row) => row.querySelector('.hiddenMark svg') !== null),
        ).toEqual([false, true])
      })
      ```
      Die Liste sortiert alphabetisch (`byName`), `Eintopf` steht also vor `Suppe` —
      darum `[false, true]`.
- [x] Nach der Prüfung am Gerät in `docs/notes.txt` den Punkt `- Gerichteliste: Immer
      gleichen Platz für Glühbirne freihalten, auch wenn nicht sichtbar` auf `x`
      setzen und **unverändert formuliert** nach DONE verschieben.

**Automatisierte Verifikation**:

- [x] Der Test `keeps the room for the mark in every row` in `MealsArea.test.tsx` ist
      grün.
- [x] `names a hidden meal as hidden in the list` bleibt grün — das `aria-label` und
      die Sortierung ändern sich nicht.
- [x] `has no accessibility violations on the list` und `... on a hidden meal` bleiben
      grün: der leere Span erzeugt keine Verletzung.
- [x] `keeps the room for the mark in every row` in `WeekPlanArea.test.tsx` bleibt
      grün. Er prüft die DOM-Struktur, nicht das Stylesheet — dass der Wochenplan auch
      **aussieht** wie vorher, deckt erst die Prüfung am Gerät ab.
- [x] `npm run test` läuft durch.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.

**Manuelle Verifikation**:

- [x] Die Gerichteliste mit mindestens einem ausgeblendeten und einem sichtbaren
      Gericht ansehen: alle Namen beginnen auf derselben senkrechten Linie, die Birne
      steht nur an den ausgeblendeten.
- [x] Alle Gerichte einblenden: die Spalte bleibt frei, die Namen rücken nicht nach
      links.
- [x] Der Wochenplan sieht unverändert aus — die Schneeflocke steht an ihrem Platz,
      die Tagesfelder sind untereinander ausgerichtet.
- [x] Einstellungen, bekannte Artikel und die Vorräte-Liste sehen unverändert aus.
- [x] Beides in beiden Farbstellungen.
- [x] Mit VoiceOver über die Gerichteliste wischen: die Zeilen lesen sich unverändert
      als `<Gericht>` beziehungsweise `<Gericht>, ausgeblendet`, es kommt kein
      zusätzliches Element dazwischen.

## Notizen zur Umsetzung

**2026-09-23 — am Gerät geprüft.** Die Namen der Gerichteliste beginnen auf derselben
senkrechten Linie, die Birne steht nur an den ausgeblendeten Gerichten, und die Spalte
bleibt auch ohne ein einziges ausgeblendetes Gericht stehen. Wochenplan, Einstellungen,
bekannte Artikel und Vorräte-Liste sehen in beiden Farbstellungen unverändert aus, und
VoiceOver liest die Zeilen ohne zusätzliches Element. Der Plan ist abgeschlossen.

## Verweise

- `docs/agents/plans/2026-09-23-gericht-ausblenden.md` — MZP-016, führt die Marke ein
  und begründet in Entscheidung 7, warum sie damals **keinen** Platz freihalten
  sollte.
- `docs/agents/plans/2026-09-22-vorraete-verbrauch-im-wochenplan.md` — MZP-013, legt
  `.supplyMark` als feste Spalte an (Zeile 311-318), deren Muster dieser Plan
  übernimmt. Der gleichnamige Test entstand dort erst bei der Umsetzung und steht
  heute in `WeekPlanArea.test.tsx:225-235`.
- `docs/notes.txt` — der offene Punkt `- Gerichteliste: Immer gleichen Platz für
  Glühbirne freihalten, auch wenn nicht sichtbar`.
