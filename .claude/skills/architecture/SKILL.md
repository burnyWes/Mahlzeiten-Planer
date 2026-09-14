---
name: architecture
description: Verbindliche Architekturvorgaben des Projekts - Domain-Driven Design mit Onion-Architektur, Schichten, Abhängigkeitsregeln, Bausteine, Ordnerstruktur und Anti-Patterns. Lies diesen Skill, bevor du fachlichen Code entwirfst, neu anlegst oder umbaust, und immer wenn es um Schichten, Domäne, Aggregate, Ports, Repositories, Use Cases, Adapter oder um die Frage geht, wohin eine Klasse gehört. Deutsche Auslöser - Architektur, Schichten, Domäne, Fachlichkeit, Aggregat, wo gehört das hin. Englische Auslöser - architecture, layer, domain, aggregate, port, adapter, use case, bounded context.
---

# Architektur

Antworte auf Deutsch. Code und Bezeichner sind Englisch.

## Zuerst: Bauart prüfen

Lies `Bauart` aus `.claude/projekt.md`.

- `onion` → dieser Skill gilt vollständig.
- `schlank` → nur der Abschnitt *Bauart schlank* am Ende gilt. Alles davor ist optional.

## Die eine Regel

Abhängigkeiten zeigen **immer nach innen**.

```
        infrastructure          kennt application und domain
              |
              v
         application            kennt domain
              |
              v
           domain               kennt nichts ausser sich selbst
```

`domain` enthält keinen einzigen Import aus `application` oder `infrastructure` und
keinen Import eines Frameworks, einer Datenbank-, HTTP- oder Serialisierungsbibliothek.
Diese Regel wird durch einen Architekturtest abgesichert, nicht durch Disziplin.

Braucht die Domäne etwas von aussen, definiert **sie selbst** das Interface (den Port)
und die Infrastruktur implementiert es. Damit dreht sich die Abhängigkeit um.

## Ordnerstruktur

Oberste Gliederung ist der fachliche Kontext, darunter erst die Schicht.

```
<basispaket>/
  game/                          Bounded Context
    domain/
      Game.java                  Aggregate Root
      Score.java                 Value Object
      GameRepository.java        Port (Interface, von der Domäne definiert)
    application/
      RecordThrow.java           Use Case
    infrastructure/
      GameJpaRepository.java     Adapter (implementiert den Port)
      GameController.java        Adapter (Transport)
  member/                        weiterer Bounded Context
    domain/ application/ infrastructure/
  shared/
    domain/                      nur wirklich kontextübergreifende Value Objects
```

Ein neues Projekt startet mit **einem** Kontext. Ein zweiter entsteht erst, wenn ein
Begriff in zwei Bereichen nachweislich Verschiedenes bedeutet — nicht vorsorglich.

`shared/` ist kein Ablageort für Übriggebliebenes. Was dort landet, muss in jedem
Kontext dieselbe Bedeutung haben (Geldbetrag, Zeitraum). Fachliche Begriffe gehören
niemals dorthin.

## Bausteine

| Baustein | Schicht | Aufgabe | Erkennungsmerkmal |
|---|---|---|---|
| Value Object | domain | beschreibt etwas ohne eigene Identität | unveränderlich, Gleichheit über Werte, validiert sich im Konstruktor |
| Entity | domain | etwas mit Identität über die Zeit | hat eine ID, Gleichheit über die ID |
| Aggregate Root | domain | Konsistenzgrenze, einziger Zugriffspunkt | schützt Invarianten, von aussen nur über die Wurzel erreichbar |
| Domain Service | domain | Fachlogik, die zu keinem Aggregat gehört | zustandslos, nur Domänentypen in Signatur |
| Port | domain | benötigte Fähigkeit von aussen | Interface in `domain`, Implementierung in `infrastructure` |
| Use Case | application | orchestriert einen fachlichen Ablauf | lädt, ruft Domäne auf, speichert; enthält selbst keine Regeln |
| Adapter | infrastructure | verbindet mit Technik | implementiert einen Port oder ruft einen Use Case auf |

### Value Objects statt primitiver Typen

