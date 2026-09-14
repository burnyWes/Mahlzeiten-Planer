---
name: setup
description: Richtet ein frisch aus dem Template kopiertes Projekt ein - fragt Projektname, Kürzel und Bauart ab, erkennt den Stack und die Test-, Lint-, Format- und Build-Befehle, schreibt .claude/projekt.md, legt die docs-Struktur und .gitignore an, initialisiert git und erzeugt auf Wunsch ein lauffähiges Grundgerüst. Nutze diesen Skill einmal zu Beginn eines neuen Projekts. Deutsche Auslöser - setup, aufsetzen, einrichten, neues Projekt, Projekt initialisieren, Template einrichten. Englische Auslöser - setup, init, initialize project, bootstrap.
---

# Projekt einrichten

Antworte auf Deutsch. Frage **eine Sache nach der anderen** und schlage jeweils eine
Antwort vor, damit der Nutzer meist nur bestätigen muss.

## Schritt 0 — Zustand prüfen

Lies `.claude/projekt.md`.

- Enthält sie noch Platzhalter (`<noch nicht gesetzt>`) → normal fortfahren.
- Ist sie bereits ausgefüllt → melde den aktuellen Inhalt und frage, ob wirklich neu
  eingerichtet werden soll. Ohne ausdrückliche Bestätigung nichts überschreiben.

Prüfe ausserdem, ob es bereits Quellcode gibt (`src/`, `build.gradle*`, `package.json`,
`pom.xml`). Das entscheidet später über das Grundgerüst.

## Schritt 1 — Name

Frage nach dem Projektnamen. Schlage den Ordnernamen vor, in Grossschreibung und
lesbar aufgelöst (`kegelabend-app` → `Kegelabend-App`).

## Schritt 2 — Kürzel

Leite einen Vorschlag aus dem Namen ab: 2 bis 5 Grossbuchstaben, gut sprechbar,
möglichst aus den Anfangsbuchstaben der bedeutungstragenden Wortteile
(`Kegelabend-App` → `KEG`, `Rechnungsprüfung` → `RPR`).

Erkläre in einem Satz, wofür es dient: es ist das Präfix der Story-Nummern in Plänen
und Commit-Nachrichten (`KEG-007 > feat: ...`).

## Schritt 3 — Bauart

Frage nach der Bauart und schlage `onion` vor:

- `onion` — Domain-Driven Design mit Onion-Architektur. Schichtung verbindlich,
  Architekturtest im Commit-Gate. Für alles mit echter Fachlichkeit.
- `schlank` — für Werkzeuge, Skripte und Prototypen. Keine Schichtpflicht, kein
  Architekturtest. Sprechender Code, keine Kommentare und Tests gelten weiter.

## Schritt 4 — Stack und Befehle erkennen

Suche nach Markern und leite die Befehle daraus ab. Erfinde nichts: Was du nicht
findest, fragst du oder trägst `-` ein.

| Marker | Stack | Test | Lint | Format | Build |
|---|---|---|---|---|---|
| `gradlew` / `build.gradle*` | Gradle | `gradlew test` | `gradlew check -x test` | `gradlew spotlessApply` | `gradlew build` |
| `pom.xml` | Maven | `mvnw test` | `mvnw verify -DskipTests` | `mvnw spotless:apply` | `mvnw package` |
| `package.json` | Node | Skript `test` | Skript `lint` | Skript `format` | Skript `build` |
| `pyproject.toml` | Python | `pytest` | `ruff check` | `ruff format` | - |
| `go.mod` | Go | `go test ./...` | `go vet ./...` | `gofmt -w .` | `go build ./...` |
| `Cargo.toml` | Rust | `cargo test` | `cargo clippy` | `cargo fmt` | `cargo build` |

Bei `package.json`: lies die tatsächlich vorhandenen Skripte aus, statt sie zu raten.
Unter Windows heisst der Gradle-Aufruf `gradlew.bat`, unter macOS und Linux `./gradlew`.
Trage den Aufruf ein, der auf diesem System funktioniert.

Bei mehreren Teilprojekten (Backend und Frontend) verbinde die Befehle je Feld mit
` && `.

