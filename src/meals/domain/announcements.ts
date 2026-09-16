import {
  InvalidQuantity,
  invalidQuantityMessage,
} from '../../shared/domain/quantity'
import {
  formatMealItem,
  InvalidMeal,
  type InvalidMealReason,
  type MealItem,
  type NewMeal,
} from './meal'

const messagesByReason: Record<InvalidMealReason, string> = {
  nameMissing: 'Bitte einen Namen eingeben.',
  nameTooLong: 'Der Name ist zu lang.',
  textTooLong: 'Der Text ist zu lang.',
}

export function invalidMealMessage(reason: InvalidMealReason): string {
  return messagesByReason[reason]
}

export function mealFailureMessage(error: unknown): string | null {
  if (error instanceof InvalidMeal) return invalidMealMessage(error.reason)
  if (error instanceof InvalidQuantity)
    return invalidQuantityMessage(error.reason)
  return null
}

export function mealsHeading(mealCount: number): string {
  return mealCount === 0 ? 'Gerichte, keine' : `Gerichte, ${mealCount}`
}

export function mealItemsHeading(itemCount: number): string {
  return itemCount === 0
    ? 'Einkaufs-Items, keine'
    : `Einkaufs-Items, ${itemCount}`
}

export function mealItemAddedAnnouncement(item: MealItem): string {
  return `${formatMealItem(item)} als Item übernommen.`
}

function remainingItemPhrase(remainingItems: number): string {
  if (remainingItems === 0) return 'keine Items mehr'
  return remainingItems === 1 ? 'noch 1 Item' : `noch ${remainingItems} Items`
}

export function mealItemRemovedAnnouncement(
  item: MealItem,
  remainingItems: number,
): string {
  return `${item.name} entfernt, ${remainingItemPhrase(remainingItems)}.`
}

export function mealSavedAnnouncement(meal: NewMeal): string {
  return `${meal.name} gespeichert.`
}

export function mealWithoutItemsAnnouncement(meal: NewMeal): string {
  return `${meal.name} hat keine Einkaufs-Items.`
}
