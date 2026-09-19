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
import { WEEKDAYS, type Weekday } from './weekPlan'

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

function remainingMealPhrase(remainingMeals: number): string {
  if (remainingMeals === 0) return 'keine Gerichte mehr'
  return remainingMeals === 1
    ? 'noch 1 Gericht'
    : `noch ${remainingMeals} Gerichte`
}

export function mealDeletedAnnouncement(
  meal: NewMeal,
  remainingMeals: number,
): string {
  return `${meal.name} gelöscht, ${remainingMealPhrase(remainingMeals)}.`
}

export function mealWithoutItemsAnnouncement(meal: NewMeal): string {
  return `${meal.name} hat keine Einkaufs-Items.`
}

const weekdayNames: Record<Weekday, string> = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
}

export function weekdayName(day: Weekday): string {
  return weekdayNames[day]
}

export function weekdayAbbreviation(day: Weekday): string {
  return `${weekdayName(day).slice(0, 2)}.`
}

export function weekPlanHeading(plannedDays: number): string {
  return plannedDays === 0
    ? `Wochenplan, keine von ${WEEKDAYS.length}`
    : `Wochenplan, ${plannedDays} von ${WEEKDAYS.length}`
}

export function randomMealLabel(day: Weekday): string {
  return `Zufallsgericht für ${weekdayName(day)}`
}

export function dayPlannedAnnouncement(day: Weekday, meal: NewMeal): string {
  return `${weekdayName(day)}, ${meal.name}.`
}

export function weekPlanShuffledAnnouncement(): string {
  return `Wochenplan neu gewürfelt, ${WEEKDAYS.length} Gerichte.`
}

export function weekPlanTransferAnnouncement(
  additions: string,
  mealsWithoutItems: readonly NewMeal[],
): string {
  const hints = mealsWithoutItems.map(mealWithoutItemsAnnouncement)
  if (additions === '') return hints.join(' ')
  return [`Wochenplan, ${additions}`, ...hints].join(' ')
}
