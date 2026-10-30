import { ManagementHeader } from '../../shared/ui/ManagementHeader'
import {
  knownItemsHeading,
  shownKnownItemsCount,
} from '../domain/announcements'
import {
  findItemCategory,
  type ItemCategoryCatalog,
} from '../domain/itemCategory'
import {
  knownItemsByName,
  type KnownItem,
  type KnownItemFilter,
  type MealUsingItem,
} from '../domain/knownItem'
import { KnownItemFilterSelect } from './KnownItemFilterSelect'
import { KnownItemListRow } from './KnownItemListRow'

type KnownItemListPageProps = {
  shownKnownItems: readonly KnownItem[]
  totalCount: number
  catalog: ItemCategoryCatalog
  activeFilter: KnownItemFilter | null
  onChooseFilter: (filter: KnownItemFilter | null) => void
  mealsUsingItem: (name: string) => readonly MealUsingItem[]
  onBack: () => void
  onAddKnownItem: () => void
  onOpenKnownItem: (knownItem: KnownItem) => void
  onDeleteKnownItem: (knownItem: KnownItem) => void
}

function emptyListText(totalCount: number): string {
  return totalCount === 0
    ? 'Noch keine Vorschläge.'
    : 'Keine Artikel in dieser Auswahl.'
}

export function KnownItemListPage({
  shownKnownItems,
  totalCount,
  catalog,
  activeFilter,
  onChooseFilter,
  mealsUsingItem,
  onBack,
  onAddKnownItem,
  onOpenKnownItem,
  onDeleteKnownItem,
}: KnownItemListPageProps) {
  const filteredFromCount = activeFilter === null ? null : totalCount

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <ManagementHeader
        heading={
          filteredFromCount === null
            ? knownItemsHeading(totalCount)
            : `Artikel, ${shownKnownItemsCount(shownKnownItems.length, filteredFromCount)}`
        }
        headingLabel={
          filteredFromCount === null
            ? undefined
            : knownItemsHeading(shownKnownItems.length, filteredFromCount)
        }
        addLabel="Artikel anlegen"
        onAdd={onAddKnownItem}
      />
      {catalog.categories.length > 0 && (
        <KnownItemFilterSelect
          catalog={catalog}
          activeFilter={activeFilter}
          onChooseFilter={onChooseFilter}
        />
      )}
      {shownKnownItems.length === 0 ? (
        <p>{emptyListText(totalCount)}</p>
      ) : (
        <ul className="itemList">
          {knownItemsByName(shownKnownItems).map((knownItem) => (
            <KnownItemListRow
              key={knownItem.name}
              knownItem={knownItem}
              category={findItemCategory(catalog, knownItem.categoryId)}
              mealCount={mealsUsingItem(knownItem.name).length}
              onOpenKnownItem={onOpenKnownItem}
              onDeleteKnownItem={onDeleteKnownItem}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
