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

- Firebase Projekt-Id
  mahlzeiten-planer-ecd26 
- 

## Firebase absichern

Der `apiKey` in `src/shared/auth/firebaseConfig.ts` ist oeffentlich — das ist bei
Firebase so vorgesehen. Er ist kein Geheimnis, sondern nur die Projektadresse. Den
Zugriff begrenzen zwei Einstellungen:

1. **Selbstregistrierung aus** — Firebase-Konsole → Authentication → Settings →
   User actions → Haken bei *Erstellen (Registrierung) aktivieren* entfernen.
   Das Haushaltskonto besteht bereits, registriert wird nichts mehr. Ohne diesen
   Haken kann sich jeder mit dem oeffentlichen `apiKey` ein Konto im Projekt anlegen.
   Nachpruefen laesst sich das ohne Konsole, die Antwort muss
   `ADMIN_ONLY_OPERATION` lauten:

   ```
   curl -X POST -H "Content-Type: application/json" -d '{"email":"probe@example.com","password":"egal-was"}' "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=<apiKey>"
   ```

   Steht in der Antwort stattdessen ein `idToken`, ist die Registrierung offen — und
   die Probe hat gerade selbst ein Konto angelegt, das wieder weg muss.
2. **Regeln auf den Haushalt festgenagelt** — `firestore.rules` gibt Lesen und
   Schreiben nur der einen Haushalts-UID frei. Ein fremdes Konto koennte also auch
   ohne Schritt 1 keine Daten sehen. `npm run test:rules` prueft das.
