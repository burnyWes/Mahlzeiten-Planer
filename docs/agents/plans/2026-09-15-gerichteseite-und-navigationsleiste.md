---
date: 2026-09-15
git_commit: 581f356ff8f98c1c01e26ceeb9997d95c976e159
branch: main
story: MZP-002
topic: "Gerichteseite und Navigationsleiste"
tags: [plan, meals, shopping, navigation, accessibility, firestore]
status: ready
---

# PLAN: MZP-002 — Gerichteseite und Navigationsleiste

Der Mahlzeiten-Planer bekommt seinen zweiten fachlichen Bereich. Eine feste Leiste am
oberen Rand führt zwischen **Einkaufsliste** und **Gerichte**. Ein Gericht trägt einen
Namen, eine kurze Liste von Einkaufs-Items, eine Zutatennotiz und ein Rezept — und lässt
sich mit einem Knopf auf die Einkaufsliste übertragen.

Vorlage sind die Punkte *Tab-Leiste oben fixiert*, *Gerichte-Seite* und der Use Case zum
doppelten Hinzufügen aus `docs/notes.txt`. Alle Entscheidungen stammen aus der Befragung
vom 2026-09-15.

## Akzeptanzkriterien

- [x] Eine Leiste am oberen Rand führt zwischen "Einkaufsliste" und "Gerichte"; der
      aktive Bereich trägt `aria-current="page"`, der Fokus springt beim Wechsel auf die
      Überschrift des neuen Bereichs.
- [x] Die Leiste bleibt beim Scrollen stehen und erscheint nur auf den beiden
      Hauptseiten, nicht auf Formular-, Ansichts- oder Bestätigungsseiten.
- [x] Ein Wechsel zu den Gerichten und zurück verändert die Einkaufsliste nicht:
      Reihenfolge, Zusammensetzung und die Anzahl offener Änderungen bleiben, als wäre
      man nie weg gewesen.
- [x] Nach einem Neustart der App ist die Einkaufsliste aktiv.
- [x] Wird ein Artikel hinzugefügt, dessen Name bereits offen auf der Liste steht,
      entsteht kein zweiter Eintrag: bei gleicher Einheit werden die Mengen addiert,
      fehlende Menge zählt als 1 ohne Einheit. Nur bei unterschiedlicher Einheit
      entstehen zwei Einträge, dann mit der heutigen Warnung.
- [x] Der zusammengeführte Eintrag behält seine Position in der eingefrorenen Liste.
- [x] Die Gerichteseite zeigt alle Gerichte alphabetisch mit deutscher Sortierung, je
      Zeile den Namen als Knopf und rechts "Auf die Einkaufsliste".
- [x] Ein Gericht wird mit Name (Pflicht), beliebig vielen Einkaufs-Items
      (Name/Menge/Einheit), Freitext Zutaten und Freitext Rezept angelegt.
- [x] Die Ansichtsseite gibt Zutaten und Rezept als normalen Text aus, in Absätzen, die
      VoiceOver einzeln erreicht.
- [x] Löschen führt über eine eigene Bestätigungsseite; Abbrechen kehrt zur Ansicht
      zurück, Löschen zur Gerichteliste.
- [x] "Auf die Einkaufsliste" überträgt alle Items des Gerichts, hängt sie sofort an die
      eingefrorene Liste an und fasst das Ergebnis in einer Ansage zusammen.
- [x] Firestore weist jeden Zugriff auf die Gerichte ab, der nicht vom Haushaltskonto
      kommt.
- [x] Kein Kontext importiert aus einem anderen Kontext; ESLint erzwingt das und ein Test
      prüft die Regel.
- [ ] Ohne Netz sind Anlegen, Ändern, Löschen und Übertragen unverändert möglich.

## Wesentliche Entscheidungen und Abwägungen

1. **Navigationsmuster:** `<nav>` mit Knöpfen und `aria-current="page"` statt
   `role="tablist"`.
   - Warum: Das Tab-Muster verlangt Roving-Tabindex und Pfeiltasten-Navigation; unter
     iOS-VoiceOver liegt dann nur ein Tab im Fokusbaum, und die Wischnavigation von VO
     kollidiert mit der eigenen Tastaturlogik.
   - Auswirkung: Keine Tastatur-Sonderlogik, beide Knöpfe sind direkt anwählbar,
     `jsx-a11y` braucht keine Ausnahme.

2. **Neue Komponente `SignedInApp` über beiden Bereichen.**
   - Warum: `useShoppingList` lebt heute in `ShoppingApp` (`ShoppingApp.tsx:19`) und
     würde beim Tabwechsel ausgehängt. Der Verlust von `frozenOrder` und
     `frozenOnFirstItems` (`useShoppingList.ts:26-27`) käme einem stillen "Aufräumen"
     gleich und verletzt Kriterium 7 aus MZP-001.
   - Auswirkung: Einkaufslisten- und Gerichte-Client entstehen einmal je Sitzung.
     `SignedInApp` ist zugleich die Stelle, an der beide Kontexte für "Auf die
     Einkaufsliste" zusammenkommen — die Übersetzung zwischen ihnen findet in der
     Kompositionswurzel statt, nicht in einem Kontext.

3. **Zweiter Bounded Context `meals`.**
   - Warum: "Gericht" ist ein eigener Begriff mit eigenem Lebenszyklus, eigener Sammlung
     und eigenen Invarianten. Kein vorsorglicher Kontext, sondern ein nachgewiesener.
   - Auswirkung: `src/meals/{domain,api,ui}`. Der Kontext kennt `shopping` nicht.
     `.claude/projekt.md` wird um den Kontext ergänzt.

4. **`Quantity` wandert nach `shared/domain`.**
   - Warum: Menge und Einheit bedeuten in beiden Kontexten dasselbe — der vom Skill
     `architecture` ausdrücklich erlaubte Geldbetrag-Fall. Sonst gäbe es das Einlesen von
     "2,5", die Einheitenliste und vier Fehlermeldungen zweimal.
   - Auswirkung: Refactoring von `shoppingItem.ts` und seiner Tests, bevor `meals`
     entsteht. Der *Name* eines Einkaufsartikels bleibt ein Begriff von `shopping`.

5. **Querimporte zwischen Kontexten werden per ESLint verboten.**
   - Warum: Heute hindert nichts `meals/domain` daran, `shopping/domain` zu importieren.
     Die Grenze soll maschinell halten, nicht durch Disziplin.
   - Auswirkung: Erweiterung von `eslint.config.js` und
     `test/domainLayerBoundary.test.ts`. `shared/` bleibt für beide erlaubt.

6. **Zusammenführen statt zweitem Eintrag** bei gleichem Namen und gleicher Einheit;
   fehlende Menge zählt als 1 ohne Einheit.
   - Warum: Use Case aus `docs/notes.txt`. Ohne das erzeugt jedes zweite übertragene
     Gericht Dubletten.
   - Auswirkung: `ShoppingListClient` bekommt `changeQuantity`. Die Zusammenführung
     ändert nur den **Inhalt** eines vorhandenen Eintrags — die eingefrorene Reihenfolge
     bleibt unangetastet, der Eintrag steht, wo er stand.

