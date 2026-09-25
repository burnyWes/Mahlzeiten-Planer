import type { ChosenMealKind, Meal } from './meal'
import {
  knownCategory,
  mealsInCategory,
  type CategoryOverview,
} from './mealCategory'

export type MealFilter =
  { by: 'kind'; kind: ChosenMealKind } | { by: 'category'; category: string }

const KIND_ORDER: readonly ChosenMealKind[] = ['mainMeal', 'breakfast', 'snack']

export function usedMealKinds(
  meals: readonly Meal[],
): readonly ChosenMealKind[] {
  return KIND_ORDER.filter((kind) => meals.some((meal) => meal.kind === kind))
}

export function knownFilter(
  kinds: readonly ChosenMealKind[],
  categories: readonly CategoryOverview[],
  chosen: MealFilter | null,
): MealFilter | null {
  if (chosen === null) return null
  if (chosen.by === 'kind') return kinds.includes(chosen.kind) ? chosen : null
  const category = knownCategory(categories, chosen.category)
  return category === null ? null : { by: 'category', category }
}

export function mealsMatching(
  meals: readonly Meal[],
  filter: MealFilter | null,
): readonly Meal[] {
  if (filter === null) return meals
  if (filter.by === 'kind')
    return meals.filter((meal) => meal.kind === filter.kind)
  return mealsInCategory(meals, filter.category)
}
