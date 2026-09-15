import { useCallback, useEffect, useRef, useState } from 'react'
import type { ShoppingListClient } from '../api/shoppingListClient'
import {
  additionAnnouncement,
  checkOffAnnouncement,
  cleanUpAnnouncement,
  reopenAnnouncement,
} from '../domain/announcements'
import {
  createShoppingItem,
  findOpenItemWithSameName,
  isOpen,
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

export function useShoppingList(client: ShoppingListClient) {
  const [liveItems, setLiveItems] = useState<readonly ShoppingItem[]>([])
  const [frozenOrder, setFrozenOrder] = useState<FrozenOrder>([])
  const frozenOnFirstItems = useRef(false)

  useEffect(
    () =>
      client.observeItems((items) => {
        setLiveItems(items)
        if (!frozenOnFirstItems.current) {
          frozenOnFirstItems.current = true
          setFrozenOrder(nextFrozenOrder(items))
        }
      }),
    [client],
  )

  const shownItems = projectStableList(frozenOrder, liveItems)
  const openCount = shownItems.filter(isOpen).length

  const addItem = useCallback(
    (draft: ShoppingItemDraft) => {
      const newItem = createShoppingItem(draft, Date.now())
      const alreadyOpen = findOpenItemWithSameName(liveItems, newItem.name)
      const id = client.addItem(newItem)
      setFrozenOrder((order) => appendToFrozenOrder(order, id))
      return additionAnnouncement(newItem, alreadyOpen)
    },
    [client, liveItems],
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
