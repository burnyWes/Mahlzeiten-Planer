import type { Meal } from './meal'
import type { Supply } from './supply'
import {
  isSuppliedIn,
  sameSlot,
  shownMealIn,
  type PlanSlot,
  type WeekPlan,
} from './weekPlan'

export type WeekPlanStage =
  | { mode: 'editing' }
  | { mode: 'reading'; coveredSlots: readonly PlanSlot[] | null }

export const EDITING_STAGE: WeekPlanStage = { mode: 'editing' }
export const FIXED_STAGE: WeekPlanStage = {
  mode: 'reading',
  coveredSlots: null,
}

export function transferredStage(
  coveredSlots: readonly PlanSlot[],
): WeekPlanStage {
  return { mode: 'reading', coveredSlots }
}

export function isFixed(stage: WeekPlanStage): boolean {
  return stage.mode === 'reading'
}

export function isTransferred(stage: WeekPlanStage): boolean {
  return stage.mode === 'reading' && stage.coveredSlots !== null
}

function includesSlot(slots: readonly PlanSlot[], slot: PlanSlot): boolean {
  return slots.some((each) => sameSlot(each, slot))
}

function sameSlots(
  one: readonly PlanSlot[] | null,
  other: readonly PlanSlot[] | null,
): boolean {
  if (one === null || other === null) return one === other
  return (
    one.length === other.length &&
    one.every((slot) => includesSlot(other, slot))
  )
}

export function sameStage(one: WeekPlanStage, other: WeekPlanStage): boolean {
  if (one.mode === 'editing' || other.mode === 'editing')
    return one.mode === other.mode
  return sameSlots(one.coveredSlots, other.coveredSlots)
}

export function canShuffle(stage: WeekPlanStage): boolean {
  return !isFixed(stage)
}

export function canTransfer(
  stage: WeekPlanStage,
  plannedMeals: number,
): boolean {
  return isFixed(stage) && !isTransferred(stage) && plannedMeals > 0
}

export function canClear(stage: WeekPlanStage, plannedMeals: number): boolean {
  return !isFixed(stage) && plannedMeals > 0
}

export function isCoveredIn(
  stage: WeekPlanStage,
  plan: WeekPlan,
  slot: PlanSlot,
  meals: readonly Meal[],
  supplies: readonly Supply[],
): boolean {
  if (stage.mode === 'reading' && stage.coveredSlots !== null)
    return (
      includesSlot(stage.coveredSlots, slot) &&
      shownMealIn(plan, slot, meals) !== null
    )
  return isSuppliedIn(plan, slot, meals, supplies)
}
