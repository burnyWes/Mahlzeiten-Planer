import { useCallback, useEffect, useState } from 'react'
import type { ShoppingListClient } from '../api/shoppingListClient'
import { additionAnnouncement } from '../domain/announcements'
import {
  createShoppingItem,
  findOpenItemWithSameName,
  inCreationOrder,
  isOpen,
  type ShoppingItem,
  type ShoppingItemDraft,
} from '../domain/shoppingItem'

export function useShoppingList(client: ShoppingListClient) {
  const [liveItems, setLiveItems] = useState<readonly ShoppingItem[]>([])

  useEffect(() => client.observeItems(setLiveItems), [client])

  const addItem = useCallback(
    (draft: ShoppingItemDraft) => {
      const newItem = createShoppingItem(draft, Date.now())
      const alreadyOpen = findOpenItemWithSameName(liveItems, newItem.name)
      client.addItem(newItem)
      return additionAnnouncement(newItem, alreadyOpen)
    },
    [client, liveItems],
  )

  const shownItems = inCreationOrder(liveItems)

  return {
    items: shownItems,
    openCount: shownItems.filter(isOpen).length,
    addItem,
  }
}
