import { describe, expect, it } from 'vitest'
import { groupingOf, UNGROUPED, type ListGroup } from './categorizedList'
import type { ItemCategoryCatalog } from './itemCategory'
import type { KnownItem } from './knownItem'
import type { ShoppingItem } from './shoppingItem'
import {
  firstFrozenList,
  insertIntoFrozenList,
  nextFrozenList,
  pendingChangeCount,
  projectSections,
  projectStableList,
  regroupFrozenList,
  withoutFromFrozenList,
  type FrozenList,
} from './stableList'

function item(
  id: string,
  createdAt: number,
  checkedOffAt: number | null = null,
): ShoppingItem {
  return { id, name: id, quantity: null, createdAt, checkedOffAt }
}

function frozen(...ids: readonly string[]): FrozenList {
  return { ids, groupOf: new Map(ids.map((id) => [id, null])) }
}

function frozenInGroups(
  ...entries: readonly (readonly [string, ListGroup])[]
): FrozenList {
  return {
    ids: entries.map(([id]) => id),
    groupOf: new Map(entries),
  }
}

const bread = item('bread', 1)
const milk = item('milk', 2)
const cheese = item('cheese', 3)

const catalog: ItemCategoryCatalog = {
  categories: [
    { id: 'fruit', name: 'Obst/Gemüse' },
    { id: 'frozen', name: 'Tiefkühlkost' },
  ],
  sortByCategory: true,
}

function known(name: string, categoryId: string | null): KnownItem {
  return { name, lastUsedAt: 1, timesUsed: 1, categoryId }
}

const knownItems = [
  known('apples', 'fruit'),
  known('bananas', 'fruit'),
  known('pizza', 'frozen'),
  known('peas', 'frozen'),
]

const grouping = groupingOf(catalog, knownItems)

const pizza = item('pizza', 1)
const apples = item('apples', 2)
const batteries = item('batteries', 3)
const bananas = item('bananas', 4)
const peas = item('peas', 5)

describe('projectStableList', () => {
  it('keeps the frozen order even when the live data arrives differently sorted', () => {
    const shown = projectStableList(frozen('bread', 'milk'), [milk, bread])

    expect(shown.map((shownItem) => shownItem.id)).toEqual(['bread', 'milk'])
  })

  it('leaves out an item that only appeared in the live data', () => {
    const shown = projectStableList(frozen('bread'), [bread, cheese])

    expect(shown.map((shownItem) => shownItem.id)).toEqual(['bread'])
  })

  it('keeps showing an item that was checked off, now with its time', () => {
    const checkedOffMilk = item('milk', 2, 500)

    const shown = projectStableList(frozen('bread', 'milk'), [
      bread,
      checkedOffMilk,
    ])

    expect(shown.map((shownItem) => shownItem.id)).toEqual(['bread', 'milk'])
    expect(shown[1].checkedOffAt).toBe(500)
  })

  it('takes the current content from the live data', () => {
    const renamedBread = { ...bread, name: 'Vollkornbrot' }

    const shown = projectStableList(frozen('bread'), [renamedBread])

    expect(shown[0].name).toBe('Vollkornbrot')
  })

  it('drops an item the live data no longer knows at all', () => {
    const shown = projectStableList(frozen('bread', 'milk'), [bread])

    expect(shown.map((shownItem) => shownItem.id)).toEqual(['bread'])
  })
})

describe('pendingChangeCount', () => {
  it('counts nothing while the list matches the live data', () => {
    expect(
      pendingChangeCount(frozen('bread', 'milk'), [bread, milk], UNGROUPED),
    ).toBe(0)
  })

  it('counts an item that arrived from the other device', () => {
    expect(
      pendingChangeCount(frozen('bread'), [bread, cheese], UNGROUPED),
    ).toBe(1)
  })

  it('counts an item that was checked off', () => {
    expect(
      pendingChangeCount(
        frozen('bread', 'milk'),
        [bread, item('milk', 2, 500)],
        UNGROUPED,
      ),
    ).toBe(1)
  })

  it('counts an item that vanished from the live data', () => {
    expect(
      pendingChangeCount(frozen('bread', 'milk'), [bread], UNGROUPED),
    ).toBe(1)
  })

  it('adds arrivals and departures together', () => {
    expect(
      pendingChangeCount(
        frozen('bread', 'milk'),
        [bread, item('milk', 2, 500), cheese],
        UNGROUPED,
      ),
    ).toBe(2)
  })

  it('counts nothing while the groups match the live data', () => {
    const list = nextFrozenList([pizza, apples, batteries], grouping)

    expect(pendingChangeCount(list, [pizza, apples, batteries], grouping)).toBe(
      0,
    )
  })

  it('counts an open item whose category changed', () => {
    const list = nextFrozenList([pizza, apples, batteries], grouping)
    const recategorized = groupingOf(catalog, [
      ...knownItems.filter((knownItem) => knownItem.name !== 'pizza'),
      known('pizza', 'fruit'),
    ])

    expect(
      pendingChangeCount(list, [pizza, apples, batteries], recategorized),
    ).toBe(1)
  })

  it('counts no checked off item whose category changed', () => {
    const list = nextFrozenList([pizza, apples], grouping)
    const recategorized = groupingOf(catalog, [
      ...knownItems.filter((knownItem) => knownItem.name !== 'pizza'),
      known('pizza', 'fruit'),
    ])

    expect(
      pendingChangeCount(list, [item('pizza', 1, 500), apples], recategorized),
    ).toBe(1)
  })

  it('counts the open items of categories that changed their order', () => {
    const list = nextFrozenList([pizza, apples, bananas, batteries], grouping)
    const reordered = groupingOf(
      { ...catalog, categories: [...catalog.categories].reverse() },
      knownItems,
    )

    expect(
      pendingChangeCount(list, [pizza, apples, bananas, batteries], reordered),
    ).toBe(3)
  })
})

describe('nextFrozenList', () => {
  it('keeps exactly the open items', () => {
    expect(
      nextFrozenList([bread, item('milk', 2, 500), cheese], UNGROUPED).ids,
    ).toEqual(['bread', 'cheese'])
  })

  it('puts them back into the order they were entered', () => {
    expect(nextFrozenList([cheese, bread, milk], UNGROUPED).ids).toEqual([
      'bread',
      'milk',
      'cheese',
    ])
  })

  it('orders by the categories, then by the order they were entered', () => {
    const list = nextFrozenList(
      [peas, batteries, bananas, apples, pizza],
      grouping,
    )

    expect(list.ids).toEqual([
      'apples',
      'bananas',
      'pizza',
      'peas',
      'batteries',
    ])
    expect(list.groupOf.get('apples')).toBe('fruit')
    expect(list.groupOf.get('peas')).toBe('frozen')
    expect(list.groupOf.get('batteries')).toBeNull()
  })
})

describe('insertIntoFrozenList', () => {
  it('appends at the end without groups', () => {
    expect(
      insertIntoFrozenList(frozen('bread'), 'milk', null, UNGROUPED).ids,
    ).toEqual(['bread', 'milk'])
  })

  it('leaves an id that is already there where it is', () => {
    expect(
      insertIntoFrozenList(frozen('bread', 'milk'), 'bread', null, UNGROUPED)
        .ids,
    ).toEqual(['bread', 'milk'])
  })

  const list = frozenInGroups(
    ['apples', 'fruit'],
    ['pizza', 'frozen'],
    ['batteries', null],
  )

  it('puts an item behind the last one of its group', () => {
    const inserted = insertIntoFrozenList(list, 'bananas', 'fruit', grouping)

    expect(inserted.ids).toEqual(['apples', 'bananas', 'pizza', 'batteries'])
    expect(inserted.groupOf.get('bananas')).toBe('fruit')
  })

  it('puts an item of the last group at the end', () => {
    expect(insertIntoFrozenList(list, 'soap', null, grouping).ids).toEqual([
      'apples',
      'pizza',
      'batteries',
      'soap',
    ])
  })

  it('opens a new group at its place in the order', () => {
    const withoutFruit = frozenInGroups(
      ['pizza', 'frozen'],
      ['batteries', null],
    )

    expect(
      insertIntoFrozenList(withoutFruit, 'apples', 'fruit', grouping).ids,
    ).toEqual(['apples', 'pizza', 'batteries'])
  })

  it('opens a new last group at the end', () => {
    const onlyFruit = frozenInGroups(['apples', 'fruit'])

    expect(
      insertIntoFrozenList(onlyFruit, 'batteries', null, grouping).ids,
    ).toEqual(['apples', 'batteries'])
  })

  it('opens a category not yet in the catalog before the ungrouped items', () => {
    expect(insertIntoFrozenList(list, 'soap', 'fresh', grouping).ids).toEqual([
      'apples',
      'pizza',
      'soap',
      'batteries',
    ])
  })
})