7. **Vier Seiten im Kontext `meals`:** Liste, Ansicht, Formular, Löschbestätigung.
   - Warum: Das Rezept soll beim Kochen lesbar sein und nicht in einem `<textarea>`
     liegen, aus dem VoiceOver den Text als einen Block vorliest. Löschen soll nicht aus
     Versehen geschehen, und ein `confirm()` blockiert die Ansagen.
   - Auswirkung: Wie schon in MZP-001 ohne Router, über einen Zustand in `MealsArea`.
     Jede Seite hat einen echten Zurück-Knopf.

8. **Die Gerichteliste wird nicht eingefroren** und ist alphabetisch sortiert.
   - Warum: Das Einfrieren löst ein Problem des Einkaufens — Abhaken während des
     Durchgehens. Beim Nachschlagen entsteht es nicht.
   - Auswirkung: `stableList.ts` bleibt auf `shopping` beschränkt. Sortiert wird mit
     `localeCompare('de-DE')`, damit Umlaute an der erwarteten Stelle stehen.

9. **Gerichte werden vollständig geladen, ohne Sitzungsfilter.**
   - Warum: Anders als `items` wächst die Sammlung nicht unbegrenzt — es gibt so viele
     Dokumente, wie der Haushalt Gerichte kennt.
   - Auswirkung: Ein einziges `onSnapshot` über die Sammlung, keine Doppelabfrage wie in
     `firestoreShoppingListClient.ts:83-90`.

10. **Zwei Gerichte dürfen denselben Namen tragen.**
    - Warum: Eine Eindeutigkeitsprüfung bräuchte ein Konfliktkonzept über zwei Geräte und
      den Offline-Betrieb hinweg. Der Nutzen steht dazu in keinem Verhältnis.
    - Auswirkung: Keine Namensprüfung gegen den Bestand, nur Länge und Nichtleere.

## Ausgangslage

Ein einziger Kontext, abgeschwächte Onion-Form nach
`.claude/skills/architecture/references/typescript.md`.

```
src/
  App.tsx                     loading | SignInPage | ShoppingApp
  main.tsx                    verdrahtet Firebase-Clients
  shared/
    appUpdate/                Angebot "Neue Version laden"
    auth/                     SignInPage, useSession, firebase.ts
    ui/                       Announcer (role=status), useAnnouncer
  shopping/
    domain/                   shoppingItem, announcements, stableList
    api/                      ShoppingListClient + Firestore- und InMemory-Adapter
    ui/                       ShoppingApp, ShoppingListPage, AddItemPage, ShoppingItemRow
```

Die Navigation ist heute ein einzelnes Flag in `ShoppingApp.tsx:21-42`:

```
        App.tsx                       ShoppingApp.tsx
  ┌──────────────────────┐        ┌───────────────────────┐
  │ session.status       │        │ addingItem?           │
  │  loading  → <p>      │  ───►  │   true  → AddItemPage │
  │  signedOut→ SignIn   │        │   false → ShoppingList│
  │  signedIn → Shopping │        └───────────────────────┘
  └──────────────────────┘
```

Kein Router — Entscheidung 5 aus
`docs/agents/plans/2026-09-14-einkaufsliste-pwa-mit-firestore-sync.md:70`: GitHub Pages
kann kein SPA-Rewrite, und Zurück-Wischen ist bei VoiceOver belegt. "Zurück" ist ein
echter Knopf (`AddItemPage.tsx:49`).

Bindende Fundstellen:

- `eslint.config.js:8-17` — `src/**/domain/**` darf React, Firebase, `../ui/*` und
  `../api/*` nicht importieren. Das ist der Architekturtest dieses Projekts, abgesichert
  durch `test/domainLayerBoundary.test.ts`.
- `firestore.rules:9-11` — nur die Sammlung `items` ist freigegeben, alles andere
  `false`. Eine neue Sammlung braucht eine Regel **und** einen Test in
  `firestore.rules.test.ts`.
- `useShoppingList.ts:24-39` — die eingefrorene Reihenfolge entsteht beim ersten Snapshot
  und lebt im React-Zustand dieser Komponente.
- `shoppingItem.ts:44-58` — Einlesen von Menge und Einheit, heute fest an
  `ShoppingItemDraft` gebunden.
- `announcements.ts:20-28` — `additionAnnouncement` legt heute immer einen zweiten
  Eintrag an und warnt nur.
- Memory: VoiceOver ist der primäre Bedienweg, kein Dark-Mode.

## Zielbild

```
App.tsx
  └── SignedInApp                    activeArea, shoppingList, meals
        ├── NavigationBar            shared/ui, kennt keinen Kontext
        │     als Slot an die Hauptseite des Bereichs durchgereicht
        ├── ShoppingArea             shopping/ui
        │     ├── ShoppingListPage   nav + main
        │     └── AddItemPage        nur main
        └── MealsArea                meals/ui
              ├── MealListPage       nav + main
              ├── MealPage           nur main
              ├── MealFormPage       nur main
              └── DeleteMealPage     nur main
```

Die Leiste wird als React-Knoten (`navigation`) an den Bereich gereicht und nur von
dessen Hauptseite gerendert. So muss kein Bereich nach oben melden, auf welcher
Unterseite er gerade steht, und keine Unterseite kann die Leiste versehentlich zeigen.

Bildschirme nachher:

```
Einkaufsliste                        Gerichte
┌────────────────────────────────┐   ┌────────────────────────────────┐
│[Einkaufsliste][  Gerichte    ] │   │[ Einkaufsliste][  Gerichte   ] │ nav, sticky
├────────────────────────────────┤   ├────────────────────────────────┤
│ Einkaufsliste, 2 offen    [+]  │h1 │ Gerichte, 2               [+]  │h1
│ ☐ Brot                         │   │ [Linsensuppe       ][Einkaufs-]│
│ ☑ Milch, 3 l                   │   │ [Spaghetti Bolognese][liste   ]│
│ [ Aufräumen, 1 Änderung ]      │   │                                │
├────────────────────────────────┤   ├────────────────────────────────┤
│ <Ansage, role=status>          │   │ <Ansage, role=status>          │
└────────────────────────────────┘   └────────────────────────────────┘

Gericht ansehen                      Gericht anlegen / bearbeiten
┌────────────────────────────────┐   ┌────────────────────────────────┐
│ [ Zurück zu den Gerichten ]    │   │ [ Zurück zu den Gerichten ]    │
│ Spaghetti Bolognese          h1│   │ Gericht anlegen              h1│
│ Einkaufs-Items, 3            h2│   │ Name    [___________________]  │
│  Hackfleisch, 500 g            │   │                                │
│  Passierte Tomaten, 2 Pck.     │   │ Einkaufs-Items, 2            h2│
│  Spaghetti, 500 g              │   │  Hackfleisch, 500 g [Entfernen]│
│ Zutaten                      h2│   │  Spaghetti, 500 g   [Entfernen]│
│  Zwiebel, Knoblauch, Salz      │   │  Name   [_________________]    │
│ Rezept                       h2│   │  Menge  [____] Einheit [_____] │
│  Hackfleisch anbraten.         │   │  [ Item hinzufügen ]           │
│  Tomaten dazu, 20 Minuten.     │   │                                │
│ [ Auf die Einkaufsliste ]      │   │ Zutaten [textarea           ]  │
│ [ Bearbeiten ]  [ Löschen ]    │   │ Rezept  [textarea           ]  │
├────────────────────────────────┤   │ [ Speichern ]                  │
│ <Ansage, role=status>          │   ├────────────────────────────────┤
└────────────────────────────────┘   │ <Ansage, role=status>          │
                                     └────────────────────────────────┘

Gericht löschen
┌────────────────────────────────┐
│ [ Zurück zum Gericht ]         │
│ Spaghetti Bolognese löschen? h1│
│ Das Gericht wird für beide     │
│ Geräte entfernt.               │
│ [ Löschen ]   [ Abbrechen ]    │
└────────────────────────────────┘
```

