import type { Meal, MealId } from './meal'
import { dateAfter } from './planPeriod'
import { appliesIn, type RollingMode, type RollingRules } from './rollingRules'
import type { Supply } from './supply'
import {
  isLeftoverIn,
  isSuppliedIn,
  mealIn,
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
    meal.leftovers &&
    leftoverSlot !== null &&
    !isSuppliedIn(planned, slot, meals, supplies)
  return leavesLeftovers
    ? withLeftoversIn(planned, leftoverSlot, meal.id)
    : planned
}
