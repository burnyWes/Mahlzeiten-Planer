import { TrashIcon } from '../../shared/ui/TrashIcon'
import { categoryRowLabel } from '../domain/announcements'
import type { CategoryOverview } from '../domain/mealCategory'

type CategoryListRowProps = {
  overview: CategoryOverview
  onOpenCategory: (overview: CategoryOverview) => void
  onDeleteCategory: (overview: CategoryOverview) => void
}

export function CategoryListRow({
  overview,
  onOpenCategory,
  onDeleteCategory,
}: CategoryListRowProps) {
  return (
    <li className="mealRow">
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenCategory(overview)}
      >
        {categoryRowLabel(overview)}
      </button>
      <button
        type="button"
        className="iconButton"
        onClick={() => onDeleteCategory(overview)}
        aria-label={`Löschen, ${overview.name}`}
      >
        <TrashIcon />
      </button>
    </li>
  )
}
