import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import type { Supply } from './supply'
import {
  coveredSlotsOf,
  EMPTY_WEEK_PLAN,
  isSuppliedIn,
  MEAL_TIMES,
  mealIn,
  mealsWithoutItems,
  PLAN_SLOTS,
  plannedMealCount,
  plannedMeals,
  sameSlot,
  sameWeekPlan,
  shownMealIn,
  suppliedMealCount,
  WEEKDAYS,
  weekdayAfter,
  weekdayBefore,
  weekPlanTransfer,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
  type Weekday,
} from './weekPlan'

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

function slot(day: Weekday, time: MealTime): PlanSlot {
  return { day, time }
}

function planWith(
  ...planned: readonly (readonly [PlanSlot, string])[]
): WeekPlan {
  return planned.reduce<WeekPlan>(
    (plan, [plannedSlot, id]) => withMealIn(plan, plannedSlot, id),
    EMPTY_WEEK_PLAN,
  )
}

function filledSlots(plan: WeekPlan): readonly PlanSlot[] {
  return PLAN_SLOTS.filter((each) => mealIn(plan, each) !== null)
}

describe('WEEKDAYS', () => {
  it('runs from Monday to Sunday', () => {
    expect(WEEKDAYS).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ])
  })
})

describe('MEAL_TIMES', () => {
  it('runs from breakfast to dinner', () => {
    expect(MEAL_TIMES).toEqual(['breakfast', 'lunch', 'snack', 'dinner'])
  })
})

describe('PLAN_SLOTS', () => {
  it('holds four slots for every weekday in the order of the week', () => {
    expect(PLAN_SLOTS).toHaveLength(28)
    expect(PLAN_SLOTS[0]).toEqual(slot('monday', 'breakfast'))
    expect(PLAN_SLOTS[4]).toEqual(slot('tuesday', 'breakfast'))
    expect(PLAN_SLOTS[27]).toEqual(slot('sunday', 'dinner'))
  })
})

describe('EMPTY_WEEK_PLAN', () => {
  it('plans no meal in any slot', () => {
    expect(filledSlots(EMPTY_WEEK_PLAN)).toEqual([])
  })
})

describe('withMealIn', () => {
  it('replaces exactly one slot', () => {
    const plan = withMealIn(
      EMPTY_WEEK_PLAN,
      slot('wednesday', 'lunch'),
      'pizza',
    )

    expect(mealIn(plan, slot('wednesday', 'lunch'))).toBe('pizza')
    expect(filledSlots(plan)).toEqual([slot('wednesday', 'lunch')])
  })

  it('empties a slot again', () => {
    const plan = withMealIn(
      planWith([slot('wednesday', 'lunch'), 'pizza']),
      slot('wednesday', 'lunch'),
      null,
    )

    expect(mealIn(plan, slot('wednesday', 'lunch'))).toBeNull()
  })

  it('leaves the plan it was given untouched', () => {
    withMealIn(EMPTY_WEEK_PLAN, slot('monday', 'lunch'), 'pizza')

    expect(mealIn(EMPTY_WEEK_PLAN, slot('monday', 'lunch'))).toBeNull()
  })
})

describe('sameSlot', () => {
  it('holds for the same day and time', () => {
    expect(sameSlot(slot('friday', 'snack'), slot('friday', 'snack'))).toBe(
      true,
    )
  })

  it('fails for another time of the same day', () => {
    expect(sameSlot(slot('friday', 'snack'), slot('friday', 'dinner'))).toBe(
      false,
    )
  })
})

describe('shownMealIn', () => {
  it('finds the meal that is planned in a slot', () => {
    const plan = planWith([slot('friday', 'dinner'), 'pizza'])

    expect(shownMealIn(plan, slot('friday', 'dinner'), knownMeals)).toEqual(
      pizza,
    )
  })

  it('shows nothing in an empty slot', () => {
    expect(
      shownMealIn(EMPTY_WEEK_PLAN, slot('friday', 'dinner'), knownMeals),
    ).toBeNull()
  })

  it('shows nothing for a meal that was deleted meanwhile', () => {
    const plan = planWith([slot('friday', 'dinner'), 'gone'])

    expect(shownMealIn(plan, slot('friday', 'dinner'), knownMeals)).toBeNull()
  })
})

