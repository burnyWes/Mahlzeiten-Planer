---
date: 2026-09-19T19:55:26.117481+00:00
git_commit: e9f7e063fec049889d0bb3d1853653e4c722895b
branch: main
story: MZP-009
topic: "Wochenplan mit Zufallsauswahl"
tags: [plan, meals, shopping, navigation, ui, firestore]
status: ready
---

# PLAN: MZP-009 — Wochenplan mit Zufallsauswahl

Die Navigationsleiste bekommt an zweiter Stelle den Tab „Woche". Dahinter liegt eine
Seite mit sieben Zeilen — Montag bis Sonntag —, in denen je ein gespeichertes Gericht
ausgewählt werden kann. Jede Zeile hat einen Zufallsknopf, am unteren Rand sitzen zwei
weitere: „Zufallsauswahl generieren" füllt alle sieben Tage, „Auf die Einkaufsliste"
schiebt die Zutaten aller geplanten Gerichte auf die Liste. Der Plan liegt in Firestore
und ist auf beiden Geräten derselbe.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-19.

## Akzeptanzkriterien

- [ ] Die Navigationsleiste zeigt vier Einträge in dieser Reihenfolge: „Einkauf",
      „Woche", „Gerichte", Zahnrad. VoiceOver liest sie als „Einkaufsliste",
      „Wochenplan", „Gerichte", „Einstellungen". Nichts bricht um, die Schriftgröße
      bleibt unverändert.
- [ ] „Woche" öffnet eine Seite mit der Überschrift „Wochenplan, 5 von 7" (ohne
      geplanten Tag: „Wochenplan, keine von 7"). Die Überschrift bekommt beim Öffnen
      den Fokus.
- [ ] Darunter stehen sieben Zeilen „Mo." bis „So.", je mit einem Auswahlfeld und einem
      Zufallsknopf. Das Auswahlfeld listet „Kein Gericht" und darunter alle
      gespeicherten Gerichte alphabetisch.
- [ ] VoiceOver liest eine Zeile als „Montag, Popup-Schaltfläche, Bolognese" und den
      Knopf daneben als „Zufallsgericht für Montag". Der sichtbare Text „Mo." wird
      nicht zusätzlich vorgelesen.
- [ ] Eine Auswahl von Hand wird sofort gespeichert. Die App sagt dazu **nichts**
      Eigenes — VoiceOver meldet die Auswahl selbst.
- [ ] Der Plan liegt im Firestore-Dokument `weekPlan/current` und ist auf beiden
      Geräten derselbe. Er übersteht Neuladen und das Schließen der App.
- [ ] Ein Gericht, das es nicht mehr gibt, zeigt in seiner Zeile „Kein Gericht" und
      wird bei der Übergabe an die Einkaufsliste übersprungen.
- [ ] Am unteren Rand sitzt eine fixierte Leiste mit zwei Symbolknöpfen: Shuffle-Pfeile
      („Zufallsauswahl generieren") und Einkaufswagen („Auf die Einkaufsliste"). Beide
      teilen sich die Breite, wie auf der Gerichtsansicht.
- [ ] Der Zufallsknopf einer Zeile würfelt für diesen Tag ein Gericht und sagt
      „Montag, Pizza."
- [ ] Der Zufallsknopf unten überschreibt **alle sieben** Zeilen, auch von Hand
      gewählte, und sagt „Wochenplan neu gewürfelt, 7 Gerichte."
- [ ] Gewürfelt wird aus den Gerichten, die im Plan am seltensten vorkommen. Bei
      mindestens sieben Gerichten wiederholt sich keines; bei weniger verteilen sich die
      Wiederholungen reihum. Ein Test belegt das mit fester Zufallsfolge.
- [ ] Der Zufallsknopf einer Zeile liefert ein anderes Gericht als das, das dort steht,
      solange ein Gericht im Plan seltener vorkommt. Stehen alle Gerichte gleich oft im
      Plan, kann derselbe Name wieder herauskommen.
- [ ] Der Einkaufswagen legt die Zutaten aller geplanten Gerichte auf die
      Einkaufsliste, gleiche Artikel zählen zusammen. Ansage: „Wochenplan, 14 Artikel
      hinzugefügt. 3 zusammengefasst." Ein geplantes Gericht ohne Zutaten wird genannt,
      auch wenn es an zwei Tagen steht nur einmal. Der Plan bleibt danach unverändert
      stehen.
- [ ] Ohne gespeicherte Gerichte steht „Noch keine Gerichte gespeichert." über den
      Zeilen, und alle Zufallsknöpfe sind deaktiviert. Der Einkaufswagen ist
      deaktiviert, solange keine Zeile ein Gericht hat.
- [ ] Die axe-Prüfung der neuen Seite bleibt ohne Befund, auch mit invertierten Farben.
- [ ] `test/palette.test.ts` bleibt grün: das neue Auswahlfeld benutzt ausschließlich
      Farbtoken.
- [ ] `firestore.rules` gibt `weekPlan` dem Haushalt frei und sperrt es für fremde und
      nicht angemeldete Zugriffe; `npm run test:rules` belegt beides.

## Wesentliche Entscheidungen und Abwägungen

1. **Der Wochenplan lebt im Kontext `meals`.**
   - Warum: Er braucht `Meal` direkt — für die Auswahlliste und für die Zutaten. Ein
     dritter Kontext bräuchte wegen der eslint-Grenzen ein eigenes Modell und eine
     Übersetzungsschicht in `SignedInApp`.
   - Auswirkung: Neue Dateien unter `src/meals/domain`, `src/meals/api`,
     `src/meals/ui`. Die Übergabe an die Einkaufsliste bleibt wie heute in
     `SignedInApp` (`src/SignedInApp.tsx:72-79`), die Grenzen in `eslint.config.js`
     bleiben unverändert. `AddToShoppingListIcon` bleibt liegen, wo es liegt.
2. **Der Plan ist ein einziges Firestore-Dokument `weekPlan/current` mit sieben
   Feldern.**
   - Warum: Ein Haushaltsplan, eine Momentaufnahme. Kein Zusammenführen mehrerer
     Dokumente, keine Reihenfolgefrage.
   - Auswirkung: `firestore.rules` bekommt einen Eintrag und muss nach der Freigabe
     **einmal von Hand ausgerollt** werden
     (`npx firebase deploy --only firestore:rules --project mahlzeiten-planer-ecd26`),
     sonst weist die Produktion jeden Zugriff auf den Plan ab (README, Abschnitt
     *Firebase absichern*).
3. **Der Plan speichert Gericht-Ids, keine Namen.**
   - Warum: Ein umbenanntes Gericht soll im Plan mitwandern.
   - Auswirkung: Ein gelöschtes Gericht hinterlässt eine verwaiste Id. Die Zeile zeigt
     dann „Kein Gericht", die Übergabe überspringt sie, und der Eintrag verschwindet
     beim nächsten Schreiben von selbst. Kein Zusatzcode im Löschvorgang.
4. **Die Zufallsauswahl ist eine Kette reiner Regeln (`PlanningRule`).**
   - Warum: „Am seltensten im Plan" ist heute die einzige Regel, weitere („Freitag
     Fisch", „kein Aufwand unter der Woche") sollen ohne Umbau dazukommen.
   - Auswirkung: Eine Regel engt die Auswahl ein; eine Regel, die nichts übrig ließe,
     wird übersprungen. Die Zufallsquelle wird als `() => number` hereingegeben — die
     Domäne bleibt rein, die Tests deterministisch. `SignedInApp` bekommt dafür einen
     Parameter `random = Math.random`, wie `App.tsx` schon `storageWarning = ''` hat.
