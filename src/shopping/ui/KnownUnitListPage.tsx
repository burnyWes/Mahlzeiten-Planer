import { ManagementHeader } from '../../shared/ui/ManagementHeader'
import { knownUnitsHeading } from '../domain/announcements'
import { knownUnitsByName, type KnownUnit } from '../domain/knownUnit'
import { KnownUnitListRow } from './KnownUnitListRow'

type KnownUnitListPageProps = {
  knownUnits: readonly KnownUnit[]
  onBack: () => void
  onAddKnownUnit: () => void
  onOpenKnownUnit: (knownUnit: KnownUnit) => void
  onDeleteKnownUnit: (knownUnit: KnownUnit) => void
}

export function KnownUnitListPage({
  knownUnits,
  onBack,
  onAddKnownUnit,
  onOpenKnownUnit,
  onDeleteKnownUnit,
}: KnownUnitListPageProps) {
  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <ManagementHeader
        heading={knownUnitsHeading(knownUnits.length)}
        addLabel="Einheit anlegen"
        onAdd={onAddKnownUnit}
      />
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
