import {
  createItemName,
  normalizeItemName,
  type ShoppingItem,
} from './shoppingItem'

export type KnownItem = { name: string; lastUsedAt: number; timesUsed: number }

export type KnownItemRename = {
  written: KnownItem
  removedName: string | null
  addedUses: number
}

const MINIMUM_TYPED_LENGTH = 2
const MAXIMUM_SUGGESTIONS = 5

export function knownItemIdOf(name: string): string {
  return encodeURIComponent(normalizeItemName(name)).replace(
    /[._]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function hasName(knownItem: KnownItem, name: string): boolean {
  return normalizeItemName(knownItem.name) === normalizeItemName(name)
}

export function recordUse(
  knownItems: readonly KnownItem[],
  name: string,
  usedAt: number,
): readonly KnownItem[] {
  const position = knownItems.findIndex((knownItem) => hasName(knownItem, name))
  if (position === -1)
    return [...knownItems, { name, lastUsedAt: usedAt, timesUsed: 1 }]
  return knownItems.with(position, {
    name,
    lastUsedAt: usedAt,
    timesUsed: knownItems[position].timesUsed + 1,
  })
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
    const newest = gathered.get(name) ?? {
      name: item.name,
      lastUsedAt: item.createdAt,
      timesUsed: 0,
    }
    gathered.set(name, { ...newest, timesUsed: newest.timesUsed + 1 })
  }
  return [...gathered.values()]
}

export function withNamesInUse(
  knownItems: readonly KnownItem[],
  names: readonly string[],
): readonly KnownItem[] {
  const takenNames = new Set(
    knownItems.map((knownItem) => normalizeItemName(knownItem.name)),
  )
  const gathered = [...knownItems]
  for (const name of names) {
    const normalizedName = normalizeItemName(name)
    if (takenNames.has(normalizedName)) continue
    takenNames.add(normalizedName)
    gathered.push({ name, lastUsedAt: 0, timesUsed: 0 })
  }
  return gathered
}

export function canonicalName(
  knownItems: readonly KnownItem[],
  typed: string,
): string {
  return (
    knownItems.find((knownItem) => hasName(knownItem, typed))?.name ?? typed
  )
}

export function planKnownItemRename(
  knownItems: readonly KnownItem[],
  from: string,
  newName: string,
): KnownItemRename | null {
  const name = createItemName(newName)
  const renamed = knownItems.find((knownItem) => hasName(knownItem, from))
  if (renamed === undefined) return null

  if (knownItemIdOf(renamed.name) === knownItemIdOf(name))
    return {
      written: { ...renamed, name },
      removedName: null,
      addedUses: 0,
    }

  const merged = knownItems.find((knownItem) => hasName(knownItem, name))
  return {
    written: {
      name,
      timesUsed: (merged?.timesUsed ?? 0) + renamed.timesUsed,
      lastUsedAt: Math.max(merged?.lastUsedAt ?? 0, renamed.lastUsedAt),
    },
    removedName: renamed.name,
    addedUses: renamed.timesUsed,
  }
}

export function applyRename(
  knownItems: readonly KnownItem[],
  { written, removedName }: KnownItemRename,
): readonly KnownItem[] {
  const kept = knownItems.filter(
    (knownItem) =>
      !hasName(knownItem, written.name) &&
      (removedName === null || !hasName(knownItem, removedName)),
  )
  return [...kept, written]
}

export function knownItemsByName(
  knownItems: readonly KnownItem[],
): readonly KnownItem[] {
  return [...knownItems].sort((one, other) =>
    one.name.localeCompare(other.name, 'de-DE'),
  )
}

function startsWithTyped(knownItem: KnownItem, typed: string): boolean {
  return normalizeItemName(knownItem.name).startsWith(typed)
}

function bySuggestionRank(typed: string) {
  return (one: KnownItem, other: KnownItem) =>
    Number(startsWithTyped(other, typed)) -
      Number(startsWithTyped(one, typed)) ||
    other.timesUsed - one.timesUsed ||
    other.lastUsedAt - one.lastUsedAt ||
    one.name.localeCompare(other.name, 'de-DE')
}

export function suggestNames(
  knownItems: readonly KnownItem[],
  typed: string,
): readonly string[] {
  const wanted = normalizeItemName(typed)
  if (wanted.length < MINIMUM_TYPED_LENGTH) return []
  return knownItems
    .filter((knownItem) => {
      const name = normalizeItemName(knownItem.name)
      return name.includes(wanted) && name !== wanted
    })
    .sort(bySuggestionRank(wanted))
    .slice(0, MAXIMUM_SUGGESTIONS)
    .map((knownItem) => knownItem.name)
}
