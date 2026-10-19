---
date: 2026-10-19T06:29:10.934690+00:00
git_commit: 538fd794f8a803017003f8dc1b822f07c9387fe1
branch: main
story: MZP-040
topic: "Mengen-Spinner in den Formularen"
tags: [plan, shopping, meals, quantity, supply, ui, voiceover]
status: ready
---

# PLAN: MZP-040 — Mengen-Spinner in den Formularen

Eine Menge anzugeben ist heute umständlich, sowohl für einen Artikel als auch für einen
Vorrat. Jedes Mengenfeld in einem Formular bekommt deshalb rechts daneben einen Spinner
aus zwei übereinanderliegenden Pfeiltasten ▲/▼. VoiceOver kann ihn per Wischen nach
oben oder unten bedienen. Zugleich verschwindet das „13“-Problem in „Vorrat
hinzufügen“: Wer ins Feld tippt und `3` eingibt, bekam bisher `13`, weil schon `1`
drinstand.

Ausdrücklich **nicht** betroffen sind die Einkaufsliste selbst, die Vorräte-Übersicht
und die Zeitraum-Seite. Ihr `Stepper` `[−] Wert [+]` bleibt unverändert.

Alle Entscheidungen stammen aus der Befragung vom 2026-10-19. Vorbild ist der
`SpinButton` aus dem Schwesterprojekt `..\Mental-Unloader`
(`src/shared/ui/SpinButton.tsx`, `src/tasks/ui/DeadlineStepper.tsx`).

## Akzeptanzkriterien

- „Artikel hinzufügen“ (Einkauf) und das Artikel-Formular eines Gerichts zeigen
  `|Menge-Textfeld| |▲▼| |Einheit-Textfeld|` nebeneinander. „Vorrat hinzufügen“ und
  „Vorrat bearbeiten“ zeigen `|Menge-Textfeld| |▲▼|`.
- ▲ und ▼ liegen übereinander, sind je mindestens 44×44 px groß und lassen sich
  antippen. Dabei bleibt der Fokus, wo er ist; eine offene Tastatur bleibt offen.
- VoiceOver erreicht den Spinner als **genau ein** Element: „Menge ändern, 3,
  anpassbar“. Wischen nach oben/unten (Pfeil ↑/↓) ändert den Wert im Textfeld um 1.
  ▲/▼ sind für VoiceOver unsichtbar.
- Schrittregeln bei Artikeln:

  ```
  Feld vorher   ▲          ▼
  ───────────   ────────   ────────
  (leer)        2          –           leer gilt als 1
  1             2          –           Untergrenze 1
  2,5           3,5        1,5         Schritt 1, Nachkommastellen bleiben
  1,5           2,5        –           ▼ würde unter 1 fallen
  9999          –          9998        Obergrenze 9999
  "viel"        –          –           kein lesbarer Wert
  ```

  Geschrieben wird mit Komma und auf 6 Nachkommastellen gerundet. Die Einheit bleibt
  unberührt.
- Schrittregeln bei Vorräten: ganze Zahlen von 1 bis 99, leer gilt als 1. Was keine
  gültige Anzahl ist (`viele`, `2,5`, `120`), lässt der Spinner unverändert.
- Ein leeres Mengenfeld zeigt in allen vier Formularen eine graue `1` als Platzhalter.
- „Vorrat hinzufügen“ startet mit leerem Feld. Leer gespeichert ergibt 1 Portion, wer
  `3` tippt, bekommt 3.
- „Vorrat bearbeiten“ zeigt den Bestand weiter als echten Wert im Feld. Leer speichern
  bleibt ein Fehler wie heute.
- Wischen löst keine eigene Live-Region-Ansage aus; VoiceOver sagt den neuen Wert selbst
  an.

## Wesentliche Entscheidungen und Abwägungen