Ordnerstruktur nachher:

```
src/
  App.tsx                       unverändert bis auf den Aufruf von SignedInApp
  SignedInApp.tsx               NEU  Kompositionswurzel über beiden Kontexten
  SignedInApp.test.tsx          NEU  Navigation und Zustandserhalt
  shared/
    domain/
      quantity.ts               NEU  aus shoppingItem.ts herausgelöst
      quantity.test.ts          NEU
    ui/
      NavigationBar.tsx         NEU
      useHeadingFocus.ts        NEU
  shopping/
    domain/
      shoppingItem.ts           ohne Quantity-Teil
      addition.ts               NEU  planAddition / planAdditions
      announcements.ts          Ansagen für Zusammenführen und Übertragung
    api/
      shoppingListClient.ts     + changeQuantity
    ui/
      ShoppingArea.tsx          war ShoppingApp.tsx, Listenzustand kommt als Prop
      ShoppingListPage.tsx      + navigation-Slot, useHeadingFocus
  meals/                        NEU  zweiter Bounded Context
    domain/
      meal.ts
      announcements.ts
      text.ts
    api/
      mealsClient.ts
      inMemoryMealsClient.ts
      firestoreMealsClient.ts
    ui/
      MealsArea.tsx
      MealListPage.tsx
      MealListRow.tsx
      MealPage.tsx
      MealFormPage.tsx
      MealItemsEditor.tsx
      DeleteMealPage.tsx
      useMeals.ts
```

## Abstraktionen und Wiederverwendung

Genutzt wird, was schon da ist:

- `useAnnouncer` / `Announcer` (`shared/ui/`) — jede Ansage geht unverändert dorthin.
- Das Fokusmuster aus `ShoppingListPage.tsx:23-28` (`h1` mit `tabIndex={-1}`) wird zu
  `shared/ui/useHeadingFocus.ts` verallgemeinert und von jeder Seite benutzt.
- `accessibilityViolations` (`testSupport/accessibility.ts`) für jede neue Seite.
- `createInMemoryShoppingListClient` als Vorbild für `createInMemoryMealsClient`.
- Das Muster "Schreiben im Hintergrund, Fehler als Ansage"
  (`firestoreShoppingListClient.ts:53-55`) für den Gerichte-Adapter.

Neu gebraucht:

- `shared/ui/NavigationBar.tsx` — generisch über die Bereichs-Id, kennt keinen Kontext.
- `shared/domain/quantity.ts` — Menge, Einheit, Einlesen, Formatieren, Addieren.
- `shopping/domain/addition.ts` — entscheidet, ob hinzugefügt oder zusammengeführt wird.
- `meals/` in voller Breite.

Betroffene Dateien im Überblick:

- `src`
  - `SignedInApp.tsx` - NEU, hält `activeArea`, `useShoppingList`, `useMeals`
    - `SignedInApp` - reicht `navigation` als Slot an den aktiven Bereich
    - `addMealToShoppingList` - übersetzt `MealItem` nach `NewShoppingItem`
  - `App.tsx` - rendert `SignedInApp` statt `ShoppingApp`
  - `main.tsx` - erzeugt zusätzlich den Firestore-Gerichte-Client
- `src/shared`
  - `ui/NavigationBar.tsx` - NEU, `nav` mit `aria-label` und `aria-current`
  - `ui/useHeadingFocus.ts` - NEU, Ref auf das `h1`, Fokus beim Einhängen
  - `domain/quantity.ts` - NEU
    - `Quantity`, `QuantityDraft`, `InvalidQuantity`
    - `readQuantity`, `formatQuantity`, `canAddQuantities`, `addQuantities`, `UNITS`
- `src/shopping`
  - `domain/shoppingItem.ts` - `Quantity` und das Mengen-Einlesen entfallen
  - `domain/addition.ts` - NEU, `planAddition`, `planAdditions`, `AdditionOutcome`
  - `domain/announcements.ts` - `additionAnnouncement` nimmt das Ergebnis entgegen,
    `additionsAnnouncement` fasst eine Übertragung zusammen
  - `api/shoppingListClient.ts` - `changeQuantity(id, quantity)`
  - `ui/ShoppingArea.tsx` - aus `ShoppingApp.tsx`, Listenzustand kommt als Prop
  - `ui/ShoppingListPage.tsx` - `navigation`-Slot, `useHeadingFocus`
- `src/meals` - NEU, vollständig
- Projektweit
  - `eslint.config.js` - Kontextgrenzen
  - `test/domainLayerBoundary.test.ts` - Tests dafür
  - `firestore.rules` / `firestore.rules.test.ts` - Sammlung `meals`
  - `src/index.css` - Leiste, Gerichteliste, Formularteile
  - `.claude/projekt.md` - Kontext `meals`
  - `docs/notes.txt` - erledigte Punkte nach DONE

## Logging und Beobachtbarkeit

Die App hat kein Logging; Rückmeldung entsteht ausschliesslich als Ansage im
`role="status"`-Bereich. Neue Ansagen:

```
Tabwechsel            (keine Ansage — der Fokus auf dem h1 liest die Überschrift vor)
Zusammengeführt       "Milch, 1 l hinzugefügt. Stand bereits offen, jetzt 3 l."
Andere Einheit        "Milch, 500 g hinzugefügt. Achtung, Milch steht bereits offen
                       auf der Liste."
Item im Formular      "Hackfleisch, 500 g als Item übernommen."
Item entfernt         "Hackfleisch entfernt, noch 2 Items."
Gericht gespeichert   "Spaghetti Bolognese gespeichert."
Gericht gelöscht      "Spaghetti Bolognese gelöscht, noch 2 Gerichte."
Übertragung           "Spaghetti Bolognese, 3 Artikel hinzugefügt. 1 zusammengefasst."
Übertragung, Konflikt "Spaghetti Bolognese, 2 Artikel hinzugefügt. Achtung, Milch steht
                       mit anderer Einheit bereits offen."
Ohne Items            "Spaghetti Bolognese hat keine Einkaufs-Items."
Schreibfehler         "Konnte nicht gespeichert werden."  (unverändert)
```

## Umsetzung

### Phase 1: Navigationsleiste und zwei Bereiche

Abhängigkeiten: keine.

Die Leiste steht, beide Bereiche sind erreichbar, und die Einkaufsliste übersteht den
Wechsel unverändert. Der Bereich *Gerichte* ist noch leer.

**Aufgaben**:

- [x] `src/shared/ui/useHeadingFocus.ts` anlegen — das Fokusmuster aus
      `ShoppingListPage.tsx:23-28` verallgemeinern.

  ```ts
  export function useHeadingFocus() {
    const heading = useRef<HTMLHeadingElement>(null)
    useEffect(() => {
      heading.current?.focus()
    }, [])
    return heading
  }
  ```

