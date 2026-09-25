import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import { toPlanDate, type PlanDate } from './planDate'
import type { PlanPeriod } from './planPeriod'
import type { Supply } from './supply'
import {
  coveredSlotsOf,
  dateOfWeekday,
  emptied,
  emptyWeekPlan,
  isSuppliedIn,
  MEAL_TIMES,
  mealIn,
  mealsWithoutItems,
  planSlotsOf,
  plannedMealCount,
  plannedMeals,
  sameSlot,
  sameWeekPlan,
  shownMealIn,
  slotCountOf,
  suppliedMealCount,
  weekPlanFromWeekdays,
  weekPlanTransfer,
  withMealIn,
  withPeriod,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
} from './weekPlan'

const MONDAY = toPlanDate('2026-09-21')
const TUESDAY = toPlanDate('2026-09-22')
const WEDNESDAY = toPlanDate('2026-09-23')
const FRIDAY = toPlanDate('2026-09-25')
const SUNDAY = toPlanDate('2026-09-27')
const NEXT_MONDAY = toPlanDate('2026-09-28')

const WEEK: PlanPeriod = { start: MONDAY, days: 7 }
const EMPTY_PLAN = emptyWeekPlan(WEEK)

function meal(id: string, name: string, items: Meal['items'] = []): Meal {
  return {
    id,
    name,
    items,
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'mainMeal',
  }
}

const bolognese = meal('bolognese', 'Bolognese', [
  { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
])
const soup = meal('soup', 'Suppe')
const pizza = meal('pizza', 'Pizza', [{ name: 'Mehl', quantity: null }])

const knownMeals = [bolognese, soup, pizza]

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
}

function slot(date: PlanDate, time: MealTime): PlanSlot {
  return { date, time }
}

function planWith(
  ...planned: readonly (readonly [PlanSlot, string])[]
): WeekPlan {
  return planned.reduce<WeekPlan>(
    (plan, [plannedSlot, id]) => withMealIn(plan, plannedSlot, id),
    EMPTY_PLAN,
  )
}

function filledSlots(plan: WeekPlan): readonly PlanSlot[] {
  return planSlotsOf(plan.period).filter((each) => mealIn(plan, each) !== null)
}

describe('MEAL_TIMES', () => {
  it('runs from breakfast to dinner', () => {
    expect(MEAL_TIMES).toEqual(['breakfast', 'lunch', 'snack', 'dinner'])
  })
})

describe('planSlotsOf', () => {
  it('holds four slots for every day in the order of the calendar', () => {
    const slots = planSlotsOf(WEEK)

    expect(slots).toHaveLength(28)
    expect(slots[0]).toEqual(slot(MONDAY, 'breakfast'))
    expect(slots[4]).toEqual(slot(TUESDAY, 'breakfast'))
    expect(slots[27]).toEqual(slot(SUNDAY, 'dinner'))
  })
})

describe('emptyWeekPlan', () => {
  it('plans no meal in any slot', () => {
    expect(filledSlots(EMPTY_PLAN)).toEqual([])
  })

  it('keeps the period it was given', () => {
    expect(EMPTY_PLAN.period).toEqual(WEEK)
  })
})

describe('slotCountOf', () => {
  it('counts four meal times per day of the week', () => {
    expect(slotCountOf(EMPTY_PLAN)).toBe(28)
  })

  it('counts four meal times per day of the period', () => {
    expect(slotCountOf(emptyWeekPlan({ start: FRIDAY, days: 10 }))).toBe(40)
  })
})

describe('emptied', () => {
  it('drops every meal and keeps the period', () => {
    const plan = emptied(
      planWith(
        [slot(MONDAY, 'lunch'), 'pizza'],
        [slot(SUNDAY, 'dinner'), 'soup'],
      ),
    )

    expect(filledSlots(plan)).toEqual([])
    expect(plan.period).toEqual(WEEK)
  })
})

