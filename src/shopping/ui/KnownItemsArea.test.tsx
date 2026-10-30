import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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
import type { KnownItem, MealUsingItem } from '../domain/knownItem'
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

type MealsUsingItems = Readonly<Record<string, readonly MealUsingItem[]>>

function usingMeal(mealName: string): MealUsingItem {
  return { mealId: `id-${mealName}`, mealName }
}

type MealRemoval = { mealId: string; name: string }

type KnownItemsAreaUnderTestProps = {
  client: KnownItemsClient
  itemCategoriesClient: InMemoryItemCategoriesClient
  mealsUsingItems: MealsUsingItems
  renamedMealCount: number
  removals: MealRemoval[]
  renames: (readonly [string, string])[]
  announce: (text: string) => void
  onBack: () => void
}

function KnownItemsAreaUnderTest({
  client,
  itemCategoriesClient,
  mealsUsingItems,
  renamedMealCount,
  removals,
  renames,
  announce,
  onBack,
}: KnownItemsAreaUnderTestProps) {
  const [usages, setUsages] = useState(mealsUsingItems)

  function removeItemFromMeal(mealId: string, name: string) {
    removals.push({ mealId, name })
    setUsages((before) => ({
      ...before,
      [name]: (before[name] ?? []).filter((one) => one.mealId !== mealId),
    }))
  }

  return (
    <KnownItemsArea
      knownItems={useKnownItems(client)}
      itemCategories={useItemCategories(itemCategoriesClient)}
      mealsUsingItem={(name) => usages[name] ?? []}
      onRemoveItemFromMeal={removeItemFromMeal}
      onKnownItemRenamed={(from, to) => {
        renames.push([from, to])
        return renamedMealCount
      }}
      announce={announce}
      onBack={onBack}
    />
  )
}

function renderKnownItemsArea(
  initialKnownItems: readonly KnownItem[] = [],
  catalog: ItemCategoryCatalog = EMPTY_ITEM_CATEGORY_CATALOG,
  mealsUsingItems: MealsUsingItems = {},
  renamedMealCount = 0,
) {
  const client = createInMemoryKnownItemsClient(initialKnownItems)
  const itemCategoriesClient = createInMemoryItemCategoriesClient(catalog)
  const announcements: string[] = []
  const departures: string[] = []
  const removals: MealRemoval[] = []
  const renames: (readonly [string, string])[] = []
  const rendered = render(
    <KnownItemsAreaUnderTest
      client={client}
      itemCategoriesClient={itemCategoriesClient}
      mealsUsingItems={mealsUsingItems}
      renamedMealCount={renamedMealCount}
      removals={removals}
      renames={renames}
      announce={(text) => {
        announcements.push(text)
      }}
      onBack={() => {
        departures.push('settings')
      }}
    />,
  )
  return {
    client,
    itemCategoriesClient,
    announcements,
    departures,
    removals,
    renames,
    rendered,
  }
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
      'Äpfel (Obst/Gemüse)',
      'Batterien',
      'Pizza',
    ])
  })

  it('starts the form with the current category', async () => {
    renderKnownItemsArea([known('Äpfel', 1, 1, 'c1')], catalogOf('Obst/Gemüse'))

    await openKnownItem('Äpfel (Obst/Gemüse)')

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
    expect(shownKnownItemNames()).toEqual(['Äpfel (Obst/Gemüse)'])
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

    await openKnownItem('Äpfel (Obst)')
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

function knownItemFilter() {
  return screen.getByRole('combobox', { name: 'Filter' })
}

function chooseKnownItemFilter(option: string) {
  return userEvent.selectOptions(knownItemFilter(), option)
}

function resetKnownItemFilter() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Filter zurücksetzen' }),
  )
}

const filterableKnownItems = [
  known('Mehl', 1, 1, 'c2'),
  known('Hefe', 1, 1, 'c2'),
  known('Äpfel', 1, 1, 'c1'),
  known('Kaffee'),
  known('Backpapier', 1, 1, 'gone'),
]

const filterableCatalog = catalogOf('Obst/Gemüse', 'Backen', 'Drogerie')

