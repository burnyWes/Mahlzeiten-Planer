---
name: rpi-plan
description: Erstellt detaillierte, in Phasen gegliederte Implementierungspläne durch interaktives Nachfragen und schrittweise Verfeinerung. Nutze diesen Skill, wenn ein Vorhaben geplant werden soll. Nicht für schnelle Fragen oder kleine Aufgaben. Deutsche Auslöser - Plan erstellen, Umsetzung planen, Vorgehen entwerfen, Konzept erstellen. Englische Auslöser - create a plan, plan the implementation, design an approach.
---

# Implementierungsplan

Du erstellst detaillierte Implementierungspläne in einem interaktiven, iterativen
Vorgehen. Sei skeptisch, gründlich und arbeite eng mit dem Nutzer zusammen.

Antworte auf Deutsch. Der Plan wird auf Deutsch geschrieben; Code, Bezeichner und
Commit-Nachrichten sind Englisch.

## Einstieg

Hat der Nutzer bereits eine Aufgabenbeschreibung, einen Pfad oder ein Thema mitgegeben,
fahre direkt mit Schritt 1 fort. Nur wenn nichts vorliegt, antworte:

```
Ich helfe dir bei einem detaillierten Implementierungsplan. Zuerst muss ich verstehen,
worum es geht.

Bitte gib mir:
1. Was gebaut oder geändert werden soll
2. Relevanten Kontext, Randbedingungen oder besondere Anforderungen
3. Hinweise auf zugehörige Dateien oder frühere Untersuchungen
```

Dann warte auf die Antwort.

## Schritt 1: Kontext sammeln und durchdenken

1. **Genannte Dateien sofort und vollständig lesen**
   - Alles, worauf der Nutzer verweist (Dokumente, Untersuchungen, Code).
   - Lesewerkzeug **ohne** `limit`/`offset` benutzen.
   - Selbst im Hauptkontext lesen, **bevor** du Teilaufgaben startest.

2. **Prüfen, ob bereits eine Untersuchung existiert**
   - Liegt ein Untersuchungsdokument vor (etwa aus `docs/agents/research/`), **gilt es
     als Quelle der Wahrheit**. Untersuche nichts erneut, was dort schon steht.
   - **Wiederhole niemals bereits geleistete Untersuchungsarbeit.** In der Planung geht
     es darum, vorhandene Erkenntnisse in umsetzbare Schritte zu überführen.
   - Liegt keine Untersuchung vor, lass einen Subagenten den Untersuchungsordner nach
     Dateinamen und Frontmatter durchsehen, Relevanz prüfen und bei einem veralteten
     Dokument die Änderungen seit seiner Erstellung nachziehen.

3. **Subagenten für fehlende Informationen**
   - Keine Subagenten für das, was die Untersuchung schon abdeckt.
   - Enge, konkrete Fragen statt breiter Erkundung; die Antwort besteht aus Pfaden und
     Zeilennummern, nicht aus langen Texten.
   - Fremde Schnittstellen musst du vollständig verstehen: liegt der Quellcode vor
     (etwa `node_modules`), lass ihn untersuchen; sonst recherchiere im Web.
   - Finde alle zugehörige Dokumentation und plane ihre Aktualisierung mit ein.
   - Warte auf die Ergebnisse, bevor du weiterarbeitest.

4. **Architekturvorgaben lesen**
   - Betrifft das Vorhaben Fachlichkeit, lies den Skill **`architecture`** und die
     `Bauart` aus `.claude/projekt.md`, bevor du einen Lösungsweg vorschlägst.
   - Bounded Context, Aggregate, Ports und Schichtzuordnung sind
     Entwurfsentscheidungen, die in die Diskussion mit dem Nutzer gehören — nicht
     stillschweigend in die Umsetzung.

5. **Die wichtigsten Dateien selbst lesen**
   - Lies sie mit dem Lesewerkzeug selbst, delegiere das nicht. Du brauchst sie im
     eigenen Kontext, um einen belastbaren Plan zu schreiben.
   - Konzentriere dich auf Dateien, die geändert werden oder Muster vorgeben.

6. **Verständnis prüfen**
   - Gleiche die Anforderungen mit dem tatsächlichen Code ab.
   - Benenne Widersprüche und Missverständnisse.
   - Halte Annahmen fest, die noch zu bestätigen sind.
   - Bestimme den wirklichen Umfang anhand der Codelage.

