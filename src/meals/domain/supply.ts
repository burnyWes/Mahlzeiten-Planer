import { byName, mealNamed, type Meal, type MealId } from './meal'

export type Supply = {
  mealId: MealId
  count: number
}

export type SuppliedMeal = {
  meal: Meal
  count: number
}

export type SupplyDraft = {
  meal: string
  count: string
}

export type InvalidSupplyReason =
  | 'mealUnknown'
  | 'countNotANumber'
  | 'countNotWhole'
  | 'countNotPositive'
  | 'countTooLarge'

export class InvalidSupply extends Error {
  reason: InvalidSupplyReason

  constructor(reason: InvalidSupplyReason) {
    super(reason)
    this.name = 'InvalidSupply'
    this.reason = reason
  }
}

export const MAXIMUM_COUNT = 99

function readCount(written: string): number {
  const trimmed = written.trim()
  const count = Number(trimmed.replace(',', '.'))
  if (trimmed === '' || Number.isNaN(count))
    throw new InvalidSupply('countNotANumber')
  if (!Number.isInteger(count)) throw new InvalidSupply('countNotWhole')
  if (count < 1) throw new InvalidSupply('countNotPositive')
  if (count > MAXIMUM_COUNT) throw new InvalidSupply('countTooLarge')
  return count
}

export function createSupply(
  meals: readonly Meal[],
  draft: SupplyDraft,
): Supply {
  const meal = mealNamed(meals, draft.meal)
  if (meal === null) throw new InvalidSupply('mealUnknown')
  return { mealId: meal.id, count: readCount(draft.count) }
}

export function recountedSupply(mealId: MealId, written: string): Supply {
  return { mealId, count: readCount(written) }
}

export function combinedSupply(kept: Supply | null, added: Supply): Supply {
  if (kept === null) return added
  const count = kept.count + added.count
  if (count > MAXIMUM_COUNT) throw new InvalidSupply('countTooLarge')
  return { mealId: added.mealId, count }
}

export function isFull(count: number): boolean {
  return count >= MAXIMUM_COUNT
}

export function withOneMore(supply: Supply): Supply {
  if (isFull(supply.count)) return supply
  return { ...supply, count: supply.count + 1 }
}

export function isLastPortion(count: number): boolean {
  return count <= 1
}

export function withOneLess(supply: Supply): Supply | null {
  if (isLastPortion(supply.count)) return null
  return { ...supply, count: supply.count - 1 }
}

export function supplyOf(
  supplies: readonly Supply[],
  mealId: MealId,
): Supply | null {
  return supplies.find((supply) => supply.mealId === mealId) ?? null
}

export function isInSupply(
  supplies: readonly Supply[],
  mealId: MealId,
): boolean {
  return supplyOf(supplies, mealId) !== null
}

export function withSupply(
  supplies: readonly Supply[],
  written: Supply,
): readonly Supply[] {
  if (supplyOf(supplies, written.mealId) === null) return [...supplies, written]
  return supplies.map((supply) =>
    supply.mealId === written.mealId ? written : supply,
  )
}

export function withoutSupply(
  supplies: readonly Supply[],
  mealId: MealId,
): readonly Supply[] {
  return supplies.filter((supply) => supply.mealId !== mealId)
}

export function suppliedMeals(
  supplies: readonly Supply[],
  meals: readonly Meal[],
): readonly SuppliedMeal[] {
  return byName(meals)
    .map((meal) => ({ meal, count: supplyOf(supplies, meal.id)?.count ?? 0 }))
    .filter((supplied) => supplied.count > 0)
}