describe('KnownItemsArea filter', () => {
  it('offers no filter while there are no categories', () => {
    renderKnownItemsArea([known('Butter')])

    expect(
      screen.queryByRole('combobox', { name: 'Filter' }),
    ).not.toBeInTheDocument()
  })

  it('offers all, the categories in store order and the uncategorized items', () => {
    renderKnownItemsArea(filterableKnownItems, filterableCatalog)

    expect(
      within(knownItemFilter())
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Alle', 'Obst/Gemüse', 'Backen', 'Drogerie', 'Ohne Kategorie'])
  })

  it('shows only the items of the chosen category', async () => {
    const { announcements } = renderKnownItemsArea(
      filterableKnownItems,
      filterableCatalog,
    )

    await chooseKnownItemFilter('Backen')

    expect(shownKnownItemNames()).toEqual(['Hefe (Backen)', 'Mehl (Backen)'])
    const heading = screen.getByRole('heading', { name: 'Artikel, 2 von 5' })
    expect(heading).toHaveTextContent('Artikel, 2 / 5')
    expect(announcements).toContain('Backen, 2 von 5 Artikeln.')
  })

  it('shows the items without a category and with a deleted one', async () => {
    renderKnownItemsArea(filterableKnownItems, filterableCatalog)

    await chooseKnownItemFilter('Ohne Kategorie')

    expect(shownKnownItemNames()).toEqual(['Backpapier', 'Kaffee'])
  })

  it('says when no item matches the filter', async () => {
    renderKnownItemsArea(filterableKnownItems, filterableCatalog)

    await chooseKnownItemFilter('Drogerie')

    expect(
      screen.getByText('Keine Artikel in dieser Auswahl.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Artikel, 0 von 5' }),
    ).toBeInTheDocument()
  })

  it('resets the filter', async () => {
    const { announcements } = renderKnownItemsArea(
      filterableKnownItems,
      filterableCatalog,
    )

    await chooseKnownItemFilter('Backen')
    await resetKnownItemFilter()

    expect(shownKnownItemNames()).toHaveLength(5)
    expect(announcements).toContain('Filter zurückgesetzt, 5 Artikel.')
    expect(knownItemFilter()).toHaveFocus()
    expect(
      screen.queryByRole('button', { name: 'Filter zurücksetzen' }),
    ).not.toBeInTheDocument()
  })

  it('keeps the filter after opening an item', async () => {
    renderKnownItemsArea(filterableKnownItems, filterableCatalog)

    await chooseKnownItemFilter('Backen')
    await openKnownItem('Mehl (Backen)')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Artikeln' }),
    )

    expect(knownItemFilter()).toHaveDisplayValue('Backen')
    expect(shownKnownItemNames()).toEqual(['Hefe (Backen)', 'Mehl (Backen)'])
  })

  it('forgets the filter when its category disappears', async () => {
    const { itemCategoriesClient } = renderKnownItemsArea(
      filterableKnownItems,
      filterableCatalog,
    )

    await chooseKnownItemFilter('Drogerie')
    await act(async () => {
      itemCategoriesClient.catalogArrivesFromElsewhere(
        catalogOf('Obst/Gemüse', 'Backen'),
      )
    })
    expect(knownItemFilter()).toHaveDisplayValue('Alle')
    await act(async () => {
      itemCategoriesClient.catalogArrivesFromElsewhere(filterableCatalog)
    })

    expect(knownItemFilter()).toHaveDisplayValue('Alle')
    expect(shownKnownItemNames()).toHaveLength(5)
  })

  it('has no accessibility violations while filtered', async () => {
    const { rendered } = renderKnownItemsArea(
      filterableKnownItems,
      filterableCatalog,
    )

    await chooseKnownItemFilter('Backen')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

describe('KnownItemsArea meals using an item', () => {
  it('counts the meals using each item', () => {
    renderKnownItemsArea(
      [known('Mehl', 1, 1, 'c1'), known('Hefe'), known('Zahnpasta')],
      catalogOf('Backen'),
      {
        Mehl: [usingMeal('Pfannkuchen'), usingMeal('Pizza'), usingMeal('Brot')],
        Hefe: [usingMeal('Pizza')],
      },
    )

    expect(shownKnownItemNames()).toEqual([
      'Hefe, 1 Gericht',
      'Mehl (Backen), 3 Gerichte',
      'Zahnpasta',
    ])
    expect(
      screen.getByRole('button', { name: 'Löschen, Mehl' }),
    ).toBeInTheDocument()
  })

  it('notes on the deletion page that the meals keep the item', async () => {
    renderKnownItemsArea([known('Mehl'), known('Zahnpasta')], undefined, {
      Mehl: [usingMeal('Pfannkuchen'), usingMeal('Pizza')],
    })

    await askToDeleteKnownItem('Mehl')
    expect(
      screen.getByText(
        'Mehl steht noch in 2 Gerichten und bleibt dort erhalten.',
      ),
    ).toBeInTheDocument()
    await cancelDeletion()
    await askToDeleteKnownItem('Zahnpasta')

    expect(screen.queryByText(/steht noch in/)).not.toBeInTheDocument()
  })
})

function usingMealNames() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => row.textContent)
}

function removeFromMeal(mealName: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Entfernen, ${mealName}` }),
  )
}

describe('KnownItemsArea meals on the form', () => {
  it('lists the meals using the item', async () => {
    renderKnownItemsArea([known('Mehl'), known('Zahnpasta')], undefined, {
      Mehl: [usingMeal('Pfannkuchen'), usingMeal('Pizza')],
    })

    await openKnownItem('Mehl, 2 Gerichte')

    expect(
      screen.getByRole('heading', { level: 2, name: 'Gerichte, 2' }),
    ).toBeInTheDocument()
    expect(usingMealNames()).toEqual(['Pfannkuchen', 'Pizza'])
  })

  it('says when no meal uses the item', async () => {
    renderKnownItemsArea([known('Zahnpasta')])

    await openKnownItem('Zahnpasta')

    expect(
      screen.getByRole('heading', { level: 2, name: 'Gerichte, keine' }),
    ).toBeInTheDocument()
    expect(screen.getByText('In keinem Gericht verwendet.')).toBeInTheDocument()
  })

  it('shows no meals when creating an item', async () => {
    renderKnownItemsArea()

    await userEvent.click(
      screen.getByRole('button', { name: 'Artikel anlegen' }),
    )

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('takes the item out of a meal at once', async () => {
    const { removals, announcements } = renderKnownItemsArea(
      [known('Mehl')],
      undefined,
      { Mehl: [usingMeal('Pfannkuchen'), usingMeal('Pizza')] },
    )

    await openKnownItem('Mehl, 2 Gerichte')
    await removeFromMeal('Pizza')

    expect(removals).toEqual([{ mealId: 'id-Pizza', name: 'Mehl' }])
    expect(announcements).toContain('Mehl aus Pizza entfernt, noch 1 Gericht.')
    expect(usingMealNames()).toEqual(['Pfannkuchen'])
    expect(
      screen.getByRole('button', { name: 'Entfernen, Pfannkuchen' }),
    ).toHaveFocus()
  })

  it('moves the focus to the heading after the last meal', async () => {
    const { announcements } = renderKnownItemsArea([known('Mehl')], undefined, {
      Mehl: [usingMeal('Pizza')],
    })

    await openKnownItem('Mehl, 1 Gericht')
    await removeFromMeal('Pizza')

    expect(announcements).toContain(
      'Mehl aus Pizza entfernt, in keinem Gericht mehr.',
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Gerichte, keine' }),
    ).toHaveFocus()
    expect(screen.getByText('In keinem Gericht verwendet.')).toBeInTheDocument()
  })

  it('keeps what was typed when the item leaves a meal', async () => {
    renderKnownItemsArea([known('Mehl')], catalogOf('Backen'), {
      Mehl: [usingMeal('Pfannkuchen'), usingMeal('Pizza')],
    })

    await openKnownItem('Mehl, 2 Gerichte')
    await userEvent.clear(screen.getByLabelText('Name'))
    await userEvent.type(screen.getByLabelText('Name'), 'Weizenmehl')
    await fillCategory('Backen')
    await removeFromMeal('Pizza')

    expect(screen.getByLabelText('Name')).toHaveValue('Weizenmehl')
    expect(screen.getByLabelText('Kategorie')).toHaveValue('Backen')
  })

  it('has no accessibility violations with the meals', async () => {
    const { rendered } = renderKnownItemsArea([known('Mehl')], undefined, {
      Mehl: [usingMeal('Pfannkuchen'), usingMeal('Pizza')],
    })

    await openKnownItem('Mehl, 2 Gerichte')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

describe('KnownItemsArea renaming in the meals', () => {
  it('renames the item in the meals and says in how many', async () => {
    const { renames, announcements } = renderKnownItemsArea(
      [known('Mehl')],
      undefined,
      {},
      2,
    )

    await openKnownItem('Mehl')
    await renameTo('Weizenmehl')

    expect(renames).toEqual([['Mehl', 'Weizenmehl']])
    expect(announcements).toContain(
      'Weizenmehl gespeichert, in 2 Gerichten umbenannt.',
    )
  })

  it('keeps the announcement when no meal changes', async () => {
    const { announcements } = renderKnownItemsArea([known('Mehl')])

    await openKnownItem('Mehl')
    await renameTo('Weizenmehl')

    expect(announcements).toContain('Weizenmehl gespeichert.')
  })

  it('names a created category behind the renamed meals', async () => {
    const { announcements } = renderKnownItemsArea(
      [known('Mehl')],
      catalogOf('Obst'),
      {},
      1,
    )

    await openKnownItem('Mehl')
    await fillCategory('Backen')
    await renameTo('Weizenmehl')

    expect(announcements).toContain(
      'Weizenmehl gespeichert, in 1 Gericht umbenannt. Kategorie Backen neu angelegt, Position 2.',
    )
  })
})
