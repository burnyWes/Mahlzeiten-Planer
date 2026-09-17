---
date: 2026-09-17T06:33:51.954491+00:00
git_commit: 4333c43cdb26f10d0459280363c4b8f50d914baa
branch: main
story: MZP-005
topic: "Knopfleiste am unteren Bildschirmrand"
tags: [plan, meals, shared-ui, ui, accessibility]
status: ready
---

# PLAN: MZP-005 — Knopfleiste am unteren Bildschirmrand

Die Knöpfe eines Gerichts sollen immer zu sehen sein, ohne dass man ans Ende eines
langen Rezepts scrollen muss. Auf der Ansicht eines Gerichts sitzen Einkaufswagen,
Stift und Mülleimer deshalb in einer Leiste am unteren Bildschirmrand. Auf der
Seite zum Bearbeiten und Anlegen sitzt dort "Speichern", über die ganze Breite und
mit einem Disketten-Symbol. Auf der Bestätigungsseite zum Löschen stehen die Knöpfe
künftig mittig.

Alle Entscheidungen stammen aus der Befragung vom 2026-09-17.

## Akzeptanzkriterien

- [ ] Auf der Ansicht eines Gerichts sitzen Einkaufswagen, Stift und Mülleimer in einer
      Leiste immer am unteren Bildschirmrand. Das gilt bei kurzem Inhalt genauso wie beim
      Scrollen durch ein langes Rezept.
- [ ] Auf der Seite zum Bearbeiten und Anlegen sitzt "Speichern" in derselben Leiste.
      Der Knopf ist so breit wie die Leiste, das Disketten-Symbol steht links neben dem
      Text, beide mittig.
- [ ] Die Leiste hat einen weißen Hintergrund, oben eine Trennlinie und hält Abstand zum
      Home-Indikator. Ihr Inhalt ist wie die Seite höchstens 40rem breit und steht mittig.
- [ ] Rezepttext, Statuszeile und "Neue Version laden" verschwinden nie hinter der
      Leiste, auch nicht ganz unten auf der Seite.
- [ ] Ist die Bildschirmtastatur offen, ist die Leiste nicht fixiert: "Speichern" steht
      dann als letzter Knopf am Ende des Formulars. Geht die Tastatur zu, sitzt die
      Leiste wieder am Bildschirmrand. Direkt nach dem Öffnen der Seite ist sie fixiert,
      obwohl der Fokus im Feld "Name" liegt.
- [ ] VoiceOver liest die Knöpfe unverändert und in derselben Reihenfolge wie heute:
      "Auf die Einkaufsliste", "Bearbeiten", "Löschen" am Ende der Gerichtsansicht,
      "Speichern" am Ende des Formulars. Das Disketten-Symbol wird nicht vorgelesen.
- [ ] Auf der Bestätigungsseite stehen "Löschen" und "Abbrechen" als Gruppe mittig.
      Sonst bleibt die Seite unverändert.
- [ ] Die axe-Prüfungen der Gerichtsansicht, des Formulars und der Bestätigungsseite
      bleiben ohne Befund.

## Wesentliche Entscheidungen und Abwägungen

1. **Die Leiste sitzt immer am Bildschirmrand (`position: fixed`), nicht `sticky`.**
   - Warum: Die Knöpfe sollen auch bei kurzem Inhalt immer an derselben Stelle sitzen.
   - Auswirkung: Unten muss Platz freigehalten werden. `body` bekommt ein
     `padding-bottom` in Höhe der Leiste, solange eine fixierte Leiste da ist. So
     bleiben die Statuszeile und "Neue Version laden", die in `App.tsx` nach `main`
     kommen, sichtbar. `html` bekommt dazu ein `scroll-padding-bottom`, damit auch der
     Tastaturfokus nichts hinter die Leiste scrollt.
2. **Die Knöpfe in der Leiste haben eine feste Höhe von 3rem.**
   - Warum: Dann ist die Höhe der Leiste bekannt, und der freigehaltene Platz lässt
     sich in CSS genau berechnen, ohne per JavaScript zu messen.
   - Auswirkung: Die Knöpfe werden ein paar Pixel höher als heute (etwa 54 statt 45 px).
     Die Höhe der Leiste steht einmal als Variable `--bottomBarHeight` in `:root`.
