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
import { canonicalName, type KnownItem } from '../domain/knownItem'
import {
  additionAnnouncement,
  checkOffAnnouncement,
  cleanUpAnnouncement,
  reopenAnnouncement,
} from '../domain/announcements'
import {
  checkOff,
  createShoppingItem,
  isOpen,
  reopen,
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
  type UnconfirmedWrite,
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
  knownItems: readonly KnownItem[],
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

  const settledItems = withUnconfirmedWrites(liveItems, unconfirmedWrites)
  const shownItems = projectStableList(frozenOrder, settledItems)
  const openCount = shownItems.filter(isOpen).length

  const carryOut = useCallback(
    (outcome: AdditionOutcome): UnconfirmedWrite => {
      if (outcome.kind === 'mergedInto') {
        client.changeQuantity(outcome.into.id, outcome.quantity)
        return {
          written: withQuantity(outcome.into, outcome.quantity),
          before: liveItems.find((live) => live.id === outcome.into.id) ?? null,
        }
      }
      return {
        written: {
          ...outcome.item,
          id: client.addItem(outcome.item),
          checkedOffAt: null,
        },
        before: null,
      }
    },
    [client, liveItems],
  )

  const carryOutAll = useCallback(
    (outcomes: readonly AdditionOutcome[]) => {
      const written = outcomes.map(carryOut)
      outcomes.forEach((outcome) =>
        knownItemsClient.recordUse(outcome.item.name, outcome.item.createdAt),
      )
      setUnconfirmedWrites((writes) =>
        written.reduce(
          (sofar, write) => rememberWrite(sofar, write.written, write.before),
          writes,
        ),
      )
      setFrozenOrder((order) =>
        written.reduce(
          (sofar, write) => appendToFrozenOrder(sofar, write.written.id),
          order,
        ),
      )
    },
    [carryOut, knownItemsClient],
  )

  const underGroomedName = useCallback(
    (item: NewShoppingItem): NewShoppingItem => ({
      ...item,
      name: canonicalName(knownItems, item.name),
    }),
    [knownItems],
  )

  const addItem = useCallback(
    (draft: ShoppingItemDraft) => {
      const outcome = planAddition(
        underGroomedName(createShoppingItem(draft, Date.now())),
        settledItems,
      )
      carryOutAll([outcome])
      return additionAnnouncement(outcome)
    },
    [carryOutAll, settledItems, underGroomedName],
  )

  const addItems = useCallback(
    (newItems: readonly NewShoppingItem[]) => {
      const outcomes = planAdditions(
        newItems.map(underGroomedName),
        settledItems,
      )
      carryOutAll(outcomes)
      return summarizeAdditions(outcomes)
    },
    [carryOutAll, settledItems, underGroomedName],
  )

  const toggleItem = useCallback(
    (item: ShoppingItem) => {
      const before = liveItems.find((live) => live.id === item.id) ?? null
      if (isOpen(item)) {
        client.checkOffItem(item.id)
        setUnconfirmedWrites((writes) =>
          rememberWrite(writes, checkOff(item, Date.now()), before),
        )
        return checkOffAnnouncement(item, openCount - 1)
      }
      client.reopenItem(item.id)
      setUnconfirmedWrites((writes) =>
        rememberWrite(writes, reopen(item), before),
      )
      return reopenAnnouncement(item, openCount + 1)
    },
    [client, liveItems, openCount],
  )

  const cleanUp = useCallback(() => {
    const order = nextFrozenOrder(settledItems)
    setFrozenOrder(order)
    return cleanUpAnnouncement(order.length)
  }, [settledItems])

  return {
    items: shownItems,
    openCount,
    pendingChanges: pendingChangeCount(frozenOrder, settledItems),
    addItem,
    addItems,
    toggleItem,
    cleanUp,
  }
}