1. **Der Spinner ist ein einziges `role="spinbutton"`:** Er ist dem `SpinButton` aus
   dem Mental-Unloader nachgebaut. ▲/▼ liegen *innerhalb* dieses Elements, tragen
   `aria-hidden` und `tabIndex={-1}`, und ein `preventDefault` auf `pointerdown` hält
   den Fokus fest.
   - Warum: Safari unter iOS behandelt ein ARIA-`spinbutton` als „anpassbar“ und
     wandelt das Wischen in synthetische Pfeiltasten um. Im Mental-Unloader ist das
     am iPhone erprobt. `<input type="number">` dagegen gilt für VoiceOver nur als
     Textfeld.
   - Auswirkung: Es entstehen die neuen Bausteine `src/shared/ui/SpinButton.tsx` und
     `src/shared/ui/AmountSpinner.tsx`. Der bestehende `Stepper` bleibt.
     Weil ▲/▼ im Element liegen, deckt der VoiceOver-Rahmen beide Pfeile ab.
2. **Name „Menge ändern“, der Wert kommt aus dem Textfeld:** `aria-label="Menge
   ändern"`. `aria-valuetext` ist der Feldtext, bei leerem Feld `1`.
   - Warum: Das hält den Spinner vom Textfeld „Menge“ unterscheidbar. `valuetext`
     verhindert die Prozentansage (WebKit-Bug 221102) und lässt VoiceOver „2,5“
     deutsch lesen.
   - Auswirkung: Den Wert hält allein das Textfeld. Der Spinner schreibt nur
     dorthin, einen eigenen Zustand hat er nicht. Die E2E-Tests mit
     `getByLabel('Menge', { exact: true })` bleiben eindeutig.
3. **Die Schrittlogik liegt in der Domäne und wird test-getrieben gebaut:**
   `stepWrittenAmount` kommt in `src/shared/domain/quantity.ts`, `stepWrittenCount` in
   `src/meals/domain/supply.ts`. Beide liefern den neuen Text oder `null`, wenn kein
   Schritt möglich ist.
   - Warum: Grenzen, „leer = 1“ und die Rundung sind Fachregeln, keine Oberfläche.
   - Auswirkung: `MAXIMUM_STEPPED_AMOUNT` und das Runden wandern von
     `shopping/domain/shoppingItem.ts` nach `shared/domain/quantity.ts`, weil `meals`
     nicht aus `shopping` importieren darf.
4. **Das „13“-Problem löst ein leerer Start mit Platzhalter:** „Vorrat hinzufügen“
   startet leer, und `createSupply` liest ein leeres Feld als 1. „Vorrat bearbeiten“
   bleibt beim Tippen wie heute.
   - Warum: So hat es der Nutzer entschieden, und es passt zu „leer = 1“ auf der
     Einkaufsliste.
   - Auswirkung: `recountedSupply` bleibt streng, nur `createSupply` wird nachsichtig.
5. **Der Platzhalter „1“ steht auch bei den Artikeln:** Er ist rein sichtbar. Ein
   leeres Feld bleibt fachlich „keine Menge“ (`readQuantity` → `null`).
   - Warum: Auf der Einkaufsliste gilt „keine Menge“ ohnehin als 1
     (`orOneWithoutUnit`), und so zählt der Spinner auch.
   - Auswirkung: Das Speichern der Artikel ändert sich nicht.
6. **Keine eigene Ansage beim Wischen.**
   - Warum: VoiceOver sagt den geänderten Wert eines `spinbutton` selbst an. Eine
     Live-Region würde ihn doppelt sprechen.
   - Auswirkung: Am Gerät wird geprüft, dass der Wert genau einmal angesagt wird.

## Ausgangslage

Vier Formulare haben ein Mengenfeld:

```
Formular                        Datei                                   Wert         Regel
──────────────────────────────  ──────────────────────────────────────  ───────────  ─────────────────────
Artikel hinzufügen (Einkauf)    src/shopping/ui/AddItemPage.tsx:89      draft.amount readQuantity, Dezimal
Artikel eines Gerichts          src/meals/ui/MealItemsEditor.tsx:131    draft.amount readQuantity, Dezimal
Vorrat hinzufügen               src/meals/ui/AddSupplyPage.tsx:90       draft.count  readCount 1–99, Start "1"
Vorrat bearbeiten               src/meals/ui/SupplyPage.tsx:51          written      readCount 1–99
```

