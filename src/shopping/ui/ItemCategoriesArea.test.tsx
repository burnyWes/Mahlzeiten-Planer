import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import {
  createInMemoryItemCategoriesClient,
  type InMemoryItemCategoriesClient,
} from '../api/inMemoryItemCategoriesClient'
import type {
  ItemCategoryCatalog,
  ItemCategoryId,
} from '../domain/itemCategory'
import { ItemCategoriesArea } from './ItemCategoriesArea'
import { useItemCategories } from './useItemCategories'

function catalogOf(...names: readonly string[]): ItemCategoryCatalog {
  return {
    categories: names.map((name, index) => ({ id: `c${index + 1}`, name })),
    sortByCategory: true,
  }
}

type ItemCategoriesAreaUnderTestProps = {
  client: InMemoryItemCategoriesClient
  assignedCounts: ReadonlyMap<ItemCategoryId, number>
  announce: (text: string) => void
  onBack: () => void
}

function ItemCategoriesAreaUnderTest({
  client,
  assignedCounts,
  announce,
  onBack,
}: ItemCategoriesAreaUnderTestProps) {
  return (
    <ItemCategoriesArea
      itemCategories={useItemCategories(client)}
      assignedCounts={assignedCounts}
      announce={announce}
      onBack={onBack}
    />
  )
}

function renderItemCategoriesArea(
  catalog: ItemCategoryCatalog,
  assignedCounts: ReadonlyMap<ItemCategoryId, number> = new Map(),
) {
  const client = createInMemoryItemCategoriesClient(catalog)
  const announcements: string[] = []
  const departures: string[] = []
  const rendered = render(
    <ItemCategoriesAreaUnderTest
      client={client}
      assignedCounts={assignedCounts}
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

function shownRows() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => within(row).getAllByRole('button')[0].textContent)
}

function storedNames(client: InMemoryItemCategoriesClient) {
  return client.storedCatalog().categories.map((category) => category.name)
}

function startCreating() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Artikelkategorie anlegen' }),
  )
}

function positionSpinner() {
  return screen.getByRole('spinbutton', { name: 'Position' })
}

async function movePosition(steps: number) {
  positionSpinner().focus()
  const key = steps < 0 ? '{ArrowDown}' : '{ArrowUp}'
  for (let step = 0; step < Math.abs(steps); step += 1)
    await userEvent.keyboard(key)
}

async function typeName(name: string) {
  await userEvent.clear(screen.getByLabelText('Name'))
  if (name !== '') await userEvent.type(screen.getByLabelText('Name'), name)
}

function save() {
  return userEvent.click(screen.getByRole('button', { name: 'Speichern' }))
}

function openCategory(rowLabel: string) {
  return userEvent.click(screen.getByRole('button', { name: rowLabel }))
}

