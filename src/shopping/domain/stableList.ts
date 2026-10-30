import type { Grouping, ListGroup, ListSection } from './categorizedList'
import { findItemCategory, type ItemCategoryCatalog } from './itemCategory'
import { isOpen, type ItemId, type ShoppingItem } from './shoppingItem'

export type FrozenList = {
  ids: readonly ItemId[]
  groupOf: ReadonlyMap<ItemId, ListGroup>
}

export const EMPTY_FROZEN_LIST: FrozenList = { ids: [], groupOf: new Map() }

function itemsById(items: readonly ShoppingItem[]): Map<ItemId, ShoppingItem> {
  return new Map(items.map((item) => [item.id, item]))
}

function frozenGroupOf(frozen: FrozenList, id: ItemId): ListGroup {
  return frozen.groupOf.get(id) ?? null
}

function inGroupOrder(
  items: readonly ShoppingItem[],
  grouping: Grouping,
): readonly ShoppingItem[] {
  return [...items].sort(
    (one, other) =>
      grouping.rankOf(grouping.groupOf(one)) -
        grouping.rankOf(grouping.groupOf(other)) ||
      one.createdAt - other.createdAt ||
      one.id.localeCompare(other.id),
  )
}

function frozenListOf(
  items: readonly ShoppingItem[],
  grouping: Grouping,
): FrozenList {
  return {
    ids: items.map((item) => item.id),
    groupOf: new Map(items.map((item) => [item.id, grouping.groupOf(item)])),
  }
}

export function projectStableList(
  frozen: FrozenList,
  liveItems: readonly ShoppingItem[],
): readonly ShoppingItem[] {
  const live = itemsById(liveItems)
  return frozen.ids
    .map((id) => live.get(id))
    .filter((item): item is ShoppingItem => item !== undefined)
}

function distinctInOrder<Value>(values: readonly Value[]): readonly Value[] {
  return [...new Set(values)]
}

function groupsOutOfPlace(
  frozenGroups: readonly ListGroup[],
  grouping: Grouping,
): ReadonlySet<ListGroup> {
  const ranked = [...frozenGroups].sort(
    (one, other) => grouping.rankOf(one) - grouping.rankOf(other),
  )
  return new Set(frozenGroups.filter((group, index) => ranked[index] !== group))
}

export function pendingChangeCount(
  frozen: FrozenList,
  liveItems: readonly ShoppingItem[],
  grouping: Grouping,
): number {
  const live = itemsById(liveItems)
  const frozenIds = new Set(frozen.ids)

  const departures = frozen.ids.filter((id) => {
    const item = live.get(id)
    return item === undefined || !isOpen(item)
  }).length

  const arrivals = liveItems.filter(
    (item) => isOpen(item) && !frozenIds.has(item.id),
  ).length

  const stayingOpen = projectStableList(frozen, liveItems).filter(isOpen)
  const outOfPlace = groupsOutOfPlace(
    distinctInOrder(stayingOpen.map((item) => frozenGroupOf(frozen, item.id))),
    grouping,
  )
  const moved = stayingOpen.filter((item) => {
    const group = frozenGroupOf(frozen, item.id)
    return grouping.groupOf(item) !== group || outOfPlace.has(group)
  }).length

  return departures + arrivals + moved
}

export function nextFrozenList(
  liveItems: readonly ShoppingItem[],
  grouping: Grouping,
): FrozenList {
  return frozenListOf(
    inGroupOrder(liveItems.filter(isOpen), grouping),
    grouping,
  )
}

function insertionIndex(
  frozen: FrozenList,
  group: ListGroup,
  grouping: Grouping,
): number {
  const lastOfGroup = frozen.ids.findLastIndex(
    (id) => frozenGroupOf(frozen, id) === group,
  )
  if (lastOfGroup !== -1) return lastOfGroup + 1
  const firstOfLaterGroup = frozen.ids.findIndex(
    (id) => grouping.rankOf(frozenGroupOf(frozen, id)) > grouping.rankOf(group),
  )
  return firstOfLaterGroup === -1 ? frozen.ids.length : firstOfLaterGroup
}

export function insertIntoFrozenList(
  frozen: FrozenList,
  id: ItemId,
  group: ListGroup,
  grouping: Grouping,
): FrozenList {
  if (frozen.groupOf.has(id)) return frozen
  const index = insertionIndex(frozen, group, grouping)
  return {
    ids: [...frozen.ids.slice(0, index), id, ...frozen.ids.slice(index)],
    groupOf: new Map([...frozen.groupOf, [id, group]]),
  }
}

export function firstFrozenList(
  appended: FrozenList,
  liveItems: readonly ShoppingItem[],
  grouping: Grouping,
): FrozenList {
  const arriving = nextFrozenList(
    liveItems.filter((item) => !appended.groupOf.has(item.id)),
    grouping,
  )
  return appended.ids.reduce(
    (list, id) =>
      insertIntoFrozenList(list, id, frozenGroupOf(appended, id), grouping),
    arriving,
  )
}

export function regroupFrozenList(
  frozen: FrozenList,
  liveItems: readonly ShoppingItem[],
  grouping: Grouping,
): FrozenList {
  return frozenListOf(
    inGroupOrder(projectStableList(frozen, liveItems), grouping),
    grouping,
  )
}

export function withoutFromFrozenList(
  frozen: FrozenList,
  id: ItemId,
): FrozenList {
  return {
    ids: frozen.ids.filter((frozenId) => frozenId !== id),
    groupOf: new Map(
      [...frozen.groupOf].filter(([frozenId]) => frozenId !== id),
    ),
  }
}

export function projectSections(
  frozen: FrozenList,
  liveItems: readonly ShoppingItem[],
  catalog: ItemCategoryCatalog,
  grouped: boolean,
): readonly ListSection[] {
  const shown = projectStableList(frozen, liveItems)
  if (shown.length === 0) return []
  if (!grouped) return [{ category: null, items: shown }]

  const sections: {
    category: ListSection['category']
    items: ShoppingItem[]
  }[] = []
  for (const item of shown) {
    const category = findItemCategory(catalog, frozenGroupOf(frozen, item.id))
    const current = sections.at(-1)
    if (current !== undefined && current.category?.id === category?.id)
      current.items.push(item)
    else sections.push({ category, items: [item] })
  }
  return sections
}
