import { listHeading } from '../domain/announcements'
import {
  formatItemForAnnouncement,
  type ShoppingItem,
} from '../domain/shoppingItem'

type ShoppingListPageProps = {
  items: readonly ShoppingItem[]
  openCount: number
  onAddItem: () => void
}

export function ShoppingListPage({
  items,
  openCount,
  onAddItem,
}: ShoppingListPageProps) {
  return (
    <main className="page">
      <div className="pageHeader">
        <h1>{listHeading(openCount)}</h1>
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
            <li key={item.id}>{formatItemForAnnouncement(item)}</li>
          ))}
        </ul>
      )}
    </main>
  )
}
