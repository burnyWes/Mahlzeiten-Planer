import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { Meal } from '../domain/meal'

type DeleteSupplyPageProps = {
  meal: Meal
  onDelete: () => void
  onCancel: () => void
}

export function DeleteSupplyPage({
  meal,
  onDelete,
  onCancel,
}: DeleteSupplyPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zum Vorrat
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {meal.name} entfernen?
      </h1>
      <p>Der Vorrat wird für beide Geräte entfernt.</p>
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
