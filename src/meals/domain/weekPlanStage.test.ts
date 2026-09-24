import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import type { Supply } from './supply'
import { EMPTY_WEEK_PLAN, withMealOnDay } from './weekPlan'
import {
  canShuffle,
  canTransfer,
  EDITING_STAGE,
  FIXED_STAGE,
  isCoveredOn,
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

const plan = withMealOnDay(
  withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
  'tuesday',
  'pizza',
)

describe('EDITING_STAGE', () => {
  it('is not fixed', () => {
    expect(isFixed(EDITING_STAGE)).toBe(false)
  })

  it('allows rolling', () => {
    expect(canShuffle(EDITING_STAGE)).toBe(true)
  })

  it('offers no transfer however many days are planned', () => {
    expect(canTransfer(EDITING_STAGE, 5)).toBe(false)
  })
})

describe('FIXED_STAGE', () => {
  it('is fixed', () => {
    expect(isFixed(FIXED_STAGE)).toBe(true)
  })

  it('allows no rolling', () => {
    expect(canShuffle(FIXED_STAGE)).toBe(false)
  })

  it('offers the transfer once a day is planned', () => {
    expect(canTransfer(FIXED_STAGE, 1)).toBe(true)
  })

  it('offers no transfer while no day is planned', () => {
    expect(canTransfer(FIXED_STAGE, 0)).toBe(false)
  })
})

describe('transferredStage', () => {
  it('stays fixed and keeps the covered days', () => {
    const stage = transferredStage(['monday'])

    expect(stage).toEqual({ mode: 'reading', coveredDays: ['monday'] })
    expect(isFixed(stage)).toBe(true)
  })

  it('counts as transferred', () => {
    expect(isTransferred(transferredStage([]))).toBe(true)
  })

  it('offers no second transfer', () => {
    expect(canTransfer(transferredStage(['monday']), 5)).toBe(false)
  })

  it('allows no rolling', () => {
    expect(canShuffle(transferredStage([]))).toBe(false)
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

describe('isCoveredOn', () => {
  it('keeps a covered day of the transfer although the supply is spent', () => {
    expect(
      isCoveredOn(transferredStage(['monday']), plan, 'monday', knownMeals, []),
    ).toBe(true)
  })

  it('keeps an uncovered day of the transfer although a supply arrived', () => {
    expect(
      isCoveredOn(transferredStage(['monday']), plan, 'tuesday', knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(false)
  })

  it('drops a covered day of the transfer whose meal is gone', () => {
    expect(
      isCoveredOn(transferredStage(['monday']), plan, 'monday', [pizza], []),
    ).toBe(false)
  })

  it('follows the supply while the plan is being edited', () => {
    expect(
      isCoveredOn(EDITING_STAGE, plan, 'tuesday', knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(true)
    expect(isCoveredOn(EDITING_STAGE, plan, 'monday', knownMeals, [])).toBe(
      false,
    )
  })

  it('follows the supply on a fixed plan before the transfer', () => {
    expect(
      isCoveredOn(FIXED_STAGE, plan, 'monday', knownMeals, [
        supply('bolognese', 1),
      ]),
    ).toBe(true)
    expect(isCoveredOn(FIXED_STAGE, plan, 'monday', knownMeals, [])).toBe(false)
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

  it('holds for two transfers of the same days', () => {
    expect(
      sameStage(
        transferredStage(['monday', 'friday']),
        transferredStage(['monday', 'friday']),
      ),
    ).toBe(true)
  })

  it('fails for two transfers of different days', () => {
    expect(
      sameStage(transferredStage(['monday']), transferredStage(['friday'])),
    ).toBe(false)
  })
})
