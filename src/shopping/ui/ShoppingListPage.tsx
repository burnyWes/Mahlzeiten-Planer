import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { cleanUpLabel, listHeading } from '../domain/announcements'
import type { ShoppingItem } from '../domain/shoppingItem'
import { ShoppingItemRow } from './ShoppingItemRow'

type ShoppingListPageProps = {
  navigation: ReactNode
  items: readonly ShoppingItem[]
  openCount: number
  pendingChanges: number
  onAddItem: () => void
  onToggleItem: (item: ShoppingItem) => void
  onLessItem: (item: ShoppingItem) => void
  onMoreItem: (item: ShoppingItem) => void
  onCleanUp: () => void
}

export function ShoppingListPage({
  navigation,
  items,
  openCount,
  pendingChanges,
  onAddItem,
  onToggleItem,
  onLessItem,
  onMoreItem,
  onCleanUp,
}: ShoppingListPageProps) {
  const heading = useHeadingFocus()

  function cleanUpAndReturnFocus() {
    onCleanUp()
    heading.current?.focus()
  }

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
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
                onLess={() => onLessItem(item)}
                onMore={() => onMoreItem(item)}
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
    </>
  )
}
