# Projekt

> Diese Datei wird von `/setup` ausgefüllt und ist der **einzige** projektspezifische
> Ort. `CLAUDE.md` und die Skills bleiben unverändert und können aus dem Template
> aktualisiert werden, ohne dass hier etwas verloren geht.

Name:    Mahlzeiten-Planer
Kürzel:  MZP
Stack:   <noch nicht gesetzt>
Bauart:  onion

## Befehle

Test:    -
Lint:    -
Format:  -
Build:   -

## Fachliche Kontexte

<noch keine>

---

### Feldbedeutungen

- **Kürzel** — 2 bis 5 Großbuchstaben. Präfix der Story-Nummern (`KEG-007`) in Plänen
  und Commit-Nachrichten.
- **Bauart**
  - `onion` — Domain-Driven Design mit Onion-Architektur, Schichtung verbindlich,
    Architekturtest im Commit-Gate. Standard für alles mit echter Fachlichkeit.
  - `schlank` — für Werkzeuge, Skripte und Prototypen. Keine Schichtpflicht, kein
    Architekturtest. Sprechender Code, keine Kommentare, Tests und saubere
    Modulgrenzen gelten unverändert weiter.
- **Befehle** — werden von `commit` genutzt. Ein Feld auf `-` setzen, wenn es den
  Schritt im Projekt nicht gibt; der Skill überspringt ihn dann kommentarlos.
  Mehrere Befehle je Feld durch ` && ` trennen (z. B. Backend und Frontend).
- **Fachliche Kontexte** — die Bounded Contexts des Projekts mit je einem Satz. Wächst
  mit dem Projekt und dient als Landkarte für Planung und Research.
