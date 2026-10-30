import { useState } from 'react'
import {
  knownUnitCreatedAnnouncement,
  knownUnitDeletedAnnouncement,
  knownUnitSavedAnnouncement,
} from '../domain/announcements'
import {
  knownUnitToAdd,
  planKnownUnitRename,
  type KnownUnit,
} from '../domain/knownUnit'
import { normalizeItemName } from '../domain/shoppingItem'
import { DeleteKnownUnitPage } from './DeleteKnownUnitPage'
import { KnownUnitFormPage } from './KnownUnitFormPage'
import { KnownUnitListPage } from './KnownUnitListPage'
import type { KnownUnits } from './useKnownUnits'

type KnownUnitsPage =
  | { kind: 'list' }
  | { kind: 'create' }
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
    page.kind === 'list' || page.kind === 'create'
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

  function createKnownUnit(name: string) {
    const created = knownUnitToAdd(knownUnits.knownUnits, name, Date.now())
    knownUnits.addKnownUnit(created)
    showList()
    announce(knownUnitCreatedAnnouncement(created.name))
  }

  if (page.kind === 'create')
    return (
      <KnownUnitFormPage
        heading="Einheit anlegen"
        initialName=""
        onSave={createKnownUnit}
        onBack={showList}
        announce={announce}
      />
    )

  if (page.kind === 'form' && addressedKnownUnit !== null)
    return (
      <KnownUnitFormPage
        heading="Einheit bearbeiten"
        initialName={addressedKnownUnit.name}
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
      onAddKnownUnit={() => setPage({ kind: 'create' })}
      onOpenKnownUnit={(knownUnit) =>
        setPage({ kind: 'form', name: knownUnit.name })
      }
      onDeleteKnownUnit={(knownUnit) =>
        setPage({ kind: 'delete', name: knownUnit.name })
      }
    />
  )
}
