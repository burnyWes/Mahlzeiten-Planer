---
date: 2026-09-18T06:36:57+00:00
git_commit: 7850583ebce44e2de0fce187db54e8f36d6d9b81
branch: main
story: MZP-006
topic: "Groessere Check-Haken auf der Einkaufsliste"
tags: [plan, shopping, ui, css, unconfirmed-writes]
status: ready
---

# PLAN: MZP-006 — Groessere Check-Haken auf der Einkaufsliste

Zwei Dinge, die an derselben Zeile haengen:

1. **Ein Bug.** Das Markierungsfeld reagiert erst auf den zweiten Klick. Ursache ist
   nicht die Zeile, sondern dass die Anzeige ausschliesslich die Firestore-Momentaufnahme
   zeigt und der Adapter zwei getrennt feuernde Listener zusammenmischt.
2. **Die Optik.** Das Markierungsfeld soll den Platz der Zeile ausnutzen, stilistisch
   nur mit Linie links und unten angedeutet sein, und abgehakt keinen gefuellten Kasten
   zeigen, sondern einen moeglichst grossen Haken in `#ff00cc` — in der invertierten
   Ansicht des Nutzers ein reines Neongruen.

Der Bug wird zuerst behoben. Ein Haken, der erst beim zweiten Klick erscheint, laesst
sich schlecht beurteilen.

Der Bugfix erledigt zugleich den bereits in `docs/notes.txt` notierten Bug zum
verzoegert erscheinenden Artikel — es ist dieselbe Ursache.

## Akzeptanzkriterien

### Ein Klick genuegt

- [ ] Ein Klick auf das Markierungsfeld aendert den Zustand sofort und genau einmal;
      VoiceOver liest unmittelbar danach den neuen Zustand.
- [ ] Beim Wiederoeffnen verschwindet die Zeile nicht kurzzeitig aus der Liste — auch
      dann nicht, wenn die Momentaufnahme den Artikel voruebergehend gar nicht traegt.
- [ ] Ein selbst hinzugefuegter Artikel steht sofort in der Liste, nicht erst nach
      Sekunden.
- [ ] Zweimaliges Umschalten vor der ersten Momentaufnahme fuehrt zurueck zum
      Ausgangszustand, ohne dass ein Schreibvorgang haengen bleibt.
- [ ] Offline bleibt der eigene Schreibvorgang sichtbar, bis Firestore ihn bestaetigt.
- [ ] Aendert das andere Geraet denselben Artikel — abgehakt oder Menge —, setzt sich
      dessen Stand durch, sobald die Momentaufnahme ihn bringt.
- [ ] Wird ein abgehakter Artikel aufgeraeumt, bevor sein Schreibvorgang bestaetigt ist,
      und ueberholt ihn danach das andere Geraet, taucht er als neue Aenderung wieder
      auf — `Aufraeumen, N Aenderungen` zaehlt ihn mit.
- [ ] `Einkaufsliste, N offen` und `Aufraeumen, N Aenderungen` zaehlen den eigenen
      Schreibvorgang sofort mit.

### Ein Haken, den man sieht

- [ ] Das Markierungsfeld ist 40 x 40 px: Linie links und unten, 3 px, `#000000`.
      Oben und rechts keine Linie.
- [ ] Abgehakt wird der Kasten nicht gefuellt, sondern ein Haken ueber die volle
      Kastenbreite gezeichnet, 5 px, `#ff00cc`.
- [ ] Der Haken bleibt vollstaendig innerhalb der 40 px und beruehrt die Kastenlinien
      nicht.
- [ ] Kasten und Haken sind aus CSS-Linien gezeichnet, nicht als SVG oder Bild.
- [ ] Der Zeilenabstand der Liste bleibt unveraendert (Zeilenhoehe 72 px wie heute).
- [ ] `body` traegt `#000000`. Die Signalfarben (`#991b1b` Fehlermeldung, `#14532d`
      und `#ffffff` Knoepfe) und die Grautoene fuer Rahmen und Trennlinien (`#4b5563`,
      `#d1d5db`, `#6b7280`) bleiben unveraendert.
- [ ] Das Feld bleibt ein `<input type="checkbox">`: Rolle, Zustand, Beschriftung und
      Tastaturbedienung unveraendert, axe ohne Befund.

**Nicht im Umfang:** der Windows-Kontrastmodus (`forced-colors`). Dort blendet das
Betriebssystem eigene Farben ein und `appearance: none` kann den Haken verschlucken.
Die App laeuft als PWA auf iOS, der Fall wird bewusst nicht abgedeckt.

## Wesentliche Entscheidungen und Abwaegungen

