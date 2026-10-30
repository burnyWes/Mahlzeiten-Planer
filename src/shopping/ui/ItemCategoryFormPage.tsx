import { useEffect, useRef, useState } from 'react'
import type { AmountStep } from '../../shared/domain/quantity'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { SpinArrow } from '../../shared/ui/SpinArrow'
import { SpinButton } from '../../shared/ui/SpinButton'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  additionFailureMessage,
  itemCategoryPositionText,
} from '../domain/announcements'
import type { CategoryPlacement } from '../domain/itemCategory'

type ItemCategoryFormPageProps = {
  heading: string
  initialName: string
  initialPlacement: CategoryPlacement
  onSave: (name: string, position: number) => void
  onBack: () => void
  announce: (text: string) => void
}

export function ItemCategoryFormPage({
  heading,
  initialName,
  initialPlacement,
  onSave,
  onBack,
  announce,
}: ItemCategoryFormPageProps) {
  const headingElement = useHeadingFocus()
  const [name, setName] = useState(initialName)
  const [position, setPosition] = useState(initialPlacement.position)
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)
  const [highestPosition] = useState(initialPlacement.count)
  const positionText = itemCategoryPositionText({
    position,
    count: highestPosition,
  })

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function stepPosition(step: AmountStep) {
    setPosition((current) =>
      Math.min(Math.max(current + step, 1), highestPosition),
    )
  }

  function saveCategory() {
    try {
      onSave(name, position)
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
        Zurück zu den Artikelkategorien
      </button>
      <h1 ref={headingElement} tabIndex={-1}>
        {heading}
      </h1>
      <p className="field">
        <label htmlFor="itemCategoryName">Name</label>
        <input
          id="itemCategoryName"
          ref={nameField}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </p>
      <div className="field">
        <span aria-hidden="true">Position</span>
        <SpinButton
          label="Position"
          className="positionSpinner"
          value={position}
          minimum={1}
          maximum={highestPosition}
          valueText={positionText}
          onStep={stepPosition}
        >
          <span className="positionValue">{positionText}</span>
          <SpinArrow symbol="−" onPress={() => stepPosition(-1)} />
          <SpinArrow symbol="+" onPress={() => stepPosition(1)} />
        </SpinButton>
      </div>
      <p id="itemCategoryFailure" className="failure">
        {failureMessage}
      </p>
      <BottomBar>
        <button
          type="button"
          onClick={saveCategory}
          aria-describedby="itemCategoryFailure"
        >
          <SaveIcon />
          Speichern
        </button>
      </BottomBar>
    </main>
  )
}