Zeige das Ergebnis als Tabelle und lass es bestätigen oder korrigieren.

Findest du gar keinen Marker (leeres Projekt), trage überall `-` ein und weise darauf
hin, dass `commit` die Felder beim ersten Aufruf nach dem Grundgerüst nachträgt.

## Schritt 5 — Dateien schreiben

1. `.claude/projekt.md` mit Name, Kürzel, Stack, Bauart und den Befehlen füllen.
   Struktur und Erläuterungsteil am Dateiende unverändert lassen.
2. `docs/agents/plans/` und `docs/agents/research/` anlegen, falls nicht vorhanden.
3. `docs/notes.txt` anlegen, falls nicht vorhanden — mit der Legende aus dem Template.
4. `.gitignore` passend zum erkannten Stack schreiben. Nur Einträge aufnehmen, die zum
   Projekt gehören; keine pauschale Sammelliste. Immer enthalten:
   `.claude/settings.local.json`.
5. `README.md` des Templates löschen oder durch eine Projekt-README ersetzen — frage,
   was gewünscht ist.

## Schritt 6 — git

Ist das Verzeichnis noch kein Repository, führe `git init` aus und schlage einen ersten
Commit vor (`chore: initialize project from template`, mit der Fusszeile
`(committed by agent)`). Committe erst nach Bestätigung.

Ist es bereits ein Repository, fasse nichts an und melde nur den Zustand.

## Schritt 7 — Grundgerüst anbieten

Nur anbieten, wenn noch **kein** Quellcode existiert. Frage einmal, ob ein Grundgerüst
angelegt werden soll, und beschreibe vorher konkret, was entsteht.

Bei `Bauart: onion` und Gradle:

- `build.gradle.kts` mit JUnit 5, AssertJ, ArchUnit und Spotless
- Basispaket samt erstem Bounded Context und den drei Schichten
- `ArchitectureTest` mit den Regeln aus `references/java.md` des `architecture`-Skills
- ein erster echter Test, der grün läuft

Bei einem TypeScript-Frontend zusätzlich Vite, Vitest, ESLint mit der
Import-Grenzregel und Prettier, Struktur nach `references/typescript.md`.

Bei `Bauart: schlank` nur das Minimum: Buildsystem, Testframework, Formatter, ein
grüner Test.

Regeln für das Gerüst:

- **Versionen zur Laufzeit nachschlagen**, nicht aus den Referenzdokumenten übernehmen.
  Nutze die vorhandenen Werkzeuge (Websuche oder Paketregister), um aktuelle stabile
  Versionen zu ermitteln, und nenne sie dem Nutzer.
- Das Basispaket erfragen (Vorschlag aus Kürzel und Name ableiten, etwa
  `de.<nutzer>.<projekt>`).
- Den Namen des ersten Bounded Context erfragen — ein englischer Fachbegriff.
- Keine Beispiel-Fachlichkeit erfinden, die niemand braucht. Ein Kontext, ein
  Aggregat, ein Test, der die Struktur nachweist — mehr nicht.
- Danach den Testbefehl ausführen und den grünen Lauf zeigen. Ist er rot, in Ordnung
  bringen, bevor der Skill endet.
- Die tatsächlich funktionierenden Befehle in `.claude/projekt.md` nachtragen.

## Schritt 8 — Abschluss

Fasse zusammen, was eingerichtet wurde, und nenne die nächsten Schritte:

```text
Eingerichtet:
  Name    <Name>
  Kürzel  <KÜRZEL>
  Bauart  <onion|schlank>
  Test    <Befehl>

Nächste Schritte:
  /rpi-research <Frage>    Bestehendes verstehen
  /rpi-plan <Vorhaben>     Plan erstellen
  /rpi-implement <Plan>    Plan umsetzen
  /commit                  Committen mit Gate
```

## Grenzen

- Niemals vorhandene Dateien ohne Nachfrage überschreiben.
- Niemals `git init` in einem bestehenden Repository.
- Nichts löschen, was der Nutzer nicht ausdrücklich freigegeben hat.
