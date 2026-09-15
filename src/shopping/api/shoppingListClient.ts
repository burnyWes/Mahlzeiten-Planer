import type {
  ItemId,
  NewShoppingItem,
  ShoppingItem,
} from '../domain/shoppingItem'

export interface ShoppingListClient {
  observeItems(onItems: (items: readonly ShoppingItem[]) => void): () => void
  addItem(item: NewShoppingItem): ItemId
  checkOffItem(id: ItemId): void
  reopenItem(id: ItemId): void
}
