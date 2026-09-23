import { mealNameLabel } from '../domain/announcements'
import type { Meal } from '../domain/meal'
import { AddToShoppingListIcon } from './AddToShoppingListIcon'
import { LightbulbOffIcon } from './LightbulbOffIcon'

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
      <span className="hiddenMark" aria-hidden="true">
        {meal.hidden && <LightbulbOffIcon />}
      </span>
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenMeal(meal)}
        aria-label={mealNameLabel(meal)}
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
