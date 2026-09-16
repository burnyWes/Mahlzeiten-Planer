import { describe, expect, it } from 'vitest'
import type { Quantity } from '../../shared/domain/quantity'
import { planAddition, planAdditions } from './addition'
import type { NewShoppingItem, ShoppingItem } from './shoppingItem'

const createdAt = 1_700_000_000_000

function newItem(
  name: string,
  quantity: Quantity | null = null,
): NewShoppingItem {
  return { name, quantity, createdAt }
}

function openItem(
  name: string,
  quantity: Quantity | null = null,
): ShoppingItem {
  return { ...newItem(name, quantity), id: name, checkedOffAt: null }
}

describe('planAddition', () => {
  it('plans a new entry when no open item shares the name', () => {
    expect(planAddition(newItem('Milch'), [openItem('Brot')])).toEqual({
      kind: 'newItem',
      item: newItem('Milch'),
    })
  })

  it('merges into the open item when the units match', () => {
    const open = openItem('Milch', { amount: 2, unit: 'l' })

    expect(
      planAddition(newItem('Milch', { amount: 1, unit: 'l' }), [open]),
    ).toEqual({
      kind: 'mergedInto',
      item: newItem('Milch', { amount: 1, unit: 'l' }),
      into: open,
      quantity: { amount: 3, unit: 'l' },
    })
  })

  it('counts two items without a quantity as two', () => {
    const merged = planAddition(newItem('Milch'), [openItem('Milch')])

    expect(merged).toMatchObject({
      kind: 'mergedInto',
      quantity: { amount: 2, unit: null },
    })
  })

  it('finds the open item regardless of capitalisation', () => {
    expect(planAddition(newItem('milch'), [openItem('Milch')]).kind).toBe(
      'mergedInto',
    )
  })

  it('puts an item with another unit beside the open one', () => {
    const open = openItem('Milch', { amount: 2, unit: 'l' })

    expect(
      planAddition(newItem('Milch', { amount: 500, unit: 'g' }), [open]),
    ).toEqual({
      kind: 'besideDifferentUnit',
      item: newItem('Milch', { amount: 500, unit: 'g' }),
      open,
    })
  })

  it('ignores an item of the same name that is already checked off', () => {
    const checkedOff = { ...openItem('Milch'), checkedOffAt: createdAt + 1 }

    expect(planAddition(newItem('Milch'), [checkedOff]).kind).toBe('newItem')
  })
})

describe('planAdditions', () => {
  it('plans every item on its own when the names differ', () => {
    const planned = planAdditions([newItem('Milch'), newItem('Brot')], [])

    expect(planned.map((outcome) => outcome.kind)).toEqual([
      'newItem',
      'newItem',
    ])
  })

  it('adds up what two items of one transfer bring to the same open item', () => {
    const open = openItem('Milch', { amount: 2, unit: 'l' })

    const planned = planAdditions(
      [
        newItem('Milch', { amount: 1, unit: 'l' }),
        newItem('Milch', { amount: 1, unit: 'l' }),
      ],
      [open],
    )

    expect(planned).toHaveLength(1)
    expect(planned[0]).toMatchObject({
      kind: 'mergedInto',
      quantity: { amount: 4, unit: 'l' },
    })
  })

  it('lets two equal items of one transfer fall together into one entry', () => {
    const planned = planAdditions(
      [
        newItem('Milch', { amount: 1, unit: 'l' }),
        newItem('Milch', { amount: 1, unit: 'l' }),
      ],
      [],
    )

    expect(planned).toEqual([
      {
        kind: 'newItem',
        item: newItem('Milch', { amount: 2, unit: 'l' }),
      },
    ])
  })

  it('keeps two items of one transfer apart when their units differ', () => {
    const planned = planAdditions(
      [
        newItem('Milch', { amount: 1, unit: 'l' }),
        newItem('Milch', { amount: 500, unit: 'g' }),
      ],
      [],
    )

    expect(planned.map((outcome) => outcome.kind)).toEqual([
      'newItem',
      'newItem',
    ])
  })

  it('leaves the given items untouched', () => {
    const items = [openItem('Milch', { amount: 2, unit: 'l' })]

    planAdditions([newItem('Milch', { amount: 1, unit: 'l' })], items)

    expect(items[0].quantity).toEqual({ amount: 2, unit: 'l' })
  })
})