1. **Ursache des Doppelklicks:** Die Anzeige zeigt nur, was die Firestore-Momentaufnahme
   gebracht hat. Der Adapter fuehrt zwei Snapshot-Listener zusammen, die getrennt
   feuern; im Zwischenstand gewinnt die veraltete `offen`-Abfrage.
   - Warum: `useShoppingList.ts:75` liest `liveItems` roh;
     `firestoreShoppingListClient.ts:66` mischt `[...checkedOffThisSession, ...openItems]`,
     die offenen Artikel ueberschreiben also die abgehakten.
   - Auswirkung: Pro Klick zwei Renderdurchgaenge, der erste mit dem alten Zustand.

2. **Behebung ueber die optimistische Schicht:** `unconfirmedWrites` bekommt den
   Abhak-Zustand und wird auf die angezeigte Liste angewandt.
   - Warum: Behebt zugleich den notierten Bug beim Hinzufuegen, wirkt offline, und ist
     reine Domaene — test-getrieben ohne Firestore pruefbar.
   - Auswirkung: `liveItems` wird nur noch an einer Stelle veredelt; `shownItems`,
     `openCount`, `pendingChanges`, `cleanUp` und `knownItems` arbeiten alle auf
     demselben veredelten Stand.

3. **Ein Schreibvorgang gilt, solange die Momentaufnahme ihn weder bestaetigt noch
   ueberholt hat.** Dafuer merkt sich der Schreibvorgang zusaetzlich den Stand *vor*
   dem Schreiben.
   - Warum: Merkt man sich nur das Geschriebene, bleibt ein eigener Schreibvorgang fuer
     immer haengen, sobald das andere Geraet dazwischenfunkt. Mit dem Vorzustand lautet
     die Regel in drei Zeilen: bringt die Momentaufnahme den Artikel gar nicht, gilt der
     Schreibvorgang weiter; zeigt sie das Geschriebene, ist er bestaetigt; hat sie den
     Vorzustand verlassen, ist der Server weiter und der Schreibvorgang ueberholt.
   - Auswirkung: `UnconfirmedWrite` wird `{ written, before }` statt nur `written`.
     Offline bleibt der Vorzustand stehen, der eigene Haken haelt. Bei Kollision gewinnt
     das andere Geraet, sobald es ankommt. Zweimaliges Umschalten faellt als
     "bestaetigt" sofort heraus, weil `written` dann wieder dem Serverstand entspricht.
     Kein Zeitlimit noetig — ein Zeitlimit waere mit dem Offline-Betrieb unvereinbar,
     weil der eigene Haken dann nach Ablauf zurueckspringen wuerde.

4. **"Bringt die Momentaufnahme den Artikel gar nicht, gilt der Schreibvorgang weiter"
   ist erlaubt, weil kein Artikel geloescht werden kann.**
   - Warum: `ShoppingListClient` (`shoppingListClient.ts:8-14`) kennt kein Loeschen,
     und "Aufraeumen" ordnet nur die Ansicht um. Ein fehlender Artikel ist immer
     transient — genau der Zwischenstand, den der Bug erzeugt.
   - Auswirkung: Kommt spaeter echtes Loeschen dazu (steht als offener Punkt in
     `docs/notes.txt`), muss diese Regel mitwandern.

5. **Ein Schreibvorgang ohne Vorzustand — ein neu angelegter Artikel — wird am
   Geschriebenen gemessen, nicht am Vorzustand.**
   - Warum: Sonst faellt das Zusammenfassen auseinander. Legt man "Milch 2 l" an und
     fuegt sofort "Milch 1 l" hinzu, ist der zweite Schreibvorgang eine Mengenaenderung
     auf demselben Artikel, der Vorzustand aber immer noch "gar nicht da". Eine
     Momentaufnahme mit den ersten 2 l wuerde den Schreibvorgang sonst verwerfen und die
     Anzeige auf 2 l zurueckspringen lassen.
   - Auswirkung: Bewusst in Kauf genommen — aendert das andere Geraet einen frisch
     angelegten Artikel, bevor dessen eigener Schreibvorgang bestaetigt ist, bleibt der
     Schreibvorgang haengen. Das ist das heutige Verhalten, also keine Verschlechterung.

6. **Zwei Abfragen bleiben zwei Abfragen.** Die Zusammenfassung zu einer `or()`-Abfrage
   im Firestore-Adapter gehoert nicht in diesen Plan.
   - Warum: Zwei Baustellen an derselben Stelle machen einen Fehler schwerer
     einzukreisen. Ausserdem loest sie den Offline-Fall nicht.
   - Auswirkung: Wandert als `-`-Notiz nach `docs/notes.txt`.

