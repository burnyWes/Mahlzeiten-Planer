import { useRef } from 'react'
import { cleanUpLabel, listHeading } from '../domain/announcements'
import type { ShoppingItem } from '../domain/shoppingItem'
import { ShoppingItemRow } from './ShoppingItemRow'

type ShoppingListPageProps = {
  items: readonly ShoppingItem[]
  openCount: number
  pendingChanges: number
  onAddItem: () => void
  onToggleItem: (item: ShoppingItem) => void
  onCleanUp: () => void
}

export function ShoppingListPage({
  items,
  openCount,
  pendingChanges,
  onAddItem,
  onToggleItem,
  onCleanUp,
}: ShoppingListPageProps) {
  const heading = useRef<HTMLHeadingElement>(null)

  function cleanUpAndReturnFocus() {
    onCleanUp()
    heading.current?.focus()
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <h1 ref={heading} tabIndex={-1}>
          {listHeading(openCount)}
        </h1>
        <button
          type="button"
          className="addItemButton"
          onClick={onAddItem}
          aria-label="Artikel hinzufügen"
        >
          +
        </button>
      </div>
      {items.length === 0 ? (
        <p>Die Liste ist leer.</p>
      ) : (
        <ul className="itemList">
          {items.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={onToggleItem}
            />
          ))}
        </ul>
      )}
      {pendingChanges > 0 && (
        <button type="button" onClick={cleanUpAndReturnFocus}>
          {cleanUpLabel(pendingChanges)}
        </button>
      )}
    </main>
  )
}