describe('mealIn', () => {
  it('finds no meal on a day outside the period', () => {
    const plan = withMealIn(EMPTY_PLAN, slot(NEXT_MONDAY, 'lunch'), 'pizza')

    expect(mealIn(plan, slot(NEXT_MONDAY, 'lunch'))).toBeNull()
  })
})

describe('dateOfWeekday', () => {
  it('finds the date of a weekday within the week', () => {
    expect(dateOfWeekday(WEEK, 'monday')).toBe(MONDAY)
    expect(dateOfWeekday(WEEK, 'friday')).toBe(FRIDAY)
    expect(dateOfWeekday(WEEK, 'sunday')).toBe(SUNDAY)
  })
})

describe('weekPlanFromWeekdays', () => {
  it('lays a plan of weekdays onto the dates of the week', () => {
    const empty = { breakfast: null, lunch: null, snack: null, dinner: null }
    const plan = weekPlanFromWeekdays(
      {
        monday: { ...empty, breakfast: 'soup' },
        tuesday: empty,
        wednesday: empty,
        thursday: empty,
        friday: { ...empty, lunch: 'pizza' },
        saturday: empty,
        sunday: { ...empty, dinner: 'bolognese' },
      },
      WEEK,
    )

    expect(plan.period).toEqual(WEEK)
    expect(mealIn(plan, slot(MONDAY, 'breakfast'))).toBe('soup')
    expect(mealIn(plan, slot(FRIDAY, 'lunch'))).toBe('pizza')
    expect(mealIn(plan, slot(SUNDAY, 'dinner'))).toBe('bolognese')
    expect(filledSlots(plan)).toHaveLength(3)
  })
})

describe('withMealIn', () => {
  it('replaces exactly one slot', () => {
    const plan = withMealIn(EMPTY_PLAN, slot(WEDNESDAY, 'lunch'), 'pizza')

    expect(mealIn(plan, slot(WEDNESDAY, 'lunch'))).toBe('pizza')
    expect(filledSlots(plan)).toEqual([slot(WEDNESDAY, 'lunch')])
  })

  it('empties a slot again', () => {
    const plan = withMealIn(
      planWith([slot(WEDNESDAY, 'lunch'), 'pizza']),
      slot(WEDNESDAY, 'lunch'),
      null,
    )

    expect(mealIn(plan, slot(WEDNESDAY, 'lunch'))).toBeNull()
  })

  it('leaves the plan it was given untouched', () => {
    withMealIn(EMPTY_PLAN, slot(MONDAY, 'lunch'), 'pizza')

    expect(mealIn(EMPTY_PLAN, slot(MONDAY, 'lunch'))).toBeNull()
  })
})

describe('sameSlot', () => {
  it('holds for the same day and time', () => {
    expect(sameSlot(slot(FRIDAY, 'snack'), slot(FRIDAY, 'snack'))).toBe(true)
  })

  it('fails for another time of the same day', () => {
    expect(sameSlot(slot(FRIDAY, 'snack'), slot(FRIDAY, 'dinner'))).toBe(false)
  })
})

describe('shownMealIn', () => {
  it('finds the meal that is planned in a slot', () => {
    const plan = planWith([slot(FRIDAY, 'dinner'), 'pizza'])

    expect(shownMealIn(plan, slot(FRIDAY, 'dinner'), knownMeals)).toEqual(pizza)
  })

  it('shows nothing in an empty slot', () => {
    expect(
      shownMealIn(EMPTY_PLAN, slot(FRIDAY, 'dinner'), knownMeals),
    ).toBeNull()
  })

  it('shows nothing for a meal that was deleted meanwhile', () => {
    const plan = planWith([slot(FRIDAY, 'dinner'), 'gone'])

    expect(shownMealIn(plan, slot(FRIDAY, 'dinner'), knownMeals)).toBeNull()
  })
})

