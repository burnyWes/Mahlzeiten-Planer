import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SignedInApp } from './SignedInApp'
import { createInMemoryShoppingListClient } from './shopping/api/inMemoryShoppingListClient'
import type { ShoppingItem } from './shopping/domain/shoppingItem'
import { accessibilityViolations } from './testSupport/accessibility'

function openItem(id: string, name: string, createdAt: number): ShoppingItem {
  return { id, name, quantity: null, createdAt, checkedOffAt: null }
}

function renderSignedInApp(initialItems: readonly ShoppingItem[] = []) {
  const client = createInMemoryShoppingListClient(initialItems)
  const rendered = render(
    <SignedInApp createShoppingListClient={() => client} announce={() => {}} />,
  )
  return { client, rendered }
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
