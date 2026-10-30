import type { Quantity } from '../../shared/domain/quantity'
import {
  applyRename,
  canonicalName,
  entriesByName,
  hasName,
  planCatalogRename,
  recordCatalogUse,
  suggestFromCatalog,
  withCatalogNamesInUse,
  type CatalogEntry,
  type CatalogRename,
} from './catalogEntry'
import {
  createItemName,
  normalizeItemName,
  type ShoppingItem,
} from './shoppingItem'

export type KnownUnit = CatalogEntry

export type KnownUnitRename = CatalogRename<KnownUnit>

export class KnownUnitAlreadyTaken extends Error {
  knownUnit: string

  constructor(knownUnit: string) {
    super(knownUnit)
    this.name = 'KnownUnitAlreadyTaken'
    this.knownUnit = knownUnit
  }
}

export const DEFAULT_UNITS = ['Stück', 'g', 'kg', 'ml', 'l', 'Pck.']

const MINIMUM_TYPED_LENGTH = 1

function newKnownUnit(entry: CatalogEntry): KnownUnit {
  return entry
}

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
  return recordCatalogUse(knownUnits, unit, usedAt, newKnownUnit)
}

export function withUnitsInUse(
  knownUnits: readonly KnownUnit[],
  units: readonly string[],
): readonly KnownUnit[] {
  return withCatalogNamesInUse(knownUnits, units, newKnownUnit)
}

export function planKnownUnitRename(
  knownUnits: readonly KnownUnit[],
  from: string,
  newName: string,
): KnownUnitRename | null {
  return planCatalogRename(knownUnits, from, newName)
}

export function applyUnitRename(
  knownUnits: readonly KnownUnit[],
  rename: KnownUnitRename,
): readonly KnownUnit[] {
  return applyRename(knownUnits, rename)
}

export function knownUnitToAdd(
  knownUnits: readonly KnownUnit[],
  written: string,
  now: number,
): KnownUnit {
  const name = createItemName(written)
  const taken = knownUnits.find((knownUnit) => hasName(knownUnit, name))
  if (taken !== undefined) throw new KnownUnitAlreadyTaken(taken.name)
  return { name, lastUsedAt: now, timesUsed: 0 }
}

export function knownUnitsByName(
  knownUnits: readonly KnownUnit[],
): readonly KnownUnit[] {
  return entriesByName(knownUnits)
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
