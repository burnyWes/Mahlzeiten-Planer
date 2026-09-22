import type { Meal, MealId } from './meal'
import { supplyOf, type Supply } from './supply'

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

function timesPlannedBefore(
  plan: WeekPlan,
  day: Weekday,
  mealId: MealId,
): number {
  return WEEKDAYS.slice(0, WEEKDAYS.indexOf(day)).filter(
    (earlier) => plan[earlier] === mealId,
  ).length
}

export function isSuppliedOn(
  plan: WeekPlan,
  day: Weekday,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): boolean {
  const planned = shownMealOn(plan, day, meals)
  if (planned === null) return false
  const supply = supplyOf(supplies, planned.id)
  return (
    supply !== null && timesPlannedBefore(plan, day, planned.id) < supply.count
  )
}

type PlannedDay = {
  day: Weekday
  meal: Meal
}

function plannedDays(
  plan: WeekPlan,
  meals: readonly Meal[],
): readonly PlannedDay[] {
  return WEEKDAYS.flatMap((day) => {
    const meal = shownMealOn(plan, day, meals)
    return meal === null ? [] : [{ day, meal }]
  })
}

export function plannedMeals(
  plan: WeekPlan,
  meals: readonly Meal[],
): readonly Meal[] {
  return plannedDays(plan, meals).map(({ meal }) => meal)
}

export type WeekPlanTransfer = {
  mealsToBuy: readonly Meal[]
  suppliedDays: number
}

export function weekPlanTransfer(
  plan: WeekPlan,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): WeekPlanTransfer {
  const days = plannedDays(plan, meals)
  const toBuy = days.filter(
    ({ day }) => !isSuppliedOn(plan, day, meals, supplies),
  )
  return {
    mealsToBuy: toBuy.map(({ meal }) => meal),
    suppliedDays: days.length - toBuy.length,
  }
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
