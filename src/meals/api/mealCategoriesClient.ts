export interface MealCategoriesClient {
  observeCatalog(onNames: (names: readonly string[]) => void): () => void
  writeCatalog(names: readonly string[]): void
}
