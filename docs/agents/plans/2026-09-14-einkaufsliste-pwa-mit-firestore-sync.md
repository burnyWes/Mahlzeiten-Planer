---
date: 2026-09-14
git_commit: c8fca1453cfd1e1738d68842e1a873eba3a7b152
branch: main
story: MZP-001
topic: "Einkaufsliste als PWA mit Firestore-Sync"
tags: [plan, shopping, pwa, firestore, accessibility]
status: ready
---

# PLAN: MZP-001 — Einkaufsliste als PWA mit Firestore-Sync

Erste Funktionalität des Mahlzeiten-Planers: eine Einkaufsliste, die auf zwei iPhones
läuft und ihre Daten abgleicht. Entwickelt wird unter Windows, ohne Mac und ohne Xcode.
Mindestens eine der beiden Personen bedient die App **ausschliesslich mit VoiceOver**.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-14.

## Akzeptanzkriterien

- [ ] Die App lässt sich auf beiden iPhones über Safari zum Home-Bildschirm hinzufügen
      und startet dort im Vollbild ohne Safari-Leiste.
- [ ] Anmeldung mit dem gemeinsamen Haushaltskonto ist einmal je Gerät nötig; danach
      startet die App direkt in der Liste.
- [ ] Ein Artikel wird mit Name (Pflicht) sowie optionaler Menge und Einheit angelegt.
      Die Eingabeseite bleibt danach offen, das Namensfeld ist geleert und hat den Fokus.
- [ ] Steht derselbe Name bereits offen auf der Liste, wird das angesagt; hinzugefügt
      wird trotzdem, ohne Rückfrage und ohne zusätzlichen Bedienschritt.
- [ ] Die Liste zeigt offene Artikel in Eingabereihenfolge, neue unten.
- [ ] Abhaken setzt einen Zeitstempel und löscht nichts. Der Artikel bleibt an seiner
      Position stehen, der Fokus bleibt auf ihm.
- [ ] Die Liste verändert weder Reihenfolge noch Zusammensetzung von selbst — auch nicht
      durch Änderungen vom zweiten Gerät. Erst "Aufräumen" oder ein Neustart der App
      arbeitet Änderungen ein.
- [ ] Ohne Netz sind Ansehen, Abhaken und Hinzufügen unverändert möglich. Sobald wieder
      Netz da ist, gleichen sich beide Geräte ohne Zutun ab.
- [ ] Die gesamte App ist mit VoiceOver vollständig bedienbar, jede Aktion wird angesagt,
      und keine Funktion ist nur über eine Wischgeste erreichbar.
- [ ] Kein Dunkelmodus. Die iOS-Systemfunktionen für Kontrast und Farbumkehr bleiben
      wirksam.
- [ ] Firestore weist jeden Zugriff ab, der nicht vom Haushaltskonto kommt.

## Wesentliche Entscheidungen und Abwägungen

1. **PWA statt nativer App:** React + Vite + TypeScript, ausgeliefert über GitHub Pages.
   - Warum: Ohne Mac und Xcode ist keine Signierung möglich; das Apple Developer Program
     würde 99 EUR/Jahr kosten, bevor überhaupt feststeht, ob die App genutzt wird.
   - Auswirkung: HTTPS und Service Worker sind Pflicht. Der Test auf dem echten iPhone
     läuft ausschliesslich über die veröffentlichte Adresse.

2. **Firestore mit `persistentLocalCache`:** Der Offline-Betrieb kommt aus dem SDK.
   - Warum: Ein eigener Sync-Motor wäre der aufwendigste und fehleranfälligste Teil des
     Projekts. Die gewählte Konfliktregel "spätere Änderung gewinnt" entspricht genau dem
     Standardverhalten von Firestore.
   - Auswirkung: Kein eigener Server, kein Servercode. Dafür Bindung an Google.

3. **Abgeschwächte Onion-Form nach `.claude/skills/architecture/references/typescript.md`:**
   reine Funktionen in `domain/`, Firestore hinter einem Interface in `api/`, React nur
   in `ui/`.
   - Warum: Projektvorgabe. Aggregate, Repositories und Use-Case-Klassen sind im Browser
     ausdrücklich untersagt.
   - Auswirkung: Die Schichtgrenze wird per ESLint erzwungen — das ist der
     Architekturtest dieses Projekts.

4. **Genau ein Bounded Context zum Start:** nur `src/shopping/`.
   - Warum: Der Skill `architecture` führt vorsorgliche Kontexte als Anti-Pattern.
   - Auswirkung: `mealplan/` und `recipes/` entstehen erst mit ihren Features. Die
     Landkarte aus der Befragung bleibt gültig, wird aber nicht vorab angelegt.