7. **Verstandenes vorstellen und gemeinsam durchgehen**
   - Fasse zuerst den aktuellen Stand des betroffenen Bereichs zusammen.
   - Nutze ASCII-Diagramme, Bäume oder Ablaufskizzen für Architektur und Abläufe.
   - Nenne die zentralen Dateien, Komponenten, Datenflüsse, Randbedingungen und
     Fundstellen mit `datei:zeile`.
   - Präsentiere noch **keine** Lösung und triff keine unausgesprochenen Annahmen.
   - Stelle dann **eine Frage nach der anderen**, jeweils mit deiner Empfehlung.
   - Fasse nach jeder Antwort das aktualisierte Verständnis kurz zusammen.
   - Trenne die Frage-Antwort-Runden mit `---`.

   Befrage den Nutzer unnachgiebig zu jedem Aspekt, bis ihr ein gemeinsames Verständnis
   habt. Arbeite jeden Ast des Entscheidungsbaums ab. Biete Alternativen an und lass den
   Nutzer entscheiden.

   **Sei visuell**: ASCII-Skizzen für Oberflächen und Architektur.

   **Denk daran**: Der Nutzer ist der Fachmann und trägt die Entscheidungen.

   Überprüfe jede Aussage, die in der Diskussion fällt — im Code, in den Abhängigkeiten
   oder per Webrecherche. Lässt sich eine Frage im Code beantworten, sieh im Code nach,
   statt zu fragen.

## Schritt 2: Struktur festlegen

Wenn alle wesentlichen Entscheidungen stehen, leite die Akzeptanzkriterien aus der
Diskussion ab und stelle Entscheidungen und geplante Phasen zur Prüfung vor.

Jede Phase ist ein **vertikaler, testbarer Schnitt**. Passt das nicht, nimm weniger,
dafür grössere Phasen.

```text
Akzeptanzkriterien:
- [Konkretes Verhalten, das die Umsetzung erfüllen muss]
- [Weiteres gefordertes Ergebnis]

Wesentliche Entscheidungen:
1. **<Entscheidung>:** <gewählte Richtung>.
   - Warum: <kurze Begründung>
   - Auswirkung: <wichtigste Folge für die Umsetzung>

Geplante Phasen:
1. ...
2. ...

Antworte mit "Plan erstellen", dann schreibe ich ihn.
```

**Phasen sind fachliche Schnitte.** Tests und Dokumentation bekommen **keine** eigenen
Phasen, sondern gehören in die Phase, die das zugehörige Verhalten liefert.

## Schritt 3: Plan schreiben

Erst nach **ausdrücklicher** Freigabe.

1. **Metadaten holen**
   - `python <skill_directory>/scripts/metadata.py` liefert Datum, Commit, Branch und
     Repository-Namen. Schlägt `python` fehl, `python3` verwenden.
   - **Story-Nummer vergeben:**
     - Lies das Feld `Kürzel` aus `.claude/projekt.md`. Steht dort noch ein Platzhalter,
       frage den Nutzer nach dem Kürzel (2 bis 5 Grossbuchstaben), schlage eines aus dem
       Projektnamen vor und trage die Antwort dort ein.
     - Durchsuche das `story:`-Feld aller Pläne in `docs/agents/plans/` nach der
       höchsten Nummer. Die neue Nummer ist diese plus eins; gibt es noch keine, beginne
       bei 1.
     - Dreistellig auffüllen: `KEG-001`, `KEG-042`.
     - Trage sie in das `story:`-Frontmatter ein und stelle sie dem Titel voran
       (`# PLAN: KEG-007 — <Titel>`). Der Skill `commit` liest dieses Feld für das
       Commit-Präfix.
   - Dateiname: `docs/agents/plans/JJJJ-MM-TT-beschreibung.md`, Beschreibung in
     Kebab-Case. Der Zielordner kann durch `CLAUDE.md` oder `AGENTS.md` überschrieben
     werden.

