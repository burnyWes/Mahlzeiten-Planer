# Onion in Java / Kotlin mit Gradle

## Paketstruktur

```
src/main/java/<basispaket>/
  game/
    domain/
      Game.java
      GameId.java
      Score.java
      GameRepository.java
    application/
      RecordThrow.java
    infrastructure/
      persistence/
        GameEntity.java
        GameJpaRepository.java
        GameRepositoryAdapter.java
      web/
        GameController.java
        GameResponse.java
  shared/
    domain/
```

## Value Objects als Records

```java
public record Score(int value) {
    public Score {
        if (value < 0) {
            throw new IllegalArgumentException("score must not be negative");
        }
    }

    public Score plus(Score other) {
        return new Score(value + other.value);
    }
}
```

Records geben Unveränderlichkeit, Wertgleichheit und einen kompakten Konstruktor für die
Validierung. Die Validierung im Konstruktor ersetzt jede Prüfung weiter aussen.

## Aggregat mit Verhalten statt Settern

```java
public final class Game {
    private final GameId id;
    private final List<Throw> recordedThrows;

    public void recordThrow(Throw thrown) {
        if (isFinished()) {
            throw new GameAlreadyFinishedException(id);
        }
        recordedThrows.add(thrown);
    }

    public boolean isFinished() {
        return recordedThrows.size() == MAXIMUM_THROWS;
    }
}
```

Keine Setter, keine öffentliche Liste nach aussen. Der Name der Methode ist die
Dokumentation.

## Port in der Domäne

```java
public interface GameRepository {
    Optional<Game> findById(GameId id);
    void save(Game game);
}
```

Kein `Page`, kein `Sort`, kein `Iterable` aus Spring. Nur Domänentypen.

## Persistenz getrennt halten

`domain/Game` und `infrastructure/persistence/GameEntity` sind **zwei** Klassen. Die
JPA-Annotationen sitzen ausschliesslich an der Entity, das Mapping im Adapter. Das ist
der Preis dafür, dass die Domäne testbar und framework-frei bleibt — und der Grund,
warum die Domänentests in Millisekunden laufen.

## Architekturtest mit ArchUnit

```java
@AnalyzeClasses(packages = "<basispaket>", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule domain_depends_on_nothing_outside =
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..application..", "..infrastructure..");

    @ArchTest
    static final ArchRule domain_is_framework_free =
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage(
                "org.springframework..",
                "jakarta.persistence..",
                "com.fasterxml.jackson..");

    @ArchTest
    static final ArchRule application_does_not_know_infrastructure =
        noClasses().that().resideInAPackage("..application..")
            .should().dependOnClassesThat()
            .resideInAPackage("..infrastructure..");

    @ArchTest
    static final ArchRule contexts_are_isolated =
        slices().matching("<basispaket>.(*)..")
            .should().notDependOnEachOther()
            .ignoreDependency(alwaysTrue(), resideInAPackage("..shared.."));
}
```

Die letzte Regel hält Bounded Contexts getrennt und ist erst sinnvoll, wenn es mehr als
einen Kontext gibt. Bis dahin auskommentieren ist verboten — dann gehört sie schlicht
noch nicht hinzugefügt.

## Werkzeuge

| Zweck | Werkzeug | Gradle-Aufruf |
|---|---|---|
| Formatierung | Spotless | `spotlessApply` / `spotlessCheck` |
| Statische Analyse | Error Prone oder PMD | Teil von `check` |
| Architektur | ArchUnit | Teil von `test` |
| Tests | JUnit 5 + AssertJ | `test` |
| Integration | Testcontainers | `test` |

Die Versionen werden beim Projektstart nachgeschlagen, nicht aus diesem Dokument
übernommen.

## Testfakes statt Mocks

```java
final class InMemoryGameRepository implements GameRepository {
    private final Map<GameId, Game> games = new HashMap<>();

    @Override public Optional<Game> findById(GameId id) {
        return Optional.ofNullable(games.get(id));
    }

    @Override public void save(Game game) {
        games.put(game.id(), game);
    }
}
```

Ein Fake je Port, im Testverzeichnis neben der Schicht, die ihn braucht. Er wird
wiederverwendet und macht die Tests lesbar, weil kein Verhalten pro Test aufgebaut wird.
