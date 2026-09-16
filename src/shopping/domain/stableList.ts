import {
  inCreationOrder,
  isOpen,
  type ItemId,
  type ShoppingItem,
} from './shoppingItem'

export type FrozenOrder = readonly ItemId[]

function itemsById(items: readonly ShoppingItem[]): Map<ItemId, ShoppingItem> {
  return new Map(items.map((item) => [item.id, item]))
}

export function projectStableList(
  frozenOrder: FrozenOrder,
  liveItems: readonly ShoppingItem[],
): readonly ShoppingItem[] {
  const live = itemsById(liveItems)
  return frozenOrder
    .map((id) => live.get(id))
    .filter((item): item is ShoppingItem => item !== undefined)
}

export function pendingChangeCount(
  frozenOrder: FrozenOrder,
  liveItems: readonly ShoppingItem[],
): number {
  const live = itemsById(liveItems)
  const frozen = new Set(frozenOrder)

  const departures = frozenOrder.filter((id) => {
    const item = live.get(id)
    return item === undefined || !isOpen(item)
  }).length

  const arrivals = liveItems.filter(
    (item) => isOpen(item) && !frozen.has(item.id),
  ).length

  return departures + arrivals
}

export function nextFrozenOrder(
  liveItems: readonly ShoppingItem[],
): FrozenOrder {
  return inCreationOrder(liveItems.filter(isOpen)).map((item) => item.id)
}

export function appendToFrozenOrder(
  frozenOrder: FrozenOrder,
  id: ItemId,
): FrozenOrder {
  return frozenOrder.includes(id) ? frozenOrder : [...frozenOrder, id]
}

export function firstFrozenOrder(
  appended: FrozenOrder,
  liveItems: readonly ShoppingItem[],
): FrozenOrder {
  const arriving = nextFrozenOrder(liveItems).filter(
    (id) => !appended.includes(id),
  )
  return [...arriving, ...appended]
}
