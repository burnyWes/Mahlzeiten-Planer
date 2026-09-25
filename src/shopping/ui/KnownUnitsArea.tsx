import { useState } from 'react'
import {
  knownUnitDeletedAnnouncement,
  knownUnitSavedAnnouncement,
} from '../domain/announcements'
import { planKnownUnitRename, type KnownUnit } from '../domain/knownUnit'
import { normalizeItemName } from '../domain/shoppingItem'
import { DeleteKnownUnitPage } from './DeleteKnownUnitPage'
import { KnownUnitFormPage } from './KnownUnitFormPage'
import { KnownUnitListPage } from './KnownUnitListPage'
import type { KnownUnits } from './useKnownUnits'

type KnownUnitsPage =
  | { kind: 'list' }
  | { kind: 'form'; name: string }
  | { kind: 'delete'; name: string }

type KnownUnitsAreaProps = {
  knownUnits: KnownUnits
  announce: (text: string) => void
  onBack: () => void
}

export function KnownUnitsArea({
  knownUnits,
  announce,
  onBack,
}: KnownUnitsAreaProps) {
  const [page, setPage] = useState<KnownUnitsPage>({ kind: 'list' })

  const addressedKnownUnit =
    page.kind === 'list'
      ? null
      : (knownUnits.knownUnits.find(
          (knownUnit) =>
            normalizeItemName(knownUnit.name) === normalizeItemName(page.name),
        ) ?? null)

  function showList() {
    setPage({ kind: 'list' })
  }

  function deleteKnownUnit(knownUnit: KnownUnit) {
    knownUnits.removeKnownUnit(knownUnit.name)
    showList()
    announce(
      knownUnitDeletedAnnouncement(
        knownUnit.name,
        knownUnits.knownUnits.length - 1,
      ),
    )
  }

  function renameKnownUnit(knownUnit: KnownUnit, newName: string) {
    const rename = planKnownUnitRename(
      knownUnits.knownUnits,
      knownUnit.name,
      newName,
    )
    if (rename === null) {
      showList()
      return
    }
    knownUnits.renameKnownUnit(rename)
    showList()
    announce(knownUnitSavedAnnouncement(rename.written.name))
  }

  if (page.kind === 'form' && addressedKnownUnit !== null)
    return (
      <KnownUnitFormPage
        knownUnit={addressedKnownUnit}
        onSave={(newName) => renameKnownUnit(addressedKnownUnit, newName)}
        onBack={showList}
        announce={announce}
      />
    )

  if (page.kind === 'delete' && addressedKnownUnit !== null)
    return (
      <DeleteKnownUnitPage
        knownUnit={addressedKnownUnit}
        onDelete={() => deleteKnownUnit(addressedKnownUnit)}
        onCancel={showList}
      />
    )

  return (
    <KnownUnitListPage
      knownUnits={knownUnits.knownUnits}
      onBack={onBack}
      onOpenKnownUnit={(knownUnit) =>
        setPage({ kind: 'form', name: knownUnit.name })
      }
      onDeleteKnownUnit={(knownUnit) =>
        setPage({ kind: 'delete', name: knownUnit.name })
      }
    />
  )
}
