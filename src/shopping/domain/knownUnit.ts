import type { Quantity } from '../../shared/domain/quantity'
import {
  applyRename,
  canonicalName,
  knownItemsByName,
  planKnownItemRename,
  recordUse,
  suggestFromCatalog,
  withNamesInUse,
  type KnownItemRename,
} from './knownItem'
import { normalizeItemName, type ShoppingItem } from './shoppingItem'

export type KnownUnit = { name: string; lastUsedAt: number; timesUsed: number }

export type KnownUnitRename = KnownItemRename

export const DEFAULT_UNITS = ['Stück', 'g', 'kg', 'ml', 'l', 'Pck.']

const MINIMUM_TYPED_LENGTH = 1

export function suggestUnits(
  knownUnits: readonly KnownUnit[],
  typed: string,
): readonly string[] {
  return suggestFromCatalog(knownUnits, typed, MINIMUM_TYPED_LENGTH)
}

export function canonicalUnit(
  knownUnits: readonly KnownUnit[],
  typed: string,
): string {
  return canonicalName(knownUnits, typed)
}

export function withCanonicalUnit(
  knownUnits: readonly KnownUnit[],
  quantity: Quantity | null,
): Quantity | null {
  if (quantity === null || quantity.unit === null) return quantity
  return { ...quantity, unit: canonicalUnit(knownUnits, quantity.unit) }
}

export function recordUnitUse(
  knownUnits: readonly KnownUnit[],
  unit: string,
  usedAt: number,
): readonly KnownUnit[] {
  return recordUse(knownUnits, unit, usedAt)
}

export function withUnitsInUse(
  knownUnits: readonly KnownUnit[],
  units: readonly string[],
): readonly KnownUnit[] {
  return withNamesInUse(knownUnits, units)
}

export function planKnownUnitRename(
  knownUnits: readonly KnownUnit[],
  from: string,
  newName: string,
): KnownUnitRename | null {
  return planKnownItemRename(knownUnits, from, newName)
}

export function applyUnitRename(
  knownUnits: readonly KnownUnit[],
  rename: KnownUnitRename,
): readonly KnownUnit[] {
  return applyRename(knownUnits, rename)
}

export function knownUnitsByName(
  knownUnits: readonly KnownUnit[],
): readonly KnownUnit[] {
  return knownItemsByName(knownUnits)
}

type DatedUnit = { unit: string; usedAt: number }

function datedUnitsNewestFirst(
  items: readonly ShoppingItem[],
): readonly DatedUnit[] {
  return items
    .flatMap((item) => {
      const unit = item.quantity?.unit ?? null
      return unit === null ? [] : [{ unit, usedAt: item.createdAt }]
    })
    .sort((one, other) => other.usedAt - one.usedAt)
}

export function knownUnitsFromHistory(
  items: readonly ShoppingItem[],
  mealUnits: readonly string[],
): readonly KnownUnit[] {
  const gathered = new Map<string, KnownUnit>()

  function countUse(unit: string, usedAt: number) {
    const key = normalizeItemName(unit)
    const counted = gathered.get(key) ?? {
      name: unit,
      lastUsedAt: usedAt,
      timesUsed: 0,
    }
    gathered.set(key, { ...counted, timesUsed: counted.timesUsed + 1 })
  }

  for (const { unit, usedAt } of datedUnitsNewestFirst(items))
    countUse(unit, usedAt)
  for (const unit of DEFAULT_UNITS) {
    const key = normalizeItemName(unit)
    if (!gathered.has(key))
      gathered.set(key, { name: unit, lastUsedAt: 0, timesUsed: 0 })
  }
  for (const unit of mealUnits) countUse(unit, 0)
  return [...gathered.values()]
}
