import { useState, type ReactNode } from 'react'
import { AddItemPage } from './AddItemPage'
import { ShoppingListPage } from './ShoppingListPage'
import type { ShoppingList } from './useShoppingList'

type ShoppingAreaProps = {
  shoppingList: ShoppingList
  announce: (text: string) => void
  navigation: ReactNode
}

export function ShoppingArea({
  shoppingList,
  announce,
  navigation,
}: ShoppingAreaProps) {
  const { items, openCount, pendingChanges, addItem, toggleItem, cleanUp } =
    shoppingList
  const [addingItem, setAddingItem] = useState(false)

  if (addingItem) {
    return (
      <AddItemPage
        addItem={addItem}
        announce={announce}
        onBack={() => setAddingItem(false)}
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
      onCleanUp={() => announce(cleanUp())}
    />
  )
}
