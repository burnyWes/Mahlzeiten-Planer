import { useEffect, useRef, useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealFailureMessage } from '../domain/announcements'
import type { Meal } from '../domain/meal'
import { suggestMeals } from '../domain/mealSuggestions'
import {
  createSupply,
  InvalidSupply,
  type Supply,
  type SupplyDraft,
} from '../domain/supply'
import { MealSuggestions } from './MealSuggestions'

type AddSupplyPageProps = {
  meals: readonly Meal[]
  onSave: (supply: Supply) => void
  onBack: () => void
  announce: (text: string) => void
}

const EMPTY_DRAFT: SupplyDraft = { meal: '', count: '1' }

export function AddSupplyPage({
  meals,
  onSave,
  onBack,
  announce,
}: AddSupplyPageProps) {
  const heading = useHeadingFocus()
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [failureMessage, setFailureMessage] = useState('')
  const mealField = useRef<HTMLInputElement>(null)
  const countField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    mealField.current?.focus()
  }, [])

  function change(part: Partial<SupplyDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function chooseSuggestion(meal: Meal) {
    change({ meal: meal.name })
    countField.current?.focus()
  }

  function fieldOfFailure(error: unknown) {
    return error instanceof InvalidSupply && error.reason === 'mealUnknown'
      ? mealField
      : countField
  }

  function saveSupply() {
    try {
      onSave(createSupply(meals, draft))
    } catch (error) {
      const message = mealFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
      fieldOfFailure(error).current?.focus()
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Vorräten
      </button>
      <h1 ref={heading} tabIndex={-1}>
        Vorrat hinzufügen
      </h1>
      <p className="field">
        <label htmlFor="supplyMeal">Gericht</label>
        <input
          id="supplyMeal"
          ref={mealField}
          value={draft.meal}
          onChange={(event) => change({ meal: event.target.value })}
        />
      </p>
      <MealSuggestions
        label="Vorschläge"
        meals={suggestMeals(meals, draft.meal)}
        onChoose={chooseSuggestion}
      />
      <p className="field">
        <label htmlFor="supplyCount">Menge</label>
        <input
          id="supplyCount"
          ref={countField}
          className="amountField"
          inputMode="numeric"
          value={draft.count}
          onChange={(event) => change({ count: event.target.value })}
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
      </BottomBar>
    </main>
  )
}