describe('plannedMeals', () => {
  it('gives the meals in the order of the slots', () => {
    const plan = planWith(
      [slot('tuesday', 'breakfast'), 'pizza'],
      [slot('monday', 'dinner'), 'bolognese'],
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([bolognese, pizza])
  })

  it('keeps a meal that is planned in two slots twice', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'pizza'],
      [slot('sunday', 'dinner'), 'pizza'],
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([pizza, pizza])
  })

  it('skips empty slots and meals that were deleted meanwhile', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'gone'],
      [slot('sunday', 'lunch'), 'soup'],
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([soup])
  })
})

describe('plannedMealCount', () => {
  it('counts no slot of an empty plan', () => {
    expect(plannedMealCount(EMPTY_WEEK_PLAN, knownMeals)).toBe(0)
  })

  it('counts only the slots that carry a meal that still exists', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'gone'],
      [slot('sunday', 'lunch'), 'soup'],
    )

    expect(plannedMealCount(plan, knownMeals)).toBe(1)
  })

  it('counts two slots of the same day twice', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'soup'],
      [slot('monday', 'dinner'), 'pizza'],
    )

    expect(plannedMealCount(plan, knownMeals)).toBe(2)
  })
})

describe('isSuppliedIn', () => {
  it('reports a slot whose meal is kept in store', () => {
    const plan = planWith([slot('monday', 'lunch'), 'pizza'])

    expect(
      isSuppliedIn(plan, slot('monday', 'lunch'), knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(true)
  })

  it('reports a planned slot without a supply as not covered', () => {
    const plan = planWith([slot('monday', 'lunch'), 'pizza'])

    expect(
      isSuppliedIn(plan, slot('monday', 'lunch'), knownMeals, [
        supply('soup', 1),
      ]),
    ).toBe(false)
  })

  it('reports an empty slot as not covered', () => {
    expect(
      isSuppliedIn(EMPTY_WEEK_PLAN, slot('monday', 'lunch'), knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(false)
  })

  it('spends a single portion on the earlier of two days', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'pizza'],
      [slot('wednesday', 'lunch'), 'pizza'],
    )
    const supplies = [supply('pizza', 1)]

    expect(
      isSuppliedIn(plan, slot('monday', 'lunch'), knownMeals, supplies),
    ).toBe(true)
    expect(
      isSuppliedIn(plan, slot('wednesday', 'lunch'), knownMeals, supplies),
    ).toBe(false)
  })

  it('spends a single portion on the lunch before the dinner of the same day', () => {
    const plan = planWith(
      [slot('monday', 'dinner'), 'pizza'],
      [slot('monday', 'lunch'), 'pizza'],
    )
    const supplies = [supply('pizza', 1)]

    expect(
      isSuppliedIn(plan, slot('monday', 'lunch'), knownMeals, supplies),
    ).toBe(true)
    expect(
      isSuppliedIn(plan, slot('monday', 'dinner'), knownMeals, supplies),
    ).toBe(false)
  })

  it('spends two portions on the first two of three days', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'pizza'],
      [slot('wednesday', 'lunch'), 'pizza'],
      [slot('friday', 'lunch'), 'pizza'],
    )
    const supplies = [supply('pizza', 2)]

    expect(
      PLAN_SLOTS.filter((each) =>
        isSuppliedIn(plan, each, knownMeals, supplies),
      ),
    ).toEqual([slot('monday', 'lunch'), slot('wednesday', 'lunch')])
  })

  it('counts only the slots of the same meal against the supply', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'soup'],
      [slot('wednesday', 'lunch'), 'pizza'],
    )

    expect(
      isSuppliedIn(plan, slot('wednesday', 'lunch'), knownMeals, [
        supply('pizza', 1),
      ]),
    ).toBe(true)
  })

  it('covers every slot when the supply outlasts the week', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'pizza'],
      [slot('sunday', 'dinner'), 'pizza'],
    )
    const supplies = [supply('pizza', 5)]

    expect(
      PLAN_SLOTS.filter((each) =>
        isSuppliedIn(plan, each, knownMeals, supplies),
      ),
    ).toEqual([slot('monday', 'lunch'), slot('sunday', 'dinner')])
  })
})

