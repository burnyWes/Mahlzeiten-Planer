import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { removeItemHeading } from '../domain/announcements'
import type { ShoppingItem } from '../domain/shoppingItem'

type RemoveItemPageProps = {
  item: ShoppingItem
  onRemove: () => void
  onCancel: () => void
}

export function RemoveItemPage({
  item,
  onRemove,
  onCancel,
}: RemoveItemPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zur Einkaufsliste
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {removeItemHeading(item)}
      </h1>
      <p>Der Artikel wird für beide Geräte von der Einkaufsliste entfernt.</p>
      <div className="pageActions">
        <button type="button" onClick={onRemove}>
          Entfernen
        </button>
        <button type="button" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </main>
  )
}
