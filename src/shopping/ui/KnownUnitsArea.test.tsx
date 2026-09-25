import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryKnownUnitsClient } from '../api/inMemoryKnownUnitsClient'
import type { KnownUnitsClient } from '../api/knownUnitsClient'
import type { KnownUnit } from '../domain/knownUnit'
import { KnownUnitsArea } from './KnownUnitsArea'
import { useKnownUnits } from './useKnownUnits'

function known(name: string, timesUsed = 1, lastUsedAt = 1): KnownUnit {
  return { name, timesUsed, lastUsedAt }
}

async function noMealUnits(): Promise<readonly string[]> {
  return []
}

type KnownUnitsAreaUnderTestProps = {
  client: KnownUnitsClient
  announce: (text: string) => void
  onBack: () => void
}

function KnownUnitsAreaUnderTest({
  client,
  announce,
  onBack,
}: KnownUnitsAreaUnderTestProps) {
  return (
    <KnownUnitsArea
      knownUnits={useKnownUnits(client, noMealUnits)}
      announce={announce}
      onBack={onBack}
    />
  )
}

function renderKnownUnitsArea(initialKnownUnits: readonly KnownUnit[]) {
  const client = createInMemoryKnownUnitsClient(initialKnownUnits)
  const announcements: string[] = []
  const departures: string[] = []
  const rendered = render(
    <KnownUnitsAreaUnderTest
      client={client}
      announce={(text) => {
        announcements.push(text)
      }}
      onBack={() => {
        departures.push('settings')
      }}
    />,
  )
  return { client, announcements, departures, rendered }
}

function shownKnownUnitNames() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => within(row).getAllByRole('button')[0].textContent)
}

