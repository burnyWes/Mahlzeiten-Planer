import { useState } from 'react'
import {
  knownItemDeletedAnnouncement,
  knownItemSavedAnnouncement,
} from '../domain/announcements'
import { planKnownItemRename, type KnownItem } from '../domain/knownItem'
import { normalizeItemName } from '../domain/shoppingItem'
import { DeleteKnownItemPage } from './DeleteKnownItemPage'
import { KnownItemFormPage } from './KnownItemFormPage'
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

  function renameKnownItem(knownItem: KnownItem, newName: string) {
    const rename = planKnownItemRename(
      knownItems.knownItems,
      knownItem.name,
      newName,
    )
    if (rename === null) {
      showList()
      return
    }
    knownItems.renameKnownItem(rename)
    showList()
    announce(knownItemSavedAnnouncement(rename.written.name))
  }

  if (page.kind === 'form' && addressedKnownItem !== null)
    return (
      <KnownItemFormPage
        knownItem={addressedKnownItem}
        onSave={(newName) => renameKnownItem(addressedKnownItem, newName)}
        onBack={showList}
        announce={announce}
      />
    )

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
