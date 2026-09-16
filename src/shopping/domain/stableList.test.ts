import { describe, expect, it } from 'vitest'
import type { ShoppingItem } from './shoppingItem'
import {
  appendToFrozenOrder,
  firstFrozenOrder,
  nextFrozenOrder,
  pendingChangeCount,
  projectStableList,
} from './stableList'

function item(
  id: string,
  createdAt: number,
  checkedOffAt: number | null = null,
): ShoppingItem {
  return { id, name: id, quantity: null, createdAt, checkedOffAt }
}

const bread = item('bread', 1)
const milk = item('milk', 2)
const cheese = item('cheese', 3)

describe('projectStableList', () => {
  it('keeps the frozen order even when the live data arrives differently sorted', () => {
    const shown = projectStableList(['bread', 'milk'], [milk, bread])

    expect(shown.map((shownItem) => shownItem.id)).toEqual(['bread', 'milk'])
  })

  it('leaves out an item that only appeared in the live data', () => {
    const shown = projectStableList(['bread'], [bread, cheese])

    expect(shown.map((shownItem) => shownItem.id)).toEqual(['bread'])
  })

  it('keeps showing an item that was checked off, now with its time', () => {
    const checkedOffMilk = item('milk', 2, 500)

    const shown = projectStableList(['bread', 'milk'], [bread, checkedOffMilk])

    expect(shown.map((shownItem) => shownItem.id)).toEqual(['bread', 'milk'])
    expect(shown[1].checkedOffAt).toBe(500)
  })

  it('takes the current content from the live data', () => {
    const renamedBread = { ...bread, name: 'Vollkornbrot' }

    const shown = projectStableList(['bread'], [renamedBread])

    expect(shown[0].name).toBe('Vollkornbrot')
  })

  it('drops an item the live data no longer knows at all', () => {
    const shown = projectStableList(['bread', 'milk'], [bread])

    expect(shown.map((shownItem) => shownItem.id)).toEqual(['bread'])
  })
})

describe('pendingChangeCount', () => {
  it('counts nothing while the list matches the live data', () => {
    expect(pendingChangeCount(['bread', 'milk'], [bread, milk])).toBe(0)
  })

  it('counts an item that arrived from the other device', () => {
    expect(pendingChangeCount(['bread'], [bread, cheese])).toBe(1)
  })

  it('counts an item that was checked off', () => {
    expect(
      pendingChangeCount(['bread', 'milk'], [bread, item('milk', 2, 500)]),
    ).toBe(1)
  })

  it('counts an item that vanished from the live data', () => {
    expect(pendingChangeCount(['bread', 'milk'], [bread])).toBe(1)
  })

  it('adds arrivals and departures together', () => {
    expect(
      pendingChangeCount(
        ['bread', 'milk'],
        [bread, item('milk', 2, 500), cheese],
      ),
    ).toBe(2)
  })
})

describe('nextFrozenOrder', () => {
  it('keeps exactly the open items', () => {
    expect(nextFrozenOrder([bread, item('milk', 2, 500), cheese])).toEqual([
      'bread',
      'cheese',
    ])
  })

  it('puts them back into the order they were entered', () => {
    expect(nextFrozenOrder([cheese, bread, milk])).toEqual([
      'bread',
      'milk',
      'cheese',
    ])
  })
})

describe('appendToFrozenOrder', () => {
  it('adds a new id at the end', () => {
    expect(appendToFrozenOrder(['bread'], 'milk')).toEqual(['bread', 'milk'])
  })

  it('leaves an id that is already there where it is', () => {
    expect(appendToFrozenOrder(['bread', 'milk'], 'bread')).toEqual([
      'bread',
      'milk',
    ])
  })
})

describe('firstFrozenOrder', () => {
  it('freezes the arriving items in creation order', () => {
    expect(firstFrozenOrder([], [cheese, bread, milk])).toEqual([
      'bread',
      'milk',
      'cheese',
    ])
  })

  it('leaves out what is already checked off', () => {
    expect(firstFrozenOrder([], [bread, item('milk', 2, 500)])).toEqual([
      'bread',
    ])
  })

  it('keeps items this device appended before the first snapshot at the end', () => {
    expect(firstFrozenOrder(['cheese', 'milk'], [bread, milk, cheese])).toEqual(
      ['bread', 'cheese', 'milk'],
    )
  })
})
