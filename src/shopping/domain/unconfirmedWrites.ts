import { sameQuantity } from '../../shared/domain/quantity'
import type { ItemId, ShoppingItem } from './shoppingItem'

export type UnconfirmedWrite = {
  written: ShoppingItem
  before: ShoppingItem | null
}

export type UnconfirmedWrites = readonly UnconfirmedWrite[]

export type UnconfirmedRemovals = readonly ItemId[]

function sameItemState(one: ShoppingItem, other: ShoppingItem): boolean {
  return (
    one.name === other.name &&
    one.checkedOffAt === other.checkedOffAt &&
    sameQuantity(one.quantity, other.quantity)
  )
}

export function rememberWrite(
  writes: UnconfirmedWrites,
  written: ShoppingItem,
  before: ShoppingItem | null,
): UnconfirmedWrites {
  const earlier = writes.find((write) => write.written.id === written.id)
  return [
    ...writes.filter((write) => write.written.id !== written.id),
    { written, before: earlier === undefined ? before : earlier.before },
  ]
}

export function withUnconfirmedWrites(
  liveItems: readonly ShoppingItem[],
  writes: UnconfirmedWrites,
): readonly ShoppingItem[] {
  const pending = new Map<ItemId, ShoppingItem>(
    writes.map((write) => [write.written.id, write.written]),
  )
  const known = liveItems.map((item) => {
    const written = pending.get(item.id)
    pending.delete(item.id)
    return written ?? item
  })
  return [...known, ...pending.values()]
}

export function dropConfirmedWrites(
  writes: UnconfirmedWrites,
  liveItems: readonly ShoppingItem[],
): UnconfirmedWrites {
  return writes.filter((write) => {
    const live = liveItems.find((item) => item.id === write.written.id)
    if (live === undefined) return true
    if (sameItemState(live, write.written)) return false
    if (write.before === null) return true
    return sameItemState(live, write.before)
  })
}

export function withoutUnconfirmedRemovals(
  items: readonly ShoppingItem[],
  removals: UnconfirmedRemovals,
): readonly ShoppingItem[] {
  return items.filter((item) => !removals.includes(item.id))
}

export function dropConfirmedRemovals(
  removals: UnconfirmedRemovals,
  liveItems: readonly ShoppingItem[],
): UnconfirmedRemovals {
  return removals.filter((id) => liveItems.some((item) => item.id === id))
}

export function forgetWritesOf(
  writes: UnconfirmedWrites,
  id: ItemId,
): UnconfirmedWrites {
  return writes.filter((write) => write.written.id !== id)
}
