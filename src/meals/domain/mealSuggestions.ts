import type { Meal } from './meal'

const MINIMUM_TYPED_LENGTH = 2
const MAXIMUM_SUGGESTIONS = 5

function normalizeMealName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE')
}

function startsWithTyped(meal: Meal, typed: string): boolean {
  return normalizeMealName(meal.name).startsWith(typed)
}

function bySuggestionRank(typed: string) {
  return (one: Meal, other: Meal) =>
    Number(startsWithTyped(other, typed)) -
      Number(startsWithTyped(one, typed)) ||
    one.name.localeCompare(other.name, 'de-DE')
}

export function suggestMeals(
  meals: readonly Meal[],
  typed: string,
): readonly Meal[] {
  const wanted = normalizeMealName(typed)
  if (wanted.length < MINIMUM_TYPED_LENGTH) return []
  return meals
    .filter((meal) => {
      const name = normalizeMealName(meal.name)
      return name.includes(wanted) && name !== wanted
    })
    .sort(bySuggestionRank(wanted))
    .slice(0, MAXIMUM_SUGGESTIONS)
}
