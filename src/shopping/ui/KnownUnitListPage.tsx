import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { knownUnitsHeading } from '../domain/announcements'
import { knownUnitsByName, type KnownUnit } from '../domain/knownUnit'
import { KnownUnitListRow } from './KnownUnitListRow'

type KnownUnitListPageProps = {
  knownUnits: readonly KnownUnit[]
  onBack: () => void
  onOpenKnownUnit: (knownUnit: KnownUnit) => void
  onDeleteKnownUnit: (knownUnit: KnownUnit) => void
}

export function KnownUnitListPage({
  knownUnits,
  onBack,
  onOpenKnownUnit,
  onDeleteKnownUnit,
}: KnownUnitListPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {knownUnitsHeading(knownUnits.length)}
      </h1>
      {knownUnits.length === 0 ? (
        <p>Noch keine Einheiten.</p>
      ) : (
        <ul className="itemList">
          {knownUnitsByName(knownUnits).map((knownUnit) => (
            <KnownUnitListRow
              key={knownUnit.name}
              knownUnit={knownUnit}
              onOpenKnownUnit={onOpenKnownUnit}
              onDeleteKnownUnit={onDeleteKnownUnit}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
