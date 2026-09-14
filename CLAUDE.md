# Arbeitsweise in diesem Projekt

## Sprache

- Antworte **immer auf Deutsch** — auch bei Zwischenmeldungen, Zusammenfassungen und Rückfragen.
- **Deutsch:** Gespräch, Skills, Pläne, Research-Dokumente, `docs/notes.txt`.
- **Englisch:** Quellcode samt aller Bezeichner, Testnamen und Commit-Nachrichten.

## Code

- Der Code ist so sprechend geschrieben, dass **keine Kommentare nötig sind**.
- Kommentare, die beschreiben *was* der Code tut, sind verboten. Sie werden stattdessen
  in benannte Methoden, Variablen und Typen aufgelöst.
- Einzige Ausnahme: ein *Warum*-Kommentar, wenn der Grund **außerhalb** des Codes liegt
  (Bibliotheks-Bug, Eigenheit eines Fremdsystems, überraschende fachliche Vorgabe).
  Pflicht dabei: eine überprüfbare Quelle — Link, Ticket oder Versionsnummer.
- Keine Umlaute und kein `ß` in Bezeichnern.
- Keine auskommentierten Code-Reste, keine `TODO`-Kommentare. Offene Punkte gehören in
  `docs/notes.txt`.

## Architektur

- Standard ist **Domain-Driven Design mit Onion-Architektur**, solange `Bauart` in
  `.claude/projekt.md` nicht auf `schlank` steht.
- Abhängigkeiten zeigen **immer nach innen**: `infrastructure` → `application` → `domain`.
  Die Domäne kennt weder Framework noch Datenbank noch Transport.
- Oberste Gliederung ist der fachliche Kontext, darunter erst die Schichten.
- Bausteine, Ordnerstruktur, Anti-Patterns und stack-spezifische Ausformung stehen im
  Skill **`architecture`**. Lies ihn, bevor du fachlichen Code entwirfst oder änderst.

## Tests

- `domain` und `application` werden **test-getrieben** entwickelt: erst der
  fehlschlagende Test, dann der Code.
- In `domain` und `application` **kein Framework und kein Mockito** — reine Unit-Tests
  mit In-Memory-Fakes für die Ports. Wer dort mocken muss, hat falsch geschnitten.
- `infrastructure` wird pragmatisch getestet: ein Integrationstest je Adapter, kein Test
  für reine Konfigurationsklebe.

## Notizen

`docs/notes.txt` gehört dem Nutzer. Du **darfst** unten unter TODO anhängen (`-` für
Aufgaben, `b` für Bugs, die dir auffallen) und nachweislich Erledigtes auf `x` setzen und
nach DONE verschieben. Du **darfst nicht** umsortieren, umformulieren, löschen oder die
Priorisierung ändern.

## Commits

Nur über den Skill **`commit`**. Er formatiert, prüft Lint, Tests, Architektur und
Secrets — und committet ausschließlich, wenn alles grün ist.

@.claude/projekt.md
