---
date: 2026-09-23T12:12:02+00:00
git_commit: cda350d7e029c4858c957211055658d64db6a309
branch: main
story: MZP-015
topic: "Vorrat beim Übertragen verbrauchen"
tags: [plan, meals, weekPlan, supplies, shoppingList]
status: ready
---

# PLAN: MZP-015 — Vorrat beim Übertragen verbrauchen

Seit MZP-013 weiß der Wochenplan, welche Tage der Vorrat deckt, und lässt deren
Zutaten von der Einkaufsliste weg. Angerührt wird der Vorrat dabei nicht — wer die
Woche überträgt, muss die verbrauchten Portionen anschließend von Hand auf der
Vorräte-Seite herunterzählen. Dieser Plan nimmt ihm das ab: »Auf die Einkaufsliste«
bucht die gedeckten Tage aus dem Vorrat aus.

Damit dreht sich Entscheidung 2 aus
`docs/agents/plans/2026-09-22-vorraete-verbrauch-im-wochenplan.md` um.

## Akzeptanzkriterien

- Ein Druck auf »Auf die Einkaufsliste« verringert jeden Vorrat um die Zahl der
  Tage, die er im Plan deckt. Bolognese mit Vorrat 3, geplant Montag und Mittwoch:
  danach steht der Vorrat auf 1.
- Deckt der Vorrat alle seine geplanten Tage, entfällt er ganz. Bolognese mit
  Vorrat 2, geplant Montag, Mittwoch und Freitag: Montag und Mittwoch sind
  gedeckt, der Vorrat verschwindet, der Freitag wandert auf die Einkaufsliste.
- Ein Vorrat, dessen Gericht nicht im Plan steht, bleibt unberührt.
- Auf der Einkaufsliste landen unverändert nur die Zutaten der ungedeckten Tage.
- Nach der Übertragung steht der Wochenplan unverändert und der Knopf bleibt
  bedienbar. Die Schneeflocken folgen dem verbliebenen Vorrat: ist er ganz
  aufgebraucht, sind sie weg; bleibt etwas übrig, stehen sie weiter an den ersten
  Tagen des Gerichts. Bolognese mit Vorrat 3 an Montag und Mittwoch behält nach
  der Übertragung die Schneeflocke am Montag, weil eine Portion übrig ist.
- Ein zweiter Druck kauft alle Tage, die kein verbliebener Vorrat mehr deckt.
- Die Ansage nennt die Entnahme:
  - `Wochenplan, 6 Artikel hinzugefügt. 3 Tage aus dem Vorrat entnommen.`
  - `Wochenplan, 6 Artikel hinzugefügt. 1 Tag aus dem Vorrat entnommen.`
  - `Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.`
  - `Wochenplan, nichts hinzugefügt. 2 Tage aus dem Vorrat entnommen. Suppe hat keine Einkaufs-Items.`
- Deckt kein Vorrat einen geplanten Tag, bleibt die Ansage wie bisher ohne
  Vorrat-Satz: `Wochenplan, 6 Artikel hinzugefügt.`
- Die Überschrift `Wochenplan, 3 von 7` zählt weiterhin alle geplanten Tage,
  gedeckte eingeschlossen.
- Planen, Würfeln und Leeren eines Tages verändern den Vorrat nicht — nur der Knopf
  tut das.

## Wesentliche Entscheidungen und Abwägungen

1. **Kein Schutz gegen den zweiten Druck:** der Knopf bleibt unverändert bedienbar,
   der Plan bleibt nach der Übertragung stehen.
   - Warum: der abgebuchte Vorrat ist fachlich »für diese Woche verplant«; ein
     zweiter Druck ist ein bewusster Akt nach einer Planänderung. Der
     Wochenplan-Prozess wird später als Ganzes überarbeitet.
   - Auswirkung: kein neues Firestore-Feld, kein »schon übertragen«-Gedächtnis,
     keine Sperre am Knopf. Wer zweimal drückt, kauft die vorher gedeckten Tage
     mit — die Einkaufsliste fasst gleiche Namen zusammen und sagt das an.

