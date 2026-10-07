import { describe, expect, it } from 'vitest'
import {
  leftoverSlotAfter,
  leftoversRolledAfter,
  rolledInto,
  withLeftoversIn,
} from './leftovers'
import type { Meal } from './meal'
import { toPlanDate, type PlanDate } from './planDate'
import type { PlanPeriod } from './planPeriod'
import type { RollingRules } from './randomPlanning'
import type { Supply } from './supply'
import {
  emptyWeekPlan,
  isLeftoverIn,
  mealIn,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
} from './weekPlan'

const MONDAY = toPlanDate('2026-09-21')
const TUESDAY = toPlanDate('2026-09-22')
const WEDNESDAY = toPlanDate('2026-09-23')
const SUNDAY = toPlanDate('2026-09-27')

const WEEK: PlanPeriod = { start: MONDAY, days: 7 }
const EMPTY_PLAN = emptyWeekPlan(WEEK)

const PLANNING_LEFTOVERS: RollingRules = {
  mainMealTime: 'lunchOrDinner',
  plansLeftovers: true,
}

const NOT_PLANNING_LEFTOVERS: RollingRules = {
  mainMealTime: 'lunchOrDinner',
  plansLeftovers: false,
}

function meal(id: string, leftovers: boolean): Meal {
  return {
    id,
    name: id,
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'mainMeal',
    leftovers,
  }
}

const bolognese = meal('bolognese', true)
const chili = meal('chili', true)
const pizza = meal('pizza', false)
const knownMeals = [bolognese, chili, pizza]

function slot(date: PlanDate, time: MealTime): PlanSlot {
  return { date, time }
}

function rolled(
  plan: WeekPlan,
  rolledSlot: PlanSlot,
  rolledMeal: Meal,
  supplies: readonly Supply[] = [],
  rules: RollingRules = PLANNING_LEFTOVERS,
): WeekPlan {
  return rolledInto(plan, rolledSlot, rolledMeal, knownMeals, supplies, rules)
}

describe('leftoverSlotAfter', () => {
  it('finds the same time on the next day', () => {
    expect(leftoverSlotAfter(EMPTY_PLAN, slot(MONDAY, 'dinner'))).toEqual(
      slot(TUESDAY, 'dinner'),
    )
  })

  it('finds nothing after the last day of the period', () => {
    expect(leftoverSlotAfter(EMPTY_PLAN, slot(SUNDAY, 'dinner'))).toBeNull()
  })
})

describe('withLeftoversIn', () => {
  it('plans the meal as leftovers in the slot', () => {
    const plan = withLeftoversIn(EMPTY_PLAN, slot(TUESDAY, 'dinner'), 'pizza')

    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBe('pizza')
    expect(isLeftoverIn(plan, slot(TUESDAY, 'dinner'))).toBe(true)
  })
})

describe('rolledInto', () => {
  it('plans the rolled meal in its slot', () => {
    const plan = rolled(EMPTY_PLAN, slot(MONDAY, 'dinner'), pizza)

    expect(mealIn(plan, slot(MONDAY, 'dinner'))).toBe('pizza')
  })

  it('plans the leftovers at the same time on the next day', () => {
    const plan = rolled(EMPTY_PLAN, slot(MONDAY, 'dinner'), bolognese)

    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('plans no leftovers for a meal that leaves none', () => {
    const plan = rolled(EMPTY_PLAN, slot(MONDAY, 'dinner'), pizza)

    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBeNull()
    expect(plan.leftoverSlots).toEqual([])
  })

  it('plans no leftovers while the household does not want them', () => {
    const plan = rolled(
      EMPTY_PLAN,
      slot(MONDAY, 'dinner'),
      bolognese,
      [],
      NOT_PLANNING_LEFTOVERS,
    )

    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBeNull()
    expect(plan.leftoverSlots).toEqual([])
  })

  it('plans no leftovers on the last day of the period', () => {
    const plan = rolled(EMPTY_PLAN, slot(SUNDAY, 'dinner'), bolognese)

    expect(plan.leftoverSlots).toEqual([])
  })

  it('plans no leftovers when the meal comes out of the supply', () => {
    const plan = rolled(EMPTY_PLAN, slot(MONDAY, 'dinner'), bolognese, [
      { mealId: 'bolognese', count: 1 },
    ])

    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBeNull()
    expect(plan.leftoverSlots).toEqual([])
  })

  it('overwrites a meal planned on the next day', () => {
    const plan = rolled(
      withMealIn(EMPTY_PLAN, slot(TUESDAY, 'dinner'), 'pizza'),
      slot(MONDAY, 'dinner'),
      bolognese,
    )

    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('overwrites leftovers planned on the next day', () => {
    const plan = rolled(
      withLeftoversIn(EMPTY_PLAN, slot(TUESDAY, 'dinner'), 'chili'),
      slot(MONDAY, 'dinner'),
      bolognese,
    )

    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('turns the leftovers of an overwritten original into an ordinary slot', () => {
    const chiliOnTuesday = withLeftoversIn(
      withMealIn(EMPTY_PLAN, slot(TUESDAY, 'dinner'), 'chili'),
      slot(WEDNESDAY, 'dinner'),
      'chili',
    )

    const plan = rolled(chiliOnTuesday, slot(MONDAY, 'dinner'), bolognese)

    expect(mealIn(plan, slot(WEDNESDAY, 'dinner'))).toBe('chili')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('keeps the meal on the next day when the original is rolled again without leftovers', () => {
    const plan = rolled(
      rolled(EMPTY_PLAN, slot(MONDAY, 'dinner'), bolognese),
      slot(MONDAY, 'dinner'),
      pizza,
    )

    expect(mealIn(plan, slot(MONDAY, 'dinner'))).toBe('pizza')
    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([])
  })
})

describe('leftoversRolledAfter', () => {
  it('finds the leftovers that a rolled meal left on the next day', () => {
    const plan = rolled(EMPTY_PLAN, slot(MONDAY, 'dinner'), bolognese)

    expect(leftoversRolledAfter(plan, slot(MONDAY, 'dinner'))).toEqual(
      slot(TUESDAY, 'dinner'),
    )
  })

  it('finds nothing when the meal left no leftovers', () => {
    const plan = rolled(EMPTY_PLAN, slot(MONDAY, 'dinner'), pizza)

    expect(leftoversRolledAfter(plan, slot(MONDAY, 'dinner'))).toBeNull()
  })

  it('finds nothing when the next day holds leftovers of another meal', () => {
    const plan = withLeftoversIn(
      withMealIn(EMPTY_PLAN, slot(MONDAY, 'dinner'), 'pizza'),
      slot(TUESDAY, 'dinner'),
      'chili',
    )

    expect(leftoversRolledAfter(plan, slot(MONDAY, 'dinner'))).toBeNull()
  })

  it('finds nothing after the last day of the period', () => {
    expect(leftoversRolledAfter(EMPTY_PLAN, slot(SUNDAY, 'dinner'))).toBeNull()
  })
})
