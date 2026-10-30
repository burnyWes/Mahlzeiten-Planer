import { useState } from 'react'
import {
  knownItemCreatedAnnouncement,
  knownItemDeletedAnnouncement,
  knownItemFilterAnnouncement,
  knownItemFilterName,
  knownItemFilterResetAnnouncement,
  itemRemovedFromMealAnnouncement,
  knownItemSavedAnnouncement,
  withCreatedCategoryPhrase,
} from '../domain/announcements'
import { findItemCategory, suggestItemCategories } from '../domain/itemCategory'
import {
  knownFilterIn,
  knownItemsMatching,
  knownItemToAdd,
  planKnownItemRename,
  type KnownItem,
  type KnownItemFilter,
  type MealUsingItem,
} from '../domain/knownItem'
import { normalizeItemName } from '../domain/shoppingItem'
import { DeleteKnownItemPage } from './DeleteKnownItemPage'
import { KnownItemFormPage } from './KnownItemFormPage'
import { KnownItemListPage } from './KnownItemListPage'
import type { ItemCategories } from './useItemCategories'
import type { KnownItems } from './useKnownItems'

type KnownItemsPage =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'form'; name: string }
  | { kind: 'delete'; name: string }

type KnownItemsAreaProps = {
  knownItems: KnownItems
  itemCategories: ItemCategories
  mealsUsingItem: (name: string) => readonly MealUsingItem[]
  onRemoveItemFromMeal: (mealId: string, name: string) => void
  onKnownItemRenamed: (from: string, to: string) => number
  announce: (text: string) => void
  onBack: () => void
}

export function KnownItemsArea({
  knownItems,
  itemCategories,
  mealsUsingItem,
  onRemoveItemFromMeal,
  onKnownItemRenamed,
  announce,
  onBack,
}: KnownItemsAreaProps) {
  const [page, setPage] = useState<KnownItemsPage>({ kind: 'list' })
  const [chosenFilter, setChosenFilter] = useState<KnownItemFilter | null>(null)
  const { catalog } = itemCategories
  const activeFilter = knownFilterIn(catalog, chosenFilter)
  const chosenFilterIsGone = chosenFilter !== null && activeFilter === null
  if (chosenFilterIsGone) setChosenFilter(null)

  const addressedKnownItem =
    page.kind === 'form' || page.kind === 'delete'
      ? (knownItems.knownItems.find(
          (knownItem) =>
            normalizeItemName(knownItem.name) === normalizeItemName(page.name),
        ) ?? null)
      : null

  function suggestCategories(typed: string) {
    return suggestItemCategories(catalog, typed)
  }

  function showList() {
    setPage({ kind: 'list' })
  }

  function chooseFilter(filter: KnownItemFilter | null) {
    const all = knownItems.knownItems
    setChosenFilter(filter)
    announce(
      filter === null
        ? knownItemFilterResetAnnouncement(all.length)
        : knownItemFilterAnnouncement(
            knownItemFilterName(catalog, filter),
            knownItemsMatching(all, catalog, filter).length,
            all.length,
          ),
    )
  }

  function deleteKnownItem(knownItem: KnownItem) {
    knownItems.removeKnownItem(knownItem.name)
    showList()
    announce(
      knownItemDeletedAnnouncement(
        knownItem.name,
        knownItems.knownItems.length - 1,
      ),
    )
  }

  function changeKnownItem(
    knownItem: KnownItem,
    newName: string,
    categoryText: string,
  ) {
    const assignment = itemCategories.planCategoryAssignment(categoryText)
    const rename = planKnownItemRename(
      knownItems.knownItems,
      knownItem.name,
      newName,
      assignment.categoryId,
    )
    if (rename === null) {
      showList()
      return
    }
    itemCategories.applyCategoryAssignment(assignment)
    knownItems.renameKnownItem(rename)
    const renamedMealCount = onKnownItemRenamed(
      knownItem.name,
      rename.written.name,
    )
    showList()
    announce(
      withCreatedCategoryPhrase(
        knownItemSavedAnnouncement(rename.written.name, renamedMealCount),
        assignment.created,
      ),
    )
  }

  function removeFromMeal(knownItem: KnownItem, usingMeal: MealUsingItem) {
    const remainingMeals = mealsUsingItem(knownItem.name).length - 1
    onRemoveItemFromMeal(usingMeal.mealId, knownItem.name)
    announce(
      itemRemovedFromMealAnnouncement(
        knownItem.name,
        usingMeal.mealName,
        remainingMeals,
      ),
    )
  }

  function createKnownItem(name: string, categoryText: string) {
    const assignment = itemCategories.planCategoryAssignment(categoryText)
    const created = knownItemToAdd(
      knownItems.knownItems,
      name,
      assignment.categoryId,
      Date.now(),
    )
    itemCategories.applyCategoryAssignment(assignment)
    knownItems.addKnownItem(created)
    showList()
    announce(
      withCreatedCategoryPhrase(
        knownItemCreatedAnnouncement(created.name),
        assignment.created,
      ),
    )
  }

  if (page.kind === 'create')
    return (
      <KnownItemFormPage
        mode="create"
        initialName=""
        initialCategory=""
        suggestCategories={suggestCategories}
        onSave={createKnownItem}
        onBack={showList}
        announce={announce}
      />
    )

  if (page.kind === 'form' && addressedKnownItem !== null)
    return (
      <KnownItemFormPage
        mode="edit"
        initialName={addressedKnownItem.name}
        initialCategory={
          findItemCategory(catalog, addressedKnownItem.categoryId)?.name ?? ''
        }
        suggestCategories={suggestCategories}
        onSave={(newName, categoryText) =>
          changeKnownItem(addressedKnownItem, newName, categoryText)
        }
        onBack={showList}
        announce={announce}
        usedInMeals={{
          usingMeals: mealsUsingItem(addressedKnownItem.name),
          onRemoveFromMeal: (usingMeal) =>
            removeFromMeal(addressedKnownItem, usingMeal),
        }}
      />
    )

  if (page.kind === 'delete' && addressedKnownItem !== null)
    return (
      <DeleteKnownItemPage
        knownItem={addressedKnownItem}
        mealCount={mealsUsingItem(addressedKnownItem.name).length}
        onDelete={() => deleteKnownItem(addressedKnownItem)}
        onCancel={showList}
      />
    )

  return (
    <KnownItemListPage
      shownKnownItems={knownItemsMatching(
        knownItems.knownItems,
        catalog,
        activeFilter,
      )}
      totalCount={knownItems.knownItems.length}
      catalog={catalog}
      activeFilter={activeFilter}
      onChooseFilter={chooseFilter}
      mealsUsingItem={mealsUsingItem}
      onBack={onBack}
      onAddKnownItem={() => setPage({ kind: 'create' })}
      onOpenKnownItem={(knownItem) =>
        setPage({ kind: 'form', name: knownItem.name })
      }
      onDeleteKnownItem={(knownItem) =>
        setPage({ kind: 'delete', name: knownItem.name })
      }
    />
  )
}