5. **Kein Router.** Die App kennt drei Ansichten (Anmeldung, Liste, Artikel hinzufügen),
   die über einen Zustand in React umgeschaltet werden. "Zurück" ist ein echter Knopf.
   - Warum: GitHub Pages kann kein SPA-Rewrite; jeder Router erzwingt einen 404-Umweg.
     Ausserdem wäre eine Wischgeste zum Zurückgehen bei VoiceOver belegt.
   - Auswirkung: Keine Router-Abhängigkeit, kein `404.html`, kein `basename`. Die App hat
     genau eine Adresse. Preis: Ohne History-Einträge gibt es kein Zurück-Wischen — das
     ist hier erwünscht, weil es sonst die App verlassen würde.

6. **Stabile Liste:** Reihenfolge und Zusammensetzung der angezeigten Liste sind
   eingefroren, die Inhalte der einzelnen Einträge sind live.
   - Warum: VoiceOver ist primärer Bedienweg. Eine Liste, die sich während des Durchgehens
     umsortiert — durch eigenes Abhaken oder durch das zweite Gerät — kostet die
     Orientierung.
   - Auswirkung: Der anspruchsvollste Teil der Umsetzung. Fremdänderungen werden gepuffert
     und erst auf ausdrückliche Anforderung eingespielt.

7. **Abhaken löscht nicht,** sondern setzt `checkedOffAt`.
   - Warum: Echte Löschungen sind im Offline-Abgleich der unangenehmste Fall. Ausserdem
     entsteht so der Verlauf, aus dem später Vorschläge beim Tippen gespeist werden.
   - Auswirkung: Die Sammlung wächst unbegrenzt. Geladen wird deshalb nie der gesamte
     Bestand, sondern nur die offenen Artikel plus die in der laufenden Sitzung
     abgehakten.

8. **Ein gemeinsames Konto für beide Personen.** Das Konto ist der Haushalt.
   - Warum: Zwei gleichberechtigte Personen, kein Bedarf an "wer war das".
   - Auswirkung: Kein Registrierungs-, Einladungs- oder Rollenkonzept. Die
     Sicherheitsregel prüft gegen eine einzige feste UID.

## Ausgangslage

Leeres Repository. Ausser den Vorlagen aus dem Projekt-Template existiert kein Code.

```
Mahlzeitenplaner/
  .claude/
    projekt.md          Stack und Befehle noch nicht gesetzt, Bauart: onion
    skills/             architecture, commit, grill-me, rpi-*, setup
  docs/
    agents/plans/       leer
    agents/research/    leer
    notes.txt           leer
  CLAUDE.md
  README.md
  .gitignore
```

Relevante Vorgaben, die den Entwurf binden:

- `CLAUDE.md` — keine Kommentare, keine Umlaute in Bezeichnern, TDD für `domain`,
  keine Mocks in `domain`, Commits nur über den Skill `commit`.
- `.claude/skills/architecture/references/typescript.md` — Ordnerstruktur
  `<kontext>/domain|api|ui`, keine Framework-Importe in `domain/`, Grenze per ESLint,
  Werkzeuge Prettier / ESLint / Vitest / Testing Library / Playwright.

## Zielbild

```
  iPhone A (VoiceOver)                          iPhone B
  ┌─────────────────────┐                       ┌─────────────────────┐
  │ PWA vom Home-Bildsch│                       │ PWA vom Home-Bildsch│
  │  React (ui)         │                       │                     │
  │   ├─ domain (rein)  │                       │                     │
  │   └─ api (Interface)│                       │                     │
  │  ┌───────────────┐  │                       │  ┌───────────────┐  │
  │  │ IndexedDB     │◄─┼── funktioniert ohne ──┼─►│ IndexedDB     │  │
  │  │ persistentLoc.│  │        Netz           │  │               │  │
  │  └───────┬───────┘  │                       │  └───────┬───────┘  │
  └──────────┼──────────┘                       └──────────┼──────────┘
             │             ┌──────────────────┐            │
             └────────────►│ Firestore        │◄───────────┘
                           │ europe-west3     │
                           │ items/           │
                           │ Regel: nur eine  │
                           │ feste UID        │
                           └──────────────────┘

  git push ──► GitHub Actions ──► GitHub Pages (HTTPS, oeffentliches Repo)
```

### Die stabile Liste

Der Kern des Entwurfs. Es gibt zwei Ebenen:

```
  liveItems        was Firestore gerade liefert (onSnapshot, auch offline):
                   alle offenen Artikel PLUS die in dieser Sitzung abgehakten -
                   sonst koennte ein eben abgehakter Artikel nicht mehr
                   dargestellt werden
      │
      │  projectStableList(frozenOrder, liveItems)
      ▼
  angezeigte Liste  Reihenfolge und Mitgliedschaft aus frozenOrder,
                    Inhalte aus liveItems

  frozenOrder aendert sich NUR bei:
    - erstem Laden der Liste
    - eigenem Hinzufuegen (neue Id wird angehaengt)
    - Druck auf "Aufraeumen"
    - Neustart der App
```

