import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  deleteItemCategoryHeading,
  itemCategoryDeletionNote,
} from '../domain/announcements'
import type { ItemCategory } from '../domain/itemCategory'

type DeleteItemCategoryPageProps = {
  category: ItemCategory
  assignedCount: number
  onDelete: () => void
  onCancel: () => void
}

export function DeleteItemCategoryPage({
  category,
  assignedCount,
  onDelete,
  onCancel,
}: DeleteItemCategoryPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zu den Artikelkategorien
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {deleteItemCategoryHeading(category.name)}
      </h1>
      <p>{itemCategoryDeletionNote(assignedCount)}</p>
      <div className="pageActions">
        <button type="button" onClick={onDelete}>
          Löschen
        </button>
        <button type="button" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </main>
  )
}
