import {
  InvalidQuantity,
  invalidQuantityMessage,
} from '../../shared/domain/quantity'
import {
  countHiddenMeals,
  formatMealItem,
  InvalidMeal,
  type ChosenMealKind,
  type InvalidMealReason,
  type MealItem,
  type MealKind,
  type NewMeal,
} from './meal'
import { CategoryAlreadyTaken, type CategoryOverview } from './mealCategory'
import { InvalidSupply, type InvalidSupplyReason } from './supply'
import { WEEKDAYS, type Weekday } from './weekPlan'

const messagesByReason: Record<InvalidMealReason, string> = {
  nameMissing: 'Bitte einen Namen eingeben.',
  nameTooLong: 'Der Name ist zu lang.',
  textTooLong: 'Der Text ist zu lang.',
}

const messagesBySupplyReason: Record<InvalidSupplyReason, string> = {
  mealUnknown: 'Dieses Gericht gibt es nicht.',
  countNotANumber: 'Die Anzahl muss eine Zahl sein.',
  countNotWhole: 'Die Anzahl muss eine ganze Zahl sein.',
  countNotPositive: 'Die Anzahl muss größer als null sein.',
  countTooLarge: 'Die Anzahl ist zu groß.',
}

export function invalidMealMessage(reason: InvalidMealReason): string {
  return messagesByReason[reason]
}

export function invalidSupplyMessage(reason: InvalidSupplyReason): string {
  return messagesBySupplyReason[reason]
}

export function mealFailureMessage(error: unknown): string | null {
  if (error instanceof InvalidMeal) return invalidMealMessage(error.reason)
  if (error instanceof InvalidSupply) return invalidSupplyMessage(error.reason)
  if (error instanceof CategoryAlreadyTaken)
    return `${error.category} ist schon eingetragen.`
  if (error instanceof InvalidQuantity)
    return invalidQuantityMessage(error.reason)
  return null
}

export function mealsHeading(
  meals: readonly NewMeal[],
  filteredFromCount: number | null = null,
): string {
  if (meals.length === 0) return 'Gerichte, keine'
  const count =
    filteredFromCount === null
      ? `${meals.length}`
      : `${meals.length} von ${filteredFromCount}`
  const hiddenCount = countHiddenMeals(meals)
  return hiddenCount === 0
    ? `Gerichte, ${count}`
    : `Gerichte, ${count} (${hiddenCount} ausgeblendet)`
}

export function shownMealsCount(
  shownCount: number,
  filteredFromCount: number | null,
): string {
  return filteredFromCount === null
    ? `${shownCount}`
    : `${shownCount} / ${filteredFromCount}`
}

export function categoryFilterAnnouncement(
  category: string,
  shownCount: number,
  totalCount: number,
): string {
  return `${category}, ${shownCount} von ${mealCountPhrase(totalCount)}.`
}

function mealTotalPhrase(mealCount: number): string {
  return mealCount === 1 ? '1 Gericht' : `${mealCount} Gerichte`
}

