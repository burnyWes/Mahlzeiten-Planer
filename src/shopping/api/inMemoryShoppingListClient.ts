import {
  checkOff,
  reopen,
  withQuantity,
  type ShoppingItem,
} from '../domain/shoppingItem'
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

  function change(
    id: string,
    transition: (item: ShoppingItem) => ShoppingItem,
  ) {
    items = items.map((item) => (item.id === id ? transition(item) : item))
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
    changeQuantity(id, quantity) {
      change(id, (item) => withQuantity(item, quantity))
    },
    checkOffItem(id) {
      change(id, (item) => checkOff(item, clock()))
    },
    reopenItem(id) {
      change(id, reopen)
    },
    removeItem(id) {
      items = items.filter((item) => item.id !== id)
      publish()
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