describe('plannedMeals', () => {
  it('gives the meals in the order of the slots', () => {
    const plan = planWith(
      [slot(TUESDAY, 'breakfast'), 'pizza'],
      [slot(MONDAY, 'dinner'), 'bolognese'],
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([bolognese, pizza])
  })

  it('keeps a meal that is planned in two slots twice', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'pizza'],
      [slot(SUNDAY, 'dinner'), 'pizza'],
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([pizza, pizza])
  })

  it('skips empty slots and meals that were deleted meanwhile', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'gone'],
      [slot(SUNDAY, 'lunch'), 'soup'],
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([soup])
  })
})

describe('plannedMealCount', () => {
  it('counts no slot of an empty plan', () => {
    expect(plannedMealCount(EMPTY_PLAN, knownMeals)).toBe(0)
  })

  it('counts only the slots that carry a meal that still exists', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'gone'],
      [slot(SUNDAY, 'lunch'), 'soup'],
    )

    expect(plannedMealCount(plan, knownMeals)).toBe(1)
  })

  it('counts two slots of the same day twice', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'soup'],
      [slot(MONDAY, 'dinner'), 'pizza'],
    )

    expect(plannedMealCount(plan, knownMeals)).toBe(2)
  })
})

describe('isSuppliedIn', () => {
  it('reports a slot whose meal is kept in store', () => {
    const plan = planWith([slot(MONDAY, 'lunch'), 'pizza'])

    expect(
      isSuppliedIn(plan, slot(MONDAY, 'lunch'), knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(true)
  })

  it('reports a planned slot without a supply as not covered', () => {
    const plan = planWith([slot(MONDAY, 'lunch'), 'pizza'])

    expect(
      isSuppliedIn(plan, slot(MONDAY, 'lunch'), knownMeals, [
        supply('soup', 1),
      ]),
    ).toBe(false)
  })

  it('reports an empty slot as not covered', () => {
    expect(
      isSuppliedIn(EMPTY_PLAN, slot(MONDAY, 'lunch'), knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(false)
  })

  it('spends a single portion on the earlier of two days', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'pizza'],
      [slot(WEDNESDAY, 'lunch'), 'pizza'],
    )
    const supplies = [supply('pizza', 1)]

    expect(
      isSuppliedIn(plan, slot(MONDAY, 'lunch'), knownMeals, supplies),
    ).toBe(true)
    expect(
      isSuppliedIn(plan, slot(WEDNESDAY, 'lunch'), knownMeals, supplies),
    ).toBe(false)
  })

  it('spends a single portion on the lunch before the dinner of the same day', () => {
    const plan = planWith(
      [slot(MONDAY, 'dinner'), 'pizza'],
      [slot(MONDAY, 'lunch'), 'pizza'],
    )
    const supplies = [supply('pizza', 1)]

    expect(
      isSuppliedIn(plan, slot(MONDAY, 'lunch'), knownMeals, supplies),
    ).toBe(true)
    expect(
      isSuppliedIn(plan, slot(MONDAY, 'dinner'), knownMeals, supplies),
    ).toBe(false)
  })

  it('spends two portions on the first two of three days', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'pizza'],
      [slot(WEDNESDAY, 'lunch'), 'pizza'],
      [slot(FRIDAY, 'lunch'), 'pizza'],
    )
    const supplies = [supply('pizza', 2)]

    expect(
      planSlotsOf(WEEK).filter((each) =>
        isSuppliedIn(plan, each, knownMeals, supplies),
      ),
    ).toEqual([slot(MONDAY, 'lunch'), slot(WEDNESDAY, 'lunch')])
  })

  it('keeps meals planned on Sunday before those planned on the next Monday', () => {
    const plan = withMealIn(
      withMealIn(
        emptyWeekPlan({ start: FRIDAY, days: 5 }),
        slot(NEXT_MONDAY, 'lunch'),
        'pizza',
      ),
      slot(SUNDAY, 'dinner'),
      'pizza',
    )

    expect(coveredSlotsOf(plan, knownMeals, [supply('pizza', 1)])).toEqual([
      slot(SUNDAY, 'dinner'),
    ])
  })

  it('counts only the slots of the same meal against the supply', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'soup'],
      [slot(WEDNESDAY, 'lunch'), 'pizza'],
    )

    expect(
      isSuppliedIn(plan, slot(WEDNESDAY, 'lunch'), knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(true)
  })

  it('covers every slot when the supply outlasts the week', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'pizza'],
      [slot(SUNDAY, 'dinner'), 'pizza'],
    )
    const supplies = [supply('pizza', 5)]

    expect(
      planSlotsOf(WEEK).filter((each) =>
        isSuppliedIn(plan, each, knownMeals, supplies),
      ),
    ).toEqual([slot(MONDAY, 'lunch'), slot(SUNDAY, 'dinner')])
  })
})

