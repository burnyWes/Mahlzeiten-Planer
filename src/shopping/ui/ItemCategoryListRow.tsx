import { TrashIcon } from '../../shared/ui/TrashIcon'
import { itemCategoryRowLabel } from '../domain/announcements'
import type { CategoryPlacement, ItemCategory } from '../domain/itemCategory'

type ItemCategoryListRowProps = {
  category: ItemCategory
  placement: CategoryPlacement
  assignedCount: number
  onOpenCategory: (category: ItemCategory) => void
  onDeleteCategory: (category: ItemCategory) => void
}

export function ItemCategoryListRow({
  category,
  placement,
  assignedCount,
  onOpenCategory,
  onDeleteCategory,
}: ItemCategoryListRowProps) {
  return (
    <li className="mealRow">
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenCategory(category)}
      >
        {itemCategoryRowLabel(category, placement, assignedCount)}
      </button>
      <button
        type="button"
        className="iconButton"
        onClick={() => onDeleteCategory(category)}
        aria-label={`Löschen, ${category.name}`}
      >
        <TrashIcon />
      </button>
    </li>
  )
}
