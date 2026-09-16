import type { Meal } from '../domain/meal'

type MealListRowProps = {
  meal: Meal
  onOpenMeal: (meal: Meal) => void
}

export function MealListRow({ meal, onOpenMeal }: MealListRowProps) {
  return (
    <li className="mealRow">
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenMeal(meal)}
      >
        {meal.name}
      </button>
    </li>
  )
}
