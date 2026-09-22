import { useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealFailureMessage } from '../domain/announcements'
import {
  recountedSupply,
  type SuppliedMeal,
  type Supply,
} from '../domain/supply'

type SupplyPageProps = {
  supplied: SuppliedMeal
  onSave: (supply: Supply) => void
  onBack: () => void
  onDelete: () => void
  announce: (text: string) => void
}

export function SupplyPage({
  supplied,
  onSave,
  onBack,
  onDelete,
  announce,
}: SupplyPageProps) {
  const heading = useHeadingFocus()
  const [written, setWritten] = useState(String(supplied.count))
  const [failureMessage, setFailureMessage] = useState('')

  function saveSupply() {
    try {
      onSave(recountedSupply(supplied.meal.id, written))
    } catch (error) {
      const message = mealFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Vorräten
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {supplied.meal.name}
      </h1>
      <p className="field">
        <label htmlFor="supplyCount">Menge</label>
        <input
          id="supplyCount"
          className="amountField"
          inputMode="numeric"
          value={written}
          onChange={(event) => setWritten(event.target.value)}
        />
      </p>
      <p id="supplyFailure" className="failure">
        {failureMessage}
      </p>
      <BottomBar>
        <button
          type="button"
          onClick={saveSupply}
          aria-describedby="supplyFailure"
        >
          <SaveIcon />
          Speichern
        </button>
        <button type="button" onClick={onDelete}>
          <TrashIcon />
          Löschen
        </button>
      </BottomBar>
    </main>
  )
}