7. **Gezeichnet wird mit CSS-Rahmen, nicht mit SVG.**
   - Warum: iOS' "Intelligentes Invertieren" laesst Bilder und SVG bewusst
     uninvertiert — der Haken bliebe pink statt gruen. CSS-Rahmenfarben werden
     mitinvertiert.
   - Auswirkung: `appearance: none` auf dem Markierungsfeld, Haken als `::before` mit
     zwei Rahmenkanten, um 45 Grad gedreht. Die Semantik bleibt nativ, es wird kein
     Knopf nachgebaut.

8. **Der Haken bleibt vollstaendig innerhalb des Kastens.**
   - Warum: Kein Ueberlappen mit Nachbarzeilen bei grosser Schrift — und die Geometrie
     haengt dann nicht davon ab, ob ein Browser das Pseudo-Element eines `input`
     beschneidet.
   - Auswirkung: Haken rund 31 px in einem Innenraum von 37 x 37 px, also rund 3 px
     Luft ringsum. Zentriert wird mit `inset: 0; margin: auto` statt mit gerechneten
     Randabstaenden.

9. **Der Haken traegt als einziges Element der Zeile eine Signalfarbe.** Kasten und Text
   sind schwarz.
   - Warum: Das Markierungsfeld soll nur angedeutet sein. Gegen rosa Linien
     (App-Gruen invertiert) muesste der Haken konkurrieren.
   - Auswirkung: `body { color: #000000 }`. Das Rot der Fehlermeldung und das Gruen der
     Knoepfe bleiben unangetastet, sie tragen Bedeutung.

### Die Farben im Klartext

Invertieren heisst "255 minus Farbwert". Die Sicht des Nutzers ist das Gegenstueck:

| Rolle | Original | Invertiert |
| --- | --- | --- |
| Hintergrund | `#ffffff` | `#000000` |
| Fliesstext (neu) | `#000000` | `#ffffff` |
| Kastenlinien | `#000000` | `#ffffff` |
| Haken | `#ff00cc` | `#00ff33` |

Kontrast des Hakens auf Weiss: 3,4 : 1. Als Grafikelement gilt die Schwelle 3 : 1
(WCAG 1.4.11), die 5 px starke Linie liegt darueber. Invertiert betraegt der Kontrast
15,3 : 1.

### Was die Klickflaeche angeht

`docs/notes.txt` fuehrt unter DONE ein `n Klickfläche zum abhaken vergrößern` — also
eine bewusste Absage. Dieser Plan widerspricht ihr nicht: die Klickflaeche ist schon
heute das ganze `<label>`, das wegen `display: flex` (`index.css:176`) die volle
Zeilenbreite und 44 px Hoehe einnimmt. Groesser wird nur der **gezeichnete** Kasten,
nicht das Ziel. `docs/notes.txt` wird an dieser Stelle nicht angefasst.

## Ausgangslage

```
ShoppingArea.tsx ──> ShoppingListPage.tsx ──> ShoppingItemRow.tsx
      │                                            │
      │                                            └─ <li><label>
      │                                                 <input type=checkbox checked={checkedOff}>
      │                                                 <span>Milch, 2 l</span>
      │
      └─ useShoppingList.ts
            knownItems  = withUnconfirmedWrites(liveItems, unconfirmedWrites)  ← nur fuer die Planung
            shownItems  = projectStableList(frozenOrder, liveItems)            ← roh
            openCount   = shownItems.filter(isOpen).length
            pendingChanges = pendingChangeCount(frozenOrder, liveItems)        ← roh
            cleanUp     = nextFrozenOrder(liveItems)                           ← roh
```

Die optimistische Schicht existiert also bereits, haengt aber nur an einem von vier
Verbrauchern. Und sie laesst den Abhak-Zustand bewusst aus — festgehalten im Test
`unconfirmedWrites.test.ts:58` *"leaves the check off state to the snapshot"*.

### Warum der erste Klick verpufft

`firestoreShoppingListClient.ts:59-97` betreibt zwei Listener, die getrennt feuern:

```
Listener A: where('checkedOffAt', '==', null)         → openItems
Listener B: where('checkedOffAt', '>=', sessionStart) → checkedOffThisSession

publish():  merged = new Map([...checkedOffThisSession, ...openItems])   (Z. 66)
                                                        ^^^^^^^^^^^^^ gewinnt
```

```
Abhaken von Milch
  B feuert zuerst → checkedOff={Milch abgehakt}, open={Milch offen, veraltet}
                  → open gewinnt → Milch wird als OFFEN gerendert
                  → VoiceOver liest "nicht markiert"        ← der Klick scheint zu verpuffen
  A feuert danach → open={} → Milch ist abgehakt            ← erst jetzt

Wieder oeffnen von Milch
  B feuert zuerst → checkedOff={}, open={} (A noch nicht da)
                  → Milch faellt ganz aus liveItems
                  → projectStableList filtert sie weg → DIE ZEILE VERSCHWINDET
  A feuert danach → Milch ist wieder da, offen
```

