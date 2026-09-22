import type { MealId } from '../domain/meal'
import type { Supply } from '../domain/supply'

export interface SuppliesClient {
  observeSupplies(onSupplies: (supplies: readonly Supply[]) => void): () => void
  writeSupply(supply: Supply): void
  removeSupply(mealId: MealId): void
}
