import { useState } from 'react'
import type { ShoppingListClient } from '../api/shoppingListClient'
import { AddItemPage } from './AddItemPage'
import { ShoppingListPage } from './ShoppingListPage'
import { useShoppingList } from './useShoppingList'

type ShoppingAppProps = {
  createShoppingListClient: (
    onWriteFailure: (message: string) => void,
  ) => ShoppingListClient
  announce: (text: string) => void
}

export function ShoppingApp({
  createShoppingListClient,
  announce,
}: ShoppingAppProps) {
  const [client] = useState(() => createShoppingListClient(announce))
  const { items, openCount, addItem } = useShoppingList(client)
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
      items={items}
      openCount={openCount}
      onAddItem={() => setAddingItem(true)}
    />
  )
}
