import {
  applyRename,
  knownItemsFromHistory,
  recordUse,
  type KnownItem,
  type KnownItemRename,
} from '../domain/knownItem'
import { normalizeItemName, type ShoppingItem } from '../domain/shoppingItem'
import type { KnownItemsClient } from './knownItemsClient'

export type InMemoryKnownItemsClient = KnownItemsClient & {
  knownItemsArriveFromElsewhere(knownItems: readonly KnownItem[]): void
  storedKnownItems(): readonly KnownItem[]
}

export function createInMemoryKnownItemsClient(
  initialKnownItems: readonly KnownItem[] = [],
  history: readonly ShoppingItem[] = [],
): InMemoryKnownItemsClient {
  let knownItems = initialKnownItems
  const listeners = new Set<(knownItems: readonly KnownItem[]) => void>()

  function publish() {
    listeners.forEach((listener) => listener(knownItems))
  }

  return {
    observeKnownItems(onKnownItems) {
      listeners.add(onKnownItems)
      onKnownItems(knownItems)
      return () => listeners.delete(onKnownItems)
    },
    recordUse(name, usedAt) {
      knownItems = recordUse(knownItems, name, usedAt)
      publish()
    },
    removeKnownItem(name) {
      const removedName = normalizeItemName(name)
      knownItems = knownItems.filter(
        (knownItem) => normalizeItemName(knownItem.name) !== removedName,
      )
      publish()
    },
    renameKnownItem(rename: KnownItemRename) {
      knownItems = applyRename(knownItems, rename)
      publish()
    },
    takeOverHistoryIfEmpty() {
      if (knownItems.length > 0) return
      knownItems = knownItemsFromHistory(history)
      publish()
    },
    knownItemsArriveFromElsewhere(arriving) {
      knownItems = [...knownItems, ...arriving]
      publish()
    },
    storedKnownItems() {
      return knownItems
    },
  }
}
