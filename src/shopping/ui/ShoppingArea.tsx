import { useState, type ReactNode } from 'react'
import { withAssignedCategoryPhrase } from '../domain/announcements'
import {
  ensureCategoryChosen,
  type CategoryAssignment,
} from '../domain/itemCategory'
import {
  createItemName,
  isLastUnit,
  type ItemId,
  type ShoppingItem,
  type ShoppingItemDraft,
} from '../domain/shoppingItem'
import { AddItemPage, EMPTY_DRAFT } from './AddItemPage'
import { ChooseItemCategoryPage } from './ChooseItemCategoryPage'
import { RemoveItemPage } from './RemoveItemPage'
import { ShoppingListPage, type ListFocus } from './ShoppingListPage'
import type { ShoppingList } from './useShoppingList'

export type CategoryChoice = {
  isKnownName: (name: string) => boolean
  suggestCategories: (typed: string) => readonly string[]
  planCategoryAssignment: (typed: string) => CategoryAssignment
  applyCategoryAssignment: (assignment: CategoryAssignment) => void
}

type ShoppingAreaProps = {
  shoppingList: ShoppingList
  categoryChoice: CategoryChoice
  announce: (text: string) => void
  navigation: ReactNode
  suggestNames: (typed: string) => readonly string[]
  suggestUnits: (typed: string) => readonly string[]
}

type ShoppingPage =
  | { kind: 'list'; focus: ListFocus }
  | { kind: 'add'; draft: ShoppingItemDraft }
  | { kind: 'chooseCategory'; draft: ShoppingItemDraft }
  | { kind: 'remove'; id: ItemId }

function listWithFocus(focus: ListFocus): ShoppingPage {
  return { kind: 'list', focus }
}

export function ShoppingArea({
  shoppingList,
  categoryChoice,
  announce,
  navigation,
  suggestNames,
  suggestUnits,
}: ShoppingAreaProps) {
  const {
    items,
    sections,
    openCount,
    pendingChanges,
    addItem,
    toggleItem,
    takeOneLess,
    takeOneMore,
    removeItem,
    cleanUp,
  } = shoppingList
  const [page, setPage] = useState<ShoppingPage>(
    listWithFocus({ kind: 'heading' }),
  )

  const itemToRemove =
    page.kind === 'remove'
      ? (items.find((item) => item.id === page.id) ?? null)
      : null
  const itemToRemoveIsGone = page.kind === 'remove' && itemToRemove === null
  if (itemToRemoveIsGone) setPage(listWithFocus({ kind: 'heading' }))

  function takeOneLessOrAsk(item: ShoppingItem) {
    if (isLastUnit(item)) setPage({ kind: 'remove', id: item.id })
    else announce(takeOneLess(item))
  }

  function remove(item: ShoppingItem) {
    const removedAt = items.findIndex((shown) => shown.id === item.id)
    announce(removeItem(item))
    setPage(listWithFocus({ kind: 'followingRow', removedAt }))
  }

  function cancelRemoval(item: ShoppingItem) {
    setPage(listWithFocus({ kind: 'lessButton', id: item.id }))
  }

  function addWithCategory(draft: ShoppingItemDraft, categoryText: string) {
    ensureCategoryChosen(categoryText)
    const assignment = categoryChoice.planCategoryAssignment(categoryText)
    categoryChoice.applyCategoryAssignment(assignment)
    const confirmation = addItem(draft, assignment.categoryId)
    setPage({ kind: 'add', draft: EMPTY_DRAFT })
    announce(withAssignedCategoryPhrase(confirmation, assignment))
  }

  function addWithoutCategory(draft: ShoppingItemDraft) {
    const confirmation = addItem(draft)
    setPage({ kind: 'add', draft: EMPTY_DRAFT })
    announce(confirmation)
  }

  if (page.kind === 'add') {
    return (
      <AddItemPage
        initialDraft={page.draft}
        addItem={addItem}
        isKnownName={categoryChoice.isKnownName}
        onNewName={(draft) => setPage({ kind: 'chooseCategory', draft })}
        announce={announce}
        onBack={() => setPage(listWithFocus({ kind: 'heading' }))}
        suggestNames={suggestNames}
        suggestUnits={suggestUnits}
      />
    )
  }

  if (page.kind === 'chooseCategory') {
    const { draft } = page
    return (
      <ChooseItemCategoryPage
        name={createItemName(draft.name)}
        suggestCategories={categoryChoice.suggestCategories}
        onAddWithCategory={(categoryText) =>
          addWithCategory(draft, categoryText)
        }
        onAddWithoutCategory={() => addWithoutCategory(draft)}
        onBack={() => setPage({ kind: 'add', draft })}
        announce={announce}
      />
    )
  }

  if (itemToRemove !== null) {
    return (
      <RemoveItemPage
        item={itemToRemove}
        onRemove={() => remove(itemToRemove)}
        onCancel={() => cancelRemoval(itemToRemove)}
      />
    )
  }

  return (
    <ShoppingListPage
      navigation={navigation}
      items={items}
      sections={sections}
      openCount={openCount}
      pendingChanges={pendingChanges}
      focus={page.kind === 'list' ? page.focus : { kind: 'heading' }}
      onAddItem={() => setPage({ kind: 'add', draft: EMPTY_DRAFT })}
      onToggleItem={(item) => announce(toggleItem(item))}
      onLessItem={takeOneLessOrAsk}
      onMoreItem={(item) => announce(takeOneMore(item))}
      onCleanUp={() => announce(cleanUp())}
    />
  )
}
