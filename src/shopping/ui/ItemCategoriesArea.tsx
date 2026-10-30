import { useState } from 'react'
import {
  itemCategoryCreatedAnnouncement,
  itemCategoryDeletedAnnouncement,
  itemCategorySavedAnnouncement,
} from '../domain/announcements'
import {
  placedItemCategory,
  type CategoryPlacement,
  type ItemCategory,
  type ItemCategoryId,
  type PlacedItemCategory,
} from '../domain/itemCategory'
import {
  assignedCounts,
  knownItemsInCategory,
  knownItemsWithoutCategory,
  type KnownItem,
} from '../domain/knownItem'
import { DeleteItemCategoryPage } from './DeleteItemCategoryPage'
import { ItemCategoryFormPage } from './ItemCategoryFormPage'
import { ItemCategoryListPage } from './ItemCategoryListPage'
import { UncategorizedKnownItemsPage } from './UncategorizedKnownItemsPage'
import type { ItemCategories } from './useItemCategories'

type ItemCategoriesPage =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'form'; id: ItemCategoryId }
  | { kind: 'delete'; id: ItemCategoryId }
  | { kind: 'uncategorized' }

type ItemCategoriesAreaProps = {
  itemCategories: ItemCategories
  knownItems: readonly KnownItem[]
  announce: (text: string) => void
  onBack: () => void
}

export function ItemCategoriesArea({
  itemCategories,
  knownItems,
  announce,
  onBack,
}: ItemCategoriesAreaProps) {
  const [page, setPage] = useState<ItemCategoriesPage>({ kind: 'list' })
  const { catalog } = itemCategories
  const countsByCategory = assignedCounts(knownItems)
  const uncategorizedKnownItems = knownItemsWithoutCategory(knownItems, catalog)
  const placementAtTheEnd: CategoryPlacement = {
    position: catalog.categories.length + 1,
    count: catalog.categories.length + 1,
  }

  const addressed =
    page.kind === 'form' || page.kind === 'delete'
      ? placedItemCategory(catalog, page.id)
      : null

  function showList() {
    setPage({ kind: 'list' })
  }

  function showListAndAnnounce(
    placed: PlacedItemCategory | null,
    announcementOf: (name: string, placement: CategoryPlacement) => string,
  ) {
    showList()
    if (placed !== null)
      announce(announcementOf(placed.category.name, placed.placement))
  }

  function deleteCategory(category: ItemCategory) {
    itemCategories.removeCategory(category.id)
    showList()
    announce(
      itemCategoryDeletedAnnouncement(
        category.name,
        catalog.categories.length - 1,
      ),
    )
  }

  if (page.kind === 'create')
    return (
      <ItemCategoryFormPage
        heading="Kategorie anlegen"
        initialName=""
        initialPlacement={placementAtTheEnd}
        onSave={(name, position) =>
          showListAndAnnounce(
            itemCategories.addCategory(name, position),
            itemCategoryCreatedAnnouncement,
          )
        }
        onBack={showList}
        announce={announce}
      />
    )

  if (page.kind === 'form' && addressed !== null)
    return (
      <ItemCategoryFormPage
        heading="Kategorie bearbeiten"
        initialName={addressed.category.name}
        initialPlacement={addressed.placement}
        assignedKnownItems={knownItemsInCategory(
          knownItems,
          addressed.category.id,
        )}
        onSave={(name, position) =>
          showListAndAnnounce(
            itemCategories.changeCategory(
              addressed.category.id,
              name,
              position,
            ),
            itemCategorySavedAnnouncement,
          )
        }
        onBack={showList}
        announce={announce}
      />
    )

  if (page.kind === 'delete' && addressed !== null)
    return (
      <DeleteItemCategoryPage
        category={addressed.category}
        assignedCount={countsByCategory.get(addressed.category.id) ?? 0}
        onDelete={() => deleteCategory(addressed.category)}
        onCancel={showList}
      />
    )

  if (page.kind === 'uncategorized')
    return (
      <UncategorizedKnownItemsPage
        knownItems={uncategorizedKnownItems}
        onBack={showList}
      />
    )

  return (
    <ItemCategoryListPage
      catalog={catalog}
      assignedCounts={countsByCategory}
      uncategorizedCount={uncategorizedKnownItems.length}
      onBack={onBack}
      onAddCategory={() => setPage({ kind: 'create' })}
      onSwitchSortByCategory={itemCategories.switchSortByCategory}
      onOpenCategory={(category) => setPage({ kind: 'form', id: category.id })}
      onDeleteCategory={(category) =>
        setPage({ kind: 'delete', id: category.id })
      }
      onOpenUncategorized={() => setPage({ kind: 'uncategorized' })}
    />
  )
}
