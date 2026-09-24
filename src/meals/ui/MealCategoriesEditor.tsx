import { useRef, useState, type FormEvent } from 'react'
import { NameSuggestions } from '../../shared/ui/NameSuggestions'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import {
  categoryAddedAnnouncement,
  categoryRemovedAnnouncement,
  mealCategoriesHeading,
  mealFailureMessage,
} from '../domain/announcements'
import {
  categoryToAdd,
  suggestCategories,
  type CategoryOverview,
} from '../domain/mealCategory'

type MealCategoriesEditorProps = {
  categories: readonly string[]
  knownCategories: readonly CategoryOverview[]
  onAddCategory: (category: string) => void
  onRemoveCategory: (position: number) => void
  announce: (text: string) => void
}

export function MealCategoriesEditor({
  categories,
  knownCategories,
  onAddCategory,
  onRemoveCategory,
  announce,
}: MealCategoriesEditorProps) {
  const [draft, setDraft] = useState('')
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)

  function takeOverCategory(written: string) {
    try {
      const category = categoryToAdd(
        categories,
        knownCategories.map((known) => known.name),
        written,
      )
      onAddCategory(category)
      setDraft('')
      setFailureMessage('')
      nameField.current?.focus()
      announce(categoryAddedAnnouncement(category))
    } catch (error) {
      const message = mealFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
    }
  }

  function takeOverDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    takeOverCategory(draft)
  }

  function removeCategory(position: number) {
    onRemoveCategory(position)
    announce(
      categoryRemovedAnnouncement(categories[position], categories.length - 1),
    )
    nameField.current?.focus()
  }

  return (
    <>
      <h2>{mealCategoriesHeading(categories.length)}</h2>
      {categories.length > 0 && (
        <ul className="itemList">
          {categories.map((category, position) => (
            <li key={category} className="mealItemRow">
              <span>{category}</span>
              <button
                type="button"
                className="iconButton"
                onClick={() => removeCategory(position)}
                aria-label={`Entfernen, ${category}`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={takeOverDraft}
        aria-label="Kategorie hinzufügen"
        aria-describedby="mealCategoryFailure"
      >
        <p className="field">
          <label htmlFor="mealCategoryName">Kategorie</label>
          <input
            id="mealCategoryName"
            ref={nameField}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </p>
        <NameSuggestions
          names={suggestCategories(knownCategories, categories, draft)}
          onChoose={takeOverCategory}
        />
        <p id="mealCategoryFailure" className="failure">
          {failureMessage}
        </p>
        <button type="submit">Kategorie hinzufügen</button>
      </form>
    </>
  )
}