2. **Ansage als Handlung:** aus `… aus dem Vorrat.` wird
   `… aus dem Vorrat entnommen.`
   - Warum: VoiceOver ist der Hauptbedienweg; dass der Vorrat gerade schrumpft,
     muss hörbar sein. Die alte Formulierung beschreibt einen Zustand, ab jetzt
     ist es eine Handlung.
   - Auswirkung: drei Formulierungen in `announcements.ts` und die zugehörigen
     Tests ändern sich, dazu die Erwartungen in `SignedInApp.test.tsx` und
     `e2e/weekPlan.spec.ts`.

3. **`spentSupplies` ersetzt `suppliedDays`:** `WeekPlanTransfer` trägt die
   verbrauchte Menge je Gericht, die Tageszahl wird daraus abgeleitet.
   - Warum: die verbrauchte Menge je Gericht *ist* die Information, die Tageszahl
     für die Ansage nur deren Summe. Zwei Felder, von denen eines aus dem anderen
     folgt, laufen auseinander.
   - Auswirkung: `suppliedDayCount(transfer)` kommt dazu; alle Tests, die
     `suppliedDays: n` erwarten, werden umgeschrieben. `Supply` ist bereits der
     passende Typ — kein neuer Typ nötig.

4. **`SignedInApp` bucht ab, `WeekPlanArea` bleibt lesend:** über
   `supplies.changeSupply` und die neue Domänenfunktion `withoutPortions`.
   - Warum: `changeSupply` (`useSupplies.ts:48-61`) liest den aktuellen Stand,
     wendet die Änderung an und entfernt den Vorrat von selbst, wenn nichts übrig
     bleibt. Es schreibt `kept.current` synchron fort, mehrere Gerichte
     nacheinander sind also korrekt. Entscheidung 2 aus MZP-013 — `WeekPlanArea`
     bekommt die Vorräte nur als `readonly Supply[]` — bleibt bestehen.
   - Auswirkung: kein neues API in `useSupplies`, die Rechnung liegt in
     `supply.ts`, die Schleife in `SignedInApp` ist Verdrahtung.

5. **Der bekannte `useSupplies`-Bug bleibt offen:** kein `unconfirmedWrites`-Umbau
   in diesem Plan.
   - Warum: eigenständiges Thema, betrifft alle drei Schreibwege der Vorräte
     gleichermaßen und verlangt denselben Umbau, den die Einkaufsliste in MZP-006
     bekommen hat.
   - Auswirkung: `docs/notes.txt` bekommt einen Verweis darauf, dass die
     Übertragung den Bug jetzt mehrfach je Druck auslösen kann; der E2E-Test wartet
     über `expect.poll(supplyCountsOnServer)` auf den Server, bevor er prüft.
   - Zweite Auswirkung: `firestoreSuppliesClient.ts:32-34` meldet Schreibfehler
     asynchron über `onWriteFailure`, das in `SignedInApp.tsx:94` auf `announce`
     verdrahtet ist. Bisher konnte je Bedienschritt nur ein Vorrat scheitern, jetzt
     mehrere — und weil `announce` eine ersetzende Statuszeile ist
     (`useAnnouncer.ts:5-16`), überschreiben diese Meldungen die gerade gesprochene
     Übertragungsansage. Das wird in Kauf genommen: eine gescheiterte Schreibung ist
     die wichtigere Nachricht. Auch das gehört zum offenen Vorräte-Thema und wird
     hier nicht behandelt.

## Ausgangslage

Der Weg des Knopfes heute:

```
WeekPlanPage  [Auf die Einkaufsliste]      disabled wenn plannedDays === 0
     |
     v
WeekPlanArea.tsx:76-80
     onAddToShoppingList( weekPlanTransfer(plan, meals, supplies) )
                          `- weekPlan.ts:89-102
                             { mealsToBuy: Meal[]      nur die UNGEDECKTEN Tage
                               suppliedDays: number }  Zahl der gedeckten Tage
     |
     v
