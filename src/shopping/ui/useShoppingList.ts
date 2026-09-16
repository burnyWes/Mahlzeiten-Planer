import { useCallback, useEffect, useRef, useState } from 'react'
import type { ShoppingListClient } from '../api/shoppingListClient'
import { planAddition, type AdditionOutcome } from '../domain/addition'
import {
  additionAnnouncement,
  checkOffAnnouncement,
  cleanUpAnnouncement,
  reopenAnnouncement,
} from '../domain/announcements'
import {
  createShoppingItem,
  isOpen,
  withQuantity,
  type ShoppingItem,
  type ShoppingItemDraft,
} from '../domain/shoppingItem'
import {
  appendToFrozenOrder,
  nextFrozenOrder,
  pendingChangeCount,
  projectStableList,
  type FrozenOrder,
} from '../domain/stableList'
import {
  dropConfirmedWrites,
  rememberWrite,
  withUnconfirmedWrites,
  type UnconfirmedWrites,
} from '../domain/unconfirmedWrites'

export type ShoppingList = {
  items: readonly ShoppingItem[]
  openCount: number
  pendingChanges: number
  addItem: (draft: ShoppingItemDraft) => string
  toggleItem: (item: ShoppingItem) => string
  cleanUp: () => string
}

export function useShoppingList(client: ShoppingListClient): ShoppingList {
  const [liveItems, setLiveItems] = useState<readonly ShoppingItem[]>([])
  const [frozenOrder, setFrozenOrder] = useState<FrozenOrder>([])
  const [unconfirmedWrites, setUnconfirmedWrites] = useState<UnconfirmedWrites>(
    [],
  )
  const frozenOnFirstItems = useRef(false)

  useEffect(
    () =>
      client.observeItems((items) => {
        setLiveItems(items)
        setUnconfirmedWrites((writes) => dropConfirmedWrites(writes, items))
        if (!frozenOnFirstItems.current) {
          frozenOnFirstItems.current = true
          setFrozenOrder(nextFrozenOrder(items))
        }
      }),
    [client],
  )

  const knownItems = withUnconfirmedWrites(liveItems, unconfirmedWrites)
  const shownItems = projectStableList(frozenOrder, liveItems)
  const openCount = shownItems.filter(isOpen).length

  const carryOut = useCallback(
    (outcome: AdditionOutcome): ShoppingItem => {
      if (outcome.kind === 'mergedInto') {
        client.changeQuantity(outcome.into.id, outcome.quantity)
        return withQuantity(outcome.into, outcome.quantity)
      }
      return {
        ...outcome.item,
        id: client.addItem(outcome.item),
        checkedOffAt: null,
      }
    },
    [client],
  )

  const addItem = useCallback(
    (draft: ShoppingItemDraft) => {
      const outcome = planAddition(
        createShoppingItem(draft, Date.now()),
        knownItems,
      )
      const written = carryOut(outcome)
      setUnconfirmedWrites((writes) => rememberWrite(writes, written))
      setFrozenOrder((order) => appendToFrozenOrder(order, written.id))
      return additionAnnouncement(outcome)
    },
    [carryOut, knownItems],
  )

  const toggleItem = useCallback(
    (item: ShoppingItem) => {
      if (isOpen(item)) {
        client.checkOffItem(item.id)
        return checkOffAnnouncement(item, openCount - 1)
      }
      client.reopenItem(item.id)
      return reopenAnnouncement(item, openCount + 1)
    },
    [client, openCount],
  )

  const cleanUp = useCallback(() => {
    const order = nextFrozenOrder(liveItems)
    setFrozenOrder(order)
    return cleanUpAnnouncement(order.length)
  }, [liveItems])

  return {
    items: shownItems,
    openCount,
    pendingChanges: pendingChangeCount(frozenOrder, liveItems),
    addItem,
    toggleItem,
    cleanUp,
  }
}
