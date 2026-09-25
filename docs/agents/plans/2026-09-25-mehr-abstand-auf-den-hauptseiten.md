---
date: 2026-09-25T21:41:21+00:00
git_commit: 3a7063f42799a9a8c42fa963cc3a97d3c1530343
branch: main
story: MZP-036
topic: "Mehr Abstand auf den Hauptseiten"
tags: [plan, css, pageHeader, mealFilter, weekPlan]
status: ready
---

# PLAN: MZP-036 — Mehr Abstand auf den Hauptseiten

Auf den Hauptseiten sitzt der Inhalt zu dicht unter der Überschrift, auf der
Gerichteseite zu dicht unter dem Filter und im Wochenplan zu dicht unter der Tages- bzw.
Tageszeitauswahl. An allen drei Stellen werden aus 1rem (18 px) künftig 1.5rem (27 px).
Die Entscheidungen stammen aus der Befragung vom 2026-09-25.

## Akzeptanzkriterien

- Auf Einkaufsliste, Gerichte, Vorräte, Wochenplan und Einstellungen stehen zwischen der
  Überschriftenzeile (`.pageHeader`) und dem Inhalt darunter 1.5rem. Das gilt auch,
  wenn darunter nur ein Hinweistext steht (z. B. „Die Liste ist leer.“).
- Auf der Gerichteseite stehen zwischen Filter und Liste bzw. Hinweistext 1.5rem.
  Zwischen Überschrift und Filter sind es ebenfalls 1.5rem. Ohne Filter (keine Arten
  oder Kategorien) folgt die Liste mit 1.5rem direkt auf die Überschrift.
- Im Wochenplan stehen unter der Tagesauswahl (Tagesansicht) und unter der
  Tageszeitauswahl (Wochenansicht) 1.5rem bis zur Liste bzw. zum Hinweistext.
- Unterseiten mit einfachem `<h1>` (Formulare, Detail-, Lösch- und Zeitraumseite, die
  Anmeldung) sehen unverändert aus.

## Wesentliche Entscheidungen und Abwägungen

1. **Nur die Hauptseiten:** Der Abstand kommt an `.pageHeader`, nicht an `h1`.
   - Warum: Die Unterseiten nutzen die Browser-Voreinstellung für `h1`
     (`font-size: 2em`, `margin: 0.67em`) und haben darunter schon etwa 24 px Luft.
     Deutlich zu eng sind nur die Hauptseiten.
   - Auswirkung: Keine Unterseite ändert sich, auch nicht die Größe ihrer Überschrift.

2. **Einheitlich 1.5rem an allen drei Stellen.**
   - Warum: Das ist spürbar mehr Luft, auf dem Handy bleibt aber mehr Inhalt sichtbar
     als bei 2rem. Ein einziger Wert wirkt ruhig.
   - Auswirkung: Ein einziger Wert an drei Regeln.

3. **Jeweils `margin-bottom` am oberen Element, das untere bleibt unangetastet.**
   `.pageHeader`, `.mealFilter` und `.planNavigation` bekommen `margin-bottom: 1.5rem`.
   - Warum: Die Elemente stehen als Blöcke untereinander in `main.page`, einem
     gewöhnlichen Block-Container ohne Flex oder Grid. Deshalb fallen ihre vertikalen
     Außenabstände zusammen, und es gilt der größere der beiden Werte. Mit 1.5rem oben
     ist es gleichgültig, ob darunter `.itemList` (`margin-top: 1rem`),
     `.mealFilter` (`margin-top: 1rem`) oder ein `<p>` (`1em`) folgt.
   - Auswirkung: Drei kleine Änderungen in `src/index.css`, keine an TSX-Dateien.
     `.itemList`, `.mealFilter`-`margin-top` und `.field` bleiben, wie sie sind.

4. **Kein automatisierter Test für die Abstände.**
   - Warum: jsdom berechnet kein Layout. Ein Test würde nur den Wert im Stylesheet
     wiederholen. Die Wirkung ist allein am Gerät zu sehen.
   - Auswirkung: Die bestehenden Suiten müssen grün bleiben, dazu kommt die
     Sichtprüfung.

## Ausgangslage

`main.page` (`src/index.css:48`) ist ein Block-Container. Unter der Überschrift liefert
heute immer das nächste Element den Abstand, denn `.pageHeader`
(`src/index.css:165-170`) hat keinen Außenabstand:

```
Seite          Datei                      unter .pageHeader           Abstand
───────────────────────────────────────────────────────────────────────────────
Einkauf        ShoppingListPage.tsx:53    .itemList / <p>             18 px
Gerichte       MealListPage.tsx:48        .mealFilter / .itemList/<p> 18 px
Vorräte        SupplyListPage.tsx:44      .itemList / <p>             18 px
Wochenplan     WeekPlanPage.tsx:214       .planNavigation             18 px
Einstellungen  SettingsPage.tsx:84        .itemList                   18 px
```

Die zwei anderen Stellen:

- `.mealFilter` (`src/index.css:513-518`): `margin: 1rem 0 0`. Nach unten hat er
  also 0, den Abstand zur Liste liefert `.itemList` mit 1rem.
