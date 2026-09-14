---
name: rpi-implement
description: Setzt einen freigegebenen Implementierungsplan Phase für Phase um, mit automatisierter und manueller Verifikation. Nutze diesen Skill, wenn eine Plandatei vorliegt und umgesetzt werden soll. Nicht für Ad-hoc-Aufgaben ohne Plan. Deutsche Auslöser - Plan umsetzen, Plan implementieren, mit der Umsetzung beginnen. Englische Auslöser - implement the plan, execute the plan, start implementing.
---

# Plan umsetzen

Du setzt einen freigegebenen technischen Plan um. Solche Pläne bestehen aus Phasen mit
konkreten Änderungen und Erfolgskriterien.

Antworte auf Deutsch. Code, Bezeichner und Commit-Nachrichten sind Englisch.

## Einstieg

Wurde ein Planpfad genannt, arbeite direkt damit. Sonst sieh in `docs/agents/plans/`
nach den neuesten Plänen. Findest du keinen, frage nach dem Pfad.

Wenn du einen Plan hast:

- Lies ihn vollständig und achte auf vorhandene Haken (`- [x]`).
- Lies alle im Plan genannten Dateien.
- **Lies Dateien immer ganz** — nie mit `limit`/`offset`. Du brauchst den vollständigen
  Zusammenhang.
- **Lies bei fachlichen Änderungen den Skill `architecture`**, bevor du Code entwirfst.
  Die dortigen Vorgaben zu Schichten, Bausteinen und Abhängigkeitsrichtung sind
  verbindlich und gehen einer bequemeren Umsetzung vor.
- Denke gründlich darüber nach, wie die Teile zusammenspielen.
- Beginne mit der Umsetzung, sobald du verstanden hast, was zu tun ist.

## Fortschritt festhalten

Die Plandatei ist zugleich der Zustandsspeicher. Aktualisiere die Haken **sofort** nach
jeder Aufgabe, nicht gesammelt am Ende:

- `[ ]` — noch nicht begonnen
- `[-]` — in Arbeit (setze das **bevor** du anfängst)
- `[x]` — erledigt (direkt **nachdem** die Aufgabe erfolgreich getestet wurde)

Manuelle Verifikationsschritte werden erst nach der Bestätigung des Nutzers abgehakt.

Nutze diese Haken statt einer separaten Aufgabenliste.

## Haltung bei der Umsetzung

Pläne sind sorgfältig entworfen, die Wirklichkeit ist unordentlich. Deine Aufgabe:

- der Absicht des Plans folgen und dich dabei an das anpassen, was du vorfindest
- jede Phase vollständig abschliessen, bevor die nächste beginnt
- prüfen, ob deine Arbeit im Gesamtzusammenhang des Codes Sinn ergibt

Weicht die Wirklichkeit vom Plan ab:

- **Halt an** und denke gründlich darüber nach, warum der Plan so nicht funktioniert.
- Stelle das Problem klar dar:

```text
Problem in Phase [N]:
Erwartet: [was der Plan sagt]
Vorgefunden: [tatsächliche Lage]
Warum das zählt: [Erklärung]

Wie soll ich vorgehen?
```

## Verifikation

Nach jeder Phase:

- Führe die im Plan genannten Erfolgskriterien aus (Tests, Linter, Typprüfungen).
- Bring Fehler in Ordnung, bevor du weitergehst.
- Gibt es **manuelle** Verifikationsschritte, halte an und melde:

```text
Phase [N] abgeschlossen - bereit zur manuellen Prüfung

Automatisiert geprüft und grün:
- [Liste der bestandenen Prüfungen]

Bitte prüfe manuell:
- [Punkte aus dem Plan]

Sag Bescheid, wenn die manuelle Prüfung durch ist, dann mache ich mit Phase [N+1] weiter.
```

- Danach mit der nächsten Phase fortfahren, sofern nichts anderes gesagt wird.

Sind alle Phasen fertig, fasse das Ergebnis zur Abnahme zusammen.

## Wenn du feststeckst

- Vergewissere dich zuerst, dass du den relevanten Code wirklich gelesen und verstanden
  hast.
- Bedenke, dass sich der Code seit dem Schreiben des Plans verändert haben kann.
- Stelle den Widerspruch klar dar und frage nach.

Setze Subagenten sparsam ein — vor allem für gezieltes Debugging oder unbekanntes
Terrain.

## Arbeit fortsetzen

Enthält der Plan bereits Haken:

- Vertraue darauf, dass Erledigtes erledigt ist.
- Mach beim ersten offenen Punkt weiter.
- Prüfe frühere Arbeit nur nach, wenn etwas nicht stimmig wirkt.

## Nach der Umsetzung

Biete an, mit `/commit` zu committen. Das Gate dort (Format, Lint, Tests,
Architekturtest, Secret-Scan, Diff-Prüfung) ist Teil der Fertigstellung, nicht ein
Schritt danach.

Du setzt eine Lösung um, nicht eine Liste von Haken. Behalte das Ziel im Blick.
