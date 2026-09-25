import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import type { Supply } from './supply'
import { toPlanDate, type PlanDate } from './planDate'
import {
  emptyWeekPlan,
  withMealIn,
  type MealTime,
  type PlanSlot,
} from './weekPlan'
import {
  canClear,
  canShuffle,
  canTransfer,
  EDITING_STAGE,
  FIXED_STAGE,
  isCoveredIn,
  isFixed,
  isTransferred,
  sameStage,
  transferredStage,
} from './weekPlanStage'

function meal(id: string, name: string): Meal {
  return {
    id,
    name,
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'mainMeal',
  }
}

const bolognese = meal('bolognese', 'Bolognese')
const pizza = meal('pizza', 'Pizza')
const knownMeals = [bolognese, pizza]

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
}

const MONDAY = toPlanDate('2026-09-21')
const TUESDAY = toPlanDate('2026-09-22')
const FRIDAY = toPlanDate('2026-09-25')

function slot(date: PlanDate, time: MealTime): PlanSlot {
  return { date, time }
}

const mondayLunch = slot(MONDAY, 'lunch')
const mondayDinner = slot(MONDAY, 'dinner')
const tuesdayLunch = slot(TUESDAY, 'lunch')

const plan = withMealIn(
  withMealIn(
    withMealIn(
      emptyWeekPlan({ start: MONDAY, days: 7 }),
      mondayLunch,
      'bolognese',
    ),
    mondayDinner,
    'bolognese',
  ),
  tuesdayLunch,
  'pizza',
)

describe('EDITING_STAGE', () => {
  it('is not fixed', () => {
    expect(isFixed(EDITING_STAGE)).toBe(false)
  })

  it('allows rolling', () => {
    expect(canShuffle(EDITING_STAGE)).toBe(true)
  })

  it('offers no transfer however many meals are planned', () => {
    expect(canTransfer(EDITING_STAGE, 5)).toBe(false)
  })

  it('allows clearing once a meal is planned', () => {
    expect(canClear(EDITING_STAGE, 1)).toBe(true)
  })

  it('allows no clearing while no meal is planned', () => {
    expect(canClear(EDITING_STAGE, 0)).toBe(false)
  })
})

describe('FIXED_STAGE', () => {
  it('is fixed', () => {
    expect(isFixed(FIXED_STAGE)).toBe(true)
  })

  it('allows no rolling', () => {
    expect(canShuffle(FIXED_STAGE)).toBe(false)
  })

  it('offers the transfer once a meal is planned', () => {
    expect(canTransfer(FIXED_STAGE, 1)).toBe(true)
  })

  it('offers no transfer while no meal is planned', () => {
    expect(canTransfer(FIXED_STAGE, 0)).toBe(false)
  })

  it('allows no clearing however many meals are planned', () => {
    expect(canClear(FIXED_STAGE, 5)).toBe(false)
  })
})

describe('transferredStage', () => {
  it('stays fixed and keeps the covered slots', () => {
    const stage = transferredStage([mondayLunch])

    expect(stage).toEqual({ mode: 'reading', coveredSlots: [mondayLunch] })
    expect(isFixed(stage)).toBe(true)
  })

  it('counts as transferred', () => {
    expect(isTransferred(transferredStage([]))).toBe(true)
  })

  it('offers no second transfer', () => {
    expect(canTransfer(transferredStage([mondayLunch]), 5)).toBe(false)
  })

  it('allows no rolling', () => {
    expect(canShuffle(transferredStage([]))).toBe(false)
  })

  it('allows no clearing', () => {
    expect(canClear(transferredStage([]), 5)).toBe(false)
  })
})

describe('isTransferred', () => {
  it('is false while the plan is being edited', () => {
    expect(isTransferred(EDITING_STAGE)).toBe(false)
  })

  it('is false for a fixed plan before the transfer', () => {
    expect(isTransferred(FIXED_STAGE)).toBe(false)
  })
})

describe('isCoveredIn', () => {
  it('keeps a covered slot of the transfer although the supply is spent', () => {
    expect(
      isCoveredIn(
        transferredStage([mondayLunch]),
        plan,
        mondayLunch,
        knownMeals,
        [],
      ),
    ).toBe(true)
  })

  it('keeps an uncovered slot of the transfer although a supply arrived', () => {
    expect(
      isCoveredIn(
        transferredStage([mondayLunch]),
        plan,
        tuesdayLunch,
        knownMeals,
        [supply('pizza', 1)],
      ),
    ).toBe(false)
  })

  it('keeps the covered lunch of the transfer but not the dinner of that day', () => {
    const stage = transferredStage([mondayLunch])
    const supplies = [supply('bolognese', 2)]

    expect(isCoveredIn(stage, plan, mondayLunch, knownMeals, supplies)).toBe(
      true,
    )
    expect(isCoveredIn(stage, plan, mondayDinner, knownMeals, supplies)).toBe(
      false,
    )
  })

  it('drops a covered slot of the transfer whose meal is gone', () => {
    expect(
      isCoveredIn(
        transferredStage([mondayLunch]),
        plan,
        mondayLunch,
        [pizza],
        [],
      ),
    ).toBe(false)
  })

  it('follows the supply while the plan is being edited', () => {
    expect(
      isCoveredIn(EDITING_STAGE, plan, tuesdayLunch, knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(true)
    expect(isCoveredIn(EDITING_STAGE, plan, mondayLunch, knownMeals, [])).toBe(
      false,
    )
  })

  it('follows the supply on a fixed plan before the transfer', () => {
    expect(
      isCoveredIn(FIXED_STAGE, plan, mondayLunch, knownMeals, [
        supply('bolognese', 1),
      ]),
    ).toBe(true)
    expect(isCoveredIn(FIXED_STAGE, plan, mondayLunch, knownMeals, [])).toBe(
      false,
    )
  })
})

describe('sameStage', () => {
  it('holds for two stages that are being edited', () => {
    expect(sameStage(EDITING_STAGE, { mode: 'editing' })).toBe(true)
  })

  it('fails for an edited and a fixed stage', () => {
    expect(sameStage(EDITING_STAGE, FIXED_STAGE)).toBe(false)
  })

  it('fails for a fixed stage and its transfer', () => {
    expect(sameStage(FIXED_STAGE, transferredStage([]))).toBe(false)
  })

  it('holds for two transfers of the same slots', () => {
    expect(
      sameStage(
        transferredStage([mondayLunch, slot(FRIDAY, 'dinner')]),
        transferredStage([mondayLunch, slot(FRIDAY, 'dinner')]),
      ),
    ).toBe(true)
  })

  it('fails for two transfers of different days', () => {
    expect(
      sameStage(
        transferredStage([mondayLunch]),
        transferredStage([slot(FRIDAY, 'lunch')]),
      ),
    ).toBe(false)
  })

  it('fails for two transfers that cover different meal times of the same day', () => {
    expect(
      sameStage(
        transferredStage([mondayLunch]),
        transferredStage([mondayDinner]),
      ),
    ).toBe(false)
  })
})
