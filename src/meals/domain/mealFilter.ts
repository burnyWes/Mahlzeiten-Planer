import type { ChosenMealKind, Meal } from './meal'
import {
  carriesCategory,
  knownCategory,
  type CategoryOverview,
} from './mealCategory'
import type { SuppliedMeal } from './supply'

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

export function matchesMealFilter(meal: Meal, filter: MealFilter): boolean {
  return filter.by === 'kind'
    ? meal.kind === filter.kind
    : carriesCategory(meal, filter.category)
}

export function mealsMatching(
  meals: readonly Meal[],
  filter: MealFilter | null,
): readonly Meal[] {
  if (filter === null) return meals
  return meals.filter((meal) => matchesMealFilter(meal, filter))
}

export function suppliesMatching(
  supplied: readonly SuppliedMeal[],
  filter: MealFilter | null,
): readonly SuppliedMeal[] {
  if (filter === null) return supplied
  return supplied.filter((one) => matchesMealFilter(one.meal, filter))
}
