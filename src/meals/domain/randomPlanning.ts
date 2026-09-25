import type { Meal } from './meal'
import {
  EMPTY_WEEK_PLAN,
  mealIn,
  PLAN_SLOTS,
  withMealIn,
  type PlanSlot,
  type WeekPlan,
} from './weekPlan'

export type RandomSource = () => number

export type PlanningRule = (
  candidates: readonly Meal[],
  plan: WeekPlan,
  slot: PlanSlot,
) => readonly Meal[]

export function randomCandidates(meals: readonly Meal[]): readonly Meal[] {
  return meals.filter((meal) => !meal.hidden)
}

function timesPlanned(plan: WeekPlan, meal: Meal): number {
  return PLAN_SLOTS.filter((slot) => mealIn(plan, slot) === meal.id).length
}

export const rarestInThePlan: PlanningRule = (candidates, plan) => {
  const fewest = Math.min(...candidates.map((meal) => timesPlanned(plan, meal)))
  return candidates.filter((meal) => timesPlanned(plan, meal) === fewest)
}

export const PLANNING_RULES: readonly PlanningRule[] = [rarestInThePlan]

export function narrowedBy(
  rules: readonly PlanningRule[],
  candidates: readonly Meal[],
  plan: WeekPlan,
  slot: PlanSlot,
): readonly Meal[] {
  return rules.reduce((left, rule) => {
    const narrowed = rule(left, plan, slot)
    return narrowed.length === 0 ? left : narrowed
  }, candidates)
}

export function pickMealFor(
  candidates: readonly Meal[],
  plan: WeekPlan,
  slot: PlanSlot,
  random: RandomSource,
): Meal | null {
  if (candidates.length === 0) return null
  const left = narrowedBy(PLANNING_RULES, candidates, plan, slot)
  return left[Math.min(Math.floor(random() * left.length), left.length - 1)]
}

export function filledWeekPlan(
  candidates: readonly Meal[],
  random: RandomSource,
): WeekPlan {
  return PLAN_SLOTS.reduce((plan, slot) => {
    const picked = pickMealFor(candidates, plan, slot, random)
    return picked === null ? plan : withMealIn(plan, slot, picked.id)
  }, EMPTY_WEEK_PLAN)
}
