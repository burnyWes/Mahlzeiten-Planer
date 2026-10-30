import {
  formatQuantity,
  readQuantity,
  type Quantity,
  type QuantityDraft,
} from '../../shared/domain/quantity'

export type MealId = string

export type MealKind = 'mainMeal' | 'breakfast' | 'snack' | 'none'

export type ChosenMealKind = Exclude<MealKind, 'none'>

export type MealItem = {
  name: string
  quantity: Quantity | null
}

export type NewMeal = {
  name: string
  items: readonly MealItem[]
  ingredientNotes: string
  recipe: string
  categories: readonly string[]
  hidden: boolean
  kind: MealKind
  leftovers: boolean
}

export type Meal = NewMeal & {
  id: MealId
}

export type MealDraft = {
  name: string
  ingredientNotes: string
  recipe: string
  kind: MealKind
  leftovers: boolean
}

export type MealItemDraft = QuantityDraft & {
  name: string
}

export type InvalidMealReason = 'nameMissing' | 'nameTooLong' | 'textTooLong'

export class InvalidMeal extends Error {
  reason: InvalidMealReason

  constructor(reason: InvalidMealReason) {
    super(reason)
    this.name = 'InvalidMeal'
    this.reason = reason
  }
}

const MAXIMUM_NAME_LENGTH = 100
const MAXIMUM_TEXT_LENGTH = 5000

export function createName(written: string): string {
  const name = written.trim()
  if (name === '') throw new InvalidMeal('nameMissing')
  if (name.length > MAXIMUM_NAME_LENGTH) throw new InvalidMeal('nameTooLong')
  return name
}

function readText(written: string): string {
  if (written.length > MAXIMUM_TEXT_LENGTH) throw new InvalidMeal('textTooLong')
  return written
}

export function createMealItem(draft: MealItemDraft): MealItem {
  return { name: createName(draft.name), quantity: readQuantity(draft) }
}

export function createMeal(
  draft: MealDraft,
  items: readonly MealItem[],
  categories: readonly string[],
  hidden: boolean,
): NewMeal {
  return {
    name: createName(draft.name),
    items,
    ingredientNotes: readText(draft.ingredientNotes),
    recipe: readText(draft.recipe),
    categories,
    hidden,
    kind: draft.kind,
    leftovers: draft.leftovers,
  }
}

function newMealOf(meal: Meal): NewMeal {
  return {
    name: meal.name,
    items: meal.items,
    ingredientNotes: meal.ingredientNotes,
    recipe: meal.recipe,
    categories: meal.categories,
    hidden: meal.hidden,
    kind: meal.kind,
    leftovers: meal.leftovers,
  }
}

export function withHiding(meal: Meal, hidden: boolean): NewMeal {
  return { ...newMealOf(meal), hidden }
}

export function countHiddenMeals(meals: readonly NewMeal[]): number {
  return meals.filter((meal) => meal.hidden).length
}

export function withChosenKind(
  previous: MealKind,
  chosen: ChosenMealKind,
  checked: boolean,
): MealKind {
  if (checked) return chosen
  return previous === chosen ? 'none' : previous
}

export function normalizeMealName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE')
}

export function mealNamed(
  meals: readonly Meal[],
  written: string,
): Meal | null {
  const wanted = normalizeMealName(written)
  if (wanted === '') return null
  return meals.find((meal) => normalizeMealName(meal.name) === wanted) ?? null
}

export function mealsByItemName(
  meals: readonly Meal[],
): ReadonlyMap<string, readonly Meal[]> {
  const index = new Map<string, Meal[]>()
  for (const meal of meals) {
    const itemNames = new Set(
      meal.items.map((item) => normalizeMealName(item.name)),
    )
    for (const itemName of itemNames) {
      const usingMeals = index.get(itemName) ?? []
      usingMeals.push(meal)
      index.set(itemName, usingMeals)
    }
  }
  return index
}

export function withoutItem(meal: Meal, name: string): NewMeal {
  const removed = normalizeMealName(name)
  return {
    ...newMealOf(meal),
    items: meal.items.filter(
      (item) => normalizeMealName(item.name) !== removed,
    ),
  }
}

function withItemNameReplaced(
  items: readonly MealItem[],
  from: string,
  to: string,
): readonly MealItem[] {
  const renamed = normalizeMealName(from)
  return items.map((item) =>
    item.name !== to && normalizeMealName(item.name) === renamed
      ? { ...item, name: to }
      : item,
  )
}

export function withItemRenamed(
  meals: readonly Meal[],
  from: string,
  to: string,
): readonly Meal[] {
  return meals.flatMap((meal) => {
    const items = withItemNameReplaced(meal.items, from, to)
    const changes = items.some(
      (item, position) => item !== meal.items[position],
    )
    return changes ? [{ ...meal, items }] : []
  })
}

export function byName(meals: readonly Meal[]): readonly Meal[] {
  return [...meals].sort((one, other) =>
    one.name.localeCompare(other.name, 'de-DE'),
  )
}

function namesNotIn(
  before: readonly string[],
  after: readonly string[],
): readonly string[] {
  const known = new Set(before.map(normalizeMealName))
  return after.filter((name) => {
    const normalized = normalizeMealName(name)
    if (known.has(normalized)) return false
    known.add(normalized)
    return true
  })
}

export function unitsOfItems(items: readonly MealItem[]): readonly string[] {
  return items.flatMap((item) => item.quantity?.unit ?? [])
}

export function unitsOfMeals(meals: readonly NewMeal[]): readonly string[] {
  return meals.flatMap((meal) => unitsOfItems(meal.items))
}

export function newlyUsedNames(
  before: readonly MealItem[],
  after: readonly MealItem[],
): readonly string[] {
  return namesNotIn(
    before.map((item) => item.name),
    after.map((item) => item.name),
  )
}

export function newlyUsedUnits(
  before: readonly MealItem[],
  after: readonly MealItem[],
): readonly string[] {
  return namesNotIn(unitsOfItems(before), unitsOfItems(after))
}

export function formatMealItem(item: MealItem): string {
  const quantity = formatQuantity(item.quantity)
  return quantity === '' ? item.name : `${item.name}, ${quantity}`
}