Damit gilt: Ändert die zweite Person etwas, wird der Text eines bereits sichtbaren
Artikels aktualisiert, aber kein Eintrag springt, verschwindet oder kommt hinzu. Wie viele
Änderungen anstehen, verrät der Aufräum-Knopf.

### Oberfläche

```
  Anmeldung                  Einkaufsliste                Artikel hinzufuegen
  ┌──────────────────┐       ┌───────────────────────┐    ┌───────────────────────┐
  │ Mahlzeiten-Planer│       │ Einkaufsliste     [+] │    │ [< Zurueck]           │
  │                  │       │                       │    │                       │
  │ E-Mail           │       │ ☐ Brot                │    │ Name                  │
  │ [______________] │       │ ☐ Butter              │    │ [___________________] │
  │                  │       │ ☑ Milch  2 l          │    │                       │
  │ Passwort         │       │ ☐ Kaese               │    │ Menge      Einheit    │
  │ [______________] │       │                       │    │ [_____]    [________] │
  │                  │       │ [Aufraeumen (2)]      │    │                       │
  │ [  Anmelden  ]   │       │                       │    │ [   Hinzufuegen   ]   │
  └──────────────────┘       └───────────────────────┘    └───────────────────────┘

  VoiceOver liest:           VoiceOver liest:             Nach dem Absenden:
  "Mahlzeiten-Planer,        "Einkaufsliste, 3 offen,     "Milch hinzugefuegt.
   Ueberschrift"              Ueberschrift"                Achtung, Milch steht
  "E-Mail, Textfeld"         "Artikel hinzufuegen, Taste"  bereits offen auf der
                             "Brot, Kontrollkaestchen,     Liste."
                              nicht ausgewaehlt"          Fokus zurueck im Namensfeld
```

Abgehakte Artikel bleiben mit gesetztem Kontrollkästchen und durchgestrichenem Text
stehen, bis "Aufräumen" gedrückt wird.

## Abstraktionen und Wiederverwendung

Es gibt nichts wiederzuverwenden — alles entsteht neu. Die Struktur folgt exakt
`references/typescript.md`.

- `src`
  - `shopping`
    - `domain`
      - `shoppingItem.ts` - Typen und reine Funktionen, keine Framework-Importe
        - `ShoppingItem`, `NewShoppingItem`, `ItemId`, `Quantity` - Typen
        - `createShoppingItem` - validiert Name und Menge, wirft bei Verstoss
        - `normalizeItemName` - trimmt und vereinheitlicht Gross-/Kleinschreibung
        - `findOpenItemWithSameName` - Grundlage des Duplikat-Hinweises
        - `isOpen`, `isCheckedOff` - Zustandsabfragen
        - `formatItemForAnnouncement` - Text für die Ansage
      - `shoppingItem.test.ts`
      - `stableList.ts` - das Einfrier-Verfahren als reine Funktionen
        - `projectStableList` - frozenOrder + liveItems zur angezeigten Liste
        - `pendingChangeCount` - wie viele Änderungen warten
        - `nextFrozenOrder` - Reihenfolge nach dem Aufräumen
        - `appendToFrozenOrder` - nach eigenem Hinzufügen
      - `stableList.test.ts`
    - `api`
      - `shoppingListClient.ts` - Interface, kennt nur Domänentypen
      - `firestoreShoppingListClient.ts` - Implementierung
      - `inMemoryShoppingListClient.ts` - Fake für Tests, ersetzt jeden Mock
    - `ui`
      - `ShoppingListPage.tsx` - Liste, Aufräum-Knopf, Plus oben rechts
      - `AddItemPage.tsx` - Eingabeseite
      - `ShoppingItemRow.tsx` - eine Zeile mit echtem Kontrollkästchen
      - `useShoppingList.ts` - verbindet `api` und `domain` mit React
  - `shared`
    - `ui`
      - `Announcer.tsx` - Live-Region für alle Ansagen
      - `useAnnouncer.ts`
    - `auth`
      - `firebase.ts` - Initialisierung von App, Auth und Firestore
      - `useSession.ts`
      - `SignInPage.tsx`
  - `App.tsx` - schaltet zwischen den drei Ansichten um
  - `main.tsx`

Auf Projektebene:

- `firestore.rules` - Sicherheitsregeln
- `firestore.rules.test.ts` - Regeltest gegen den Emulator
- `.github/workflows/deploy.yml`
- `e2e/shoppingList.spec.ts` - Playwright
- `public/.nojekyll`

