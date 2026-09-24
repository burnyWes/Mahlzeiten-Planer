import { byName, createName, normalizeMealName, type Meal } from './meal'

export type CategoryOverview = { name: string; mealCount: number }

const MINIMUM_TYPED_LENGTH = 2
const MAXIMUM_SUGGESTIONS = 5

export class CategoryAlreadyTaken extends Error {
  category: string

  constructor(category: string) {
    super(category)
    this.name = 'CategoryAlreadyTaken'
    this.category = category
  }
}

function sameCategory(one: string, other: string): boolean {
  return normalizeMealName(one) === normalizeMealName(other)
}

export function categoryToAdd(
  taken: readonly string[],
  known: readonly string[],
  written: string,
): string {
  const name = createName(written)
  const alreadyTaken = taken.find((category) => sameCategory(category, name))
  if (alreadyTaken !== undefined) throw new CategoryAlreadyTaken(alreadyTaken)
  return known.find((category) => sameCategory(category, name)) ?? name
}

function distinctCategoriesOf(meal: Meal): ReadonlyMap<string, string> {
  const distinct = new Map<string, string>()
  for (const category of meal.categories) {
    const normalized = normalizeMealName(category)
    if (!distinct.has(normalized)) distinct.set(normalized, category)
  }
  return distinct
}

export function mealCategories(
  meals: readonly Meal[],
): readonly CategoryOverview[] {
  const gathered = new Map<string, CategoryOverview>()
  for (const meal of byName(meals)) {
    for (const [normalized, category] of distinctCategoriesOf(meal)) {
      const known = gathered.get(normalized) ?? { name: category, mealCount: 0 }
      gathered.set(normalized, { ...known, mealCount: known.mealCount + 1 })
    }
  }
  return [...gathered.values()].sort((one, other) =>
    one.name.localeCompare(other.name, 'de-DE'),
  )
}

function startsWithTyped(category: CategoryOverview, typed: string): boolean {
  return normalizeMealName(category.name).startsWith(typed)
}

function bySuggestionRank(typed: string) {
  return (one: CategoryOverview, other: CategoryOverview) =>
    Number(startsWithTyped(other, typed)) -
      Number(startsWithTyped(one, typed)) ||
    other.mealCount - one.mealCount ||
    one.name.localeCompare(other.name, 'de-DE')
}

export function suggestCategories(
  known: readonly CategoryOverview[],
  taken: readonly string[],
  typed: string,
): readonly string[] {
  const wanted = normalizeMealName(typed)
  if (wanted.length < MINIMUM_TYPED_LENGTH) return []
  const takenNames = new Set(taken.map(normalizeMealName))
  return known
    .filter((category) => {
      const name = normalizeMealName(category.name)
      return name.includes(wanted) && name !== wanted && !takenNames.has(name)
    })
    .sort(bySuggestionRank(wanted))
    .slice(0, MAXIMUM_SUGGESTIONS)
    .map((category) => category.name)
}
