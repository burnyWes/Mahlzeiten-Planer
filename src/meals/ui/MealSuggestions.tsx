import type { Meal } from '../domain/meal'

type MealSuggestionsProps = {
  label: string
  meals: readonly Meal[]
  onChoose: (meal: Meal) => void
}

export function MealSuggestions({
  label,
  meals,
  onChoose,
}: MealSuggestionsProps) {
  if (meals.length === 0) return null

  return (
    <ul aria-label={label} className="suggestionList">
      {meals.map((meal) => (
        <li key={meal.id}>
          <button type="button" onClick={() => onChoose(meal)}>
            {meal.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