SignedInApp.tsx:117-130  addWeekPlanToShoppingList
     shoppingList.addItems( shoppingItemsOf(transfer.mealsToBuy) )
     announce( weekPlanTransferAnnouncement(additions, mealsWithoutItems,
                                            transfer.suppliedDays) )
     -- supplies wird hier gar nicht angefasst
```

Die Deckung hängt am **Tag**, nicht am Gericht (`weekPlan.ts:48-60`): ein Vorrat von
`n` deckt die ersten `n` Wochentage, an denen das Gericht steht.

```
Vorrat: Bolognese 1           Plan             gedeckt?
                              Mo. * Bolognese  ja    (0 fruehere < 1)
                              Di.   Pizza      nein
                              Mi.   Bolognese  nein  (1 fruehere >= 1)
```

Die Zuständigkeiten für die Vorräte:

```
SignedInApp.tsx:104   useSupplies(suppliesClient)  -> Supplies
                        { supplies, keepSupply, removeSupply, changeSupply }
     |
     +-- SuppliesArea(supplies: Supplies)           einziger Schreibweg heute
     |
     +-- WeekPlanArea(supplies: readonly Supply[])  nur lesend
```

Vorhandene Bausteine, die getragen werden:

- `supplyOf(supplies, mealId)` und `withSupply(supplies, written)`
  (`supply.ts:86-108`) — reichen aus, um die verbrauchten Portionen je Gericht
  aufzusummieren.
- `withOneLess(supply)` (`supply.ts:81-84`) — gibt `null` zurück, wenn die letzte
  Portion geht. Genau dieses Muster bekommt `withoutPortions`.
- `changeSupply(mealId, change)` (`useSupplies.ts:48-61`) — ruft bei `null`
  selbsttätig `removeSupply`.
- `supplyCountsOnServer()` (`e2e/emulatorHousehold.ts:116-129`) — liest die
  Vorräte aus dem Emulator, wird in `e2e/supplies.spec.ts` bereits so benutzt.

## Zielbild

```
WeekPlanArea.tsx                              unveraendert lesend
     onAddToShoppingList( weekPlanTransfer(plan, meals, supplies) )
                          `- { mealsToBuy: Meal[]
                               spentSupplies: Supply[] }   je Gericht die Menge
     |
     v
SignedInApp.tsx  addWeekPlanToShoppingList
     1. shoppingList.addItems( shoppingItemsOf(transfer.mealsToBuy) )
     2. fuer jeden spent in transfer.spentSupplies:
            supplies.changeSupply(spent.mealId,
                                  (supply) => withoutPortions(supply, spent.count))
     3. announce( weekPlanTransferAnnouncement(additions, mealsWithoutItems,
                                               suppliedDayCount(transfer)) )
```

Ein Durchlauf mit zwei Vorräten:

```
Vorrat vorher:  Bolognese 2,  Pizza 1
Plan:           Mo * Bolognese   Di * Pizza   Mi * Bolognese   Do Bolognese   Fr Pizza

gedeckte Tage:  Mo, Di, Mi                       -> suppliedDayCount = 3
spentSupplies:  [ {bolognese, 2}, {pizza, 1} ]
mealsToBuy:     [ Bolognese (Do), Pizza (Fr) ]

Vorrat danach:  Bolognese 2-2 = 0  -> entfaellt
                Pizza     1-1 = 0  -> entfaellt

Ansage:         "Wochenplan, 4 Artikel hinzugefuegt. 3 Tage aus dem Vorrat entnommen."
```

Der Wochenplan vor und nach dem Druck — der Plan bleibt stehen, nur die
Schneeflocken gehen:

```
vorher                                     nachher
+------------------------------+           +------------------------------+
| Mo. * [ Bolognese      ] [W] |           | Mo.   [ Bolognese      ] [W] |
| Di. * [ Pizza          ] [W] |           | Di.   [ Pizza          ] [W] |
| Mi. * [ Bolognese      ] [W] |           | Mi.   [ Bolognese      ] [W] |
| Do.   [ Bolognese      ] [W] |           | Do.   [ Bolognese      ] [W] |
| Fr.   [ Pizza          ] [W] |           | Fr.   [ Pizza          ] [W] |
+------------------------------+           +------------------------------+
  Ueberschrift: Wochenplan, 5 von 7          Ueberschrift: unveraendert
```

