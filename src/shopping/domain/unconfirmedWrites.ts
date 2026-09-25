import { sameQuantity } from '../../shared/domain/quantity'
import { isOpen, type ItemId, type ShoppingItem } from './shoppingItem'

export type UnconfirmedWrite = {
  written: ShoppingItem
  before: ShoppingItem | null
  earlierWrites: readonly ShoppingItem[]
}

export type UnconfirmedWrites = readonly UnconfirmedWrite[]

export type UnconfirmedRemoval = { id: ItemId; seen: boolean }

export type UnconfirmedRemovals = readonly UnconfirmedRemoval[]

function sameItemState(one: ShoppingItem, other: ShoppingItem): boolean {
  return (
    one.name === other.name &&
    one.checkedOffAt === other.checkedOffAt &&
    sameQuantity(one.quantity, other.quantity)
  )
}

function sameStateApartFromCheckOffTime(
  one: ShoppingItem,
  other: ShoppingItem,
): boolean {
  return (
    one.name === other.name &&
    isOpen(one) === isOpen(other) &&
    sameQuantity(one.quantity, other.quantity)
  )
}

function isOwnEarlierState(
  write: UnconfirmedWrite,
  live: ShoppingItem,
): boolean {
  if (write.before !== null && sameItemState(live, write.before)) return true
  return write.earlierWrites.some((earlier) =>
    sameStateApartFromCheckOffTime(live, earlier),
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
    earlier === undefined
      ? { written, before, earlierWrites: [] }
      : {
          written,
          before: earlier.before,
          earlierWrites: [...earlier.earlierWrites, earlier.written],
        },
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
    if (live === undefined) return write.before === null
    if (sameItemState(live, write.written)) return false
    if (isOwnEarlierState(write, live)) return true
    return write.before === null && write.earlierWrites.length === 0
  })
}

function carries(liveItems: readonly ShoppingItem[], id: ItemId): boolean {
  return liveItems.some((item) => item.id === id)
}

export function rememberRemoval(
  removals: UnconfirmedRemovals,
  id: ItemId,
  liveItems: readonly ShoppingItem[],
): UnconfirmedRemovals {
  return [...removals, { id, seen: carries(liveItems, id) }]
}

export function withoutUnconfirmedRemovals(
  items: readonly ShoppingItem[],
  removals: UnconfirmedRemovals,
): readonly ShoppingItem[] {
  return items.filter(
    (item) => !removals.some((removal) => removal.id === item.id),
  )
}

export function dropConfirmedRemovals(
  removals: UnconfirmedRemovals,
  liveItems: readonly ShoppingItem[],
): UnconfirmedRemovals {
  return removals
    .filter((removal) => !removal.seen || carries(liveItems, removal.id))
    .map((removal) =>
      removal.seen
        ? removal
        : { ...removal, seen: carries(liveItems, removal.id) },
    )
}

export function forgetWritesOf(
  writes: UnconfirmedWrites,
  id: ItemId,
): UnconfirmedWrites {
  return writes.filter((write) => write.written.id !== id)
}
