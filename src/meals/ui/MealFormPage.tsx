import { useEffect, useRef, useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  mealFailureMessage,
  replacedKindAnnouncement,
} from '../domain/announcements'
import {
  createMeal,
  withChosenKind,
  type ChosenMealKind,
  type Meal,
  type MealDraft,
  type MealItem,
  type NewMeal,
} from '../domain/meal'
import type { CategoryOverview } from '../domain/mealCategory'
import { MealCategoriesEditor } from './MealCategoriesEditor'
import { MealItemsEditor } from './MealItemsEditor'

type MealFormPageProps = {
  editedMeal: Meal | null
  onSave: (meal: NewMeal) => void
  onBack: () => void
  announce: (text: string) => void
  suggestNames: (
    typed: string,
    alsoInUse: readonly string[],
  ) => readonly string[]
  suggestUnits: (
    typed: string,
    alsoInUse: readonly string[],
  ) => readonly string[]
  canonicalUnit: (typed: string) => string
  knownCategories: readonly CategoryOverview[]
}

const EMPTY_DRAFT: MealDraft = {
  name: '',
  ingredientNotes: '',
  recipe: '',
  kind: 'mainMeal',
}

function draftOf(meal: Meal | null): MealDraft {
  if (meal === null) return EMPTY_DRAFT
  return {
    name: meal.name,
    ingredientNotes: meal.ingredientNotes,
    recipe: meal.recipe,
    kind: meal.kind,
  }
}

export function MealFormPage({
  editedMeal,
  onSave,
  onBack,
  announce,
  suggestNames,
  suggestUnits,
  canonicalUnit,
  knownCategories,
}: MealFormPageProps) {
  const heading = useHeadingFocus()
  const [draft, setDraft] = useState(() => draftOf(editedMeal))
  const [items, setItems] = useState<readonly MealItem[]>(
    editedMeal?.items ?? [],
  )
  const [categories, setCategories] = useState<readonly string[]>(
    editedMeal?.categories ?? [],
  )
  const [failureMessage, setFailureMessage] = useState('')
  const [suggestNamesOnOpen] = useState(() => suggestNames)
  const [suggestUnitsOnOpen] = useState(() => suggestUnits)
  const nameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function change(part: Partial<MealDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function chooseKind(chosen: ChosenMealKind, checked: boolean) {
    const kind = withChosenKind(draft.kind, chosen, checked)
    const replaced = replacedKindAnnouncement(draft.kind, kind)
    if (replaced !== null) announce(replaced)
    change({ kind })
  }

  function saveMeal() {
    try {
      onSave(createMeal(draft, items, categories, editedMeal?.hidden ?? false))
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
        suggestUnits={suggestUnitsOnOpen}
        canonicalUnit={canonicalUnit}
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
        <span>Hauptgericht</span>
        <input
          type="checkbox"
          checked={draft.kind === 'mainMeal'}
          onChange={(event) => chooseKind('mainMeal', event.target.checked)}
        />
      </label>
      <label className="toggleField">
        <span>Frühstück</span>
        <input
          type="checkbox"
          checked={draft.kind === 'breakfast'}
          onChange={(event) => chooseKind('breakfast', event.target.checked)}
        />
      </label>
      <label className="toggleField">
        <span>Snack</span>
        <input
          type="checkbox"
          checked={draft.kind === 'snack'}
          onChange={(event) => chooseKind('snack', event.target.checked)}
        />
      </label>
      <MealCategoriesEditor
        categories={categories}
        knownCategories={knownCategories}
        onAddCategory={(category) =>
          setCategories((taken) => [...taken, category])
        }
        onRemoveCategory={(position) =>
          setCategories((taken) => taken.filter((_, at) => at !== position))
        }
        announce={announce}
      />
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