Ein Vorrat, der nicht ganz aufgebraucht wird:

```
Vorrat vorher:  Bolognese 3
Plan:           Mo * Bolognese   Mi * Bolognese

spentSupplies:  [ {bolognese, 2} ]
Vorrat danach:  Bolognese 1      -> die Schneeflocke steht anschliessend am Montag
mealsToBuy:     []
Ansage:         "Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefuegt."
```

Die Ansagen im Vergleich:

| Fall | heute | künftig |
|---|---|---|
| nichts gedeckt | `Wochenplan, 6 Artikel hinzugefügt.` | unverändert |
| mehrere Tage gedeckt | `Wochenplan, 6 Artikel hinzugefügt. 3 Tage aus dem Vorrat.` | `… 3 Tage aus dem Vorrat entnommen.` |
| ein Tag gedeckt | `Wochenplan, 6 Artikel hinzugefügt. 1 Tag aus dem Vorrat.` | `… 1 Tag aus dem Vorrat entnommen.` |
| alles gedeckt | `Wochenplan, alle Gerichte aus dem Vorrat, nichts hinzugefügt.` | `Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.` |
| gedeckt und ein Gericht ohne Items | `Wochenplan, nichts hinzugefügt. 2 Tage aus dem Vorrat. Suppe hat keine Einkaufs-Items.` | `… 2 Tage aus dem Vorrat entnommen. Suppe hat keine Einkaufs-Items.` |

## Abstraktionen und Wiederverwendung

Neu entstehen genau drei Funktionen, alle in `domain/`:

- `withoutPortions(supply, spent)` — spiegelt `withOneLess` für eine beliebige
  Menge und gibt `null` zurück, wenn nichts übrig bleibt.
- `spentSupplies` als Feld von `WeekPlanTransfer`, gefüllt über `supplyOf` und
  `withSupply` — beide sind schon da.
- `suppliedDayCount(transfer)` — die Summe für die Ansage.

Dateien:

- `src/meals/domain`
  - `supply.ts` — Abbuchung einer Menge
    - `withoutPortions` — neu, gibt `null` bei vollem Verbrauch
  - `supply.test.ts` — Tests für `withoutPortions`
  - `weekPlan.ts` — `WeekPlanTransfer` trägt die verbrauchte Menge je Gericht
    - `WeekPlanTransfer` — `spentSupplies: readonly Supply[]` statt `suppliedDays: number`
    - `weekPlanTransfer` — sammelt die gedeckten Tage je Gericht auf
    - `portionsPerMeal` — neu, modulprivat
    - `suppliedDayCount` — neu, Summe für die Ansage
  - `weekPlan.test.ts` — Erwartungen auf `spentSupplies` umgestellt, Tests für `suppliedDayCount`
  - `announcements.ts` — Entnahme statt Zustand
    - `suppliedDayPhrase` — `… entnommen.`
    - `weekPlanTransferAnnouncement` — der Alles-gedeckt-Satz
  - `announcements.test.ts` — die vier betroffenen Erwartungen
- `src/`
  - `SignedInApp.tsx` — bucht die verbrauchten Vorräte ab
    - `addWeekPlanToShoppingList` — Schleife über `spentSupplies`, `suppliedDayCount` für die Ansage
  - `SignedInApp.test.tsx` — Vorrat nach der Übertragung, zweiter Druck, Teilverbrauch
- `src/meals/ui`
  - `WeekPlanArea.test.tsx` — erwartete `WeekPlanTransfer`-Objekte
- `e2e`
  - `weekPlan.spec.ts` — `buys only the day that the supply no longer covers` prüft den Vorrat mit
- `docs`
  - `notes.txt` — Verweis auf den verschärften `useSupplies`-Bug, Wochenplan-Prozess

Nicht angefasst werden `WeekPlanArea.tsx`, `WeekPlanPage.tsx`, `WeekPlanRow.tsx`,
`useSupplies.ts` und `SuppliesArea.tsx`.