## Logging und Beobachtbarkeit

Kein Log-Framework, kein Tracking, keine Analyse-Werkzeuge. Für den Betrieb reichen zwei
sichtbare Zustände, die zugleich angesagt werden:

```
  Verbindung verloren   ──►  Statuszeile: "Offline. Aenderungen werden gespeichert."
  Verbindung zurueck    ──►  Statuszeile: "Wieder online."
  Schreibfehler         ──►  Statuszeile: "Konnte nicht gespeichert werden."
```

Diese Zeile ist dieselbe Live-Region, die auch die Aktionsansagen trägt.

## Umsetzung

### Phase 1: Installierbare leere App auf dem iPhone

Abhängigkeiten: keine.

Beweist die riskanteste Annahme des Vorhabens, bevor Fachlichkeit entsteht: dass eine vom
Windows-Rechner gebaute PWA tatsächlich als Vollbild-App auf dem iPhone landet.

**Vorbereitung durch den Nutzer** (nicht automatisierbar):

- [x] Repository `burnyWes/Mahlzeiten-Planer` auf GitHub, Remote gesetzt, `main`
      hochgeschoben. Der Repository-Name bestimmt `base` und damit die Adresse der App:
      `https://burnyWes.github.io/Mahlzeiten-Planer/`
- [ ] Sicherstellen, dass das Repository **öffentlich** ist — GitHub Pages ist im
      kostenlosen Tarif nur für öffentliche Repositories verfügbar. Bei einem privaten
      Repository entweder auf öffentlich umstellen oder auf Cloudflare Pages ausweichen

**Aufgaben**:

- [x] Gerüst mit `npm create vite@latest` erzeugen. **Achtung:** Das Verzeichnis ist nicht
      leer (`CLAUDE.md`, `README.md`, `.claude/`, `docs/`), weshalb der Assistent
      interaktiv nachfragt und im Zweifel löscht. Deshalb in einen temporären Unterordner
      erzeugen und die erzeugten Dateien herüberziehen, statt im Projektwurzelverzeichnis
      zu starten
- [x] `.gitignore` ergänzen — sie enthält bisher nur `.claude/settings.local.json`,
      es fehlen `node_modules/`, `dist/`, `dev-dist/`, `.env*`, `playwright-report/`,
      `test-results/`, `.firebase/`
- [x] Prettier, ESLint, Vitest, Testing Library und Playwright einrichten
- [x] ESLint-Regel für die Schichtgrenze ergänzen — das ist der Architekturtest:
      ```js
      {
        files: ['src/**/domain/**/*.ts'],
        rules: {
          'no-restricted-imports': ['error', {
            patterns: ['react', 'react-dom', 'firebase', 'firebase/*',
                       '../ui/*', '../api/*'],
          }],
        },
      }
      ```
- [x] `vite-plugin-pwa` (1.3.0) einrichten, `base: '/Mahlzeiten-Planer/'` setzen
- [x] Manifest mit `name`, `short_name`, `theme_color` und Icons in 192 und 512 Pixeln
      sowie einer zusätzlichen `maskable`-Variante
- [x] `apple-touch-icon` in 180x180 als PNG **ohne Transparenz** und ohne selbst gerundete
      Ecken erzeugen; iOS stellt Alphakanäle schwarz dar
- [x] `<head>` ergänzen: `viewport` mit `viewport-fit=cover`,
      `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style` und
      `apple-mobile-web-app-capable` — letzteres ist ab iOS 26 entbehrlich, für ältere
      Versionen aber weiterhin nötig, sonst öffnet das Symbol nur einen Safari-Tab
- [x] `public/.nojekyll` anlegen, sonst ignoriert Jekyll Pfade mit Unterstrich
- [x] Feste helle Darstellung: `color-scheme: light` setzen, keine
      `prefers-color-scheme`-Regeln, keine erzwungenen Farben, die
      "Farben umkehren" oder "Kontrast erhöhen" aushebeln
- [x] `.github/workflows/deploy.yml` mit `actions/checkout@v7`, `actions/setup-node@v7`,
      `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`,
      `actions/deploy-pages@v5`, dazu `permissions: contents read, pages write,
      id-token write` und `concurrency: group pages`
- [ ] GitHub Pages im Repository auf Quelle "GitHub Actions" stellen
- [x] `.claude/projekt.md` ausfüllen: Stack, Test-, Lint-, Format- und Build-Befehl,
      fachlicher Kontext `shopping`
- [x] Startseite mit `<h1>Einkaufsliste</h1>` als Platzhalter

**Automatisierte Verifikation**:

- [x] `npm run build` erzeugt `dist/` samt `sw.js` und `manifest.webmanifest`
- [x] `npm run lint` läuft durch
- [x] `npm run test` läuft durch
- [x] Ein Test belegt, dass die ESLint-Grenze greift. In dieser Phase gibt es noch keinen
      `domain`-Ordner, deshalb prüft der Test die Regel über die ESLint-Node-API gegen
      einen virtuellen Dateipfad, statt eine fachlich unbegründete Datei anzulegen:
      ```ts
      const results = await new ESLint().lintText(`import { useState } from 'react'`, {
        filePath: 'src/shopping/domain/probe.ts',
      })
      expect(results[0].errorCount).toBeGreaterThan(0)
      ```
- [ ] Der Workflow läuft auf GitHub grün durch und die Seite ist unter
      `https://burnyWes.github.io/Mahlzeiten-Planer/` erreichbar

**Manuelle Verifikation**:

- [ ] Die veröffentlichte Adresse lässt sich auf dem iPhone in Safari öffnen
- [ ] "Zum Home-Bildschirm" erzeugt ein Symbol mit korrektem Bild und Namen
- [ ] Der Start über das Symbol öffnet die App im Vollbild ohne Safari-Leiste
- [ ] VoiceOver liest die Überschrift als Überschrift vor
- [ ] Bei aktivierter Systemeinstellung "Farben umkehren" bleibt die Seite lesbar

---

### Phase 2: Anmeldung mit dem Haushaltskonto

Abhängigkeiten: Phase 1.

Ab hier liegen Daten hinter einer Anmeldung. Zugleich ist das Anmeldeformular das erste
echte Formular und damit die Gelegenheit, das VoiceOver-Vorgehen einzuüben.

**Vorbereitung durch den Nutzer** (nicht automatisierbar):

- [ ] Firebase-Projekt anlegen, Region `europe-west3` (Frankfurt)
- [ ] Anmeldeart "E-Mail und Passwort" aktivieren
- [ ] Ein einziges Konto anlegen, Zugangsdaten in beide Passwortmanager
- [ ] Die UID dieses Kontos notieren — sie wird in `firestore.rules` eingetragen

**Aufgaben**:

- [ ] `firebase` (12.19.0) als Abhängigkeit aufnehmen
- [ ] `shared/auth/firebase.ts` mit Persistenz einrichten. `initializeFirestore` muss
      **vor** dem ersten `getFirestore` laufen, sonst wirft es:
      ```ts
      export const firestore = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
      ```
- [ ] Rückfall absichern: In Safaris privatem Modus steht IndexedDB nicht zur Verfügung.
      Schlägt die Initialisierung fehl, auf `memoryLocalCache` ausweichen und den
      Umstand als Statusmeldung ansagen, statt die App abstürzen zu lassen
- [ ] Die Firebase-Konfiguration steht als Klartext im Repository. Das ist zulässig, weil
      sie das Projekt nur benennt; der Schutz kommt aus Anmeldung und Regeln
- [ ] `shared/auth/useSession.ts` — beobachtet den Anmeldezustand, unterscheidet
      "wird geladen", "angemeldet", "nicht angemeldet"
- [ ] `shared/auth/SignInPage.tsx` mit echten `<label>`-Elementen, `type="email"`,
      `type="password"`, `autocomplete="username"` und `autocomplete="current-password"`
- [ ] Fehlermeldungen bei falschen Zugangsdaten über die Live-Region ansagen und mit
      `aria-describedby` an das Formular binden
- [ ] `firestore.rules` schreiben:
      ```
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          function isHousehold() {
            return request.auth != null && request.auth.uid == '<UID>';
          }
          match /items/{itemId} {
            allow read, write: if isHousehold();
          }
          match /{document=**} {
            allow read, write: if false;
          }
        }
      }
      ```
- [ ] Regeltests mit `@firebase/rules-unit-testing` (5.0.2) gegen den Emulator aus
      `firebase-tools` (15.30.0). **Voraussetzung:** Der Firestore-Emulator benötigt eine
      installierte Java-Laufzeit. Der Regeltest läuft deshalb als eigener Befehl
      `npm run test:rules` und nicht im Standard-Testlauf
- [ ] Die Regeln in Betrieb nehmen: `firebase deploy --only firestore:rules`. Ohne diesen
      Schritt gelten weiterhin die Voreinstellungen des Projekts, und der Regeltest
      belegt nur die Datei, nicht den tatsächlichen Zustand der Datenbank

**Automatisierte Verifikation**:

- [ ] `npm run test:rules` belegt: angemeldet mit der Haushalts-UID gelingt Lesen und
      Schreiben auf `items`