Heute (Artikel):

```
 Menge        Einheit
┌──────┐    ┌──────────┐
│      │    │          │
└──────┘    └──────────┘
```

Heute (Vorrat hinzufügen):

```
 Menge
┌──────┐
│ 1    │    ← echter Wert; Doppeltipp setzt den Cursor dahinter → "13"
└──────┘
```

- `readQuantity` (`src/shared/domain/quantity.ts:47`): leer heißt `null`, eine Einheit
  ohne Menge ist ein Fehler.
- `readCount` (`src/meals/domain/supply.ts:37`): leer heißt `countNotANumber`,
  Obergrenze `MAXIMUM_COUNT = 99`.
- Der Stepper der Einkaufsliste (`src/shopping/domain/shoppingItem.ts:112-145`) kennt
  schon `MAXIMUM_STEPPED_AMOUNT = 9999` und `roundedAmount` (6 Nachkommastellen).

## Zielbild

Artikel (Einkauf und Gericht):

```
 Menge              Einheit
┌──────┐ ┌───┐    ┌──────────┐
│  1   │ │ ▲ │    │          │     "1" grau = Platzhalter
└──────┘ ├───┤    └──────────┘
         │ ▼ │
         └───┘
```

Vorrat hinzufügen / bearbeiten:

```
 Menge
┌──────┐ ┌───┐
│  1   │ │ ▲ │        hinzufügen: leer mit grauer "1"
└──────┘ ├───┤        bearbeiten: Bestand als echter Wert, z. B. "3"
         │ ▼ │
         └───┘
```

VoiceOver-Reihenfolge:

```
"Menge, Textfeld, 1"  →  "Menge ändern, 1, anpassbar"  →  "Einheit, Textfeld"
                          ↑ wischen ↑ / ↓ wischen ↓
                          "2" … "3" … (Wert steht sofort im Textfeld)
```

Datenfluss:

```
 Textfeld (string) ──value──▶ AmountSpinner ──valueText/valueNow──▶ role="spinbutton"
        ▲                          │
        │                          │ onStep(+1 | -1)  ◀── ↑/↓-Taste (VoiceOver-Wischen)
        │                          ▼                  ◀── Tippen auf ▲/▼
        └──── setze Text ◀── stepWrittenAmount / stepWrittenCount (Domäne)
                              null → nichts tun
```

## Abstraktionen und Wiederverwendung

- `src/shared/domain`
  - `quantity.ts` — bekommt die Schrittlogik für Artikelmengen
    - `AmountStep` — neuer Typ `1 | -1`
    - `MAXIMUM_STEPPED_AMOUNT` — kommt aus `shoppingItem.ts` hierher
    - `roundedAmount` — kommt aus `shoppingItem.ts` hierher und wird exportiert
    - `readSteppedAmount(written)` — `number | null`: leer → 1, lesbar und > 0 → Zahl,
      sonst `null`
    - `stepWrittenAmount(written, step)` — `string | null`: der neue Text mit Komma oder
      `null`, wenn der Schritt aus 1…9999 hinausführt oder der Text unlesbar ist
  - `quantity.test.ts` — neue Fälle (Tabelle aus den Akzeptanzkriterien)
- `src/shopping/domain`
  - `shoppingItem.ts` — importiert `MAXIMUM_STEPPED_AMOUNT` und `roundedAmount` aus
    `shared`; das Verhalten bleibt gleich
- `src/meals/domain`
  - `supply.ts`
    - `createSupply` — leer → 1
    - `readSteppedCount(written)` — `number | null`: leer → 1, gültige Anzahl → Zahl,
      sonst `null`
    - `stepWrittenCount(written, step)` — `string | null`, Grenzen 1 und `MAXIMUM_COUNT`
  - `supply.test.ts` — `refuses an empty count` wird zu „takes an empty count as one“;
    `recountedSupply` lehnt leer weiter ab (neuer Testfall)
