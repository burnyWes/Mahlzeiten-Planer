import { useEffect, useRef, useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { additionFailureMessage } from '../domain/announcements'
type KnownUnitFormPageProps = {
  heading: string
  initialName: string
  onSave: (name: string) => void
  onBack: () => void
  announce: (text: string) => void
}

export function KnownUnitFormPage({
  heading: headingText,
  initialName,
  onSave,
  onBack,
  announce,
}: KnownUnitFormPageProps) {
  const heading = useHeadingFocus()
  const [name, setName] = useState(initialName)
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function saveKnownUnit() {
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
        Zurück zu den Einheiten
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {headingText}
      </h1>
      <p className="field">
        <label htmlFor="knownUnitName">Name</label>
        <input
          id="knownUnitName"
          ref={nameField}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </p>
      <p id="knownUnitFailure" className="failure">
        {failureMessage}
      </p>
      <BottomBar>
        <button
          type="button"
          onClick={saveKnownUnit}
          aria-describedby="knownUnitFailure"
        >
          <SaveIcon />
          Speichern
        </button>
      </BottomBar>
    </main>
  )
}
