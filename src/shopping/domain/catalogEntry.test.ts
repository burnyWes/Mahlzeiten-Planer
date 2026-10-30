import { describe, expect, it } from 'vitest'
import {
  planCatalogRename,
  recordCatalogUse,
  withCatalogNamesInUse,
  type CatalogEntry,
} from './catalogEntry'

type TaggedEntry = CatalogEntry & { tag: string }

function tagged(name: string, tag: string, timesUsed = 1): TaggedEntry {
  return { name, lastUsedAt: 1, timesUsed, tag }
}

function untagged(entry: CatalogEntry): TaggedEntry {
  return { ...entry, tag: 'new' }
}

describe('recordCatalogUse', () => {
  it('keeps the additional fields of a known entry', () => {
    expect(
      recordCatalogUse([tagged('Äpfel', 'fruit')], 'äpfel', 5, untagged),
    ).toEqual([{ name: 'äpfel', lastUsedAt: 5, timesUsed: 2, tag: 'fruit' }])
  })

  it('builds a new entry with the given factory', () => {
    expect(recordCatalogUse([], 'Äpfel', 5, untagged)).toEqual([
      { name: 'Äpfel', lastUsedAt: 5, timesUsed: 1, tag: 'new' },
    ])
  })
})

describe('withCatalogNamesInUse', () => {
  it('builds the unknown names with the given factory', () => {
    expect(
      withCatalogNamesInUse([tagged('Äpfel', 'fruit')], ['Brot'], untagged),
    ).toEqual([
      tagged('Äpfel', 'fruit'),
      { name: 'Brot', lastUsedAt: 0, timesUsed: 0, tag: 'new' },
    ])
  })
})

describe('planCatalogRename', () => {
  it('keeps the additional fields of the entry merged into', () => {
    const rename = planCatalogRename(
      [tagged('Apfel', 'old', 2), tagged('Äpfel', 'fruit', 3)],
      'Apfel',
      'Äpfel',
    )

    expect(rename?.written).toEqual({
      name: 'Äpfel',
      lastUsedAt: 1,
      timesUsed: 5,
      tag: 'fruit',
    })
  })
})
