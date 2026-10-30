import { describe, expect, it } from 'vitest'
import {
  groupingOf,
  groupOfAddedItem,
  showsSectionHeadings,
  UNGROUPED,
} from './categorizedList'
import type { ItemCategoryCatalog } from './itemCategory'
import type { KnownItem } from './knownItem'
import type { ShoppingItem } from './shoppingItem'

function item(name: string): ShoppingItem {
  return { id: name, name, quantity: null, createdAt: 1, checkedOffAt: null }
}

function known(name: string, categoryId: string | null): KnownItem {
  return { name, lastUsedAt: 1, timesUsed: 1, categoryId }
}

const catalog: ItemCategoryCatalog = {
  categories: [
    { id: 'fruit', name: 'Obst/Gemüse' },
    { id: 'frozen', name: 'Tiefkühlkost' },
  ],
  sortByCategory: true,
}

const knownItems = [
  known('Äpfel', 'fruit'),
  known('Pizza', 'frozen'),
  known('Batterien', null),
  known('Kaugummi', 'deleted'),
]

describe('groupingOf', () => {
  it('groups an item by the category of its known item', () => {
    const grouping = groupingOf(catalog, knownItems)

    expect(grouping.groupOf(item('äpfel '))).toBe('fruit')
    expect(grouping.groupOf(item('Pizza'))).toBe('frozen')
  })

  it('leaves unknown, uncategorized and orphaned items ungrouped', () => {
    const grouping = groupingOf(catalog, knownItems)

    expect(grouping.groupOf(item('Bananen'))).toBeNull()
    expect(grouping.groupOf(item('Batterien'))).toBeNull()
    expect(grouping.groupOf(item('Kaugummi'))).toBeNull()
  })

  it('ranks the groups by the order of the catalog, the ungrouped last', () => {
    const grouping = groupingOf(catalog, knownItems)

    expect(grouping.rankOf('fruit')).toBeLessThan(grouping.rankOf('frozen'))
    expect(grouping.rankOf('frozen')).toBeLessThan(grouping.rankOf(null))
  })

  it('ranks a category not yet in the catalog behind the known ones and before the ungrouped', () => {
    const grouping = groupingOf(catalog, knownItems)

    expect(grouping.rankOf('frozen')).toBeLessThan(grouping.rankOf('fresh'))
    expect(grouping.rankOf('fresh')).toBeLessThan(grouping.rankOf(null))
  })

  it('groups nothing while the sorting is switched off', () => {
    const grouping = groupingOf(
      { ...catalog, sortByCategory: false },
      knownItems,
    )

    expect(grouping).toBe(UNGROUPED)
    expect(grouping.groupOf(item('Äpfel'))).toBeNull()
    expect(grouping.rankOf('fruit')).toBe(grouping.rankOf(null))
  })
})

describe('groupOfAddedItem', () => {
  it('takes the chosen category', () => {
    expect(
      groupOfAddedItem(
        groupingOf(catalog, knownItems),
        item('Äpfel'),
        'frozen',
      ),
    ).toBe('frozen')
  })

  it('takes the category of the known item without a choice', () => {
    expect(
      groupOfAddedItem(groupingOf(catalog, knownItems), item('Äpfel'), null),
    ).toBe('fruit')
  })

  it('groups nothing while the sorting is switched off', () => {
    expect(groupOfAddedItem(UNGROUPED, item('Äpfel'), 'frozen')).toBeNull()
  })
})

describe('showsSectionHeadings', () => {
  const fruit = { id: 'fruit', name: 'Obst/Gemüse' }

  it('shows headings as soon as there is a category', () => {
    expect(showsSectionHeadings([{ category: fruit, items: [] }])).toBe(true)
  })

  it('shows headings for several sections', () => {
    expect(
      showsSectionHeadings([
        { category: null, items: [] },
        { category: null, items: [] },
      ]),
    ).toBe(true)
  })

  it('shows no heading for a single uncategorized section', () => {
    expect(showsSectionHeadings([{ category: null, items: [] }])).toBe(false)
  })
})
