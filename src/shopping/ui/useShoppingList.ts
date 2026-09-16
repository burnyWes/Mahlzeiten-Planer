import { useCallback, useEffect, useRef, useState } from 'react'
import type { KnownItemsClient } from '../api/knownItemsClient'
import type { ShoppingListClient } from '../api/shoppingListClient'
import {
  planAddition,
  planAdditions,
  summarizeAdditions,
  type AdditionOutcome,
  type AdditionsSummary,
} from '../domain/addition'
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
  type NewShoppingItem,
  type ShoppingItem,
  type ShoppingItemDraft,
} from '../domain/shoppingItem'
import {
  appendToFrozenOrder,
  firstFrozenOrder,
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
  addItems: (newItems: readonly NewShoppingItem[]) => AdditionsSummary
  toggleItem: (item: ShoppingItem) => string
  cleanUp: () => string
}

export function useShoppingList(
  client: ShoppingListClient,
  knownItemsClient: KnownItemsClient,
): ShoppingList {
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
          setFrozenOrder((appended) => firstFrozenOrder(appended, items))
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

  const carryOutAll = useCallback(
    (outcomes: readonly AdditionOutcome[]) => {
      const written = outcomes.map(carryOut)
      outcomes.forEach((outcome) =>
        knownItemsClient.recordUse(outcome.item.name, outcome.item.createdAt),
      )
      setUnconfirmedWrites((writes) => written.reduce(rememberWrite, writes))
      setFrozenOrder((order) =>
        written.reduce(
          (sofar, item) => appendToFrozenOrder(sofar, item.id),
          order,
        ),
      )
    },
    [carryOut, knownItemsClient],
  )

  const addItem = useCallback(
    (draft: ShoppingItemDraft) => {
      const outcome = planAddition(
        createShoppingItem(draft, Date.now()),
        knownItems,
      )
      carryOutAll([outcome])
      return additionAnnouncement(outcome)
    },
    [carryOutAll, knownItems],
  )

  const addItems = useCallback(
    (newItems: readonly NewShoppingItem[]) => {
      const outcomes = planAdditions(newItems, knownItems)
      carryOutAll(outcomes)
      return summarizeAdditions(outcomes)
    },
    [carryOutAll, knownItems],
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
    addItems,
    toggleItem,
    cleanUp,
  }
}