- [ ] `npm run test:rules` belegt: eine andere UID scheitert
- [ ] `npm run test:rules` belegt: ohne Anmeldung scheitert jeder Zugriff
- [ ] Ein Komponententest belegt, dass `SignInPage` bei leerem Passwort nicht absendet
- [ ] axe meldet auf `SignInPage` keine Verstösse
- [ ] `npm run lint`, `npm run test` und `npm run build` laufen durch

**Manuelle Verifikation**:

- [ ] Anmeldung auf dem iPhone gelingt; nach dem Schliessen und erneuten Öffnen der App
      erscheint kein Anmeldebildschirm mehr
- [ ] VoiceOver liest beide Felder samt Beschriftung vor und meldet den Passwortmodus
- [ ] Eine falsche Eingabe wird von VoiceOver vorgelesen, ohne dass der Fokus springt

---

### Phase 3: Artikel hinzufügen und Liste anzeigen

Abhängigkeiten: Phase 2.

Erster fachlicher Schnitt. `domain` entsteht test-getrieben, wie in `CLAUDE.md` gefordert.

**Aufgaben**:

- [ ] `shopping/domain/shoppingItem.ts` test-getrieben entwickeln. Zuerst die Tests:
      - Name wird getrimmt, leerer Name wird abgewiesen, Länge ist begrenzt
      - Menge ist entweder nicht gesetzt oder positiv; null und negativ werden abgewiesen
      - Eine Einheit ohne Menge wird abgewiesen
      - `normalizeItemName` behandelt Gross-/Kleinschreibung und Leerzeichen
      - `findOpenItemWithSameName` findet nur offene, nicht abgehakte Artikel
- [ ] Datenform festlegen:
      ```ts
      type ShoppingItem = {
        id: ItemId
        name: string
        quantity: Quantity | null
        createdAt: number
        checkedOffAt: number | null
      }
      type Quantity = { amount: number; unit: string | null }
      ```
- [ ] `shopping/api/shoppingListClient.ts` als Interface, das ausschliesslich
      Domänentypen führt:
      ```ts
      export interface ShoppingListClient {
        observeItems(onItems: (items: readonly ShoppingItem[]) => void): () => void
        addItem(item: NewShoppingItem): ItemId
        checkOffItem(id: ItemId): void
        reopenItem(id: ItemId): void
      }
      ```
- [ ] `firestoreShoppingListClient.ts` implementieren. **Wichtig:** Schreibvorgänge
      dürfen nicht erwartet werden — offline löst das Promise von `setDoc` erst bei
      Serverkontakt auf. Deshalb geben die Methoden nichts zurück, was auf den Server
      wartet: Die Kennung wird lokal über `doc(collection(...))` erzeugt, der
      Schreibvorgang läuft im Hintergrund, Fehler landen in der Statuszeile. Der lokale
      Cache und damit `onSnapshot` reagieren sofort
- [ ] Abfrage begrenzen, aber **zwei** Beobachtungen führen und ihr Ergebnis vereinen:
      - `where('checkedOffAt', '==', null)` — alle offenen Artikel, unabhängig vom Alter
      - `where('checkedOffAt', '>=', sitzungsbeginn)` — die in dieser Sitzung abgehakten

      Eine einzelne Abfrage auf offene Artikel wäre falsch: Ein gerade abgehakter Artikel
      fiele sofort aus den Daten und könnte in der stabilen Liste nicht mehr dargestellt
      werden — genau das Springen, das Phase 4 verhindern soll. Der vollständige Verlauf
      wird dabei trotzdem nie geladen
- [ ] `inMemoryShoppingListClient.ts` als handgeschriebener Fake für die Tests
- [ ] `shared/ui/Announcer.tsx` — eine `role="status"`-Region, die von Beginn an im
      Dokument steht; Live-Regionen, die erst beim Ereignis eingefügt werden, sagt
      VoiceOver nicht zuverlässig an
- [ ] `ShoppingListPage.tsx` — `<h1>` mit Anzahl offener Artikel, Plus-Knopf oben rechts
      mit `aria-label="Artikel hinzufügen"`, Liste als `<ul>`
- [ ] Leerzustand: "Die Liste ist leer." als vorgelesener Text
- [ ] `AddItemPage.tsx` — Namensfeld mit Fokus beim Öffnen, schmales Mengenfeld,
      Einheitenfeld mit `<datalist>` (Stück, g, kg, ml, l, Pck.)
- [ ] Nach dem Absenden: Feld leeren, Fokus zurück ins Namensfeld, Ansage absetzen.
      Steht der Name bereits offen auf der Liste, wird die Ansage um den Hinweis
      erweitert; hinzugefügt wird ohne Rückfrage
- [ ] Verbindungszustand über `navigator.onLine` und die Ereignisse `online`/`offline`
      in die Statuszeile spiegeln

