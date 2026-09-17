import type { Meal } from '../domain/meal'
import { AddToShoppingListIcon } from './AddToShoppingListIcon'

type MealListRowProps = {
  meal: Meal
  onOpenMeal: (meal: Meal) => void
  onAddToShoppingList: (meal: Meal) => void
}

export function MealListRow({
  meal,
  onOpenMeal,
  onAddToShoppingList,
}: MealListRowProps) {
  return (
    <li className="mealRow">
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenMeal(meal)}
      >
        {meal.name}
      </button>
      <button
        type="button"
        className="iconButton"
        onClick={() => onAddToShoppingList(meal)}
        aria-label={`Auf die Einkaufsliste, ${meal.name}`}
      >
        <AddToShoppingListIcon />
      </button>
    </li>
  )
}
