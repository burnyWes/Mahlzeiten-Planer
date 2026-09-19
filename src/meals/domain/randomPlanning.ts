import type { Meal } from './meal'
import {
  EMPTY_WEEK_PLAN,
  WEEKDAYS,
  withMealOnDay,
  type WeekPlan,
  type Weekday,
} from './weekPlan'

export type RandomSource = () => number

export type PlanningRule = (
  candidates: readonly Meal[],
  plan: WeekPlan,
  day: Weekday,
) => readonly Meal[]

function timesPlanned(plan: WeekPlan, meal: Meal): number {
  return WEEKDAYS.filter((day) => plan[day] === meal.id).length
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
  day: Weekday,
): readonly Meal[] {
  return rules.reduce((left, rule) => {
    const narrowed = rule(left, plan, day)
    return narrowed.length === 0 ? left : narrowed
  }, candidates)
}

export function pickMealForDay(
  candidates: readonly Meal[],
  plan: WeekPlan,
  day: Weekday,
  random: RandomSource,
): Meal | null {
  if (candidates.length === 0) return null
  const left = narrowedBy(PLANNING_RULES, candidates, plan, day)
  return left[Math.min(Math.floor(random() * left.length), left.length - 1)]
}

export function filledWeekPlan(
  candidates: readonly Meal[],
  random: RandomSource,
): WeekPlan {
  return WEEKDAYS.reduce((plan, day) => {
    const picked = pickMealForDay(candidates, plan, day, random)
    return picked === null ? plan : withMealOnDay(plan, day, picked.id)
  }, EMPTY_WEEK_PLAN)
}
