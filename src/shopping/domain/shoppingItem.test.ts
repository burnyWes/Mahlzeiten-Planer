import { describe, expect, it } from 'vitest'
import { InvalidQuantity } from '../../shared/domain/quantity'
import {
  canTakeOneMore,
  checkOff,
  createShoppingItem,
  findOpenItemWithSameName,
  formatItemForAnnouncement,
  inCreationOrder,
  InvalidShoppingItem,
  isCheckedOff,
  isLastUnit,
  isOpen,
  normalizeItemName,
  reopen,
  steppedQuantity,
  withOneLess,
  withOneMore,
  withQuantity,
  type ShoppingItem,
} from './shoppingItem'

const createdAt = 1_700_000_000_000

function draft(
  overrides: Partial<Parameters<typeof createShoppingItem>[0]> = {},
) {
  return { name: 'Milch', amount: '', unit: '', ...overrides }
}

function item(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'anId',
    name: 'Milch',
    quantity: null,
    createdAt,
    checkedOffAt: null,
    ...overrides,
  }
}

describe('createShoppingItem', () => {
  it('trims the name', () => {
    expect(
      createShoppingItem(draft({ name: '  Brot  ' }), createdAt).name,
    ).toBe('Brot')
  })

  it('keeps the name as written', () => {
    expect(createShoppingItem(draft({ name: 'Müsli' }), createdAt).name).toBe(
      'Müsli',
    )
  })

  it('remembers when it was created', () => {
    expect(createShoppingItem(draft(), createdAt).createdAt).toBe(createdAt)
  })

  it('rejects an empty name', () => {
    expect(() => createShoppingItem(draft({ name: '   ' }), createdAt)).toThrow(
      InvalidShoppingItem,
    )
  })

  it('rejects a name longer than a hundred characters', () => {
    expect(() =>
      createShoppingItem(draft({ name: 'a'.repeat(101) }), createdAt),
    ).toThrow(InvalidShoppingItem)
  })

  it('accepts a name of exactly a hundred characters', () => {
    expect(
      createShoppingItem(draft({ name: 'a'.repeat(100) }), createdAt).name,
    ).toHaveLength(100)
  })

  it('takes the quantity from the draft', () => {
    expect(
      createShoppingItem(draft({ amount: '2', unit: 'l' }), createdAt).quantity,
    ).toEqual({ amount: 2, unit: 'l' })
  })

  it('lets an unreadable quantity through', () => {
    expect(() =>
      createShoppingItem(draft({ amount: 'viel' }), createdAt),
    ).toThrow(InvalidQuantity)
  })

  it('names the reason it refused', () => {
    expect(() => createShoppingItem(draft({ name: '' }), createdAt)).toThrow(
      expect.objectContaining({ reason: 'nameMissing' }),
    )
  })
})

describe('normalizeItemName', () => {
  it('ignores capitalisation', () => {
    expect(normalizeItemName('Milch')).toBe(normalizeItemName('milch'))
  })

  it('ignores surrounding spaces', () => {
    expect(normalizeItemName('  Milch ')).toBe(normalizeItemName('Milch'))
  })

  it('treats repeated spaces as one', () => {
    expect(normalizeItemName('Frische   Milch')).toBe(
      normalizeItemName('Frische Milch'),
    )
  })

  it('keeps different names apart', () => {
    expect(normalizeItemName('Milch')).not.toBe(normalizeItemName('Mehl'))
  })
})

describe('findOpenItemWithSameName', () => {
  it('finds an open item regardless of capitalisation', () => {
    const open = item({ id: 'milk', name: 'Milch' })

    expect(findOpenItemWithSameName([open], 'milch')).toBe(open)
  })

  it('ignores an item that is already checked off', () => {
    const checkedOff = item({ id: 'milk', checkedOffAt: createdAt + 1 })

    expect(findOpenItemWithSameName([checkedOff], 'Milch')).toBeNull()
  })

  it('reports nothing for an unknown name', () => {
    expect(findOpenItemWithSameName([item()], 'Brot')).toBeNull()
  })
})

describe('item state', () => {
  it('is open while no check off time is set', () => {
    expect(isOpen(item())).toBe(true)
    expect(isCheckedOff(item())).toBe(false)
  })

  it('is checked off once a time is set', () => {
    const checkedOff = item({ checkedOffAt: createdAt + 1 })

    expect(isCheckedOff(checkedOff)).toBe(true)
    expect(isOpen(checkedOff)).toBe(false)
  })
})

describe('formatItemForAnnouncement', () => {
  it('speaks the bare name when there is no quantity', () => {
    expect(formatItemForAnnouncement(item({ name: 'Brot' }))).toBe('Brot')
  })

  it('speaks amount and unit after the name', () => {
    expect(
      formatItemForAnnouncement(
        item({ name: 'Milch', quantity: { amount: 2, unit: 'l' } }),
      ),
    ).toBe('Milch, 2 l')
  })

  it('speaks an amount without a unit', () => {
    expect(
      formatItemForAnnouncement(
        item({ name: 'Eier', quantity: { amount: 6, unit: null } }),
      ),
    ).toBe('Eier, 6')
  })
})