describe('sameWeekPlan', () => {
  it('holds for two plans with the same meal in every slot', () => {
    expect(
      sameWeekPlan(
        planWith([slot('monday', 'lunch'), 'soup']),
        planWith([slot('monday', 'lunch'), 'soup']),
      ),
    ).toBe(true)
  })

  it('fails for two plans that differ on one day', () => {
    expect(
      sameWeekPlan(
        planWith([slot('monday', 'lunch'), 'soup']),
        planWith([slot('monday', 'lunch'), 'pizza']),
      ),
    ).toBe(false)
  })

  it('fails for two plans that differ in one meal time of the same day', () => {
    expect(
      sameWeekPlan(
        planWith([slot('monday', 'lunch'), 'soup']),
        planWith([slot('monday', 'dinner'), 'soup']),
      ),
    ).toBe(false)
  })
})

describe('coveredSlotsOf', () => {
  it('lists the covered slots in the order of the week', () => {
    const plan = planWith(
      [slot('friday', 'lunch'), 'soup'],
      [slot('monday', 'dinner'), 'bolognese'],
      [slot('wednesday', 'lunch'), 'pizza'],
    )

    expect(
      coveredSlotsOf(plan, knownMeals, [
        supply('soup', 1),
        supply('bolognese', 1),
      ]),
    ).toEqual([slot('monday', 'dinner'), slot('friday', 'lunch')])
  })

  it('leaves out the slot that the supply no longer reaches', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'bolognese'],
      [slot('monday', 'dinner'), 'bolognese'],
    )

    expect(coveredSlotsOf(plan, knownMeals, [supply('bolognese', 1)])).toEqual([
      slot('monday', 'lunch'),
    ])
  })

  it('lists no slot without a supply', () => {
    const plan = planWith([slot('monday', 'lunch'), 'bolognese'])

    expect(coveredSlotsOf(plan, knownMeals, [])).toEqual([])
  })
})

describe('weekPlanTransfer', () => {
  it('leaves every planned meal to buy while nothing is kept in store', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'pizza'],
      [slot('monday', 'dinner'), 'bolognese'],
    )

    expect(weekPlanTransfer(plan, knownMeals, [])).toEqual({
      mealsToBuy: [pizza, bolognese],
      spentSupplies: [],
    })
  })

  it('spends two portions on the first two of three slots', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'pizza'],
      [slot('monday', 'dinner'), 'pizza'],
      [slot('friday', 'lunch'), 'pizza'],
    )

    expect(weekPlanTransfer(plan, knownMeals, [supply('pizza', 2)])).toEqual({
      mealsToBuy: [pizza],
      spentSupplies: [supply('pizza', 2)],
    })
  })

  it('keeps the meal on the list once when one portion meets two slots', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'pizza'],
      [slot('wednesday', 'lunch'), 'pizza'],
    )

    expect(weekPlanTransfer(plan, knownMeals, [supply('pizza', 1)])).toEqual({
      mealsToBuy: [pizza],
      spentSupplies: [supply('pizza', 1)],
    })
  })

  it('buys nothing when every planned slot is covered', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'pizza'],
      [slot('tuesday', 'lunch'), 'soup'],
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
      [slot('monday', 'dinner'), 'pizza'],
      [slot('monday', 'lunch'), 'soup'],
    )

    expect(
      weekPlanTransfer(plan, knownMeals, [
        supply('pizza', 1),
        supply('soup', 1),
      ]).spentSupplies,
    ).toEqual([supply('soup', 1), supply('pizza', 1)])
  })

  it('spends nothing of a supply whose meal is not planned', () => {
    const plan = planWith([slot('monday', 'lunch'), 'pizza'])

    expect(
      weekPlanTransfer(plan, knownMeals, [supply('bolognese', 3)]),
    ).toEqual({ mealsToBuy: [pizza], spentSupplies: [] })
  })

  it('skips a slot whose meal was deleted meanwhile', () => {
    const plan = planWith(
      [slot('monday', 'lunch'), 'gone'],
      [slot('sunday', 'lunch'), 'soup'],
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

describe('weekdayBefore', () => {
  it('gives the day before Tuesday as Monday', () => {
    expect(weekdayBefore('tuesday')).toBe('monday')
  })

  it('has no day before Monday', () => {
    expect(weekdayBefore('monday')).toBeNull()
  })
})

describe('weekdayAfter', () => {
  it('gives the day after Saturday as Sunday', () => {
    expect(weekdayAfter('saturday')).toBe('sunday')
  })

  it('has no day after Sunday', () => {
    expect(weekdayAfter('sunday')).toBeNull()
  })
})
