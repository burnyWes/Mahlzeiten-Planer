import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { categoryDeletionNote } from '../domain/announcements'
import type { CategoryOverview } from '../domain/mealCategory'

type DeleteCategoryPageProps = {
  overview: CategoryOverview
  onDelete: () => void
  onCancel: () => void
}

export function DeleteCategoryPage({
  overview,
  onDelete,
  onCancel,
}: DeleteCategoryPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zur Kategorie-Verwaltung
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {overview.name} löschen?
      </h1>
      <p>{categoryDeletionNote(overview.mealCount)}</p>
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
