import { describe, expect, it } from 'vitest'
import {
  applyRename,
  canonicalName,
  knownItemIdOf,
  knownItemsByName,
  knownItemsFromHistory,
  planKnownItemRename,
  recordUse,
  suggestNames,
  withNamesInUse,
  type KnownItem,
} from './knownItem'
import { InvalidShoppingItem, type ShoppingItem } from './shoppingItem'

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

describe('knownItemsByName', () => {
  it('sorts the names the German way', () => {
    expect(
      knownItemsByName([known('Zucker'), known('Äpfel'), known('Brot')]),
    ).toEqual([known('Äpfel'), known('Brot'), known('Zucker')])
  })

  it('keeps the same name in different spellings side by side', () => {
    expect(
      knownItemsByName([
        known('hackfleisch'),
        known('Spaghetti'),
        known('Hackfleisch'),
      ]).map((knownItem) => knownItem.name),
    ).toEqual(['hackfleisch', 'Hackfleisch', 'Spaghetti'])
  })

  it('leaves the given catalog untouched', () => {
    const knownItems = [known('Zucker'), known('Äpfel')]

    knownItemsByName(knownItems)

    expect(knownItems).toEqual([known('Zucker'), known('Äpfel')])
  })
})

describe('canonicalName', () => {
  it('answers with the groomed spelling of a known name', () => {
    expect(canonicalName([known('Hackfleisch')], ' hackfleisch ')).toBe(
      'Hackfleisch',
    )
  })

  it('keeps a name that the catalog does not know', () => {
    expect(canonicalName([known('Hackfleisch')], 'Brot')).toBe('Brot')
  })

  it('keeps every name while the catalog is empty', () => {
    expect(canonicalName([], 'hackfleisch')).toBe('hackfleisch')
  })
})

describe('planKnownItemRename', () => {
  it('only corrects the spelling of an entry', () => {
    const rename = planKnownItemRename(
      [known('hackfleisch', 3, 7)],
      'hackfleisch',
      'Hackfleisch',
    )

    expect(rename).toEqual({
      written: known('Hackfleisch', 3, 7),
      removedName: null,
      addedUses: 0,
    })
  })

  it('carries the counters over to a name that is free', () => {
    const rename = planKnownItemRename(
      [known('Hackfleish', 3, 7), known('Brot', 1, 2)],
      'Hackfleish',
      'Hackfleisch',
    )

    expect(rename).toEqual({
      written: known('Hackfleisch', 3, 7),
      removedName: 'Hackfleish',
      addedUses: 3,
    })
  })

  it('merges the entry into the one that holds the name already', () => {
    const rename = planKnownItemRename(
      [known('Hackfleish', 3, 7), known('Hackfleisch', 12, 9)],
      'Hackfleish',
      'Hackfleisch',
    )

    expect(rename).toEqual({
      written: known('Hackfleisch', 15, 9),
      removedName: 'Hackfleish',
      addedUses: 3,
    })
  })

  it('takes a name that did not change at all', () => {
    const rename = planKnownItemRename([known('Brot', 2, 5)], 'Brot', ' Brot ')

    expect(rename).toEqual({
      written: known('Brot', 2, 5),
      removedName: null,
      addedUses: 0,
    })
  })

  it('knows nothing to rename when the entry is gone', () => {
    expect(planKnownItemRename([known('Brot')], 'Milch', 'Milch ')).toBeNull()
  })

  it('refuses a name the shopping list would refuse as well', () => {
    expect(() =>
      planKnownItemRename([known('Brot')], 'Brot', '   '),
    ).toThrowError(InvalidShoppingItem)
  })
})

describe('applyRename', () => {
  it('leaves one entry under the new name', () => {
    const knownItems = [known('Hackfleish', 3, 7), known('Hackfleisch', 12, 9)]
    const rename = planKnownItemRename(knownItems, 'Hackfleish', 'Hackfleisch')!

    expect(applyRename(knownItems, rename)).toEqual([
      known('Hackfleisch', 15, 9),
    ])
  })

  it('keeps the entries that are not touched', () => {
    const knownItems = [known('Brot', 1, 2), known('hackfleisch', 3, 7)]
    const rename = planKnownItemRename(
      knownItems,
      'hackfleisch',
      'Hackfleisch',
    )!

    expect(applyRename(knownItems, rename)).toEqual([
      known('Brot', 1, 2),
      known('Hackfleisch', 3, 7),
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