**Automatisierte Verifikation**:

- [ ] Alle Tests in `shoppingItem.test.ts` laufen grün und kommen ohne React,
      ohne Firebase und ohne Mocks aus
- [ ] Ein Test mit dem In-Memory-Fake belegt: Hinzufügen erzeugt einen offenen Artikel
      mit Zeitstempel
- [ ] Ein Komponententest belegt: nach dem Absenden ist das Namensfeld leer und hat den
      Fokus
- [ ] Ein Komponententest belegt: bei gleichem Namen enthält die Ansage den Hinweis
- [ ] axe meldet auf `ShoppingListPage` und `AddItemPage` keine Verstösse
- [ ] `npm run lint`, `npm run test` und `npm run build` laufen durch

**Manuelle Verifikation**:

- [ ] Auf dem iPhone lassen sich vier Artikel hintereinander eintragen, ohne die Seite zu
      verlassen; VoiceOver sagt jeden einzeln an
- [ ] Im Flugmodus hinzugefügte Artikel erscheinen sofort in der Liste
- [ ] Nach dem Verlassen des Flugmodus stehen sie auf dem zweiten Gerät
- [ ] VoiceOver liest die Überschrift samt Anzahl und jeden Artikel mit Menge vor

---

### Phase 4: Abhaken, stabile Liste und Aufräumen

Abhängigkeiten: Phase 3.

Schliesst MZP-001 ab und liefert das Verhalten, das den VoiceOver-Anspruch trägt.

**Aufgaben**:

- [ ] `shopping/domain/stableList.ts` test-getrieben entwickeln. Zuerst die Tests:
      - `projectStableList` behält die eingefrorene Reihenfolge bei, auch wenn die
        Live-Daten anders sortiert sind
      - ein neu in den Live-Daten erschienener Artikel taucht **nicht** auf
      - ein in den Live-Daten abgehakter Artikel bleibt sichtbar, aber mit gesetztem
        Zeitstempel
      - `pendingChangeCount` zählt Zugänge und Abgänge gegenüber der eingefrorenen Liste
      - `nextFrozenOrder` enthält nach dem Aufräumen genau die offenen Artikel
      - `appendToFrozenOrder` hängt eine neue Kennung hinten an
- [ ] `checkOff` und `reopen` in `shoppingItem.ts` ergänzen, ebenfalls test-getrieben
- [ ] `ShoppingItemRow.tsx` mit echtem `<input type="checkbox">` und `<label>`; der
      abgehakte Zustand wird nicht nur farblich, sondern über den Kontrollkästchen-Zustand
      und durchgestrichenen Text abgebildet
- [ ] Beim Abhaken bleibt der Fokus auf dem Kontrollkästchen; die Ansage lautet
      "<Name> abgehakt, noch <n> offen"
- [ ] Aufräum-Knopf unter der Liste, beschriftet mit der Zahl der anstehenden Änderungen
      ("Aufräumen, 2 Änderungen"). Nach dem Druck: Liste neu einfrieren, Fokus auf die
      Überschrift setzen, Ergebnis ansagen
- [ ] Ist nichts aufzuräumen, wird der Knopf nicht angezeigt — kein deaktivierter Knopf,
      den VoiceOver ansteuert, ohne dass er etwas tut
- [ ] `useShoppingList.ts` hält die eingefrorene Reihenfolge und verbindet sie mit
      `observeItems`

**Automatisierte Verifikation**:

- [ ] Alle Tests in `stableList.test.ts` laufen grün, ohne React und ohne Firebase
- [ ] Ein Komponententest belegt: ein über den Fake nachträglich eingespielter fremder
      Artikel verändert die angezeigte Liste nicht, erhöht aber die Zahl am Aufräum-Knopf
- [ ] Ein Komponententest belegt: nach dem Abhaken steht der Artikel an derselben
      Position und das Kontrollkästchen ist gesetzt
- [ ] Ein Komponententest belegt: nach dem Aufräumen sind abgehakte Artikel verschwunden
      und der Fokus liegt auf der Überschrift
- [ ] Playwright-Ablauf `e2e/shoppingList.spec.ts`: anmelden, Artikel hinzufügen,
      abhaken, aufräumen — vollständig über die Tastatur, ohne Mausklick. Der Ablauf
      läuft gegen die Emulatoren für Auth und Firestore, nicht gegen die echte Datenbank;
      er teilt sich damit die Java-Voraussetzung mit `npm run test:rules` und läuft
      ebenfalls als eigener Befehl, nicht im Standard-Testlauf
- [ ] axe meldet in allen Zuständen der Liste keine Verstösse
- [ ] `npm run lint`, `npm run test` und `npm run build` laufen durch

**Manuelle Verifikation**:

