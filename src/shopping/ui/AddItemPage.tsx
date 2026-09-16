import { useEffect, useRef, useState, type FormEvent } from 'react'
import { UNITS } from '../../shared/domain/quantity'
import { NameSuggestions } from '../../shared/ui/NameSuggestions'
import { additionFailureMessage } from '../domain/announcements'
import type { ShoppingItemDraft } from '../domain/shoppingItem'

type AddItemPageProps = {
  addItem: (draft: ShoppingItemDraft) => string
  announce: (text: string) => void
  onBack: () => void
  suggestNames: (typed: string) => readonly string[]
}

const EMPTY_DRAFT: ShoppingItemDraft = { name: '', amount: '', unit: '' }

export function AddItemPage({
  addItem,
  announce,
  onBack,
  suggestNames,
}: AddItemPageProps) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [failureMessage, setFailureMessage] = useState('')
  const [suggestNamesOnOpen] = useState(() => suggestNames)
  const nameField = useRef<HTMLInputElement>(null)
  const amountField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function change(part: Partial<ShoppingItemDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function chooseSuggestion(name: string) {
    change({ name })
    amountField.current?.focus()
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
              value={draft.amount}
              onChange={(event) => change({ amount: event.target.value })}
            />
          </p>
          <p className="field">
            <label htmlFor="itemUnit">Einheit</label>
            <input
              id="itemUnit"
              list="units"
              value={draft.unit}
              onChange={(event) => change({ unit: event.target.value })}
            />
            <datalist id="units">
              {UNITS.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
          </p>
        </div>
        <p id="addItemFailure" className="failure">
          {failureMessage}
        </p>
        <button type="submit">Hinzufügen</button>
      </form>
    </main>
  )
}