3. **Die Leiste ist eine gemeinsame Komponente `BottomBar` in `src/shared/ui`.**
   - Warum: Zwei Seiten nutzen sie. Vorbild ist `NavigationBar`, die Leiste oben.
   - Auswirkung: `.iconActions` geht in der allgemeinen Regel für die Leiste auf. Deren
     Knöpfe teilen sich die Breite, der Inhalt steht mittig, zwischen Symbol und Text
     liegen 0.5rem. Die drei Knöpfe der Gerichtsansicht haben weiter ein gemeinsames
     Elternelement, der bestehende Test dazu bleibt gültig.
4. **Die Leiste bleibt im DOM am Ende von `main`.**
   - Warum: VoiceOver ist der Hauptbedienweg einer Person im Haushalt. Die
     Lesereihenfolge soll sich nicht ändern, nur die Darstellung.
   - Auswirkung: `MealPage` und `MealFormPage` setzen `BottomBar` an dieselbe Stelle,
     an der heute die Knöpfe stehen.
5. **Bei offener Tastatur verliert die Leiste ihre Fixierung. Erkannt wird das über
   `visualViewport`, nicht über den Fokus.**
   - Warum: Auf dem iPhone springt eine fixierte Leiste bei offener Tastatur und kann
     das gerade bearbeitete Feld verdecken. Eine CSS-Regel über den Fokus griffe aber zu
     früh: `MealFormPage` setzt den Fokus beim Öffnen ins Feld "Name"
     (`src/meals/ui/MealFormPage.tsx:51-53`), und ein Fokus aus dem Code öffnet auf dem
     iPhone keine Tastatur.
   - Auswirkung: Der neue Hook `useOnScreenKeyboard` in `src/shared/ui` meldet eine
     offene Tastatur, wenn `window.innerHeight - visualViewport.height *
     visualViewport.scale` größer als 150 px ist. Durch den Faktor `scale` zählt
     Hineinzoomen nicht als Tastatur. Bei offener Tastatur bekommt `BottomBar` die
     zusätzliche Klasse `bottomBarInFlow` (`position: static`, ohne Rand und
     Hintergrund). Der freigehaltene Platz unten entfällt dann.
6. **Das Disketten-Symbol ist eine eigene SVG-Komponente `SaveIcon` im Lucide-Stil.**
   - Warum: `TrashIcon` und `EditIcon` geben das Muster vor.
   - Auswirkung: Das Symbol ist `aria-hidden`, der Name des Knopfs bleibt "Speichern".
     `MealsArea.test.tsx:125` und `e2e/meals.spec.ts:27` bleiben gültig.
7. **Die Bestätigungsseite behält Knöpfe mit Text in normaler Breite, nur mittig.**
   - Warum: Der Inhalt ist kurz. Ein fixiertes "Löschen" säße genau dort, wo man eben
     auf den Mülleimer getippt hat, und ein doppelter Tipp würde die Bestätigung
     überspringen.
   - Auswirkung: `.pageActions` bekommt `justify-content: center`. Die Klasse wird nur
     in `DeleteMealPage.tsx` benutzt.
8. **Ob die Leiste sichtbar ist, prüft Playwright.**
   - Warum: jsdom berechnet kein Layout.
   - Auswirkung: Ein neuer E2E-Fall mit langem Rezept prüft `toBeInViewport` und die
     Lage der Statuszeile oberhalb der Leiste. Das Verhalten bei offener Tastatur prüft
     ein Unit-Test mit nachgebautem `visualViewport` und zusätzlich der Test auf dem
     iPhone.

## Ausgangslage

Die Änderung betrifft nur die Oberfläche: `src/meals/ui`, `src/shared/ui` und
`src/index.css`. Domäne und Anwendungsfälle bleiben unberührt.

```
App (src/App.tsx:50-70)
├─ SignedInApp → MealsArea
│   ├─ MealListPage   → NavigationBar (sticky oben) + <main class="page">
│   ├─ MealPage       → <main class="page"> … <div class="iconActions">   ← 3 Knöpfe
│   ├─ MealFormPage   → <main class="page"> … <button>Speichern</button>
│   └─ DeleteMealPage → <main class="page"> … <div class="pageActions">
├─ AppUpdateOffer   <div class="appUpdate">   (nur bei neuer Version, nach main)
└─ Announcer        <p class="announcer" role="status">   (immer, nach main)
```

