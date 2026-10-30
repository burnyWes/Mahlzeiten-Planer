import { useState, type RefObject } from 'react'
import { NameSuggestions } from '../../shared/ui/NameSuggestions'

type ItemCategoryFieldProps = {
  value: string
  onChange: (value: string) => void
  suggestCategories: (typed: string) => readonly string[]
  fieldRef: RefObject<HTMLInputElement | null>
}

export function ItemCategoryField({
  value,
  onChange,
  suggestCategories,
  fieldRef,
}: ItemCategoryFieldProps) {
  const [suggestCategoriesOnOpen] = useState(() => suggestCategories)

  function chooseSuggestion(category: string) {
    onChange(category)
    fieldRef.current?.focus()
  }

  return (
    <>
      <p className="field">
        <label htmlFor="itemCategory">Kategorie</label>
        <input
          id="itemCategory"
          ref={fieldRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </p>
      <NameSuggestions
        label="Kategorie-Vorschläge"
        names={suggestCategoriesOnOpen(value)}
        onChoose={chooseSuggestion}
      />
    </>
  )
}