Zwei Renderdurchgaenge pro Klick, der erste mit dem alten Zustand. Das deckt sich mit
der vom Nutzer beobachteten Ansage-Folge, in der sich Ansagetext und Markierungszustand
gegeneinander verschieben.

Der zweite Fall ist der Grund fuer Entscheidung 4: die Momentaufnahme kann den Artikel
voruebergehend **gar nicht** enthalten. Eine Verwerf-Regel, die daraus "geloescht"
liest, wuerde genau den Bug reproduzieren, den dieser Plan behebt.

Die Unit-Tests schlagen nicht aus: `inMemoryShoppingListClient.ts:22-24` veroeffentlicht
synchron in einem Rutsch, dort gibt es keinen Zwischenzustand.

### Die Zeile heute

```
index.css:145  .itemList li                    padding: .75rem 0; border-bottom: 1px #d1d5db
index.css:176  .itemList label                 display:flex; gap:.75rem; min-height:44px
index.css:183  .itemList input[type=checkbox]  24px x 24px   ← natives Kaestchen
index.css:189  .itemCheckedOff span            text-decoration: line-through
index.css: 84  input                           border:1px #4b5563; border-radius:6px; padding:.5rem
index.css: 65  button,input,textarea           min-height: 44px
index.css: 15  body                            color: #111827
```

```
 ┌──────────────────────────────────────────┐
 │                                          │  ← li, padding .75rem oben/unten
 │   ┌────┐                                 │
 │   │ 24 │   Milch, 2 l                    │  ← label, min-height 44px
 │   └────┘                                 │
 │                                          │
 ├──────────────────────────────────────────┤  ← 1px #d1d5db
```

Zeilenhoehe 72 px (13,5 + 44 + 13,5 + 1), davon nutzt der Haken 24 px.

## Zielbild

```
useShoppingList.ts
      liveItems ← client.observeItems(...)
            │
            ▼
      settledItems = withUnconfirmedWrites(liveItems, unconfirmedWrites)   ← EINE Stelle
            │
            ├─ shownItems     = projectStableList(frozenOrder, settledItems)
            ├─ openCount      = shownItems.filter(isOpen).length
            ├─ pendingChanges = pendingChangeCount(frozenOrder, settledItems)
            ├─ cleanUp        = nextFrozenOrder(settledItems)
            └─ knownItems     = settledItems
```

Der Lebenslauf eines Schreibvorgangs:

```
 Klick auf Milch (offen)
      │
      ├─ client.checkOffItem(id)                        → geht an Firestore
      └─ rememberWrite(writes, checkOff(milk), before)   → before = Stand in liveItems
                                                            zum Zeitpunkt des Klicks
      Anzeige: sofort abgehakt.

 Spaeter, bei jeder Momentaufnahme — dropConfirmedWrites:

      Artikel nicht in der Momentaufnahme  → behalten  (transienter Zwischenstand)
      Momentaufnahme zeigt das Geschriebene → verwerfen (bestaetigt)
      kein Vorzustand (neuer Artikel)       → behalten  (siehe Entscheidung 5)
      Momentaufnahme zeigt den Vorzustand   → behalten  (noch nicht angekommen)
      sonst                                 → verwerfen (vom anderen Geraet ueberholt)
```

Die Zeile nachher:

```
 nicht markiert                     markiert
 ┌──────────────────────────────┐   ┌──────────────────────────────┐
 │                              │   │                              │
 │  │                           │   │  │          ╱                │
 │  │           Milch, 2 l      │   │  │        ╱   Milch, 2 l     │   ← durchgestrichen
 │  │                           │   │  │  ╲   ╱                    │
 │  └────────                   │   │  └────╳──                    │
 │                              │   │                              │
 ├──────────────────────────────┤   ├──────────────────────────────┤
 40 x 40 px, Linie links+unten      Haken ~31 px, 5 px stark, #ff00cc
 3 px, #000000                      (invertiert: #00ff33)
 oben und rechts unsichtbar         der Kasten bleibt ungefuellt
```

Zeilenhoehe bleibt 72 px: das Label ist 44 px hoch, der 40-px-Kasten passt mit 2 px
Luft hinein.

## Abstraktionen und Wiederverwendung

Genutzt wird durchweg, was schon da ist. Neu ist nur der Vorzustand im Schreibvorgang.
Den Test-Doppelgaenger fuer verzoegerte Momentaufnahmen gibt es bereits — er wird
erweitert, nicht neu gebaut.

