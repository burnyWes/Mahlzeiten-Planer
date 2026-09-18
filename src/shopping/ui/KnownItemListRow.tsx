import { TrashIcon } from '../../shared/ui/TrashIcon'
import type { KnownItem } from '../domain/knownItem'

type KnownItemListRowProps = {
  knownItem: KnownItem
  onOpenKnownItem: (knownItem: KnownItem) => void
  onDeleteKnownItem: (knownItem: KnownItem) => void
}

export function KnownItemListRow({
  knownItem,
  onOpenKnownItem,
  onDeleteKnownItem,
}: KnownItemListRowProps) {
  return (
    <li className="mealRow">
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenKnownItem(knownItem)}
      >
        {knownItem.name}
      </button>
      <button
        type="button"
        className="iconButton"
        onClick={() => onDeleteKnownItem(knownItem)}
        aria-label={`Löschen, ${knownItem.name}`}
      >
        <TrashIcon />
      </button>
    </li>
  )
}
