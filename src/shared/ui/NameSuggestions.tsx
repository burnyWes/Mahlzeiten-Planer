type NameSuggestionsProps = {
  names: readonly string[]
  onChoose: (name: string) => void
  label?: string
}

export function NameSuggestions({
  names,
  onChoose,
  label = 'Vorschläge',
}: NameSuggestionsProps) {
  if (names.length === 0) return null

  return (
    <ul aria-label={label} className="suggestionList">
      {names.map((name) => (
        <li key={name}>
          <button type="button" onClick={() => onChoose(name)}>
            {name}
          </button>
        </li>
      ))}
    </ul>
  )
}
