import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import type { Supply } from './supply'
import {
  EMPTY_WEEK_PLAN,
  isSuppliedOn,
  mealsWithoutItems,
  plannedDayCount,
  plannedMeals,
  shownMealOn,
  WEEKDAYS,
  withMealOnDay,
} from './weekPlan'

function meal(id: string, name: string, items: Meal['items'] = []): Meal {
  return { id, name, items, ingredientNotes: '', recipe: '' }
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

describe('EMPTY_WEEK_PLAN', () => {
  it('plans no meal on any day', () => {
    expect(WEEKDAYS.map((day) => EMPTY_WEEK_PLAN[day])).toEqual(
      WEEKDAYS.map(() => null),
    )
  })
})

describe('withMealOnDay', () => {
  it('replaces exactly one day', () => {
    const plan = withMealOnDay(EMPTY_WEEK_PLAN, 'wednesday', 'pizza')

    expect(plan.wednesday).toBe('pizza')
    expect(WEEKDAYS.filter((day) => plan[day] !== null)).toEqual(['wednesday'])
  })

  it('empties a day again', () => {
    const plan = withMealOnDay(
      withMealOnDay(EMPTY_WEEK_PLAN, 'wednesday', 'pizza'),
      'wednesday',
      null,
    )

    expect(plan.wednesday).toBeNull()
  })

  it('leaves the plan it was given untouched', () => {
    withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza')

    expect(EMPTY_WEEK_PLAN.monday).toBeNull()
  })
})

describe('shownMealOn', () => {
  it('finds the meal that is planned on a day', () => {
    const plan = withMealOnDay(EMPTY_WEEK_PLAN, 'friday', 'pizza')

    expect(shownMealOn(plan, 'friday', knownMeals)).toEqual(pizza)
  })

  it('shows nothing on an empty day', () => {
    expect(shownMealOn(EMPTY_WEEK_PLAN, 'friday', knownMeals)).toBeNull()
  })

  it('shows nothing for a meal that was deleted meanwhile', () => {
    const plan = withMealOnDay(EMPTY_WEEK_PLAN, 'friday', 'gone')

    expect(shownMealOn(plan, 'friday', knownMeals)).toBeNull()
  })
})

describe('plannedMeals', () => {
  it('gives the meals in the order of the weekdays', () => {
    const plan = withMealOnDay(
      withMealOnDay(EMPTY_WEEK_PLAN, 'friday', 'pizza'),
      'tuesday',
      'bolognese',
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([bolognese, pizza])
  })

  it('keeps a meal that is planned on two days twice', () => {
    const plan = withMealOnDay(
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza'),
      'sunday',
      'pizza',
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([pizza, pizza])
  })

  it('skips empty days and meals that were deleted meanwhile', () => {
    const plan = withMealOnDay(
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'gone'),
      'sunday',
      'soup',
    )

    expect(plannedMeals(plan, knownMeals)).toEqual([soup])
  })
})

describe('plannedDayCount', () => {
  it('counts no day of an empty plan', () => {
    expect(plannedDayCount(EMPTY_WEEK_PLAN, knownMeals)).toBe(0)
  })

  it('counts only the days that carry a meal that still exists', () => {
    const plan = withMealOnDay(
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'gone'),
      'sunday',
      'soup',
    )

    expect(plannedDayCount(plan, knownMeals)).toBe(1)
  })
})

describe('isSuppliedOn', () => {
  it('reports a day whose meal is kept in store', () => {
    const plan = withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza')

    expect(isSuppliedOn(plan, 'monday', knownMeals, [supply('pizza', 1)])).toBe(
      true,
    )
  })

  it('reports a planned day without a supply as not covered', () => {
    const plan = withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza')

    expect(isSuppliedOn(plan, 'monday', knownMeals, [supply('soup', 1)])).toBe(
      false,
    )
  })

  it('reports an empty day as not covered', () => {
    expect(
      isSuppliedOn(EMPTY_WEEK_PLAN, 'monday', knownMeals, [supply('pizza', 1)]),
    ).toBe(false)
  })

  it('spends a single portion on the earlier of two days', () => {
    const plan = withMealOnDay(
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza'),
      'wednesday',
      'pizza',
    )
    const supplies = [supply('pizza', 1)]

    expect(isSuppliedOn(plan, 'monday', knownMeals, supplies)).toBe(true)
    expect(isSuppliedOn(plan, 'wednesday', knownMeals, supplies)).toBe(false)
  })

  it('spends two portions on the first two of three days', () => {
    const plan = withMealOnDay(
      withMealOnDay(
        withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza'),
        'wednesday',
        'pizza',
      ),
      'friday',
      'pizza',
    )
    const supplies = [supply('pizza', 2)]

    expect(
      WEEKDAYS.filter((day) => isSuppliedOn(plan, day, knownMeals, supplies)),
    ).toEqual(['monday', 'wednesday'])
  })

  it('counts only the days of the same meal against the supply', () => {
    const plan = withMealOnDay(
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'soup'),
      'wednesday',
      'pizza',
    )

    expect(
      isSuppliedOn(plan, 'wednesday', knownMeals, [supply('pizza', 1)]),
    ).toBe(true)
  })

  it('covers every day when the supply outlasts the week', () => {
    const plan = withMealOnDay(
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza'),
      'sunday',
      'pizza',
    )
    const supplies = [supply('pizza', 5)]

    expect(
      WEEKDAYS.filter((day) => isSuppliedOn(plan, day, knownMeals, supplies)),
    ).toEqual(['monday', 'sunday'])
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
