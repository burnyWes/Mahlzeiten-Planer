import type {
  ItemCategory,
  ItemCategoryCatalog,
  ItemCategoryId,
} from './itemCategory'
import type { KnownItem } from './knownItem'
import { normalizeItemName, type ShoppingItem } from './shoppingItem'

export type ListGroup = ItemCategoryId | null

export type Grouping = {
  grouped: boolean
  groupOf: (item: ShoppingItem) => ListGroup
  rankOf: (group: ListGroup) => number
}

export type ListSection = {
  category: ItemCategory | null
  items: readonly ShoppingItem[]
}

export const UNGROUPED: Grouping = {
  grouped: false,
  groupOf: () => null,
  rankOf: () => 0,
}

export function groupingOf(
  catalog: ItemCategoryCatalog,
  knownItems: readonly KnownItem[],
): Grouping {
  if (!catalog.sortByCategory) return UNGROUPED
  const rankById = new Map(
    catalog.categories.map((category, index) => [category.id, index]),
  )
  const categoryIdByName = new Map(
    knownItems.map((knownItem) => [
      normalizeItemName(knownItem.name),
      knownItem.categoryId,
    ]),
  )
  const rankOfUnknownCategory = catalog.categories.length
  const rankOfUngrouped = catalog.categories.length + 1

  return {
    grouped: true,
    groupOf(item) {
      const categoryId = categoryIdByName.get(normalizeItemName(item.name))
      return categoryId !== undefined &&
        categoryId !== null &&
        rankById.has(categoryId)
        ? categoryId
        : null
    },
    rankOf(group) {
      if (group === null) return rankOfUngrouped
      return rankById.get(group) ?? rankOfUnknownCategory
    },
  }
}

export function groupOfAddedItem(
  grouping: Grouping,
  item: ShoppingItem,
  chosenCategory: ItemCategoryId | null,
): ListGroup {
  if (!grouping.grouped) return null
  return chosenCategory ?? grouping.groupOf(item)
}

export function showsSectionHeadings(
  sections: readonly ListSection[],
): boolean {
  return (
    sections.length > 1 || sections.some((section) => section.category !== null)
  )
}