- `src/shopping/domain`
  - `unconfirmedWrites.ts` — traegt jetzt den Vorzustand und den ganzen Artikel
    - `UnconfirmedWrite` — neuer Typ `{ written, before }`
    - `rememberWrite` — nimmt den Vorzustand entgegen und behaelt den aeltesten
    - `withUnconfirmedWrites` — setzt den geschriebenen Artikel ganz ein, nicht nur
      dessen Menge
    - `dropConfirmedWrites` — bestaetigt, ueberholt oder behaelt
    - `sameItemState` — neu, vergleicht Name, Menge und Abhak-Zustand
- `src/shopping/ui`
  - `useShoppingList.ts` — `settledItems` als einzige Quelle aller Ableitungen
    - `carryOut` — liefert `UnconfirmedWrite` statt `ShoppingItem`
    - `carryOutAll` — rechnet mit `UnconfirmedWrite`
    - `toggleItem` — merkt sich den Schreibvorgang
  - `ShoppingArea.test.tsx` — der vorhandene `createLaggingShoppingListClient` kann
    kuenftig eine frei gewaehlte Momentaufnahme zustellen
- `src/index.css` — Fliesstext schwarz, Markierungsfeld der Einkaufsliste neu gezeichnet
- `docs/notes.txt` — erledigten Bug nach DONE, `or()`-Abfrage als neue Notiz

Nicht angefasst: `ShoppingItemRow.tsx` bleibt wie es ist — die Zeile ist bereits ein
natives Markierungsfeld in einem Label, die gesamte Optik steckt im CSS.
`inMemoryShoppingListClient.ts` bleibt ebenfalls unberuehrt; die Faehigkeit, eine
Momentaufnahme zurueckzuhalten, gehoert in den Test, nicht in den ausgelieferten Fake.

## Logging und Beobachtbarkeit

Keine Aenderung. Die App schreibt keine Logs; die Rueckmeldung an den Nutzer laeuft
ueber den `Announcer` (`role="status"`), dessen Texte unveraendert bleiben.

## Umsetzung

### Phase 1: Ein Klick genuegt

Abhaengigkeiten: keine

Die eigenen Schreibvorgaenge werden Teil der angezeigten Liste. Damit sitzt der Haken
im selben Renderdurchgang wie der Klick, unabhaengig davon, wann und in welcher
Reihenfolge die beiden Firestore-Listener feuern.

**Aufgaben**:

- [ ] `src/shopping/domain/unconfirmedWrites.test.ts`: die Tests fuer den neuen
      Vertrag schreiben, bevor der Code steht. Der bestehende Test
      *"leaves the check off state to the snapshot"* (Z. 58) wird durch sein Gegenteil
      ersetzt.
  - `rememberWrite` behaelt den Vorzustand des aeltesten Schreibvorgangs desselben
    Artikels
  - `withUnconfirmedWrites` hebt den Abhak-Zustand an, den die Momentaufnahme noch
    nicht traegt
  - `withUnconfirmedWrites` haengt einen noch nicht gelieferten Artikel an
  - `dropConfirmedWrites` behaelt einen Schreibvorgang, dessen Artikel gerade gar nicht
    in der Momentaufnahme steht
  - `dropConfirmedWrites` verwirft einen Schreibvorgang, den die Momentaufnahme traegt
  - `dropConfirmedWrites` behaelt einen Schreibvorgang, solange die Momentaufnahme noch
    den Vorzustand zeigt
  - `dropConfirmedWrites` verwirft einen Schreibvorgang, den das andere Geraet ueberholt
    hat — die Momentaufnahme zeigt weder den Vorzustand noch das Geschriebene
  - `dropConfirmedWrites` behaelt einen Schreibvorgang ohne Vorzustand, solange die
    Momentaufnahme etwas anderes zeigt als das Geschriebene
  - `dropConfirmedWrites` verwirft einen Schreibvorgang, dessen Geschriebenes dem
    Vorzustand entspricht, sobald die Momentaufnahme ihn traegt (zweimal umgeschaltet)
