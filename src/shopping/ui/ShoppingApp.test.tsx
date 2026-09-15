import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryShoppingListClient } from '../api/inMemoryShoppingListClient'
import type { ShoppingItem } from '../domain/shoppingItem'
import { ShoppingApp } from './ShoppingApp'

function openItem(id: string, name: string, createdAt: number): ShoppingItem {
  return { id, name, quantity: null, createdAt, checkedOffAt: null }
}

function renderShoppingApp(initialItems: readonly ShoppingItem[] = []) {
  const client = createInMemoryShoppingListClient(initialItems)
  const announcements: string[] = []
  const rendered = render(
    <ShoppingApp
      createShoppingListClient={() => client}
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

describe('ShoppingApp', () => {
  it('says that the list is empty', () => {
    renderShoppingApp()

    expect(screen.getByText('Die Liste ist leer.')).toBeInTheDocument()
  })

  it('counts the open items in the heading', () => {
    renderShoppingApp([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, 2 offen' }),
    ).toBeInTheDocument()
  })

  it('shows the items in the order they were entered', () => {
    renderShoppingApp([
      openItem('milk', 'Milch', 2),
      openItem('bread', 'Brot', 1),
    ])

    expect(
      screen.getAllByRole('listitem').map((row) => row.textContent),
    ).toEqual(['Brot', 'Milch'])
  })

  it('stores an added item as open and with a creation time', async () => {
    const { client } = renderShoppingApp()

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
    renderShoppingApp()

    await openAddItemPage()
    await addItem('Milch')

    const nameField = screen.getByLabelText('Name')
    expect(nameField).toHaveValue('')
    expect(nameField).toHaveFocus()
  })

  it('stays on the add page so the next item can follow', async () => {
    renderShoppingApp()

    await openAddItemPage()
    await addItem('Milch')
    await addItem('Brot')

    expect(
      screen.getByRole('heading', { name: 'Artikel hinzufügen' }),
    ).toBeInTheDocument()
  })

  it('announces the addition with quantity', async () => {
    const { announcements } = renderShoppingApp()

    await openAddItemPage()
    await addItem('Milch', '2', 'l')

    expect(announcements).toContain('Milch, 2 l hinzugefügt.')
  })

  it('warns when the same name is already open, but adds it anyway', async () => {
    const { announcements, client } = renderShoppingApp([
      openItem('milk', 'Milch', 1),
    ])

    await openAddItemPage()
    await addItem('milch')

    expect(announcements).toContain(
      'milch hinzugefügt. Achtung, Milch steht bereits offen auf der Liste.',
    )
    expect(client.storedItems()).toHaveLength(2)
  })

  it('refuses an item without a name', async () => {
    const { announcements, client } = renderShoppingApp()

    await openAddItemPage()
    await userEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }))

    expect(announcements).toContain('Bitte einen Namen eingeben.')
    expect(client.storedItems()).toHaveLength(0)
  })

  it('goes back to the list', async () => {
    renderShoppingApp()

    await openAddItemPage()
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zur Liste' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, nichts offen' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations on the list', async () => {
    const { rendered } = renderShoppingApp([openItem('bread', 'Brot', 1)])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the add page', async () => {
    const { rendered } = renderShoppingApp()

    await openAddItemPage()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})

describe('the stable list', () => {
  it('does not show an item that arrived from the other device', async () => {
    const { client } = renderShoppingApp([openItem('bread', 'Brot', 1)])

    await act(async () => {
      client.itemsArriveFromElsewhere([openItem('milk', 'Milch', 2)])
    })

    expect(
      screen.getAllByRole('listitem').map((row) => row.textContent),
    ).toEqual(['Brot'])
  })

  it('counts the arrived item on the clean up button', async () => {
    const { client } = renderShoppingApp([openItem('bread', 'Brot', 1)])

    await act(async () => {
      client.itemsArriveFromElsewhere([openItem('milk', 'Milch', 2)])
    })

    expect(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    ).toBeInTheDocument()
  })

  it('hides the clean up button while nothing is pending', () => {
    renderShoppingApp([openItem('bread', 'Brot', 1)])

    expect(screen.queryByRole('button', { name: /Aufräumen/ })).toBeNull()
  })

  it('keeps a checked off item in place with its box ticked', async () => {
    renderShoppingApp([
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
    expect(
      screen.getAllByRole('listitem').map((row) => row.textContent),
    ).toEqual(['Brot', 'Milch', 'Käse'])
  })

  it('leaves the focus on the checkbox that was just ticked', async () => {
    renderShoppingApp([openItem('milk', 'Milch', 2)])

    const box = screen.getByRole('checkbox', { name: 'Milch' })
    await userEvent.click(box)

    expect(box).toHaveFocus()
  })

  it('announces the check off with the remaining open count', async () => {
    const { announcements } = renderShoppingApp([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))

    expect(announcements).toContain('Milch abgehakt, noch 1 offen')
  })

  it('opens a checked off item again', async () => {
    const { announcements } = renderShoppingApp([openItem('milk', 'Milch', 2)])

    const box = screen.getByRole('checkbox', { name: 'Milch' })
    await userEvent.click(box)
    await userEvent.click(box)

    expect(announcements).toContain('Milch wieder offen, 1 offen')
    expect((box as HTMLInputElement).checked).toBe(false)
  })

  it('removes checked off items when cleaning up and moves the focus to the heading', async () => {
    renderShoppingApp([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
    ])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    )

    expect(
      screen.getAllByRole('listitem').map((row) => row.textContent),
    ).toEqual(['Brot'])
    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, 1 offen' }),
    ).toHaveFocus()
  })

  it('takes over the arrived items when cleaning up', async () => {
    const { client, announcements } = renderShoppingApp([
      openItem('bread', 'Brot', 1),
    ])

    await act(async () => {
      client.itemsArriveFromElsewhere([openItem('milk', 'Milch', 2)])
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    )

    expect(
      screen.getAllByRole('listitem').map((row) => row.textContent),
    ).toEqual(['Brot', 'Milch'])
    expect(announcements).toContain('Aufgeräumt, 2 offen')
  })

  it('has no accessibility violations with a checked off item', async () => {
    const { rendered } = renderShoppingApp([openItem('milk', 'Milch', 2)])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
