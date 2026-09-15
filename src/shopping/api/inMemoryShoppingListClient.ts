import type { ItemId, ShoppingItem } from '../domain/shoppingItem'
import type { ShoppingListClient } from './shoppingListClient'

export type InMemoryShoppingListClient = ShoppingListClient & {
  itemsArriveFromElsewhere(items: readonly ShoppingItem[]): void
  storedItems(): readonly ShoppingItem[]
}

export function createInMemoryShoppingListClient(
  initialItems: readonly ShoppingItem[] = [],
  clock: () => number = () => Date.now(),
): InMemoryShoppingListClient {
  let items = [...initialItems]
  let nextId = 1
  const listeners = new Set<(items: readonly ShoppingItem[]) => void>()

  function publish() {
    listeners.forEach((listener) => listener([...items]))
  }

  function replace(id: ItemId, change: Partial<ShoppingItem>) {
    items = items.map((item) =>
      item.id === id ? { ...item, ...change } : item,
    )
    publish()
  }

  return {
    observeItems(onItems) {
      listeners.add(onItems)
      onItems([...items])
      return () => listeners.delete(onItems)
    },
    addItem(newItem) {
      const id = `item-${nextId}`
      nextId += 1
      items = [...items, { ...newItem, id, checkedOffAt: null }]
      publish()
      return id
    },
    checkOffItem(id) {
      replace(id, { checkedOffAt: clock() })
    },
    reopenItem(id) {
      replace(id, { checkedOffAt: null })
    },
    itemsArriveFromElsewhere(arriving) {
      items = [...items, ...arriving]
      publish()
    },
    storedItems() {
      return [...items]
    },
  }
}
