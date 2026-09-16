import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createInMemoryMealsClient } from './meals/api/inMemoryMealsClient'
import type { Meal } from './meals/domain/meal'
import { SignedInApp } from './SignedInApp'
import { createInMemoryKnownItemsClient } from './shopping/api/inMemoryKnownItemsClient'
import { createInMemoryShoppingListClient } from './shopping/api/inMemoryShoppingListClient'
import type { ShoppingItem } from './shopping/domain/shoppingItem'
import { accessibilityViolations } from './testSupport/accessibility'

function openItem(id: string, name: string, createdAt: number): ShoppingItem {
  return { id, name, quantity: null, createdAt, checkedOffAt: null }
}

function renderSignedInApp(
  initialItems: readonly ShoppingItem[] = [],
  initialMeals: readonly Meal[] = [],
  knownItemsClient = createInMemoryKnownItemsClient(),
) {
  const client = createInMemoryShoppingListClient(initialItems)
  const announcements: string[] = []
  const rendered = render(
    <SignedInApp
      createShoppingListClient={() => client}
      createMealsClient={() => createInMemoryMealsClient(initialMeals)}
      createKnownItemsClient={() => knownItemsClient}
      announce={(text) => {
        announcements.push(text)
      }}
    />,
  )
  return { client, announcements, rendered }
}

function meal(id: string, name: string, items: Meal['items'] = []): Meal {
  return { id, name, items, ingredientNotes: '', recipe: '' }
}

function transferToShoppingList(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Auf die Einkaufsliste, ${name}` }),
  )
}

function goToArea(label: string) {
  return userEvent.click(screen.getByRole('button', { name: label }))
}

function shownItemNames() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => row.textContent)
}

describe('SignedInApp', () => {
  it('starts on the shopping list and marks it as the current area', () => {
    renderSignedInApp()

    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, nichts offen' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Einkaufsliste' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('button', { name: 'Gerichte' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('switches to the meals area and marks it as the current area', async () => {
    renderSignedInApp()

    await goToArea('Gerichte')

    expect(
      screen.getByRole('heading', { name: 'Gerichte, keine' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerichte' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('moves the focus to the heading of the area that was entered', async () => {
    renderSignedInApp()

    await goToArea('Gerichte')
    expect(
      screen.getByRole('heading', { name: 'Gerichte, keine' }),
    ).toHaveFocus()

    await goToArea('Einkaufsliste')
    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste, nichts offen' }),
    ).toHaveFocus()
  })

  it('hides the navigation on the page for adding an item', async () => {
    renderSignedInApp()

    await userEvent.click(
      screen.getByRole('button', { name: 'Artikel hinzufügen' }),
    )

    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('leaves the shopping list as it was after a visit to the meals area', async () => {
    renderSignedInApp([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
      openItem('cheese', 'Käse', 3),
    ])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    await goToArea('Gerichte')
    await goToArea('Einkaufsliste')

    expect(shownItemNames()).toEqual(['Brot', 'Milch', 'Käse'])
    expect(screen.getByRole('checkbox', { name: 'Milch' })).toBeChecked()
    expect(
      screen.getByRole('button', { name: 'Aufräumen, 1 Änderung' }),
    ).toBeInTheDocument()
  })

  it('puts the items of a meal at the end of the shopping list', async () => {
    const { announcements } = renderSignedInApp(
      [openItem('bread', 'Brot', 1)],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
          { name: 'Spaghetti', quantity: null },
        ]),
      ],
    )

    await goToArea('Gerichte')
    await transferToShoppingList('Bolognese')

    expect(screen.getByRole('button', { name: 'Gerichte' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await goToArea('Einkaufsliste')

    expect(shownItemNames()).toEqual([
      'Brot',
      'Hackfleisch, 500 g',
      'Spaghetti',
    ])
    expect(announcements).toContain('Bolognese, 2 Artikel hinzugefügt.')
  })

  it('adds up the quantities when the same meal is transferred twice', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
          { name: 'Spaghetti', quantity: null },
        ]),
      ],
    )

    await goToArea('Gerichte')
    await transferToShoppingList('Bolognese')
    await transferToShoppingList('Bolognese')
    await goToArea('Einkaufsliste')

    expect(shownItemNames()).toEqual(['Hackfleisch, 1000 g', 'Spaghetti, 2'])
    expect(announcements).toContain(
      'Bolognese, 2 Artikel hinzugefügt. 2 zusammengefasst.',
    )
  })

  it('warns about an article of the meal that meets another unit', async () => {
    const { announcements } = renderSignedInApp(
      [openItem('flour', 'Mehl', 1)],
      [
        meal('bread', 'Brot', [
          { name: 'Mehl', quantity: { amount: 500, unit: 'g' } },
        ]),
      ],
    )

    await goToArea('Gerichte')
    await transferToShoppingList('Brot')

    expect(announcements).toContain(
      'Brot, 1 Artikel hinzugefügt. Achtung, Mehl steht mit anderer Einheit bereits offen.',
    )
  })

  it('writes nothing for a meal without shopping items', async () => {
    const { client, announcements } = renderSignedInApp(
      [],
      [meal('soup', 'Suppe')],
    )

    await goToArea('Gerichte')
    await transferToShoppingList('Suppe')

    expect(client.storedItems()).toEqual([])
    expect(announcements).toContain('Suppe hat keine Einkaufs-Items.')
  })

  it('counts every item of a transferred meal in the catalog', async () => {
    const knownItemsClient = createInMemoryKnownItemsClient()
    renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
          { name: 'Spaghetti', quantity: null },
        ]),
      ],
      knownItemsClient,
    )

    await goToArea('Gerichte')
    await transferToShoppingList('Bolognese')
    await transferToShoppingList('Bolognese')

    expect(knownItemsClient.storedKnownItems()).toEqual([
      expect.objectContaining({ name: 'Hackfleisch', timesUsed: 2 }),
      expect.objectContaining({ name: 'Spaghetti', timesUsed: 2 }),
    ])
  })

  it('takes over the history into an empty catalog and suggests it', async () => {
    renderSignedInApp(
      [],
      [],
      createInMemoryKnownItemsClient(
        [],
        [{ ...openItem('oat', 'Hafermilch', 1), checkedOffAt: 2 }],
      ),
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Artikel hinzufügen' }),
    )
    await userEvent.type(screen.getByLabelText('Name'), 'milch')

    expect(
      within(screen.getByRole('list', { name: 'Vorschläge' })).getByRole(
        'button',
        { name: 'Hafermilch' },
      ),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations on the shopping list', async () => {
    const { rendered } = renderSignedInApp([openItem('bread', 'Brot', 1)])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the meals area', async () => {
    const { rendered } = renderSignedInApp()

    await goToArea('Gerichte')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
