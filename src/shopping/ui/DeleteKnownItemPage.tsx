import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { KnownItem } from '../domain/knownItem'

type DeleteKnownItemPageProps = {
  knownItem: KnownItem
  onDelete: () => void
  onCancel: () => void
}

export function DeleteKnownItemPage({
  knownItem,
  onDelete,
  onCancel,
}: DeleteKnownItemPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zur Artikelverwaltung
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {knownItem.name} löschen?
      </h1>
      <p>
        Der Vorschlag wird für beide Geräte entfernt. Wird der Name wieder
        verwendet, entsteht er neu.
      </p>
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
