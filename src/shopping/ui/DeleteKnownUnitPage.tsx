import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { KnownUnit } from '../domain/knownUnit'

type DeleteKnownUnitPageProps = {
  knownUnit: KnownUnit
  onDelete: () => void
  onCancel: () => void
}

export function DeleteKnownUnitPage({
  knownUnit,
  onDelete,
  onCancel,
}: DeleteKnownUnitPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zur Einheiten-Verwaltung
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {knownUnit.name} löschen?
      </h1>
      <p>
        Die Einheit wird für beide Geräte entfernt. Wird sie wieder verwendet,
        entsteht sie neu.
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
