import { useRef, useState, type FormEvent } from 'react'
import { UNITS } from '../../shared/domain/quantity'
import { NameSuggestions } from '../../shared/ui/NameSuggestions'
import {
  mealFailureMessage,
  mealItemAddedAnnouncement,
  mealItemRemovedAnnouncement,
  mealItemsHeading,
} from '../domain/announcements'
import {
  createMealItem,
  formatMealItem,
  type MealItem,
  type MealItemDraft,
} from '../domain/meal'
import { TrashIcon } from './TrashIcon'

type MealItemsEditorProps = {
  items: readonly MealItem[]
  onAddItem: (item: MealItem) => void
  onRemoveItem: (position: number) => void
  announce: (text: string) => void
  suggestNames: (typed: string) => readonly string[]
}

const EMPTY_DRAFT: MealItemDraft = { name: '', amount: '', unit: '' }

export function MealItemsEditor({
  items,
  onAddItem,
  onRemoveItem,
  announce,
  suggestNames,
}: MealItemsEditorProps) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)
  const amountField = useRef<HTMLInputElement>(null)

  function change(part: Partial<MealItemDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function chooseSuggestion(name: string) {
    change({ name })
    amountField.current?.focus()
  }

  function takeOverItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const item = createMealItem(draft)
      onAddItem(item)
      setDraft(EMPTY_DRAFT)
      setFailureMessage('')
      nameField.current?.focus()
      announce(mealItemAddedAnnouncement(item))
    } catch (error) {
      const message = mealFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
    }
  }

  function removeItem(position: number) {
    onRemoveItem(position)
    announce(mealItemRemovedAnnouncement(items[position], items.length - 1))
    nameField.current?.focus()
  }

  return (
    <>
      <h2>{mealItemsHeading(items.length)}</h2>
      {items.length > 0 && (
        <ul className="itemList">
          {items.map((item, position) => (
            <li key={`${position}-${item.name}`} className="mealItemRow">
              <span>{formatMealItem(item)}</span>
              <button
                type="button"
                className="iconButton"
                onClick={() => removeItem(position)}
                aria-label={`Entfernen, ${formatMealItem(item)}`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={takeOverItem}
        aria-label="Einkaufs-Item hinzufügen"
        aria-describedby="mealItemFailure"
      >
        <p className="field">
          <label htmlFor="mealItemName">Item</label>
          <input
            id="mealItemName"
            ref={nameField}
            value={draft.name}
            onChange={(event) => change({ name: event.target.value })}
          />
        </p>
        <NameSuggestions
          names={suggestNames(draft.name)}
          onChoose={chooseSuggestion}
        />
        <div className="quantityFields">
          <p className="field">
            <label htmlFor="mealItemAmount">Menge</label>
            <input
              id="mealItemAmount"
              ref={amountField}
              className="amountField"
              inputMode="decimal"
              value={draft.amount}
              onChange={(event) => change({ amount: event.target.value })}
            />
          </p>
          <p className="field">
            <label htmlFor="mealItemUnit">Einheit</label>
            <input
              id="mealItemUnit"
              list="mealUnits"
              value={draft.unit}
              onChange={(event) => change({ unit: event.target.value })}
            />
            <datalist id="mealUnits">
              {UNITS.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
          </p>
        </div>
        <p id="mealItemFailure" className="failure">
          {failureMessage}
        </p>
        <button type="submit">Item hinzufügen</button>
      </form>
    </>
  )
}
