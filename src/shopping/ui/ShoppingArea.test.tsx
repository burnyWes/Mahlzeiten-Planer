import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Quantity } from '../../shared/domain/quantity'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryShoppingListClient } from '../api/inMemoryShoppingListClient'
import type { ShoppingListClient } from '../api/shoppingListClient'
import type { ShoppingItem } from '../domain/shoppingItem'
import { ShoppingArea } from './ShoppingArea'
import { useShoppingList } from './useShoppingList'

function openItem(
  id: string,
  name: string,
  createdAt: number,
  quantity: Quantity | null = null,
): ShoppingItem {
  return { id, name, quantity, createdAt, checkedOffAt: null }
}

type ShoppingAreaUnderTestProps = {
  client: ShoppingListClient
  announce: (text: string) => void
}

function ShoppingAreaUnderTest({
  client,
  announce,
}: ShoppingAreaUnderTestProps) {
  const shoppingList = useShoppingList(client)
  return (
    <ShoppingArea
      shoppingList={shoppingList}
      announce={announce}
      navigation={null}
    />
  )
}

type LaggingShoppingListClient = ShoppingListClient & {
  deliverSnapshot: () => void
  storedItems: () => readonly ShoppingItem[]
}

function createLaggingShoppingListClient(): LaggingShoppingListClient {
  const client = createInMemoryShoppingListClient()
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
  }
}

function renderShoppingArea(initialItems: readonly ShoppingItem[] = []) {
  const client = createInMemoryShoppingListClient(initialItems)
  const announcements: string[] = []
  const rendered = render(
    <ShoppingAreaUnderTest
      client={client}
      announce={(text) => {
        announcements.push(text)
      }}
    />,
  )
  return { client, announcements, rendered }
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
}

async function backToList() {
  await userEvent.click(
    screen.getByRole('button', { name: 'Zurück zur Liste' }),
  )
}

function shownItems() {
  return screen.getAllByRole('listitem').map((row) => row.textContent)
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
  function renderWithLaggingSnapshots() {
    const client = createLaggingShoppingListClient()
    render(<ShoppingAreaUnderTest client={client} announce={() => {}} />)
    return client
  }

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