2. **Plan schreiben**
   - Struktur nach `<skill_dir>/references/plan-template.md`.
   - `docs/agents/plans/` anlegen, falls nötig.
   - **Jeder umsetzbare Punkt bekommt eine Checkbox** (`- [ ]`) — Aufgaben wie
     Verifikationsschritte.
   - Verifikation:
     - Alles Automatisierbare gehört unter *Automatisierte Verifikation*.
     - *Manuelle Verifikation* nur für nutzersichtbares Verhalten, das sich vernünftig
       nicht automatisieren lässt.
     - Gibt es keine manuellen Prüfungen, lass den Abschnitt ganz weg. Keine
       Platzhalter wie `keine`.
     - Kein manuelles Durchsehen von `git diff` und keine Kaputtmach-Proben, wenn Tests
       oder Skripte das abdecken können.

## Schritt 4: Prüfen und nachschärfen

1. Lass den Plan durch einen Subagenten gegenlesen, sonst lies ihn selbst noch einmal —
   mit Blick auf Stimmigkeit und typische Fehler.
2. Behebe relevante Befunde direkt.
3. Stelle den Entwurf vor:

```
Der Entwurf liegt hier:
`docs/agents/plans/JJJJ-MM-TT-beschreibung.md`

Bitte sieh ihn durch:
- Sind die Phasen sinnvoll geschnitten?
- Sind die Erfolgskriterien konkret genug?
- Stimmen die technischen Details?
- Fehlen Randfälle?
```

4. Arbeite Rückmeldungen ein: Phasen ergänzen, Vorgehen anpassen, Kriterien schärfen,
   Umfang ändern.
5. Ist der Nutzer zufrieden, setze den Status des Plans auf `ready`. Biete an, ihn zu
   committen (nur wenn er nicht ignoriert wird), und gib den nächsten Schritt an:

```text
Nächster Schritt: Plan umsetzen.

Frische Sitzung starten:
/new

Dann:
/rpi-implement @<pfad-zum-plan>
```

## Leitlinien

1. **Sei skeptisch** — hinterfrage vage Anforderungen, erkenne Probleme früh, frage nach
   dem Warum, nimm nichts an, sondern prüfe im Code.
2. **Sei interaktiv** — nicht alles in einem Zug schreiben, Zustimmung an den grossen
   Wegmarken einholen, Kurskorrekturen zulassen.
3. **Gründlich, aber nicht redundant** — vorhandene Untersuchungen unverändert nutzen,
   Subagenten zum Finden, Schlüsseldateien selbst lesen, messbare Erfolgskriterien mit
   klarer Trennung automatisiert/manuell.
4. **Sei visuell** — bei allem Nutzersichtbaren (Web-Oberfläche, Kommandozeilenausgabe,
   Formulare) gehören ASCII-Entwürfe in den Plan, bei Änderungen bestehender
   Oberflächen der Vorher- und der Nachher-Zustand.
5. **Sei praktisch** — kleine, testbare Schritte, Migration und Rückweg mitdenken,
   Dokumentationsänderungen vollständig abdecken, Randfälle bedenken.
6. **Keine offenen Fragen im fertigen Plan** — stösst du auf eine, halte an, kläre sie
   und schreibe erst dann weiter. Der Plan muss vollständig und umsetzbar sein.

## Erfolgskriterien

**Automatisierte Verifikation** (von Agenten ausführbar): Testsuiten, Linter,
Typprüfungen, Architekturtests, Existenz bestimmter Dateien, erfolgreiche Übersetzung.

**Manuelle Verifikation** (braucht einen Menschen):

- Nur wenn der Nutzer mit einem funktionierenden Ergebnis interagieren kann (Oberfläche
  öffnen, Befehl ausführen, Ablauf auslösen).
- **Nie** "Code durchsehen" oder "Umsetzung prüfen" als Schritt.
- **Keine** manuelle Verifikation für interne Phasen (Refactoring, Hilfsmittel, Typen,
  Backend ohne Einstiegspunkt) — dort automatisiert prüfen.
- An den Wegmarken platzieren, an denen ein nutzersichtbares Feature fertig ist.

## Wiederkehrende Muster

**Datenbankänderungen:** Schema und Migration → Zugriffsschicht → Fachlogik →
Schnittstelle → aufrufende Seite aktualisieren.

**Neue Features:** bestehende Muster untersuchen → Fachmodell (Aggregat, Value Objects)
→ Anwendungsfall → Adapter → Oberfläche zuletzt.

**Refactoring:** heutiges Verhalten durch Tests festhalten → schrittweise ändern →
Abwärtskompatibilität wahren → Migrationsweg beschreiben.
