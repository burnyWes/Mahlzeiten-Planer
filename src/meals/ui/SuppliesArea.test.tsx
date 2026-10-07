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

function meal(id: string, name: string, parts: Partial<Meal> = {}): Meal {
  return {
    id,
    name,
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'mainMeal',
    leftovers: false,
    ...parts,
  }
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

function shownSupplies() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => {
      const name = within(row).getAllByRole('button')[0].textContent
      const count = within(row).getByText(/^\d+$/).textContent
      return `${name}, ${count}`
    })
}

function takeOneLess(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Weniger, ${name}` }),
  )
}

function takeOneMore(name: string) {
  return userEvent.click(screen.getByRole('button', { name: `Mehr, ${name}` }))
}

function nameButtonOf(name: string) {
  return screen.getByRole('button', { name })
}

function shownSupplyNames() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => within(row).getAllByRole('button')[0].textContent)
}

function supplyFilter() {
  return screen.getByRole('combobox', { name: 'Filter' })
}

function chooseFilter(nameOrValue: string) {
  return userEvent.selectOptions(supplyFilter(), nameOrValue)
}

function chosenFilterText() {
  return (supplyFilter() as HTMLSelectElement).selectedOptions[0].textContent
}

function offeredFilters() {
  return within(supplyFilter())
    .getAllByRole('option')
    .map((option) => option.textContent)
}

function resetFilter() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Filter zurücksetzen' }),
  )
}

async function addSupply(mealName: string, count: string) {
  await openSupplyForm()
  await fillIn('Gericht', mealName)
  await fillIn('Menge', count)
  await save()
}

const bolognese = meal('bolognese', 'Bolognese')
const soup = meal('soup', 'Linsensuppe')

const lasagne = meal('lasagne', 'Lasagne', { categories: ['Vegetarisch'] })
const vegetableSoup = meal('vegetableSoup', 'Gemüsesuppe', {
  kind: 'none',
  categories: ['Vegetarisch'],
})
const nuts = meal('nuts', 'Nüsse', { kind: 'snack' })
const muesli = meal('muesli', 'Müsli', { kind: 'breakfast' })
const ratatouille = meal('ratatouille', 'Ratatouille', {
  categories: ['Vegetarisch'],
})

const filterableMeals = [
  bolognese,
  lasagne,
  vegetableSoup,
  nuts,
  muesli,
  ratatouille,
]
const filterableSupplies = [
  supply('bolognese', 1),
  supply('lasagne', 2),
  supply('vegetableSoup', 1),
  supply('nuts', 1),
  supply('muesli', 4),
]

function renderFilterableSupplies() {
  return renderSuppliesArea(filterableMeals, filterableSupplies)
}

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
    expect(shownSupplies()).toEqual(['Bolognese, 3'])
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
    expect(shownSupplies()).toEqual(['Bolognese, 5'])
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

    expect(shownSupplies()).toEqual([
      'Äpfel im Schlafrock, 2',
      'Bolognese, 3',
      'Linsensuppe, 1',
    ])
    expect(
      screen.getByRole('heading', { name: 'Vorräte, 3' }),
    ).toBeInTheDocument()
  })

  it('leaves out a supply whose meal is gone', () => {
    renderSuppliesArea([bolognese], [supply('bolognese', 3), supply('gone', 2)])

    expect(shownSupplies()).toEqual(['Bolognese, 3'])
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
    expect(shownSupplies()).toEqual(['Bolognese, 5'])
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

  it('counts a supply up at its row', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await takeOneMore('Bolognese')

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 4)])
    expect(announcements).toContain('Bolognese, 4.')
    expect(shownSupplies()).toEqual(['Bolognese, 4'])
  })

  it('counts a supply down at its row', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea(
      [bolognese],
      [supply('bolognese', 3)],
    )

    await takeOneLess('Bolognese')

    expect(suppliesClient.storedSupplies()).toEqual([supply('bolognese', 2)])
    expect(announcements).toContain('Bolognese, 2.')
  })

  it('removes the supply when its last portion is taken', async () => {
    const { suppliesClient, announcements } = renderSuppliesArea(
      [bolognese, soup],
      [supply('bolognese', 1), supply('soup', 2)],
    )

    await takeOneLess('Bolognese')

    expect(suppliesClient.storedSupplies()).toEqual([supply('soup', 2)])
    expect(announcements).toContain('Bolognese entfernt, noch 1 Vorrat.')
  })

  it('leaves the focus on the meal that follows the removed row', async () => {
    renderSuppliesArea(
      [bolognese, soup],
      [supply('bolognese', 1), supply('soup', 2)],
    )

    await takeOneLess('Bolognese')

    expect(nameButtonOf('Linsensuppe')).toHaveFocus()
  })

  it('leaves the focus on the meal before the removed last row', async () => {
    renderSuppliesArea(
      [bolognese, soup],
      [supply('bolognese', 3), supply('soup', 1)],
    )

    await takeOneLess('Linsensuppe')

    expect(nameButtonOf('Bolognese')).toHaveFocus()
  })

  it('leaves the focus on the heading when the only supply is removed', async () => {
    renderSuppliesArea([bolognese], [supply('bolognese', 1)])

    await takeOneLess('Bolognese')

    expect(
      screen.getByRole('heading', { name: 'Vorräte, keine' }),
    ).toHaveFocus()
  })

  it('offers no more portions at ninety-nine', () => {
    renderSuppliesArea([bolognese], [supply('bolognese', 99)])

    expect(
      screen.getByRole('button', { name: 'Mehr, Bolognese' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Weniger, Bolognese' }),
    ).toBeEnabled()
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

  it('offers no filter when no supplied meal has a kind or a category', () => {
    renderSuppliesArea(
      [
        meal('bread', 'Brot', { kind: 'none' }),
        meal('rice', 'Reis', { kind: 'none' }),
      ],
      [supply('bread', 1), supply('rice', 2)],
    )

    expect(screen.queryByRole('combobox', { name: 'Filter' })).toBeNull()
  })

  it('offers only the kinds and categories of supplied meals', () => {
    renderSuppliesArea(
      [
        meal('lasagne', 'Lasagne', { categories: ['Vegetarisch'] }),
        nuts,
        meal('muesli', 'Müsli', {
          kind: 'breakfast',
          categories: ['Asiatisch'],
        }),
        meal('porridge', 'Porridge', { kind: 'snack', hidden: true }),
        meal('bread', 'Brot', { kind: 'none' }),
      ],
      [
        supply('lasagne', 1),
        supply('nuts', 2),
        supply('porridge', 1),
        supply('bread', 3),
      ],
    )

    expect(offeredFilters()).toEqual([
      'Alle',
      'Hauptgericht',
      'Snack',
      'Vegetarisch',
    ])
    expect(
      within(supplyFilter())
        .getAllByRole('group')
        .map((group) => group.getAttribute('label')),
    ).toEqual(['Art', 'Kategorie'])
  })

  it('shows only the supplies of the chosen category', async () => {
    renderFilterableSupplies()

    await chooseFilter('Vegetarisch')

    expect(shownSupplyNames()).toEqual(['Gemüsesuppe', 'Lasagne'])
  })

  it('shows only the supplies of the chosen kind', async () => {
    renderFilterableSupplies()

    await chooseFilter('Hauptgericht')

    expect(shownSupplyNames()).toEqual(['Bolognese', 'Lasagne'])
  })

  it('counts and announces the filtered supplies', async () => {
    const { announcements } = renderFilterableSupplies()

    await chooseFilter('Vegetarisch')

    const heading = screen.getByRole('heading', { name: 'Vorräte, 2 von 5' })
    expect(heading).toHaveTextContent('Vorräte, 2 / 5')
    expect(announcements).toContain('Vegetarisch, 2 von 5 Vorräten.')
  })

  it('resets the filter with the cross', async () => {
    const { announcements } = renderFilterableSupplies()

    await chooseFilter('Vegetarisch')
    await resetFilter()

    expect(announcements).toContain('Filter zurückgesetzt, 5 Vorräte.')
    expect(chosenFilterText()).toBe('Alle')
    expect(supplyFilter()).toHaveFocus()
    expect(
      screen.getByRole('heading', { name: 'Vorräte, 5' }),
    ).toBeInTheDocument()
  })

  it('keeps the filter while a supply is added', async () => {
    renderFilterableSupplies()

    await chooseFilter('Vegetarisch')
    await addSupply('Ratatouille', '2')

    expect(chosenFilterText()).toBe('Vegetarisch')
    expect(shownSupplyNames()).toEqual([
      'Gemüsesuppe',
      'Lasagne',
      'Ratatouille',
    ])
  })

  it('keeps the filter when returning from a supply', async () => {
    renderFilterableSupplies()

    await chooseFilter('Vegetarisch')
    await openSupply('Lasagne')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Vorräten' }),
    )

    expect(chosenFilterText()).toBe('Vegetarisch')
    expect(shownSupplyNames()).toEqual(['Gemüsesuppe', 'Lasagne'])
  })

  it('shows every supply when no supply matches the chosen filter anymore', async () => {
    const { suppliesClient } = renderFilterableSupplies()

    await chooseFilter('Snack')
    await act(async () => {
      suppliesClient.suppliesArriveFromElsewhere(
        filterableSupplies.filter((one) => one.mealId !== 'nuts'),
      )
    })

    expect(chosenFilterText()).toBe('Alle')
    expect(shownSupplyNames()).toEqual([
      'Bolognese',
      'Gemüsesuppe',
      'Lasagne',
      'Müsli',
    ])
  })

  it('keeps showing every supply when a matching supply comes back', async () => {
    const { suppliesClient } = renderFilterableSupplies()

    await chooseFilter('Snack')
    await act(async () => {
      suppliesClient.suppliesArriveFromElsewhere(
        filterableSupplies.filter((one) => one.mealId !== 'nuts'),
      )
    })
    await act(async () => {
      suppliesClient.suppliesArriveFromElsewhere(filterableSupplies)
    })

    expect(chosenFilterText()).toBe('Alle')
    expect(shownSupplyNames()).toEqual([
      'Bolognese',
      'Gemüsesuppe',
      'Lasagne',
      'Müsli',
      'Nüsse',
    ])
  })

  it('leaves the focus on the heading when the last filtered row is removed', async () => {
    const { announcements } = renderFilterableSupplies()

    await chooseFilter('Snack')
    await takeOneLess('Nüsse')

    expect(announcements).toContain('Nüsse entfernt, noch 4 Vorräte.')
    expect(screen.getByRole('heading', { name: 'Vorräte, 4' })).toHaveFocus()
  })

  it('leaves the focus on the following filtered row after a removal', async () => {
    renderFilterableSupplies()

    await chooseFilter('Hauptgericht')
    await takeOneLess('Bolognese')

    expect(nameButtonOf('Lasagne')).toHaveFocus()
  })

  it('counts every supply when a filtered supply is removed', async () => {
    const { announcements } = renderFilterableSupplies()

    await chooseFilter('Vegetarisch')
    await openSupply('Lasagne')
    await askToDeleteSupply()
    await confirmDeletion()

    expect(announcements).toContain('Lasagne entfernt, noch 4 Vorräte.')
    expect(chosenFilterText()).toBe('Vegetarisch')
    expect(shownSupplyNames()).toEqual(['Gemüsesuppe'])
  })

  it('has no accessibility violations on the filtered list', async () => {
    const { rendered } = renderFilterableSupplies()

    await chooseFilter('Vegetarisch')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
