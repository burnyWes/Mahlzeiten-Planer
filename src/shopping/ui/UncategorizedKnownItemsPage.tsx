import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { KnownItem } from '../domain/knownItem'
import { AssignedKnownItems } from './AssignedKnownItems'

type UncategorizedKnownItemsPageProps = {
  knownItems: readonly KnownItem[]
  onBack: () => void
}

export function UncategorizedKnownItemsPage({
  knownItems,
  onBack,
}: UncategorizedKnownItemsPageProps) {
  const headingElement = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Artikelkategorien
      </button>
      <h1 ref={headingElement} tabIndex={-1}>
        Ohne Kategorie
      </h1>
      <AssignedKnownItems
        knownItems={knownItems}
        emptyText="Alle Artikel haben eine Kategorie."
      />
    </main>
  )
}
