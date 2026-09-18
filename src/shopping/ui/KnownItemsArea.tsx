import { useState } from 'react'
import { knownItemDeletedAnnouncement } from '../domain/announcements'
import type { KnownItem } from '../domain/knownItem'
import { normalizeItemName } from '../domain/shoppingItem'
import { DeleteKnownItemPage } from './DeleteKnownItemPage'
import { KnownItemListPage } from './KnownItemListPage'
import type { KnownItems } from './useKnownItems'

type KnownItemsPage =
  | { kind: 'list' }
  | { kind: 'form'; name: string }
  | { kind: 'delete'; name: string }

type KnownItemsAreaProps = {
  knownItems: KnownItems
  announce: (text: string) => void
  onBack: () => void
}

export function KnownItemsArea({
  knownItems,
  announce,
  onBack,
}: KnownItemsAreaProps) {
  const [page, setPage] = useState<KnownItemsPage>({ kind: 'list' })

  const addressedKnownItem =
    page.kind === 'list'
      ? null
      : (knownItems.knownItems.find(
          (knownItem) =>
            normalizeItemName(knownItem.name) === normalizeItemName(page.name),
        ) ?? null)

  function showList() {
    setPage({ kind: 'list' })
  }

  function deleteKnownItem(knownItem: KnownItem) {
    knownItems.removeKnownItem(knownItem.name)
    showList()
    announce(
      knownItemDeletedAnnouncement(
        knownItem.name,
        knownItems.knownItems.length - 1,
      ),
    )
  }

  if (page.kind === 'delete' && addressedKnownItem !== null)
    return (
      <DeleteKnownItemPage
        knownItem={addressedKnownItem}
        onDelete={() => deleteKnownItem(addressedKnownItem)}
        onCancel={showList}
      />
    )

  return (
    <KnownItemListPage
      knownItems={knownItems.knownItems}
      onBack={onBack}
      onOpenKnownItem={(knownItem) =>
        setPage({ kind: 'form', name: knownItem.name })
      }
      onDeleteKnownItem={(knownItem) =>
        setPage({ kind: 'delete', name: knownItem.name })
      }
    />
  )
}
