import { describe, expect, it } from 'vitest'
import {
  addQuantities,
  canAddQuantities,
  formatQuantity,
  invalidQuantityMessage,
  InvalidQuantity,
  orOneWithoutUnit,
  readQuantity,
  sameQuantity,
  type Quantity,
} from './quantity'

function draft(overrides: Partial<{ amount: string; unit: string }> = {}) {
  return { amount: '', unit: '', ...overrides }
}

describe('readQuantity', () => {
  it('reports nothing when no amount is given', () => {
    expect(readQuantity(draft())).toBeNull()
  })

  it('reads a positive amount with its unit', () => {
    expect(readQuantity(draft({ amount: '2', unit: 'l' }))).toEqual({
      amount: 2,
      unit: 'l',
    })
  })

  it('reads an amount written with a comma', () => {
    expect(readQuantity(draft({ amount: '1,5', unit: 'kg' }))).toEqual({
      amount: 1.5,
      unit: 'kg',
    })
  })

  it('keeps an amount without a unit', () => {
    expect(readQuantity(draft({ amount: '3' }))).toEqual({
      amount: 3,
      unit: null,
    })
  })

  it('ignores surrounding spaces around the unit', () => {
    expect(readQuantity(draft({ amount: '2', unit: '  l ' }))).toEqual({
      amount: 2,
      unit: 'l',
    })
  })

  it('rejects an amount of zero', () => {
    expect(() => readQuantity(draft({ amount: '0' }))).toThrow(InvalidQuantity)
  })

  it('rejects a negative amount', () => {
    expect(() => readQuantity(draft({ amount: '-2' }))).toThrow(InvalidQuantity)
  })

  it('rejects an amount that is not a number', () => {
    expect(() => readQuantity(draft({ amount: 'viel' }))).toThrow(
      InvalidQuantity,
    )
  })

  it('rejects a unit without an amount', () => {
    expect(() => readQuantity(draft({ amount: '  ', unit: 'l' }))).toThrow(
      InvalidQuantity,
    )
  })

  it('names the reason it refused', () => {
    expect(() => readQuantity(draft({ amount: 'viel' }))).toThrow(
      expect.objectContaining({ reason: 'amountNotANumber' }),
    )
  })
})

describe('formatQuantity', () => {
  it('says nothing when there is no quantity', () => {
    expect(formatQuantity(null)).toBe('')
  })

  it('speaks amount and unit', () => {
    expect(formatQuantity({ amount: 2, unit: 'l' })).toBe('2 l')
  })

  it('speaks an amount without a unit', () => {
    expect(formatQuantity({ amount: 6, unit: null })).toBe('6')
  })
})

describe('adding quantities', () => {
  const twoLitres: Quantity = { amount: 2, unit: 'l' }
  const oneLitre: Quantity = { amount: 1, unit: 'l' }

  it('counts a missing quantity as one without a unit', () => {
    expect(canAddQuantities(null, null)).toBe(true)
    expect(addQuantities(null, null)).toEqual({ amount: 2, unit: null })
  })

  it('adds two amounts of the same unit', () => {
    expect(canAddQuantities(twoLitres, oneLitre)).toBe(true)
    expect(addQuantities(twoLitres, oneLitre)).toEqual({
      amount: 3,
      unit: 'l',
    })
  })

  it('adds two amounts without a unit', () => {
    expect(
      addQuantities({ amount: 2, unit: null }, { amount: 1, unit: null }),
    ).toEqual({ amount: 3, unit: null })
  })

  it('refuses to add a missing quantity to one with a unit', () => {
    expect(canAddQuantities(null, twoLitres)).toBe(false)
    expect(canAddQuantities(twoLitres, null)).toBe(false)
  })

  it('refuses to add different units', () => {
    expect(canAddQuantities(twoLitres, { amount: 500, unit: 'g' })).toBe(false)
  })

  it('refuses to add what it cannot add', () => {
    expect(() => addQuantities(twoLitres, { amount: 500, unit: 'g' })).toThrow(
      InvalidQuantity,
    )
  })
})

describe('sameQuantity', () => {
  it('sees two missing quantities as the same', () => {
    expect(sameQuantity(null, null)).toBe(true)
  })

  it('tells a missing quantity from a given one', () => {
    expect(sameQuantity(null, { amount: 1, unit: null })).toBe(false)
  })

  it('compares amount and unit', () => {
    expect(
      sameQuantity({ amount: 2, unit: 'l' }, { amount: 2, unit: 'l' }),
    ).toBe(true)
    expect(
      sameQuantity({ amount: 2, unit: 'l' }, { amount: 3, unit: 'l' }),
    ).toBe(false)
    expect(
      sameQuantity({ amount: 2, unit: 'l' }, { amount: 2, unit: 'g' }),
    ).toBe(false)
  })
})

describe('invalidQuantityMessage', () => {
  it('explains an amount that is not a number', () => {
    expect(invalidQuantityMessage('amountNotANumber')).toBe(
      'Die Menge muss eine Zahl sein.',
    )
  })

  it('explains an amount that is not positive', () => {
    expect(invalidQuantityMessage('amountNotPositive')).toBe(
      'Die Menge muss größer als null sein.',
    )
  })

  it('explains a missing amount next to a unit', () => {
    expect(invalidQuantityMessage('unitWithoutAmount')).toBe(
      'Zur Einheit fehlt die Menge.',
    )
  })
})

describe('orOneWithoutUnit', () => {
  it('counts a missing quantity as one without unit', () => {
    expect(orOneWithoutUnit(null)).toEqual({ amount: 1, unit: null })
  })

  it('keeps a given quantity', () => {
    expect(orOneWithoutUnit({ amount: 500, unit: 'g' })).toEqual({
      amount: 500,
      unit: 'g',
    })
  })
})
