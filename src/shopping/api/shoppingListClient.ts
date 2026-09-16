import type { Quantity } from '../../shared/domain/quantity'
import type {
  ItemId,
  NewShoppingItem,
  ShoppingItem,
} from '../domain/shoppingItem'

export interface ShoppingListClient {
  observeItems(onItems: (items: readonly ShoppingItem[]) => void): () => void
  addItem(item: NewShoppingItem): ItemId
  changeQuantity(id: ItemId, quantity: Quantity): void
  checkOffItem(id: ItemId): void
  reopenItem(id: ItemId): void
}
