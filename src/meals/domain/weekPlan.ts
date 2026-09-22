import type { Meal, MealId } from './meal'
import { isInSupply, type Supply } from './supply'

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export type WeekPlan = Readonly<Record<Weekday, MealId | null>>

export const EMPTY_WEEK_PLAN: WeekPlan = Object.fromEntries(
  WEEKDAYS.map((day) => [day, null]),
) as WeekPlan

export function withMealOnDay(
  plan: WeekPlan,
  day: Weekday,
  id: MealId | null,
): WeekPlan {
  return { ...plan, [day]: id }
}

export function shownMealOn(
  plan: WeekPlan,
  day: Weekday,
  meals: readonly Meal[],
): Meal | null {
  return meals.find((meal) => meal.id === plan[day]) ?? null
}

export function isSuppliedOn(
  plan: WeekPlan,
  day: Weekday,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): boolean {
  const planned = shownMealOn(plan, day, meals)
  return planned !== null && isInSupply(supplies, planned.id)
}

export function plannedMeals(
  plan: WeekPlan,
  meals: readonly Meal[],
): readonly Meal[] {
  return WEEKDAYS.map((day) => shownMealOn(plan, day, meals)).filter(
    (meal): meal is Meal => meal !== null,
  )
}

export function plannedDayCount(
  plan: WeekPlan,
  meals: readonly Meal[],
): number {
  return plannedMeals(plan, meals).length
}

export function mealsWithoutItems(planned: readonly Meal[]): readonly Meal[] {
  return planned.filter(
    (meal, position) =>
      meal.items.length === 0 &&
      planned.findIndex((earlier) => earlier.id === meal.id) === position,
  )
}
