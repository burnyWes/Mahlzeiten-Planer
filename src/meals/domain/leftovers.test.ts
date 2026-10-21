import { describe, expect, it } from 'vitest'
import {
  chosenInto,
  leftoverSlotAfter,
  leftoverSlotBefore,
  leftoversRolledAfter,
  rolledInto,
  withLeftoversIn,
} from './leftovers'
import type { Meal, MealId } from './meal'
import { toPlanDate, type PlanDate } from './planDate'
import type { PlanPeriod } from './planPeriod'
import type { RollingMode, RollingRules } from './rollingRules'
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
const SATURDAY = toPlanDate('2026-09-26')
const SUNDAY = toPlanDate('2026-09-27')

const WEEK: PlanPeriod = { start: MONDAY, days: 7 }
const EMPTY_PLAN = emptyWeekPlan(WEEK)

const PLANNING_LEFTOVERS: RollingRules = {
  mainMealTime: 'lunchOrDinner',
  switchedOff: [],
}

const NOT_PLANNING_LEFTOVERS: RollingRules = {
  mainMealTime: 'lunchOrDinner',
  switchedOff: [
    { rule: 'leftovers', scope: 'singleMeal' },
    { rule: 'leftovers', scope: 'wholePlan' },
  ],
}

const NOT_PLANNING_LEFTOVERS_BY_HAND: RollingRules = {
  mainMealTime: 'lunchOrDinner',
  switchedOff: [{ rule: 'leftovers', scope: 'manualChoice' }],
}

function leftoversOnlyFor(mode: RollingMode): RollingRules {
  return {
    mainMealTime: 'lunchOrDinner',
    switchedOff: [
      {
        rule: 'leftovers',
        scope: mode === 'singleMeal' ? 'wholePlan' : 'singleMeal',
      },
    ],
  }
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
  mode: RollingMode = 'singleMeal',
): WeekPlan {
  return rolledInto(
    plan,
    rolledSlot,
    rolledMeal,
    knownMeals,
    supplies,
    rules,
    mode,
  )
}

function chosen(
  plan: WeekPlan,
  chosenSlot: PlanSlot,
  id: MealId | null,
  supplies: readonly Supply[] = [],
  rules: RollingRules = PLANNING_LEFTOVERS,
): WeekPlan {
  return chosenInto(plan, chosenSlot, id, knownMeals, supplies, rules)
}

function planWith(
  ...planned: readonly (readonly [PlanSlot, MealId])[]
): WeekPlan {
  return planned.reduce<WeekPlan>(
    (plan, [plannedSlot, id]) => withMealIn(plan, plannedSlot, id),
    EMPTY_PLAN,
  )
}

