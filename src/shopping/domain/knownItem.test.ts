import { describe, expect, it } from 'vitest'
import {
  knownItemIdOf,
  knownItemsFromHistory,
  recordUse,
  suggestNames,
  withNamesInUse,
  type KnownItem,
} from './knownItem'
import type { ShoppingItem } from './shoppingItem'

function known(name: string, timesUsed = 1, lastUsedAt = 1): KnownItem {
  return { name, timesUsed, lastUsedAt }
}

function historyItem(
  id: string,
  name: string,
  createdAt: number,
  checkedOffAt: number | null = null,
): ShoppingItem {
  return { id, name, quantity: null, createdAt, checkedOffAt }
}

describe('suggestNames', () => {
  it('finds a name that holds what was typed in the middle', () => {
    expect(suggestNames([known('Hafermilch')], 'milch')).toEqual(['Hafermilch'])
  })

  it('ignores capitalisation and repeated spaces', () => {
    expect(suggestNames([known('Frische Milch')], '  FRISCHE   mi')).toEqual([
      'Frische Milch',
    ])
  })

  it('suggests nothing below two typed characters', () => {
    expect(suggestNames([known('Milch')], 'm')).toEqual([])
    expect(suggestNames([known('Milch')], ' m  ')).toEqual([])
  })

  it('suggests nothing when no name matches', () => {
    expect(suggestNames([known('Milch')], 'brot')).toEqual([])
  })

  it('puts names starting with the typed text before the others, however often those were used', () => {
    expect(
      suggestNames([known('Hafermilch', 9), known('Milchreis', 1)], 'milch'),
    ).toEqual(['Milchreis', 'Hafermilch'])
  })

  it('orders within a group by times used, then last use, then alphabetically', () => {
    const knownItems = [
      known('Milch Zebra', 1, 5),
      known('Milch Apfel', 1, 5),
      known('Milch spät', 1, 9),
      known('Milch oft', 3, 1),
    ]

    expect(suggestNames(knownItems, 'milch')).toEqual([
      'Milch oft',
      'Milch spät',
      'Milch Apfel',
      'Milch Zebra',
    ])
  })

  it('sorts umlauts the German way', () => {
    expect(
      suggestNames([known('Milch Zucker'), known('Milch Äpfel')], 'milch'),
    ).toEqual(['Milch Äpfel', 'Milch Zucker'])
  })

  it('leaves out the name that equals what was typed', () => {
    expect(
      suggestNames([known('milch'), known('Milchreis')], 'Milch '),
    ).toEqual(['Milchreis'])
  })

  it('suggests five names at most', () => {
    const knownItems = ['A', 'B', 'C', 'D', 'E', 'F'].map((letter) =>
      known(`Milch ${letter}`),
    )

    expect(suggestNames(knownItems, 'milch')).toHaveLength(5)
  })
})

describe('recordUse', () => {
  it('takes in a new name as used once', () => {
    expect(recordUse([known('Brot', 4, 1)], 'Milch', 500)).toEqual([
      known('Brot', 4, 1),
      known('Milch', 1, 500),
    ])
  })

  it('counts a known name up and keeps the newest spelling and use', () => {
    expect(recordUse([known('milch', 2, 1)], 'Milch', 500)).toEqual([
      known('Milch', 3, 500),
    ])
  })

  it('leaves the given catalog untouched', () => {
    const knownItems = [known('Milch', 2, 1)]

    recordUse(knownItems, 'Milch', 500)

    expect(knownItems).toEqual([known('Milch', 2, 1)])
  })
})

describe('knownItemsFromHistory', () => {
  it('counts checked off and open items alike', () => {
    expect(
      knownItemsFromHistory([
        historyItem('first', 'Milch', 1, 2),
        historyItem('second', 'Milch', 3),
      ]),
    ).toEqual([known('Milch', 2, 3)])
  })

  it('gathers names that are the same once normalized under the newest spelling', () => {
    expect(
      knownItemsFromHistory([
        historyItem('newer', 'Hafer  Milch', 7),
        historyItem('older', 'hafer milch', 2, 3),
        historyItem('bread', 'Brot', 5),
      ]),
    ).toEqual([known('Hafer  Milch', 2, 7), known('Brot', 1, 5)])
  })

  it('knows nothing without a history', () => {
    expect(knownItemsFromHistory([])).toEqual([])
  })
})

describe('withNamesInUse', () => {
  it('adds a name unknown so far as never used', () => {
    expect(withNamesInUse([known('Brot', 2, 5)], ['Hackfleisch'])).toEqual([
      known('Brot', 2, 5),
      known('Hackfleisch', 0, 0),
    ])
  })

  it('keeps the catalog entry of a name that is already known', () => {
    expect(withNamesInUse([known('Milch', 3, 7)], [' milch'])).toEqual([
      known('Milch', 3, 7),
    ])
  })

  it('adds a name used in several meals only once', () => {
    expect(withNamesInUse([], ['Zwiebel', 'zwiebel ', 'Zwiebel'])).toEqual([
      known('Zwiebel', 0, 0),
    ])
  })
})

describe('knownItemIdOf', () => {
  it('is the same for names that are the same once normalized', () => {
    expect(knownItemIdOf(' milch ')).toBe(knownItemIdOf('Milch'))
  })

  it('keeps different names apart', () => {
    expect(knownItemIdOf('Milch')).not.toBe(knownItemIdOf('Mehl'))
  })

  it('contains no slash', () => {
    expect(knownItemIdOf('Saft 1/2 l')).not.toContain('/')
  })

  it('is never a single or double dot', () => {
    expect(knownItemIdOf('.')).not.toBe('.')
    expect(knownItemIdOf('..')).not.toBe('..')
  })

  it('never looks like a reserved id with double underscores', () => {
    expect(knownItemIdOf('__milch__')).not.toMatch(/^__.*__$/)
  })
})