describe('sameWeekPlan', () => {
  it('fails for two empty plans of different periods', () => {
    expect(
      sameWeekPlan(EMPTY_PLAN, emptyWeekPlan({ start: FRIDAY, days: 7 })),
    ).toBe(false)
  })

  it('holds for two plans with the same meal in every slot', () => {
    expect(
      sameWeekPlan(
        planWith([slot(MONDAY, 'lunch'), 'soup']),
        planWith([slot(MONDAY, 'lunch'), 'soup']),
      ),
    ).toBe(true)
  })

  it('fails for two plans that differ on one day', () => {
    expect(
      sameWeekPlan(
        planWith([slot(MONDAY, 'lunch'), 'soup']),
        planWith([slot(MONDAY, 'lunch'), 'pizza']),
      ),
    ).toBe(false)
  })

  it('fails for two plans that differ in one meal time of the same day', () => {
    expect(
      sameWeekPlan(
        planWith([slot(MONDAY, 'lunch'), 'soup']),
        planWith([slot(MONDAY, 'dinner'), 'soup']),
      ),
    ).toBe(false)
  })
})

describe('coveredSlotsOf', () => {
  it('lists the covered slots in the order of the week', () => {
    const plan = planWith(
      [slot(FRIDAY, 'lunch'), 'soup'],
      [slot(MONDAY, 'dinner'), 'bolognese'],
      [slot(WEDNESDAY, 'lunch'), 'pizza'],
    )

    expect(
      coveredSlotsOf(plan, knownMeals, [
        supply('soup', 1),
        supply('bolognese', 1),
      ]),
    ).toEqual([slot(MONDAY, 'dinner'), slot(FRIDAY, 'lunch')])
  })

  it('leaves out the slot that the supply no longer reaches', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'bolognese'],
      [slot(MONDAY, 'dinner'), 'bolognese'],
    )

    expect(coveredSlotsOf(plan, knownMeals, [supply('bolognese', 1)])).toEqual([
      slot(MONDAY, 'lunch'),
    ])
  })

  it('lists no slot without a supply', () => {
    const plan = planWith([slot(MONDAY, 'lunch'), 'bolognese'])

    expect(coveredSlotsOf(plan, knownMeals, [])).toEqual([])
  })
})