## Logging und Beobachtbarkeit

Die App hat kein Logging; die Beobachtbarkeit liegt allein in den VoiceOver-Ansagen
über `announce`. Deren Änderungen sind oben in der Vergleichstabelle festgehalten.
Scheitert ein Firestore-Schreibvorgang, greift wie bisher `onWriteFailure`, das in
`SignedInApp.tsx:94` auf `announce` verdrahtet ist.

## Umsetzung

### Phase 1: Die Domäne rechnet die verbrauchte Menge aus

Abhängigkeiten: keine.

`WeekPlanTransfer` trägt künftig die verbrauchte Menge je Gericht statt einer
nackten Tageszahl, und `supply.ts` lernt, eine Menge abzubuchen. Das Verhalten der
App bleibt in dieser Phase **unverändert** — es wird noch nichts abgebucht und die
Ansagen lauten wie bisher. `SignedInApp.test.tsx` und die E2E-Tests bleiben ohne
Änderung grün.

**Aufgaben**:

- [x] `withoutPortions` in `src/meals/domain/supply.ts` test-getrieben anlegen,
      neben `withOneLess`. Erst die Tests in `supply.test.ts`: eine Menge wird
      abgezogen; wird alles verbraucht, kommt `null`; wird mehr als vorhanden
      verlangt, kommt ebenfalls `null`.
      ```ts
      export function withoutPortions(supply: Supply, spent: number): Supply | null {
        const count = supply.count - spent
        return count <= 0 ? null : { ...supply, count }
      }
      ```
- [x] `WeekPlanTransfer` in `src/meals/domain/weekPlan.ts` umstellen:
      `spentSupplies: readonly Supply[]` statt `suppliedDays: number`.
- [x] `weekPlanTransfer` die gedeckten Tage je Gericht aufsummieren lassen, über
      die vorhandenen `supplyOf` und `withSupply`. Die Reihenfolge folgt dem
      jeweils ersten gedeckten Wochentag, damit die Tests deterministisch sind.
      **`portionsPerMeal` bekommt nur die gedeckten Tage** — die heutige Variable
      `days` in `weekPlanTransfer` (`weekPlan.ts:94`) hält *alle* geplanten Tage.
      Wird sie ungefiltert durchgereicht, bucht die Übertragung später auch
      ungedeckte Tage ab; das ist der wahrscheinlichste Fehler dieser Phase.
      ```ts
      function portionsPerMeal(days: readonly PlannedDay[]): readonly Supply[] {
        return days.reduce<readonly Supply[]>((spent, { meal }) => {
          const counted = supplyOf(spent, meal.id)
          return counted === null
            ? [...spent, { mealId: meal.id, count: 1 }]
            : withSupply(spent, { mealId: meal.id, count: counted.count + 1 })
        }, [])
      }

      export function weekPlanTransfer(plan, meals, supplies): WeekPlanTransfer {
        const days = plannedDays(plan, meals)
        const covered = days.filter(({ day }) =>
          isSuppliedOn(plan, day, meals, supplies),
        )
        const toBuy = days.filter(
          ({ day }) => !isSuppliedOn(plan, day, meals, supplies),
        )
        return {
          mealsToBuy: toBuy.map(({ meal }) => meal),
          spentSupplies: portionsPerMeal(covered),
        }
      }
      ```
- [x] `suppliedDayCount(transfer)` in `weekPlan.ts` ergänzen — die Summe der
      `count`-Werte aus `spentSupplies`.
- [x] Die Tests in `src/meals/domain/weekPlan.test.ts:225-286` auf `spentSupplies`
      umstellen und für `suppliedDayCount` je einen Fall für kein, ein und mehrere
      verbrauchte Gerichte ergänzen. Neu dazu: ein Vorrat, der mehrere Tage
      desselben Gerichts deckt, liefert **einen** Eintrag mit `count: 2`; ein
      Vorrat, dessen Gericht nicht im Plan steht, liefert **keinen** Eintrag.
