import {
  applyUnitRename,
  knownUnitsFromHistory,
  recordUnitUse,
  type KnownUnit,
  type KnownUnitRename,
} from '../domain/knownUnit'
import { normalizeItemName, type ShoppingItem } from '../domain/shoppingItem'
import type { KnownUnitsClient } from './knownUnitsClient'

export type InMemoryKnownUnitsClient = KnownUnitsClient & {
  knownUnitsArriveFromElsewhere(knownUnits: readonly KnownUnit[]): void
  storedKnownUnits(): readonly KnownUnit[]
}

export function createInMemoryKnownUnitsClient(
  initialKnownUnits: readonly KnownUnit[] = [],
  history: readonly ShoppingItem[] = [],
): InMemoryKnownUnitsClient {
  let knownUnits = initialKnownUnits
  const listeners = new Set<(knownUnits: readonly KnownUnit[]) => void>()

  function publish() {
    listeners.forEach((listener) => listener(knownUnits))
  }

  async function takeOver(unitsOfMeals: () => Promise<readonly string[]>) {
    if (knownUnits.length > 0) return
    const mealUnits = await unitsOfMeals()
    knownUnits = knownUnitsFromHistory(history, mealUnits)
    publish()
  }

  return {
    observeKnownUnits(onKnownUnits) {
      listeners.add(onKnownUnits)
      onKnownUnits(knownUnits)
      return () => listeners.delete(onKnownUnits)
    },
    recordUse(unit, usedAt) {
      knownUnits = recordUnitUse(knownUnits, unit, usedAt)
      publish()
    },
    removeKnownUnit(unit) {
      const removedUnit = normalizeItemName(unit)
      knownUnits = knownUnits.filter(
        (knownUnit) => normalizeItemName(knownUnit.name) !== removedUnit,
      )
      publish()
    },
    renameKnownUnit(rename: KnownUnitRename) {
      knownUnits = applyUnitRename(knownUnits, rename)
      publish()
    },
    takeOverIfEmpty(unitsOfMeals) {
      void takeOver(unitsOfMeals)
    },
    knownUnitsArriveFromElsewhere(arriving) {
      knownUnits = [...knownUnits, ...arriving]
      publish()
    },
    storedKnownUnits() {
      return knownUnits
    },
  }
}
