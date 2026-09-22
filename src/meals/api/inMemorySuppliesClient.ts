import { withoutSupply, withSupply, type Supply } from '../domain/supply'
import type { SuppliesClient } from './suppliesClient'

export type InMemorySuppliesClient = SuppliesClient & {
  suppliesArriveFromElsewhere(supplies: readonly Supply[]): void
  storedSupplies(): readonly Supply[]
}

export function createInMemorySuppliesClient(
  initialSupplies: readonly Supply[] = [],
): InMemorySuppliesClient {
  let supplies = initialSupplies
  const listeners = new Set<(supplies: readonly Supply[]) => void>()

  function publish() {
    listeners.forEach((listener) => listener(supplies))
  }

  return {
    observeSupplies(onSupplies) {
      listeners.add(onSupplies)
      onSupplies(supplies)
      return () => listeners.delete(onSupplies)
    },
    writeSupply(written) {
      supplies = withSupply(supplies, written)
      publish()
    },
    removeSupply(mealId) {
      supplies = withoutSupply(supplies, mealId)
      publish()
    },
    suppliesArriveFromElsewhere(arriving) {
      supplies = arriving
      publish()
    },
    storedSupplies() {
      return supplies
    },
  }
}
