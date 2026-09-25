import { useState, type ReactNode } from 'react'
import { AddItemPage } from './AddItemPage'
import { ShoppingListPage } from './ShoppingListPage'
import type { ShoppingList } from './useShoppingList'

type ShoppingAreaProps = {
  shoppingList: ShoppingList
  announce: (text: string) => void
  navigation: ReactNode
  suggestNames: (typed: string) => readonly string[]
  suggestUnits: (typed: string) => readonly string[]
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
    cleanUp,
  } = shoppingList
  const [addingItem, setAddingItem] = useState(false)

  if (addingItem) {
    return (
      <AddItemPage
        addItem={addItem}
        announce={announce}
        onBack={() => setAddingItem(false)}
        suggestNames={suggestNames}
        suggestUnits={suggestUnits}
      />
    )
  }

  return (
    <ShoppingListPage
      navigation={navigation}
      items={items}
      openCount={openCount}
      pendingChanges={pendingChanges}
      onAddItem={() => setAddingItem(true)}
      onToggleItem={(item) => announce(toggleItem(item))}
      onLessItem={(item) => announce(takeOneLess(item))}
      onMoreItem={(item) => announce(takeOneMore(item))}
      onCleanUp={() => announce(cleanUp())}
    />
  )
}
