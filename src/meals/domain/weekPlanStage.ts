import type { Weekday } from './weekPlan'

export type WeekPlanStage =
  | { mode: 'editing' }
  | { mode: 'reading'; coveredDays: readonly Weekday[] | null }

export const EDITING_STAGE: WeekPlanStage = { mode: 'editing' }
export const FIXED_STAGE: WeekPlanStage = { mode: 'reading', coveredDays: null }

export function isFixed(stage: WeekPlanStage): boolean {
  return stage.mode === 'reading'
}

export function canShuffle(stage: WeekPlanStage): boolean {
  return !isFixed(stage)
}

export function canTransfer(
  stage: WeekPlanStage,
  plannedDays: number,
): boolean {
  return isFixed(stage) && plannedDays > 0
}