describe('leftoverSlotBefore', () => {
  it('finds the same time on the day before', () => {
    expect(leftoverSlotBefore(EMPTY_PLAN, slot(TUESDAY, 'dinner'))).toEqual(
      slot(MONDAY, 'dinner'),
    )
  })

  it('finds nothing before the first day of the period', () => {
    expect(leftoverSlotBefore(EMPTY_PLAN, slot(MONDAY, 'dinner'))).toBeNull()
  })
})

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

  it('plans leftovers only in the mode they are switched on for', () => {
    const modes = ['singleMeal', 'wholePlan'] as const

    modes.forEach((mode) => {
      const rules = leftoversOnlyFor(mode)
      const otherMode = mode === 'singleMeal' ? 'wholePlan' : 'singleMeal'

      expect(
        rolled(EMPTY_PLAN, slot(MONDAY, 'dinner'), bolognese, [], rules, mode)
          .leftoverSlots,
      ).toEqual([slot(TUESDAY, 'dinner')])
      expect(
        rolled(
          EMPTY_PLAN,
          slot(MONDAY, 'dinner'),
          bolognese,
          [],
          rules,
          otherMode,
        ).leftoverSlots,
      ).toEqual([])
    })
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

describe('chosenInto', () => {
  const mondayBolognese = planWith([slot(MONDAY, 'dinner'), 'bolognese'])
  const tuesdayBolognese = planWith([slot(TUESDAY, 'dinner'), 'bolognese'])

  it('makes leftovers of the meal chosen the day after the same meal', () => {
    const plan = chosen(mondayBolognese, slot(TUESDAY, 'dinner'), 'bolognese')

    expect(mealIn(plan, slot(TUESDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('makes leftovers of the next day when the same meal is chosen the day before', () => {
    const plan = chosen(tuesdayBolognese, slot(MONDAY, 'dinner'), 'bolognese')

    expect(mealIn(plan, slot(MONDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('makes no leftovers of a meal that leaves none', () => {
    const plan = chosen(
      planWith([slot(MONDAY, 'dinner'), 'pizza']),
      slot(TUESDAY, 'dinner'),
      'pizza',
    )

    expect(plan.leftoverSlots).toEqual([])
  })

  it('makes no leftovers at another time of the day', () => {
    const plan = chosen(
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      slot(TUESDAY, 'dinner'),
      'bolognese',
    )

    expect(plan.leftoverSlots).toEqual([])
  })

  it('makes no leftovers after another meal', () => {
    const plan = chosen(
      planWith([slot(MONDAY, 'dinner'), 'chili']),
      slot(TUESDAY, 'dinner'),
      'bolognese',
    )

    expect(plan.leftoverSlots).toEqual([])
  })

  it('makes no leftovers after a meal out of the supply', () => {
    const plan = chosen(mondayBolognese, slot(TUESDAY, 'dinner'), 'bolognese', [
      { mealId: 'bolognese', count: 1 },
    ])

    expect(plan.leftoverSlots).toEqual([])
  })

  it('makes no leftovers of the next day when the chosen meal comes out of the supply', () => {
    const plan = chosen(tuesdayBolognese, slot(MONDAY, 'dinner'), 'bolognese', [
      { mealId: 'bolognese', count: 1 },
    ])

    expect(plan.leftoverSlots).toEqual([])
  })

  it('makes no leftovers of leftovers', () => {
    const plan = chosen(
      withLeftoversIn(mondayBolognese, slot(TUESDAY, 'dinner'), 'bolognese'),
      slot(WEDNESDAY, 'dinner'),
      'bolognese',
    )

    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('takes the mark from the leftovers on the day after', () => {
    const plan = chosen(
      withLeftoversIn(mondayBolognese, slot(WEDNESDAY, 'dinner'), 'bolognese'),
      slot(TUESDAY, 'dinner'),
      'bolognese',
    )

    expect(mealIn(plan, slot(WEDNESDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('takes the mark from the leftovers after the new leftovers on the next day', () => {
    const plan = chosen(
      withLeftoversIn(tuesdayBolognese, slot(WEDNESDAY, 'dinner'), 'bolognese'),
      slot(MONDAY, 'dinner'),
      'bolognese',
    )

    expect(mealIn(plan, slot(WEDNESDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('only looks ahead on the first day of the period', () => {
    const plan = chosen(tuesdayBolognese, slot(MONDAY, 'dinner'), 'bolognese')

    expect(isLeftoverIn(plan, slot(MONDAY, 'dinner'))).toBe(false)
  })

  it('only looks back on the last day of the period', () => {
    const plan = chosen(
      planWith([slot(SATURDAY, 'dinner'), 'bolognese']),
      slot(SUNDAY, 'dinner'),
      'bolognese',
    )

    expect(plan.leftoverSlots).toEqual([slot(SUNDAY, 'dinner')])
  })

  it('only plans the meal while the household does not want leftovers by hand', () => {
    expect(
      chosen(
        mondayBolognese,
        slot(TUESDAY, 'dinner'),
        'bolognese',
        [],
        NOT_PLANNING_LEFTOVERS_BY_HAND,
      ),
    ).toEqual(withMealIn(mondayBolognese, slot(TUESDAY, 'dinner'), 'bolognese'))
  })

  it('still makes leftovers by hand while rolling makes none', () => {
    const plan = chosen(
      mondayBolognese,
      slot(TUESDAY, 'dinner'),
      'bolognese',
      [],
      NOT_PLANNING_LEFTOVERS,
    )

    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('only empties a slot that is chosen empty', () => {
    const leftovers = withLeftoversIn(
      mondayBolognese,
      slot(TUESDAY, 'dinner'),
      'bolognese',
    )

    expect(chosen(leftovers, slot(TUESDAY, 'dinner'), null)).toEqual(
      withMealIn(leftovers, slot(TUESDAY, 'dinner'), null),
    )
  })

  it('looks only at the very next days', () => {
    const plan = chosen(
      withLeftoversIn(
        planWith(
          [slot(MONDAY, 'dinner'), 'bolognese'],
          [slot(TUESDAY, 'dinner'), 'bolognese'],
        ),
        slot(WEDNESDAY, 'dinner'),
        'bolognese',
      ),
      slot(TUESDAY, 'dinner'),
      'bolognese',
    )

    expect(mealIn(plan, slot(WEDNESDAY, 'dinner'))).toBe('bolognese')
    expect(plan.leftoverSlots).toEqual([slot(TUESDAY, 'dinner')])
  })

  it('makes leftovers of the third day after two ordinary ones', () => {
    const plan = chosen(
      planWith(
        [slot(MONDAY, 'dinner'), 'bolognese'],
        [slot(TUESDAY, 'dinner'), 'bolognese'],
      ),
      slot(WEDNESDAY, 'dinner'),
      'bolognese',
    )

    expect(plan.leftoverSlots).toEqual([slot(WEDNESDAY, 'dinner')])
  })
})
