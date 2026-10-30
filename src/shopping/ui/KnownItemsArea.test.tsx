import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import {
  createInMemoryItemCategoriesClient,
  type InMemoryItemCategoriesClient,
} from '../api/inMemoryItemCategoriesClient'
import { createInMemoryKnownItemsClient } from '../api/inMemoryKnownItemsClient'
import type { KnownItemsClient } from '../api/knownItemsClient'
import {
  EMPTY_ITEM_CATEGORY_CATALOG,
  type ItemCategoryCatalog,
} from '../domain/itemCategory'
import type { KnownItem } from '../domain/knownItem'
import { KnownItemsArea } from './KnownItemsArea'
import { useItemCategories } from './useItemCategories'
import { useKnownItems } from './useKnownItems'

function known(
  name: string,
  timesUsed = 1,
  lastUsedAt = 1,
  categoryId: string | null = null,
): KnownItem {
  return { name, timesUsed, lastUsedAt, categoryId }
}

function catalogOf(...names: readonly string[]): ItemCategoryCatalog {
  return {
    categories: names.map((name, index) => ({ id: `c${index + 1}`, name })),
    sortByCategory: true,
  }
}

type KnownItemsAreaUnderTestProps = {
  client: KnownItemsClient
  itemCategoriesClient: InMemoryItemCategoriesClient
  announce: (text: string) => void
  onBack: () => void
}

function KnownItemsAreaUnderTest({
  client,
  itemCategoriesClient,
  announce,
  onBack,
}: KnownItemsAreaUnderTestProps) {
  return (
    <KnownItemsArea
      knownItems={useKnownItems(client)}
      itemCategories={useItemCategories(itemCategoriesClient)}
      announce={announce}
      onBack={onBack}
    />
  )
}

