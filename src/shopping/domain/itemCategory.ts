import { createItemName, normalizeItemName } from './shoppingItem'

export type ItemCategoryId = string

export type ItemCategory = { id: ItemCategoryId; name: string }

export type ItemCategoryCatalog = {
  categories: readonly ItemCategory[]
  sortByCategory: boolean
}

export const EMPTY_ITEM_CATEGORY_CATALOG: ItemCategoryCatalog = {
  categories: [],
  sortByCategory: true,
}

export class ItemCategoryAlreadyTaken extends Error {
  category: string

  constructor(category: string) {
    super(category)
    this.name = 'ItemCategoryAlreadyTaken'
    this.category = category
  }
}

export class ItemCategoryMissing extends Error {
  constructor() {
    super('category missing')
    this.name = 'ItemCategoryMissing'
  }
}

export type CategoryPlacement = { position: number; count: number }

export type PlacedItemCategory = {
  category: ItemCategory
  placement: CategoryPlacement
}

export type CategoryAssignment = {
  catalog: ItemCategoryCatalog
  categoryId: ItemCategoryId | null
  created: PlacedItemCategory | null
}

const MINIMUM_TYPED_LENGTH = 1
const MAXIMUM_SUGGESTIONS = 5

function isStoredCategory(stored: unknown): stored is ItemCategory {
  if (typeof stored !== 'object' || stored === null) return false
  const { id, name } = stored as Record<string, unknown>
  return typeof id === 'string' && typeof name === 'string'
}

export function itemCategoryCatalogFromStored(
  stored: unknown,
): ItemCategoryCatalog {
  if (typeof stored !== 'object' || stored === null)
    return EMPTY_ITEM_CATEGORY_CATALOG
  const { categories, sortByCategory } = stored as Record<string, unknown>
  return {
    categories: Array.isArray(categories)
      ? categories
          .filter(isStoredCategory)
          .map(({ id, name }) => ({ id, name }))
      : [],
    sortByCategory: typeof sortByCategory === 'boolean' ? sortByCategory : true,
  }
}

export function sameItemCategoryCatalog(
  one: ItemCategoryCatalog,
  other: ItemCategoryCatalog,
): boolean {
  return (
    one.sortByCategory === other.sortByCategory &&
    one.categories.length === other.categories.length &&
    one.categories.every(
      (category, index) =>
        category.id === other.categories[index].id &&
        category.name === other.categories[index].name,
    )
  )
}

function hasCategoryName(category: ItemCategory, name: string): boolean {
  return normalizeItemName(category.name) === normalizeItemName(name)
}

function availableName(
  categories: readonly ItemCategory[],
  written: string,
): string {
  const name = createItemName(written)
  const taken = categories.find((category) => hasCategoryName(category, name))
  if (taken !== undefined) throw new ItemCategoryAlreadyTaken(taken.name)
  return name
}

function withinRange(position: number, highest: number): number {
  return Math.min(Math.max(position, 1), highest)
}

function insertedAt(
  categories: readonly ItemCategory[],
  category: ItemCategory,
  position: number,
): readonly ItemCategory[] {
  const index = withinRange(position, categories.length + 1) - 1
  return [...categories.slice(0, index), category, ...categories.slice(index)]
}

export function withCategoryAdded(
  catalog: ItemCategoryCatalog,
  id: ItemCategoryId,
  written: string,
  position: number,
): ItemCategoryCatalog {
  const name = availableName(catalog.categories, written)
  return {
    ...catalog,
    categories: insertedAt(catalog.categories, { id, name }, position),
  }
}

export function withCategoryChanged(
  catalog: ItemCategoryCatalog,
  id: ItemCategoryId,
  written: string,
  position: number,
): ItemCategoryCatalog {
  if (findItemCategory(catalog, id) === null) return catalog
  const others = catalog.categories.filter((category) => category.id !== id)
  const name = availableName(others, written)
  return { ...catalog, categories: insertedAt(others, { id, name }, position) }
}

export function withoutItemCategory(
  catalog: ItemCategoryCatalog,
  id: ItemCategoryId,
): ItemCategoryCatalog {
  return {
    ...catalog,
    categories: catalog.categories.filter((category) => category.id !== id),
  }
}

export function withSortByCategory(
  catalog: ItemCategoryCatalog,
  on: boolean,
): ItemCategoryCatalog {
  return { ...catalog, sortByCategory: on }
}

export function placementOf(
  catalog: ItemCategoryCatalog,
  id: ItemCategoryId,
): CategoryPlacement | null {
  const index = catalog.categories.findIndex((category) => category.id === id)
  if (index === -1) return null
  return { position: index + 1, count: catalog.categories.length }
}

export function placedItemCategory(
  catalog: ItemCategoryCatalog,
  id: ItemCategoryId,
): PlacedItemCategory | null {
  const category = findItemCategory(catalog, id)
  const placement = placementOf(catalog, id)
  if (category === null || placement === null) return null
  return { category, placement }
}

export function categoryNamed(
  catalog: ItemCategoryCatalog,
  typed: string,
): ItemCategory | null {
  return (
    catalog.categories.find((category) => hasCategoryName(category, typed)) ??
    null
  )
}

export function findItemCategory(
  catalog: ItemCategoryCatalog,
  id: ItemCategoryId | null,
): ItemCategory | null {
  if (id === null) return null
  return catalog.categories.find((category) => category.id === id) ?? null
}

export function suggestItemCategories(
  catalog: ItemCategoryCatalog,
  typed: string,
): readonly string[] {
  const wanted = normalizeItemName(typed)
  if (wanted.length < MINIMUM_TYPED_LENGTH) return []
  const startsWithTyped = (category: ItemCategory) =>
    normalizeItemName(category.name).startsWith(wanted)
  return catalog.categories
    .filter((category) => {
      const name = normalizeItemName(category.name)
      return name.includes(wanted) && name !== wanted
    })
    .sort(
      (one, other) =>
        Number(startsWithTyped(other)) - Number(startsWithTyped(one)),
    )
    .slice(0, MAXIMUM_SUGGESTIONS)
    .map((category) => category.name)
}

export function categoryToAssign(
  catalog: ItemCategoryCatalog,
  typed: string,
  newId: ItemCategoryId,
): CategoryAssignment {
  if (typed.trim() === '') return { catalog, categoryId: null, created: null }
  const known = categoryNamed(catalog, typed)
  if (known !== null) return { catalog, categoryId: known.id, created: null }
  const extended = withCategoryAdded(
    catalog,
    newId,
    typed,
    catalog.categories.length + 1,
  )
  return {
    catalog: extended,
    categoryId: newId,
    created: placedItemCategory(extended, newId),
  }
}

export function ensureCategoryChosen(typed: string): void {
  if (typed.trim() === '') throw new ItemCategoryMissing()
}