- [ ] `src/shopping/domain/unconfirmedWrites.ts`: den Typ und die drei Funktionen
      umstellen. Der Import von `withQuantity` faellt dabei weg und muss entfernt
      werden, sonst bricht `npm run lint`.

      ```ts
      export type UnconfirmedWrite = {
        written: ShoppingItem
        before: ShoppingItem | null
      }

      export type UnconfirmedWrites = readonly UnconfirmedWrite[]

      function sameItemState(one: ShoppingItem, other: ShoppingItem): boolean {
        return (
          one.name === other.name &&
          one.checkedOffAt === other.checkedOffAt &&
          sameQuantity(one.quantity, other.quantity)
        )
      }

      export function rememberWrite(
        writes: UnconfirmedWrites,
        written: ShoppingItem,
        before: ShoppingItem | null,
      ): UnconfirmedWrites {
        const earlier = writes.find((write) => write.written.id === written.id)
        return [
          ...writes.filter((write) => write.written.id !== written.id),
          { written, before: earlier === undefined ? before : earlier.before },
        ]
      }

      export function withUnconfirmedWrites(
        liveItems: readonly ShoppingItem[],
        writes: UnconfirmedWrites,
      ): readonly ShoppingItem[] {
        const pending = new Map<ItemId, ShoppingItem>(
          writes.map((write) => [write.written.id, write.written]),
        )
        const known = liveItems.map((item) => {
          const written = pending.get(item.id)
          pending.delete(item.id)
          return written ?? item
        })
        return [...known, ...pending.values()]
      }

      export function dropConfirmedWrites(
        writes: UnconfirmedWrites,
        liveItems: readonly ShoppingItem[],
      ): UnconfirmedWrites {
        return writes.filter((write) => {
          const live = liveItems.find((item) => item.id === write.written.id)
          if (live === undefined) return true
          if (sameItemState(live, write.written)) return false
          if (write.before === null) return true
          return sameItemState(live, write.before)
        })
      }
      ```

      Der aelteste Vorzustand gewinnt in `rememberWrite`, weil er den letzten
      bestaetigten Serverstand beschreibt. Wuerde ein zweiter Klick den Vorzustand
      ueberschreiben, traege er den optimistischen Stand und der Schreibvorgang wuerde
      als "ueberholt" sofort wieder verworfen.
- [ ] `src/shopping/ui/useShoppingList.ts`: `settledItems` einfuehren und alle
      Ableitungen darauf umstellen.

      ```ts
      const settledItems = withUnconfirmedWrites(liveItems, unconfirmedWrites)
      const shownItems = projectStableList(frozenOrder, settledItems)
      const openCount = shownItems.filter(isOpen).length
      ```

      `pendingChanges` und `cleanUp` bekommen ebenfalls `settledItems`; `knownItems`
      entfaellt als eigene Berechnung und wird zu `settledItems`.
- [ ] `src/shopping/ui/useShoppingList.ts`: `carryOut` liefert einen
      `UnconfirmedWrite` statt eines `ShoppingItem`. Beim Zusammenfassen ist `before`
      der Artikel aus `liveItems`, beim neuen Artikel `null`.

      ```ts
      const carryOut = useCallback(
        (outcome: AdditionOutcome): UnconfirmedWrite => {
          if (outcome.kind === 'mergedInto') {
            client.changeQuantity(outcome.into.id, outcome.quantity)
            return {
              written: withQuantity(outcome.into, outcome.quantity),
              before: liveItems.find((live) => live.id === outcome.into.id) ?? null,
            }
          }
          return {
            written: {
              ...outcome.item,
              id: client.addItem(outcome.item),
              checkedOffAt: null,
            },
            before: null,
          }
        },
        [client, liveItems],
      )
      ```

      `outcome.into` stammt aus `settledItems` und kann selbst optimistisch sein — der
      Vorzustand muss deshalb aus `liveItems` kommen, nicht aus `outcome.into`.
- [ ] `src/shopping/ui/useShoppingList.ts`: `carryOutAll` (heute Z. 93-108) auf den
      neuen Typ heben. Beide `reduce`-Aufrufe brechen sonst die Typpruefung:
      `written.reduce(rememberWrite, writes)` wuerde als dritten Parameter den Index
      durchreichen, und `item.id` gibt es auf `UnconfirmedWrite` nicht.

      ```ts
      setUnconfirmedWrites((writes) =>
        written.reduce(
          (sofar, write) => rememberWrite(sofar, write.written, write.before),
          writes,
        ),
      )
      setFrozenOrder((order) =>
        written.reduce(
          (sofar, write) => appendToFrozenOrder(sofar, write.written.id),
          order,
        ),
      )
      ```

      `outcomes.forEach(... recordUse ...)` bleibt unveraendert, es arbeitet auf
      `outcomes`, nicht auf `written`.
- [ ] `src/shopping/ui/useShoppingList.ts`: `toggleItem` merkt sich den
      Schreibvorgang. `checkOff` und `reopen` muessen dafuer neu aus
      `../domain/shoppingItem` importiert werden.

      ```ts
      const toggleItem = useCallback(
        (item: ShoppingItem) => {
          const before = liveItems.find((live) => live.id === item.id) ?? null
          if (isOpen(item)) {
            client.checkOffItem(item.id)
            setUnconfirmedWrites((writes) =>
              rememberWrite(writes, checkOff(item, Date.now()), before),
            )
            return checkOffAnnouncement(item, openCount - 1)
          }
          client.reopenItem(item.id)
          setUnconfirmedWrites((writes) => rememberWrite(writes, reopen(item), before))
          return reopenAnnouncement(item, openCount + 1)
        },
        [client, liveItems, openCount],
      )
      ```