function renderKnownItemsArea(
  initialKnownItems: readonly KnownItem[] = [],
  catalog: ItemCategoryCatalog = EMPTY_ITEM_CATEGORY_CATALOG,
) {
  const client = createInMemoryKnownItemsClient(initialKnownItems)
  const itemCategoriesClient = createInMemoryItemCategoriesClient(catalog)
  const announcements: string[] = []
  const departures: string[] = []
  const rendered = render(
    <KnownItemsAreaUnderTest
      client={client}
      itemCategoriesClient={itemCategoriesClient}
      announce={(text) => {
        announcements.push(text)
      }}
      onBack={() => {
        departures.push('settings')
      }}
    />,
  )
  return { client, itemCategoriesClient, announcements, departures, rendered }
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

function openKnownItem(name: string) {
  return userEvent.click(screen.getByRole('button', { name }))
}

function save() {
  return userEvent.click(screen.getByRole('button', { name: 'Speichern' }))
}

async function fillCategory(text: string) {
  await userEvent.clear(screen.getByLabelText('Kategorie'))
  if (text !== '')
    await userEvent.type(screen.getByLabelText('Kategorie'), text)
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
      screen.getByRole('heading', { name: 'Artikel, 3' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Löschen, hackfleisch' }),
    ).toBeInTheDocument()
  })

  it('shows an empty catalog', () => {
    renderKnownItemsArea()

    expect(
      screen.getByRole('heading', { name: 'Artikel, keine' }),
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

  it('leads from the form and the deletion page back to the known items', async () => {
    renderKnownItemsArea([known('Butter')])

    await openKnownItem('Butter')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Artikeln' }),
    )
    await askToDeleteKnownItem('Butter')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Artikeln' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Artikel, 1' }),
    ).toBeInTheDocument()
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
      screen.getByRole('heading', { name: 'Artikel, 2' }),
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
    expect(screen.getByRole('heading', { name: 'Artikel, 1' })).toHaveFocus()
  })

  it('returns to the list when the known item disappears', async () => {
    const { client } = renderKnownItemsArea([known('Butter')])

    await askToDeleteKnownItem('Butter')
    await act(async () => {
      client.removeKnownItem('Butter')
    })

    expect(
      screen.getByRole('heading', { name: 'Artikel, keine' }),
    ).toBeInTheDocument()
  })

  it('starts the form with the current name in focus', async () => {
    renderKnownItemsArea([known('hackfleisch')])

    await openKnownItem('hackfleisch')

    expect(screen.getByLabelText('Name')).toHaveValue('hackfleisch')
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('corrects the spelling of a known item', async () => {
    const { client, announcements } = renderKnownItemsArea([
      known('hackfleisch', 3, 7),
    ])

    await openKnownItem('hackfleisch')
    await renameTo('Hackfleisch')

    expect(client.storedKnownItems()).toEqual([known('Hackfleisch', 3, 7)])
    expect(announcements).toContain('Hackfleisch gespeichert.')
    expect(screen.getByRole('heading', { name: 'Artikel, 1' })).toHaveFocus()
  })

  it('merges a known item into an existing one', async () => {
    const { client } = renderKnownItemsArea([
      known('Hackfleish', 3, 7),
      known('Hackfleisch', 12, 9),
    ])

    await openKnownItem('Hackfleish')
    await renameTo('Hackfleisch')

    expect(client.storedKnownItems()).toEqual([known('Hackfleisch', 15, 9)])
  })

  it('refuses an empty name', async () => {
    const { client, announcements } = renderKnownItemsArea([
      known('Brot', 2, 5),
    ])

    await openKnownItem('Brot')
    await renameTo('')

    expect(client.storedKnownItems()).toEqual([known('Brot', 2, 5)])
    expect(announcements).toContain('Bitte einen Namen eingeben.')
    expect(screen.getByText('Bitte einen Namen eingeben.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Artikel bearbeiten' }),
    ).toBeInTheDocument()
  })

  it('refuses a name that is too long', async () => {
    const { client, announcements } = renderKnownItemsArea([
      known('Brot', 2, 5),
    ])

    await openKnownItem('Brot')
    await renameTo('B'.repeat(101))

    expect(client.storedKnownItems()).toEqual([known('Brot', 2, 5)])
    expect(announcements).toContain('Der Name ist zu lang.')
    expect(screen.getByText('Der Name ist zu lang.')).toBeInTheDocument()
  })

  it('returns to the list when the known item to be renamed is already gone', async () => {
    const { client } = renderKnownItemsArea([known('Brot')])

    await openKnownItem('Brot')
    await act(async () => {
      client.removeKnownItem('Brot')
    })

    expect(
      screen.getByRole('heading', { name: 'Artikel, keine' }),
    ).toBeInTheDocument()
  })

  it('shows the category of each item', () => {
    renderKnownItemsArea(
      [
        known('Äpfel', 1, 1, 'c1'),
        known('Batterien'),
        known('Pizza', 1, 1, 'gone'),
      ],
      catalogOf('Obst/Gemüse'),
    )

    expect(shownKnownItemNames()).toEqual([
      'Äpfel, Obst/Gemüse',
      'Batterien',
      'Pizza',
    ])
  })

  it('starts the form with the current category', async () => {
    renderKnownItemsArea([known('Äpfel', 1, 1, 'c1')], catalogOf('Obst/Gemüse'))

    await openKnownItem('Äpfel, Obst/Gemüse')

    expect(
      screen.getByRole('heading', { name: 'Artikel bearbeiten' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Kategorie')).toHaveValue('Obst/Gemüse')
  })

  it('suggests categories while typing', async () => {
    renderKnownItemsArea(
      [known('Äpfel')],
      catalogOf('Tiefkühlkost', 'Kühlregal', 'Obst/Gemüse'),
    )

    await openKnownItem('Äpfel')
    await fillCategory('k')

    const suggestions = screen.getByRole('list', {
      name: 'Kategorie-Vorschläge',
    })
    expect(
      within(suggestions)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Kühlregal', 'Tiefkühlkost'])
    await userEvent.click(
      within(suggestions).getByRole('button', { name: 'Kühlregal' }),
    )
    expect(screen.getByLabelText('Kategorie')).toHaveValue('Kühlregal')
  })

  it('assigns a known category in its own spelling', async () => {
    const { client, announcements } = renderKnownItemsArea(
      [known('Äpfel', 2, 5)],
      catalogOf('Backwaren', 'Obst/Gemüse'),
    )

    await openKnownItem('Äpfel')
    await fillCategory('obst/gemüse')
    await save()

    expect(client.storedKnownItems()).toEqual([known('Äpfel', 2, 5, 'c2')])
    expect(announcements).toContain('Äpfel gespeichert.')
    expect(shownKnownItemNames()).toEqual(['Äpfel, Obst/Gemüse'])
  })

  it('creates an unknown category at the end of the order', async () => {
    const { client, itemCategoriesClient, announcements } =
      renderKnownItemsArea(
        [known('Äpfel', 2, 5)],
        catalogOf('Obst', 'Backwaren', 'Süßigkeiten', 'Tiefkühlkost'),
      )

    await openKnownItem('Äpfel')
    await fillCategory('Drogerie')
    await save()

    expect(itemCategoriesClient.storedCatalog().categories.at(-1)).toEqual({
      id: 'k1',
      name: 'Drogerie',
    })
    expect(client.storedKnownItems()).toEqual([known('Äpfel', 2, 5, 'k1')])
    expect(announcements).toContain(
      'Äpfel gespeichert. Kategorie Drogerie neu angelegt, Position 5.',
    )
  })

  it('takes the category away when the field is emptied', async () => {
    const { client } = renderKnownItemsArea(
      [known('Äpfel', 2, 5, 'c1')],
      catalogOf('Obst'),
    )

    await openKnownItem('Äpfel, Obst')
    await fillCategory('')
    await save()

    expect(client.storedKnownItems()).toEqual([known('Äpfel', 2, 5)])
  })

  it('creates no category when the name is refused', async () => {
    const { itemCategoriesClient } = renderKnownItemsArea(
      [known('Äpfel')],
      catalogOf('Obst'),
    )

    await openKnownItem('Äpfel')
    await fillCategory('Drogerie')
    await renameTo('')

    expect(
      itemCategoriesClient.storedCatalog().categories.map(({ name }) => name),
    ).toEqual(['Obst'])
  })

  it('keeps the category from the form when merging', async () => {
    const { client } = renderKnownItemsArea(
      [known('Apfel', 3, 7), known('Äpfel', 12, 9, 'c2')],
      catalogOf('Obst', 'Backwaren'),
    )

    await openKnownItem('Apfel')
    await fillCategory('Obst')
    await renameTo('Äpfel')

    expect(client.storedKnownItems()).toEqual([known('Äpfel', 15, 9, 'c1')])
  })

  it('creates an item through the plus button', async () => {
    const { client, announcements } = renderKnownItemsArea(
      [known('Brot')],
      catalogOf('Obst'),
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Artikel anlegen' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Artikel anlegen' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    await userEvent.type(screen.getByLabelText('Name'), 'Äpfel')
    await fillCategory('obst')
    await save()

    const created = client
      .storedKnownItems()
      .find((knownItem) => knownItem.name === 'Äpfel')
    expect(created).toMatchObject({ timesUsed: 0, categoryId: 'c1' })
    expect(created?.lastUsedAt).toBeGreaterThan(0)
    expect(announcements).toContain('Äpfel angelegt.')
    expect(screen.getByRole('heading', { name: 'Artikel, 2' })).toHaveFocus()
  })

  it('refuses to create an item that is already known', async () => {
    const { client, announcements } = renderKnownItemsArea([known('Äpfel')])

    await userEvent.click(
      screen.getByRole('button', { name: 'Artikel anlegen' }),
    )
    await userEvent.type(screen.getByLabelText('Name'), 'äpfel')
    await save()

    expect(storedNames(client)).toEqual(['Äpfel'])
    expect(
      screen.getByText('Den Artikel Äpfel gibt es schon.'),
    ).toBeInTheDocument()
    expect(announcements).toContain('Den Artikel Äpfel gibt es schon.')
  })

  it('has no accessibility violations on the creation form', async () => {
    const { rendered } = renderKnownItemsArea([], catalogOf('Obst', 'Ostern'))

    await userEvent.click(
      screen.getByRole('button', { name: 'Artikel anlegen' }),
    )
    await fillCategory('o')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the form', async () => {
    const { rendered } = renderKnownItemsArea([known('Butter')])

    await openKnownItem('Butter')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
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
