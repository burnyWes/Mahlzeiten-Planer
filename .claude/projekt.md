# Projekt

> Diese Datei wird von `/setup` ausgefüllt und ist der **einzige** projektspezifische
> Ort. `CLAUDE.md` und die Skills bleiben unverändert und können aus dem Template
> aktualisiert werden, ohne dass hier etwas verloren geht.

Name:    Mahlzeiten-Planer
Kürzel:  MZP
Stack:   TypeScript, React 19, Vite 8, vite-plugin-pwa, Firebase/Firestore, GitHub Pages
Bauart:  onion

## Befehle

Test:    npm run test
Lint:    npm run lint
Format:  npm run format
Build:   npm run build

## Fachliche Kontexte

- **shopping** — die gemeinsame Einkaufsliste des Haushalts: Artikel anlegen, abhaken
  und aufraeumen.
- **meals** — die Gerichte des Haushalts: anlegen, nachschlagen, auf die
  Einkaufsliste uebertragen und als Vorrat vorhalten.

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
