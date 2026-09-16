type NameSuggestionsProps = {
  names: readonly string[]
  onChoose: (name: string) => void
}

export function NameSuggestions({ names, onChoose }: NameSuggestionsProps) {
  if (names.length === 0) return null

  return (
    <ul aria-label="Vorschläge" className="suggestionList">
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
