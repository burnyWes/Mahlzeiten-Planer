import {
  formatQuantity,
  readQuantity,
  type Quantity,
  type QuantityDraft,
} from '../../shared/domain/quantity'

export type MealId = string

export type MealItem = {
  name: string
  quantity: Quantity | null
}

export type NewMeal = {
  name: string
  items: readonly MealItem[]
  ingredientNotes: string
  recipe: string
}

export type Meal = NewMeal & {
  id: MealId
}

export type MealDraft = {
  name: string
  ingredientNotes: string
  recipe: string
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

function readName(written: string): string {
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
  return { name: readName(draft.name), quantity: readQuantity(draft) }
}

export function createMeal(
  draft: MealDraft,
  items: readonly MealItem[],
): NewMeal {
  return {
    name: readName(draft.name),
    items,
    ingredientNotes: readText(draft.ingredientNotes),
    recipe: readText(draft.recipe),
  }
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

export function byName(meals: readonly Meal[]): readonly Meal[] {
  return [...meals].sort((one, other) =>
    one.name.localeCompare(other.name, 'de-DE'),
  )
}

export function formatMealItem(item: MealItem): string {
  const quantity = formatQuantity(item.quantity)
  return quantity === '' ? item.name : `${item.name}, ${quantity}`
}
