import { useEffect, useRef, useState } from 'react'
import {
  additionFailureMessage,
  chooseCategoryHeading,
  chooseCategoryQuestion,
} from '../domain/announcements'
import { ItemCategoryField } from './ItemCategoryField'

type ChooseItemCategoryPageProps = {
  name: string
  suggestCategories: (typed: string) => readonly string[]
  onAddWithCategory: (categoryText: string) => void
  onAddWithoutCategory: () => void
  onBack: () => void
  announce: (text: string) => void
}

export function ChooseItemCategoryPage({
  name,
  suggestCategories,
  onAddWithCategory,
  onAddWithoutCategory,
  onBack,
  announce,
}: ChooseItemCategoryPageProps) {
  const [categoryText, setCategoryText] = useState('')
  const [failureMessage, setFailureMessage] = useState('')
  const categoryField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    categoryField.current?.focus()
  }, [])

  function addWithCategory() {
    try {
      onAddWithCategory(categoryText)
    } catch (error) {
      const message = additionFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
      categoryField.current?.focus()
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zum Artikel
      </button>
      <h1>{chooseCategoryHeading(name)}</h1>
      <p>{chooseCategoryQuestion(name)}</p>
      <ItemCategoryField
        value={categoryText}
        onChange={setCategoryText}
        suggestCategories={suggestCategories}
        fieldRef={categoryField}
      />
      <p id="chooseCategoryFailure" className="failure">
        {failureMessage}
      </p>
      <div className="pageActions">
        <button
          type="button"
          onClick={addWithCategory}
          aria-describedby="chooseCategoryFailure"
        >
          Mit Kategorie hinzufügen
        </button>
        <button type="button" onClick={onAddWithoutCategory}>
          Ohne Kategorie hinzufügen
        </button>
      </div>
    </main>
  )
}
