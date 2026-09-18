import { useEffect, useRef, useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { additionFailureMessage } from '../domain/announcements'
import type { KnownItem } from '../domain/knownItem'

type KnownItemFormPageProps = {
  knownItem: KnownItem
  onSave: (name: string) => void
  onBack: () => void
  announce: (text: string) => void
}

export function KnownItemFormPage({
  knownItem,
  onSave,
  onBack,
  announce,
}: KnownItemFormPageProps) {
  const heading = useHeadingFocus()
  const [name, setName] = useState(knownItem.name)
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function saveKnownItem() {
    try {
      onSave(name)
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
        Zurück zur Artikelverwaltung
      </button>
      <h1 ref={heading} tabIndex={-1}>
        Vorschlag bearbeiten
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
      <p id="knownItemFailure" className="failure">
        {failureMessage}
      </p>
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
