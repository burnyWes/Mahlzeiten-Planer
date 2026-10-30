import { ManagementHeader } from '../../shared/ui/ManagementHeader'
import { knownItemsHeading } from '../domain/announcements'
import {
  findItemCategory,
  type ItemCategoryCatalog,
} from '../domain/itemCategory'
import { knownItemsByName, type KnownItem } from '../domain/knownItem'
import { KnownItemListRow } from './KnownItemListRow'

type KnownItemListPageProps = {
  knownItems: readonly KnownItem[]
  catalog: ItemCategoryCatalog
  onBack: () => void
  onAddKnownItem: () => void
  onOpenKnownItem: (knownItem: KnownItem) => void
  onDeleteKnownItem: (knownItem: KnownItem) => void
}

export function KnownItemListPage({
  knownItems,
  catalog,
  onBack,
  onAddKnownItem,
  onOpenKnownItem,
  onDeleteKnownItem,
}: KnownItemListPageProps) {
  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <ManagementHeader
        heading={knownItemsHeading(knownItems.length)}
        addLabel="Artikel anlegen"
        onAdd={onAddKnownItem}
      />
      {knownItems.length === 0 ? (
        <p>Noch keine Vorschläge.</p>
      ) : (
        <ul className="itemList">
          {knownItemsByName(knownItems).map((knownItem) => (
            <KnownItemListRow
              key={knownItem.name}
              knownItem={knownItem}
              category={findItemCategory(catalog, knownItem.categoryId)}
              onOpenKnownItem={onOpenKnownItem}
              onDeleteKnownItem={onDeleteKnownItem}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
