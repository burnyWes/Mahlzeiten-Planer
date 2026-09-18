import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryKnownItemsClient } from '../api/inMemoryKnownItemsClient'
import type { KnownItemsClient } from '../api/knownItemsClient'
import type { KnownItem } from '../domain/knownItem'
import { KnownItemsArea } from './KnownItemsArea'
import { useKnownItems } from './useKnownItems'

function known(name: string, timesUsed = 1, lastUsedAt = 1): KnownItem {
  return { name, timesUsed, lastUsedAt }
}

type KnownItemsAreaUnderTestProps = {
  client: KnownItemsClient
  announce: (text: string) => void
  onBack: () => void
}

function KnownItemsAreaUnderTest({
  client,
  announce,
  onBack,
}: KnownItemsAreaUnderTestProps) {
  return (
    <KnownItemsArea
      knownItems={useKnownItems(client)}
      announce={announce}
      onBack={onBack}
    />
  )
}

function renderKnownItemsArea(initialKnownItems: readonly KnownItem[] = []) {
  const client = createInMemoryKnownItemsClient(initialKnownItems)
  const announcements: string[] = []
  const departures: string[] = []
  const rendered = render(
    <KnownItemsAreaUnderTest
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

function shownKnownItemNames() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => within(row).getAllByRole('button')[0].textContent)
}

function askToDeleteKnownItem(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Löschen, ${name}` }),
  )
}

function confirmDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
}

function cancelDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
}

function storedNames(
  client: ReturnType<typeof createInMemoryKnownItemsClient>,
) {
  return client.storedKnownItems().map((knownItem) => knownItem.name)
}

describe('KnownItemsArea', () => {
  it('lists the known items in alphabetical order', () => {
    renderKnownItemsArea([
      known('Spaghetti'),
      known('hackfleisch'),
      known('Butter'),
    ])

    expect(shownKnownItemNames()).toEqual([
      'Butter',
      'hackfleisch',
      'Spaghetti',
    ])
    expect(
      screen.getByRole('heading', { name: 'Artikelverwaltung, 3' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Löschen, hackfleisch' }),
    ).toBeInTheDocument()
  })

  it('shows an empty catalog', () => {
    renderKnownItemsArea()

    expect(
      screen.getByRole('heading', { name: 'Artikelverwaltung, keine' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Noch keine Vorschläge.')).toBeInTheDocument()
  })

  it('leads back to the settings', async () => {
    const { departures } = renderKnownItemsArea()

    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Einstellungen' }),
    )

    expect(departures).toEqual(['settings'])
  })

  it('asks before deleting a known item', async () => {
    const { client } = renderKnownItemsArea([known('Butter'), known('Brot')])

    await askToDeleteKnownItem('Butter')

    expect(
      screen.getByRole('heading', { name: 'Butter löschen?' }),
    ).toBeInTheDocument()
    expect(storedNames(client)).toEqual(['Butter', 'Brot'])
  })

  it('keeps the known item when the deletion is cancelled', async () => {
    const { client } = renderKnownItemsArea([known('Butter'), known('Brot')])

    await askToDeleteKnownItem('Butter')
    await cancelDeletion()

    expect(storedNames(client)).toEqual(['Butter', 'Brot'])
    expect(
      screen.getByRole('heading', { name: 'Artikelverwaltung, 2' }),
    ).toBeInTheDocument()
  })

  it('deletes the known item after the confirmation', async () => {
    const { client, announcements } = renderKnownItemsArea([
      known('Butter'),
      known('Brot'),
    ])

    await askToDeleteKnownItem('Butter')
    await confirmDeletion()

    expect(storedNames(client)).toEqual(['Brot'])
    expect(announcements).toContain('Butter gelöscht, noch 1 Vorschlag.')
    expect(
      screen.getByRole('heading', { name: 'Artikelverwaltung, 1' }),
    ).toHaveFocus()
  })

  it('returns to the list when the known item disappears', async () => {
    const { client } = renderKnownItemsArea([known('Butter')])

    await askToDeleteKnownItem('Butter')
    await act(async () => {
      client.removeKnownItem('Butter')
    })

    expect(
      screen.getByRole('heading', { name: 'Artikelverwaltung, keine' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations on the known items', async () => {
    const { rendered } = renderKnownItemsArea([known('Butter')])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the deletion page', async () => {
    const { rendered } = renderKnownItemsArea([known('Butter')])

    await askToDeleteKnownItem('Butter')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
