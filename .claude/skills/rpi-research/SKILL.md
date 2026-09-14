---
name: rpi-research
description: Führt eine tiefe Untersuchung der Codebasis durch und schreibt einen Bericht nach docs/agents/research/. Nutze diesen Skill für echte Untersuchungsfragen, nicht für schnelle Nachschlagearbeiten. Deutsche Auslöser - untersuche, erforsche, recherchiere, verstehe wie X funktioniert, Analyse der Codebasis. Englische Auslöser - research, deeply investigate, fully understand how X works.
---

# Codebasis untersuchen

Du untersuchst die Codebasis umfassend, um die Frage des Nutzers zu beantworten — durch
parallele Subagenten und das Zusammenführen ihrer Ergebnisse.

Antworte auf Deutsch. Das Untersuchungsdokument wird auf Deutsch geschrieben; Codezitate,
Pfade und Bezeichner bleiben natürlich, wie sie im Code stehen.

## ENTSCHEIDEND: Deine einzige Aufgabe ist es, die Codebasis so zu dokumentieren, wie sie heute ist

- Schlage **keine** Verbesserungen oder Änderungen vor, solange nicht ausdrücklich danach gefragt wird.
- Betreibe **keine** Ursachenanalyse, solange nicht ausdrücklich danach gefragt wird.
- Schlage **keine** künftigen Erweiterungen vor.
- Kritisiere die Umsetzung nicht und benenne keine Probleme.
- Empfiehl kein Refactoring, keine Optimierung, keine Architekturänderung.
- Beschreibe **ausschliesslich**, was existiert, wo es liegt, wie es funktioniert und wie
  die Teile zusammenwirken.
- Du erstellst eine technische Landkarte des bestehenden Systems.

## Einstieg

Hat der Nutzer bereits eine Frage mitgegeben, fahre direkt mit Schritt 1 fort. Nur wenn
keine Frage vorliegt, antworte:

```
Ich bin bereit für die Untersuchung. Nenn mir deine Frage oder den Bereich, der dich
interessiert, dann arbeite ich mich durch die betroffenen Komponenten und ihre
Zusammenhänge.
```

Formuliert der Nutzer statt einer Frage einen Feature-Wunsch, lehne die Untersuchung ab,
erkläre kurz warum, und schlage vor, mit `/new` einen frischen Kontext zu öffnen und
eine oder mehrere Untersuchungsfragen zu stellen — mit einem passenden Beispiel, etwa
`/rpi-research Wie läuft die Anmeldung heute ab?`.

## Ablauf

1. **Genannte Dateien zuerst lesen**
   - Nennt der Nutzer Dateien oder Dokumente, lies sie **vollständig** zuerst.
   - Nutze das Lesewerkzeug **ohne** `limit`/`offset`.
   - Lies sie selbst im Hauptkontext, bevor du Teilaufgaben startest.

2. **Frage zerlegen**
   - Deine Aufgabe ist **untersuchen**, nicht planen. Bei einem Feature-Wunsch verstehst
     du nur den bestehenden Code dazu und erfindest nichts.
   - Zerlege die Frage in einzeln untersuchbare Bereiche.
   - Denke gründlich über die Muster und Zusammenhänge nach, die der Nutzer eigentlich
     sucht.
   - Überlege, welche Verzeichnisse, Dateien und Muster relevant sind.

3. **Parallele Subagenten für die Landkarte**
   - Starte mehrere Subagenten, die **Dateien finden** und melden — nicht solche, die
     Code tief analysieren.
   - Jeder Subagent meldet Pfade, Zeilennummern und kurze Beschreibungen zurück.
   - Lass Agenten, die Verschiedenes suchen, parallel laufen.
   - Erinnere sie daran, dass sie dokumentieren und nicht bewerten.
   - Stehen keine Subagenten zur Verfügung, untersuche im Hauptkontext.
   - **Findest du eine bestehende Untersuchung zum gleichen Thema:** prüfe Commit-Hash
     und Zeitstempel im Kopf des Dokuments und lass durch einen Subagenten prüfen, was
     sich seither geändert hat. Ist es noch aktuell, lies und nutze es. Entscheide dann,
     ob du das Dokument fortschreibst oder ein neues anlegst.
   - **Bei ausdrücklichem Wunsch nach Webrecherche:** starte Agenten mit Suchwerkzeugen,
     eine Frage je Agent, jede Aussage mit Quelle. Verhält sich das Suchwerkzeug bereits
     wie ein Subagent, nutze es direkt.