Fachliche Werte bekommen einen eigenen Typ. `String email` ist kein Typ, `Email` ist
einer — und validiert sich selbst genau einmal, an der Grenze.

Das ist zugleich der wirksamste Weg zu kommentarfreiem Code: `deposit(Money amount)` ist
eindeutig, `deposit(long value)` verlangt eine Erklärung.

### Aggregate klein halten

Ein Aggregat umfasst nur, was in **einer** Transaktion konsistent sein muss. Alles andere
wird per ID referenziert, nicht per Objekt. Grosse Objektgraphen sind das häufigste
Anzeichen eines falschen Schnitts.

### Invarianten leben in der Domäne

Ein Aggregat darf nie in einem ungültigen Zustand existieren. Prüfungen gehören in
Konstruktor und Methoden des Aggregats, nicht in den Use Case und nicht in den
Controller. Ein Use Case, der fachliche Bedingungen prüft, hat Logik aus der Domäne
herausgezogen.

## Anti-Patterns

| Anti-Pattern | Woran erkennbar | Stattdessen |
|---|---|---|
| Anämisches Modell | Domänenklassen haben nur Getter/Setter, die Logik steckt im Service | Verhalten zum Zustand ziehen |
| Framework in der Domäne | `@Entity`, `@JsonProperty`, `@Component` in `domain/` | eigene Persistenz-/Transportmodelle in `infrastructure`, Mapping am Rand |
| Repository liefert Technik | Rückgabe von JPA-Entities, `Page`, `ResultSet` | Port gibt Domänentypen zurück |
| Use Case mit Fachregeln | `if` über fachliche Bedingungen im Application-Service | Regel ins Aggregat verschieben |
| Durchgereichte Datenklasse | dieselbe Klasse vom Controller bis zur Datenbank | getrennte Modelle je Schicht |
| Vorsorgliche Kontexte | fünf Kontexte am ersten Tag | mit einem starten, bei nachgewiesener Mehrdeutigkeit teilen |
| Setter am Aggregat | `game.setScore(...)` | fachliche Methode `game.recordThrow(...)` |

## Tests

- `domain` und `application`: test-getrieben, reines Unit-Testing, **kein Framework und
  kein Mockito**. Ports werden durch handgeschriebene In-Memory-Fakes ersetzt,
  die im Testverzeichnis liegen und wiederverwendet werden.
- Muss in `domain` oder `application` gemockt werden, ist das ein Befund über den
  Schnitt, keine Testfrage.
- `infrastructure`: ein Integrationstest je Adapter gegen echte Technik. Keine Tests für
  reine Verdrahtung.
- **Architekturtest**: prüft die Abhängigkeitsrichtung maschinell und läuft als
  normaler Test mit. Er ist verbindlicher Teil jedes `onion`-Projekts.

## Stack-Details

- Java/Kotlin mit Gradle: `references/java.md`
- TypeScript-Frontend (React/Vite): `references/typescript.md`

## Vorgehen bei neuem fachlichem Code

1. Fachbegriff benennen — in der Sprache der Fachlichkeit, dann ins Englische übersetzt.
2. Kontext bestimmen: bestehender Kontext oder begründet ein neuer.
3. Entscheiden: Value Object, Entity oder Aggregat.
4. Invarianten benennen und als Test formulieren, bevor Code entsteht.
5. Nötige Aussenwelt als Port in `domain` definieren.
6. Use Case schreiben, der nur orchestriert.
7. Adapter zuletzt.

Passt etwas nicht in dieses Raster, ist das ein Gesprächsanlass — nicht der Moment, die
Regel still zu umgehen.

## Bauart schlank

Gilt, wenn `Bauart: schlank` in `.claude/projekt.md` steht. Dann entfallen die
Schichtpflicht, die Kontextgliederung und der Architekturtest. Unverändert gültig
bleiben:

- sprechender Code ohne Kommentare
- eigene Typen statt durchgereichter primitiver Werte, wo es die Lesbarkeit trägt
- Tests für alles, was Regeln enthält
- klar getrennte Module: Ein-/Ausgabe getrennt von der Berechnung, damit die Berechnung
  ohne Umgebung testbar bleibt
