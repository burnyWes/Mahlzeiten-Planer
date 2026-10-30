import { createItemName, normalizeItemName } from './shoppingItem'

export type CatalogEntry = {
  name: string
  lastUsedAt: number
  timesUsed: number
}

export type CatalogRename<Entry extends CatalogEntry> = {
  written: Entry
  removedName: string | null
  addedUses: number
}

export type NewCatalogEntry<Entry extends CatalogEntry> = (
  entry: CatalogEntry,
) => Entry

const MAXIMUM_SUGGESTIONS = 5

export function catalogEntryIdOf(name: string): string {
  return encodeURIComponent(normalizeItemName(name)).replace(
    /[._]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

export function hasName(entry: CatalogEntry, name: string): boolean {
  return normalizeItemName(entry.name) === normalizeItemName(name)
}

export function recordCatalogUse<Entry extends CatalogEntry>(
  entries: readonly Entry[],
  name: string,
  usedAt: number,
  newEntry: NewCatalogEntry<Entry>,
): readonly Entry[] {
  const position = entries.findIndex((entry) => hasName(entry, name))
  if (position === -1)
    return [...entries, newEntry({ name, lastUsedAt: usedAt, timesUsed: 1 })]
  return entries.with(position, {
    ...entries[position],
    name,
    lastUsedAt: usedAt,
    timesUsed: entries[position].timesUsed + 1,
  })
}

export function withCatalogNamesInUse<Entry extends CatalogEntry>(
  entries: readonly Entry[],
  names: readonly string[],
  newEntry: NewCatalogEntry<Entry>,
): readonly Entry[] {
  const takenNames = new Set(
    entries.map((entry) => normalizeItemName(entry.name)),
  )
  const gathered = [...entries]
  for (const name of names) {
    const normalizedName = normalizeItemName(name)
    if (takenNames.has(normalizedName)) continue
    takenNames.add(normalizedName)
    gathered.push(newEntry({ name, lastUsedAt: 0, timesUsed: 0 }))
  }
  return gathered
}

export function canonicalName(
  entries: readonly CatalogEntry[],
  typed: string,
): string {
  return entries.find((entry) => hasName(entry, typed))?.name ?? typed
}

export function planCatalogRename<Entry extends CatalogEntry>(
  entries: readonly Entry[],
  from: string,
  newName: string,
): CatalogRename<Entry> | null {
  const name = createItemName(newName)
  const renamed = entries.find((entry) => hasName(entry, from))
  if (renamed === undefined) return null

  if (catalogEntryIdOf(renamed.name) === catalogEntryIdOf(name))
    return {
      written: { ...renamed, name },
      removedName: null,
      addedUses: 0,
    }

  const merged = entries.find((entry) => hasName(entry, name))
  return {
    written: {
      ...(merged ?? renamed),
      name,
      timesUsed: (merged?.timesUsed ?? 0) + renamed.timesUsed,
      lastUsedAt: Math.max(merged?.lastUsedAt ?? 0, renamed.lastUsedAt),
    },
    removedName: renamed.name,
    addedUses: renamed.timesUsed,
  }
}

export function applyRename<Entry extends CatalogEntry>(
  entries: readonly Entry[],
  { written, removedName }: CatalogRename<Entry>,
): readonly Entry[] {
  const kept = entries.filter(
    (entry) =>
      !hasName(entry, written.name) &&
      (removedName === null || !hasName(entry, removedName)),
  )
  return [...kept, written]
}

export function entriesByName<Entry extends CatalogEntry>(
  entries: readonly Entry[],
): readonly Entry[] {
  return [...entries].sort((one, other) =>
    one.name.localeCompare(other.name, 'de-DE'),
  )
}

function startsWithTyped(entry: CatalogEntry, typed: string): boolean {
  return normalizeItemName(entry.name).startsWith(typed)
}

function bySuggestionRank(typed: string) {
  return (one: CatalogEntry, other: CatalogEntry) =>
    Number(startsWithTyped(other, typed)) -
      Number(startsWithTyped(one, typed)) ||
    other.timesUsed - one.timesUsed ||
    other.lastUsedAt - one.lastUsedAt ||
    one.name.localeCompare(other.name, 'de-DE')
}

export function suggestFromCatalog(
  entries: readonly CatalogEntry[],
  typed: string,
  minimumTypedLength: number,
): readonly string[] {
  const wanted = normalizeItemName(typed)
  if (wanted.length < minimumTypedLength) return []
  return entries
    .filter((entry) => {
      const name = normalizeItemName(entry.name)
      return name.includes(wanted) && name !== wanted
    })
    .sort(bySuggestionRank(wanted))
    .slice(0, MAXIMUM_SUGGESTIONS)
    .map((entry) => entry.name)
}
