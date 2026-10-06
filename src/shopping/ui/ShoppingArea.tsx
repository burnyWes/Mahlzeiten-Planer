import { useState, type ReactNode } from 'react'
import {
  isLastUnit,
  type ItemId,
  type ShoppingItem,
} from '../domain/shoppingItem'
import { AddItemPage } from './AddItemPage'
import { RemoveItemPage } from './RemoveItemPage'
import { ShoppingListPage, type ListFocus } from './ShoppingListPage'
import type { ShoppingList } from './useShoppingList'

type ShoppingAreaProps = {
  shoppingList: ShoppingList
  announce: (text: string) => void
  navigation: ReactNode
  suggestNames: (typed: string) => readonly string[]
  suggestUnits: (typed: string) => readonly string[]
}

type ShoppingPage =
  | { kind: 'list'; focus: ListFocus }
  | { kind: 'add' }
  | { kind: 'remove'; id: ItemId }

function listWithFocus(focus: ListFocus): ShoppingPage {
  return { kind: 'list', focus }
}

export function ShoppingArea({
  shoppingList,
  announce,
  navigation,
  suggestNames,
  suggestUnits,
}: ShoppingAreaProps) {
  const {
    items,
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

  if (page.kind === 'add') {
    return (
      <AddItemPage
        addItem={addItem}
        announce={announce}
        onBack={() => setPage(listWithFocus({ kind: 'heading' }))}
        suggestNames={suggestNames}
        suggestUnits={suggestUnits}
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
      openCount={openCount}
      pendingChanges={pendingChanges}
      focus={page.kind === 'list' ? page.focus : { kind: 'heading' }}
      onAddItem={() => setPage({ kind: 'add' })}
      onToggleItem={(item) => announce(toggleItem(item))}
      onLessItem={takeOneLessOrAsk}
      onMoreItem={(item) => announce(takeOneMore(item))}
      onCleanUp={() => announce(cleanUp())}
    />
  )
}