- [ ] `src/shopping/ui/ShoppingArea.test.tsx`: `createLaggingShoppingListClient`
      (Z. 51-71) um eine frei waehlbare Momentaufnahme erweitern. `deliverSnapshot()`
      stellt bisher nur den echten Stand zu und kann damit keine **widerspruechliche**
      Momentaufnahme nachstellen — genau die erzeugt aber der Bug.

      ```ts
      snapshotArrives(items: readonly ShoppingItem[]) {
        waitingForSnapshot?.(items)
      }
      ```
- [ ] `src/shopping/ui/ShoppingArea.test.tsx`: die Faelle ergaenzen, die den Bug
      festhalten:
  - hakt den Artikel beim ersten Klick ab, bevor die Momentaufnahme eintrifft
  - oeffnet den Artikel beim ersten Klick wieder und behaelt die Zeile, auch wenn die
    naechste Momentaufnahme den Artikel gar nicht enthaelt (`snapshotArrives([])`)
  - zeigt einen hinzugefuegten Artikel sofort in der Liste
  - zaehlt `Einkaufsliste, N offen` und `Aufraeumen, N Aenderungen` sofort mit
  - uebernimmt den Stand des anderen Geraets, sobald die Momentaufnahme ihn bringt —
    sowohl beim Abhaken als auch bei der Menge
  - fuehrt zweimaliges Umschalten vor der ersten Momentaufnahme zurueck zum
    Ausgangszustand
  - laesst einen zu frueh aufgeraeumten Artikel wieder als Aenderung auftauchen, wenn
    das andere Geraet ihn offen zurueckmeldet
- [ ] `docs/notes.txt`: den Bug *"Ein selbst hinzugefuegter Artikel erscheint
      gelegentlich erst nach Sekunden..."* (Z. 52-56) auf `x` setzen und nach DONE
      verschieben. Sonst nichts an der Datei umsortieren oder umformulieren.
- [ ] `docs/notes.txt`: unter TODO anhaengen:

      ```
      - Firestore-Adapter: die zwei Snapshot-Listener (offen / diese Sitzung abgehakt)
        zu einer or()-Abfrage zusammenfassen. Dann gibt es keinen Zwischenstand mehr,
        in dem die veraltete "offen"-Abfrage die abgehakte ueberschreibt oder der
        Artikel kurz aus beiden Abfragen faellt. Seit MZP-006 faengt die optimistische
        Anzeige das ab, die Momentaufnahme bleibt aber kurzzeitig in sich
        widerspruechlich.
      ```

**Automatisierte Verifikation**:

- [ ] `npm run test` laeuft durch, insbesondere `unconfirmedWrites.test.ts` und
      `ShoppingArea.test.tsx`
- [ ] `npm run lint` laeuft durch (faengt den ungenutzten `withQuantity`-Import)
- [ ] `npm run build` laeuft durch (Typpruefung `tsc -b`, faengt die beiden `reduce`)
- [ ] `npm run format:check` laeuft durch
- [ ] `npm run test:e2e` laeuft durch; der bisher gelegentlich rote Test
      *"sign in, add, check off and clean up using the keyboard only"* ist stabil

**Manuelle Verifikation**:

- [ ] Auf dem Geraet mit VoiceOver: ein Artikel wird beim **ersten** Antippen abgehakt,
      die Ansage nennt den neuen Zustand, und das Markierungsfeld wird als "markiert"
      gelesen.
- [ ] Nochmals antippen: der Artikel ist beim ersten Antippen wieder offen, die Zeile
      bleibt dabei durchgehend an ihrem Platz.
- [ ] Flugmodus einschalten, einen Artikel abhaken: der Haken bleibt stehen. Flugmodus
      aus: der Haken bleibt stehen, es springt nichts zurueck.
- [ ] Am zweiten Geraet denselben Artikel wieder oeffnen: der Stand des zweiten Geraets
      setzt sich auf dem ersten durch.

### Phase 2: Ein Haken, den man sieht

Abhaengigkeiten: Phase 1

Das Markierungsfeld der Einkaufsliste wird selbst gezeichnet, der Fliesstext wird
schwarz. Die Zeile behaelt ihre Hoehe.

**Aufgaben**:

- [ ] `src/index.css:15`: `body { color: #111827 }` wird `body { color: #000000 }`.
      Die Fehlermeldung `.failure` (`#991b1b`), die Knopffarben (`#14532d`, `#ffffff`)
      und die Grautoene (`#4b5563`, `#d1d5db`, `#6b7280`) bleiben unveraendert.
