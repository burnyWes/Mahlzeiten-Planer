import { useEffect, useRef, useState } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealFailureMessage } from '../domain/announcements'
import {
  createMeal,
  type MealDraft,
  type MealItem,
  type NewMeal,
} from '../domain/meal'
import { MealItemsEditor } from './MealItemsEditor'

type MealFormPageProps = {
  onSave: (meal: NewMeal) => void
  onBack: () => void
  announce: (text: string) => void
}

const EMPTY_DRAFT: MealDraft = { name: '', ingredientNotes: '', recipe: '' }

export function MealFormPage({ onSave, onBack, announce }: MealFormPageProps) {
  const heading = useHeadingFocus()
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [items, setItems] = useState<readonly MealItem[]>([])
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function change(part: Partial<MealDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function saveMeal() {
    try {
      onSave(createMeal(draft, items))
    } catch (error) {
      const message = mealFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
      nameField.current?.focus()
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Gerichten
      </button>
      <h1 ref={heading} tabIndex={-1}>
        Gericht anlegen
      </h1>
      <p className="field">
        <label htmlFor="mealName">Name</label>
        <input
          id="mealName"
          ref={nameField}
          value={draft.name}
          onChange={(event) => change({ name: event.target.value })}
        />
      </p>
      <MealItemsEditor
        items={items}
        onAddItem={(item) => setItems((taken) => [...taken, item])}
        onRemoveItem={(position) =>
          setItems((taken) => taken.filter((_, at) => at !== position))
        }
        announce={announce}
      />
      <p className="field">
        <label htmlFor="mealIngredientNotes">Zutaten</label>
        <textarea
          id="mealIngredientNotes"
          rows={3}
          value={draft.ingredientNotes}
          onChange={(event) => change({ ingredientNotes: event.target.value })}
        />
      </p>
      <p className="field">
        <label htmlFor="mealRecipe">Rezept</label>
        <textarea
          id="mealRecipe"
          rows={8}
          value={draft.recipe}
          onChange={(event) => change({ recipe: event.target.value })}
        />
      </p>
      <p id="mealFailure" className="failure">
        {failureMessage}
      </p>
      <button type="button" onClick={saveMeal} aria-describedby="mealFailure">
        Speichern
      </button>
    </main>
  )
}
