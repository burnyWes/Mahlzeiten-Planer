import type {
  ItemCategoryCatalog,
  ItemCategoryId,
} from '../domain/itemCategory'

export interface ItemCategoriesClient {
  observeCatalog(onCatalog: (catalog: ItemCategoryCatalog) => void): () => void
  writeCatalog(catalog: ItemCategoryCatalog): void
  newCategoryId(): ItemCategoryId
}