function askToDeleteCategory(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Löschen, ${name}` }),
  )
}

describe('ItemCategoriesArea', () => {
  it('lists the categories in their order with the number of items', () => {
    renderItemCategoriesArea(
      catalogOf('Obst/Gemüse', 'Backwaren'),
      new Map([['c1', 12]]),
    )

    expect(
      screen.getByRole('heading', { name: 'Artikelkategorien, 2' }),
    ).toHaveFocus()
    expect(shownRows()).toEqual([
      '1. Obst/Gemüse, 12 Artikel',
      '2. Backwaren, 0 Artikel',
    ])
    expect(
      screen.getByRole('button', { name: 'Löschen, Backwaren' }),
    ).toBeInTheDocument()
  })

  it('shows an empty catalog', () => {
    renderItemCategoriesArea(catalogOf())

    expect(
      screen.getByRole('heading', { name: 'Artikelkategorien, keine' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Noch keine Kategorien.')).toBeInTheDocument()
  })

  it('leads back to the settings', async () => {
    const { departures } = renderItemCategoriesArea(catalogOf())

    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Einstellungen' }),
    )

    expect(departures).toEqual(['settings'])
  })

  it('offers an empty form placed at the end', async () => {
    renderItemCategoriesArea(catalogOf('Obst', 'Backwaren'))

    await startCreating()

    expect(
      screen.getByRole('heading', { name: 'Kategorie anlegen' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(positionSpinner()).toHaveAttribute('aria-valuetext', '3 von 3')
    expect(positionSpinner()).toHaveAttribute('aria-valuemin', '1')
    expect(positionSpinner()).toHaveAttribute('aria-valuemax', '3')
  })

  it('creates a category at the end', async () => {
    const { client, announcements } = renderItemCategoriesArea(
      catalogOf('Obst', 'Backwaren', 'Süßigkeiten', 'Tiefkühlkost'),
    )

    await startCreating()
    await typeName('Drogerie')
    await save()

    expect(storedNames(client)).toEqual([
      'Obst',
      'Backwaren',
      'Süßigkeiten',
      'Tiefkühlkost',
      'Drogerie',
    ])
    expect(announcements).toContain('Drogerie angelegt, Position 5 von 5.')
    expect(
      screen.getByRole('heading', { name: 'Artikelkategorien, 5' }),
    ).toHaveFocus()
  })

  it('creates a category in between and moves the following ones back', async () => {
    const { client, announcements } = renderItemCategoriesArea(
      catalogOf('Obst', 'Backwaren', 'Tiefkühlkost'),
    )

    await startCreating()
    await typeName('Drogerie')
    await movePosition(-2)
    await save()

    expect(storedNames(client)).toEqual([
      'Obst',
      'Drogerie',
      'Backwaren',
      'Tiefkühlkost',
    ])
    expect(announcements).toContain('Drogerie angelegt, Position 2 von 4.')
    expect(shownRows()[2]).toBe('3. Backwaren, 0 Artikel')
  })

  it('keeps the position within the catalog', async () => {
    renderItemCategoriesArea(catalogOf('Obst'))

    await startCreating()
    await movePosition(3)
    expect(positionSpinner()).toHaveAttribute('aria-valuetext', '2 von 2')
    await movePosition(-5)
    expect(positionSpinner()).toHaveAttribute('aria-valuetext', '1 von 2')
  })

  it('changes name and position of a category', async () => {
    const { client, announcements } = renderItemCategoriesArea(
      catalogOf('Obst', 'Süßigkeiten', 'Tiefkühlkost', 'Brot'),
    )

    await openCategory('4. Brot, 0 Artikel')
    expect(
      screen.getByRole('heading', { name: 'Kategorie bearbeiten' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Brot')
    expect(positionSpinner()).toHaveAttribute('aria-valuetext', '4 von 4')
    await typeName('Backwaren')
    await movePosition(-2)
    await save()

    expect(storedNames(client)).toEqual([
      'Obst',
      'Backwaren',
      'Süßigkeiten',
      'Tiefkühlkost',
    ])
    expect(announcements).toContain('Backwaren gespeichert, Position 2 von 4.')
  })

  it('refuses a name that is already taken', async () => {
    const { client, announcements } = renderItemCategoriesArea(
      catalogOf('Tiefkühlkost'),
    )

    await startCreating()
    await typeName('tiefkühlkost')
    await save()

    expect(storedNames(client)).toEqual(['Tiefkühlkost'])
    expect(
      screen.getByText('Die Kategorie Tiefkühlkost gibt es schon.'),
    ).toBeInTheDocument()
    expect(announcements).toContain('Die Kategorie Tiefkühlkost gibt es schon.')
  })

  it('refuses an empty name', async () => {
    const { client, announcements } = renderItemCategoriesArea(
      catalogOf('Obst'),
    )

    await openCategory('1. Obst, 0 Artikel')
    await typeName('')
    await save()

    expect(storedNames(client)).toEqual(['Obst'])
    expect(announcements).toContain('Bitte einen Namen eingeben.')
  })

  it('asks before deleting a category and names the items losing it', async () => {
    const { client } = renderItemCategoriesArea(
      catalogOf('Obst', 'Tiefkühlkost'),
      new Map([['c2', 7]]),
    )

    await askToDeleteCategory('Tiefkühlkost')

    expect(
      screen.getByRole('heading', { name: 'Tiefkühlkost löschen?' }),
    ).toHaveFocus()
    expect(
      screen.getByText('7 Artikel haben dann keine Kategorie mehr.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(storedNames(client)).toEqual(['Obst', 'Tiefkühlkost'])
  })

  it('deletes a category after the confirmation', async () => {
    const { client, announcements } = renderItemCategoriesArea(
      catalogOf('Obst', 'Tiefkühlkost'),
    )

    await askToDeleteCategory('Tiefkühlkost')
    expect(
      screen.getByText('Kein Artikel ist dieser Kategorie zugeordnet.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }))

    expect(storedNames(client)).toEqual(['Obst'])
    expect(announcements).toContain('Tiefkühlkost gelöscht, noch 1 Kategorie.')
    expect(
      screen.getByRole('heading', { name: 'Artikelkategorien, 1' }),
    ).toHaveFocus()
  })

  it('returns to the list when the category is deleted elsewhere', async () => {
    const { client } = renderItemCategoriesArea(catalogOf('Obst', 'Brot'))

    await openCategory('2. Brot, 0 Artikel')
    await act(async () => {
      client.catalogArrivesFromElsewhere(catalogOf('Obst'))
    })

    expect(
      screen.getByRole('heading', { name: 'Artikelkategorien, 1' }),
    ).toBeInTheDocument()
  })

  it('switches the sorting by categories for the household', async () => {
    const { client } = renderItemCategoriesArea(catalogOf('Obst'))

    const sortSwitch = screen.getByRole('switch', {
      name: 'Nach Kategorien sortieren',
    })
    expect(sortSwitch).toBeChecked()
    await userEvent.click(sortSwitch)

    expect(client.storedCatalog().sortByCategory).toBe(false)
    expect(sortSwitch).not.toBeChecked()
  })

  it('builds two quick changes on each other', async () => {
    const { client } = renderItemCategoriesArea(catalogOf('Obst'))

    await startCreating()
    await typeName('Brot')
    await save()
    await userEvent.click(
      screen.getByRole('switch', { name: 'Nach Kategorien sortieren' }),
    )

    expect(client.storedCatalog()).toEqual({
      categories: [
        { id: 'c1', name: 'Obst' },
        { id: 'k1', name: 'Brot' },
      ],
      sortByCategory: false,
    })
  })

  it('has no accessibility violations on the list', async () => {
    const { rendered } = renderItemCategoriesArea(catalogOf('Obst'))

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the form', async () => {
    const { rendered } = renderItemCategoriesArea(catalogOf('Obst'))

    await openCategory('1. Obst, 0 Artikel')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the deletion page', async () => {
    const { rendered } = renderItemCategoriesArea(catalogOf('Obst'))

    await askToDeleteCategory('Obst')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
