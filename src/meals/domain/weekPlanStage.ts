import type { Meal } from './meal'
import type { Supply } from './supply'
import {
  isSuppliedOn,
  shownMealOn,
  type WeekPlan,
  type Weekday,
} from './weekPlan'

export type WeekPlanStage =
  | { mode: 'editing' }
  | { mode: 'reading'; coveredDays: readonly Weekday[] | null }

export const EDITING_STAGE: WeekPlanStage = { mode: 'editing' }
export const FIXED_STAGE: WeekPlanStage = { mode: 'reading', coveredDays: null }

export function transferredStage(
  coveredDays: readonly Weekday[],
): WeekPlanStage {
  return { mode: 'reading', coveredDays }
}

export function isFixed(stage: WeekPlanStage): boolean {
  return stage.mode === 'reading'
}

export function isTransferred(stage: WeekPlanStage): boolean {
  return stage.mode === 'reading' && stage.coveredDays !== null
}

function sameDays(
  one: readonly Weekday[] | null,
  other: readonly Weekday[] | null,
): boolean {
  if (one === null || other === null) return one === other
  return one.length === other.length && one.every((day) => other.includes(day))
}

export function sameStage(one: WeekPlanStage, other: WeekPlanStage): boolean {
  if (one.mode === 'editing' || other.mode === 'editing')
    return one.mode === other.mode
  return sameDays(one.coveredDays, other.coveredDays)
}

export function canShuffle(stage: WeekPlanStage): boolean {
  return !isFixed(stage)
}

export function canTransfer(
  stage: WeekPlanStage,
  plannedDays: number,
): boolean {
  return isFixed(stage) && !isTransferred(stage) && plannedDays > 0
}

export function isCoveredOn(
  stage: WeekPlanStage,
  plan: WeekPlan,
  day: Weekday,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): boolean {
  if (stage.mode === 'reading' && stage.coveredDays !== null)
    return (
      stage.coveredDays.includes(day) && shownMealOn(plan, day, meals) !== null
    )
  return isSuppliedOn(plan, day, meals, supplies)
}
