import type { ReactNode } from 'react'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { cleanUpLabel, listHeading } from '../domain/announcements'
import {
  isLastUnit,
  type ItemId,
  type ShoppingItem,
} from '../domain/shoppingItem'
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
  const itemIds: readonly ItemId[] = items.map((item) => item.id)
  const { keepRow, rowRemovedAt } = useFocusAfterRemoval(itemIds, heading)

  function takeOneLess(item: ShoppingItem, position: number) {
    if (isLastUnit(item)) rowRemovedAt(position)
    onLessItem(item)
  }

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
            {items.map((item, position) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                checkbox={keepRow(item.id)}
                onToggle={onToggleItem}
                onLess={() => takeOneLess(item, position)}
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