function askToDeleteKnownUnit(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Löschen, ${name}` }),
  )
}

function confirmDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
}

function openKnownUnit(name: string) {
  return userEvent.click(screen.getByRole('button', { name }))
}

function save() {
  return userEvent.click(screen.getByRole('button', { name: 'Speichern' }))
}

async function renameTo(newName: string) {
  await userEvent.clear(screen.getByLabelText('Name'))
  if (newName !== '')
    await userEvent.type(screen.getByLabelText('Name'), newName)
  await save()
}

function cancelDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
}

function storedNames(
  client: ReturnType<typeof createInMemoryKnownUnitsClient>,
) {
  return client.storedKnownUnits().map((knownUnit) => knownUnit.name)
}

describe('KnownUnitsArea', () => {
  it('lists the units in alphabetical order', () => {
    renderKnownUnitsArea([known('Zehe'), known('kg'), known('g')])

    expect(shownKnownUnitNames()).toEqual(['g', 'kg', 'Zehe'])
    expect(
      screen.getByRole('heading', { name: 'Einheiten-Verwaltung, 3' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Löschen, Zehe' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /hinzufügen/ })).toBeNull()
  })

  it('shows an empty catalog', () => {
    renderKnownUnitsArea([])

    expect(
      screen.getByRole('heading', { name: 'Einheiten-Verwaltung, keine' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Noch keine Einheiten.')).toBeInTheDocument()
  })

  it('leads back to the settings', async () => {
    const { departures } = renderKnownUnitsArea([])

    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Einstellungen' }),
    )

    expect(departures).toEqual(['settings'])
  })

  it('asks before deleting a unit', async () => {
    const { client } = renderKnownUnitsArea([known('Zehe'), known('g')])

    await askToDeleteKnownUnit('Zehe')

    expect(
      screen.getByRole('heading', { name: 'Zehe löschen?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Die Einheit wird für beide Geräte entfernt. Wird sie wieder verwendet, entsteht sie neu.',
      ),
    ).toBeInTheDocument()
    expect(storedNames(client)).toEqual(['Zehe', 'g'])
  })

  it('keeps the unit when the deletion is cancelled', async () => {
    const { client } = renderKnownUnitsArea([known('Zehe'), known('g')])

    await askToDeleteKnownUnit('Zehe')
    await cancelDeletion()

    expect(storedNames(client)).toEqual(['Zehe', 'g'])
    expect(
      screen.getByRole('heading', { name: 'Einheiten-Verwaltung, 2' }),
    ).toBeInTheDocument()
  })

  it('deletes the unit after the confirmation', async () => {
    const { client, announcements } = renderKnownUnitsArea([
      known('Zehe'),
      known('g'),
    ])

    await askToDeleteKnownUnit('Zehe')
    await confirmDeletion()

    expect(storedNames(client)).toEqual(['g'])
    expect(announcements).toContain('Zehe gelöscht, noch 1 Einheit.')
    expect(
      screen.getByRole('heading', { name: 'Einheiten-Verwaltung, 1' }),
    ).toHaveFocus()
  })

  it('returns to the list when the unit disappears', async () => {
    const { client } = renderKnownUnitsArea([known('Zehe')])

    await askToDeleteKnownUnit('Zehe')
    await act(async () => {
      client.removeKnownUnit('Zehe')
    })

    expect(
      screen.getByRole('heading', { name: 'Einheiten-Verwaltung, keine' }),
    ).toBeInTheDocument()
  })

  it('starts the form with the current name in focus', async () => {
    renderKnownUnitsArea([known('zehe')])

    await openKnownUnit('zehe')

    expect(
      screen.getByRole('heading', { name: 'Einheit bearbeiten' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('zehe')
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('corrects the spelling of a unit', async () => {
    const { client, announcements } = renderKnownUnitsArea([
      known('zehe', 3, 7),
    ])

    await openKnownUnit('zehe')
    await renameTo('Zehe')

    expect(client.storedKnownUnits()).toEqual([known('Zehe', 3, 7)])
    expect(announcements).toContain('Zehe gespeichert.')
    expect(
      screen.getByRole('heading', { name: 'Einheiten-Verwaltung, 1' }),
    ).toHaveFocus()
  })

  it('merges a unit into an existing one', async () => {
    const { client } = renderKnownUnitsArea([
      known('gr', 3, 7),
      known('g', 12, 9),
    ])

    await openKnownUnit('gr')
    await renameTo('g')

    expect(client.storedKnownUnits()).toEqual([known('g', 15, 9)])
  })

  it('refuses an empty name', async () => {
    const { client, announcements } = renderKnownUnitsArea([known('g', 2, 5)])

    await openKnownUnit('g')
    await renameTo('')

    expect(client.storedKnownUnits()).toEqual([known('g', 2, 5)])
    expect(announcements).toContain('Bitte einen Namen eingeben.')
    expect(screen.getByText('Bitte einen Namen eingeben.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Einheit bearbeiten' }),
    ).toBeInTheDocument()
  })

  it('refuses a name that is too long', async () => {
    const { client, announcements } = renderKnownUnitsArea([known('g', 2, 5)])

    await openKnownUnit('g')
    await renameTo('g'.repeat(101))

    expect(client.storedKnownUnits()).toEqual([known('g', 2, 5)])
    expect(announcements).toContain('Der Name ist zu lang.')
    expect(screen.getByText('Der Name ist zu lang.')).toBeInTheDocument()
  })

  it('returns to the list when the unit to be renamed is already gone', async () => {
    const { client } = renderKnownUnitsArea([known('Zehe')])

    await openKnownUnit('Zehe')
    await act(async () => {
      client.removeKnownUnit('Zehe')
    })

    expect(
      screen.getByRole('heading', { name: 'Einheiten-Verwaltung, keine' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations on the form', async () => {
    const { rendered } = renderKnownUnitsArea([known('Zehe')])

    await openKnownUnit('Zehe')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the units', async () => {
    const { rendered } = renderKnownUnitsArea([known('Zehe')])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the deletion page', async () => {
    const { rendered } = renderKnownUnitsArea([known('Zehe')])

    await askToDeleteKnownUnit('Zehe')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