- [ ] Beide iPhones nebeneinander: Abhaken auf Gerät A verändert die Liste auf Gerät B
      nicht sichtbar, erhöht dort aber die Zahl am Aufräum-Knopf
- [ ] Gerät A im Flugmodus abhaken, Gerät B online abhaken, Flugmodus beenden: beide
      zeigen nach dem Aufräumen denselben Stand
- [ ] Mit VoiceOver durch eine Liste von acht Artikeln wischen und dabei drei abhaken:
      der Fokus bleibt durchgehend an der erwarteten Stelle, keine Ansage fehlt
- [ ] Der Aufräum-Knopf ist mit VoiceOver erreichbar und seine Beschriftung nennt die
      Zahl der Änderungen

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

### Abweichungen vom Plan (Phase 1)

- **oxlint statt ESLint im Gerüst.** `npm create vite@latest` (create-vite 9.2.1) legt
  inzwischen oxlint als Linter an. Entfernt und ESLint eingerichtet, wie Plan und
  `references/typescript.md` es verlangen — der Grenztest braucht die ESLint-Node-API.
- **ESLint bleibt auf 9.x.** `eslint-plugin-jsx-a11y` 6.10.2 führt ESLint 10 nicht als
  Peer. Ein Wechsel auf 10 ginge nur ohne a11y-Lint oder mit erzwungener Auflösung.
- **`.gitignore` war bereits vollständig** — der Aufgabenpunkt entfiel.
- **Prettier ist auf den Code begrenzt.** Der erste Lauf hat `.claude/`, `docs/`,
  `CLAUDE.md` und `README.md` umformatiert; diese Pfade stehen jetzt in
  `.prettierignore`, damit Template und Nutzernotizen unangetastet bleiben.
- **Vitest läuft in zwei Projekten:** `unit` (Node, `*.test.ts`) und `ui` (jsdom,
  `*.test.tsx`). Domänentests laufen damit ohne DOM, so wie die Architektur es fordert.
- **Icons entstehen aus `scripts/generateIcons.mjs`** (`npm run icons`), einem
  abhängigkeitsfreien PNG-Erzeuger. Kein Bildwerkzeug und kein `sharp` nötig; die
  erzeugten Dateien liegen in `public/` und sind eingecheckt.

### Bekannte Stolpersteine

- **Schreibvorgänge nicht erwarten.** `await setDoc(...)` blockiert offline bis zum
  Serverkontakt. Alle Schreibwege dieses Plans sind deshalb feuern-und-vergessen; der
  sichtbare Zustand kommt aus `onSnapshot`.
- **`initializeFirestore` vor `getFirestore`.** Andernfalls wirft das SDK.
- **Privater Modus in Safari** hat kein IndexedDB. Die Initialisierung muss scheitern
  dürfen.
- **Leistung von `persistentLocalCache`.** Bekannter offener Fehlerbericht
  firebase-js-sdk#7347: spürbar langsamer als die abgelöste Persistenz-API. Bei zwei
  Personen und wenigen hundert Artikeln unkritisch, aber im Blick behalten.
- **Live-Regionen auf iOS.** VoiceOver sagt Änderungen nur zuverlässig an, wenn die
  Region beim Laden bereits im Dokument steht. Reihenfolge und Zeitpunkt der
  Textänderung sind erfahrungsgemäss heikel und gehören auf jedem Gerät geprüft.
- **axe prüft nur die halbe Miete.** Fokusverwaltung, Ansagen, Fokusreihenfolge und das
  tatsächliche VoiceOver-Verhalten sind maschinell nicht abgedeckt. Die manuellen
  Prüfungen jeder Phase sind deshalb nicht optional.

### Bewusst nicht in MZP-001

Artikel löschen, Artikel nachträglich bearbeiten, Vorschläge aus dem Verlauf, Kategorien,
mehrere Listen, Push-Nachrichten, native Hülle, Wochenplaner, Rezepte, Einstellungen.

## Verweise

- Firestore offline: https://firebase.google.com/docs/firestore/manage-data/enable-offline
- Cache-Konfiguration im SDK: https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/api/cache_config.ts
- Leistungsproblem persistentLocalCache: https://github.com/firebase/firebase-js-sdk/issues/7347
- WebKit Speicherrichtlinie: https://webkit.org/blog/14403/updates-to-storage-policy/
- WebKit Safari 26: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- vite-plugin-pwa Mindestanforderungen: https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html
- Vite Veroeffentlichung auf GitHub Pages: https://vite.dev/guide/static-deploy
- Firestore Sicherheitsregeln: https://firebase.google.com/docs/firestore/security/rules-structure
- Regeltests: https://firebase.google.com/docs/rules/unit-tests
- axe-core API: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md
