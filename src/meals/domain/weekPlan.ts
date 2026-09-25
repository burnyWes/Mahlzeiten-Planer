import type { Meal, MealId } from './meal'
import { supplyOf, withSupply, type Supply } from './supply'

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

export const MEAL_TIMES = ['breakfast', 'lunch', 'snack', 'dinner'] as const

export type MealTime = (typeof MEAL_TIMES)[number]

export type PlanSlot = { day: Weekday; time: MealTime }

export const PLAN_SLOTS: readonly PlanSlot[] = WEEKDAYS.flatMap((day) =>
  MEAL_TIMES.map((time) => ({ day, time })),
)

export type DayPlan = Readonly<Record<MealTime, MealId | null>>

export type WeekPlan = Readonly<Record<Weekday, DayPlan>>

const EMPTY_DAY_PLAN: DayPlan = Object.fromEntries(
  MEAL_TIMES.map((time) => [time, null]),
) as DayPlan

export const EMPTY_WEEK_PLAN: WeekPlan = Object.fromEntries(
  WEEKDAYS.map((day) => [day, EMPTY_DAY_PLAN]),
) as WeekPlan

export function weekdayBefore(day: Weekday): Weekday | null {
  return WEEKDAYS[WEEKDAYS.indexOf(day) - 1] ?? null
}

export function weekdayAfter(day: Weekday): Weekday | null {
  return WEEKDAYS[WEEKDAYS.indexOf(day) + 1] ?? null
}

export function sameSlot(one: PlanSlot, other: PlanSlot): boolean {
  return one.day === other.day && one.time === other.time
}

export function mealIn(plan: WeekPlan, slot: PlanSlot): MealId | null {
  return plan[slot.day][slot.time]
}

export function withMealIn(
  plan: WeekPlan,
  slot: PlanSlot,
  id: MealId | null,
): WeekPlan {
  return { ...plan, [slot.day]: { ...plan[slot.day], [slot.time]: id } }
}

export function sameWeekPlan(one: WeekPlan, other: WeekPlan): boolean {
  return PLAN_SLOTS.every((slot) => mealIn(one, slot) === mealIn(other, slot))
}

export function shownMealIn(
  plan: WeekPlan,
  slot: PlanSlot,
  meals: readonly Meal[],
): Meal | null {
  return meals.find((meal) => meal.id === mealIn(plan, slot)) ?? null
}

function slotsBefore(slot: PlanSlot): readonly PlanSlot[] {
  return PLAN_SLOTS.slice(
    0,
    PLAN_SLOTS.findIndex((each) => sameSlot(each, slot)),
  )
}

function timesPlannedBefore(
  plan: WeekPlan,
  slot: PlanSlot,
  mealId: MealId,
): number {
  return slotsBefore(slot).filter((earlier) => mealIn(plan, earlier) === mealId)
    .length
}

export function isSuppliedIn(
  plan: WeekPlan,
  slot: PlanSlot,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): boolean {
  const planned = shownMealIn(plan, slot, meals)
  if (planned === null) return false
  const supply = supplyOf(supplies, planned.id)
  return (
    supply !== null && timesPlannedBefore(plan, slot, planned.id) < supply.count
  )
}

type PlannedSlot = {
  slot: PlanSlot
  meal: Meal
}

function plannedSlots(
  plan: WeekPlan,
  meals: readonly Meal[],
): readonly PlannedSlot[] {
  return PLAN_SLOTS.flatMap((slot) => {
    const meal = shownMealIn(plan, slot, meals)
    return meal === null ? [] : [{ slot, meal }]
  })
}

export function coveredSlotsOf(
  plan: WeekPlan,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): readonly PlanSlot[] {
  return PLAN_SLOTS.filter((slot) => isSuppliedIn(plan, slot, meals, supplies))
}

export function plannedMeals(
  plan: WeekPlan,
  meals: readonly Meal[],
): readonly Meal[] {
  return plannedSlots(plan, meals).map(({ meal }) => meal)
}

export type WeekPlanTransfer = {
  mealsToBuy: readonly Meal[]
  spentSupplies: readonly Supply[]
}

function portionsPerMeal(planned: readonly PlannedSlot[]): readonly Supply[] {
  return planned.reduce<readonly Supply[]>((spent, { meal }) => {
    const counted = supplyOf(spent, meal.id)
    return counted === null
      ? [...spent, { mealId: meal.id, count: 1 }]
      : withSupply(spent, { mealId: meal.id, count: counted.count + 1 })
  }, [])
}

export function weekPlanTransfer(
  plan: WeekPlan,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): WeekPlanTransfer {
  const planned = plannedSlots(plan, meals)
  const coveredSlots = coveredSlotsOf(plan, meals, supplies)
  const isCovered = ({ slot }: PlannedSlot) =>
    coveredSlots.some((covered) => sameSlot(covered, slot))
  return {
    mealsToBuy: planned
      .filter((each) => !isCovered(each))
      .map(({ meal }) => meal),
    spentSupplies: portionsPerMeal(planned.filter(isCovered)),
  }
}

export function suppliedMealCount(transfer: WeekPlanTransfer): number {
  return transfer.spentSupplies.reduce(
    (suppliedMeals, spent) => suppliedMeals + spent.count,
    0,
  )
}

export function plannedMealCount(
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
