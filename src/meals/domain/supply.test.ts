import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import {
  combinedSupply,
  createSupply,
  InvalidSupply,
  suppliedMeals,
  supplyOf,
  withoutSupply,
  withSupply,
  type Supply,
} from './supply'

function meal(id: string, name: string): Meal {
  return { id, name, items: [], ingredientNotes: '', recipe: '' }
}

const bolognese = meal('bolognese', 'Bolognese')
const soup = meal('soup', 'Linsensuppe')
const meals = [bolognese, soup]

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
}

describe('createSupply', () => {
  it('takes the meal that was named and the count that was written', () => {
    expect(createSupply(meals, { meal: 'Bolognese', count: '3' })).toEqual({
      mealId: 'bolognese',
      count: 3,
    })
  })

  it('takes a name however it was capitalized and spaced', () => {
    expect(
      createSupply(meals, { meal: ' bolognese  ', count: '1' }).mealId,
    ).toBe('bolognese')
  })

  it('refuses a meal nobody wrote down', () => {
    expect(() => createSupply(meals, { meal: 'Pizza', count: '1' })).toThrow(
      new InvalidSupply('mealUnknown'),
    )
  })

  it('refuses an empty count', () => {
    expect(() =>
      createSupply(meals, { meal: 'Bolognese', count: '  ' }),
    ).toThrow(new InvalidSupply('countNotANumber'))
  })

  it('refuses a count that is no number', () => {
    expect(() =>
      createSupply(meals, { meal: 'Bolognese', count: 'viele' }),
    ).toThrow(new InvalidSupply('countNotANumber'))
  })

  it('refuses a count between two whole numbers', () => {
    expect(() =>
      createSupply(meals, { meal: 'Bolognese', count: '2,5' }),
    ).toThrow(new InvalidSupply('countNotWhole'))
  })

  it('refuses a count that is not positive', () => {
    expect(() =>
      createSupply(meals, { meal: 'Bolognese', count: '0' }),
    ).toThrow(new InvalidSupply('countNotPositive'))
  })

  it('refuses a count above ninety-nine', () => {
    expect(() =>
      createSupply(meals, { meal: 'Bolognese', count: '100' }),
    ).toThrow(new InvalidSupply('countTooLarge'))
  })

  it('takes ninety-nine as the largest count', () => {
    expect(createSupply(meals, { meal: 'Bolognese', count: '99' }).count).toBe(
      99,
    )
  })
})

describe('combinedSupply', () => {
  it('adds the new count to the one that is kept', () => {
    expect(
      combinedSupply(supply('bolognese', 3), supply('bolognese', 2)),
    ).toEqual(supply('bolognese', 5))
  })

  it('takes the new supply when none is kept yet', () => {
    expect(combinedSupply(null, supply('bolognese', 2))).toEqual(
      supply('bolognese', 2),
    )
  })

  it('refuses a total above ninety-nine', () => {
    expect(() =>
      combinedSupply(supply('bolognese', 98), supply('bolognese', 2)),
    ).toThrow(new InvalidSupply('countTooLarge'))
  })
})

describe('supplyOf', () => {
  it('finds the supply of a meal', () => {
    expect(supplyOf([supply('bolognese', 3)], 'bolognese')).toEqual(
      supply('bolognese', 3),
    )
  })

  it('finds nothing for a meal without a supply', () => {
    expect(supplyOf([supply('bolognese', 3)], 'soup')).toBeNull()
  })
})

describe('withSupply', () => {
  it('appends a supply that is not kept yet', () => {
    expect(withSupply([supply('bolognese', 3)], supply('soup', 1))).toEqual([
      supply('bolognese', 3),
      supply('soup', 1),
    ])
  })

  it('replaces the supply of the same meal instead of doubling it', () => {
    expect(
      withSupply([supply('bolognese', 3)], supply('bolognese', 5)),
    ).toEqual([supply('bolognese', 5)])
  })
})

describe('withoutSupply', () => {
  it('drops the supply of the named meal', () => {
    expect(
      withoutSupply([supply('bolognese', 3), supply('soup', 1)], 'bolognese'),
    ).toEqual([supply('soup', 1)])
  })
})

describe('suppliedMeals', () => {
  it('sorts the supplied meals by their name', () => {
    const supplied = suppliedMeals(
      [supply('soup', 1), supply('bolognese', 3)],
      meals,
    )

    expect(supplied).toEqual([
      { meal: bolognese, count: 3 },
      { meal: soup, count: 1 },
    ])
  })

  it('leaves out a meal without a supply', () => {
    expect(suppliedMeals([supply('bolognese', 3)], meals)).toEqual([
      { meal: bolognese, count: 3 },
    ])
  })

  it('leaves out a supply whose meal is gone', () => {
    expect(suppliedMeals([supply('pizza', 3)], meals)).toEqual([])
  })
})
