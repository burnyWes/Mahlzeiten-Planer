import type { MealId } from './meal'
import { sameSlot, type PlanSlot } from './weekPlan'

export type RollMemory = readonly {
  slot: PlanSlot
  meals: readonly MealId[]
}[]

export const EMPTY_ROLL_MEMORY: RollMemory = []

export function rolledAt(
  memory: RollMemory,
  slot: PlanSlot,
): readonly MealId[] {
  return memory.find((each) => sameSlot(each.slot, slot))?.meals ?? []
}

export type RememberedRoll = { memory: RollMemory; startedOver: boolean }

function withoutDoubles(meals: readonly MealId[]): readonly MealId[] {
  return [...new Set(meals)]
}

export function rememberedRoll(
  memory: RollMemory,
  slot: PlanSlot,
  replaced: MealId | null,
  rolled: MealId,
): RememberedRoll {
  const rolledBefore = rolledAt(memory, slot)
  const startedOver = rolledBefore.includes(rolled) || rolled === replaced
  const keptBefore = startedOver ? [] : rolledBefore
  const meals = withoutDoubles([
    ...keptBefore,
    ...(replaced === null ? [] : [replaced]),
    rolled,
  ])
  return {
    memory: [
      ...memory.filter((each) => !sameSlot(each.slot, slot)),
      { slot, meals },
    ],
    startedOver,
  }
}
