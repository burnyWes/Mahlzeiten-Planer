import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { categoriesManagementHeading } from '../domain/announcements'
import type { CategoryOverview } from '../domain/mealCategory'
import { CategoryListRow } from './CategoryListRow'

type CategoryListPageProps = {
  categories: readonly CategoryOverview[]
  onBack: () => void
  onOpenCategory: (overview: CategoryOverview) => void
  onDeleteCategory: (overview: CategoryOverview) => void
}

export function CategoryListPage({
  categories,
  onBack,
  onOpenCategory,
  onDeleteCategory,
}: CategoryListPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {categoriesManagementHeading(categories.length)}
      </h1>
      {categories.length === 0 ? (
        <p>Noch keine Kategorien.</p>
      ) : (
        <ul className="itemList">
          {categories.map((overview) => (
            <CategoryListRow
              key={overview.name}
              overview={overview}
              onOpenCategory={onOpenCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
