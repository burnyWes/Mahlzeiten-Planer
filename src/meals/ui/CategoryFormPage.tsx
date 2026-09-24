import { useEffect, useRef, useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealFailureMessage } from '../domain/announcements'
import type { CategoryOverview } from '../domain/mealCategory'

type CategoryFormPageProps = {
  overview: CategoryOverview
  onSave: (name: string) => void
  onBack: () => void
  announce: (text: string) => void
}

export function CategoryFormPage({
  overview,
  onSave,
  onBack,
  announce,
}: CategoryFormPageProps) {
  const heading = useHeadingFocus()
  const [name, setName] = useState(overview.name)
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function saveCategory() {
    try {
      onSave(name)
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
        Zurück zur Kategorie-Verwaltung
      </button>
      <h1 ref={heading} tabIndex={-1}>
        Kategorie bearbeiten
      </h1>
      <p className="field">
        <label htmlFor="categoryName">Name</label>
        <input
          id="categoryName"
          ref={nameField}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </p>
      <p id="categoryFailure" className="failure">
        {failureMessage}
      </p>
      <BottomBar>
        <button
          type="button"
          onClick={saveCategory}
          aria-describedby="categoryFailure"
        >
          <SaveIcon />
          Speichern
        </button>
      </BottomBar>
    </main>
  )
}
