import type { Meal, MealId } from './meal'
import { dateAfter, dateBefore } from './planPeriod'
import { appliesIn, type RollingMode, type RollingRules } from './rollingRules'
import type { Supply } from './supply'
import {
  isLeftoverIn,
  isSuppliedIn,
  mealIn,
  shownMealIn,
  withMealIn,
  type PlanSlot,
  type WeekPlan,
} from './weekPlan'

export function leftoverSlotAfter(
  plan: WeekPlan,
  slot: PlanSlot,
): PlanSlot | null {
  const nextDate = dateAfter(plan.period, slot.date)
  return nextDate === null ? null : { date: nextDate, time: slot.time }
}

export function leftoverSlotBefore(
  plan: WeekPlan,
  slot: PlanSlot,
): PlanSlot | null {
  const previousDate = dateBefore(plan.period, slot.date)
  return previousDate === null ? null : { date: previousDate, time: slot.time }
}

export function leftoversRolledAfter(
  plan: WeekPlan,
  slot: PlanSlot,
): PlanSlot | null {
  const leftoverSlot = leftoverSlotAfter(plan, slot)
  if (leftoverSlot === null || !isLeftoverIn(plan, leftoverSlot)) return null
  return mealIn(plan, leftoverSlot) === mealIn(plan, slot) ? leftoverSlot : null
}

export function withLeftoversIn(
  plan: WeekPlan,
  slot: PlanSlot,
  id: MealId,
): WeekPlan {
  const planned = withMealIn(plan, slot, id)
  return { ...planned, leftoverSlots: [...planned.leftoverSlots, slot] }
}

function leavesLeftoversFrom(
  plan: WeekPlan,
  original: PlanSlot,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): boolean {
  const planned = shownMealIn(plan, original, meals)
  return (
    planned !== null &&
    planned.leftovers &&
    !isLeftoverIn(plan, original) &&
    !isSuppliedIn(plan, original, meals, supplies)
  )
}

export function rolledInto(
  plan: WeekPlan,
  slot: PlanSlot,
  meal: Meal,
  meals: readonly Meal[],
  supplies: readonly Supply[],
  rules: RollingRules,
  mode: RollingMode,
): WeekPlan {
  const planned = withMealIn(plan, slot, meal.id)
  const leftoverSlot = leftoverSlotAfter(planned, slot)
  const leavesLeftovers =
    appliesIn(rules, 'leftovers', mode) &&
    leftoverSlot !== null &&
    leavesLeftoversFrom(planned, slot, meals, supplies)
  return leavesLeftovers
    ? withLeftoversIn(planned, leftoverSlot, meal.id)
    : planned
}

function holdsMeal(
  plan: WeekPlan,
  slot: PlanSlot | null,
  id: MealId,
): slot is PlanSlot {
  return slot !== null && mealIn(plan, slot) === id
}

export function chosenInto(
  plan: WeekPlan,
  slot: PlanSlot,
  id: MealId | null,
  meals: readonly Meal[],
  supplies: readonly Supply[],
  rules: RollingRules,
): WeekPlan {
  const planned = withMealIn(plan, slot, id)
  if (id === null || !appliesIn(rules, 'leftovers', 'manualChoice'))
    return planned
  const before = leftoverSlotBefore(planned, slot)
  if (
    holdsMeal(planned, before, id) &&
    leavesLeftoversFrom(planned, before, meals, supplies)
  )
    return withLeftoversIn(planned, slot, id)
  const after = leftoverSlotAfter(planned, slot)
  if (
    holdsMeal(planned, after, id) &&
    leavesLeftoversFrom(planned, slot, meals, supplies)
  )
    return withLeftoversIn(planned, after, id)
  return planned
}