- `src/shared/ui`
  - `SpinButton.tsx` — neu, nach dem Mental-Unloader: `role="spinbutton"`,
    `tabIndex={0}`, `aria-label`, `aria-valuenow` (optional), `aria-valuemin`,
    `aria-valuemax`, `aria-valuetext`; ↑ → `onStep(1)`, ↓ → `onStep(-1)` mit
    `preventDefault`
  - `SpinButton.test.tsx` — neu, nach dem Vorbild aus dem Mental-Unloader
  - `AmountSpinner.tsx` — neu: `SpinButton` namens „Menge ändern“ mit ▲ und ▼ darin
    (`aria-hidden`, `tabIndex={-1}`, `onPointerDown` → `preventDefault`)
  - `AmountSpinner.test.tsx` — neu: Name „Menge ändern“, ▲/▼ rufen `onStep`, ▲/▼
    sind verborgen und verhindern `pointerdown`
- `src/index.css` — `.quantityFields` richtet unten aus; neue Klassen `.amountSpinner`
  und `.spinArrow`; Platzhalterfarbe für Eingabefelder
- `docs/architektur/05-bausteinsicht.md` — `SpinButton · AmountSpinner` in die beiden
  Aufzählungen von `shared/ui` (Zeilen 90 und 208)

Grobe Gestalt des `AmountSpinner`:

```tsx
type AmountSpinnerProps = {
  valueText: string
  value: number | null
  minimum: number
  maximum: number
  onStep: (step: AmountStep) => void
}

export function AmountSpinner({ valueText, value, minimum, maximum, onStep }: AmountSpinnerProps) {
  return (
    <SpinButton
      label="Menge ändern"
      className="amountSpinner"
      value={value}
      minimum={minimum}
      maximum={maximum}
      valueText={valueText}
      onStep={onStep}
    >
      <SpinArrow symbol="▲" onPress={() => onStep(1)} />
      <SpinArrow symbol="▼" onPress={() => onStep(-1)} />
    </SpinButton>
  )
}
```

Verwendung in einem Formular, als Beispiel `AddItemPage`:

```tsx
function stepAmount(step: AmountStep) {
  const stepped = stepWrittenAmount(draft.amount, step)
  if (stepped !== null) change({ amount: stepped })
}
// …
<AmountSpinner
  valueText={spokenAmount(draft.amount)}
  value={readSteppedAmount(draft.amount)}
  minimum={1}
  maximum={MAXIMUM_STEPPED_AMOUNT}
  onStep={stepAmount}
/>
```

Den Text bei leerem Feld berechnet die Domäne, damit die vier Formulare ihn nicht je
selbst bilden: `spokenAmount(written)` in `quantity.ts` (leer → `'1'`, sonst der
getrimmte Text). Bei Vorräten wird sie wiederverwendet; der Platzhalter ist in beiden
Kontexten dieselbe `1`.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Spinner bei den Vorräten

Abhängigkeiten: keine

„Vorrat hinzufügen“ und „Vorrat bearbeiten“ bekommen den Spinner, und „Vorrat
hinzufügen“ startet leer mit der grauen `1`. Nach dieser Phase wird am iPhone geprüft,
ob das VoiceOver-Wischen trägt, bevor die Artikel folgen.

**Aufgaben**:
- [x] `src/shared/domain/quantity.ts`: `AmountStep` und `spokenAmount` test-getrieben
      anlegen (`quantity.test.ts`).
- [x] `src/meals/domain/supply.ts` test-getrieben (`supply.test.ts`):
  - [x] `createSupply` nimmt eine leere oder nur aus Leerzeichen bestehende Anzahl als
        1; der Test `refuses an empty count` wird entsprechend umgeschrieben.
  - [x] `recountedSupply` lehnt eine leere Anzahl weiter mit `countNotANumber` ab
        (neuer Testfall, hält das heutige Verhalten fest).
  - [x] `readSteppedCount`: leer → 1, `'5'` → 5, `'viele'`/`'2,5'`/`'0'`/`'120'` →
        `null`.
  - [x] `stepWrittenCount`: `''`+1 → `'2'`, `''`−1 → `null`, `'1'`−1 → `null`,
        `'5'`+1 → `'6'`, `'5'`−1 → `'4'`, `'99'`+1 → `null`, `'98'`+1 → `'99'`,
        `'viele'`±1 → `null`, `' 3 '`+1 → `'4'`.
- [x] `src/shared/ui/SpinButton.tsx` mit `SpinButton.test.tsx` übernehmen und anpassen:
      `label` statt `labelledBy`, `className` durchreichen, `value` optional (ohne
      Wert kein `aria-valuenow`), `valueText` Pflicht. Tests: Name und Grenzen,
      `aria-valuetext`, ↑ → `1`, ↓ → `-1`, jeweils mit `preventDefault`; andere Tasten
      bleiben unbehandelt; per Tab erreichbar.
- [x] `src/shared/ui/AmountSpinner.tsx` anlegen (siehe Skizze oben). ▲/▼ sind
      `button type="button"`, `aria-hidden="true"`, `tabIndex={-1}`, `onPointerDown`
      mit `preventDefault`, `onClick` → `onStep(±1)`.
- [x] `src/index.css`:
  - [x] `.amountSpinner`: senkrechte Spalte, `gap: 0.25rem`, damit die Mitte
        (Doppeltipp-Punkt von VoiceOver) auf keinem Pfeil liegt; Rahmen in
        `--accentLine` wie im Mental-Unloader.
  - [x] `.spinArrow`: `width: 44px; height: 44px; padding: 0; line-height: 1`.
  - [x] `.quantityFields`: `align-items: flex-end`, damit Textfeld und Spinner unten
        bündig stehen.
  - [x] `input::placeholder { color: var(--disabledLine); opacity: 1; }`; wirkt im
        normalen wie im umgekehrten Farbschema über das Token.
- [x] `src/meals/ui/AddSupplyPage.tsx`: `EMPTY_DRAFT.count` wird `''`, das Feld
      bekommt `placeholder="1"`. Feld und `AmountSpinner` stehen gemeinsam in
      `div.quantityFields` (`minimum={1}`, `maximum={MAXIMUM_COUNT}`,
      `value={readSteppedCount(draft.count)}`, `valueText={spokenAmount(draft.count)}`,
      `onStep` über `stepWrittenCount`).
- [x] `src/meals/ui/SupplyPage.tsx`: genauso mit `written`, ohne Platzhalter-Änderung
      am Startwert.
- [x] `src/meals/ui/SuppliesArea.test.tsx`:
  - [x] `starts the count of a new supply at one` → das Feld ist leer,
        `placeholder` ist `'1'`.
  - [x] Neu: Leer gespeichert ergibt `supply(…, 1)`.
  - [x] Neu: Tippen von `3` in das leere Feld ergibt `supply(…, 3)` (deckt „13“ ab).
  - [x] Neu: ↑ auf `getByRole('spinbutton', { name: 'Menge ändern' })` schreibt `2`
        ins Feld; das gespeicherte Ergebnis ist 2.
  - [x] Neu: Ein Klick auf ▲ (`getByRole('button', { name: '▲', hidden: true })`)
        erhöht ebenfalls.
  - [x] Neu (in `AmountSpinner.test.tsx`): `fireEvent.pointerDown` auf ▲ und ▼ wird
        verhindert (Rückgabe `false`), damit der Fokus beim Antippen nicht springt;
        ▲/▼ sind für die Barrierefreiheit verborgen und nicht per Tab erreichbar.
  - [x] Neu: Auf „Vorrat bearbeiten“ mit Bestand 3 schreibt ↓ `2` und ↑ `4`; bei 1
        bleibt ↓ wirkungslos.
- [x] `e2e/supplies.spec.ts`: ein Ablauf „Vorrat anlegen, per ↑ auf ‚Menge ändern‘
      erhöhen, speichern“ prüft den gespeicherten Bestand im Emulator.
- [x] `docs/architektur/05-bausteinsicht.md`: `SpinButton · AmountSpinner` in beiden
      `shared/ui`-Aufzählungen ergänzen.

**Automatisierte Verifikation**:
- [x] `npm run test` grün, darin die neuen Fälle aus `supply.test.ts`,
      `quantity.test.ts`, `SpinButton.test.tsx`, `AmountSpinner.test.tsx` und
      `SuppliesArea.test.tsx`.
- [x] `npm run test:e2e` grün, darin der neue Ablauf in `supplies.spec.ts`.
- [x] `npm run lint` und `npm run build` laufen durch.
- [x] Die Schichten- und Kontextregeln (`no-restricted-imports` in `eslint.config.*`)
      melden nichts, insbesondere keinen Import zwischen `meals` und `shopping`; das
      deckt `npm run lint` ab.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [x] Mit VoiceOver auf „Vorrat hinzufügen“: Nach „Menge, Textfeld, 1“ folgt „Menge
      ändern, 1, anpassbar“. Wischen nach oben sagt „2“, das Textfeld zeigt `2`.
      Wischen nach unten führt zurück auf `1`; ein weiteres Wischen nach unten ändert
      nichts.
- [x] Der neue Wert wird genau einmal angesagt, nicht doppelt.
- [x] Doppeltipp auf „Menge ändern“ ändert den Wert nicht versehentlich.
- [x] Ins leere Feld doppeltippen und `3` eingeben, dann Speichern: In der Übersicht
      steht der Vorrat mit 3, nicht 13.
- [x] Ohne VoiceOver: ▲/▼ antippen ändert den Wert, die Tastatur bleibt dabei offen,
      wenn sie offen war.
- [x] „Vorrat bearbeiten“: Wischen ändert den angezeigten Bestand, und Speichern
      übernimmt ihn.
- [x] Die graue `1` ist auch bei eingeschaltetem „Farben umkehren“ (App-Schalter)
      lesbar und klar als Platzhalter erkennbar.

### Phase 2: Spinner bei den Artikeln

Abhängigkeiten: Phase 1 (`SpinButton`, `AmountSpinner`, CSS, `AmountStep`,
`spokenAmount`)

„Artikel hinzufügen“ auf der Einkaufsliste und das Artikel-Formular eines Gerichts
bekommen den Spinner zwischen Menge und Einheit, dazu die graue `1`.

**Aufgaben**:
- [x] `src/shared/domain/quantity.ts` test-getrieben (`quantity.test.ts`):
  - [x] `MAXIMUM_STEPPED_AMOUNT` und `roundedAmount` aus `shoppingItem.ts` hierher
        verschieben und exportieren; `shoppingItem.ts` importiert beide. Die
        bestehenden Tests der Einkaufsliste bleiben unverändert grün.
  - [x] `readSteppedAmount`: leer → 1, `'2,5'` → 2.5, `'2.5'` → 2.5, `'viel'`/`'0'`/
        `'-1'` → `null`.
  - [x] `stepWrittenAmount`: alle Zeilen der Tabelle aus den Akzeptanzkriterien,
        dazu `'2,2'`−1 → `'1,2'` (Rundung) und `'500'`+1 → `'501'`.
- [x] `src/shopping/ui/AddItemPage.tsx`: Das Mengenfeld bekommt `placeholder="1"`, und
      `AmountSpinner` (`minimum={1}`, `maximum={MAXIMUM_STEPPED_AMOUNT}`) kommt
      zwischen Menge und Einheit in `div.quantityFields`.
- [x] `src/meals/ui/MealItemsEditor.tsx`: ebenso.
- [x] `src/shopping/ui/ShoppingArea.test.tsx`: Neu: ↑ auf „Menge ändern“ bei leerem
      Feld schreibt `2`; danach `g` als Einheit und Hinzufügen ergeben `2 g` auf der
      Liste.
- [x] `src/meals/ui/MealsArea.test.tsx`: Neu: Im Artikel-Formular wird aus `2,5` per ↑
      `3,5`; nach „Artikel hinzufügen“ steht der Artikel mit 3,5 im Gericht.
- [x] `e2e/shoppingList.spec.ts`: ein Ablauf „Artikel anlegen, per ↑ auf ‚Menge
      ändern‘ erhöhen, hinzufügen“ prüft die Menge auf der Liste.

**Automatisierte Verifikation**:
- [x] `npm run test` grün, darin die neuen Fälle aus `quantity.test.ts`,
      `ShoppingArea.test.tsx` und `MealsArea.test.tsx` sowie die unveränderten Tests
      von `shoppingItem.test.ts`.
- [x] `npm run test:e2e` grün, darin der neue Ablauf in `shoppingList.spec.ts`.
- [x] `npm run lint` und `npm run build` laufen durch.
- [x] `npm run lint` meldet keinen Verstoß gegen `no-restricted-imports`.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [ ] „Artikel hinzufügen“ mit VoiceOver: Die Reihenfolge ist „Menge, Textfeld, 1“ →
      „Menge ändern, 1, anpassbar“ → „Einheit, Textfeld“. Nach oben wischen ergibt
      `2`, `3`, …
- [ ] `2,5` tippen, dann zum Spinner und nach oben wischen: VoiceOver sagt „3,5“, und
      das Feld zeigt `3,5`.
- [ ] Im Artikel-Formular eines Gerichts verhält sich der Spinner genauso.
- [ ] Die drei Elemente passen auf schmalen iPhones nebeneinander, ohne waagerecht zu
      scrollen; die Einheiten-Vorschläge erscheinen wie bisher darunter.
- [ ] Einkaufsliste, Vorräte-Übersicht und Zeitraum-Seite sehen aus und verhalten sich
      wie vorher.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: Die Platzhalterfarbe gilt nur für `.amountField::placeholder`, nicht für
  alle Eingabefelder; das genügt, weil alle vier Mengenfelder diese Klasse tragen.
- Phase 1: Den Rahmen in `--accentLine` tragen die beiden Pfeile (`.spinArrow`) wie die
  `stepButton`s im Mental-Unloader, nicht der Spinner selbst. `.amountSpinner` hat
  wie `.field` `margin-bottom: 1rem`, damit Textfeld und Pfeile unten bündig stehen.
- Phase 1: Testing Library findet ▲/▼ innerhalb des `spinbutton` nicht per
  `getByRole('button', { hidden: true })`; die Tests greifen über `getByText` zu und
  prüfen `aria-hidden` ausdrücklich.
- Phase 2: `readSteppedAmount` und `readAmount` teilen sich das Einlesen des Textes
  (`writtenNumber`); `readAmount` bleibt für die Fehlermeldungen beim Speichern
  zuständig, `readSteppedAmount` liefert stattdessen `null`.

## Verweise

- Vorbild: `..\Mental-Unloader\src\shared\ui\SpinButton.tsx`,
  `..\Mental-Unloader\src\tasks\ui\DeadlineStepper.tsx`,
  `..\Mental-Unloader\docs\agents\plans\2026-10-10-stichtag.md`
- Früherer Mengen-Stepper: `docs/agents/plans/2026-09-24-mengenpicker-auf-der-einkaufsliste.md`
- Apple Developer Forums – `input type="number"` nicht als spinbutton:
  https://developer.apple.com/forums/thread/825940
- WebKit-Bug 221102 – VoiceOver sagt bei spinbutton Prozent an:
  https://bugs.webkit.org/show_bug.cgi?id=221102
- WebKit-Bug 213744 – simulierte Tastendrücke für ARIA-Widgets:
  https://bugs.webkit.org/show_bug.cgi?id=213744
- WWDC 2022, Session 10153: https://nonstrict.eu/wwdcindex/wwdc2022/10153/
