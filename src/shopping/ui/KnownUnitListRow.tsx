import { TrashIcon } from '../../shared/ui/TrashIcon'
import type { KnownUnit } from '../domain/knownUnit'

type KnownUnitListRowProps = {
  knownUnit: KnownUnit
  onOpenKnownUnit: (knownUnit: KnownUnit) => void
  onDeleteKnownUnit: (knownUnit: KnownUnit) => void
}

export function KnownUnitListRow({
  knownUnit,
  onOpenKnownUnit,
  onDeleteKnownUnit,
}: KnownUnitListRowProps) {
  return (
    <li className="mealRow">
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenKnownUnit(knownUnit)}
      >
        {knownUnit.name}
      </button>
      <button
        type="button"
        className="iconButton"
        onClick={() => onDeleteKnownUnit(knownUnit)}
        aria-label={`Löschen, ${knownUnit.name}`}
      >
        <TrashIcon />
      </button>
    </li>
  )
}