describe('firstFrozenList', () => {
  it('freezes the arriving items in creation order', () => {
    expect(
      firstFrozenList(frozen(), [cheese, bread, milk], UNGROUPED).ids,
    ).toEqual(['bread', 'milk', 'cheese'])
  })

  it('leaves out what is already checked off', () => {
    expect(
      firstFrozenList(frozen(), [bread, item('milk', 2, 500)], UNGROUPED).ids,
    ).toEqual(['bread'])
  })

  it('keeps items this device appended before the first snapshot at the end', () => {
    expect(
      firstFrozenList(
        frozen('cheese', 'milk'),
        [bread, milk, cheese],
        UNGROUPED,
      ).ids,
    ).toEqual(['bread', 'cheese', 'milk'])
  })

  it('puts the appended items into their groups', () => {
    expect(
      firstFrozenList(
        frozenInGroups(['bananas', 'fruit']),
        [pizza, apples, bananas],
        grouping,
      ).ids,
    ).toEqual(['apples', 'bananas', 'pizza'])
  })
})

describe('regroupFrozenList', () => {
  it('orders the same items by their groups, checked off ones included', () => {
    const checkedOffApples = item('apples', 2, 500)
    const list = frozen('pizza', 'apples', 'batteries')

    const regrouped = regroupFrozenList(
      list,
      [pizza, checkedOffApples, batteries, bananas],
      grouping,
    )

    expect(regrouped.ids).toEqual(['apples', 'pizza', 'batteries'])
    expect(regrouped.groupOf.get('apples')).toBe('fruit')
  })

  it('takes the groups away without sorting', () => {
    const list = nextFrozenList([pizza, apples, batteries], grouping)

    const regrouped = regroupFrozenList(
      list,
      [pizza, apples, batteries],
      UNGROUPED,
    )

    expect(regrouped.ids).toEqual(['pizza', 'apples', 'batteries'])
    expect([...regrouped.groupOf.values()]).toEqual([null, null, null])
  })
})

describe('withoutFromFrozenList', () => {
  it('takes the id out and keeps the order of the others', () => {
    expect(
      withoutFromFrozenList(frozen('bread', 'milk', 'cheese'), 'milk').ids,
    ).toEqual(['bread', 'cheese'])
  })

  it('does not count a removed item as a pending change', () => {
    const list = frozen('bread', 'milk')

    expect(pendingChangeCount(list, [bread], UNGROUPED)).toBe(1)
    expect(
      pendingChangeCount(
        withoutFromFrozenList(list, 'milk'),
        [bread],
        UNGROUPED,
      ),
    ).toBe(0)
  })
})

describe('projectSections', () => {
  function sectionsOf(list: FrozenList, live: readonly ShoppingItem[]) {
    return projectSections(list, live, catalog, true).map((section) => [
      section.category?.name ?? null,
      section.items.map((shown) => shown.id),
    ])
  }

  it('gathers the items of each frozen group', () => {
    const list = nextFrozenList([pizza, apples, bananas, batteries], grouping)

    expect(sectionsOf(list, [pizza, apples, bananas, batteries])).toEqual([
      ['Obst/Gemüse', ['apples', 'bananas']],
      ['Tiefkühlkost', ['pizza']],
      [null, ['batteries']],
    ])
  })

  it('keeps a group whose items are all checked off', () => {
    const list = nextFrozenList([pizza, apples], grouping)

    expect(sectionsOf(list, [pizza, item('apples', 2, 500)])).toEqual([
      ['Obst/Gemüse', ['apples']],
      ['Tiefkühlkost', ['pizza']],
    ])
  })

  it('leaves out a group without shown items', () => {
    const list = nextFrozenList([pizza, apples], grouping)

    expect(sectionsOf(list, [pizza])).toEqual([['Tiefkühlkost', ['pizza']]])
  })

  it('shows a single section without grouping', () => {
    const list = nextFrozenList([pizza, apples], grouping)

    expect(
      projectSections(list, [pizza, apples], catalog, false).map((section) => [
        section.category,
        section.items.map((shown) => shown.id),
      ]),
    ).toEqual([[null, ['apples', 'pizza']]])
  })

  it('shows no section for an empty list', () => {
    expect(projectSections(frozen(), [], catalog, true)).toEqual([])
  })
})
