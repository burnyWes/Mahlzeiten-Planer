import { describe, expect, it } from 'vitest'
import {
  canonicalUnit,
  DEFAULT_UNITS,
  knownUnitsByName,
  knownUnitsFromHistory,
  planKnownUnitRename,
  suggestUnits,
  withCanonicalUnit,
  withUnitsInUse,
  type KnownUnit,
} from './knownUnit'
import { InvalidShoppingItem, type ShoppingItem } from './shoppingItem'

function known(name: string, timesUsed = 1, lastUsedAt = 1): KnownUnit {
  return { name, timesUsed, lastUsedAt }
}

function historyItem(
  id: string,
  unit: string | null,
  createdAt: number,
): ShoppingItem {
  return {
    id,
    name: 'Mehl',
    quantity: { amount: 1, unit },
    createdAt,
    checkedOffAt: null,
  }
}

function entryNamed(knownUnits: readonly KnownUnit[], name: string) {
  return knownUnits.find((knownUnit) => knownUnit.name === name)
}

describe('suggestUnits', () => {
  it('suggests a unit from a single typed character', () => {
    expect(suggestUnits([known('kg'), known('ml')], 'k')).toEqual(['kg'])
  })

  it('puts units starting with the typed text first', () => {
    expect(suggestUnits([known('Pck.', 9), known('ml', 1)], 'm')).toEqual([
      'ml',
    ])
    expect(suggestUnits([known('Stück', 9), known('kg', 1)], 'k')).toEqual([
      'kg',
      'Stück',
    ])
  })

  it('leaves out the unit that equals what was typed', () => {
    expect(suggestUnits([known('g'), known('kg')], 'G')).toEqual(['kg'])
  })

  it('suggests five units at most', () => {
    const knownUnits = ['A', 'B', 'C', 'D', 'E', 'F'].map((letter) =>
      known(`l${letter}`),
    )

    expect(suggestUnits(knownUnits, 'l')).toHaveLength(5)
  })
})

describe('canonicalUnit', () => {
  it('answers with the spelling of a known unit', () => {
    expect(canonicalUnit([known('g')], 'G')).toBe('g')
  })

  it('keeps a unit the catalog does not know', () => {
    expect(canonicalUnit([known('g')], 'Zehe')).toBe('Zehe')
  })
})

describe('withCanonicalUnit', () => {
  it('takes over the spelling of a known unit', () => {
    expect(withCanonicalUnit([known('g')], { amount: 500, unit: 'G' })).toEqual(
      { amount: 500, unit: 'g' },
    )
  })

  it('keeps a quantity without unit', () => {
    expect(withCanonicalUnit([known('g')], { amount: 2, unit: null })).toEqual({
      amount: 2,
      unit: null,
    })
  })

  it('keeps a missing quantity', () => {
    expect(withCanonicalUnit([known('g')], null)).toBeNull()
  })
})

describe('knownUnitsFromHistory', () => {
  it('holds the default units as never used', () => {
    expect(knownUnitsFromHistory([], [])).toEqual(
      DEFAULT_UNITS.map((name) => known(name, 0, 0)),
    )
  })

  it('counts every item that carries a unit', () => {
    const knownUnits = knownUnitsFromHistory(
      [historyItem('first', 'g', 3), historyItem('second', 'g', 8)],
      [],
    )

    expect(entryNamed(knownUnits, 'g')).toEqual(known('g', 2, 8))
  })

  it('counts every unit of the meals', () => {
    const knownUnits = knownUnitsFromHistory([], ['g', 'Zehe'])

    expect(entryNamed(knownUnits, 'g')).toEqual(known('g', 1, 0))
    expect(entryNamed(knownUnits, 'Zehe')).toEqual(known('Zehe', 1, 0))
  })

  it('gathers spellings under the newest one', () => {
    const knownUnits = knownUnitsFromHistory(
      [historyItem('older', 'g', 2), historyItem('newer', 'G', 5)],
      [],
    )

    expect(entryNamed(knownUnits, 'G')).toEqual(known('G', 2, 5))
    expect(entryNamed(knownUnits, 'g')).toBeUndefined()
  })

  it('keeps the default spelling against an undated meal unit', () => {
    const knownUnits = knownUnitsFromHistory([], ['G'])

    expect(entryNamed(knownUnits, 'g')).toEqual(known('g', 1, 0))
    expect(entryNamed(knownUnits, 'G')).toBeUndefined()
  })

  it('ignores items without a unit', () => {
    const withoutQuantity: ShoppingItem = {
      ...historyItem('bread', null, 4),
      quantity: null,
    }

    expect(
      knownUnitsFromHistory(
        [historyItem('milk', null, 3), withoutQuantity],
        [],
      ),
    ).toEqual(DEFAULT_UNITS.map((name) => known(name, 0, 0)))
  })
})

describe('withUnitsInUse', () => {
  it('adds a unit unknown so far as never used', () => {
    expect(withUnitsInUse([known('g', 2, 5)], ['Zehe', 'G'])).toEqual([
      known('g', 2, 5),
      known('Zehe', 0, 0),
    ])
  })
})

describe('planKnownUnitRename', () => {
  it('merges the unit into the one that holds the name already', () => {
    expect(
      planKnownUnitRename([known('gr', 2, 7), known('g', 5, 3)], 'gr', 'g'),
    ).toEqual({
      written: known('g', 7, 7),
      removedName: 'gr',
      addedUses: 2,
    })
  })

  it('only corrects the spelling', () => {
    expect(planKnownUnitRename([known('Zehe', 2, 7)], 'Zehe', 'zehe')).toEqual({
      written: known('zehe', 2, 7),
      removedName: null,
      addedUses: 0,
    })
  })

  it('refuses an empty name', () => {
    expect(() => planKnownUnitRename([known('g')], 'g', '  ')).toThrowError(
      new InvalidShoppingItem('nameMissing'),
    )
  })
})

describe('knownUnitsByName', () => {
  it('sorts the units the German way', () => {
    expect(
      knownUnitsByName([known('Zehe'), known('Äpfel'), known('g')]).map(
        (knownUnit) => knownUnit.name,
      ),
    ).toEqual(['Äpfel', 'g', 'Zehe'])
  })
})
