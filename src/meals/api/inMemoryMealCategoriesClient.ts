import type { MealCategoriesClient } from './mealCategoriesClient'

export type InMemoryMealCategoriesClient = MealCategoriesClient & {
  namesArriveFromElsewhere(names: readonly string[]): void
  storedNames(): readonly string[]
}

export function createInMemoryMealCategoriesClient(
  initialNames: readonly string[] = [],
): InMemoryMealCategoriesClient {
  let names = initialNames
  const listeners = new Set<(names: readonly string[]) => void>()

  function publish() {
    listeners.forEach((listener) => listener(names))
  }

  return {
    observeCatalog(onNames) {
      listeners.add(onNames)
      onNames(names)
      return () => listeners.delete(onNames)
    },
    writeCatalog(written) {
      names = written
      publish()
    },
    namesArriveFromElsewhere(arriving) {
      names = arriving
      publish()
    },
    storedNames() {
      return names
    },
  }
}
