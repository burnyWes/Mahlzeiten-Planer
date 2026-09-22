import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryMealsClient } from '../api/inMemoryMealsClient'
import { createInMemorySuppliesClient } from '../api/inMemorySuppliesClient'
import type { MealsClient } from '../api/mealsClient'
import type { SuppliesClient } from '../api/suppliesClient'
import type { Meal } from '../domain/meal'
import type { Supply } from '../domain/supply'
import { SuppliesArea } from './SuppliesArea'
import { useMeals } from './useMeals'
import { useSupplies } from './useSupplies'

function meal(id: string, name: string): Meal {
  return { id, name, items: [], ingredientNotes: '', recipe: '' }
}

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
}

type SuppliesAreaUnderTestProps = {
  mealsClient: MealsClient
  suppliesClient: SuppliesClient
  announce: (text: string) => void
}

function SuppliesAreaUnderTest({
  mealsClient,
  suppliesClient,
  announce,
}: SuppliesAreaUnderTestProps) {
  return (
    <SuppliesArea
      meals={useMeals(mealsClient).meals}
      supplies={useSupplies(suppliesClient)}
      announce={announce}
      navigation={<div data-testid="navigation" />}
    />
  )
}

function renderSuppliesArea(
  initialMeals: readonly Meal[] = [],
  initialSupplies: readonly Supply[] = [],
) {
  const suppliesClient = createInMemorySuppliesClient(initialSupplies)
  const announcements: string[] = []
  const rendered = render(
    <SuppliesAreaUnderTest
      mealsClient={createInMemoryMealsClient(initialMeals)}
      suppliesClient={suppliesClient}
      announce={(text) => {
        announcements.push(text)
      }}
    />,
  )
  return { suppliesClient, announcements, rendered }
}

function openSupplyForm() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Vorrat hinzufügen' }),
  )
}

async function fillIn(label: string, text: string) {
  const field = screen.getByLabelText(label)
  await userEvent.clear(field)
  await userEvent.type(field, text)
}

function save() {
  return userEvent.click(screen.getByRole('button', { name: 'Speichern' }))
}

function openSupply(name: string) {
  return userEvent.click(screen.getByRole('button', { name }))
}

function askToDeleteSupply() {
  return userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
}

function confirmDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
}

function cancelDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
}

function shownRows() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => row.textContent)
}

function shownSupplyNames() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => within(row).getByRole('button').textContent)
}

async function addSupply(mealName: string, count: string) {
  await openSupplyForm()
  await fillIn('Gericht', mealName)
  await fillIn('Menge', count)
  await save()
}

const bolognese = meal('bolognese', 'Bolognese')
const soup = meal('soup', 'Linsensuppe')