describe('inCreationOrder', () => {
  it('puts the oldest item first', () => {
    const older = item({ id: 'older', createdAt: 1 })
    const newer = item({ id: 'newer', createdAt: 2 })

    expect(inCreationOrder([newer, older])).toEqual([older, newer])
  })

  it('keeps items created in the same millisecond apart by id', () => {
    const first = item({ id: 'a', createdAt: 1 })
    const second = item({ id: 'b', createdAt: 1 })

    expect(inCreationOrder([second, first])).toEqual([first, second])
  })

  it('leaves the given list untouched', () => {
    const items = [
      item({ id: 'newer', createdAt: 2 }),
      item({ id: 'older', createdAt: 1 }),
    ]

    inCreationOrder(items)

    expect(items[0].id).toBe('newer')
  })
})

describe('checkOff and reopen', () => {
  it('remembers when an item was checked off', () => {
    expect(checkOff(item(), 500).checkedOffAt).toBe(500)
  })

  it('leaves the item itself untouched', () => {
    const open = item()

    checkOff(open, 500)

    expect(open.checkedOffAt).toBeNull()
  })

  it('keeps everything but the check off time', () => {
    const checkedOff = checkOff(item({ name: 'Brot' }), 500)

    expect(checkedOff.name).toBe('Brot')
    expect(checkedOff.id).toBe('anId')
  })

  it('makes a checked off item open again', () => {
    expect(reopen(checkOff(item(), 500)).checkedOffAt).toBeNull()
  })
})

describe('withQuantity', () => {
  it('replaces the quantity and keeps everything else', () => {
    const changed = withQuantity(item({ name: 'Milch' }), {
      amount: 3,
      unit: 'l',
    })

    expect(changed.quantity).toEqual({ amount: 3, unit: 'l' })
    expect(changed.name).toBe('Milch')
    expect(changed.id).toBe('anId')
  })

  it('leaves the item itself untouched', () => {
    const untouched = item()

    withQuantity(untouched, { amount: 3, unit: 'l' })

    expect(untouched.quantity).toBeNull()
  })
})

describe('stepping the quantity', () => {
  function withAmount(amount: number, unit: string | null = null) {
    return item({ quantity: { amount, unit } })
  }

  it('counts an item without quantity as one', () => {
    expect(steppedQuantity(item())).toEqual({ amount: 1, unit: null })
  })

  it.each([
    [null, { amount: 2, unit: null }],
    [
      { amount: 1, unit: null },
      { amount: 2, unit: null },
    ],
    [
      { amount: 0.5, unit: 'l' },
      { amount: 1.5, unit: 'l' },
    ],
    [
      { amount: 1.2345, unit: 'l' },
      { amount: 2.2345, unit: 'l' },
    ],
    [
      { amount: 1.5, unit: 'l' },
      { amount: 2.5, unit: 'l' },
    ],
    [
      { amount: 2.2, unit: 'l' },
      { amount: 3.2, unit: 'l' },
    ],
    [
      { amount: 500, unit: 'g' },
      { amount: 501, unit: 'g' },
    ],
    [
      { amount: 9998, unit: 'g' },
      { amount: 9999, unit: 'g' },
    ],
  ])('takes one more of %j', (quantity, expected) => {
    expect(withOneMore(item({ quantity })).quantity).toEqual(expected)
  })

  it.each([
    [
      { amount: 1.2345, unit: 'l' },
      { amount: 0.2345, unit: 'l' },
    ],
    [
      { amount: 1.5, unit: 'l' },
      { amount: 0.5, unit: 'l' },
    ],
    [
      { amount: 2.2, unit: 'l' },
      { amount: 1.2, unit: 'l' },
    ],
    [
      { amount: 500, unit: 'g' },
      { amount: 499, unit: 'g' },
    ],
    [
      { amount: 9998, unit: 'g' },
      { amount: 9997, unit: 'g' },
    ],
    [
      { amount: 9998.5, unit: 'g' },
      { amount: 9997.5, unit: 'g' },
    ],
    [
      { amount: 9999, unit: 'g' },
      { amount: 9998, unit: 'g' },
    ],
    [
      { amount: 12000, unit: 'ml' },
      { amount: 11999, unit: 'ml' },
    ],
  ])('takes one less of %j', (quantity, expected) => {
    expect(withOneLess(item({ quantity }))?.quantity).toEqual(expected)
  })

  it.each([[null], [{ amount: 1, unit: null }], [{ amount: 0.5, unit: 'l' }]])(
    'takes the last unit of %j',
    (quantity) => {
      expect(isLastUnit(item({ quantity }))).toBe(true)
      expect(withOneLess(item({ quantity }))).toBeNull()
    },
  )

  it('keeps more than one unit', () => {
    expect(isLastUnit(withAmount(1.5, 'l'))).toBe(false)
  })

  it('offers one more up to the upper bound', () => {
    expect(canTakeOneMore(withAmount(9998, 'g'))).toBe(true)
  })

  it.each([[9998.5], [9999], [12000]])(
    'offers no more once %d plus one would pass the upper bound',
    (amount) => {
      const atTheBound = withAmount(amount, 'g')

      expect(canTakeOneMore(atTheBound)).toBe(false)
      expect(withOneMore(atTheBound)).toBe(atTheBound)
    },
  )
})
