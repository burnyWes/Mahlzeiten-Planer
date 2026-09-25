---
date: 2026-09-25T07:19:00+00:00
git_commit: 648a80321e5f67f44d54b6fbbc93635431c50526
branch: main
story: MZP-027
topic: "Verspätete Momentaufnahmen beheben"
tags: [plan, bugfix, meals, supplies, shopping, unconfirmedWrites, firestore]
status: ready
---

# PLAN: MZP-027 — Verspätete Momentaufnahmen beheben

Alle Bugs (`b`) aus `docs/notes.txt` werden behoben. Bis auf einen haben sie dieselbe
Wurzel: Firestore liefert die Momentaufnahmen eigener Schreibvorgänge teils erst nach
späteren Schreibvorgängen aus (festgestellt in MZP-025), und die optimistische Anzeige
von Vorräten und Einkaufsliste deutet solche Momentaufnahmen falsch.

| # | Eintrag in `notes.txt` | Phase |
|---|---|---|
| 1 | `domainLayerBoundary.test.ts` in der 5000-ms-Grenze | 1 (nur abhaken, behoben durch `760fbe3`) |
| 2 | `useSupplies` übernimmt jede Momentaufnahme ungeprüft | 1 |
| 3 | Wochenplan-Übertragung trifft Bug 2 häufiger | 1 |
| 4 | Stepper: `rememberWrite` behält nur das `before` des ersten Schritts | 2 |
| 5 | anderes Gerät löscht bei eigenem offenem Schritt → Geisterzeile | 3 |
| 6 | Entfernen eines unbestätigten Artikels gilt zu früh als bestätigt | 4 |

Dazu erledigt Phase 3 den TODO-Eintrag „Firestore-Adapter: die zwei Snapshot-Listener
… zu einer or()-Abfrage zusammenfassen“.

## Akzeptanzkriterien

- Eine verspätete Momentaufnahme eines früheren eigenen Vorrats-Stands setzt weder die
  Anzeige noch die Rechengrundlage von `changeSupply` zurück.
- Änderungen des anderen Geräts an Vorräten ohne eigenen offenen Stand erscheinen sofort.
- Mehrere Vorräte, die die Wochenplan-Übertragung auf einen Druck abbucht, bleiben alle auf
  ihrem neuen Stand.
- Mehrere schnelle Stepper-Schritte: Eine verspätete Momentaufnahme mit einem eigenen
  Zwischenstand lässt die Anzeige nicht zurückspringen.
- Ein Stand des anderen Geräts, der kein eigener Stand ist, überholt den eigenen
  Schreibvorgang weiterhin. Das Abhaken bestätigt sich wie heute.
- Die Einkaufsliste hört auf genau eine `or()`-Abfrage (offen ODER in dieser Sitzung
  abgehakt). Beim Abhaken fehlt der Artikel in keiner Momentaufnahme.
- Löscht das andere Gerät einen Artikel, während hier ein Schritt offen ist, verschwindet
  die Zeile, und es kommt keine Ansage „Konnte nicht gespeichert werden.“.
- Ein noch unbestätigt angelegter Artikel, der per „Weniger“ entfernt wird, taucht nicht
  wieder auf.
- In `docs/notes.txt` stehen alle sechs `b`-Einträge und der TODO-Eintrag zur
  `or()`-Abfrage mit `x` unter DONE.

## Wesentliche Entscheidungen und Abwägungen

1. **Vorräte werden je `mealId` überlagert, nicht als ganze Liste.**
   - Warum: `supplies` ist eine Sammlung einzelner Dokumente. Ein Schutz über die ganze
     Liste wie beim Wochenplan (`isStaleSnapshot`) würde jede Fremdänderung blockieren,
     solange ein eigener Schreibvorgang offen ist.
   - Auswirkung: Ein neuer Baustein `meals/domain/unconfirmedSupplies.ts` merkt sich je
     `mealId` den letzten eigenen Stand (`Supply` oder `null` für entfernt). Ein offener
     Stand gilt, bis eine Momentaufnahme genau ihn trägt. Wegen der lokalen
     Latenzkompensation kommt diese Momentaufnahme immer.
   - Akzeptierte Grenze: Wird ein Vorrat angelegt und sofort wieder entfernt, kann eine
     sehr alte Momentaufnahme ohne ihn das Entfernen zu früh bestätigen, und eine spätere
     verspätete mit ihm lässt ihn kurz wieder erscheinen. Das bekommt einen `b`-Eintrag in
     `notes.txt`, gelöst wird es hier nicht.