- [x] `SignedInApp.tsx:124-128` auf `suppliedDayCount(transfer)` umstellen, damit
      die Ansage unverändert bleibt.
- [x] Die erwarteten Transfer-Objekte in `src/meals/ui/WeekPlanArea.test.tsx`
      (Zeilen 538-597) auf die neue Form bringen, etwa
      `{ mealsToBuy: [pizza, bolognese], spentSupplies: [{ mealId: 'bolognese', count: 1 }] }`.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `withoutPortions` gibt für `{ count: 2 }` und `spent: 2` den Wert `null`
      zurück und für `spent: 1` einen Vorrat mit `count: 1`.
- [x] `weekPlanTransfer` liefert für Bolognese mit Vorrat 2 an drei geplanten Tagen
      `spentSupplies: [{ mealId: 'bolognese', count: 2 }]` und einen `mealsToBuy`
      mit dem dritten Tag.
- [x] `suppliedDayCount` liefert `3` für `[{ bolognese, 2 }, { pizza, 1 }]`.
- [x] `npm run lint` läuft durch, `test/domainLayerBoundary.test.ts` bleibt grün.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `SignedInApp.test.tsx` bleibt ohne Änderung grün — das Verhalten hat sich
      nicht verschoben.

### Phase 2: Die Übertragung verbraucht den Vorrat

Abhängigkeiten: Phase 1.

Der Knopf bucht die verbrauchten Portionen aus dem Vorrat aus, und die Ansage sagt
es.

**Aufgaben**:

- [x] `suppliedDayPhrase` und den Alles-gedeckt-Satz in
      `src/meals/domain/announcements.ts:138-165` test-getrieben auf »entnommen«
      umstellen. Erst die vier Erwartungen in `announcements.test.ts:327-347`
      ändern, dann den Code.
      ```
      1 Tag aus dem Vorrat entnommen.
      3 Tage aus dem Vorrat entnommen.
      Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.
      ```
- [x] `addWeekPlanToShoppingList` in `src/SignedInApp.tsx:117-130` die verbrauchten
      Vorräte abbuchen lassen, zwischen dem Hinzufügen und der Ansage.
      ```ts
      for (const spent of transfer.spentSupplies)
        supplies.changeSupply(spent.mealId, (supply) =>
          withoutPortions(supply, spent.count),
        )
      ```
- [x] In `src/SignedInApp.test.tsx` die bestehende Erwartung
      `leaves the items of a covered day off the shopping list` (Zeile 380-407)
      nachziehen: die Ansage heißt jetzt `… 1 Tag aus dem Vorrat entnommen.`, und
      `suppliesClient.storedSupplies()` ist danach leer statt
      `[{ mealId: 'bolognese', count: 1 }]`. Ebenso die Erwartungen in den Tests
      `buys the day that the supply no longer reaches` (ab Zeile 410),
      `says that the whole week came out of the supply` (ab Zeile 436) und
      `spares the hint about a covered meal without items` (Zeile 459-483, zwei
      Erwartungen bei 478 und 481).
- [x] Einen Test `keeps what the week plan did not eat of a supply` ergänzen:
      Bolognese mit Vorrat 3, geplant an Montag und Mittwoch; nach der Übertragung
      steht `storedSupplies()` auf `[{ mealId: 'bolognese', count: 1 }]` und das
      Feld des Montags heißt weiterhin `Montag, im Vorrat` — die übrige Portion
      deckt ihn noch.
- [x] Einen Test `leaves a supply alone that the week plan does not touch`
      ergänzen: ein Vorrat für ein Gericht, das nicht im Plan steht, bleibt nach
      der Übertragung unverändert.
- [x] Einen Test `buys the covered day on a second transfer` ergänzen: nach zwei
      Drücken stehen auch die Zutaten des vorher gedeckten Tages auf der
      Einkaufsliste, und der Vorrat ist weg.
- [x] Einen Test ergänzen, der zeigt, dass Planen und Würfeln den Vorrat **nicht**
      anfassen: nach `chooseSuggestion` auf einen gedeckten Tag ist
      `storedSupplies()` unverändert.