Ansicht eines Gerichts (`src/meals/ui/MealPage.tsx:67-80`). Die Knöpfe sind das letzte
Element in `main`, bei einem langen Rezept erst nach dem Scrollen zu sehen:

```
┌──────────────────────────────┐
│ [Zurück zu den Gerichten]    │
│ Bolognese                 h1 │
│ Einkaufs-Items, 2         h2 │
│  Hackfleisch, 500 g          │
│ Rezept                    h2 │
│  Schritt 1 …                 │
│  Schritt 2 …                 │
│  …                           │
└──────────────────────────────┘
   … scrollen …
│ [  🛒+  ] [  ✎  ] [  🗑  ]    │
│ Statuszeile                  │
```

Bearbeiten (`src/meals/ui/MealFormPage.tsx:113-115`). "Speichern" steht linksbündig
und ist so breit wie sein Text:

```
│ Rezept                       │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│ [Speichern]                  │
│ Statuszeile                  │
```

Bestätigung (`src/meals/ui/DeleteMealPage.tsx:25-32`), Knöpfe linksbündig:

```
│ Suppe löschen?            h1 │
│ Das Gericht wird für beide   │
│ Geräte entfernt.             │
│ [Löschen] [Abbrechen]        │
```

Relevante Stellen in `src/index.css`:

- `.navigationBar` (`:28-35`) ist das Vorbild für die Leiste: `sticky`, weißer
  Hintergrund, Trennlinie, `safe-area-inset-top`.
- `.pageActions` (`:210-214`) und `.iconActions` (`:239-250`) sind die heutigen
  Knopfzeilen.
- `.announcer` (`:127-133`) und `.appUpdate` (`:262-265`) stehen nach `main`.

Tests, die an der heutigen Gestalt hängen und gültig bleiben müssen:

- `src/meals/ui/MealsArea.test.tsx:475-487`: Die drei Knöpfe haben leeres
  `textContent` und ein gemeinsames Elternelement.
- `src/meals/ui/MealsArea.test.tsx:125`, `e2e/meals.spec.ts:27`: "Speichern" wird über
  den Namen gefunden.
- `e2e/meals.spec.ts:33`: "Auf die Einkaufsliste" wird über den Namen gedrückt.

## Zielbild

Ansicht eines Gerichts. Die Leiste ist immer am unteren Rand, egal wie weit gescrollt
ist:

```
┌──────────────────────────────┐
│ [Zurück zu den Gerichten]    │
│ Bolognese                 h1 │
│ Einkaufs-Items, 2         h2 │
│  Hackfleisch, 500 g          │
│ Rezept                    h2 │
│  Schritt 1 …                 │
│  Schritt 2 …                 │
│──────────────────────────────│  ← weiß, Trennlinie oben
│ [  🛒+  ] [  ✎  ] [  🗑  ]    │  ← je 3rem hoch, gleich breit
│        (Home-Indikator)      │
└──────────────────────────────┘
```

Ganz unten gescrollt liegt die Statuszeile oberhalb der Leiste:

```
│  Schritt 9 …                 │
│ Bolognese, 2 Artikel         │
│ hinzugefügt.                 │  ← Announcer, nicht verdeckt
│──────────────────────────────│
│ [  🛒+  ] [  ✎  ] [  🗑  ]    │
└──────────────────────────────┘
```

Bearbeiten, Tastatur zu:

```
┌──────────────────────────────┐
│ [Zurück zum Gericht]         │
│ Gericht bearbeiten        h1 │
│ Name                         │
│ ┌──────────────────────────┐ │
│ │ Bolognese                │ │
│ └──────────────────────────┘ │
│ …                            │
│──────────────────────────────│
│ [      💾  Speichern       ] │  ← ganze Breite, Inhalt mittig
└──────────────────────────────┘
```

Bearbeiten, Tastatur offen (`bottomBarInFlow`):

```
┌──────────────────────────────┐
│ Rezept                       │
│ ┌──────────────────────────┐ │
│ │ Nudeln kochen|           │ │
│ └──────────────────────────┘ │
│ Fehlerzeile                  │
│ [      💾  Speichern       ] │  ← am Ende des Formulars, ohne Leiste
│┌────────────────────────────┐│
││         Tastatur           ││
│└────────────────────────────┘│
└──────────────────────────────┘
```

Bestätigung:

```
│ Suppe löschen?            h1 │
│ Das Gericht wird für beide   │
│ Geräte entfernt.             │
│    [Löschen] [Abbrechen]     │
```

