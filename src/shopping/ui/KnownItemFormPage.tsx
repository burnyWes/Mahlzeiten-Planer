import { useEffect, useRef, useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  additionFailureMessage,
  knownItemFormHeading,
  type KnownItemFormMode,
} from '../domain/announcements'
import type { MealUsingItem } from '../domain/knownItem'
import { ItemCategoryField } from './ItemCategoryField'
import { UsingMeals } from './UsingMeals'

type UsedInMeals = {
  usingMeals: readonly MealUsingItem[]
  onRemoveFromMeal: (usingMeal: MealUsingItem) => void
}

type KnownItemFormPageProps = {
  mode: KnownItemFormMode
  initialName: string
  initialCategory: string
  suggestCategories: (typed: string) => readonly string[]
  onSave: (name: string, categoryText: string) => void
  onBack: () => void
  announce: (text: string) => void
  usedInMeals?: UsedInMeals
}

export function KnownItemFormPage({
  mode,
  initialName,
  initialCategory,
  suggestCategories,
  onSave,
  onBack,
  announce,
  usedInMeals,
}: KnownItemFormPageProps) {
  const heading = useHeadingFocus()
  const [name, setName] = useState(initialName)
  const [categoryText, setCategoryText] = useState(initialCategory)
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)
  const categoryField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function saveKnownItem() {
    try {
      onSave(name, categoryText)
    } catch (error) {
      const message = additionFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
      nameField.current?.focus()
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Artikeln
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {knownItemFormHeading(mode)}
      </h1>
      <p className="field">
        <label htmlFor="knownItemName">Name</label>
        <input
          id="knownItemName"
          ref={nameField}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </p>
      <ItemCategoryField
        value={categoryText}
        onChange={setCategoryText}
        suggestCategories={suggestCategories}
        fieldRef={categoryField}
      />
      <p id="knownItemFailure" className="failure">
        {failureMessage}
      </p>
      {usedInMeals !== undefined && (
        <UsingMeals
          usingMeals={usedInMeals.usingMeals}
          onRemove={usedInMeals.onRemoveFromMeal}
        />
      )}
      <BottomBar>
        <button
          type="button"
          onClick={saveKnownItem}
          aria-describedby="knownItemFailure"
        >
          <SaveIcon />
          Speichern
        </button>
      </BottomBar>
    </main>
  )
}
