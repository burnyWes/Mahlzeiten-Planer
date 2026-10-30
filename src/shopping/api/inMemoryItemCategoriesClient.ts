import {
  EMPTY_ITEM_CATEGORY_CATALOG,
  type ItemCategoryCatalog,
} from '../domain/itemCategory'
import type { ItemCategoriesClient } from './itemCategoriesClient'

export type InMemoryItemCategoriesClient = ItemCategoriesClient & {
  catalogArrivesFromElsewhere(catalog: ItemCategoryCatalog): void
  storedCatalog(): ItemCategoryCatalog
}

export function createInMemoryItemCategoriesClient(
  initialCatalog: ItemCategoryCatalog = EMPTY_ITEM_CATEGORY_CATALOG,
): InMemoryItemCategoriesClient {
  let catalog = initialCatalog
  let issuedIds = 0
  const listeners = new Set<(catalog: ItemCategoryCatalog) => void>()

  function publish() {
    listeners.forEach((listener) => listener(catalog))
  }

  return {
    observeCatalog(onCatalog) {
      listeners.add(onCatalog)
      onCatalog(catalog)
      return () => listeners.delete(onCatalog)
    },
    writeCatalog(written) {
      catalog = written
      publish()
    },
    newCategoryId() {
      issuedIds += 1
      return `k${issuedIds}`
    },
    catalogArrivesFromElsewhere(arriving) {
      catalog = arriving
      publish()
    },
    storedCatalog() {
      return catalog
    },
  }
}