4. **Die wichtigsten Dateien selbst lesen**
   - Nachdem die Subagenten gemeldet haben, lies die zentralen Dateien **selbst**.
   - Verlass dich für die Kernaussagen nicht auf Zusammenfassungen — dort gehen Nuancen
     und Zusammenhänge verloren.
   - Randbereiche, die die Subagenten ausreichend beschrieben haben, kannst du auslassen.

5. **Zusammenführen**
   - Verbinde deine eigene Lektüre mit den Funden der Subagenten.
   - Nenne konkrete Pfade und Zeilennummern.
   - Arbeite Muster, Verbindungen und getroffene Entwurfsentscheidungen heraus.
   - Beantworte die Frage des Nutzers mit belegbaren Fundstellen.

6. **Metadaten holen**
   - `python <skill_directory>/scripts/metadata.py` liefert Datum, Commit, Branch und
     Repository-Namen. Schlägt `python` fehl, `python3` verwenden.
   - Dateiname: `docs/agents/research/JJJJ-MM-TT-beschreibung.md`, Beschreibung in
     Kebab-Case, zum Beispiel `2026-09-09-anmeldeablauf.md`.
   - Der Zielordner kann durch Vorgaben in `CLAUDE.md` oder `AGENTS.md` überschrieben
     werden.

7. **Dokument schreiben**
   - Lege `docs/agents/research/` an, falls nötig.
   - Struktur:

```markdown
---
date: [ISO-Datum aus den Metadaten]
git_commit: [Commit-Hash aus den Metadaten]
branch: [Branch aus den Metadaten]
topic: "[Frage des Nutzers]"
tags: [research, codebase, betroffene-komponenten]
status: complete
---

# Untersuchung: [Thema]

## Fragestellung
[Ursprüngliche Frage]

## Zusammenfassung
[Was gefunden wurde - beschreibend, ohne Bewertung]

[Dateibaum der zentralen Dateien, nach Ordnern gruppiert]

[ASCII-Diagramme, wo sie das Verständnis tragen]

## Detaillierte Befunde

### [Bereich 1]
- Was existiert (datei.ext:zeile)
- Wie es mit anderen Teilen zusammenhängt
- Umsetzungsdetails, ohne Bewertung

### [Bereich 2]
...

## Fundstellen
- `pfad/zur/datei.java:123` - was dort liegt
- `andere/datei.ts:45-67` - was dieser Block tut

## Architektur im Bestand
[Vorgefundene Muster, Konventionen und Entwurfsentscheidungen]

## Offene Fragen
[Was weiterer Untersuchung bedarf]
```

8. **Ergebnis vorstellen**
   - Knappe Zusammenfassung, die wichtigsten Fundstellen zur Navigation, Angebot für
     Rückfragen.

9. **Rückfragen behandeln**
   - Ergänze dasselbe Dokument um einen Abschnitt `## Nachrecherche [Zeitstempel]`.
   - Hast du den Kontext bereits, antworte direkt; sonst starte gezielt neue Subagenten.

## Wichtige Hinweise

- Subagenten für die Landkarte, die zentralen Dateien liest du selbst.
- Jeder Subagenten-Auftrag ist eng gefasst und auf Fundstellen gerichtet.
- Untersuchungsdokumente sind in sich abgeschlossen und tragen ihren Kontext selbst.
- **Du und alle Subagenten sind Dokumentierende, keine Bewertenden.**
- **Beschreibe, was IST — nicht, was SEIN SOLLTE.**
- Genannte Dateien immer vollständig lesen, bevor Teilaufgaben starten.
- Halte die Reihenfolge der Schritte ein und schreibe niemals ein Dokument mit
  Platzhalterwerten.
