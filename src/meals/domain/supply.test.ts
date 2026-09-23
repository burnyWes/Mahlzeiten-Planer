import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import {
  combinedSupply,
  createSupply,
  InvalidSupply,
  isFull,
  isInSupply,
  isLastPortion,
  recountedSupply,
  suppliedMeals,
  supplyOf,
  withOneLess,
  withOneMore,
  withoutPortions,
  withoutSupply,
  withSupply,
  type Supply,
} from './supply'

function meal(id: string, name: string): Meal {
  return { id, name, items: [], ingredientNotes: '', recipe: '', hidden: false }
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

describe('recountedSupply', () => {
  it('takes the count that was written for the meal', () => {
    expect(recountedSupply('bolognese', '5')).toEqual(supply('bolognese', 5))
  })

  it('refuses a count that is no number', () => {
    expect(() => recountedSupply('bolognese', 'viele')).toThrow(
      new InvalidSupply('countNotANumber'),
    )
  })

  it('refuses a count between two whole numbers', () => {
    expect(() => recountedSupply('bolognese', '2,5')).toThrow(
      new InvalidSupply('countNotWhole'),
    )
  })

  it('refuses a count that is not positive', () => {
    expect(() => recountedSupply('bolognese', '0')).toThrow(
      new InvalidSupply('countNotPositive'),
    )
  })

  it('refuses a count above ninety-nine', () => {
    expect(() => recountedSupply('bolognese', '100')).toThrow(
      new InvalidSupply('countTooLarge'),
    )
  })
})

describe('withOneMore', () => {
  it('counts the supply up by one', () => {
    expect(withOneMore(supply('bolognese', 3))).toEqual(supply('bolognese', 4))
  })

  it('stops at ninety-nine', () => {
    expect(withOneMore(supply('bolognese', 99))).toEqual(
      supply('bolognese', 99),
    )
  })
})

describe('withOneLess', () => {
  it('counts the supply down by one', () => {
    expect(withOneLess(supply('bolognese', 3))).toEqual(supply('bolognese', 2))
  })

  it('leaves no supply behind at the last portion', () => {
    expect(withOneLess(supply('bolognese', 1))).toBeNull()
  })
})

describe('withoutPortions', () => {
  it('takes the spent portions off the supply', () => {
    expect(withoutPortions(supply('bolognese', 3), 2)).toEqual(
      supply('bolognese', 1),
    )
  })

  it('leaves no supply behind when every portion is spent', () => {
    expect(withoutPortions(supply('bolognese', 2), 2)).toBeNull()
  })

  it('leaves no supply behind when more is spent than is there', () => {
    expect(withoutPortions(supply('bolognese', 1), 3)).toBeNull()
  })
})

describe('isFull', () => {
  it('reports a supply of ninety-nine as full', () => {
    expect(isFull(99)).toBe(true)
  })

  it('reports anything below ninety-nine as not full', () => {
    expect(isFull(98)).toBe(false)
  })
})

describe('isLastPortion', () => {
  it('reports a single portion as the last one', () => {
    expect(isLastPortion(1)).toBe(true)
  })

  it('reports more than one portion as not the last one', () => {
    expect(isLastPortion(2)).toBe(false)
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

describe('isInSupply', () => {
  it('reports a meal that is kept in store', () => {
    expect(isInSupply([supply('bolognese', 1)], 'bolognese')).toBe(true)
  })

  it('reports a meal without a supply as not kept in store', () => {
    expect(isInSupply([supply('bolognese', 1)], 'soup')).toBe(false)
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
