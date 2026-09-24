import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryMealsClient } from '../api/inMemoryMealsClient'
import type { MealsClient } from '../api/mealsClient'
import type { Meal } from '../domain/meal'
import { CategoriesArea } from './CategoriesArea'
import { useMeals } from './useMeals'

function meal(id: string, categories: readonly string[]): Meal {
  return {
    id,
    name: id,
    items: [],
    ingredientNotes: '',
    recipe: 'Kochen.',
    categories,
    hidden: false,
    kind: 'mainMeal',
  }
}

type CategoriesAreaUnderTestProps = {
  client: MealsClient
  announce: (text: string) => void
  onBack: () => void
}

function CategoriesAreaUnderTest({
  client,
  announce,
  onBack,
}: CategoriesAreaUnderTestProps) {
  return (
    <CategoriesArea
      meals={useMeals(client)}
      announce={announce}
      onBack={onBack}
    />
  )
}

function renderCategoriesArea(initialMeals: readonly Meal[] = []) {
  const client = createInMemoryMealsClient(initialMeals)
  const announcements: string[] = []
  const departures: string[] = []
  const rendered = render(
    <CategoriesAreaUnderTest
      client={client}
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

function shownCategoryRows() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => within(row).getAllByRole('button')[0].textContent)
}

function askToDeleteCategory(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Löschen, ${name}` }),
  )
}

function confirmDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
}

function openCategory(label: string) {
  return userEvent.click(screen.getByRole('button', { name: label }))
}

function save() {
  return userEvent.click(screen.getByRole('button', { name: 'Speichern' }))
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

const household = [
  meal('Bolognese', ['Nudelgericht', 'Auflauf']),
  meal('Lasagne', ['Auflauf', 'Schnell']),
]

describe('CategoriesArea', () => {
  it('lists the categories in alphabetical order with their meal count', () => {
    renderCategoriesArea(household)

    expect(shownCategoryRows()).toEqual([
      'Auflauf, 2',
      'Nudelgericht, 1',
      'Schnell, 1',
    ])
    expect(
      screen.getByRole('heading', { name: 'Kategorie-Verwaltung, 3' }),
    ).toBeInTheDocument()
    for (const name of ['Auflauf', 'Nudelgericht', 'Schnell'])
      expect(
        screen.getByRole('button', { name: `Löschen, ${name}` }),
      ).toBeInTheDocument()
  })

  it('shows an empty category management', () => {
    renderCategoriesArea([meal('Suppe', [])])

    expect(
      screen.getByRole('heading', { name: 'Kategorie-Verwaltung, keine' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Noch keine Kategorien.')).toBeInTheDocument()
  })

  it('leads back to the settings', async () => {
    const { departures } = renderCategoriesArea()

    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Einstellungen' }),
    )

    expect(departures).toEqual(['settings'])
  })

  it('asks before deleting a category', async () => {
    const { client } = renderCategoriesArea(household)

    await askToDeleteCategory('Auflauf')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Auflauf löschen?' }),
    ).toHaveFocus()
    expect(
      screen.getByText(
        'Die Kategorie wird aus 2 Gerichten entfernt. Die Gerichte selbst bleiben erhalten.',
      ),
    ).toBeInTheDocument()
    expect(client.storedMeals()).toEqual(household)
  })

  it('keeps the category when the deletion is cancelled', async () => {
    const { client } = renderCategoriesArea(household)

    await askToDeleteCategory('Auflauf')
    await cancelDeletion()

    expect(client.storedMeals()).toEqual(household)
    expect(
      screen.getByRole('heading', { name: 'Kategorie-Verwaltung, 3' }),
    ).toHaveFocus()
  })

  it('deletes the category from every meal after the confirmation', async () => {
    const { client, announcements } = renderCategoriesArea(household)

    await askToDeleteCategory('Auflauf')
    await confirmDeletion()

    expect(client.storedMeals()).toEqual([
      meal('Bolognese', ['Nudelgericht']),
      meal('Lasagne', ['Schnell']),
    ])
    expect(announcements).toContain('Auflauf gelöscht, noch 2 Kategorien.')
    expect(
      screen.getByRole('heading', { name: 'Kategorie-Verwaltung, 2' }),
    ).toHaveFocus()
  })

  it('returns to the list when the category disappears', async () => {
    const { client } = renderCategoriesArea(household)

    await askToDeleteCategory('Nudelgericht')
    await act(async () => {
      client.mealsArriveFromElsewhere([
        meal('Bolognese', ['Auflauf']),
        meal('Lasagne', ['Auflauf', 'Schnell']),
      ])
    })

    expect(
      screen.getByRole('heading', { name: 'Kategorie-Verwaltung, 2' }),
    ).toBeInTheDocument()
  })

  it('starts the form with the current name in focus', async () => {
    renderCategoriesArea(household)

    await openCategory('Nudelgericht, 1')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Kategorie bearbeiten' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Nudelgericht')
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('corrects the spelling of a category in every meal', async () => {
    const { client, announcements } = renderCategoriesArea([
      meal('Bolognese', ['nudelgericht', 'Schnell']),
      meal('Carbonara', ['nudelgericht']),
    ])

    await openCategory('nudelgericht, 2')
    await renameTo('Nudelgericht')

    expect(client.storedMeals()).toEqual([
      meal('Bolognese', ['Nudelgericht', 'Schnell']),
      meal('Carbonara', ['Nudelgericht']),
    ])
    expect(announcements).toContain('Nudelgericht gespeichert.')
    expect(
      screen.getByRole('heading', { name: 'Kategorie-Verwaltung, 2' }),
    ).toHaveFocus()
  })

  it('merges a category into an existing one', async () => {
    const { client } = renderCategoriesArea([
      meal('Bolognese', ['Nudelgerichte']),
      meal('Carbonara', ['Nudelgericht']),
      meal('Lasagne', ['Nudelgerichte', 'Nudelgericht']),
    ])

    await openCategory('Nudelgerichte, 2')
    await renameTo('Nudelgericht')

    expect(shownCategoryRows()).toEqual(['Nudelgericht, 3'])
    expect(client.storedMeals()[2].categories).toEqual(['Nudelgericht'])
  })

  it('refuses an empty name', async () => {
    const { client, announcements } = renderCategoriesArea(household)

    await openCategory('Nudelgericht, 1')
    await renameTo('')

    expect(client.storedMeals()).toEqual(household)
    expect(announcements).toContain('Bitte einen Namen eingeben.')
    expect(screen.getByText('Bitte einen Namen eingeben.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Kategorie bearbeiten' }),
    ).toBeInTheDocument()
  })

  it('refuses a name that is too long', async () => {
    const { client, announcements } = renderCategoriesArea(household)

    await openCategory('Nudelgericht, 1')
    await renameTo('N'.repeat(101))

    expect(client.storedMeals()).toEqual(household)
    expect(announcements).toContain('Der Name ist zu lang.')
    expect(screen.getByText('Der Name ist zu lang.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Kategorie bearbeiten' }),
    ).toBeInTheDocument()
  })

  it('returns to the list when the category to be renamed is already gone', async () => {
    const { client } = renderCategoriesArea(household)

    await openCategory('Nudelgericht, 1')
    await act(async () => {
      client.mealsArriveFromElsewhere([meal('Suppe', [])])
    })

    expect(
      screen.getByRole('heading', { name: 'Kategorie-Verwaltung, keine' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations on the form', async () => {
    const { rendered } = renderCategoriesArea(household)

    await openCategory('Nudelgericht, 1')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the category management', async () => {
    const { rendered } = renderCategoriesArea(household)

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the deletion page', async () => {
    const { rendered } = renderCategoriesArea(household)

    await askToDeleteCategory('Auflauf')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