## Abstraktionen und Wiederverwendung

- `src/shared/ui`
  - `BottomBar.tsx` - NEU, `BottomBar({ children })`. Rendert
    `<div className="bottomBar"><div className="bottomBarContent">{children}</div></div>`
    und ergänzt bei offener Tastatur die Klasse `bottomBarInFlow`.
  - `useOnScreenKeyboard.ts` - NEU, liefert `true`, solange die Bildschirmtastatur
    offen ist. Ohne `window.visualViewport` (jsdom, alte Browser) liefert er `false`.
  - `BottomBar.test.tsx` - NEU, prüft beide Zustände mit nachgebautem
    `visualViewport`.
- `src/meals/ui`
  - `MealPage.tsx` - `<div className="iconActions">` wird zu `<BottomBar>`.
  - `SaveIcon.tsx` - NEU, Diskette im Stil von `TrashIcon`.
  - `MealFormPage.tsx` - "Speichern" steht in `<BottomBar>` und bekommt `<SaveIcon />`
    vor dem Text.
  - `MealsArea.test.tsx` - neuer Fall zum Symbol auf "Speichern".
- `src/index.css`
  - `:root` - neu `--bottomBarHeight: calc(3rem + 1rem + 1px)`: Knopfhöhe, Innenabstand
    oben und unten, Trennlinie.
  - `.bottomBar`, `.bottomBarContent`, `.bottomBarInFlow` - NEU.
  - `body:has(.bottomBar:not(.bottomBarInFlow))`,
    `html:has(.bottomBar:not(.bottomBarInFlow))` - NEU, halten Platz frei.
  - `.iconActions` - entfällt, geht in `.bottomBarContent` auf.
  - `.pageActions` - bekommt `justify-content: center`.
- `e2e/meals.spec.ts` - neuer Fall zur Sichtbarkeit der Leiste.

## Umsetzung

### Phase 1: Leiste auf der Ansicht eines Gerichts

Abhängigkeiten: keine

Die drei Knöpfe der Gerichtsansicht sitzen in einer fixierten Leiste am unteren Rand.
Unten bleibt Platz für Statuszeile und Update-Hinweis frei. Die Bestätigungsseite
zentriert ihre Knöpfe. Die Tastatur-Erkennung kommt erst in Phase 2, weil die
Gerichtsansicht kein Eingabefeld hat.

**Aufgaben**:

- [ ] Test zuerst: In `e2e/meals.spec.ts` den Fall
      `keeps the actions of a long meal in view at the bottom of the screen` ergänzen.
      Er legt "Bolognese" mit einem Item an und füllt das Rezept mit
      `page.getByLabel('Rezept', { exact: true }).fill('Schritt\n\n'.repeat(60))`, damit
      die Seite deutlich höher als der Viewport von 720 px wird. Er speichert und prüft
      auf der Gerichtsansicht:
      - Direkt nach dem Öffnen sind "Auf die Einkaufsliste", "Bearbeiten" und "Löschen"
        `toBeInViewport()`, obwohl das Rezept weit darunter weitergeht.
      - Er drückt "Auf die Einkaufsliste" und scrollt ganz nach unten
        (`page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))`). Dann
        liegt die Unterkante von `getByRole('status')` nicht tiefer als die Oberkante
        des Knopfs "Löschen" (Vergleich über `boundingBox()`).
- [ ] `src/shared/ui/BottomBar.tsx` anlegen, zunächst ohne Tastatur-Erkennung:
      ```tsx
      import type { ReactNode } from 'react'

      export function BottomBar({ children }: { children: ReactNode }) {
        return (
          <div className="bottomBar">
            <div className="bottomBarContent">{children}</div>
          </div>
        )
      }
      ```
- [ ] `src/meals/ui/MealPage.tsx`: `<div className="iconActions">` durch `<BottomBar>`
      ersetzen. Knöpfe, `aria-label` und Reihenfolge bleiben gleich.
