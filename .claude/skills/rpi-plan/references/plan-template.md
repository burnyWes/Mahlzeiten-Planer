# Vorlage für Implementierungspläne

Für `docs/agents/plans/JJJJ-MM-TT-beschreibung.md`.

Der Plan wird auf Deutsch geschrieben. Codeausschnitte, Bezeichner und Dateipfade
bleiben, wie sie im Projekt heissen (Englisch).

```md
---
date: [ISO-Datum aus den Metadaten]
git_commit: [Commit-Hash aus den Metadaten]
branch: [Branch aus den Metadaten]
story: KUERZEL-NNN
topic: "[Name des Vorhabens]"
tags: [plan, betroffene-komponenten]
status: draft
---

# PLAN: KUERZEL-NNN — [Titel]

[Ziel des Plans, Verweis auf Tickets falls vorhanden]

## Akzeptanzkriterien

[Die Kriterien aus der Diskussion]

## Wesentliche Entscheidungen und Abwägungen

1. **[Entscheidung]:** [Gewählte Richtung].
   - Warum: [kurze Begründung]
   - Auswirkung: [wichtigste Folge für die Umsetzung]

## Ausgangslage

[Wie das System heute funktioniert. ASCII-Diagramme, wo sie tragen.]

## Zielbild

[Angestrebter Zustand. Architekturänderungen visualisieren, wo sinnvoll.]

## Abstraktionen und Wiederverwendung

[Welche vorhandenen Abstraktionen genutzt und welche neuen gebraucht werden.]

Dateibäume, wo sie helfen:

- `ordner`
  - `datei1.ext` - [knappe Zusammenfassung der Änderung, betroffene Symbole nennen]
    - `BetroffeneKlasse` - [wenige Worte]
    - `betroffeneFunktion` - [wenige Worte]
  - `datei2.ext` - [knappe Zusammenfassung]

## Logging und Beobachtbarkeit

[Änderungen an Logs oder Metriken. Konkrete Beispielausgaben, wo zutreffend.]

## Umsetzung

### Phase [N]: [Sprechender Name]

Bei nur einer Phase die Überschrift weglassen.

Abhängigkeiten: [Frühere Phasen oder Aufgaben, die vorher fertig sein müssen. `keine`,
wenn unabhängig.]

[Kurze Zusammenfassung des Phasenziels]

**Aufgaben**:
- [ ] [Eine umsetzbare Änderung in einer Datei oder an einem Symbol]
  [Grober Codeausschnitt, wo er hilft]
- [ ] [Nächste Aufgabe]

**Automatisierte Verifikation**:
- [ ] [Konkreter Testfall läuft grün]
- [ ] [Allgemeiner Prüfbefehl läuft durch]

[Einen Abschnitt `**Manuelle Verifikation**` nur aufnehmen, wenn es nutzersichtbare
Prüfungen gibt, die sich nicht sinnvoll automatisieren lassen. Sonst ganz weglassen.]

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

[Relevante Quellen]
```