- [x] `src/shared/ui/NavigationBar.tsx` anlegen, generisch über die Bereichs-Id, ohne
      Kenntnis eines Kontexts.

  ```tsx
  type NavigationBarProps<Id extends string> = {
    areas: readonly { id: Id; label: string }[]
    activeArea: Id
    onSelectArea: (area: Id) => void
  }

  export function NavigationBar<Id extends string>({ ... }: NavigationBarProps<Id>) {
    return (
      <nav aria-label="Bereiche" className="navigationBar">
        <ul>
          {areas.map((area) => (
            <li key={area.id}>
              <button
                type="button"
                aria-current={area.id === activeArea ? 'page' : undefined}
                onClick={() => onSelectArea(area.id)}
              >
                {area.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    )
  }
  ```

- [x] `src/SignedInApp.tsx` anlegen: hält `activeArea` (Startwert `'shopping'`), erzeugt
      den Einkaufslisten-Client einmalig und ruft `useShoppingList` auf dieser Ebene auf.
      Die Leiste entsteht hier und wird als `navigation`-Prop an den aktiven Bereich
      gereicht.

- [x] `src/shopping/ui/ShoppingApp.tsx` in `ShoppingArea.tsx` umbenennen. Die Komponente
      erzeugt den Client nicht mehr und ruft `useShoppingList` nicht mehr auf, sondern
      nimmt dessen Rückgabe als Prop `shoppingList` entgegen. Sie behält ihren eigenen
      Unterseiten-Zustand `addingItem` und reicht `navigation` an `ShoppingListPage`
      weiter.

- [x] `src/shopping/ui/ShoppingListPage.tsx`: `navigation`-Prop vor dem `<main>`
      rendern, `useRef` durch `useHeadingFocus` ersetzen. Der Fokus landet damit auch
      beim Rückweg aus `AddItemPage` auf der Überschrift — heute geht er dort verloren.

- [x] `src/meals/ui/MealsArea.tsx` als Platzhalter anlegen: `navigation`, `h1` über
      `useHeadingFocus` mit dem Text "Gerichte, keine" und dem Absatz "Noch keine
      Gerichte.".

- [x] `src/App.tsx`: `ShoppingApp` durch `SignedInApp` ersetzen, Props unverändert
      durchreichen.

- [x] `src/index.css`: Leiste ergänzen.

  ```css
  .navigationBar {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: #ffffff;
    border-bottom: 1px solid #d1d5db;
    padding-top: env(safe-area-inset-top);
  }

  .navigationBar ul {
    display: flex;
    gap: 0.5rem;
    list-style: none;
    margin: 0 auto;
    padding: 0.5rem max(1rem, env(safe-area-inset-left));
    max-width: 40rem;
  }

  .navigationBar li {
    flex: 1;
  }

  .navigationBar button {
    width: 100%;
    background-color: #ffffff;
    color: #14532d;
  }

  .navigationBar button[aria-current='page'] {
    background-color: #14532d;
    color: #ffffff;
  }

  .pageBelowNavigation {
    padding-top: 1rem;
  }
  ```

- [x] Hauptseiten bekommen `className="page pageBelowNavigation"`, damit der
      `safe-area-inset-top` nicht doppelt zählt — die Leiste trägt ihn bereits.
      `.pageBelowNavigation` hat dieselbe Spezifität wie `.page` und muss deshalb **nach**
      dem `.page`-Block in `index.css` stehen, sonst gewinnt dessen `padding-top`.

- [x] `src/shopping/ui/ShoppingApp.test.tsx` in `ShoppingArea.test.tsx` umbenennen. Die
      bestehenden Fälle bleiben inhaltlich unverändert; der Testaufbau ruft
      `useShoppingList` in einer kleinen Hülle auf, damit die Tests des Kontexts im
      Kontext bleiben.

  ```tsx
  function ShoppingAreaUnderTest({ client, announce }: ShoppingAreaUnderTestProps) {
    return (
      <ShoppingArea
        shoppingList={useShoppingList(client)}
        announce={announce}
        navigation={null}
      />
    )
  }
  ```

- [x] `src/SignedInApp.test.tsx` anlegen mit den neuen Fällen:
  - wechselt zwischen den Bereichen und markiert den aktiven mit `aria-current`
  - setzt den Fokus nach dem Wechsel auf die Überschrift des neuen Bereichs
  - zeigt die Leiste nicht auf der Seite "Artikel hinzufügen"
  - **Regression:** hakt einen Artikel ab, wechselt zu den Gerichten und zurück — die
    Liste zeigt weiterhin denselben Bestand in derselben Reihenfolge, und der Knopf
    "Aufräumen, 1 Änderung" steht unverändert da
  - `accessibilityViolations` ist auf beiden Bereichen leer

- [x] `docs/notes.txt`: den Punkt "Tab-Leiste oben fixiert" samt Unterpunkten auf `x`
      setzen und nach DONE verschieben. Die Erweiterung um Wochenplaner und Einstellungen
      bleibt als offener Unterpunkt stehen.

**Automatisierte Verifikation**:

- [x] `npm run test` — `SignedInApp.test.tsx` und `ShoppingArea.test.tsx` laufen grün,
      insbesondere die Regression zum Zustandserhalt.
- [x] `npm run lint` läuft durch.
- [x] `npm run build` läuft durch.
- [x] `npm run test:e2e` — der bestehende Tastatur-Durchlauf bleibt grün.

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver zwischen den Bereichen wechseln: beim Wechsel wird die
      Überschrift des neuen Bereichs vorgelesen, der aktive Knopf meldet "aktuelle
      Seite".
- [x] Mit einer langen Einkaufsliste scrollen: die Leiste bleibt sichtbar am oberen Rand,
      und der Inhalt beginnt nicht unter der Statusleiste des Geräts.

---

### Phase 2: Menge als geteilter Wert und Zusammenführen gleichnamiger Artikel

Abhängigkeiten: Phase 1 — fachlich unabhängig, aber die Testfälle sitzen in der dort
umbenannten `ShoppingArea.test.tsx`.

Die Menge wird zum kontextübergreifenden Wert, und ein zweites "Milch" erzeugt keinen
zweiten Eintrag mehr.

**Aufgaben**:

- [x] `src/shared/domain/quantity.test.ts` zuerst schreiben. Die Fälle zum Einlesen
      wandern aus `shopping/domain/shoppingItem.test.ts` hierher, dazu die neue
      Additionsregel:

  ```
  null      + null       -> { amount: 2, unit: null }
  {2,'l'}   + {1,'l'}    -> { amount: 3, unit: 'l' }
  {2,null}  + {1,null}   -> { amount: 3, unit: null }
  null      + {2,'l'}    -> nicht addierbar
  {2,'l'}   + {500,'g'}  -> nicht addierbar
  ```

- [x] `src/shared/domain/quantity.ts` anlegen:

  ```ts
  export type Quantity = { amount: number; unit: string | null }
  export type QuantityDraft = { amount: string; unit: string }
  export type InvalidQuantityReason =
    | 'amountNotANumber'
    | 'amountNotPositive'
    | 'unitWithoutAmount'

  export class InvalidQuantity extends Error { ... }

  export const UNITS = ['Stück', 'g', 'kg', 'ml', 'l', 'Pck.']

  export function readQuantity(draft: QuantityDraft): Quantity | null
  export function formatQuantity(quantity: Quantity | null): string
  export function invalidQuantityMessage(reason: InvalidQuantityReason): string
  export function canAddQuantities(one: Quantity | null, other: Quantity | null): boolean
  export function addQuantities(one: Quantity | null, other: Quantity | null): Quantity
  ```

  `canAddQuantities` und `addQuantities` behandeln `null` als `{ amount: 1, unit: null }`
  und verlangen für die Addition dieselbe Einheit.