2. **Eigene Zwischenstände halten einen Schreibvorgang stehen.**
   - Warum: Ein verspäteter Zwischenstand ist kein Überholen durch das andere Gerät. Die
     Prüfung auf „überholt“ bleibt nötig, weil Hook und Adapter beim Abhaken je ein
     eigenes `Date.now()` nehmen (`useShoppingList.ts:220`,
     `firestoreShoppingListClient.ts:112`). Das Abhaken bestätigt sich deshalb nur über
     diesen Weg.
   - Auswirkung: `UnconfirmedWrite` bekommt neben `before` die Liste `earlierWrites` der
     überholten eigenen Stände. `dropConfirmedWrites` behält einen Schreibvorgang,
     solange die Momentaufnahme `before` oder einem Stand aus `earlierWrites` gleicht.
     Anders als in der Diskussion skizziert (`before → passed`) bleibt `before` ein
     eigenes Feld: Phase 3 muss unterscheiden können, ob der Artikel vor dem ersten
     Schritt schon in einer Momentaufnahme stand.
3. **Eine `or()`-Abfrage, danach heißt „fehlt“ gelöscht.**
   - Warum: Mit zwei Listenern fällt ein Artikel beim Abhaken kurz aus beiden Abfragen.
     Erst ohne diese Lücke lässt sich eine Löschung auf dem anderen Gerät am Fehlen
     erkennen, ohne dass Zeilen flackern und VoiceOver den Fokus verliert.
   - Auswirkung: Der Adapter hört auf
     `or(where('checkedOffAt', '==', null), where('checkedOffAt', '>=', sessionStartedAt))`.
     `dropConfirmedWrites` verwirft einen Schreibvorgang mit `before !== null`, dessen
     Dokument fehlt. Angelegte Artikel (`before === null`) bleiben stehen, bis sie
     ankommen. Schlägt `updateDoc` mit `not-found` fehl, sagt der Adapter nichts an.
   - Risiko: Firestore zerlegt `or()` in Teilabfragen auf einem einzigen Feld, dafür
     reichen die automatischen Einzelfeld-Indizes. Die Dokumentation sagt das nicht
     ausdrücklich, und der Emulator prüft keine Indizes. Deshalb wird der Adapter zuerst
     umgebaut und sofort per E2E geprüft, die echte Datenbank prüft die manuelle
     Verifikation.
4. **Ein Entfernen gilt erst nach dem Sichten als bestätigt.**
   - Warum: Fehlt ein Artikel, der noch nie in einer Momentaufnahme stand, bestätigt das
     nichts.
   - Auswirkung: `UnconfirmedRemovals` wird zu `readonly { id, seen }[]`. `seen` ist beim
     Entfernen `true`, wenn der Artikel in `liveItems` steht, und wird `true`, sobald eine
     Momentaufnahme ihn enthält. Bestätigt ist das Entfernen, wenn eine Momentaufnahme ihn
     nach dem Sichten nicht mehr enthält. Nie gesichtete IDs bleiben bis zum Ende der
     Sitzung stehen. Das ist harmlos, weil Firestore Dokument-IDs nie wieder vergibt.
5. **Bug 1 wird nur abgehakt.**
   - Warum: `760fbe3` (18.09., 14:54 Uhr) hat `testTimeout` für die Datei auf 30 s gesetzt,
     40 Minuten nach der Notiz.
   - Auswirkung: Nach einem grünen Gesamtlauf von `npm run test` auf `x` setzen und nach
     DONE verschieben.

## Ausgangslage

```
useWeekPlan (behoben, MZP-025)      useSupplies                   useShoppingList
─────────────────────────────       ───────────                   ───────────────
isStaleSnapshot: letzter eigener    publish(snapshot) übernimmt   UnconfirmedWrite je Artikel
Plan, abweichende Momentauf-        alles, auch veraltete Stände  { written, before }
nahmen verworfen                    useSupplies.ts:25-30          + UnconfirmedRemovals (IDs)
meals/domain/unconfirmedWrite.ts                                  shopping/domain/unconfirmedWrites.ts
```