export function filterResetAnnouncement(totalCount: number): string {
  return `Filter zurückgesetzt, ${mealTotalPhrase(totalCount)}.`
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

export function mealCategoriesHeading(categoryCount: number): string {
  return categoryCount === 0
    ? 'Kategorien, keine'
    : `Kategorien, ${categoryCount}`
}

export function categoryAddedAnnouncement(category: string): string {
  return `${category} als Kategorie übernommen.`
}

function remainingCategoryPhrase(remainingCategories: number): string {
  if (remainingCategories === 0) return 'keine Kategorien mehr'
  return remainingCategories === 1
    ? 'noch 1 Kategorie'
    : `noch ${remainingCategories} Kategorien`
}

export function categoryRemovedAnnouncement(
  category: string,
  remainingCategories: number,
): string {
  return `${category} entfernt, ${remainingCategoryPhrase(remainingCategories)}.`
}

export function categoriesManagementHeading(categoryCount: number): string {
  return categoryCount === 0
    ? 'Kategorie-Verwaltung, keine'
    : `Kategorie-Verwaltung, ${categoryCount}`
}

export function categoryRowLabel(category: CategoryOverview): string {
  return `${category.name}, ${category.mealCount}`
}

function mealCountPhrase(mealCount: number): string {
  return mealCount === 1 ? '1 Gericht' : `${mealCount} Gerichten`
}

export function categoryDeletionNote(mealCount: number): string {
  return `Die Kategorie wird aus ${mealCountPhrase(mealCount)} entfernt. Die Gerichte selbst bleiben erhalten.`
}

export function categoryDeletedAnnouncement(
  category: string,
  remainingCategories: number,
): string {
  return `${category} gelöscht, ${remainingCategoryPhrase(remainingCategories)}.`
}

export function categorySavedAnnouncement(category: string): string {
  return `${category} gespeichert.`
}

export function mealSavedAnnouncement(meal: NewMeal): string {
  return `${meal.name} gespeichert.`
}

const mealKindNames: Record<ChosenMealKind, string> = {
  mainMeal: 'Hauptgericht',
  breakfast: 'Frühstück',
}

export function replacedKindAnnouncement(
  previous: MealKind,
  next: MealKind,
): string | null {
  if (previous === 'none' || next === 'none' || previous === next) return null
  return `${mealKindNames[previous]} abgewählt.`
}

export function hidingLabel(hidden: boolean): string {
  return hidden ? 'Einblenden' : 'Ausblenden'
}

export function mealNameLabel(meal: NewMeal): string {
  return meal.hidden ? `${meal.name}, ausgeblendet` : meal.name
}

export function mealHidingAnnouncement(meal: NewMeal, hidden: boolean): string {
  return hidden ? `${meal.name} ausgeblendet.` : `${meal.name} eingeblendet.`
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

export function weekdayFieldLabel(day: Weekday, inSupply: boolean): string {
  return inSupply ? `${weekdayName(day)}, im Vorrat` : weekdayName(day)
}

export function dayPlannedAnnouncement(
  day: Weekday,
  meal: NewMeal,
  inSupply: boolean,
): string {
  const planned = `${weekdayName(day)}, ${meal.name}`
  return inSupply ? `${planned}, im Vorrat.` : `${planned}.`
}

export function weekPlanShuffledAnnouncement(): string {
  return `Wochenplan neu gewürfelt, ${WEEKDAYS.length} Gerichte.`
}

function suppliedDayPhrase(suppliedDays: number): string {
  return suppliedDays === 1
    ? '1 Tag aus dem Vorrat entnommen.'
    : `${suppliedDays} Tage aus dem Vorrat entnommen.`
}

function additionsPhrase(additions: string): string {
  return additions === '' ? 'nichts hinzugefügt.' : additions
}

export function weekPlanTransferAnnouncement(
  additions: string,
  mealsWithoutItems: readonly NewMeal[],
  suppliedDays: number,
): string {
  const hints = mealsWithoutItems.map(mealWithoutItemsAnnouncement)
  if (suppliedDays === 0)
    return additions === ''
      ? hints.join(' ')
      : [`Wochenplan, ${additions}`, ...hints].join(' ')
  if (additions === '' && hints.length === 0)
    return 'Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.'
  return [
    `Wochenplan, ${additionsPhrase(additions)}`,
    suppliedDayPhrase(suppliedDays),
    ...hints,
  ].join(' ')
}

export function mealSuggestionsLabel(day: Weekday): string {
  return `Vorschläge für ${weekdayName(day)}`
}

export function suppliesHeading(supplyCount: number): string {
  return supplyCount === 0 ? 'Vorräte, keine' : `Vorräte, ${supplyCount}`
}

export function supplyAddedAnnouncement(
  meal: NewMeal,
  added: number,
  total: number,
): string {
  return added === total
    ? `${meal.name}, ${total}.`
    : `${meal.name}, ${added} dazu, jetzt ${total}.`
}

export function lessSupplyLabel(meal: NewMeal): string {
  return `Weniger, ${meal.name}`
}

export function moreSupplyLabel(meal: NewMeal): string {
  return `Mehr, ${meal.name}`
}

export function supplyChangedAnnouncement(
  meal: NewMeal,
  count: number,
): string {
  return `${meal.name}, ${count}.`
}

function remainingSupplyPhrase(remainingSupplies: number): string {
  if (remainingSupplies === 0) return 'keine Vorräte mehr'
  return remainingSupplies === 1
    ? 'noch 1 Vorrat'
    : `noch ${remainingSupplies} Vorräte`
}

export function supplyRemovedAnnouncement(
  meal: NewMeal,
  remainingSupplies: number,
): string {
  return `${meal.name} entfernt, ${remainingSupplyPhrase(remainingSupplies)}.`
}