5. **„Am seltensten im Plan" zählt den ganzen Plan, einschließlich des Tages, der
   gerade gewürfelt wird.**
   - Warum: Dann liefert der Zufallsknopf einer Zeile ein anderes Gericht als das, das
     dort steht — genau das, was man beim zweiten Druck erwartet, solange es ein
     seltener eingeplantes Gericht gibt.
   - Auswirkung: Bei nur einem gespeicherten Gericht bleibt es bei diesem Gericht. Sind
     alle Gerichte gleich oft eingeplant, kann auch dasselbe wieder herauskommen — das
     ist die Grenze der Regel, keine Ausnahme von ihr.
6. **Die Navigationsleiste trennt sichtbaren Text und vorgelesenen Namen.**
   - Warum: Vier Einträge passen bei 390 pt nur mit kurzen Wörtern; „Einkaufsliste"
     braucht bei 18 px etwa 117 px, verfügbar sind rund 95 px inklusive Polsterung.
     VoiceOver soll trotzdem die vollen Wörter lesen.
   - Auswirkung: `Area` bekommt ein Feld `text`. Ist es gesetzt, steht es sichtbar im
     Knopf und `aria-label` trägt das volle Wort. Der sichtbare Text ist jeweils ein
     Teil des vorgelesenen Namens („Einkauf" in „Einkaufsliste", „Woche" in
     „Wochenplan"), damit bleibt die axe-Regel `label-in-name` erfüllt. Alle
     bestehenden Tests suchen über den Namen und bleiben gültig.
7. **Das Auswahlfeld bleibt ein natives `<select>` in Systemdarstellung.**
   - Warum: Auf dem iPhone öffnet das die vertraute Systemauswahl, die mit VoiceOver
     zuverlässig funktioniert. Es ist das erste `<select>` im Projekt.
   - Auswirkung: Kein `appearance: none` und kein selbst gezeichneter Pfeil — damit
     kommt auch keine Farbangabe außerhalb der Palette ins Stylesheet
     (`test/palette.test.ts:59-61`). Gesetzt werden nur Schrift, Polsterung, Rand und
     die Token `--surface`, `--ink`, `--fieldBorder`.
8. **Der Wochentag steht als `aria-hidden`-Text neben dem Feld, nicht als `<label>`.**
   - Warum: Sichtbar soll „Mo." stehen, vorgelesen „Montag". Ein `<label>` mit „Mo."
     plus `aria-label` am Feld wäre widersprüchlich; ein sichtbares Wort, das nicht
     vorgelesen wird, muss ausgeblendet werden.
   - Auswirkung: `<span aria-hidden="true">Mo.</span>` und `aria-label="Montag"` am
     `<select>`. Das Feld hat keinen sichtbaren Eigentext, `label-in-name` greift
     nicht.
9. **`WeekPlanArea` hält den Ablauf, `WeekPlanPage` stellt nur dar.**
   - Warum: Dasselbe Muster wie `ShoppingArea`/`ShoppingListPage` und
     `MealsArea`/`MealListPage`. Würfeln und Ansagen gehören nicht in die Darstellung.
   - Auswirkung: Drei Komponenten — `WeekPlanArea`, `WeekPlanPage`, `WeekPlanRow`.
     `SignedInApp` bleibt so dünn wie heute.
10. **Das Auswahlfeld wird in Phase 4 durchsuchbar (nachgetragen am 2026-09-19).**
    - Warum: Bei hundert Gerichten ist Scrollen der langsamere Weg, wenn der Name schon
      feststeht.
    - Auswirkung: Entscheidung 7 gilt nur bis Phase 4. Welcher Weg es wird — Textfeld
      mit Vorschlagsliste oder gemeinsames Suchfeld —, steht dort offen und wird vor
      Beginn der Phase entschieden.
11. **`ShuffleIcon` liegt in `src/meals/ui`, nicht in `src/shared/ui`.**
    - Warum: Beide Verwendungen liegen im Kontext `meals` — wie `EditIcon` und
      `AddToShoppingListIcon`. `shared/ui` ist kein Ablageort für Übriggebliebenes.
    - Auswirkung: Wandert erst nach `shared/ui`, wenn ein zweiter Kontext das Symbol
      braucht.

## Ausgangslage

Die Schale entscheidet, die Kontexte kennen sich nicht:

```
src/main.tsx                Firestore-Clients bauen
  └─ App.tsx                Anmeldung, Announcer, Update-Hinweis
      └─ SignedInApp.tsx    AREAS, activeArea, Brücke meals -> shopping
          ├─ ShoppingArea       (shopping/ui)
          ├─ MealsArea          (meals/ui)
          ├─ KnownItemsArea     (shopping/ui)
          └─ SettingsPage       (shared/ui)
```

`src/SignedInApp.tsx:21-25` hält die Tab-Liste, `:72-79` ist die einzige Stelle, an der
ein Gericht die Einkaufsliste erreicht. `eslint.config.js:8,40-53` verbietet jeden
Import von `meals` in `shopping` und umgekehrt, abgesichert durch
`test/domainLayerBoundary.test.ts:111-173`. Nur `src/*.tsx` darf beides sehen.

Heutige Navigation (`src/shared/ui/NavigationBar.tsx`, `src/index.css:56-99`) — die
Text-Tabs `flex: 1`, das Zahnrad `flex: none`:

```
┌──────────────────────────────────────────────┐
│ [ Einkaufsliste ][   Gerichte   ][ ⚙ ]       │
└──────────────────────────────────────────────┘
```

`aria-label` wird heute **nur** gesetzt, wenn der Eintrag ein Symbol hat
(`NavigationBar.tsx:31`).

Vorhandenes, das wiederverwendet wird:

| Baustein | Ort | wofür |
|---|---|---|
| `BottomBar` | `src/shared/ui/BottomBar.tsx` | fixierte Leiste, löst sich bei offener Tastatur |
| `AddToShoppingListIcon` | `src/meals/ui/AddToShoppingListIcon.tsx` | Einkaufswagen unten |
| `iconButton`, `buttonIcon` | `src/index.css:341-354` | Symbolknöpfe in der Zeile |
| `itemList` | `src/index.css:177-186` | Liste mit Trennlinien |
| `useHeadingFocus` | `src/shared/ui/useHeadingFocus.ts` | Fokus auf die h1 |
| `byName` | `src/meals/domain/meal.ts:79-83` | alphabetische Auswahlliste |
| `shoppingList.addItems` | `src/shopping/ui/useShoppingList.ts:146-156` | viele Artikel in einem Zug |
| `additionsAnnouncement` | `src/shopping/domain/announcements.ts:39-50` | „14 Artikel hinzugefügt. 3 zusammengefasst." |
| `mealWithoutItemsAnnouncement` | `src/meals/domain/announcements.ts:74-76` | „Suppe hat keine Einkaufs-Items." |
| `createInMemoryMealsClient` | `src/meals/api/inMemoryMealsClient.ts` | Vorbild für den neuen Fake |
| `createFirestoreMealsClient` | `src/meals/api/firestoreMealsClient.ts` | Vorbild für den neuen Adapter |

Zwei harte Randbedingungen:

1. `test/palette.test.ts:59-61` verbietet jede Farbangabe außerhalb der `:root`-Blöcke.
   Neues CSS darf nur Token benutzen. `:63-73` rechnet nach, dass jeder invertierte
   Token das exakte Komplement ist — neue Farben würden also **beide** Paletten
   betreffen. Dieser Plan führt keine neue Farbe ein.
2. Eine neue Firestore-Sammlung ist in der Produktion gesperrt, bis `firestore.rules`
   von Hand ausgerollt wird (`firestore.rules:9-24`, README, `docs/notes.txt`).

In `docs/notes.txt` stehen unter TODO `- Wochenplaner` und `- Später erweitern zu …
Einkaufsliste | Wochenplaner | Gerichte | Einstellungen`.

## Zielbild

```
┌────────────────────────────────────────┐
│ [Einkauf][ Woche ][Gerichte][ ⚙ ]      │ ← sticky, "Woche" aria-current
├────────────────────────────────────────┤
│ Wochenplan, 5 von 7                 h1 │
│                                        │
│ Mo.  [ Bolognese           ▾ ]  [ ⇄ ]  │
│ Di.  [ Kein Gericht        ▾ ]  [ ⇄ ]  │
│ Mi.  [ Linsensuppe         ▾ ]  [ ⇄ ]  │
│ Do.  [ Ofengemüse          ▾ ]  [ ⇄ ]  │
│ Fr.  [ Pizza               ▾ ]  [ ⇄ ]  │
│ Sa.  [ Kein Gericht        ▾ ]  [ ⇄ ]  │
│ So.  [ Braten              ▾ ]  [ ⇄ ]  │
│                                        │
├────────────────────────────────────────┤
│ [     ⇄      ][     🛒+     ]           │ ← fixiert, je 3rem hoch
│           (Home-Indikator)             │
└────────────────────────────────────────┘
```

Ohne gespeicherte Gerichte:

```
│ Wochenplan, keine von 7             h1 │
│ Noch keine Gerichte gespeichert.       │
│ Mo.  [ Kein Gericht        ▾ ]  [ ⇄ ]  │ ← Knopf deaktiviert
│ …                                      │
├────────────────────────────────────────┤
│ [    ⇄ aus   ][   🛒+ aus   ]           │
```

Was VoiceOver in einer Zeile liest:

```
"Montag, Popup-Schaltfläche, Bolognese"
"Zufallsgericht für Montag, Schaltfläche"
```

Datenfluss der Übergabe — die Brücke bleibt in der Schale:

```
WeekPlanArea (meals/ui)
   │ plannedMeals(plan, meals)          Wochentagsreihenfolge, ohne Leere
   ▼
SignedInApp.addWeekPlanToShoppingList(planned)
   ├─ shoppingList.addItems(shoppingItemsOf(planned))   (shopping)
   └─ announce(weekPlanTransferAnnouncement(
                 additionsAnnouncement(summary),        (shopping)
                 mealsWithoutItems(planned)))           (meals)
```

Datenfluss des Würfelns — die Domäne entscheidet, die Schale liefert nur den Zufall:

```
WeekPlanArea
   ├─ pickMealForDay(meals, plan, day, random) ──▶ PLANNING_RULES ──▶ pickRandom
   └─ filledWeekPlan(meals, random)            ──▶ je Wochentag dasselbe
```

Das Dokument in Firestore:

```
weekPlan/current
{
  monday:    "meal-7",
  tuesday:   null,
  wednesday: "meal-2",
  thursday:  null,
  friday:    "meal-5",
  saturday:  null,
  sunday:    "meal-1"
}
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `weekPlan.ts` — **neu**: die Gestalt des Plans, ohne Zufall
    - `WEEKDAYS`, `Weekday` — Montag bis Sonntag als Tupel
    - `WeekPlan` — `Readonly<Record<Weekday, MealId | null>>`
    - `EMPTY_WEEK_PLAN`, `withMealOnDay`, `shownMealOn`, `plannedMeals`,
      `plannedDayCount`, `mealsWithoutItems`
  - `weekPlan.test.ts` — **neu**
  - `randomPlanning.ts` — **neu**: die Regelkette und das Ziehen
    - `RandomSource`, `PlanningRule`, `rarestInThePlan`, `PLANNING_RULES`,
      `pickMealForDay`, `filledWeekPlan`
  - `randomPlanning.test.ts` — **neu**
  - `announcements.ts` — erweitert um die deutschen Texte
    - `weekdayName`, `weekdayAbbreviation`, `weekPlanHeading`, `randomMealLabel`,
      `dayPlannedAnnouncement`, `weekPlanShuffledAnnouncement`,
      `weekPlanTransferAnnouncement`
  - `announcements.test.ts` — erweitert
- `src/meals/api`
  - `weekPlanClient.ts` — **neu**: `observeWeekPlan`, `writeWeekPlan`
  - `inMemoryWeekPlanClient.ts` — **neu**, Vorbild `inMemoryMealsClient.ts`
  - `firestoreWeekPlanClient.ts` — **neu**, Vorbild `firestoreMealsClient.ts`
- `src/meals/ui`
  - `useWeekPlan.ts` — **neu**: beobachtet den Plan, schreibt optimistisch
  - `WeekPlanArea.tsx` — **neu**: Ablauf, Würfeln, Ansagen
  - `WeekPlanPage.tsx` — **neu**: Überschrift, Hinweis, sieben Zeilen, Leiste
  - `WeekPlanRow.tsx` — **neu**: Wochentag, Auswahlfeld, Zufallsknopf
  - `ShuffleIcon.tsx` — **neu**: kreuzende Pfeile im Stil von `EditIcon`
  - `WeekPlanArea.test.tsx` — **neu**
- `src/shared/ui`
  - `NavigationBar.tsx` — `Area` bekommt `text`, `aria-label` auch ohne Symbol
- `src/`
  - `SignedInApp.tsx` — vierter Tab, `WeekPlanClient`, `random`,
    `addWeekPlanToShoppingList`; `shoppingItemsOf` nimmt künftig eine Liste
  - `App.tsx`, `main.tsx` — `createWeekPlanClient` durchreichen und bauen
  - `SignedInApp.test.tsx`, `App.test.tsx` — neuer Client in den Testaufbauten
  - `index.css` — `select` in die bestehenden Feldregeln, `.weekPlanRow`, `.weekday`
- Wurzel
  - `firestore.rules` — `match /weekPlan/{document}`
  - `firestore.rules.test.ts` — vier Fälle für `weekPlan`
  - `e2e/weekPlan.spec.ts` — **neu**: ein Ablauf über die Tastatur
  - `docs/notes.txt` — erledigte Punkte abhaken

Nicht angefasst: `eslint.config.js` (kein neuer Kontext),
`test/domainLayerBoundary.test.ts`, `test/palette.test.ts`, `README.md` (der
Rules-Deploy steht dort schon).

## Logging und Beobachtbarkeit

Die App hat kein Logging; beobachtbar ist nur, was der `Announcer` sagt. Neu sind:

```
"Montag, Pizza."                                          Zufall in einer Zeile
"Wochenplan neu gewürfelt, 7 Gerichte."                   Zufall für die Woche
"Wochenplan, 14 Artikel hinzugefügt. 3 zusammengefasst."  Übergabe
"Wochenplan, 6 Artikel hinzugefügt. Suppe hat keine Einkaufs-Items."
"Konnte nicht gespeichert werden."                        Schreibfehler (vorhanden)
```

Eine Auswahl von Hand sagt nichts — dieselbe Entscheidung wie beim Schalter „Farben
invertieren" (MZP-008).

## Umsetzung

### Phase 1: Der Tab „Woche" und der Plan zur Auswahl von Hand

Abhängigkeiten: keine

Die Seite entsteht vollständig, aber ohne Zufall und ohne Übergabe: vierter Tab, sieben
Zeilen mit Auswahlfeld, Speicherung in Firestore. Damit ist der Wochenplan schon von
Hand benutzbar.

**Aufgaben**:

- [x] `src/meals/domain/weekPlan.test.ts` schreiben — erst die fehlschlagenden Tests:
      `withMealOnDay` ersetzt genau einen Tag, `null` leert ihn; `plannedMeals` gibt die
      Gerichte in Wochentagsreihenfolge und überspringt leere **und** verwaiste Ids;
      `plannedDayCount` zählt nur Tage mit vorhandenem Gericht; `shownMealOn` gibt bei
      verwaister Id `null`; `mealsWithoutItems` liefert jedes Gericht ohne Items genau
      einmal, auch wenn es an zwei Tagen steht.
- [x] `src/meals/domain/weekPlan.ts` anlegen

      ```ts
      export const WEEKDAYS = [
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday',
      ] as const

      export type Weekday = (typeof WEEKDAYS)[number]

      export type WeekPlan = Readonly<Record<Weekday, MealId | null>>

      export function withMealOnDay(
        plan: WeekPlan, day: Weekday, id: MealId | null,
      ): WeekPlan {
        return { ...plan, [day]: id }
      }

      export function shownMealOn(
        plan: WeekPlan, day: Weekday, meals: readonly Meal[],
      ): Meal | null {
        return meals.find((meal) => meal.id === plan[day]) ?? null
      }

      export function plannedMeals(
        plan: WeekPlan, meals: readonly Meal[],
      ): readonly Meal[] {
        return WEEKDAYS.map((day) => shownMealOn(plan, day, meals)).filter(
          (meal): meal is Meal => meal !== null,
        )
      }
      ```

- [x] `src/meals/domain/announcements.ts` um `weekdayName`, `weekdayAbbreviation` und
      `weekPlanHeading` erweitern, Tests in `announcements.test.ts` voran

      ```ts
      export function weekPlanHeading(plannedDays: number): string {
        return plannedDays === 0
          ? `Wochenplan, keine von ${WEEKDAYS.length}`
          : `Wochenplan, ${plannedDays} von ${WEEKDAYS.length}`
      }
      ```

- [x] `src/meals/api/weekPlanClient.ts` anlegen

      ```ts
      export interface WeekPlanClient {
        observeWeekPlan(onWeekPlan: (plan: WeekPlan) => void): () => void
        writeWeekPlan(plan: WeekPlan): void
      }
      ```

- [x] `src/meals/api/inMemoryWeekPlanClient.ts` anlegen, nach dem Muster von
      `inMemoryMealsClient.ts`: `createInMemoryWeekPlanClient(initialPlan = EMPTY_WEEK_PLAN)`
      mit `weekPlanArrivesFromElsewhere` und `storedWeekPlan`.
- [x] `src/meals/api/firestoreWeekPlanClient.ts` anlegen — ein Dokument, ganz
      geschrieben, Fehler über `onWriteFailure` wie in `firestoreMealsClient.ts:67-69`

      ```ts
      const WEEK_PLAN = 'weekPlan'
      const CURRENT = 'current'

      function toWeekPlan(stored: DocumentData | undefined): WeekPlan {
        return WEEKDAYS.reduce(
          (plan, day) => ({
            ...plan,
            [day]: typeof stored?.[day] === 'string' ? stored[day] : null,
          }),
          EMPTY_WEEK_PLAN,
        )
      }
      ```

- [x] `src/meals/ui/useWeekPlan.ts` anlegen — beobachtet und schreibt optimistisch,
      damit das Auswahlfeld auch offline sofort sitzt

      ```ts
      export type WeekPlanning = {
        plan: WeekPlan
        chooseMeal: (day: Weekday, id: MealId | null) => void
        replacePlan: (plan: WeekPlan) => void
      }
      ```

- [x] `src/shared/ui/NavigationBar.tsx`: `Area` um `text?: string` erweitern; sichtbar
      ist `area.icon ?? area.text ?? area.label`, `aria-label` wird gesetzt, sobald
      `icon` **oder** `text` da ist.
- [x] `src/meals/ui/WeekPlanRow.tsx` anlegen

      ```tsx
      <li className="weekPlanRow">
        <span className="weekday" aria-hidden="true">
          {weekdayAbbreviation(day)}
        </span>
        <select
          aria-label={weekdayName(day)}
          value={shownMealOn(plan, day, meals)?.id ?? ''}
          onChange={(event) =>
            onChooseMeal(day, event.target.value === '' ? null : event.target.value)
          }
        >
          <option value="">Kein Gericht</option>
          {meals.map((meal) => (
            <option key={meal.id} value={meal.id}>{meal.name}</option>
          ))}
        </select>
      </li>
      ```

      Der Zufallsknopf der Zeile kommt in Phase 2 dazu.
- [x] `src/meals/ui/WeekPlanPage.tsx` anlegen: `navigation`, `<main className="page
      pageBelowNavigation">`, `useHeadingFocus`, `weekPlanHeading(plannedDayCount(...))`,
      bei `meals.length === 0` ein `<p>Noch keine Gerichte gespeichert.</p>`, darunter
      `<ul className="itemList">` mit den sieben `WeekPlanRow`.
- [x] `src/meals/ui/WeekPlanArea.tsx` anlegen: nimmt `meals`, `weekPlanning`,
      `navigation` und gibt `onChooseMeal` an die Seite weiter. Sagt **nichts** an.
- [x] `src/SignedInApp.tsx`: `AREAS` auf vier Einträge, `createWeekPlanClient` als Prop,
      `useWeekPlan`, Zweig für `activeArea === 'weekPlan'`

      ```tsx
      const AREAS = [
        { id: 'shopping', label: 'Einkaufsliste', text: 'Einkauf' },
        { id: 'weekPlan', label: 'Wochenplan', text: 'Woche' },
        { id: 'meals', label: 'Gerichte' },
        { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
      ] as const satisfies readonly Area<string>[]
      ```

- [x] `src/App.tsx` und `src/main.tsx`: `createWeekPlanClient` durchreichen und aus
      `createFirestoreWeekPlanClient(firestore, onWriteFailure)` bauen.
- [x] `src/index.css`: `select` in die Regeln `button, input, textarea` (`:101-106`) und
      `input, textarea` (`:120-127`) aufnehmen, dazu

      ```css
      .weekPlanRow {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .weekday {
        flex: none;
        min-width: 2.5rem;
      }

      .weekPlanRow select {
        flex: 1;
        min-width: 0;
      }
      ```

- [x] `firestore.rules`: `match /weekPlan/{document} { allow read, write: if isHousehold(); }`
- [x] `firestore.rules.test.ts`: vier Fälle für `weekPlan` — Haushalt schreibt,
      Haushalt liest, fremdes Konto abgewiesen, nicht angemeldet abgewiesen.
- [x] `src/meals/ui/WeekPlanArea.test.tsx` anlegen: sieben Zeilen „Mo." bis „So.", jedes
      Auswahlfeld heißt nach dem vollen Wochentag, die Auswahl listet „Kein Gericht" und
      die Gerichte alphabetisch, eine Auswahl landet im Fake-Client und sagt nichts an,
      ein von außen eintreffender Plan zeigt sich, ein gelöschtes Gericht zeigt „Kein
      Gericht", ohne Gerichte steht der Hinweis, axe ohne Befund.
- [x] `src/SignedInApp.test.tsx` und `src/App.test.tsx`: neuen Client in die
      Testaufbauten, Reihenfolge und Namen der vier Tabs prüfen, Wechsel auf „Wochenplan"
      setzt `aria-current` und den Fokus auf die Überschrift.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, darunter `weekPlan.test.ts`, `announcements.test.ts`,
      `WeekPlanArea.test.tsx`, `SignedInApp.test.tsx`
- [x] `test/palette.test.ts` bleibt grün (keine Farbe außerhalb der Palette)
- [x] `test/domainLayerBoundary.test.ts` bleibt grün
- [x] `npm run test:rules` läuft grün, darunter die vier neuen `weekPlan`-Fälle
- [x] `npm run lint` und `npm run build` laufen durch
- [x] `npm run format:check` läuft durch

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: die vier Tabs werden als „Einkaufsliste",
      „Wochenplan", „Gerichte", „Einstellungen" gelesen und nichts bricht um.
- [x] Eine Zeile wird als „Montag, Popup-Schaltfläche, Bolognese" gelesen; das
      Auswahlfeld öffnet die Systemauswahl und lässt sich damit bedienen.
- [x] Eine Auswahl erscheint auf dem zweiten Gerät und übersteht das Schließen und
      erneute Öffnen der App.
- [x] Vor dieser Prüfung in der Produktion:
      `npx firebase deploy --only firestore:rules --project mahlzeiten-planer-ecd26`

### Phase 2: Zufallsauswahl je Zeile und für die ganze Woche

Abhängigkeiten: Phase 1

Die Regelkette entsteht test-getrieben, dann die drei Knöpfe: einer je Zeile und der
linke der beiden unten.

**Aufgaben**:

- [x] `src/meals/domain/randomPlanning.test.ts` schreiben — mit fester Zufallsfolge
      (`sequence([0, 0.9, …])`), erst fehlschlagend:
      `rarestInThePlan` behält nur die Gerichte mit der kleinsten Anzahl im Plan; eine
      Regel, die nichts übrig ließe, wird übersprungen; `pickMealForDay` gibt bei leerer
      Auswahl `null`; `pickMealForDay` meidet das Gericht, das an diesem Tag steht,
      sobald ein anderes im Plan seltener vorkommt; `filledWeekPlan` füllt bei sieben Gerichten alle
      sieben Tage ohne Wiederholung; bei drei Gerichten kommt jedes zwei- bis dreimal
      und die Anzahl unterscheidet sich um höchstens eins — am Rundenwechsel darf
      dasselbe Gericht auch zweimal hintereinander stehen; `random()` am Rand (0 und
      knapp unter 1) läuft nicht aus dem Feld.
- [x] `src/meals/domain/randomPlanning.ts` anlegen

      ```ts
      export type RandomSource = () => number

      export type PlanningRule = (
        candidates: readonly Meal[],
        plan: WeekPlan,
        day: Weekday,
      ) => readonly Meal[]

      function timesPlanned(plan: WeekPlan, meal: Meal): number {
        return WEEKDAYS.filter((day) => plan[day] === meal.id).length
      }

      export const rarestInThePlan: PlanningRule = (candidates, plan) => {
        const fewest = Math.min(
          ...candidates.map((meal) => timesPlanned(plan, meal)),
        )
        return candidates.filter(
          (meal) => timesPlanned(plan, meal) === fewest,
        )
      }

      export const PLANNING_RULES: readonly PlanningRule[] = [rarestInThePlan]

      function narrowed(
        candidates: readonly Meal[], plan: WeekPlan, day: Weekday,
      ): readonly Meal[] {
        return PLANNING_RULES.reduce((left, rule) => {
          const narrowedByRule = rule(left, plan, day)
          return narrowedByRule.length === 0 ? left : narrowedByRule
        }, candidates)
      }

      export function pickMealForDay(
        candidates: readonly Meal[],
        plan: WeekPlan,
        day: Weekday,
        random: RandomSource,
      ): Meal | null {
        if (candidates.length === 0) return null
        const left = narrowed(candidates, plan, day)
        return left[Math.min(Math.floor(random() * left.length), left.length - 1)]
      }

      export function filledWeekPlan(
        candidates: readonly Meal[], random: RandomSource,
      ): WeekPlan {
        return WEEKDAYS.reduce((plan, day) => {
          const picked = pickMealForDay(candidates, plan, day, random)
          return picked === null ? plan : withMealOnDay(plan, day, picked.id)
        }, EMPTY_WEEK_PLAN)
      }
      ```

- [x] `src/meals/domain/announcements.ts` um `randomMealLabel(day)`,
      `dayPlannedAnnouncement(day, meal)` und `weekPlanShuffledAnnouncement()`
      erweitern, Tests voran.
- [x] `src/meals/ui/ShuffleIcon.tsx` anlegen — kreuzende Pfeile, `viewBox="0 0 24 24"`,
      `stroke="currentColor"`, `strokeWidth="2"`, `aria-hidden="true"`,
      `focusable="false"`, Klasse `buttonIcon`, genau wie `EditIcon.tsx`.
- [x] `WeekPlanRow.tsx`: Zufallsknopf ergänzen

      ```tsx
      <button
        type="button"
        className="iconButton"
        aria-label={randomMealLabel(day)}
        disabled={meals.length === 0}
        onClick={() => onShuffleDay(day)}
      >
        <ShuffleIcon />
      </button>
      ```

- [x] `WeekPlanPage.tsx`: `BottomBar` mit dem linken Knopf ergänzen — nur Symbol,
      `aria-label="Zufallsauswahl generieren"`, deaktiviert ohne gespeicherte Gerichte.
      Der Einkaufswagen kommt in Phase 3 daneben.
- [x] `WeekPlanArea.tsx`: Würfeln und Ansagen

      ```tsx
      function shuffleDay(day: Weekday) {
        const picked = pickMealForDay(meals, weekPlanning.plan, day, random)
        if (picked === null) return
        weekPlanning.chooseMeal(day, picked.id)
        announce(dayPlannedAnnouncement(day, picked))
      }

      function shuffleWeek() {
        weekPlanning.replacePlan(filledWeekPlan(meals, random))
        announce(weekPlanShuffledAnnouncement())
      }
      ```

- [x] `src/SignedInApp.tsx`: Parameter `random: RandomSource = Math.random` aufnehmen
      und an `WeekPlanArea` weitergeben.
- [x] `WeekPlanArea.test.tsx` erweitern: der Zufallsknopf einer Zeile heißt
      „Zufallsgericht für Montag", füllt genau diese Zeile und sagt „Montag, Pizza.";
      ein zweiter Druck liefert bei zwei Gerichten das andere; der Knopf unten
      überschreibt alle sieben Zeilen, auch eine von Hand gewählte, und sagt „Wochenplan
      neu gewürfelt, 7 Gerichte."; beide Knöpfe sind ohne Gerichte deaktiviert; der
      gewürfelte Plan landet im Fake-Client; axe ohne Befund, auch nach dem Würfeln.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, darunter `randomPlanning.test.ts` mit der festen
      Zufallsfolge
- [x] Ein Test belegt: sieben Gerichte, ein Druck auf „Zufallsauswahl generieren" ergibt
      sieben **verschiedene** Gerichte
- [x] Ein Test belegt: drei Gerichte über sieben Tage kommen dreimal, zweimal,
      zweimal vor — die Anzahl unterscheidet sich um höchstens eins
- [x] `npm run lint`, `npm run build`, `npm run format:check` laufen durch

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: der Knopf in der Zeile wird als „Zufallsgericht für
      Montag" gelesen, und nach dem Druck ist zu hören, was gewürfelt wurde.
- [x] Die Leiste unten bleibt beim Scrollen am Bildschirmrand, und der Knopf darin wird
      als „Zufallsauswahl generieren" gelesen.

### Phase 3: Der Wochenplan auf die Einkaufsliste

Abhängigkeiten: Phase 2

Der zweite Knopf der Leiste übergibt die Zutaten aller geplanten Gerichte. Die Brücke
zwischen den Kontexten bleibt in `SignedInApp`.

**Aufgaben**:

- [x] `src/meals/domain/announcements.ts` um `weekPlanTransferAnnouncement` erweitern,
      Test voran

      ```ts
      export function weekPlanTransferAnnouncement(
        additions: string,
        mealsWithoutItems: readonly NewMeal[],
      ): string {
        const hints = mealsWithoutItems.map(mealWithoutItemsAnnouncement)
        if (additions === '') return hints.join(' ')
        return [`Wochenplan, ${additions}`, ...hints].join(' ')
      }
      ```

- [x] `src/SignedInApp.tsx`: `shoppingItemsOf` nimmt eine Liste von Gerichten und
      vergibt ein gemeinsames `createdAt`; `addMealToShoppingList` ruft es mit `[meal]`

      ```tsx
      function shoppingItemsOf(meals: readonly Meal[]): readonly NewShoppingItem[] {
        const createdAt = Date.now()
        return meals.flatMap((meal) =>
          meal.items.map((item) => ({
            name: item.name, quantity: item.quantity, createdAt,
          })),
        )
      }

      function addWeekPlanToShoppingList(planned: readonly Meal[]) {
        const items = shoppingItemsOf(planned)
        const additions =
          items.length === 0
            ? ''
            : additionsAnnouncement(shoppingList.addItems(items))
        announce(weekPlanTransferAnnouncement(additions, mealsWithoutItems(planned)))
      }
      ```

- [x] `WeekPlanPage.tsx`: den Einkaufswagen in die `BottomBar` neben den Zufallsknopf,
      `aria-label="Auf die Einkaufsliste"`, deaktiviert solange kein Tag ein Gericht hat.
- [x] `WeekPlanArea.tsx`: `onAddToShoppingList` mit
      `plannedMeals(weekPlanning.plan, meals)` aufrufen; die Ansage macht `SignedInApp`.
- [x] `WeekPlanArea.test.tsx` erweitern: der Wagen ist bei leerem Plan deaktiviert und
      übergibt sonst die geplanten Gerichte in Wochentagsreihenfolge; ein verwaistes
      Gericht ist nicht dabei.
- [x] `src/SignedInApp.test.tsx` erweitern: ein Wochenplan aus zwei Gerichten mit
      gemeinsamer Zutat landet zusammengefasst auf der Einkaufsliste und sagt
      „Wochenplan, 3 Artikel hinzugefügt. 1 zusammengefasst."; ein geplantes Gericht ohne
      Items wird genannt, auch wenn es an zwei Tagen steht nur einmal; der Wochenplan
      bleibt nach der Übergabe unverändert; die Einkaufsliste behält ihre Reihenfolge und
      der Artikelkatalog zählt jede Zutat mit.
- [x] `e2e/weekPlan.spec.ts` anlegen: anmelden, ein Gericht mit zwei Zutaten anlegen, auf
      „Wochenplan" wechseln, für Montag das Gericht wählen, „Zufallsauswahl generieren"
      drücken, „Auf die Einkaufsliste" drücken, die Statuszeile prüfen, auf
      „Einkaufsliste" wechseln und die Artikel prüfen; neu laden und prüfen, dass der
      Plan noch steht.
- [x] `docs/notes.txt`: `- Wochenplaner` und `- Später erweitern zu … Einkaufsliste |
      Wochenplaner | Gerichte | Einstellungen` auf `x` setzen und nach DONE verschieben.
      Nichts umsortieren, nichts umformulieren.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, darunter die neuen Fälle in `SignedInApp.test.tsx`
- [x] `npm run test:e2e` läuft grün, darunter `e2e/weekPlan.spec.ts`
- [x] `npm run test:rules` läuft grün
- [x] `npm run lint`, `npm run build`, `npm run format:check` laufen durch

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver: „Auf die Einkaufsliste" wird gelesen, und nach dem
      Druck ist „Wochenplan, N Artikel hinzugefügt." zu hören; die Artikel stehen
      wirklich auf der Liste.
- [x] Mit invertierten Farben ist die Seite samt Auswahlfeldern und Leiste lesbar.

### Phase 4: Im Auswahlfeld tippen und die Gerichte filtern

Abhängigkeiten: Phase 3

Nachgetragen am 2026-09-19 auf Wunsch des Nutzers, nach der Abnahme von Phase 1: Wer
schon weiß, welches Gericht auf den Montag soll, will den Namen tippen, statt bei
hundert Gerichten durch die ganze Liste zu scrollen.

**Noch zu entscheiden, bevor diese Phase beginnt**: Ein natives `<select>` lässt sich
nicht durchsuchen — iOS springt beim Tippen nur an den ersten Treffer eines
Anfangsbuchstabens. Die Phase kippt damit Entscheidung 7. Zwei Wege stehen zur Wahl:

1. **Textfeld mit Vorschlagsliste**, wie beim Anlegen eines Einkaufs-Items
   (`src/shared/ui/NameSuggestions.tsx`, `suggestNames` in
   `src/shopping/domain/knownItem.ts`). Bewährtes Muster im Haus, mit VoiceOver schon
   erprobt, filtert nach beliebiger Stelle im Namen. Preis: die Zeile verliert die
   vertraute Systemauswahl, und jede Zeile braucht ihren eigenen Aufklapp-Zustand.
2. **Suchfeld über den sieben Zeilen**, das die Auswahlfelder gemeinsam eindampft. Die
   `<select>` bleiben, was sie sind. Preis: ein Feld für sieben Zeilen ist erklärungs-
   bedürftig, und der gewählte Eintrag einer Zeile darf beim Filtern nicht verschwinden.

Empfehlung: Weg 1 — er benutzt ein Muster, das in dieser App mit VoiceOver bereits
funktioniert, und hält die Zeile in sich geschlossen.

**Skizze für Weg 1** (erst nach der Entscheidung ausarbeiten):

- [ ] `src/meals/domain/mealSuggestions.ts` — reine Funktion `suggestMeals(meals, typed)`
      nach dem Vorbild von `suggestNames`, test-getrieben.
- [ ] `WeekPlanRow.tsx` — `<select>` weicht einem Textfeld mit
      `role="combobox"`-Verhalten plus `NameSuggestions`; der Name des gewählten
      Gerichts steht im Feld, ein leeres Feld bedeutet „Kein Gericht".
- [ ] `WeekPlanArea.test.tsx` — Tippen filtert, ein Vorschlag landet im Plan, axe ohne
      Befund.
- [ ] Manuell auf dem iPhone mit VoiceOver: Tippen, Filtern und Auswählen sind mit
      Sprachausgabe bedienbar; die Tastatur verdeckt die Vorschläge nicht.

## Notizen zur Umsetzung

- Phase 1: Der Nachweis „eine Auswahl von Hand sagt nichts Eigenes" steht in
  `src/SignedInApp.test.tsx`, nicht in `WeekPlanArea.test.tsx`. `WeekPlanArea` bekommt
  `announce` erst in Phase 2; in der Schale liegt die Ansage ohnehin, und die
  Schwesterprüfung von MZP-008 („says nothing of its own when the colours are
  inverted") steht an derselben Stelle.
- Phase 2: Die Regelkette heisst `narrowedBy(rules, …)` und ist ausgeführt statt privat.
  Der Plan verlangt einen Test dafür, dass eine Regel, die nichts übrig liesse,
  übersprungen wird — mit `rarestInThePlan` als einziger Regel in `PLANNING_RULES` kann
  dieser Fall sonst gar nicht auftreten. `pickMealForDay` ruft `narrowedBy` mit
  `PLANNING_RULES` auf, die Kette bleibt also eine.
- Phase 3: `takeOverItem` ist von `e2e/meals.spec.ts` nach `e2e/keyboard.ts` gewandert,
  dazu kamen `chooseInField` und `chosenInField` für das Auswahlfeld. Neu ist ausserdem
  `weekPlanOnServer()` in `e2e/emulatorHousehold.ts`: der Test wartet damit auf den
  Server, bevor er neu lädt — dieselbe Vorsichtsmassnahme wie in
  „keeps the added item after a reload", solange ausstehende Schreibvorgänge kein
  Neuladen überleben (`docs/notes.txt`).
- Phase 3: Der Artikelkatalog zählt eine Zutat **einmal je Übergabe**, auch wenn das
  Gericht an zwei Tagen steht — `planAdditions` fasst gleiche Namen vorher zusammen und
  `recordUse` läuft je Ergebnis. Der Test hält das so fest.

## Verweise

- Befragung vom 2026-09-19 (dieses Gespräch)
- `docs/agents/plans/2026-09-17-knopfleiste-am-unteren-rand.md` — `BottomBar`, feste
  Knopfhöhe, Verhalten bei offener Tastatur
- `docs/agents/plans/2026-09-18-farben-invertieren.md` — Farbtoken, Palettenprüfung, „die
  App sagt nichts Eigenes"
- `docs/agents/plans/2026-09-15-gerichteseite-und-navigationsleiste.md` —
  `NavigationBar`, Aufteilung Area/Page/Row
- `.claude/skills/architecture/references/typescript.md` — framework-freier Kern, Ports
  als Interface
- `README.md`, Abschnitt *Firebase absichern* — Regeln von Hand ausrollen
