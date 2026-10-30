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

export function sameCategory(one: string, other: string): boolean {
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

export function knownCategory(
  known: readonly CategoryOverview[],
  chosen: string | null,
): string | null {
  if (chosen === null) return null
  return (
    known.find((category) => sameCategory(category.name, chosen))?.name ?? null
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

export function withoutCategory(
  meals: readonly Meal[],
  name: string,
): readonly Meal[] {
  return meals
    .filter((meal) => carriesCategory(meal, name))
    .map((meal) => ({
      ...meal,
      categories: meal.categories.filter(
        (category) => !sameCategory(category, name),
      ),
    }))
}

export function carriesCategory(meal: Meal, name: string): boolean {
  return meal.categories.some((category) => sameCategory(category, name))
}

function renamedCategories(
  categories: readonly string[],
  from: string,
  name: string,
): readonly string[] {
  const renamed = categories.map((category) =>
    sameCategory(category, from) || sameCategory(category, name)
      ? name
      : category,
  )
  return renamed.filter(
    (category, position) =>
      category !== name || renamed.indexOf(name) === position,
  )
}

function sameCategories(
  one: readonly string[],
  other: readonly string[],
): boolean {
  return (
    one.length === other.length &&
    one.every((category, position) => category === other[position])
  )
}

export function withCategoryRenamed(
  meals: readonly Meal[],
  from: string,
  newName: string,
): readonly Meal[] | null {
  const name = createName(newName)
  if (!meals.some((meal) => carriesCategory(meal, from))) return null
  return meals
    .map((meal) => ({
      ...meal,
      categories: renamedCategories(meal.categories, from, name),
    }))
    .filter(
      (renamed, position) =>
        !sameCategories(renamed.categories, meals[position].categories),
    )
}

export class CatalogCategoryAlreadyTaken extends Error {
  category: string

  constructor(category: string) {
    super(category)
    this.name = 'CatalogCategoryAlreadyTaken'
    this.category = category
  }
}

function distinctNames(names: readonly string[]): readonly string[] {
  return names.filter(
    (name, position) =>
      names.findIndex((other) => sameCategory(other, name)) === position,
  )
}

export function withCatalogCategories(
  overviews: readonly CategoryOverview[],
  catalogNames: readonly string[],
): readonly CategoryOverview[] {
  const withoutMeals = distinctNames(catalogNames)
    .filter(
      (name) =>
        !overviews.some((overview) => sameCategory(overview.name, name)),
    )
    .map((name) => ({ name, mealCount: 0 }))
  return [...overviews, ...withoutMeals].sort((one, other) =>
    one.name.localeCompare(other.name, 'de-DE'),
  )
}

export function catalogCategoryToAdd(
  known: readonly string[],
  written: string,
): string {
  const name = createName(written)
  const taken = known.find((category) => sameCategory(category, name))
  if (taken !== undefined) throw new CatalogCategoryAlreadyTaken(taken)
  return name
}

export function catalogWithoutCategory(
  catalogNames: readonly string[],
  name: string,
): readonly string[] {
  return catalogNames.filter((category) => !sameCategory(category, name))
}

export function catalogWithCategoryRenamed(
  catalogNames: readonly string[],
  from: string,
  newName: string,
): readonly string[] {
  return renamedCategories(catalogNames, from, createName(newName))
}

export function mealCategoryNamesFromStored(
  stored: unknown,
): readonly string[] {
  if (typeof stored !== 'object' || stored === null) return []
  const { names } = stored as Record<string, unknown>
  return Array.isArray(names)
    ? names.filter((name): name is string => typeof name === 'string')
    : []
}

export function sameCatalogNames(
  one: readonly string[],
  other: readonly string[],
): boolean {
  return sameCategories(one, other)
}
