import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { knownItemsHeading } from '../domain/announcements'
import { knownItemsByName, type KnownItem } from '../domain/knownItem'
import { KnownItemListRow } from './KnownItemListRow'

type KnownItemListPageProps = {
  knownItems: readonly KnownItem[]
  onBack: () => void
  onOpenKnownItem: (knownItem: KnownItem) => void
  onDeleteKnownItem: (knownItem: KnownItem) => void
}

export function KnownItemListPage({
  knownItems,
  onBack,
  onOpenKnownItem,
  onDeleteKnownItem,
}: KnownItemListPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {knownItemsHeading(knownItems.length)}
      </h1>
      {knownItems.length === 0 ? (
        <p>Noch keine Vorschläge.</p>
      ) : (
        <ul className="itemList">
          {knownItemsByName(knownItems).map((knownItem) => (
            <KnownItemListRow
              key={knownItem.name}
              knownItem={knownItem}
              onOpenKnownItem={onOpenKnownItem}
              onDeleteKnownItem={onDeleteKnownItem}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
