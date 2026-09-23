import { useEffect, useRef, useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealFailureMessage } from '../domain/announcements'
import {
  createMeal,
  type Meal,
  type MealDraft,
  type MealItem,
  type NewMeal,
} from '../domain/meal'
import { MealItemsEditor } from './MealItemsEditor'

type MealFormPageProps = {
  editedMeal: Meal | null
  onSave: (meal: NewMeal) => void
  onBack: () => void
  announce: (text: string) => void
  suggestNames: (typed: string) => readonly string[]
}

const EMPTY_DRAFT: MealDraft = {
  name: '',
  ingredientNotes: '',
  recipe: '',
  mainMeal: true,
}

function draftOf(meal: Meal | null): MealDraft {
  if (meal === null) return EMPTY_DRAFT
  return {
    name: meal.name,
    ingredientNotes: meal.ingredientNotes,
    recipe: meal.recipe,
    mainMeal: meal.mainMeal,
  }
}

export function MealFormPage({
  editedMeal,
  onSave,
  onBack,
  announce,
  suggestNames,
}: MealFormPageProps) {
  const heading = useHeadingFocus()
  const [draft, setDraft] = useState(() => draftOf(editedMeal))
  const [items, setItems] = useState<readonly MealItem[]>(
    editedMeal?.items ?? [],
  )
  const [failureMessage, setFailureMessage] = useState('')
  const [suggestNamesOnOpen] = useState(() => suggestNames)
  const nameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function change(part: Partial<MealDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function saveMeal() {
    try {
      onSave(createMeal(draft, items, editedMeal?.hidden ?? false))
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
        {editedMeal === null ? 'Zurück zu den Gerichten' : 'Zurück zum Gericht'}
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {editedMeal === null ? 'Gericht anlegen' : 'Gericht bearbeiten'}
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
        suggestNames={suggestNamesOnOpen}
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
      <label className="toggleField">
        <span>Hauptmahlzeit</span>
        <input
          type="checkbox"
          checked={draft.mainMeal}
          onChange={(event) => change({ mainMeal: event.target.checked })}
        />
      </label>
      <p id="mealFailure" className="failure">
        {failureMessage}
      </p>
      <BottomBar>
        <button type="button" onClick={saveMeal} aria-describedby="mealFailure">
          <SaveIcon />
          Speichern
        </button>
      </BottomBar>
    </main>
  )
}
