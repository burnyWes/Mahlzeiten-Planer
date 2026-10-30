import {
  catalogEntryIdOf,
  hasName,
  entriesByName,
  planCatalogRename,
  recordCatalogUse,
  suggestFromCatalog,
  withCatalogNamesInUse,
  type CatalogEntry,
  type CatalogRename,
} from './catalogEntry'
import type { ItemCategoryId } from './itemCategory'
import {
  createItemName,
  normalizeItemName,
  type ShoppingItem,
} from './shoppingItem'

export type KnownItem = CatalogEntry & { categoryId: ItemCategoryId | null }

export type KnownItemRename = CatalogRename<KnownItem>

export class KnownItemAlreadyTaken extends Error {
  knownItem: string

  constructor(knownItem: string) {
    super(knownItem)
    this.name = 'KnownItemAlreadyTaken'
    this.knownItem = knownItem
  }
}

const MINIMUM_TYPED_LENGTH = 2

function newKnownItem(entry: CatalogEntry): KnownItem {
  return { ...entry, categoryId: null }
}

function knownItemNamed(
  knownItems: readonly KnownItem[],
  name: string,
): KnownItem | null {
  return knownItems.find((knownItem) => hasName(knownItem, name)) ?? null
}

export function knownItemIdOf(name: string): string {
  return catalogEntryIdOf(name)
}

export function recordUse(
  knownItems: readonly KnownItem[],
  name: string,
  usedAt: number,
  categoryId?: ItemCategoryId,
): readonly KnownItem[] {
  const recorded = recordCatalogUse(knownItems, name, usedAt, newKnownItem)
  if (categoryId === undefined) return recorded
  return recorded.map((knownItem) =>
    hasName(knownItem, name) ? { ...knownItem, categoryId } : knownItem,
  )
}

function newestFirst(items: readonly ShoppingItem[]): readonly ShoppingItem[] {
  return [...items].sort((one, other) => other.createdAt - one.createdAt)
}

export function knownItemsFromHistory(
  items: readonly ShoppingItem[],
): readonly KnownItem[] {
  const gathered = new Map<string, KnownItem>()
  for (const item of newestFirst(items)) {
    const name = normalizeItemName(item.name)
    const newest =
      gathered.get(name) ??
      newKnownItem({
        name: item.name,
        lastUsedAt: item.createdAt,
        timesUsed: 0,
      })
    gathered.set(name, { ...newest, timesUsed: newest.timesUsed + 1 })
  }
  return [...gathered.values()]
}

export function withNamesInUse(
  knownItems: readonly KnownItem[],
  names: readonly string[],
): readonly KnownItem[] {
  return withCatalogNamesInUse(knownItems, names, newKnownItem)
}

export function planKnownItemRename(
  knownItems: readonly KnownItem[],
  from: string,
  newName: string,
  categoryId: ItemCategoryId | null,
): KnownItemRename | null {
  const rename = planCatalogRename(knownItems, from, newName)
  if (rename === null) return null
  return { ...rename, written: { ...rename.written, categoryId } }
}

export function knownItemToAdd(
  knownItems: readonly KnownItem[],
  written: string,
  categoryId: ItemCategoryId | null,
  now: number,
): KnownItem {
  const name = createItemName(written)
  const taken = knownItemNamed(knownItems, name)
  if (taken !== null) throw new KnownItemAlreadyTaken(taken.name)
  return { name, lastUsedAt: now, timesUsed: 0, categoryId }
}

export function isKnownName(
  knownItems: readonly KnownItem[],
  name: string,
): boolean {
  return knownItemNamed(knownItems, name) !== null
}

export function categoryIdOfName(
  knownItems: readonly KnownItem[],
  name: string,
): ItemCategoryId | null {
  return knownItemNamed(knownItems, name)?.categoryId ?? null
}

export function assignedCounts(
  knownItems: readonly KnownItem[],
): ReadonlyMap<ItemCategoryId, number> {
  const counts = new Map<ItemCategoryId, number>()
  for (const { categoryId } of knownItems)
    if (categoryId !== null)
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1)
  return counts
}

export function knownItemsByName(
  knownItems: readonly KnownItem[],
): readonly KnownItem[] {
  return entriesByName(knownItems)
}

export function suggestNames(
  knownItems: readonly KnownItem[],
  typed: string,
): readonly string[] {
  return suggestFromCatalog(knownItems, typed, MINIMUM_TYPED_LENGTH)
}
