import { Fragment, useEffect, useRef, type ReactNode } from 'react'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  cleanUpLabel,
  listHeading,
  listSectionHeading,
} from '../domain/announcements'
import {
  showsSectionHeadings,
  type ListSection,
} from '../domain/categorizedList'
import type { ItemId, ShoppingItem } from '../domain/shoppingItem'
import { ShoppingItemRow } from './ShoppingItemRow'

export type ListFocus =
  | { kind: 'heading' }
  | { kind: 'followingRow'; removedAt: number }
  | { kind: 'lessButton'; id: ItemId }

type ShoppingListPageProps = {
  navigation: ReactNode
  items: readonly ShoppingItem[]
  sections: readonly ListSection[]
  openCount: number
  pendingChanges: number
  focus: ListFocus
  onAddItem: () => void
  onToggleItem: (item: ShoppingItem) => void
  onLessItem: (item: ShoppingItem) => void
  onMoreItem: (item: ShoppingItem) => void
  onCleanUp: () => void
}

export function ShoppingListPage({
  navigation,
  items,
  sections,
  openCount,
  pendingChanges,
  focus,
  onAddItem,
  onToggleItem,
  onLessItem,
  onMoreItem,
  onCleanUp,
}: ShoppingListPageProps) {
  const heading = useHeadingFocus()
  const itemIds: readonly ItemId[] = items.map((item) => item.id)
  const { keepRow } = useFocusAfterRemoval(
    itemIds,
    heading,
    focus.kind === 'followingRow' ? focus.removedAt : null,
  )
  const lessButtons = useRef(new Map<ItemId, HTMLButtonElement>())
  const focusOnMount = useRef(focus)

  useEffect(() => {
    const target = focusOnMount.current
    if (target.kind === 'lessButton')
      lessButtons.current.get(target.id)?.focus()
  }, [])

  function keepLessButton(id: ItemId) {
    return (button: HTMLButtonElement | null) => {
      if (button === null) {
        lessButtons.current.delete(id)
      } else {
        lessButtons.current.set(id, button)
      }
    }
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
          sections.map((section) => (
            <Fragment key={section.items[0].id}>
              {showsSectionHeadings(sections) && (
                <h2 className="listSectionHeading">
                  {listSectionHeading(section.category)}
                </h2>
              )}
              <ul className="itemList">
                {section.items.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    checkbox={keepRow(item.id)}
                    lessButton={keepLessButton(item.id)}
                    onToggle={onToggleItem}
                    onLess={() => onLessItem(item)}
                    onMore={() => onMoreItem(item)}
                  />
                ))}
              </ul>
            </Fragment>
          ))
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
