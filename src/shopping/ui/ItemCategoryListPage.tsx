import { ManagementHeader } from '../../shared/ui/ManagementHeader'
import { itemCategoriesHeading } from '../domain/announcements'
import type {
  ItemCategory,
  ItemCategoryCatalog,
  ItemCategoryId,
} from '../domain/itemCategory'
import { ItemCategoryListRow } from './ItemCategoryListRow'

type ItemCategoryListPageProps = {
  catalog: ItemCategoryCatalog
  assignedCounts: ReadonlyMap<ItemCategoryId, number>
  onBack: () => void
  onAddCategory: () => void
  onSwitchSortByCategory: (on: boolean) => void
  onOpenCategory: (category: ItemCategory) => void
  onDeleteCategory: (category: ItemCategory) => void
}

export function ItemCategoryListPage({
  catalog,
  assignedCounts,
  onBack,
  onAddCategory,
  onSwitchSortByCategory,
  onOpenCategory,
  onDeleteCategory,
}: ItemCategoryListPageProps) {
  const { categories } = catalog

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <ManagementHeader
        heading={itemCategoriesHeading(categories.length)}
        addLabel="Artikelkategorie anlegen"
        onAdd={onAddCategory}
      />
      <div className="sortSwitch">
        <label className="settingsToggle">
          <span>Nach Kategorien sortieren</span>
          <input
            type="checkbox"
            role="switch"
            checked={catalog.sortByCategory}
            onChange={(event) => onSwitchSortByCategory(event.target.checked)}
          />
        </label>
      </div>
      {categories.length === 0 ? (
        <p>Noch keine Kategorien.</p>
      ) : (
        <ul className="itemList">
          {categories.map((category, index) => (
            <ItemCategoryListRow
              key={category.id}
              category={category}
              placement={{ position: index + 1, count: categories.length }}
              assignedCount={assignedCounts.get(category.id) ?? 0}
              onOpenCategory={onOpenCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
