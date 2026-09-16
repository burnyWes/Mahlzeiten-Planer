import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { Meal } from '../domain/meal'

type DeleteMealPageProps = {
  meal: Meal
  onDelete: () => void
  onCancel: () => void
}

export function DeleteMealPage({
  meal,
  onDelete,
  onCancel,
}: DeleteMealPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zum Gericht
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {meal.name} löschen?
      </h1>
      <p>Das Gericht wird für beide Geräte entfernt.</p>
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