- [x] `e2e/weekPlan.spec.ts`, Test `buys only the day that the supply no longer
      covers` (Zeile 63-106, die Ansage steht auf Zeile 100): die Erwartung auf
      `Wochenplan, 2 Artikel hinzugefügt. 1 Tag aus dem Vorrat entnommen.`
      anpassen und nach dem Druck `await expect.poll(supplyCountsOnServer).toEqual([])`
      ergänzen, bevor die Einkaufsliste geprüft wird. `supplyCountsOnServer` wird
      dazu aus `./emulatorHousehold.ts` importiert.
- [x] `docs/notes.txt` unten unter TODO anhängen:
      ```
      b Vorraete: die Wochenplan-Uebertragung bucht seit MZP-015 mehrere Vorraete
        auf einen Druck ab und trifft damit den useSupplies-Eintrag oben haeufiger
        als die Vorraete-Seite, die immer nur einen Vorrat schreibt.
      - Wochenplan-Prozess ueberarbeiten: der Knopf "Auf die Einkaufsliste" ist
        mehrfach drueckbar und kauft beim zweiten Druck die vorher gedeckten Tage
        mit, weil der Vorrat dann schon abgebucht ist (MZP-015, Entscheidung 1).
      ```

**Automatisierte Verifikation**:

- [x] `npm run test` läuft durch.
- [x] `weekPlanTransferAnnouncement('6 Artikel hinzugefügt.', [], 1)` ergibt
      `Wochenplan, 6 Artikel hinzugefügt. 1 Tag aus dem Vorrat entnommen.`
- [x] `weekPlanTransferAnnouncement('', [], 4)` ergibt
      `Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.`
- [x] Bolognese mit Vorrat 1, geplant Montag und Mittwoch: nach der Übertragung ist
      `storedSupplies()` leer und nur die Zutaten des Mittwochs stehen auf der
      Einkaufsliste.
- [x] Bolognese mit Vorrat 3, geplant an zwei Tagen: `storedSupplies()` steht
      danach auf `count: 1`.
- [x] Der zweite Druck legt die Zutaten des vorher gedeckten Tages auf die Liste.
- [x] `npm run lint` läuft durch.
- [x] `npm run build` übersetzt ohne Typfehler.
- [x] `npm run test:e2e` läuft durch; `buys only the day that the supply no longer
      covers` sieht den leeren Vorrat auf dem Server.

**Manuelle Verifikation**:

- [ ] Auf dem Gerät mit VoiceOver: eine Woche mit einem Vorrat planen, »Auf die
      Einkaufsliste« drücken und prüfen, dass die Ansage die Entnahme nennt, der
      Vorrat auf der Vorräte-Seite entsprechend kleiner ist und die Schneeflocke
      dem Rest folgt — bei aufgebrauchtem Vorrat weg, bei übriger Portion weiter
      am ersten Tag des Gerichts.

## Notizen zur Umsetzung

- Phase 1 und 2 liefen ohne Abweichung vom Plan durch. Der in Phase 1 genannte
  wahrscheinlichste Fehler — `portionsPerMeal` bekommt alle statt nur der gedeckten
  Tage — ist durch den Test `spends nothing of a supply whose meal is not planned`
  abgedeckt.
- Der Test für das unberührte Planen heißt
  `spends nothing of the supply while a day is being planned`.
- In `WeekPlanArea.test.tsx` mussten vier statt der geplanten Erwartungen angepasst
  werden; die Zeilenangaben des Plans stimmten, die Form der Objekte ist jetzt
  `spentSupplies: [supply('bolognese', 1)]`.

## Verweise

- `docs/agents/plans/2026-09-22-vorraete-verbrauch-im-wochenplan.md` — MZP-013,
  bringt die Vorräte in den Wochenplan; dessen Entscheidung 2 wird hier umgedreht.
- `docs/agents/plans/2026-09-22-vorraete-mit-anzahl.md` — MZP-012, führt die
  gezählten Vorräte ein.
- `docs/notes.txt` — der offene `useSupplies`-Eintrag zu unbestätigten
  Schreibvorgängen.
