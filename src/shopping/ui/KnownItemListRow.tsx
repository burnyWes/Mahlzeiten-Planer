import { TrashIcon } from '../../shared/ui/TrashIcon'
import { knownItemRowLabel } from '../domain/announcements'
import type { ItemCategory } from '../domain/itemCategory'
import type { KnownItem } from '../domain/knownItem'

type KnownItemListRowProps = {
  knownItem: KnownItem
  category: ItemCategory | null
  mealCount: number
  onOpenKnownItem: (knownItem: KnownItem) => void
  onDeleteKnownItem: (knownItem: KnownItem) => void
}

export function KnownItemListRow({
  knownItem,
  category,
  mealCount,
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
        {knownItemRowLabel(knownItem, category, mealCount)}
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
