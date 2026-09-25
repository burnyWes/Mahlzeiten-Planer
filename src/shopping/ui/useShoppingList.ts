import { useCallback, useEffect, useRef, useState } from 'react'
import type { KnownItemsClient } from '../api/knownItemsClient'
import type { KnownUnitsClient } from '../api/knownUnitsClient'
import type { ShoppingListClient } from '../api/shoppingListClient'
import {
  planAddition,
  planAdditions,
  summarizeAdditions,
  type AdditionOutcome,
  type AdditionsSummary,
} from '../domain/addition'
import { canonicalName, type KnownItem } from '../domain/knownItem'
import { withCanonicalUnit, type KnownUnit } from '../domain/knownUnit'
import {
  additionAnnouncement,
  checkOffAnnouncement,
  cleanUpAnnouncement,
  itemRemovedAnnouncement,
  quantityChangedAnnouncement,
  reopenAnnouncement,
} from '../domain/announcements'
import {
  checkOff,
  createShoppingItem,
  isOpen,
  reopen,
  steppedQuantity,
  withOneLess,
  withOneMore,
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
  withoutFromFrozenOrder,
  type FrozenOrder,
} from '../domain/stableList'
import {
  dropConfirmedRemovals,
  dropConfirmedWrites,
  forgetWritesOf,
  rememberRemoval,
  rememberWrite,
  withoutUnconfirmedRemovals,
  withUnconfirmedWrites,
  type UnconfirmedRemovals,
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
  takeOneMore: (item: ShoppingItem) => string
  takeOneLess: (item: ShoppingItem) => string
  cleanUp: () => string
}

export function useShoppingList(
  client: ShoppingListClient,
  knownItemsClient: KnownItemsClient,
  knownItems: readonly KnownItem[],
  knownUnitsClient: KnownUnitsClient,
  knownUnits: readonly KnownUnit[],
): ShoppingList {
  const [liveItems, setLiveItems] = useState<readonly ShoppingItem[]>([])
  const [frozenOrder, setFrozenOrder] = useState<FrozenOrder>([])
  const [unconfirmedWrites, setUnconfirmedWrites] = useState<UnconfirmedWrites>(
    [],
  )
  const [unconfirmedRemovals, setUnconfirmedRemovals] =
    useState<UnconfirmedRemovals>([])
  const frozenOnFirstItems = useRef(false)

  useEffect(
    () =>
      client.observeItems((items) => {
        setLiveItems(items)
        setUnconfirmedWrites((writes) => dropConfirmedWrites(writes, items))
        setUnconfirmedRemovals((removals) =>
          dropConfirmedRemovals(removals, items),
        )
        if (!frozenOnFirstItems.current) {
          frozenOnFirstItems.current = true
          setFrozenOrder((appended) => firstFrozenOrder(appended, items))
        }
      }),
    [client],
  )

  const settledItems = withoutUnconfirmedRemovals(
    withUnconfirmedWrites(liveItems, unconfirmedWrites),
    unconfirmedRemovals,
  )
  const shownItems = projectStableList(frozenOrder, settledItems)
  const openCount = shownItems.filter(isOpen).length

  const carryOut = useCallback(
    (outcome: AdditionOutcome): UnconfirmedWrite => {
      if (outcome.kind === 'mergedInto') {
        client.changeQuantity(outcome.into.id, outcome.quantity)
        return {
          written: withQuantity(outcome.into, outcome.quantity),
          before: liveItems.find((live) => live.id === outcome.into.id) ?? null,
          earlierWrites: [],
        }
      }
      return {
        written: {
          ...outcome.item,
          id: client.addItem(outcome.item),
          checkedOffAt: null,
        },
        before: null,
        earlierWrites: [],
      }
    },
    [client, liveItems],
  )

  const carryOutAll = useCallback(
    (outcomes: readonly AdditionOutcome[]) => {
      const written = outcomes.map(carryOut)
      outcomes.forEach(({ item }) => {
        knownItemsClient.recordUse(item.name, item.createdAt)
        const unit = item.quantity?.unit ?? null
        if (unit !== null) knownUnitsClient.recordUse(unit, item.createdAt)
      })
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
    [carryOut, knownItemsClient, knownUnitsClient],
  )

  const underGroomedName = useCallback(
    (item: NewShoppingItem): NewShoppingItem => ({
      ...item,
      name: canonicalName(knownItems, item.name),
      quantity: withCanonicalUnit(knownUnits, item.quantity),
    }),
    [knownItems, knownUnits],
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

  const changeQuantityTo = useCallback(
    (changed: ShoppingItem) => {
      const before = liveItems.find((live) => live.id === changed.id) ?? null
      client.changeQuantity(changed.id, steppedQuantity(changed))
      setUnconfirmedWrites((writes) => rememberWrite(writes, changed, before))
      return quantityChangedAnnouncement(changed)
    },
    [client, liveItems],
  )

  const takeOneMore = useCallback(
    (item: ShoppingItem) => changeQuantityTo(withOneMore(item)),
    [changeQuantityTo],
  )

  const removeItem = useCallback(
    (item: ShoppingItem) => {
      client.removeItem(item.id)
      setUnconfirmedRemovals((removals) =>
        rememberRemoval(removals, item.id, liveItems),
      )
      setUnconfirmedWrites((writes) => forgetWritesOf(writes, item.id))
      setFrozenOrder((order) => withoutFromFrozenOrder(order, item.id))
      return itemRemovedAnnouncement(item, openCount - 1)
    },
    [client, liveItems, openCount],
  )

  const takeOneLess = useCallback(
    (item: ShoppingItem) => {
      const lessened = withOneLess(item)
      if (lessened === null) return removeItem(item)
      return changeQuantityTo(lessened)
    },
    [changeQuantityTo, removeItem],
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
    takeOneMore,
    takeOneLess,
    cleanUp,
  }
}