Bug 2 (E2E „recounts a supply and removes it again“):
```
Anzeige:  1 ──(auf 4 ändern)──> 4 ──(verspätete Momentaufnahme)──> 1   ✗
kept.current wird ebenfalls 1 → der nächste changeSupply rechnet mit 1
```

Bug 4:
```
Schritte 1 → 2 → 3      rememberWrite: { written: 3, before: 1 }
verspätet kommt 2       weder written noch before → "überholt" → verworfen
Anzeige                 3 → 2 → 3
```

Bug 5:
```
B: Milch 2 → 3 (offen)   A: löscht Milch
B-Momentaufnahme ohne Milch → dropConfirmedWrites behält (live === undefined)
withUnconfirmedWrites hängt Milch 3 an → Geisterzeile
updateDoc → "Konnte nicht gespeichert werden."
```

Bug 6:
```
addItem Milch (offen) → "Weniger" → removals = [milch]
alte Momentaufnahme ohne Milch → dropConfirmedRemovals: bestätigt → removals = []
Momentaufnahme mit Milch (vom Anlegen) → Geisterzeile
```

Adapter heute (`firestoreShoppingListClient.ts:59-96`): zwei `onSnapshot` auf
`checkedOffAt == null` und `checkedOffAt >= sessionStartedAt`, zusammengeführt über zwei
Maps und `answered`. Jeder Listener veröffentlicht für sich.

## Zielbild

```
useSupplies
  live (letzte Momentaufnahme) ─┐
                                ├─ withUnconfirmedSupplies ─> kept.current / supplies
  unconfirmed (je mealId)      ─┘
  Momentaufnahme: unconfirmed = dropConfirmedSupplies(unconfirmed, live)
  keepSupply / removeSupply: erst rememberSupplyWrite, dann client

useShoppingList
  UnconfirmedWrite  { written, before, earlierWrites }
  UnconfirmedRemoval { id, seen }
  Adapter: eine or()-Abfrage, not-found bei updateDoc still
```

`dropConfirmedWrites` als Entscheidung je Schreibvorgang:

```
Momentaufnahme …                              → Schreibvorgang
fehlt,  before === null (angelegt)            → behalten
fehlt,  before !== null (bekannt)             → verwerfen (anderswo gelöscht)   [Phase 3]
gleicht written                               → verwerfen (bestätigt)
gleicht before oder einem earlierWrites-Stand → behalten (noch nicht angekommen)
before === null und kein earlierWrites        → behalten
sonst                                         → verwerfen (überholt)
```

## Abstraktionen und Wiederverwendung

- `src/meals/domain`
  - `unconfirmedSupplies.ts` (neu)
    - `UnconfirmedSupply = { mealId: MealId; supply: Supply | null }`, `UnconfirmedSupplies`
    - `rememberSupplyWrite(unconfirmed, mealId, supply | null)` - ersetzt den Stand dieser `mealId`
    - `withUnconfirmedSupplies(live, unconfirmed)` - überlagert: ersetzt, fügt an oder blendet aus (baut auf `withSupply` / `withoutSupply` aus `supply.ts`)
    - `dropConfirmedSupplies(unconfirmed, live)` - verwirft, was `supplyOf(live, mealId)` gleicht (`null` gleicht fehlend, sonst gleiche `count`)
  - `unconfirmedSupplies.test.ts` (neu)
- `src/meals/ui`
  - `useSupplies.ts` - `live`- und `unconfirmed`-Refs, `show()` statt `publish`
  - `useSupplies.test.tsx` - verzögernder Client wie in `useWeekPlan.test.tsx`
- `src/shopping/domain`
  - `unconfirmedWrites.ts` - `earlierWrites`, Löschregel, `UnconfirmedRemoval` mit `seen`
  - `unconfirmedWrites.test.ts`
