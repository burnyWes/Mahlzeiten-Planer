import type { Meal, MealId } from './meal'
import { daysAfter, WEEKDAYS, type PlanDate, type Weekday } from './planDate'
import {
  datesOf,
  includesDate,
  samePeriod,
  type PlanPeriod,
} from './planPeriod'
import { supplyOf, withSupply, type Supply } from './supply'

export { WEEKDAYS, type Weekday } from './planDate'

export const MEAL_TIMES = ['breakfast', 'lunch', 'snack', 'dinner'] as const

export type MealTime = (typeof MEAL_TIMES)[number]

export type PlanSlot = { date: PlanDate; time: MealTime }

export type DayPlan = Readonly<Record<MealTime, MealId | null>>

export type WeekPlan = {
  readonly period: PlanPeriod
  readonly days: Readonly<Partial<Record<PlanDate, DayPlan>>>
}

const EMPTY_DAY_PLAN: DayPlan = Object.fromEntries(
  MEAL_TIMES.map((time) => [time, null]),
) as DayPlan

export function planSlotsOf(period: PlanPeriod): readonly PlanSlot[] {
  return datesOf(period).flatMap((date) =>
    MEAL_TIMES.map((time) => ({ date, time })),
  )
}

function dayPlanOf(plan: WeekPlan, date: PlanDate): DayPlan {
  return plan.days[date] ?? EMPTY_DAY_PLAN
}

function withDays(
  period: PlanPeriod,
  dayPlanOn: (date: PlanDate) => DayPlan,
): WeekPlan {
  return {
    period,
    days: Object.fromEntries(
      datesOf(period).map((date) => [date, dayPlanOn(date)]),
    ),
  }
}

export function emptyWeekPlan(period: PlanPeriod): WeekPlan {
  return withDays(period, () => EMPTY_DAY_PLAN)
}

export function emptied(plan: WeekPlan): WeekPlan {
  return emptyWeekPlan(plan.period)
}

export function slotCountOf(plan: WeekPlan): number {
  return planSlotsOf(plan.period).length
}

export function dateOfWeekday(week: PlanPeriod, day: Weekday): PlanDate {
  return daysAfter(week.start, WEEKDAYS.indexOf(day))
}

export function weekPlanFromWeekdays(
  weekdays: Readonly<Record<Weekday, DayPlan>>,
  week: PlanPeriod,
): WeekPlan {
  return WEEKDAYS.reduce(
    (plan, day) => ({
      ...plan,
      days: { ...plan.days, [dateOfWeekday(week, day)]: weekdays[day] },
    }),
    emptyWeekPlan(week),
  )
}

export function sameSlot(one: PlanSlot, other: PlanSlot): boolean {
  return one.date === other.date && one.time === other.time
}

export function mealIn(plan: WeekPlan, slot: PlanSlot): MealId | null {
  return plan.days[slot.date]?.[slot.time] ?? null
}

export function withMealIn(
  plan: WeekPlan,
  slot: PlanSlot,
  id: MealId | null,
): WeekPlan {
  if (!includesDate(plan.period, slot.date)) return plan
  return {
    ...plan,
    days: {
      ...plan.days,
      [slot.date]: { ...dayPlanOf(plan, slot.date), [slot.time]: id },
    },
  }
}

export function sameWeekPlan(one: WeekPlan, other: WeekPlan): boolean {
  return (
    samePeriod(one.period, other.period) &&
    planSlotsOf(one.period).every(
      (slot) => mealIn(one, slot) === mealIn(other, slot),
    )
  )
}

export function shownMealIn(
  plan: WeekPlan,
  slot: PlanSlot,
  meals: readonly Meal[],
): Meal | null {
  return meals.find((meal) => meal.id === mealIn(plan, slot)) ?? null
}

function slotsBefore(plan: WeekPlan, slot: PlanSlot): readonly PlanSlot[] {
  const slots = planSlotsOf(plan.period)
  return slots.slice(
    0,
    slots.findIndex((each) => sameSlot(each, slot)),
  )
}

function timesPlannedBefore(
  plan: WeekPlan,
  slot: PlanSlot,
  mealId: MealId,
): number {
  return slotsBefore(plan, slot).filter(
    (earlier) => mealIn(plan, earlier) === mealId,
  ).length
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
  return planSlotsOf(plan.period).flatMap((slot) => {
    const meal = shownMealIn(plan, slot, meals)
    return meal === null ? [] : [{ slot, meal }]
  })
}

export function coveredSlotsOf(
  plan: WeekPlan,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): readonly PlanSlot[] {
  return planSlotsOf(plan.period).filter((slot) =>
    isSuppliedIn(plan, slot, meals, supplies),
  )
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
