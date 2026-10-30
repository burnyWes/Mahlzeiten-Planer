import { ManagementHeader } from '../../shared/ui/ManagementHeader'
import { categoriesListHeading } from '../domain/announcements'
import type { CategoryOverview } from '../domain/mealCategory'
import { CategoryListRow } from './CategoryListRow'

type CategoryListPageProps = {
  categories: readonly CategoryOverview[]
  onBack: () => void
  onAddCategory: () => void
  onOpenCategory: (overview: CategoryOverview) => void
  onDeleteCategory: (overview: CategoryOverview) => void
}

export function CategoryListPage({
  categories,
  onBack,
  onAddCategory,
  onOpenCategory,
  onDeleteCategory,
}: CategoryListPageProps) {
  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <ManagementHeader
        heading={categoriesListHeading(categories.length)}
        addLabel="Gerichtskategorie anlegen"
        onAdd={onAddCategory}
      />
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
