# Onion im TypeScript-Frontend (React / Vite)

Im Frontend gilt eine **abgeschwächte** Form: ein framework-freier Kern, React nur als
äussere Schale. Es werden bewusst **keine** Aggregate, Repositories und Use-Case-Klassen
im Browser nachgebaut — die fachliche Wahrheit liegt im Backend, das Frontend hält
Sichten darauf.

## Struktur

```
src/
  game/
    domain/
      scoring.ts          reine Funktionen, kein React-Import
      gameState.ts        Zustandsübergänge als reine Funktionen
      scoring.test.ts
    api/
      gameClient.ts       fetch hinter einem Interface
      gameClient.types.ts
    ui/
      GameBoard.tsx       nur Darstellung
      useGame.ts          verbindet ui und domain
  shared/
    ui/
    domain/
  main.tsx
```

## Die Regel

Keine Datei unter `domain/` importiert `react`, `react-dom`, `@tanstack/*`, `axios` oder
sonst ein Framework. Sie enthält reine Funktionen: Eingabe rein, Ergebnis raus, keine
Seiteneffekte.

```ts
export function calculateScore(recordedThrows: readonly Throw[]): Score {
  return recordedThrows.reduce((total, thrown) => total + thrown.pins, 0) as Score;
}

export function isFinished(game: Game): boolean {
  return game.recordedThrows.length === MAXIMUM_THROWS;
}
```

Damit sind diese Tests reine Vitest-Aufrufe ohne Rendering und laufen in Millisekunden.

## Komponenten enthalten keine Regeln

```tsx
export function GameBoard({ game }: { game: Game }) {
  const score = calculateScore(game.recordedThrows);
  return <ScoreDisplay score={score} finished={isFinished(game)} />;
}
```

Steht in einer Komponente eine fachliche Bedingung, wandert sie als benannte Funktion
nach `domain/`. Die Komponente fragt sie nur noch ab — das ist zugleich der Grund,
warum kein Kommentar nötig ist.

## Zugriff auf das Backend hinter einem Interface

```ts
export interface GameClient {
  load(id: GameId): Promise<Game>;
  recordThrow(id: GameId, thrown: Throw): Promise<Game>;
}
```

Die konkrete `fetch`-Implementierung liegt daneben. Im Test wird das Interface durch
eine einfache Objektliteral-Implementierung ersetzt, nicht durch einen Mock des
Netzwerks.

## Grenze durchsetzen

Die Regel wird maschinell geprüft, nicht durch Disziplin. Eine ESLint-Regel je Projekt:

```js
{
  files: ['src/**/domain/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: ['react', 'react-dom', '@tanstack/*', 'axios', '../ui/*', '../api/*'],
    }],
  },
}
```

Alternativ `dependency-cruiser` mit einer Regel, die Kanten von `domain` nach `ui` und
`api` verbietet. Was gewählt wird, hält `.claude/projekt.md` im Feld `Lint` fest.

## Werkzeuge

| Zweck | Werkzeug |
|---|---|
| Formatierung | Prettier |
| Lint und Grenzen | ESLint mit `no-restricted-imports` |
| Tests | Vitest |
| Komponententests | Testing Library, sparsam |
| End-to-End | Playwright, nur für zentrale Abläufe |
