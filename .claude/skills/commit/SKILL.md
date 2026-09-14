---
name: commit
description: Erstellt einen git-Commit in diesem Repository. Führt vorher Formatierung, Lint, Tests, Architekturtest, Secret-Scan und eine Diff-Prüfung auf Kommentare und Debug-Reste aus und committet nur, wenn alles grün ist. Die Betreffzeile hat das Format "KÜRZEL-NNN > type: subject" mit dem Projektkürzel aus .claude/projekt.md. Deutsche Auslöser - commit, committen, einchecken, Änderungen committen. Englische Auslöser - commit, make a commit.
---

# Commit

Antworte auf Deutsch. Die **Commit-Nachricht selbst ist Englisch**.

**Niemals committen, wenn eine Prüfung fehlschlägt.**

## Schritt 1 — Projektdaten laden

Lies `.claude/projekt.md` und hole dir `Kürzel`, `Bauart` und die Befehle.

**Fehlt das Kürzel** (Platzhalter `<noch nicht gesetzt>`):

1. Leite einen Vorschlag ab — 2 bis 5 Grossbuchstaben aus dem Projekt- oder
   Ordnernamen (`kegelabend-app` → `KEG`).
2. Frage den Nutzer, ob das passt, und erkläre in einem Satz: das Kürzel ist das Präfix
   der Story-Nummern in Plänen und Commits.
3. Trage die Antwort in `.claude/projekt.md` ein. Ab jetzt wird nicht mehr gefragt.

**Fehlen die Befehle**: erkenne sie nach der Tabelle unten, lass sie bestätigen und
trage sie ebenfalls nach.

| Marker | Test | Lint | Format |
|---|---|---|---|
| `gradlew` / `build.gradle*` | `gradlew test` | `gradlew check -x test` | `gradlew spotlessApply` |
| `pom.xml` | `mvnw test` | `mvnw verify -DskipTests` | `mvnw spotless:apply` |
| `package.json` | Skript `test` | Skript `lint` | Skript `format` |
| `pyproject.toml` | `pytest` | `ruff check` | `ruff format` |
| `go.mod` | `go test ./...` | `go vet ./...` | `gofmt -w .` |
| `Cargo.toml` | `cargo test` | `cargo clippy` | `cargo fmt` |

Ein Feld mit `-` bedeutet: Schritt entfällt, kommentarlos überspringen. Bei
`package.json` immer die tatsächlich vorhandenen Skripte lesen, nie raten. Unter Windows
`gradlew.bat`, sonst `./gradlew`.

Ist ein Befehl gar nicht auffindbar und der Nutzer will trotzdem committen, weise
**einmal** darauf hin, welches Netz damit fehlt, und fahre fort.

## Schritt 2 — Änderungen verstehen

`git status` und `git diff` (bei bereits gestagten Änderungen zusätzlich
`git diff --cached`). Daraus ergeben sich der passende Typ und der Betreff. Ohne
Verständnis der Änderung keine Nachricht.

## Schritt 3 — Formatieren

Format-Befehl **schreibend** ausführen.

Berührt er auffällig viele Dateien, die nichts mit der Änderung zu tun haben (das
passiert beim ersten Lauf über ein ungepflegtes Repository), halte an, melde den Umfang
und frage, ob die Formatierung in einen eigenen Commit soll.

## Schritt 4 — Lint

Lint-Befehl ausführen. **Rot bedeutet Stopp**: Befund zeigen, nicht committen.

## Schritt 5 — Tests

Test-Befehl ausführen. **Rot bedeutet Stopp**: die relevante Ausgabe zeigen, nicht
committen. Keine Ausnahme, auch nicht bei Eile — ein roter Stand wird nicht eingefroren.

Bei `Bauart: onion` gehört der Architekturtest zum Testlauf. Fehlt er, weise darauf hin,
dass die Onion-Regel derzeit ungeprüft ist, und biete an, ihn anzulegen.

## Schritt 6 — Secret-Scan

Prüfe die Änderungen auf Zugangsdaten. Suche in den hinzugefügten Zeilen nach:

- Zuweisungen an `password`, `passwd`, `secret`, `token`, `api_key`, `apikey`,
  `access_key`, `private_key`, `client_secret`
- `BEGIN` gefolgt von `PRIVATE KEY`
- typische Schlüsselformen: `AKIA` am Wortanfang, `ghp_`, `github_pat_`, `sk-`,
  `xox` mit folgendem Buchstaben, lange base64-artige Zeichenketten in
  Konfigurationsdateien
