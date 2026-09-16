import type { Meal } from '../domain/meal'

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
        className="mealTransferButton"
        onClick={() => onAddToShoppingList(meal)}
        aria-label={`Auf die Einkaufsliste, ${meal.name}`}
      >
        Auf die Einkaufsliste
      </button>
    </li>
  )
}
