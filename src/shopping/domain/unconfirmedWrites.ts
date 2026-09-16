import { sameQuantity } from '../../shared/domain/quantity'
import { withQuantity, type ItemId, type ShoppingItem } from './shoppingItem'

export type UnconfirmedWrites = readonly ShoppingItem[]

export function rememberWrite(
  writes: UnconfirmedWrites,
  written: ShoppingItem,
): UnconfirmedWrites {
  return [...writes.filter((write) => write.id !== written.id), written]
}

export function withUnconfirmedWrites(
  liveItems: readonly ShoppingItem[],
  writes: UnconfirmedWrites,
): readonly ShoppingItem[] {
  const pending = new Map<ItemId, ShoppingItem>(
    writes.map((write) => [write.id, write]),
  )
  const known = liveItems.map((item) => {
    const written = pending.get(item.id)
    pending.delete(item.id)
    return written === undefined ? item : withQuantity(item, written.quantity)
  })
  return [...known, ...pending.values()]
}

export function dropConfirmedWrites(
  writes: UnconfirmedWrites,
  liveItems: readonly ShoppingItem[],
): UnconfirmedWrites {
  return writes.filter((write) => {
    const live = liveItems.find((item) => item.id === write.id)
    return live === undefined || !sameQuantity(live.quantity, write.quantity)
  })
}