describe('SuppliesArea', () => {
  it('reports that nothing is kept in store yet', () => {
    renderSuppliesArea()

    expect(
      screen.getByRole('heading', { name: 'Vorräte, keine' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Noch keine Vorräte.')).toBeInTheDocument()
  })

  it('keeps a supply that was chosen from the suggestions', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea([bolognese])

    await openSupplyForm()
    await fillIn('Gericht', 'bolo')
    await userEvent.click(
      within(screen.getByRole('list', { name: 'Vorschläge' })).getByRole(
        'button',
        { name: 'Bolognese' },
      ),
    )

    expect(screen.getByLabelText('Gericht')).toHaveValue('Bolognese')
    expect(screen.getByLabelText('Menge')).toHaveFocus()

    await fillIn('Menge', '3')
    await save()

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 3)])
    expect(announcements).toContain('Bolognese, 3.')
    expect(shownRows()).toEqual(['Bolognese3'])
  })

  it('keeps a supply for a meal whose name was written out', async () => {
    const { suppliesClient } = renderSuppliesArea([bolognese])

    await addSupply('bolognese', '2')

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 2)])
  })

  it('starts the count of a new supply at one', async () => {
    renderSuppliesArea([bolognese])

    await openSupplyForm()

    expect(screen.getByLabelText('Menge')).toHaveValue('1')
    expect(screen.getByLabelText('Gericht')).toHaveFocus()
  })

  it('refuses a meal nobody wrote down', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea([bolognese])

    await addSupply('Pizza', '1')

    expect(suppliesClient.storedSupplies()).toEqual([])
    expect(announcements).toContain('Dieses Gericht gibt es nicht.')
    expect(
      screen.getByText('Dieses Gericht gibt es nicht.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Gericht')).toHaveFocus()
  })

  it('adds the new count to a supply that is kept already', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await addSupply('Bolognese', '2')

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 5)])
    expect(announcements).toContain('Bolognese, 2 dazu, jetzt 5.')
    expect(shownRows()).toEqual(['Bolognese5'])
  })

  it('refuses a total above ninety-nine and stays on the form', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 98)],
    )

    await addSupply('Bolognese', '2')

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 98)])
    expect(announcements).toContain('Die Anzahl ist zu groß.')
    expect(screen.getByLabelText('Menge')).toHaveFocus()
  })

  it('refuses a count between two whole numbers', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea([bolognese])

    await addSupply('Bolognese', '2,5')

    expect(suppliesClient.storedSupplies()).toEqual([])
    expect(announcements).toContain('Die Anzahl muss eine ganze Zahl sein.')
    expect(screen.getByLabelText('Menge')).toHaveFocus()
  })

  it('lists the supplies in German alphabetical order', () => {
    renderSuppliesArea(
      [soup, bolognese, meal('apples', 'Äpfel im Schlafrock')],
      [supply('soup', 1), supply('bolognese', 3), supply('apples', 2)],
    )

    expect(shownRows()).toEqual([
      'Äpfel im Schlafrock2',
      'Bolognese3',
      'Linsensuppe1',
    ])
    expect(
      screen.getByRole('heading', { name: 'Vorräte, 3' }),
    ).toBeInTheDocument()
  })

  it('leaves out a supply whose meal is gone', () => {
    renderSuppliesArea([bolognese], [supply('bolognese', 3), supply('gone', 2)])

    expect(shownRows()).toEqual(['Bolognese3'])
    expect(
      screen.getByRole('heading', { name: 'Vorräte, 1' }),
    ).toBeInTheDocument()
  })

  it('returns to the list without keeping anything', async () => {
    const { suppliesClient } = renderSuppliesArea([bolognese])

    await openSupplyForm()
    await fillIn('Gericht', 'Bolognese')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Vorräten' }),
    )

    expect(suppliesClient.storedSupplies()).toEqual([])
    expect(
      screen.getByRole('heading', { name: 'Vorräte, keine' }),
    ).toBeInTheDocument()
  })

  it('shows the navigation on the list and nowhere else', async () => {
    renderSuppliesArea([bolognese])

    expect(screen.getByTestId('navigation')).toBeInTheDocument()

    await openSupplyForm()

    expect(screen.queryByTestId('navigation')).toBeNull()
  })

  it('opens a supply with its name as the heading and its count filled in', async () => {
    renderSuppliesArea([bolognese], [supply('bolognese', 3)])

    await openSupply('Bolognese')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Bolognese' }),
    ).toHaveFocus()
    expect(screen.getByLabelText('Menge')).toHaveValue('3')
  })

  it('replaces the count of a supply instead of adding to it', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await openSupply('Bolognese')
    await fillIn('Menge', '5')
    await save()

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 5)])
    expect(announcements).toContain('Bolognese, 5.')
    expect(shownRows()).toEqual(['Bolognese5'])
  })

  it('stays on the supply when the count cannot be read', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await openSupply('Bolognese')
    await fillIn('Menge', 'viele')
    await save()

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 3)])
    expect(announcements).toContain('Die Anzahl muss eine Zahl sein.')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Bolognese' }),
    ).toBeInTheDocument()
  })

  it('returns from a supply to the list', async () => {
    renderSuppliesArea([bolognese], [supply('bolognese', 3)])

    await openSupply('Bolognese')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Vorräten' }),
    )

    expect(screen.getByRole('heading', { name: 'Vorräte, 1' })).toHaveFocus()
  })

  it('asks before it removes a supply and keeps it when asked to cancel', async () => {
    const { suppliesClient } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await openSupply('Bolognese')
    await askToDeleteSupply()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Bolognese entfernen?' }),
    ).toHaveFocus()

    await cancelDeletion()

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 3)])
    expect(
      screen.getByRole('heading', { level: 1, name: 'Bolognese' }),
    ).toHaveFocus()
  })

  it('removes a supply once the removal is confirmed', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea(
      [bolognese, soup],
      [supply('bolognese', 3), supply('soup', 1)],
    )

    await openSupply('Bolognese')
    await askToDeleteSupply()
    await confirmDeletion()

    expect(suppliesClient.storedSupplies()).toEqual([supply('soup', 1)])
    expect(announcements).toContain('Bolognese entfernt, noch 1 Vorrat.')
    expect(screen.getByRole('heading', { name: 'Vorräte, 1' })).toHaveFocus()
  })

  it('returns to the list when the other device removes the shown supply', async () => {
    const { suppliesClient } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await openSupply('Bolognese')
    await act(async () => {
      suppliesClient.suppliesArriveFromElsewhere([])
    })

    expect(
      screen.getByRole('heading', { name: 'Vorräte, keine' }),
    ).toBeInTheDocument()
  })

  it('names every supply of the list as a button', () => {
    renderSuppliesArea(
      [bolognese, soup],
      [supply('bolognese', 3), supply('soup', 1)],
    )

    expect(shownSupplyNames()).toEqual(['Bolognese', 'Linsensuppe'])
  })

  it('has no accessibility violations on a supply', async () => {
    const { rendered } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await openSupply('Bolognese')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the confirmation page', async () => {
    const { rendered } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await openSupply('Bolognese')
    await askToDeleteSupply()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the list', async () => {
    const { rendered } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the form', async () => {
    const { rendered } = renderSuppliesArea([bolognese])

    await openSupplyForm()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the form with suggestions shown', async () => {
    const { rendered } = renderSuppliesArea([bolognese])

    await openSupplyForm()
    await fillIn('Gericht', 'bolo')

    expect(screen.getByRole('list', { name: 'Vorschläge' })).toBeInTheDocument()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