- [ ] `src/index.css:183-187`: die Regel `.itemList input[type='checkbox']` ersetzen.

      ```css
      .itemList input[type='checkbox'] {
        appearance: none;
        position: relative;
        box-sizing: border-box;
        flex: none;
        width: 40px;
        height: 40px;
        min-height: 40px;
        margin: 0;
        padding: 0;
        border: none;
        border-left: 3px solid #000000;
        border-bottom: 3px solid #000000;
        border-radius: 0;
        background-color: transparent;
      }
      ```

      `border: none` und `border-radius: 0` heben die allgemeine `input`-Regel
      (`index.css:84`) auf, `min-height: 40px` die Regel fuer
      `button, input, textarea` (`index.css:65`). Beide werden von der Spezifitaet
      dieser Regel geschlagen (0,2,1 gegen 0,0,1). `flex: none` verhindert, dass das
      Feld im Label schrumpft.
- [ ] `src/index.css`: den Haken als Pseudo-Element ergaenzen.

      ```css
      .itemList input[type='checkbox']:checked::before {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        box-sizing: border-box;
        width: 15px;
        height: 29px;
        border-right: 5px solid #ff00cc;
        border-bottom: 5px solid #ff00cc;
        transform: rotate(45deg);
      }
      ```

      Zwei Rahmenkanten bilden ein Winkelstueck; um 45 Grad gedreht wird daraus ein
      Haken mit kurzem und langem Arm.

      `box-sizing` erbt nicht — ohne die eigene Angabe waere der Rahmenkasten
      `20 x 34` statt `15 x 29`, und der Haken wuerde unten und rechts aus dem Kasten
      ragen. So ist das umschliessende Quadrat nach der Drehung
      `(15 + 29) / Wurzel(2)` = rund 31,1 px.

      `inset: 0; margin: auto` zentriert das Pseudo-Element in der Polsterbox des
      `input` — die ist wegen `border-left` und `border-bottom` 37 x 37 px gross. Damit
      bleiben rund 3 px Luft ringsum, ohne gerechnete Randabstaende, und die Drehung um
      den eigenen Mittelpunkt aendert daran nichts.
- [ ] `src/index.css`: pruefen, dass `.itemCheckedOff span { text-decoration:
      line-through }` (Z. 189) und die `:focus-visible`-Umrandung (Z. 72) unveraendert
      greifen.

**Automatisierte Verifikation**:

- [ ] `npm run test` laeuft durch; die bestehenden Tests in `ShoppingArea.test.tsx`
      halten fest, dass das Feld weiterhin `role="checkbox"` hat, den Zustand meldet
      und per Klick umschaltet
- [ ] Der Test *"has no accessibility violations with a checked off item"* bleibt gruen
- [ ] `npm run lint`, `npm run build` und `npm run format:check` laufen durch

**Manuelle Verifikation**:

- [ ] In der normalen Ansicht: das Markierungsfeld zeigt nur die Linie links und unten,
      abgehakt erscheint ein grosser pinkfarbener Haken in einem ungefuellten Kasten.
- [ ] In der invertierten Ansicht des Nutzers: der Haken erscheint neongruen, Kasten und
      Text weiss.
- [ ] Der Haken sitzt mittig im Kasten, ragt nirgends heraus und beruehrt weder die
      Kastenlinien noch die Trennlinie der Zeile.
- [ ] Der Zeilenabstand der Liste ist unveraendert gegenueber vorher.
- [ ] Bei vergroesserter Systemschrift laufen die Zeilen nicht ineinander.
- [ ] Mit VoiceOver: das Feld wird weiterhin als "Markierungsfeld" mit Artikelname und
      Zustand gelesen; per Tastatur ist es erreichbar, die Fokusumrandung ist sichtbar,
      und die Leertaste schaltet um.

## Notizen zur Umsetzung

Hier waehrend der Umsetzung Rueckmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/notes.txt` — der bereits notierte Bug zum verzoegert erscheinenden Artikel,
  gleiche Ursache
- `docs/agents/plans/2026-09-14-einkaufsliste-pwa-mit-firestore-sync.md` — MZP-002,
  Ursprung von `unconfirmedWrites` und `stableList`
- WCAG 2.2, Erfolgskriterium 1.4.11 "Non-text Contrast" — Schwelle 3 : 1 fuer
  Grafikelemente: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- MDN, "Advanced form styling" — `appearance: none` mit `::before` auf
  `input[type="checkbox"]`:
  https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Advanced_form_styling
- Safari unterstuetzt `appearance` ohne Praefix seit 15.4:
  https://developer.apple.com/documentation/safari-release-notes/safari-15_4-release-notes