describe('weekPlanTransfer', () => {
  it('leaves every planned meal to buy while nothing is kept in store', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'pizza'],
      [slot(MONDAY, 'dinner'), 'bolognese'],
    )

    expect(weekPlanTransfer(plan, knownMeals, [])).toEqual({
      mealsToBuy: [pizza, bolognese],
      spentSupplies: [],
    })
  })

  it('spends two portions on the first two of three slots', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'pizza'],
      [slot(MONDAY, 'dinner'), 'pizza'],
      [slot(FRIDAY, 'lunch'), 'pizza'],
    )

    expect(weekPlanTransfer(plan, knownMeals, [supply('pizza', 2)])).toEqual({
      mealsToBuy: [pizza],
      spentSupplies: [supply('pizza', 2)],
    })
  })

  it('keeps the meal on the list once when one portion meets two slots', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'pizza'],
      [slot(WEDNESDAY, 'lunch'), 'pizza'],
    )

    expect(weekPlanTransfer(plan, knownMeals, [supply('pizza', 1)])).toEqual({
      mealsToBuy: [pizza],
      spentSupplies: [supply('pizza', 1)],
    })
  })

  it('buys nothing when every planned slot is covered', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'pizza'],
      [slot(TUESDAY, 'lunch'), 'soup'],
    )

    expect(
      weekPlanTransfer(plan, knownMeals, [
        supply('pizza', 1),
        supply('soup', 1),
      ]),
    ).toEqual({
      mealsToBuy: [],
      spentSupplies: [supply('pizza', 1), supply('soup', 1)],
    })
  })

  it('follows the slots when several supplies are spent', () => {
    const plan = planWith(
      [slot(MONDAY, 'dinner'), 'pizza'],
      [slot(MONDAY, 'lunch'), 'soup'],
    )

    expect(
      weekPlanTransfer(plan, knownMeals, [
        supply('pizza', 1),
        supply('soup', 1),
      ]).spentSupplies,
    ).toEqual([supply('soup', 1), supply('pizza', 1)])
  })

  it('spends nothing of a supply whose meal is not planned', () => {
    const plan = planWith([slot(MONDAY, 'lunch'), 'pizza'])

    expect(
      weekPlanTransfer(plan, knownMeals, [supply('bolognese', 3)]),
    ).toEqual({ mealsToBuy: [pizza], spentSupplies: [] })
  })

  it('skips a slot whose meal was deleted meanwhile', () => {
    const plan = planWith(
      [slot(MONDAY, 'lunch'), 'gone'],
      [slot(SUNDAY, 'lunch'), 'soup'],
    )

    expect(weekPlanTransfer(plan, knownMeals, [])).toEqual({
      mealsToBuy: [soup],
      spentSupplies: [],
    })
  })
})

describe('suppliedMealCount', () => {
  it('counts no meal while nothing was spent', () => {
    expect(suppliedMealCount({ mealsToBuy: [], spentSupplies: [] })).toBe(0)
  })

  it('counts the single meal of a single portion', () => {
    expect(
      suppliedMealCount({
        mealsToBuy: [],
        spentSupplies: [supply('pizza', 1)],
      }),
    ).toBe(1)
  })

  it('adds up the portions of every spent supply', () => {
    expect(
      suppliedMealCount({
        mealsToBuy: [],
        spentSupplies: [supply('bolognese', 2), supply('pizza', 1)],
      }),
    ).toBe(3)
  })
})

describe('mealsWithoutItems', () => {
  it('names a planned meal without items once, however often it is planned', () => {
    expect(mealsWithoutItems([soup, bolognese, soup])).toEqual([soup])
  })

  it('names nothing when every planned meal carries items', () => {
    expect(mealsWithoutItems([bolognese, pizza])).toEqual([])
  })
})

describe('withPeriod', () => {
  const fullWeek = planWith(
    [slot(MONDAY, 'lunch'), 'soup'],
    [slot(WEDNESDAY, 'dinner'), 'pizza'],
    [slot(FRIDAY, 'lunch'), 'bolognese'],
    [slot(SUNDAY, 'dinner'), 'pizza'],
  )
  const fromFriday: PlanPeriod = { start: FRIDAY, days: 5 }

  it('keeps the meals of days that stay in the period', () => {
    const plan = withPeriod(fullWeek, fromFriday)

    expect(plan.period).toEqual(fromFriday)
    expect(filledSlots(plan)).toEqual([
      slot(FRIDAY, 'lunch'),
      slot(SUNDAY, 'dinner'),
    ])
  })

  it('drops the meals of days outside the new period', () => {
    const plan = withPeriod(fullWeek, fromFriday)

    expect(Object.keys(plan.days)).not.toContain(MONDAY)
    expect(Object.keys(plan.days)).not.toContain(WEDNESDAY)
  })

  it('starts the new days empty', () => {
    const plan = withPeriod(fullWeek, fromFriday)

    expect(mealIn(plan, slot(NEXT_MONDAY, 'lunch'))).toBeNull()
    expect(Object.keys(plan.days)).toHaveLength(5)
  })
})