- [ ] `src/index.css`: Variable in `:root` ergänzen, `.iconActions` samt
      `.iconActions button` entfernen und die Leiste ergänzen:
      ```css
      :root {
        --bottomBarHeight: calc(3rem + 1rem + 1px);
      }

      .bottomBar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1;
        background-color: #ffffff;
        border-top: 1px solid #d1d5db;
        padding: 0.5rem max(1rem, env(safe-area-inset-right))
          calc(0.5rem + env(safe-area-inset-bottom))
          max(1rem, env(safe-area-inset-left));
      }

      .bottomBarContent {
        display: flex;
        gap: 1rem;
        max-width: 40rem;
        margin: 0 auto;
      }

      .bottomBarContent button {
        flex: 1;
        box-sizing: border-box;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      body:has(.bottomBar:not(.bottomBarInFlow)) {
        padding-bottom: calc(
          var(--bottomBarHeight) + env(safe-area-inset-bottom)
        );
      }

      html:has(.bottomBar:not(.bottomBarInFlow)) {
        scroll-padding-bottom: calc(
          var(--bottomBarHeight) + env(safe-area-inset-bottom)
        );
      }
      ```
      Die Variable steht im bestehenden `:root`-Block, es kommt kein zweiter hinzu.
- [ ] `src/index.css`: `.pageActions` bekommt `justify-content: center;`.

**Automatisierte Verifikation**:

- [ ] Der neue E2E-Fall schlägt vor der Umsetzung fehl und läuft danach grün.
- [ ] `shows the actions of a meal as icons only in one row` in `MealsArea.test.tsx`
      bleibt grün.
- [ ] Die axe-Fälle `on a meal` und `on the confirmation page` bleiben grün.
- [ ] `npm run test` läuft durch.
- [ ] `npm run lint` läuft durch.
- [ ] `npm run build` läuft durch.
- [ ] `npm run test:e2e` läuft durch.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Auf der Ansicht eines kurzen Gerichts sitzt die Leiste mit Wagen, Stift und
      Mülleimer am unteren Bildschirmrand über dem Home-Indikator, mit Trennlinie oben.
- [ ] Bei einem langen Rezept bleibt die Leiste beim Scrollen stehen. Ganz unten sind
      das Rezeptende und die Statuszeile vollständig über der Leiste zu lesen.
- [ ] Mit VoiceOver: Nach dem Rezept folgen "Auf die Einkaufsliste, Taste",
      "Bearbeiten, Taste" und "Löschen, Taste", wie bisher.
- [ ] Auf der Bestätigungsseite stehen "Löschen" und "Abbrechen" mittig.

### Phase 2: Speichern in der Leiste

Abhängigkeiten: Phase 1

"Speichern" zieht mit Disketten-Symbol in die Leiste. Die Leiste erkennt die offene
Tastatur und verliert dann ihre Fixierung.

**Aufgaben**:

- [ ] Test zuerst: `src/shared/ui/BottomBar.test.tsx` anlegen. Ein Helfer baut
      `window.visualViewport` nach: ein `EventTarget` mit veränderbarem `height` und
      `scale`, eingehängt über
      `Object.defineProperty(window, 'visualViewport', { configurable: true, value })`.
      Dazu kommt `window.innerHeight` (ebenfalls über `defineProperty`, 800). `afterEach`
      stellt beide Eigenschaften wieder her. Fälle:
      - `stays fixed while no on-screen keyboard is open`: `height` 800, `scale` 1 →
        die Leiste hat nicht die Klasse `bottomBarInFlow`.
      - `moves into the page flow while the on-screen keyboard is open`: `height` 800,
        dann `height` 450 und `resize` auslösen (in `act`) → die Leiste hat
        `bottomBarInFlow`. Danach `height` 800 und `resize` → die Klasse ist wieder weg.
      - `stays fixed while zoomed in`: `height` 400, `scale` 2 → kein
        `bottomBarInFlow`.
      - `stays fixed without a visual viewport`: `visualViewport` ist `undefined` →
        kein `bottomBarInFlow`.

      Die Leiste finden die Tests über `screen.getByRole('button').closest('.bottomBar')`
      mit einem Knopf als Kind.
- [ ] Test zuerst: In `src/meals/ui/MealsArea.test.tsx` den Fall
      `shows a save symbol next to the save text` ergänzen. Er öffnet das Formular und
      prüft für den Knopf "Speichern": `textContent` ist `'Speichern'`, und er enthält
      ein `svg` mit `aria-hidden="true"` als erstes Kind.