- neu hinzugefügte Dateien namens `.env`, `*.pem`, `*.key`, `*.p12`, `*.keystore`

Ein Treffer stoppt den Commit. Zeige die Fundstelle und frage nach. Ein einmal
committetes Geheimnis bekommt man aus der Historie kaum wieder heraus — das ist der eine
Fehler, der sich nicht billig korrigieren lässt.

Platzhalter in Beispieldateien (`password=changeme`, `token=<your-token>`) sind kein
Treffer.

## Schritt 7 — Diff-Prüfung auf Kommentare und Debug-Reste

Sieh die **hinzugefügten** Zeilen durch auf:

- Debug-Ausgaben: `System.out.println`, `console.log`, `print(`, `debugger`, `dd(`
- auskommentierten Code
- `TODO`, `FIXME`, `XXX` im Code — die gehören nach `docs/notes.txt`
- **neue erklärende Kommentare**

Zu den Kommentaren gilt die Projektregel: Kommentare, die beschreiben *was* der Code
tut, werden aufgelöst — in benannte Methoden, Variablen und Typen. Löse sie auf, statt
sie zu committen, und zeige dem Nutzer, was du geändert hast.

Erlaubt bleibt ausschliesslich ein *Warum*-Kommentar, dessen Grund ausserhalb des Codes
liegt (Bibliotheks-Bug, Fremdsystem-Eigenheit, überraschende fachliche Vorgabe) — mit
überprüfbarer Quelle. Fehlt die Quelle, frage danach.

Debug-Reste und Code-Leichen entfernst du. Bei allem, was Absicht sein könnte, fragst du
nach, statt eigenmächtig zu löschen.

Nach Änderungen in diesem Schritt: **zurück zu Schritt 5** und Tests erneut laufen
lassen.

## Schritt 8 — Stagen

`git add -A`. Das schliesst `docs/notes.txt` ausdrücklich ein — Notizänderungen werden
nie ausgelassen.

## Schritt 9 — Nachricht bauen

```
KÜRZEL-NNN > type: subject

optionaler Rumpf, der das Warum erklärt

(committed by agent)
```

- **KÜRZEL-NNN** — Kürzel aus `.claude/projekt.md`, Nummer aus dem `story:`-Feld im
  Frontmatter des Plans, der gerade umgesetzt wird (`docs/agents/plans/`). Gehört die
  Änderung zu keinem Plan, entfällt das Präfix samt ` > ` und der Betreff beginnt direkt
  bei `type:`.
- **type** — `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`, `revert`.
- **subject** — **Englisch**, Imperativ, klein, ohne Punkt am Ende, möglichst höchstens
  72 Zeichen.
- **Rumpf** — optional, Englisch, erklärt das Warum, wenn es nicht offensichtlich ist.
  Nie eine Aufzählung dessen, was der Diff ohnehin zeigt.
- **Fusszeile** — `(committed by agent)`, nach einer Leerzeile, immer vorhanden.

Mit Plan:

```
KEG-007 > feat: add score entry to game aggregate

Throws are recorded on the aggregate so the maximum-round invariant
stays inside the domain.

(committed by agent)
```

Ohne Plan:

```
fix: correct label in start menu

(committed by agent)
```

## Schritt 10 — Committen

Commit erstellen und mit `git log -1 --stat` bestätigen. Melde dem Nutzer kurz Betreff
und Umfang.

**Nicht pushen** — das entscheidet der Nutzer.

## Ablauf im Überblick

```
projekt.md lesen  ->  Kürzel/Befehle ggf. nachtragen
        |
   git status/diff
        |
   Format anwenden
        |
   Lint  ---------> rot: STOPP
        |
   Tests ---------> rot: STOPP
        |
   Secret-Scan ---> Treffer: STOPP
        |
   Diff-Prüfung --> Kommentare auflösen, Debug-Reste raus -> zurück zu Tests
        |
   git add -A
        |
   Commit + git log -1 --stat
```

## Grenzen

- Kein `--no-verify`, keine übersprungenen Prüfungen, kein Commit auf rotem Stand.
- Kein `git push`, kein `git reset --hard`, kein `git rebase` aus diesem Skill heraus.
- Alle Befehle laufen aus dem Repository-Wurzelverzeichnis, sofern nicht anders in
  `.claude/projekt.md` hinterlegt.