- `src/shopping/ui/useShoppingList.ts` - `before`/`seen` an den Aufrufstellen
- `src/shopping/api/firestoreShoppingListClient.ts` - `or()`-Abfrage, `not-found` still
- `e2e/emulatorHousehold.ts` - neuer Helfer `removeItemOnServer(name)`
- `e2e/shoppingList.spec.ts` - neuer Test zu Bug 5
- `docs/notes.txt` - Einträge abhaken, Grenze aus Entscheidung 1 als `b` anhängen

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Vorräte gegen verspätete Momentaufnahmen schützen

Abhängigkeiten: keine

`useSupplies` überlagert jede Momentaufnahme mit den eigenen offenen Ständen je Vorrat.
Damit sind die Bugs 2 und 3 erledigt. Bug 1 wird nach dem grünen Gesamtlauf abgehakt.

**Aufgaben**:
- [ ] Test-first `src/meals/domain/unconfirmedSupplies.test.ts`, mindestens:
  - `overlays the own count while the snapshot still shows an earlier one`
  - `hides a supply removed here while the snapshot still carries it`
  - `adds a supply kept here that the snapshot has not delivered yet`
  - `takes supplies without an own write straight from the snapshot`
  - `drops an own write once the snapshot carries its count`
  - `drops an own removal once the snapshot no longer carries the supply`
  - `keeps an own write while the snapshot shows another count`
  - `replaces an earlier own write of the same meal`
- [ ] `src/meals/domain/unconfirmedSupplies.ts` mit den oben genannten Funktionen.
- [ ] Test-first in `src/meals/ui/useSupplies.test.tsx` einen verzögernden Client
  `createLaggingSuppliesClient` (Muster: `createLaggingWeekPlanClient` in
  `useWeekPlan.test.tsx`: hält die Momentaufnahmen eigener Schreibvorgänge zurück,
  `deliverNextSnapshot()`, `suppliesArriveFromElsewhere()`), dazu:
  - `keeps a later count when the snapshot of an earlier one arrives late`
  - `counts on from the shown supply after a late snapshot`
  - `keeps every supply spent at once when their snapshots arrive late`
  - `keeps a removed supply hidden while a late snapshot still carries it`
  - `shows a supply the other device changed while an own write waits`
- [ ] `src/meals/ui/useSupplies.ts` umbauen:
  ```ts
  const live = useRef<readonly Supply[]>([])
  const unconfirmed = useRef<UnconfirmedSupplies>([])

  const show = useCallback(() => {
    kept.current = withUnconfirmedSupplies(live.current, unconfirmed.current)
    setSupplies(kept.current)
  }, [])
  // observeSupplies: live.current = arriving; unconfirmed.current =
  //   dropConfirmedSupplies(unconfirmed.current, arriving); show()
  // keepSupply/removeSupply: rememberSupplyWrite zuerst, dann show(), dann client
  ```
  Die Reihenfolge ist wichtig: Der In-Memory-Client veröffentlicht synchron in
  `writeSupply`, der Stand muss deshalb vorher gemerkt sein.
- [ ] Die bestehenden Tests in `useSupplies.test.tsx` bleiben unverändert grün.
- [ ] `docs/notes.txt`: die Einträge zu Bug 1 (`domainLayerBoundary`), Bug 2 (`useSupplies`)
  und Bug 3 (Wochenplan-Übertragung) auf `x` setzen und nach DONE verschieben. Unter TODO
  als `b` anhängen: „Vorräte: Wird ein Vorrat angelegt und sofort wieder entfernt, kann
  eine sehr alte Momentaufnahme ohne ihn das Entfernen zu früh bestätigen
  (dropConfirmedSupplies), und eine spätere verspätete mit ihm lässt ihn kurz wieder
  erscheinen (MZP-027, Entscheidung 1).“

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, einschließlich `test/domainLayerBoundary.test.ts` im Gesamtlauf
- [ ] `npm run lint` und `npm run build` grün
- [ ] `npm run test:e2e` grün, dann `e2e/supplies.spec.ts` und `e2e/weekPlan.spec.ts`
  zehnmal hintereinander grün (`npx playwright test e2e/supplies.spec.ts e2e/weekPlan.spec.ts --repeat-each=10`
  innerhalb von `firebase emulators:exec` wie in `test:e2e`)

### Phase 2: Eigene Zwischenstände schneller Stepper-Schritte erkennen

Abhängigkeiten: keine

Ein verspäteter eigener Zwischenstand lässt die Einkaufsliste nicht mehr zurückspringen
(Bug 4).