- `.planNavigation` (`src/index.css:425-430`): `margin: 1rem 0`. Unten fällt er mit
  dem `margin-top: 1rem` der `.itemList` zu 1rem zusammen. Die versteckte `h2` der
  Wochenansicht (`WeekPlanPage.tsx:241`) ist `position: absolute` und nimmt am
  Zusammenfallen nicht teil.

```
Gerichte heute                         Wochenplan heute
┌──────────────────────────────┐      ┌──────────────────────────────┐
│ Gerichte, 12            [+]  │      │ Wochenplan, 3 von 28    [⚙]  │
│                              │ 18   │                              │ 18
│ Filter [ Alle          ▾] [x]│      │ [<]    Mo, 29.09.   [>]  [▦] │
│                              │ 18   │                              │ 18
│ ──────────────────────────── │      │ ──────────────────────────── │
│ Nudeln mit Pesto        [🛒] │      │ ☀ [ Müsli             ] [⤨]  │
└──────────────────────────────┘      └──────────────────────────────┘
```

## Zielbild

```
Gerichte danach                        Wochenplan danach (Wochenansicht)
┌──────────────────────────────┐      ┌──────────────────────────────┐
│ Gerichte, 12            [+]  │      │ Wochenplan, 3 von 28    [⚙]  │
│                              │      │                              │
│                              │ 27   │                              │ 27
│ Filter [ Alle          ▾] [x]│      │ [☼][☀][☾][🍎]            [▣] │
│                              │      │                              │
│                              │ 27   │                              │ 27
│ ──────────────────────────── │      │ ──────────────────────────── │
│ Nudeln mit Pesto        [🛒] │      │ Mo [ Müsli            ] [⤨]  │
└──────────────────────────────┘      └──────────────────────────────┘

Einkaufsliste, Vorräte, Einstellungen danach
┌──────────────────────────────┐
│ Einkaufsliste, 4        [+]  │
│                              │
│                              │ 27
│ ──────────────────────────── │
│ ☐ Milch            [-] 1 [+] │
└──────────────────────────────┘
```

Zusammenfallen der Außenabstände nach der Änderung:

```
.pageHeader     margin-bottom 1.5rem ┐
                                     ├─ max = 1.5rem
.mealFilter     margin-top    1rem   ┘
.mealFilter     margin-bottom 1.5rem ┐
                                     ├─ max = 1.5rem
.itemList / <p> margin-top    1rem   ┘
```

## Abstraktionen und Wiederverwendung

Es entsteht keine neue Klasse und kein neues Custom Property. Die drei vorhandenen
Regeln bekommen jeweils ihren Abstand nach unten.

- `src`
  - `index.css`
    - `.pageHeader` — neu `margin-bottom: 1.5rem`
    - `.planNavigation` — `margin: 1rem 0` wird zu `margin: 1rem 0 1.5rem`
    - `.mealFilter` — `margin: 1rem 0 0` wird zu `margin: 1rem 0 1.5rem`

Nicht angefasst werden alle TSX-Dateien, `.itemList`, `.field`, `h1`/`h2` und die
Unterseiten.

## Logging und Beobachtbarkeit

Keine Änderung. Die VoiceOver-Ansagen bleiben dieselben, weil sich weder die Struktur
noch die Reihenfolge der Elemente ändert.

## Umsetzung

Abhängigkeiten: keine.

**Aufgaben**:

- [x] `.pageHeader` in `src/index.css` (Zeile 165-170) um `margin-bottom: 1.5rem`
      ergänzen.
      ```css
      .pageHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      ```
- [x] `.planNavigation` in `src/index.css` (Zeile 425-430): `margin: 1rem 0` wird zu
      `margin: 1rem 0 1.5rem`.
- [x] `.mealFilter` in `src/index.css` (Zeile 513-518): `margin: 1rem 0 0` wird zu
      `margin: 1rem 0 1.5rem`.

**Automatisierte Verifikation**:

- [x] `npm run format` ändert an `src/index.css` nichts mehr.
- [x] `npm run lint` läuft durch.
- [x] `npm run test` läuft durch, auch die Zugänglichkeitsprüfungen.
- [x] `npm run build` übersetzt ohne Fehler.

**Manuelle Verifikation**:

- [ ] Einkaufsliste, Vorräte und Einstellungen: Zwischen Überschriftenzeile und erster
      Zeile bzw. Hinweistext ist sichtbar mehr Luft als vorher.
- [ ] Gerichte mit Filter: Überschrift → Filter und Filter → Liste haben gleich viel
      Luft. Mit leerem Filterergebnis gilt das auch für „Noch keine Gerichte.“
- [ ] Wochenplan in der Tages- und in der Wochenansicht: Unter der Tages- bzw.
      Tageszeitauswahl ist gleich viel Luft wie zwischen Überschrift und Auswahl.
- [ ] Eine Unterseite (z. B. Gericht bearbeiten) sieht unverändert aus.
- [ ] Beides in beiden Farbstellungen.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `src/index.css` — `.pageHeader` (165), `.itemList` (183), `.planNavigation` (425),
  `.mealFilter` (513)
- MDN, Mastering margin collapsing:
  https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing
