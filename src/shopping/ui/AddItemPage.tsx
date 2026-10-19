import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  MAXIMUM_STEPPED_AMOUNT,
  readSteppedAmount,
  spokenAmount,
  stepWrittenAmount,
  type AmountStep,
} from '../../shared/domain/quantity'
import { AmountSpinner } from '../../shared/ui/AmountSpinner'
import { NameSuggestions } from '../../shared/ui/NameSuggestions'
import { additionFailureMessage } from '../domain/announcements'
import type { ShoppingItemDraft } from '../domain/shoppingItem'

type AddItemPageProps = {
  addItem: (draft: ShoppingItemDraft) => string
  announce: (text: string) => void
  onBack: () => void
  suggestNames: (typed: string) => readonly string[]
  suggestUnits: (typed: string) => readonly string[]
}

const EMPTY_DRAFT: ShoppingItemDraft = { name: '', amount: '', unit: '' }

export function AddItemPage({
  addItem,
  announce,
  onBack,
  suggestNames,
  suggestUnits,
}: AddItemPageProps) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [failureMessage, setFailureMessage] = useState('')
  const [suggestNamesOnOpen] = useState(() => suggestNames)
  const [suggestUnitsOnOpen] = useState(() => suggestUnits)
  const nameField = useRef<HTMLInputElement>(null)
  const amountField = useRef<HTMLInputElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function change(part: Partial<ShoppingItemDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function stepAmount(step: AmountStep) {
    const stepped = stepWrittenAmount(draft.amount, step)
    if (stepped !== null) change({ amount: stepped })
  }

  function chooseSuggestion(name: string) {
    change({ name })
    amountField.current?.focus()
  }

  function chooseUnit(unit: string) {
    change({ unit })
    addButton.current?.focus()
  }

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const confirmation = addItem(draft)
      setDraft(EMPTY_DRAFT)
      setFailureMessage('')
      nameField.current?.focus()
      announce(confirmation)
    } catch (error) {
      const message = additionFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zur Liste
      </button>
      <h1>Artikel hinzufügen</h1>
      <form
        onSubmit={submitDraft}
        aria-label="Artikel hinzufügen"
        aria-describedby="addItemFailure"
      >
        <p className="field">
          <label htmlFor="itemName">Name</label>
          <input
            id="itemName"
            ref={nameField}
            value={draft.name}
            onChange={(event) => change({ name: event.target.value })}
          />
        </p>
        <NameSuggestions
          names={suggestNamesOnOpen(draft.name)}
          onChoose={chooseSuggestion}
        />
        <div className="quantityFields">
          <p className="field">
            <label htmlFor="itemAmount">Menge</label>
            <input
              id="itemAmount"
              ref={amountField}
              className="amountField"
              inputMode="decimal"
              placeholder="1"
              value={draft.amount}
              onChange={(event) => change({ amount: event.target.value })}
            />
          </p>
          <AmountSpinner
            valueText={spokenAmount(draft.amount)}
            value={readSteppedAmount(draft.amount)}
            minimum={1}
            maximum={MAXIMUM_STEPPED_AMOUNT}
            onStep={stepAmount}
          />
          <p className="field">
            <label htmlFor="itemUnit">Einheit</label>
            <input
              id="itemUnit"
              value={draft.unit}
              onChange={(event) => change({ unit: event.target.value })}
            />
          </p>
        </div>
        <NameSuggestions
          label="Einheiten-Vorschläge"
          names={suggestUnitsOnOpen(draft.unit)}
          onChoose={chooseUnit}
        />
        <p id="addItemFailure" className="failure">
          {failureMessage}
        </p>
        <button type="submit" ref={addButton}>
          Hinzufügen
        </button>
      </form>
    </main>
  )
}