**Aufgaben**:
- [ ] Test-first in `src/shopping/domain/unconfirmedWrites.test.ts`:
  - `rememberWrite`: `keeps the replaced write among the earlier writes`
    (`{ written: 3, before: 1, earlierWrites: [2] }` nach 1 → 2 → 3)
  - `dropConfirmedWrites`: `keeps a write while the snapshot shows an earlier own state`
  - `dropConfirmedWrites`: `drops a write the other device overtook after several steps`
  - bestehende Tests an die neue Form anpassen (Hilfsfunktion `write(written, before, earlierWrites = [])`)
- [ ] `src/shopping/domain/unconfirmedWrites.ts`:
  ```ts
  export type UnconfirmedWrite = {
    written: ShoppingItem
    before: ShoppingItem | null
    earlierWrites: readonly ShoppingItem[]
  }
  ```
  `rememberWrite` übernimmt `before` des früheren Schreibvorgangs und hängt dessen
  `written` an `earlierWrites` an. `dropConfirmedWrites` behält, solange `live` dem
  `before` oder einem Stand aus `earlierWrites` gleicht (Hilfsfunktion
  `isOwnEarlierState(write, live)`).
- [ ] `src/shopping/ui/useShoppingList.ts`: `carryOut` liefert `earlierWrites: []` mit.
  Die übrigen Aufrufstellen gehen über `rememberWrite` und bleiben.
- [ ] `docs/notes.txt`: den Eintrag „mehrere schnelle Schritte am Mengen-Stepper“ auf
  `x` setzen und nach DONE verschieben.

**Automatisierte Verifikation**:
- [ ] `npm run test`, `npm run lint`, `npm run build` grün
- [ ] `npm run test:e2e` grün

### Phase 3: Eine or()-Abfrage für die Einkaufsliste, Löschung anderswo erkennen

Abhängigkeiten: Phase 2 (Form von `UnconfirmedWrite`)

Der Adapter liefert Momentaufnahmen ohne Lücke. Damit kann die Domäne einen auf dem
anderen Gerät gelöschten Artikel erkennen (Bug 5, TODO `or()`-Abfrage).

**Aufgaben**:
- [ ] Zuerst `src/shopping/api/firestoreShoppingListClient.ts`: `observeItems` auf eine
  Abfrage umstellen, `openItems`, `checkedOffThisSession`, `answered` und `publish`
  entfallen:
  ```ts
  return onSnapshot(
    query(
      items,
      or(
        where('checkedOffAt', '==', null),
        where('checkedOffAt', '>=', sessionStartedAt),
      ),
    ),
    (snapshot) =>
      onItems(snapshot.docs.map((document) =>
        toShoppingItem(document.id, document.data()))),
  )
  ```
- [ ] Sofort `npm run test:e2e` laufen lassen. Lehnt der Emulator die Abfrage ab, hier
  anhalten und mit dem Nutzer den Weg klären (Entscheidung 3).
- [ ] Im selben Adapter werden `changeQuantity`, `checkOffItem` und `reopenItem` über
  `updateInBackground` geschrieben. Das schweigt bei `FirestoreError` mit
  `code === 'not-found'` und meldet sonst `WRITE_FAILED`, wie `writeInBackground`.
- [ ] Test-first in `unconfirmedWrites.test.ts`:
  - `drops a write of a known item the snapshot no longer carries` (ersetzt
    `keeps a write the snapshot does not carry at all`)
  - `keeps a write of an added item the snapshot has not delivered yet`
  - `keeps a stepped added item the snapshot has not delivered yet`
    (`before: null`, `earlierWrites` nicht leer)
- [ ] `dropConfirmedWrites`: `live === undefined` → behalten genau dann, wenn
  `write.before === null`.
- [ ] `e2e/emulatorHousehold.ts`: `removeItemOnServer(name)` sucht das Dokument über die
  REST-Liste der Sammlung `items` und löscht es per `DELETE` (Muster:
  `storeItemOnServer`, `itemNamesOnServer`).