- [x] `src/shopping/domain/shoppingItem.ts` bereinigen: `Quantity`, `readAmount`,
      `readQuantity` und die drei Mengen-Gründe entfallen. `InvalidShoppingItem` behält
      `nameMissing` und `nameTooLong`. `createShoppingItem` ruft `readQuantity` aus
      `shared/domain` auf und lässt `InvalidQuantity` durch.
      `formatItemForAnnouncement` setzt sich aus Name und `formatQuantity` zusammen.

- [x] `src/shopping/domain/addition.test.ts` zuerst schreiben, dann
      `src/shopping/domain/addition.ts`:

  ```ts
  export type AdditionOutcome =
    | { kind: 'newItem'; item: NewShoppingItem }
    | { kind: 'mergedInto'; into: ShoppingItem; quantity: Quantity }
    | { kind: 'besideDifferentUnit'; item: NewShoppingItem; open: ShoppingItem }

  export function planAddition(
    newItem: NewShoppingItem,
    items: readonly ShoppingItem[],
  ): AdditionOutcome

  export function planAdditions(
    newItems: readonly NewShoppingItem[],
    items: readonly ShoppingItem[],
  ): readonly AdditionOutcome[]
  ```

  `planAdditions` fädelt die bereits geplanten Zusammenführungen durch, damit zwei
  gleiche Items **einer** Übertragung ebenfalls zusammenfallen. Grundlage ist das
  vorhandene `findOpenItemWithSameName` (`shoppingItem.ts:91`).

- [x] `src/shopping/domain/announcements.ts` erweitern:
  - `additionAnnouncement(outcome)` — je nach Ergebnis "… hinzugefügt.",
    "… hinzugefügt. Stand bereits offen, jetzt 3 l." oder die heutige Warnung
  - `additionFailureMessage(error)` — löst `InvalidShoppingItem` und `InvalidQuantity`
    auf und gibt `null` für alles andere zurück
  - Fälle in `announcements.test.ts` ergänzen

- [x] `src/shopping/api/shoppingListClient.ts`: `changeQuantity(id, quantity)` ergänzen;
      `firestoreShoppingListClient.ts` (`updateDoc` auf das Feld `quantity`) und
      `inMemoryShoppingListClient.ts` nachziehen.

- [x] `src/shopping/ui/useShoppingList.ts`: `addItem` wertet `planAddition` aus. Bei
      `mergedInto` wird `changeQuantity` gerufen und die Id des vorhandenen Eintrags an
      die eingefrorene Reihenfolge angehängt — so wird ein Artikel sichtbar, den das
      andere Gerät nach dem Einfrieren eingetragen hat.

- [x] `src/shopping/ui/AddItemPage.tsx`: Fehlerbehandlung auf `additionFailureMessage`
      umstellen, `UNITS` aus `shared/domain/quantity` beziehen.
- [x] **Nachtrag aus der Umsetzung:** `src/shopping/domain/unconfirmedWrites.ts` mit
      `rememberWrite`, `withUnconfirmedWrites` und `dropConfirmedWrites`, dazu
      `sameQuantity` in `shared/domain/quantity.ts`.

      Gegen Firestore war `liveItems` beim zweiten Hinzufügen oft noch leer: die
      Momentaufnahme braucht gelegentlich über eine Sekunde, und `observeItems`
      veröffentlicht erst, wenn beide Abfragen geantwortet haben
      (`firestoreShoppingListClient.ts:63-66`). `planAddition` sah den eigenen
      ersten Artikel deshalb nicht und legte einen zweiten Eintrag an — der
      E2E-Durchlauf war in zwei von drei Wiederholungen rot.

      `useShoppingList` plant jetzt gegen `withUnconfirmedWrites(liveItems, writes)`.
      Die Überlagerung hängt eigene, noch nicht ausgelieferte Artikel an und hebt die
      Menge derer, die die Momentaufnahme noch alt zeigt; den Abhak-Zustand lässt sie
      der Momentaufnahme. `dropConfirmedWrites` wirft einen Schreibvorgang weg,
      sobald die Momentaufnahme die geschriebene Menge trägt. Die **Anzeige** bleibt
      bei `liveItems`; dass ein eigener Artikel dort verzögert erscheint, steht als
      Bug in `docs/notes.txt` und besteht schon vor dieser Phase.

- [x] Fälle in `ShoppingArea.test.tsx` ergänzen:
  - "Milch" zweimal hinzufügen ergibt eine Zeile "Milch, 2" und eine Ansage
  - "Milch, 2 l" und "Milch, 1 l" ergeben "Milch, 3 l"
  - "Milch, 2 l" und "Milch, 500 g" ergeben zwei Zeilen mit der Warnung
  - ein zusammengeführter Eintrag behält seine Position zwischen zwei anderen Artikeln
  - ein Artikel, den `itemsArriveFromElsewhere` nach dem Einfrieren gebracht hat, wird
    beim Zusammenführen sichtbar

- [x] `e2e/shoppingList.spec.ts` um einen Durchlauf erweitern: denselben Artikel zweimal
      anlegen und prüfen, dass genau eine Zeile mit summierter Menge entsteht — das
      deckt den Firestore-Weg von `changeQuantity` ab.

- [x] `docs/notes.txt`: den Punkt "Use case / given: Milch bereits auf Einkaufsliste" auf
      `x` setzen und nach DONE verschieben.

**Automatisierte Verifikation**:

- [x] `npm run test` — `quantity.test.ts`, `addition.test.ts`, `announcements.test.ts`,
      `shoppingItem.test.ts` und `ShoppingArea.test.tsx` laufen grün.
- [x] `npm run lint` — insbesondere bleibt `shared/domain/quantity.ts` frei von React-
      und Firebase-Importen.
- [x] `npm run test:e2e` — der neue Zusammenführungs-Durchlauf ist grün.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver einen Artikel hinzufügen, der bereits offen auf der
      Liste steht: die Ansage nennt die neue Gesamtmenge, und die Liste springt nicht.

---

### Phase 3: Gerichte anlegen und ansehen

Abhängigkeiten: Phase 1 (Bereich `meals` existiert), Phase 2 (`shared/domain/quantity`).

Der Kontext `meals` entsteht vollständig — Domäne, Firestore-Adapter, Sicherheitsregeln,
Kontextgrenze — und liefert Liste, Formular zum Anlegen und Ansichtsseite.

**Aufgaben**:

- [x] `eslint.config.js` um die Kontextgrenze erweitern. Achtung: ESLint-Flat-Config
      **ersetzt** einen Regeleintrag, der in einem späteren Block erneut vorkommt. Ein
      eigener Block für `src/<kontext>/**` würde die Domänen-Muster für
      `src/<kontext>/domain/**` also stillschweigend aushebeln. Deshalb werden die Muster
      zusammengeführt:

  ```js
  const contexts = [
    { name: 'shopping', other: 'meals' },
    { name: 'meals', other: 'shopping' },
  ]

  ...contexts.flatMap(({ name, other }) => [
    {
      files: [`src/${name}/**/*.{ts,tsx}`],
      rules: {
        'no-restricted-imports': ['error', { patterns: [`**/${other}/**`] }],
      },
    },
    {
      files: [`src/${name}/domain/**/*.ts`],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [...forbiddenInDomain, `**/${other}/**`] },
        ],
      },
    },
  ])
  ```

- [x] `test/domainLayerBoundary.test.ts` erweitern:
  - verbietet einen Import aus `meals` in einer Datei unter `src/shopping/`
  - verbietet einen Import aus `shopping` in einer Datei unter `src/meals/`
  - verbietet weiterhin `react` in `src/meals/domain/`
  - **erlaubt** `../../shared/domain/quantity` in `src/shopping/domain/` und
    `src/meals/domain/` — dieser Fall sichert ab, dass die neuen Muster den geteilten
    Wert nicht versehentlich mit abschneiden

- [x] `src/meals/domain/meal.test.ts` zuerst, dann `src/meals/domain/meal.ts`:

  ```ts
  export type MealId = string
  export type MealItem = { name: string; quantity: Quantity | null }
  export type NewMeal = {
    name: string
    items: readonly MealItem[]
    ingredientNotes: string
    recipe: string
  }
  export type Meal = NewMeal & { id: MealId }

  export type MealDraft = { name: string; ingredientNotes: string; recipe: string }
  export type MealItemDraft = { name: string; amount: string; unit: string }

  export type InvalidMealReason = 'nameMissing' | 'nameTooLong' | 'textTooLong'
  export class InvalidMeal extends Error { ... }

  export function createMealItem(draft: MealItemDraft): MealItem
  export function createMeal(draft: MealDraft, items: readonly MealItem[]): NewMeal
  export function byName(meals: readonly Meal[]): readonly Meal[]
  export function formatMealItem(item: MealItem): string
  ```

  Invarianten: Name nicht leer, höchstens 100 Zeichen; Zutatennotiz und Rezept höchstens
  5000 Zeichen. `byName` sortiert mit `localeCompare('de-DE')`. `createMealItem` nutzt
  `readQuantity` aus `shared/domain`.

- [x] `src/meals/domain/text.test.ts` zuerst, dann `src/meals/domain/text.ts` mit
      `paragraphsOf(text)`: zerlegt Freitext in Absätze, verwirft Leerzeilen und
      umschliessende Leerzeichen. Grundlage der Ansichtsseite.

- [x] `src/meals/domain/announcements.test.ts` zuerst, dann
      `src/meals/domain/announcements.ts` mit `mealsHeading`, `invalidMealMessage`,
      `mealItemAddedAnnouncement`, `mealItemRemovedAnnouncement`, `mealSavedAnnouncement`,
      `mealWithoutItemsAnnouncement`.

- [x] `src/meals/api/mealsClient.ts`:

  ```ts
  export interface MealsClient {
    observeMeals(onMeals: (meals: readonly Meal[]) => void): () => void
    addMeal(meal: NewMeal): MealId
    changeMeal(id: MealId, meal: NewMeal): void
    removeMeal(id: MealId): void
  }
  ```

- [x] `src/meals/api/inMemoryMealsClient.ts` nach dem Vorbild von
      `inMemoryShoppingListClient.ts`, mit `storedMeals()` und
      `mealsArriveFromElsewhere()` für die Tests.

- [x] `src/meals/api/firestoreMealsClient.ts` — ein `onSnapshot` über die Sammlung
      `meals`, defensives Einlesen der Dokumente wie in
      `firestoreShoppingListClient.ts:20-40`, Schreiben im Hintergrund mit
      `onWriteFailure`.

- [x] `firestore.rules` um die Sammlung ergänzen:

  ```
  match /meals/{mealId} {
    allow read, write: if isHousehold();
  }
  ```

- [x] `firestore.rules.test.ts` erweitern: Haushalt darf ein Gericht schreiben und lesen,
      ein fremdes Konto und ein nicht angemeldeter Besucher werden abgewiesen.

- [x] `src/meals/ui/useMeals.ts` — abonniert den Client, gibt `meals` (über `byName`
      sortiert), `addMeal`, `changeMeal` und `removeMeal` zurück.

- [x] `src/meals/ui/MealsArea.tsx` vom Platzhalter zur Seitensteuerung ausbauen:

  ```ts
  type MealsPage =
    | { kind: 'list' }
    | { kind: 'meal'; id: MealId }
    | { kind: 'form'; id: MealId | null }
    | { kind: 'delete'; id: MealId }
  ```

  In dieser Phase entstehen `list`, `form` mit `id: null` und `meal`.

- [x] `src/meals/ui/MealListPage.tsx` — `navigation`-Slot, `h1` über `useHeadingFocus`
      mit `mealsHeading(count)`, Knopf "Gericht hinzufügen" (`+`) wie in
      `ShoppingListPage.tsx:36-43`, Liste aus `MealListRow`. Leerfall: "Noch keine
      Gerichte.".

- [x] `src/meals/ui/MealListRow.tsx` — der Name ist ein Knopf, der die Ansichtsseite
      öffnet. Der Übertragungsknopf folgt in Phase 5.

- [x] `src/meals/ui/MealItemsEditor.tsx` — die erfassten Items als Liste mit je einem
      Knopf `aria-label={'Entfernen, ' + formatMealItem(item)}`, darunter die drei Felder
      Name, Menge, Einheit und der Knopf "Item hinzufügen". Nach dem Übernehmen werden die
      Felder geleert und der Fokus kehrt auf das Namensfeld zurück — dasselbe Muster wie
      `AddItemPage.tsx:36-38`. Die Einheiten kommen aus `UNITS` über eine `datalist`.

- [x] `src/meals/ui/MealFormPage.tsx` — Zurück-Knopf, `h1` "Gericht anlegen",
      Namensfeld, `MealItemsEditor`, zwei `textarea` für Zutaten und Rezept, Knopf
      "Speichern". Fehler erscheinen wie in `AddItemPage` in einem über
      `aria-describedby` verbundenen Absatz. Die Items leben bis zum Speichern im
      lokalen Zustand.

- [x] `src/meals/ui/MealPage.tsx` — Zurück-Knopf, `h1` mit dem Namen über
      `useHeadingFocus`, Abschnitt "Einkaufs-Items, N" als Liste, Abschnitte "Zutaten"
      und "Rezept" als Absätze aus `paragraphsOf`. Leere Abschnitte werden ganz
      weggelassen, damit VoiceOver nicht an leeren Überschriften vorbeiwischt.

- [x] Nach dem Speichern führt der Weg auf die Ansichtsseite des Gerichts, der Fokus
      liegt auf dessen `h1`, die Ansage bestätigt das Speichern.

- [x] `src/SignedInApp.tsx`: `useMeals` aufrufen und `MealsArea` versorgen. `src/App.tsx`
      bekommt die Prop `createMealsClient` und reicht sie durch, `src/main.tsx` verdrahtet
      `createFirestoreMealsClient`, und `src/App.test.tsx` versorgt die neue Prop mit
      `createInMemoryMealsClient` — sonst schlägt die Typprüfung im Build fehl.

- [x] `src/index.css`: Gerichtezeile (Name links, Platz für den Knopf rechts),
      `textarea` auf `font: inherit` und ausreichende Höhe, Abstände der Abschnitte.
      `textarea` in die bestehende Regel für `button, input` aufnehmen.

- [x] `src/meals/ui/MealsArea.test.tsx` — Gericht anlegen und in der Liste sehen,
      alphabetische Sortierung mit Umlaut, Pflichtfeld Name meldet einen Fehler, Items
      übernehmen und entfernen, Ansichtsseite zeigt Absätze, leere Abschnitte fehlen,
      `accessibilityViolations` ist auf jeder Seite leer.

- [x] `.claude/projekt.md`: den Kontext ergänzen.

  ```
  - **meals** — die Gerichte des Haushalts: anlegen, nachschlagen und auf die
    Einkaufsliste übertragen.
  ```

- [x] `README.md`: den überholten Satz "Ein Stack ist noch nicht festgelegt, es existiert
      noch kein Quellcode." entfernen — er stand schon vor diesem Vorhaben falsch da und
      wird beim Bearbeiten der Projektunterlagen mit erledigt.

**Automatisierte Verifikation**:

- [x] `npm run test` — Domänentests von `meals`, `MealsArea.test.tsx` und die
      erweiterten Tests in `test/domainLayerBoundary.test.ts` laufen grün.
- [x] `npm run test:rules` — die Regeln für `meals` sind grün, der Zugriff Fremder wird
      abgewiesen.
- [x] `npm run lint` — kein Querimport zwischen den Kontexten.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver ein Gericht mit drei Items, Zutatennotiz und einem
      mehrabsätzigen Rezept anlegen und anschliessend auf der Ansichtsseite Absatz für
      Absatz durchwischen.

---

### Phase 4: Gericht bearbeiten und löschen

Abhängigkeiten: Phase 3.

Ein bestehendes Gericht lässt sich ändern und über eine eigene Bestätigungsseite
entfernen.

**Aufgaben**:

- [x] `src/meals/ui/MealPage.tsx` um die Knöpfe "Bearbeiten" und "Löschen" ergänzen.

- [x] `src/meals/ui/MealFormPage.tsx` für den Änderungsfall öffnen: bei gesetzter `id`
      lautet die Überschrift "Gericht bearbeiten", Name, Items, Zutaten und Rezept sind
      vorbelegt, und `Speichern` ruft `changeMeal`.

- [x] `src/meals/ui/DeleteMealPage.tsx` anlegen: Zurück-Knopf zum Gericht, `h1`
      "<Name> löschen?" über `useHeadingFocus`, erklärender Absatz "Das Gericht wird für
      beide Geräte entfernt.", Knöpfe "Löschen" und "Abbrechen". "Löschen" führt auf die
      Gerichteliste mit der Ansage `mealDeletedAnnouncement`, "Abbrechen" zurück auf die
      Ansicht.

- [x] `mealDeletedAnnouncement` in `meals/domain/announcements.ts` ergänzen, mit Test.

- [x] `MealsArea` fällt auf die Liste zurück, wenn das angezeigte oder zu löschende
      Gericht nicht mehr im Bestand ist — etwa weil das zweite Gerät es entfernt hat.

- [x] Fälle in `MealsArea.test.tsx`: Bearbeiten übernimmt die Änderung, Abbrechen des
      Löschens lässt das Gericht bestehen, Löschen entfernt es aus dem Bestand des
      Clients, ein per `mealsArriveFromElsewhere` entferntes Gericht führt zurück zur
      Liste, `accessibilityViolations` auf der Bestätigungsseite ist leer.

**Automatisierte Verifikation**:

- [x] `npm run test` — die neuen Fälle in `MealsArea.test.tsx` und
      `announcements.test.ts` laufen grün.
- [x] `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation**:

- [x] Auf dem iPhone mit VoiceOver ein Gericht ändern, danach eines löschen und den
      Abbrechen-Weg mindestens einmal gehen.

---

### Phase 5: Auf die Einkaufsliste

Abhängigkeiten: Phasen 1 bis 4.

Der Knopf aus `notes.txt` schliesst die beiden Kontexte zusammen.

**Aufgaben**:

- [x] `src/shopping/ui/useShoppingList.ts` um `addItems(newItems)` erweitern: plant alle
      Ergänzungen mit `planAdditions` gegen denselben Bestand, führt sie aus, hängt jede
      betroffene Id an die eingefrorene Reihenfolge an und gibt eine Zusammenfassung
      zurück.

  ```ts
  export type AdditionsSummary = {
    added: number
    merged: number
    differentUnit: readonly string[]
  }
  ```

- [x] `additionsAnnouncement(summary)` in `shopping/domain/announcements.ts` mit Tests:
      "3 Artikel hinzugefügt.", zusätzlich "1 zusammengefasst." und je Konflikt "Achtung,
      Milch steht mit anderer Einheit bereits offen.". Die Funktion kennt kein Gericht —
      den Namen setzt die Kompositionswurzel davor.

- [x] `src/SignedInApp.tsx`: `addMealToShoppingList(meal)` übersetzt `MealItem` nach
      `NewShoppingItem` (Name, Menge, `createdAt: Date.now()`), ruft `addItems` und setzt
      die Ansage zusammen:

  ```ts
  const summary = shoppingList.addItems(itemsFor(meal))
  announce(`${meal.name}, ${additionsAnnouncement(summary)}`)
  ```

  Bei einem Gericht ohne Items wird stattdessen `mealWithoutItemsAnnouncement(meal)`
  angesagt und nichts geschrieben. Diese Datei ist der einzige Ort, an dem beide
  Kontexte zusammentreffen — die ESLint-Kontextgrenze greift hier bewusst nicht.

- [x] `MealsArea` bekommt die Prop `onAddToShoppingList: (meal: Meal) => void` und reicht
      sie an `MealListRow` und `MealPage` durch. Der Typ nennt nur `Meal`, also keinen
      Begriff aus `shopping`.

- [x] Knopf in `MealListRow` und auf `MealPage`: sichtbarer Text "Auf die Einkaufsliste",
      in der Zeile zusätzlich
      `aria-label={'Auf die Einkaufsliste, ' + meal.name}`, damit VoiceOver die Zeilen
      auseinanderhalten kann und die Sprachsteuerung den sichtbaren Text weiterhin trifft.

- [x] Nach der Übertragung bleibt die Ansicht stehen; der Bereich wechselt nicht.

- [x] `src/shopping/domain/addition.test.ts` um `planAdditions` erweitern: zwei gleiche
      Items einer Übertragung fallen zu einem zusammen; ein Item mit anderer Einheit
      bleibt daneben stehen.

- [x] `src/SignedInApp.test.tsx`: ein Gericht übertragen, in die Einkaufsliste wechseln
      und die Artikel am Ende der Liste vorfinden; dasselbe Gericht ein zweites Mal
      übertragen und prüfen, dass die Zeilenzahl gleich bleibt und die Mengen summiert
      sind; die Sammelansage prüfen; ein Gericht ohne Items meldet das und schreibt
      nichts.

- [x] `e2e/shoppingList.spec.ts` (oder eine neue Datei `e2e/meals.spec.ts`): ein Gericht
      anlegen, übertragen und die Artikel auf der Einkaufsliste wiederfinden — nur mit der
      Tastatur, wie die bestehenden Abläufe.

- [x] `docs/notes.txt`: den Punkt "Gerichte-Seite" samt Unterpunkten auf `x` setzen und
      nach DONE verschieben.

**Automatisierte Verifikation**:

- [x] `npm run test` — Übertragung, Zusammenfassung und Sammelansage sind grün.
- [x] `npm run test:e2e` — der Durchlauf von der Gerichteseite auf die Einkaufsliste ist
      grün.
- [x] `npm run test:rules` bleibt grün.
- [x] `npm run lint` und `npm run build` laufen durch.

**Manuelle Verifikation**:

- [ ] Auf dem iPhone mit VoiceOver ein Gericht übertragen, die Sammelansage anhören, in
      die Einkaufsliste wechseln und die Artikel dort vorfinden.
- [ ] Dasselbe Gericht ein zweites Mal übertragen: es entstehen keine Dubletten, die
      Ansage nennt die zusammengefassten Artikel.
- [ ] Im Flugmodus ein Gericht anlegen und übertragen, dann das Netz wieder einschalten
      und auf dem zweiten Gerät nachsehen.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

### Phase 3

- **Das Formular des Gerichts ist kein `<form>`.** HTML erlaubt keine geschachtelten
  Formulare, der Item-Editor sitzt aber mitten im Gericht. Gelöst ist das umgekehrt:
  der Item-Editor ist das einzige `<form>` der Seite (`aria-label="Einkaufs-Item
  hinzufügen"`), das Gericht wird über den Knopf "Speichern" gesichert. Dadurch legt
  die Eingabetaste im Item-Bereich ein Item an und speichert nicht versehentlich das
  halbe Gericht. Der Fehlerabsatz hängt über `aria-describedby` am Speichern-Knopf.
- **Das Namensfeld des Items heißt "Item", nicht "Name".** Zwei Felder mit dem Label
  "Name" auf einer Seite sind unter VoiceOver nicht auseinanderzuhalten; die
  Ortsangabe durch die Überschrift geht beim Wischen verloren.
- **Zwei Ansagen mehr als geplant:** `mealItemsHeading` für die Überschrift
  "Einkaufs-Items, N" — sie zählt und gehört damit zur Domäne, nicht in die
  Komponente — und `mealFailureMessage` als Gegenstück zu `additionFailureMessage`,
  weil auch im Gerichteformular `InvalidMeal` und `InvalidQuantity` zusammentreffen.
- **`mealsArriveFromElsewhere` ersetzt den Bestand**, statt wie
  `itemsArriveFromElsewhere` anzuhängen. Phase 4 braucht den Fall, dass das zweite
  Gerät ein Gericht *entfernt*.
- **Der Rückfall auf die Liste bei verschwundenem Gericht** (Plan: Phase 4) steckt
  schon in `MealsArea`, weil die Ansichtsseite sonst kein Gericht zum Rendern hätte.
  Die Tests dazu folgen in Phase 4.
- **Beim Prüfen auf dem Gerät scheiterte das Speichern**, obwohl alle Regeltests grün
  waren: die Freigabe der Sammlung `meals` lag nur im Repository. Kein Workflow rollt
  `firestore.rules` aus, also galt in der Produktion weiter die Auffangregel. Der
  Deploy von Hand behob es; der fehlende Schritt steht jetzt in `README.md` und als
  offener Punkt in `docs/notes.txt`.

### Phase 4

- **Der Zurück-Knopf des Formulars richtet sich nach dem Fall.** Beim Anlegen führt er
  wie bisher "Zurück zu den Gerichten", beim Bearbeiten "Zurück zum Gericht". Das
  Zielbild zeichnet beide Fälle in einem Bild und nennt nur die erste Beschriftung;
  aus dem Gericht heraus auf die Liste zurückzufallen widerspräche aber dem Weg, den
  Abbrechen beim Löschen nimmt.
- **Der Fokus bleibt im Formular auf dem Namensfeld**, auch beim Bearbeiten. Das ist
  das Verhalten aus Phase 3; die Überschrift "Gericht bearbeiten" wird dabei nicht
  vorgelesen, das vorbelegte Namensfeld aber schon.

### Phase 5

- **`planAdditions` und seine Tests gab es schon.** Sie entstanden als Nachtrag in
  Phase 2, weil `planAddition` damals ohnehin angefasst wurde. Neu ist nur
  `summarizeAdditions`: es zählt die Ergebnisse einer Übertragung aus und hält damit
  die Zählregel in der Domäne statt im Hook.
- **Der Plan nennt `AdditionsSummary` beim Hook, der Typ liegt aber in
  `shopping/domain/addition.ts`.** Sonst müsste `announcements.ts` einen Typ aus
  `ui/` importieren — genau die Kante, die die Domänengrenze verbietet.
- **`firstFrozenOrder` als Nachtrag.** Der E2E-Durchlauf der Übertragung war rot: die
  Artikel standen in umgekehrter Reihenfolge auf der Liste. Ursache ist das Einfrieren
  beim ersten Snapshot (`useShoppingList.ts:53-56`) — es ersetzte die Reihenfolge und
  warf damit weg, was dieses Gerät vorher angehängt hatte. Gegen Firestore trifft die
  erste Momentaufnahme erst nach dem Anlegen des Gerichts ein, und `nextFrozenOrder`
  sortierte die beiden Artikel mit gleichem `createdAt` nach der zufälligen
  Firestore-Id. `firstFrozenOrder` stellt die ankommenden Artikel jetzt **vor** die
  bereits angehängten, statt sie zu überschreiben.
- **Alle Artikel einer Übertragung tragen dasselbe `createdAt`** (so der Plan). Ihre
  Reihenfolge untereinander hält die eingefrorene Liste; nach einem "Aufräumen" ordnet
  `inCreationOrder` sie nach der Firestore-Id, also beliebig. Sie bleiben dabei
  beieinander, nur ihre innere Reihenfolge ist dann nicht mehr die des Gerichts.
- **Die E2E-Helfer liegen jetzt in `e2e/keyboard.ts`** und treffen Knöpfe und Felder
  exakt (`exact: true`). Ohne das kollidiert der Name des Navigationsknopfes
  "Einkaufsliste" mit "Auf die Einkaufsliste, <Gericht>".

## Verweise

- `docs/notes.txt` — Punkte *Tab-Leiste oben fixiert*, *Gerichte-Seite* und der Use Case
  zum doppelten Hinzufügen.
- `docs/agents/plans/2026-09-14-einkaufsliste-pwa-mit-firestore-sync.md` — MZP-001,
  insbesondere Entscheidung 5 (kein Router) und Kriterium 7 (stabile Liste).
- `.claude/skills/architecture/SKILL.md` — Bausteine, Anti-Patterns, Regeln zu `shared/`.
- `.claude/skills/architecture/references/typescript.md` — abgeschwächte Onion-Form im
  Frontend, Grenzdurchsetzung per ESLint.
- `.claude/projekt.md` — Bauart `onion`, Befehle, fachliche Kontexte.
- WAI-ARIA Authoring Practices, Muster *Tabs* — Begründung für den Verzicht auf
  `role="tablist"`: <https://www.w3.org/WAI/ARIA/apg/patterns/tabs/>
