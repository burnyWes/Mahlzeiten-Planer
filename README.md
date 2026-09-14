# Mahlzeiten-Planer

Private Anwendung zur Planung von Mahlzeiten.

Ein Stack ist noch nicht festgelegt, es existiert noch kein Quellcode.

## Arbeitsweise

Die Dauerregeln stehen in [CLAUDE.md](CLAUDE.md), die projektspezifischen Angaben in
[.claude/projekt.md](.claude/projekt.md). Offene Punkte und Bugs stehen in
[docs/notes.txt](docs/notes.txt).

## Ablauf

```
/rpi-research <Frage>       Bestehendes verstehen        -> docs/agents/research/
/rpi-plan <Vorhaben>        Plan erstellen               -> docs/agents/plans/
/rpi-implement <Plan>       Plan Phase fuer Phase umsetzen
/commit                     Format, Lint, Tests, Architektur, Secrets -> Commit
```

`/grill-me <Vorhaben>` nimmt einen Entwurf vorab auseinander.

## Eckdaten

| Feld   | Wert              |
|--------|-------------------|
| Kuerzel | `MZP` — Praefix der Story-Nummern (`MZP-007`) |
| Bauart | `onion` — Domain-Driven Design mit Onion-Architektur |