- [ ] `e2e/shoppingList.spec.ts`: `lets go of an item the other device removed during an own step`:
  Milch anlegen, auf dem Server ankommen lassen, `page.context().setOffline(true)`,
  „Mehr, Milch“, `removeItemOnServer('Milch')`, `setOffline(false)`. Erwartet wird eine
  leere Liste und keine Ansage „Konnte nicht gespeichert werden.“ in der Statusregion.
- [ ] `docs/notes.txt`: den `b`-Eintrag „loescht das andere Geraet einen Artikel …“ und den
  TODO-Eintrag „Firestore-Adapter: die zwei Snapshot-Listener … or()-Abfrage“ auf `x`
  setzen und nach DONE verschieben.

**Automatisierte Verifikation**:
- [ ] `npm run test`, `npm run lint`, `npm run build` grün
- [ ] `npm run test:e2e` grün, dazu `e2e/shoppingList.spec.ts` zehnmal hintereinander
  grün (`--repeat-each=10`)

**Manuelle Verifikation**:
- [ ] Auf dem Gerät gegen die echte Datenbank: Die Einkaufsliste lädt ohne Fehlermeldung
  (kein fehlender Index). Abhaken und Wieder-Öffnen lassen die Zeile stehen, und
  VoiceOver behält den Fokus.
- [ ] Zwei Geräte: Gerät B schaltet in den Flugmodus und drückt „Mehr“ an Milch, Gerät A
  löscht Milch, Gerät B geht wieder online. Die Zeile verschwindet ohne die Ansage
  „Konnte nicht gespeichert werden.“.

### Phase 4: Entfernen unbestätigter Artikel erst nach dem Sichten bestätigen

Abhängigkeiten: keine

Ein Artikel, der entfernt wurde, bevor er je in einer Momentaufnahme stand, kehrt nicht
zurück (Bug 6).

**Aufgaben**:
- [ ] Test-first in `unconfirmedWrites.test.ts` (`describe('unconfirmed removals')`):
  - `keeps the removal of an item never seen while the snapshot lacks it`
  - `marks a removal as seen once the snapshot carries the item`
  - `drops a seen removal once the snapshot no longer carries the item`
  - `hides a removed item never seen once a late snapshot carries it`
  - bestehende Tests auf `{ id, seen }` umstellen
- [ ] `src/shopping/domain/unconfirmedWrites.ts`:
  ```ts
  export type UnconfirmedRemoval = { id: ItemId; seen: boolean }
  export type UnconfirmedRemovals = readonly UnconfirmedRemoval[]
  export function rememberRemoval(removals, id, liveItems): UnconfirmedRemovals
  ```
  `dropConfirmedRemovals` setzt `seen`, wenn der Artikel in `liveItems` steht, und
  verwirft ein gesichtetes Entfernen, sobald er fehlt. `withoutUnconfirmedRemovals`
  filtert über `removal.id`.
- [ ] `src/shopping/ui/useShoppingList.ts` `removeItem`: `rememberRemoval(removals, item.id, liveItems)`
  statt `[...removals, item.id]`, `liveItems` in die Abhängigkeiten aufnehmen.
- [ ] `docs/notes.txt`: den `b`-Eintrag „wird ein Artikel per "Weniger" entfernt, der selbst
  noch unbestaetigt ist …“ auf `x` setzen und nach DONE verschieben.

**Automatisierte Verifikation**:
- [ ] `npm run test`, `npm run lint`, `npm run build` grün
- [ ] `npm run test:e2e` grün
- [ ] In `docs/notes.txt` steht unter TODO kein `b`-Eintrag mehr außer dem neu
  angehängten aus Phase 1

## Notizen zur Umsetzung

## Verweise

- `docs/agents/plans/2026-09-24-wochenplan-festlegen-und-einmal-uebertragen.md` (MZP-025,
  Befund zu verspäteten Momentaufnahmen, `isStaleSnapshot`)
- `docs/agents/plans/2026-09-24-mengenpicker-auf-der-einkaufsliste.md` (MZP-020,
  Entscheidung 10: Herkunft der Bugs 4 bis 6)
- `docs/agents/plans/2026-09-23-vorrat-beim-uebertragen-verbrauchen.md` (MZP-015)
- [Firestore: Abfragen mit Bereichsfiltern auf mehreren Feldern](https://firebase.google.com/docs/firestore/query-data/multiple-range-fields)
