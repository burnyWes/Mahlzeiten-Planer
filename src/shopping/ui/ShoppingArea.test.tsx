import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Quantity } from '../../shared/domain/quantity'
import { accessibilityViolations } from '../../testSupport/accessibility'
import {
  createInMemoryItemCategoriesClient,
  type InMemoryItemCategoriesClient,
} from '../api/inMemoryItemCategoriesClient'
import { createInMemoryKnownItemsClient } from '../api/inMemoryKnownItemsClient'
import type { KnownItemsClient } from '../api/knownItemsClient'
import { createInMemoryKnownUnitsClient } from '../api/inMemoryKnownUnitsClient'
import type { KnownUnitsClient } from '../api/knownUnitsClient'
import { createInMemoryShoppingListClient } from '../api/inMemoryShoppingListClient'
import type { ShoppingListClient } from '../api/shoppingListClient'
import type { ItemCategoryCatalog } from '../domain/itemCategory'
import { suggestItemCategories } from '../domain/itemCategory'
import { isKnownName, suggestNames, type KnownItem } from '../domain/knownItem'
import {
  DEFAULT_UNITS,
  suggestUnits,
  type KnownUnit,
} from '../domain/knownUnit'
import type { ShoppingItem } from '../domain/shoppingItem'
import { ShoppingArea } from './ShoppingArea'
import { useItemCategories } from './useItemCategories'
import { useKnownItems } from './useKnownItems'
import { useKnownUnits } from './useKnownUnits'
import { useShoppingList } from './useShoppingList'

function openItem(
  id: string,
  name: string,
  createdAt: number,
  quantity: Quantity | null = null,
): ShoppingItem {
  return { id, name, quantity, createdAt, checkedOffAt: null }
}

function checkedOffItem(
  id: string,
  name: string,
  createdAt: number,
  checkedOffAt: number,
  quantity: Quantity | null = null,
): ShoppingItem {
  return { ...openItem(id, name, createdAt, quantity), checkedOffAt }
}

function known(name: string, timesUsed = 1, lastUsedAt = 1): KnownItem {
  return { name, timesUsed, lastUsedAt, categoryId: null }
}

type ShoppingAreaUnderTestProps = {
  client: ShoppingListClient
  knownItemsClient: KnownItemsClient
  knownUnitsClient?: KnownUnitsClient
  itemCategoriesClient?: InMemoryItemCategoriesClient
  announce: (text: string) => void
}

const DEFAULT_KNOWN_UNITS: readonly KnownUnit[] = DEFAULT_UNITS.map((name) => ({
  name,
  lastUsedAt: 0,
  timesUsed: 0,
}))

async function noMealUnits(): Promise<readonly string[]> {
  return []
}

function ShoppingAreaUnderTest({
  client,
  knownItemsClient,
  knownUnitsClient: givenKnownUnitsClient,
  itemCategoriesClient: givenItemCategoriesClient,
  announce,
}: ShoppingAreaUnderTestProps) {
  const [itemCategoriesClient] = useState(
    () => givenItemCategoriesClient ?? createInMemoryItemCategoriesClient(),
  )
  const itemCategories = useItemCategories(itemCategoriesClient)
  const [knownUnitsClient] = useState(
    () =>
      givenKnownUnitsClient ??
      createInMemoryKnownUnitsClient(DEFAULT_KNOWN_UNITS),
  )
  const knownItems = useKnownItems(knownItemsClient)
  const knownUnits = useKnownUnits(knownUnitsClient, noMealUnits)
  const shoppingList = useShoppingList(
    client,
    knownItemsClient,
    knownItems.knownItems,
    knownUnitsClient,
    knownUnits.knownUnits,
    itemCategories.catalog,
    knownItems.loaded && itemCategories.loaded,
  )
  return (
    <ShoppingArea
      shoppingList={shoppingList}
      categoryChoice={{
        isKnownName: (name) => isKnownName(knownItems.knownItems, name),
        suggestCategories: (typed) =>
          suggestItemCategories(itemCategories.catalog, typed),
        planCategoryAssignment: itemCategories.planCategoryAssignment,
        applyCategoryAssignment: itemCategories.applyCategoryAssignment,
      }}
      announce={announce}
      navigation={null}
      suggestNames={(typed) => suggestNames(knownItems.knownItems, typed)}
      suggestUnits={(typed) => suggestUnits(knownUnits.knownUnits, typed)}
    />
  )
}

type LaggingShoppingListClient = ShoppingListClient & {
  deliverSnapshot: () => void
  snapshotArrives: (items: readonly ShoppingItem[]) => void
  storedItems: () => readonly ShoppingItem[]
}

function createLaggingShoppingListClient(
  initialItems: readonly ShoppingItem[] = [],
): LaggingShoppingListClient {
  const client = createInMemoryShoppingListClient(initialItems)
  let latest: readonly ShoppingItem[] = []
  let waitingForSnapshot: ((items: readonly ShoppingItem[]) => void) | null =
    null

  return {
    ...client,
    observeItems(onItems) {
      waitingForSnapshot = onItems
      return client.observeItems((items) => {
        latest = items
      })
    },
    deliverSnapshot() {
      waitingForSnapshot?.(latest)
    },
    snapshotArrives(items) {
      waitingForSnapshot?.(items)
    },
  }
}

function renderWithLaggingSnapshots(
  initialItems: readonly ShoppingItem[] = [],
  announce: (text: string) => void = () => {},
) {
  const client = createLaggingShoppingListClient(initialItems)
  render(
    <ShoppingAreaUnderTest
      client={client}
      knownItemsClient={createInMemoryKnownItemsClient()}
      announce={announce}
    />,
  )
  return client
}

function renderShoppingArea(
  initialItems: readonly ShoppingItem[] = [],
  initialKnownItems: readonly KnownItem[] = [],
) {
  const client = createInMemoryShoppingListClient(initialItems)
  const knownItemsClient = createInMemoryKnownItemsClient(initialKnownItems)
  const announcements: string[] = []
  const rendered = render(
    <ShoppingAreaUnderTest
      client={client}
      knownItemsClient={knownItemsClient}
      announce={(text) => {
        announcements.push(text)
      }}
    />,
  )
  return { client, knownItemsClient, announcements, rendered }
}