- [ ] `src/shared/ui/useOnScreenKeyboard.ts` anlegen:
      ```ts
      import { useEffect, useState } from 'react'

      const KEYBOARD_MIN_HEIGHT = 150

      function isKeyboardOpen() {
        const viewport = window.visualViewport
        if (!viewport) return false
        const hiddenHeight = window.innerHeight - viewport.height * viewport.scale
        return hiddenHeight > KEYBOARD_MIN_HEIGHT
      }

      export function useOnScreenKeyboard() {
        const [keyboardOpen, setKeyboardOpen] = useState(isKeyboardOpen)

        useEffect(() => {
          const viewport = window.visualViewport
          if (!viewport) return
          const update = () => setKeyboardOpen(isKeyboardOpen())
          viewport.addEventListener('resize', update)
          return () => viewport.removeEventListener('resize', update)
        }, [])

        return keyboardOpen
      }
      ```
- [ ] `src/shared/ui/BottomBar.tsx`: `useOnScreenKeyboard()` nutzen und bei offener
      Tastatur `className="bottomBar bottomBarInFlow"` setzen.
- [ ] `src/index.css`: `.bottomBarInFlow` ergänzen, nach `.bottomBar`:
      ```css
      .bottomBarInFlow {
        position: static;
        border-top: none;
        background-color: transparent;
        padding: 0;
      }
      ```
      Einen eigenen Abstand nach oben braucht die Leiste dabei nicht: Die Fehlerzeile
      `.failure` direkt darüber hat schon `margin-bottom: 1rem`.
- [ ] `src/meals/ui/SaveIcon.tsx` anlegen: Diskette im Stil von `TrashIcon` (24er
      viewBox, `stroke="currentColor"`, Strichstärke 2, `aria-hidden="true"`,
      `focusable="false"`, `className="buttonIcon"`) mit den Pfaden
      `M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z`,
      `M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7` und `M7 3v4a1 1 0 0 0 1 1h7`.
- [ ] `src/meals/ui/MealFormPage.tsx`: Der Speichern-Knopf zieht in die Leiste, sonst
      bleibt er gleich:
      ```tsx
      <BottomBar>
        <button type="button" onClick={saveMeal} aria-describedby="mealFailure">
          <SaveIcon />
          Speichern
        </button>
      </BottomBar>
      ```
- [ ] Test ergänzen: In `e2e/meals.spec.ts` prüft der Fall aus Phase 1 zusätzlich:
      Nach "Bearbeiten" ist "Speichern" `toBeInViewport()`. Das Rezept ist lang, und der
      Fokus liegt im Feld "Name". Desktop-Chrome hat keine Bildschirmtastatur, die
      Leiste ist also fixiert.

**Automatisierte Verifikation**:

- [ ] Die neuen Fälle in `BottomBar.test.tsx` und `MealsArea.test.tsx` schlagen vor der
      Umsetzung fehl und laufen danach grün.
- [ ] Die bestehenden Fälle, die "Speichern" über den Namen drücken, bleiben grün.
- [ ] Die axe-Fälle `on the form` und `on the form with an item taken over` bleiben
      grün.
- [ ] `npm run test` läuft durch.
- [ ] `npm run lint` läuft durch.
- [ ] `npm run build` läuft durch.
- [ ] `npm run test:e2e` läuft durch.

**Manuelle Verifikation** (auf dem iPhone, installierte PWA):

- [ ] Nach "Bearbeiten" sitzt "Speichern" über die ganze Breite am unteren Rand. Die
      Diskette steht links neben dem Text, beide mittig.
- [ ] Beim Tippen ins Feld "Rezept" geht die Tastatur auf. "Speichern" steht dann am
      Ende des Formulars und verdeckt das Feld nicht. Nach dem Schließen der Tastatur
      sitzt die Leiste wieder unten.
- [ ] Dasselbe beim Anlegen eines neuen Gerichts.
- [ ] Hineinzoomen ohne Tastatur lässt die Leiste fixiert.
- [ ] Mit VoiceOver: Nach dem Feld "Rezept" folgt "Speichern, Taste". Die Diskette wird
      nicht vorgelesen.

## Notizen zur Umsetzung

## Verweise

- `docs/agents/plans/2026-09-17-icon-knoepfe-am-gericht.md`: Entstehung der
  Icon-Knöpfe und von `.iconActions` (MZP-004)
- `src/shared/ui/NavigationBar.tsx`, `src/index.css:28-35`: Vorbild für die fixierte
  Leiste
- Visual Viewport API: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
- Lucide-Icon als Stilvorlage: https://lucide.dev/icons/save