async function openAddItemPage() {
  await userEvent.click(
    screen.getByRole('button', { name: 'Artikel hinzufügen' }),
  )
}

async function addItem(name: string, amount = '', unit = '') {
  await userEvent.type(screen.getByLabelText('Name'), name)
  if (amount !== '') {
    await userEvent.type(screen.getByLabelText('Menge'), amount)
  }
  if (unit !== '') {
    await userEvent.type(screen.getByLabelText('Einheit'), unit)
  }
  await userEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }))
  await addWithoutCategoryWhenAsked()
}

async function addWithoutCategoryWhenAsked() {
  const withoutCategory = screen.queryByRole('button', {
    name: 'Ohne Kategorie hinzufügen',
  })
  if (withoutCategory !== null) await userEvent.click(withoutCategory)
}

async function backToList() {
  await userEvent.click(
    screen.getByRole('button', { name: 'Zurück zur Liste' }),
  )
}

function shownItems() {
  return screen
    .getAllByRole('checkbox')
    .map((box) => box.getAttribute('aria-label'))
}

function takeOneLess(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Weniger, ${name}` }),
  )
}

function takeOneMore(name: string) {
  return userEvent.click(screen.getByRole('button', { name: `Mehr, ${name}` }))
}

function confirmRemoval() {
  return userEvent.click(screen.getByRole('button', { name: 'Entfernen' }))
}

function cancelRemoval() {
  return userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
}

describe('ShoppingArea', () => {
  it('says that the list is empty', () => {
    renderShoppingArea()

    expect(screen.getByText('Die Liste ist leer.')).toBeInTheDocument()
  })

  it('counts the open items in the heading', () => {
    renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, 2 offen' }),
    ).toBeInTheDocument()
  })

  it('shows the items in the order they were entered', () => {
    renderShoppingArea([
      openItem('milk', 'Milch', 2),
      openItem('bread', 'Brot', 1),
    ])

    expect(shownItems()).toEqual(['Brot', 'Milch'])
  })

  it('stores an added item as open and with a creation time', async () => {
    const { client } = renderShoppingArea()

    await openAddItemPage()
    await addItem('Milch', '2', 'l')

    expect(client.storedItems()).toHaveLength(1)
    const [stored] = client.storedItems()
    expect(stored.name).toBe('Milch')
    expect(stored.quantity).toEqual({ amount: 2, unit: 'l' })
    expect(stored.checkedOffAt).toBeNull()
    expect(stored.createdAt).toBeGreaterThan(0)
  })

  it('shows one as the placeholder of an empty amount', async () => {
    renderShoppingArea()

    await openAddItemPage()

    expect(screen.getByLabelText('Menge')).toHaveValue('')
    expect(screen.getByLabelText('Menge')).toHaveAttribute('placeholder', '1')
  })

  it('steps an empty amount up with the spin button', async () => {
    const { client } = renderShoppingArea()

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Name'), 'Mehl')
    fireEvent.keyDown(
      screen.getByRole('spinbutton', { name: 'Menge ändern' }),
      { key: 'ArrowUp' },
    )

    expect(screen.getByLabelText('Menge')).toHaveValue('2')

    await userEvent.type(screen.getByLabelText('Einheit'), 'g')
    await userEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }))
    await addWithoutCategoryWhenAsked()

    expect(client.storedItems()[0].quantity).toEqual({ amount: 2, unit: 'g' })
  })

  it('adds a typed item under its groomed name', async () => {
    const { client } = renderShoppingArea([], [known('Hackfleisch')])

    await openAddItemPage()
    await addItem('hackfleisch')
    await backToList()

    expect(shownItems()).toEqual(['Hackfleisch'])
    expect(client.storedItems()[0].name).toBe('Hackfleisch')
  })

  it('clears the name field and keeps the focus there', async () => {
    renderShoppingArea()

    await openAddItemPage()
    await addItem('Milch')

    const nameField = screen.getByLabelText('Name')
    expect(nameField).toHaveValue('')
    expect(nameField).toHaveFocus()
  })

  it('stays on the add page so the next item can follow', async () => {
    renderShoppingArea()

    await openAddItemPage()
    await addItem('Milch')
    await addItem('Brot')

    expect(
      screen.getByRole('heading', { name: 'Artikel hinzufügen' }),
    ).toBeInTheDocument()
  })

  it('announces the addition with quantity', async () => {
    const { announcements } = renderShoppingArea()

    await openAddItemPage()
    await addItem('Milch', '2', 'l')

    expect(announcements).toContain('Milch, 2 l hinzugefügt.')
  })

  it('warns and adds beside the open item when the units differ', async () => {
    const { announcements, client } = renderShoppingArea([
      openItem('milk', 'Milch', 1, { amount: 2, unit: 'l' }),
    ])

    await openAddItemPage()
    await addItem('milch', '500', 'g')
    await backToList()

    expect(announcements).toContain(
      'milch, 500 g hinzugefügt. Achtung, Milch steht bereits offen auf der Liste.',
    )
    expect(client.storedItems()).toHaveLength(2)
    expect(shownItems()).toEqual(['Milch, 2 l', 'milch, 500 g'])
  })

  it('refuses an item without a name', async () => {
    const { announcements, client } = renderShoppingArea()

    await openAddItemPage()
    await userEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }))

    expect(announcements).toContain('Bitte einen Namen eingeben.')
    expect(client.storedItems()).toHaveLength(0)
  })

  it('goes back to the list', async () => {
    renderShoppingArea()

    await openAddItemPage()
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zur Liste' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, nichts offen' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations on the list', async () => {
    const { rendered } = renderShoppingArea([openItem('bread', 'Brot', 1)])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the add page', async () => {
    const { rendered } = renderShoppingArea()

    await openAddItemPage()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

describe('suggestions while typing a name', () => {
  function suggestionList() {
    return screen.queryByRole('list', { name: 'Vorschläge' })
  }

  function suggestedNames() {
    return within(screen.getByRole('list', { name: 'Vorschläge' }))
      .getAllByRole('button')
      .map((button) => button.textContent)
  }

  it('suggests the matching names in the agreed order', async () => {
    renderShoppingArea(
      [],
      [
        known('Hafermilch', 9, 1),
        known('Milchreis', 1, 5),
        known('Milch', 3, 1),
        known('Brot', 7, 1),
      ],
    )

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Name'), 'mil')

    expect(suggestedNames()).toEqual(['Milch', 'Milchreis', 'Hafermilch'])
  })

  it('shows no list below two characters or without a match', async () => {
    renderShoppingArea([], [known('Milch')])

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Name'), 'm')
    expect(suggestionList()).toBeNull()

    await userEvent.type(screen.getByLabelText('Name'), 'x')
    expect(suggestionList()).toBeNull()
  })

  it('takes a suggestion into the name field and moves the focus to the amount', async () => {
    renderShoppingArea([], [known('Milch')])

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Name'), 'mil')
    await userEvent.click(screen.getByRole('button', { name: 'Milch' }))

    expect(screen.getByLabelText('Name')).toHaveValue('Milch')
    expect(screen.getByLabelText('Menge')).toHaveFocus()
    expect(suggestionList()).toBeNull()
  })

  it('counts an added item in the catalog, also when it is merged into an open one', async () => {
    const { knownItemsClient } = renderShoppingArea(
      [openItem('milk', 'Milch', 1)],
      [known('Milch', 1, 1)],
    )

    await openAddItemPage()
    await addItem('milch')
    await addItem('Brot')

    expect(knownItemsClient.storedKnownItems()).toEqual([
      expect.objectContaining({ name: 'Milch', timesUsed: 2 }),
      expect.objectContaining({ name: 'Brot', timesUsed: 1 }),
    ])
  })

  it('keeps the suggestions as they were when the page opened', async () => {
    const { knownItemsClient } = renderShoppingArea([], [known('Milch')])

    await openAddItemPage()
    await act(async () => {
      knownItemsClient.knownItemsArriveFromElsewhere([known('Milchreis')])
    })
    await userEvent.type(screen.getByLabelText('Name'), 'mil')

    expect(suggestedNames()).toEqual(['Milch'])
  })

  it('announces nothing while typing', async () => {
    const { announcements } = renderShoppingArea([], [known('Milch')])

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Name'), 'mil')

    expect(announcements).toEqual([])
  })

  it('has no accessibility violations with suggestions shown', async () => {
    const { rendered } = renderShoppingArea([], [known('Milch')])

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Name'), 'mil')

    expect(suggestionList()).not.toBeNull()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

describe('suggestions while typing a unit', () => {
  function unitSuggestionList() {
    return screen.queryByRole('list', { name: 'Einheiten-Vorschläge' })
  }

  function suggestedUnits() {
    return within(screen.getByRole('list', { name: 'Einheiten-Vorschläge' }))
      .getAllByRole('button')
      .map((button) => button.textContent)
  }

  it('suggests units from the first typed character', async () => {
    renderShoppingArea()

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Einheit'), 'k')

    expect(suggestedUnits()).toEqual(['kg', 'Pck.', 'Stück'])
  })

  it('takes over a suggested unit and moves on to the add button', async () => {
    renderShoppingArea()

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Einheit'), 'k')
    await userEvent.click(screen.getByRole('button', { name: 'kg' }))

    expect(screen.getByLabelText('Einheit')).toHaveValue('kg')
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toHaveFocus()
  })

  it('offers no unit list without a typed unit', async () => {
    renderShoppingArea()

    await openAddItemPage()

    expect(unitSuggestionList()).toBeNull()
  })

  it('keeps the name suggestions apart from the unit suggestions', async () => {
    renderShoppingArea([], [known('Milch')])

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Name'), 'mil')
    await userEvent.type(screen.getByLabelText('Einheit'), 'k')

    expect(
      within(screen.getByRole('list', { name: 'Vorschläge' }))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Milch'])
    expect(suggestedUnits()).toEqual(['kg', 'Pck.', 'Stück'])
  })

  it('has no accessibility violations with unit suggestions', async () => {
    const { rendered } = renderShoppingArea()

    await openAddItemPage()
    await userEvent.type(screen.getByLabelText('Einheit'), 'k')

    expect(unitSuggestionList()).not.toBeNull()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

describe('adding what is already open', () => {
  it('counts a second item of the same name instead of listing it twice', async () => {
    const { announcements, client } = renderShoppingArea()

    await openAddItemPage()
    await addItem('Milch')
    await addItem('Milch')
    await backToList()

    expect(client.storedItems()).toHaveLength(1)
    expect(shownItems()).toEqual(['Milch, 2'])
    expect(announcements).toContain(
      'Milch hinzugefügt. Stand bereits offen, jetzt 2.',
    )
  })

  it('adds up two amounts of the same unit', async () => {
    const { announcements } = renderShoppingArea([
      openItem('milk', 'Milch', 1, { amount: 2, unit: 'l' }),
    ])

    await openAddItemPage()
    await addItem('Milch', '1', 'l')
    await backToList()

    expect(shownItems()).toEqual(['Milch, 3 l'])
    expect(announcements).toContain(
      'Milch, 1 l hinzugefügt. Stand bereits offen, jetzt 3 l.',
    )
  })

  it('leaves the merged entry where it stood', async () => {
    renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2, { amount: 2, unit: 'l' }),
      openItem('cheese', 'Käse', 3),
    ])

    await openAddItemPage()
    await addItem('Milch', '1', 'l')
    await backToList()

    expect(shownItems()).toEqual(['Brot', 'Milch, 3 l', 'Käse'])
  })

  it('shows an item that arrived from the other device once it is merged into', async () => {
    const { client } = renderShoppingArea([openItem('bread', 'Brot', 1)])

    await act(async () => {
      client.itemsArriveFromElsewhere([
        openItem('milk', 'Milch', 2, { amount: 2, unit: 'l' }),
      ])
    })
    await openAddItemPage()
    await addItem('Milch', '1', 'l')
    await backToList()

    expect(shownItems()).toEqual(['Brot', 'Milch, 3 l'])
  })
})

describe('adding before the snapshot has caught up', () => {
  it('counts a second item of the same name into the first', async () => {
    const client = renderWithLaggingSnapshots()

    await openAddItemPage()
    await addItem('Milch', '2', 'l')
    await addItem('Milch', '1', 'l')

    expect(client.storedItems()).toHaveLength(1)
    expect(client.storedItems()[0].quantity).toEqual({ amount: 3, unit: 'l' })
  })

  it('adds up three items of the same name', async () => {
    const client = renderWithLaggingSnapshots()

    await openAddItemPage()
    await addItem('Milch', '1', 'l')
    await addItem('Milch', '1', 'l')
    await addItem('Milch', '1', 'l')

    expect(client.storedItems()).toHaveLength(1)
    expect(client.storedItems()[0].quantity).toEqual({ amount: 3, unit: 'l' })
  })

  it('shows the merged entry once the snapshot arrives', async () => {
    const client = renderWithLaggingSnapshots()

    await openAddItemPage()
    await addItem('Milch', '2', 'l')
    await addItem('Milch', '1', 'l')
    await backToList()
    await act(async () => {
      client.deliverSnapshot()
    })

    expect(shownItems()).toEqual(['Milch, 3 l'])
  })
})

describe('toggling before the snapshot has caught up', () => {
  function checkbox(name: string) {
    return screen.getByRole('checkbox', { name }) as HTMLInputElement
  }

  async function withList(initialItems: readonly ShoppingItem[]) {
    const client = renderWithLaggingSnapshots(initialItems)
    await act(async () => {
      client.deliverSnapshot()
    })
    return client
  }

  it('checks the item off on the first click', async () => {
    await withList([openItem('milk', 'Milch', 1)])

    await userEvent.click(checkbox('Milch'))

    expect(checkbox('Milch').checked).toBe(true)
  })

  it('lets go of a row the other device removed during an own write', async () => {
    const client = await withList([openItem('milk', 'Milch', 1)])

    await userEvent.click(checkbox('Milch'))
    await userEvent.click(checkbox('Milch'))
    await act(async () => {
      client.snapshotArrives([])
    })

    expect(screen.queryAllByRole('checkbox')).toEqual([])
  })

  it('shows an added item in the list right away', async () => {
    renderWithLaggingSnapshots()

    await openAddItemPage()
    await addItem('Milch', '2', 'l')
    await backToList()

    expect(shownItems()).toEqual(['Milch, 2 l'])
  })

  it('counts the own write in the heading and on the clean up button', async () => {
    await withList([openItem('bread', 'Brot', 1), openItem('milk', 'Milch', 2)])

    await userEvent.click(checkbox('Milch'))

    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, 1 offen' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    ).toBeInTheDocument()
  })

  it('returns to the starting state when toggled twice', async () => {
    const client = await withList([openItem('milk', 'Milch', 1)])

    await userEvent.click(checkbox('Milch'))
    await userEvent.click(checkbox('Milch'))
    expect(checkbox('Milch').checked).toBe(false)

    await act(async () => {
      client.deliverSnapshot()
    })

    expect(checkbox('Milch').checked).toBe(false)
    expect(screen.queryByRole('button', { name: /Aufräumen/ })).toBeNull()
  })

  it('takes over a check off from the other device', async () => {
    const client = await withList([openItem('milk', 'Milch', 1)])

    await userEvent.click(checkbox('Milch'))
    await act(async () => {
      client.snapshotArrives([checkedOffItem('milk', 'Milch', 1, 900)])
    })
    await userEvent.click(checkbox('Milch'))
    expect(checkbox('Milch').checked).toBe(false)

    await act(async () => {
      client.snapshotArrives([checkedOffItem('milk', 'Milch', 1, 1200)])
    })

    expect(checkbox('Milch').checked).toBe(true)
  })

  it('takes over a quantity from the other device', async () => {
    const client = await withList([
      openItem('milk', 'Milch', 1, { amount: 2, unit: 'l' }),
    ])

    await openAddItemPage()
    await addItem('Milch', '1', 'l')
    await backToList()
    expect(shownItems()).toEqual(['Milch, 3 l'])

    await act(async () => {
      client.snapshotArrives([
        openItem('milk', 'Milch', 1, { amount: 5, unit: 'l' }),
      ])
    })

    expect(shownItems()).toEqual(['Milch, 5 l'])
  })

  it('counts a cleaned up item again when the other device overtakes it', async () => {
    const client = await withList([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2, { amount: 2, unit: 'l' }),
    ])

    await userEvent.click(checkbox('Milch, 2 l'))
    await userEvent.click(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    )
    expect(shownItems()).toEqual(['Brot'])

    await act(async () => {
      client.snapshotArrives([
        openItem('bread', 'Brot', 1),
        openItem('milk', 'Milch', 2, { amount: 5, unit: 'l' }),
      ])
    })

    expect(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    ).toBeInTheDocument()
  })
})

describe('the stable list', () => {
  it('does not show an item that arrived from the other device', async () => {
    const { client } = renderShoppingArea([openItem('bread', 'Brot', 1)])

    await act(async () => {
      client.itemsArriveFromElsewhere([openItem('milk', 'Milch', 2)])
    })

    expect(shownItems()).toEqual(['Brot'])
  })

  it('counts the arrived item on the clean up button', async () => {
    const { client } = renderShoppingArea([openItem('bread', 'Brot', 1)])

    await act(async () => {
      client.itemsArriveFromElsewhere([openItem('milk', 'Milch', 2)])
    })

    expect(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    ).toBeInTheDocument()
  })

  it('hides the clean up button while nothing is pending', () => {
    renderShoppingArea([openItem('bread', 'Brot', 1)])

    expect(screen.queryByRole('button', { name: /Aufräumen/ })).toBeNull()
  })

  it('keeps a checked off item in place with its box ticked', async () => {
    renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
      openItem('cheese', 'Käse', 3),
    ])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))

    const rows = screen.getAllByRole('checkbox')
    expect(rows.map((box) => (box as HTMLInputElement).checked)).toEqual([
      false,
      true,
      false,
    ])
    expect(shownItems()).toEqual(['Brot', 'Milch', 'Käse'])
  })

  it('leaves the focus on the checkbox that was just ticked', async () => {
    renderShoppingArea([openItem('milk', 'Milch', 2)])

    const box = screen.getByRole('checkbox', { name: 'Milch' })
    await userEvent.click(box)

    expect(box).toHaveFocus()
  })

  it('announces the check off with the remaining open count', async () => {
    const { announcements } = renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))

    expect(announcements).toContain('Milch abgehakt, noch 1 offen')
  })

  it('opens a checked off item again', async () => {
    const { announcements } = renderShoppingArea([openItem('milk', 'Milch', 2)])

    const box = screen.getByRole('checkbox', { name: 'Milch' })
    await userEvent.click(box)
    await userEvent.click(box)

    expect(announcements).toContain('Milch wieder offen, 1 offen')
    expect((box as HTMLInputElement).checked).toBe(false)
  })

  it('removes checked off items when cleaning up and moves the focus to the heading', async () => {
    renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    )

    expect(shownItems()).toEqual(['Brot'])
    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, 1 offen' }),
    ).toHaveFocus()
  })

  it('takes over the arrived items when cleaning up', async () => {
    const { client, announcements } = renderShoppingArea([
      openItem('bread', 'Brot', 1),
    ])

    await act(async () => {
      client.itemsArriveFromElsewhere([openItem('milk', 'Milch', 2)])
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    )

    expect(shownItems()).toEqual(['Brot', 'Milch'])
    expect(announcements).toContain('Aufgeräumt, 2 offen')
  })

  it('has no accessibility violations with a checked off item', async () => {
    const { rendered } = renderShoppingArea([openItem('milk', 'Milch', 2)])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

describe('changing the quantity at the row', () => {
  it('counts an item without quantity up to two', async () => {
    const { client, announcements } = renderShoppingArea([
      openItem('bread', 'Brot', 1),
    ])

    await takeOneMore('Brot')

    expect(client.storedItems()[0].quantity).toEqual({ amount: 2, unit: null })
    expect(announcements).toContain('Brot, 2.')
    expect(shownItems()).toEqual(['Brot, 2'])
  })

  it('counts an amount with unit up and down', async () => {
    const { client, announcements } = renderShoppingArea([
      openItem('flour', 'Mehl', 1, { amount: 500, unit: 'g' }),
    ])

    await takeOneMore('Mehl')
    expect(client.storedItems()[0].quantity).toEqual({ amount: 501, unit: 'g' })

    await takeOneLess('Mehl')
    expect(client.storedItems()[0].quantity).toEqual({ amount: 500, unit: 'g' })
    expect(announcements).toEqual(['Mehl, 501 g.', 'Mehl, 500 g.'])
  })

  it('rounds the amount after a step', async () => {
    const { client } = renderShoppingArea([
      openItem('milk', 'Milch', 1, { amount: 2.2, unit: 'l' }),
    ])

    await takeOneLess('Milch')

    expect(client.storedItems()[0].quantity).toEqual({ amount: 1.2, unit: 'l' })
  })

  it('shows one in the middle of an item without quantity', () => {
    renderShoppingArea([openItem('bread', 'Brot', 1)])

    const row = screen.getByRole('listitem')
    expect(row.querySelector('.stepperAmount')?.textContent).toBe('1')
    expect(screen.getByRole('checkbox', { name: 'Brot' })).toBeInTheDocument()
  })

  it('names the checkbox with its quantity', () => {
    renderShoppingArea([
      openItem('flour', 'Mehl', 1, { amount: 500, unit: 'g' }),
    ])

    expect(
      screen.getByRole('checkbox', { name: 'Mehl, 500 g' }),
    ).toBeInTheDocument()
  })

  it('offers no more at the upper bound', () => {
    renderShoppingArea([
      openItem('flour', 'Mehl', 1, { amount: 9999, unit: 'g' }),
    ])

    expect(screen.getByRole('button', { name: 'Mehr, Mehl' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Weniger, Mehl' })).toBeEnabled()
  })

  it('offers no stepper on a checked off item', async () => {
    renderShoppingArea([openItem('milk', 'Milch', 1)])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))

    expect(screen.queryByRole('button', { name: 'Weniger, Milch' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Mehr, Milch' })).toBeNull()
  })

  it('keeps the stepped quantity while the snapshot lags behind', async () => {
    const lagging = openItem('milk', 'Milch', 1, { amount: 2, unit: 'l' })
    const client = renderWithLaggingSnapshots([lagging])
    await act(async () => {
      client.deliverSnapshot()
    })

    await takeOneMore('Milch')
    await act(async () => {
      client.snapshotArrives([lagging])
    })

    expect(shownItems()).toEqual(['Milch, 3 l'])
  })

  it('removes an item when its last unit is taken', async () => {
    const { client, announcements } = renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2, { amount: 2, unit: null }),
    ])

    await takeOneLess('Brot')
    await confirmRemoval()

    expect(client.storedItems().map((stored) => stored.name)).toEqual(['Milch'])
    expect(announcements).toContain('Brot entfernt, noch 1 offen.')
    expect(shownItems()).toEqual(['Milch, 2'])
  })

  it('removes an item with a fraction below one', async () => {
    const { client } = renderShoppingArea([
      openItem('milk', 'Milch', 1, { amount: 0.5, unit: 'l' }),
    ])

    await takeOneLess('Milch')
    await confirmRemoval()

    expect(client.storedItems()).toEqual([])
  })

  it('says that nothing is open any more', async () => {
    const { announcements } = renderShoppingArea([openItem('bread', 'Brot', 1)])

    await takeOneLess('Brot')
    await confirmRemoval()

    expect(announcements).toContain('Brot entfernt, nichts mehr offen.')
    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, nichts offen' }),
    ).toBeInTheDocument()
  })

  it('leaves the focus on the checkbox that follows the removed row', async () => {
    renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    await takeOneLess('Brot')
    await confirmRemoval()

    expect(screen.getByRole('checkbox', { name: 'Milch' })).toHaveFocus()
  })

  it('leaves the focus on the checkbox before the removed last row', async () => {
    renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    await takeOneLess('Milch')
    await confirmRemoval()

    expect(screen.getByRole('checkbox', { name: 'Brot' })).toHaveFocus()
  })

  it('leaves the focus on the heading when the only item is removed', async () => {
    renderShoppingArea([openItem('bread', 'Brot', 1)])

    await takeOneLess('Brot')
    await confirmRemoval()

    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, nichts offen' }),
    ).toHaveFocus()
  })

  it('does not count a removed item as a change to clean up', async () => {
    renderShoppingArea([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    await takeOneLess('Brot')
    await confirmRemoval()

    expect(screen.queryByRole('button', { name: /Aufräumen/ })).toBeNull()
  })

  it('keeps a removed item away while the snapshot still carries it', async () => {
    const bread = openItem('bread', 'Brot', 1)
    const milk = openItem('milk', 'Milch', 2)
    const client = renderWithLaggingSnapshots([bread, milk])
    await act(async () => {
      client.deliverSnapshot()
    })

    await takeOneLess('Brot')
    await confirmRemoval()
    await act(async () => {
      client.snapshotArrives([bread, milk])
    })

    expect(shownItems()).toEqual(['Milch'])
  })

  it('keeps a removed item away after its quantity was changed', async () => {
    const client = renderWithLaggingSnapshots([
      openItem('milk', 'Milch', 1, { amount: 2, unit: null }),
    ])
    await act(async () => {
      client.deliverSnapshot()
    })

    await takeOneLess('Milch')
    await takeOneLess('Milch')
    await confirmRemoval()
    await act(async () => {
      client.deliverSnapshot()
    })

    expect(screen.queryAllByRole('checkbox')).toEqual([])
  })

  it('has no accessibility violations with a stepper', async () => {
    const { rendered } = renderShoppingArea([
      openItem('flour', 'Mehl', 1, { amount: 500, unit: 'g' }),
      openItem('bread', 'Brot', 2),
    ])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

describe('asking before removing from the list', () => {
  it('asks before removing an item with its last unit', async () => {
    const { client, announcements } = renderShoppingArea([
      openItem('bread', 'Brot', 1),
    ])

    await takeOneLess('Brot')

    expect(
      screen.getByRole('heading', { name: 'Brot entfernen?' }),
    ).toHaveFocus()
    expect(
      screen.getByText(
        'Der Artikel wird für beide Geräte von der Einkaufsliste entfernt.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Zurück zur Einkaufsliste' }),
    ).toBeInTheDocument()
    expect(client.storedItems().map((stored) => stored.name)).toEqual(['Brot'])
    expect(announcements).toEqual([])
  })

  it('asks before removing an item without quantity', async () => {
    renderShoppingArea([openItem('bread', 'Brot', 1)])

    await takeOneLess('Brot')

    expect(
      screen.getByRole('heading', { name: 'Brot entfernen?' }),
    ).toBeInTheDocument()
  })

  it('asks before removing an item with a fraction below one', async () => {
    renderShoppingArea([
      openItem('milk', 'Milch', 1, { amount: 0.5, unit: 'l' }),
    ])

    await takeOneLess('Milch')

    expect(
      screen.getByRole('heading', { name: 'Milch entfernen?' }),
    ).toBeInTheDocument()
  })

  it('takes one less without asking above one', async () => {
    renderShoppingArea([
      openItem('milk', 'Milch', 1, { amount: 2, unit: null }),
    ])

    await takeOneLess('Milch')

    expect(
      screen.queryByRole('heading', { name: 'Milch entfernen?' }),
    ).toBeNull()
    expect(shownItems()).toEqual(['Milch, 1'])
  })

  it('keeps the item when the removal is cancelled', async () => {
    const bread = openItem('bread', 'Brot', 1)
    const { client, announcements } = renderShoppingArea([bread])

    await takeOneLess('Brot')
    await cancelRemoval()

    expect(client.storedItems()).toEqual([bread])
    expect(announcements).toEqual([])
    expect(screen.getByRole('button', { name: 'Weniger, Brot' })).toHaveFocus()
  })

  it('keeps the item when going back from the removal', async () => {
    const bread = openItem('bread', 'Brot', 1)
    const { client, announcements } = renderShoppingArea([bread])

    await takeOneLess('Brot')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zur Einkaufsliste' }),
    )

    expect(client.storedItems()).toEqual([bread])
    expect(announcements).toEqual([])
    expect(screen.getByRole('button', { name: 'Weniger, Brot' })).toHaveFocus()
  })

  it('removes the whole item even if its quantity rose meanwhile', async () => {
    const bread = openItem('bread', 'Brot', 1)
    const client = renderWithLaggingSnapshots([bread])
    await act(async () => {
      client.deliverSnapshot()
    })

    await takeOneLess('Brot')
    await act(async () => {
      client.snapshotArrives([
        { ...bread, quantity: { amount: 3, unit: null } },
      ])
    })
    await confirmRemoval()

    expect(client.storedItems()).toEqual([])
  })

  it('returns to the list when the item to remove is gone', async () => {
    const announcements: string[] = []
    const bread = openItem('bread', 'Brot', 1)
    const milk = openItem('milk', 'Milch', 2)
    const client = renderWithLaggingSnapshots([bread, milk], (text) => {
      announcements.push(text)
    })
    await act(async () => {
      client.deliverSnapshot()
    })

    await takeOneLess('Brot')
    await act(async () => {
      client.snapshotArrives([milk])
    })

    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, 1 offen' }),
    ).toHaveFocus()
    expect(announcements).toEqual([])
  })

  it('has no accessibility violations on the removal page', async () => {
    const { rendered } = renderShoppingArea([openItem('bread', 'Brot', 1)])

    await takeOneLess('Brot')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

function knownIn(name: string, categoryId: string | null): KnownItem {
  return { name, timesUsed: 1, lastUsedAt: 1, categoryId }
}

const SHOP_CATALOG: ItemCategoryCatalog = {
  categories: [
    { id: 'fruit', name: 'Obst/Gemüse' },
    { id: 'frozen', name: 'Tiefkühlkost' },
  ],
  sortByCategory: true,
}

const SHOP_KNOWN_ITEMS = [
  knownIn('Äpfel', 'fruit'),
  knownIn('Bananen', 'fruit'),
  knownIn('Pizza', 'frozen'),
  knownIn('Batterien', null),
]

function renderCategorizedList(
  initialItems: readonly ShoppingItem[],
  catalog: ItemCategoryCatalog = SHOP_CATALOG,
  initialKnownItems: readonly KnownItem[] = SHOP_KNOWN_ITEMS,
) {
  const client = createInMemoryShoppingListClient(initialItems)
  const knownItemsClient = createInMemoryKnownItemsClient(initialKnownItems)
  const itemCategoriesClient = createInMemoryItemCategoriesClient(catalog)
  const announcements: string[] = []
  const rendered = render(
    <ShoppingAreaUnderTest
      client={client}
      knownItemsClient={knownItemsClient}
      itemCategoriesClient={itemCategoriesClient}
      announce={(text) => {
        announcements.push(text)
      }}
    />,
  )
  return {
    client,
    knownItemsClient,
    itemCategoriesClient,
    announcements,
    rendered,
  }
}

function shownSections() {
  const main = screen.getByRole('main')
  const headings = within(main)
    .queryAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)
  const lists = within(main)
    .getAllByRole('list')
    .map((list) =>
      within(list)
        .getAllByRole('checkbox')
        .map((box) => box.getAttribute('aria-label')),
    )
  return { headings, lists }
}

const apples = openItem('apples', 'Äpfel', 1)
const pizza = openItem('pizza', 'Pizza', 2)
const batteries = openItem('batteries', 'Batterien', 3)
const bananas = openItem('bananas', 'Bananen', 4)

function cleanUpButton() {
  return screen.queryByRole('button', { name: /^Aufräumen/ })
}

describe('the list sorted by categories', () => {
  it('groups the items under headings in the order of the categories', () => {
    renderCategorizedList([batteries, pizza, bananas, apples])

    expect(shownSections()).toEqual({
      headings: ['Obst/Gemüse', 'Tiefkühlkost', 'Ohne Kategorie'],
      lists: [['Äpfel', 'Bananen'], ['Pizza'], ['Batterien']],
    })
    expect(cleanUpButton()).toBeNull()
  })

  it('shows no heading when no item has a category', () => {
    renderCategorizedList([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    expect(shownSections()).toEqual({
      headings: [],
      lists: [['Brot', 'Milch']],
    })
  })

  it('looks as before while the sorting is switched off', () => {
    renderCategorizedList([batteries, pizza, bananas, apples], {
      ...SHOP_CATALOG,
      sortByCategory: false,
    })

    expect(shownSections()).toEqual({
      headings: [],
      lists: [['Äpfel', 'Pizza', 'Batterien', 'Bananen']],
    })
  })

  it('puts an item added here at the end of its group at once', async () => {
    renderCategorizedList([apples, pizza, batteries])

    await openAddItemPage()
    await addItem('Bananen')
    await backToList()

    expect(shownSections().lists).toEqual([
      ['Äpfel', 'Bananen'],
      ['Pizza'],
      ['Batterien'],
    ])
    expect(cleanUpButton()).toBeNull()
  })

  it('opens the group of an added item at its place', async () => {
    renderCategorizedList([pizza, batteries])

    await openAddItemPage()
    await addItem('Äpfel')
    await backToList()

    expect(shownSections()).toEqual({
      headings: ['Obst/Gemüse', 'Tiefkühlkost', 'Ohne Kategorie'],
      lists: [['Äpfel'], ['Pizza'], ['Batterien']],
    })
  })

  it('keeps a category changed elsewhere in place until cleaning up', async () => {
    const { knownItemsClient } = renderCategorizedList([apples, pizza])

    await act(async () => {
      knownItemsClient.recordUse('Pizza', 9, 'fruit')
    })

    expect(shownSections().lists).toEqual([['Äpfel'], ['Pizza']])
    expect(cleanUpButton()).toHaveTextContent('Aufräumen, 1 Änderung')

    await userEvent.click(cleanUpButton()!)

    expect(shownSections()).toEqual({
      headings: ['Obst/Gemüse'],
      lists: [['Äpfel', 'Pizza']],
    })
  })

  it('keeps a changed order of the categories in place until cleaning up', async () => {
    const { itemCategoriesClient } = renderCategorizedList([apples, pizza])

    await act(async () => {
      itemCategoriesClient.catalogArrivesFromElsewhere({
        ...SHOP_CATALOG,
        categories: [...SHOP_CATALOG.categories].reverse(),
      })
    })

    expect(shownSections().headings).toEqual(['Obst/Gemüse', 'Tiefkühlkost'])
    expect(cleanUpButton()).toHaveTextContent('Aufräumen, 2 Änderungen')

    await userEvent.click(cleanUpButton()!)

    expect(shownSections().headings).toEqual(['Tiefkühlkost', 'Obst/Gemüse'])
  })

  it('applies the switch at once and keeps the checked off items', async () => {
    const { itemCategoriesClient } = renderCategorizedList([
      apples,
      pizza,
      bananas,
    ])
    await userEvent.click(screen.getByRole('checkbox', { name: 'Pizza' }))

    await act(async () => {
      itemCategoriesClient.catalogArrivesFromElsewhere({
        ...SHOP_CATALOG,
        sortByCategory: false,
      })
    })

    expect(shownSections()).toEqual({
      headings: [],
      lists: [['Äpfel', 'Pizza', 'Bananen']],
    })

    await act(async () => {
      itemCategoriesClient.catalogArrivesFromElsewhere(SHOP_CATALOG)
    })

    expect(shownSections().lists).toEqual([['Äpfel', 'Bananen'], ['Pizza']])
  })

  it('keeps a group whose items are all checked off', async () => {
    renderCategorizedList([apples, pizza])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Pizza' }))

    expect(shownSections().headings).toEqual(['Obst/Gemüse', 'Tiefkühlkost'])
  })

  it('moves the focus across a group boundary after removing', async () => {
    renderCategorizedList([apples, pizza])

    await takeOneLess('Äpfel')
    await confirmRemoval()

    expect(screen.getByRole('checkbox', { name: 'Pizza' })).toHaveFocus()
  })

  it('waits for the categories before freezing the list', async () => {
    const itemCategoriesClient =
      createInMemoryItemCategoriesClient(SHOP_CATALOG)
    let deliverCatalog: () => void = () => {}
    const laggingCategories: InMemoryItemCategoriesClient = {
      ...itemCategoriesClient,
      observeCatalog(onCatalog) {
        deliverCatalog = () => onCatalog(itemCategoriesClient.storedCatalog())
        return () => {}
      },
    }
    render(
      <ShoppingAreaUnderTest
        client={createInMemoryShoppingListClient([batteries, pizza, apples])}
        knownItemsClient={createInMemoryKnownItemsClient(SHOP_KNOWN_ITEMS)}
        itemCategoriesClient={laggingCategories}
        announce={() => {}}
      />,
    )

    await act(async () => {
      deliverCatalog()
    })

    expect(shownSections().lists).toEqual([['Äpfel'], ['Pizza'], ['Batterien']])
    expect(cleanUpButton()).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { rendered } = renderCategorizedList([apples, pizza, batteries])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

async function typeNewItem(name: string) {
  await openAddItemPage()
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.type(screen.getByLabelText('Menge'), '3')
  await userEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }))
}

async function chooseCategory(text: string) {
  if (text !== '')
    await userEvent.type(screen.getByLabelText('Kategorie'), text)
  await userEvent.click(
    screen.getByRole('button', { name: 'Mit Kategorie hinzufügen' }),
  )
}

describe('asking for the category of a new item', () => {
  it('asks before writing anything', async () => {
    const { client } = renderCategorizedList([])

    await typeNewItem('Kirschen')

    expect(
      screen.getByRole('heading', { name: 'Kategorie für Kirschen' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Kirschen ist neu. In welche Kategorie?'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Kategorie')).toHaveFocus()
    expect(client.storedItems()).toEqual([])
  })

  it('does not ask for a known item, even without a category', async () => {
    const { client } = renderCategorizedList([])

    await typeNewItem('batterien')

    expect(client.storedItems().map((stored) => stored.name)).toEqual([
      'Batterien',
    ])
    expect(screen.getByRole('heading', { name: 'Artikel hinzufügen' }))
  })

  it('reports an empty name without asking', async () => {
    const { announcements } = renderCategorizedList([])

    await openAddItemPage()
    await userEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }))

    expect(announcements).toContain('Bitte einen Namen eingeben.')
    expect(
      screen.queryByRole('button', { name: 'Mit Kategorie hinzufügen' }),
    ).toBeNull()
  })

  it('adds the item into a known category and returns to an empty form', async () => {
    const { client, knownItemsClient, announcements } = renderCategorizedList([
      apples,
      pizza,
    ])

    await typeNewItem('Kirschen')
    await chooseCategory('obst/gemüse')

    expect(announcements).toContain(
      'Kirschen, 3 hinzugefügt. Kategorie Obst/Gemüse.',
    )
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(client.storedItems().map((stored) => stored.name)).toContain(
      'Kirschen',
    )
    expect(
      knownItemsClient
        .storedKnownItems()
        .find((knownItem) => knownItem.name === 'Kirschen')?.categoryId,
    ).toBe('fruit')

    await backToList()

    expect(shownSections().lists).toEqual([['Äpfel', 'Kirschen, 3'], ['Pizza']])
    expect(cleanUpButton()).toBeNull()
  })

  it('creates a typed category at the end of the order', async () => {
    const { itemCategoriesClient, announcements } = renderCategorizedList([
      apples,
      batteries,
    ])

    await typeNewItem('Seife')
    await chooseCategory('Drogerie')

    expect(
      itemCategoriesClient.storedCatalog().categories.map(({ name }) => name),
    ).toEqual(['Obst/Gemüse', 'Tiefkühlkost', 'Drogerie'])
    expect(announcements).toContain(
      'Seife, 3 hinzugefügt. Kategorie Drogerie neu angelegt, Position 3.',
    )

    await backToList()

    expect(shownSections()).toEqual({
      headings: ['Obst/Gemüse', 'Drogerie', 'Ohne Kategorie'],
      lists: [['Äpfel'], ['Seife, 3'], ['Batterien']],
    })
  })

  it('adds the item without a category', async () => {
    const { client, knownItemsClient, announcements } = renderCategorizedList(
      [],
    )

    await typeNewItem('Seife')
    await userEvent.click(
      screen.getByRole('button', { name: 'Ohne Kategorie hinzufügen' }),
    )

    expect(client.storedItems().map((stored) => stored.name)).toEqual(['Seife'])
    expect(
      knownItemsClient
        .storedKnownItems()
        .find((knownItem) => knownItem.name === 'Seife')?.categoryId,
    ).toBeNull()
    expect(announcements).toContain('Seife, 3 hinzugefügt.')
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('leads back to the filled form without writing', async () => {
    const { client, itemCategoriesClient } = renderCategorizedList([])

    await typeNewItem('Seife')
    await userEvent.type(screen.getByLabelText('Kategorie'), 'Drogerie')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zum Artikel' }),
    )

    expect(screen.getByLabelText('Name')).toHaveValue('Seife')
    expect(screen.getByLabelText('Menge')).toHaveValue('3')
    expect(client.storedItems()).toEqual([])
    expect(itemCategoriesClient.storedCatalog()).toEqual(SHOP_CATALOG)
  })

  it('asks for a category when the field is empty', async () => {
    const { client, announcements } = renderCategorizedList([])

    await typeNewItem('Seife')
    await chooseCategory('')

    const message =
      'Bitte eine Kategorie eingeben oder ohne Kategorie hinzufügen.'
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(announcements).toContain(message)
    expect(client.storedItems()).toEqual([])
  })

  it('asks also while the sorting is switched off', async () => {
    renderCategorizedList([], { ...SHOP_CATALOG, sortByCategory: false })

    await typeNewItem('Seife')

    expect(
      screen.getByRole('heading', { name: 'Kategorie für Seife' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { rendered } = renderCategorizedList([])

    await typeNewItem('Kirschen')
    await userEvent.type(screen.getByLabelText('Kategorie'), 'o')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
