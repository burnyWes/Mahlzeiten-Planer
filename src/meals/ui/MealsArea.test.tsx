import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryMealsClient } from '../api/inMemoryMealsClient'
import type { MealsClient } from '../api/mealsClient'
import type { Meal } from '../domain/meal'
import { MealsArea } from './MealsArea'
import { useMeals } from './useMeals'

function meal(id: string, name: string, parts: Partial<Meal> = {}): Meal {
  return { id, name, items: [], ingredientNotes: '', recipe: '', ...parts }
}

type MealsAreaUnderTestProps = {
  client: MealsClient
  announce: (text: string) => void
}

function MealsAreaUnderTest({ client, announce }: MealsAreaUnderTestProps) {
  return (
    <MealsArea
      meals={useMeals(client)}
      announce={announce}
      navigation={<div data-testid="navigation" />}
    />
  )
}

function renderMealsArea(initialMeals: readonly Meal[] = []) {
  const client = createInMemoryMealsClient(initialMeals)
  const announcements: string[] = []
  const rendered = render(
    <MealsAreaUnderTest
      client={client}
      announce={(text) => {
        announcements.push(text)
      }}
    />,
  )
  return { client, announcements, rendered }
}

function openMealForm() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Gericht hinzufügen' }),
  )
}

function openMeal(name: string) {
  return userEvent.click(screen.getByRole('button', { name }))
}

function goBackToTheMeals() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Zurück zu den Gerichten' }),
  )
}

async function fillIn(label: string, text: string) {
  await userEvent.type(screen.getByLabelText(label), text)
}

async function takeOverItem(name: string, amount = '', unit = '') {
  const itemForm = screen.getByRole('form', {
    name: 'Einkaufs-Item hinzufügen',
  })
  await userEvent.type(within(itemForm).getByLabelText('Item'), name)
  if (amount !== '')
    await userEvent.type(within(itemForm).getByLabelText('Menge'), amount)
  if (unit !== '')
    await userEvent.type(within(itemForm).getByLabelText('Einheit'), unit)
  await userEvent.click(
    within(itemForm).getByRole('button', { name: 'Item hinzufügen' }),
  )
}

function save() {
  return userEvent.click(screen.getByRole('button', { name: 'Speichern' }))
}

function shownMealNames() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => row.textContent)
}

describe('MealsArea', () => {
  it('reports that no meal is known yet', () => {
    renderMealsArea()

    expect(
      screen.getByRole('heading', { name: 'Gerichte, keine' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Noch keine Gerichte.')).toBeInTheDocument()
  })

  it('lists the known meals in German alphabetical order', () => {
    renderMealsArea([
      meal('stew', 'Zwiebelkuchen'),
      meal('apples', 'Äpfel im Schlafrock'),
      meal('bread', 'Brotauflauf'),
    ])

    expect(shownMealNames()).toEqual([
      'Äpfel im Schlafrock',
      'Brotauflauf',
      'Zwiebelkuchen',
    ])
    expect(
      screen.getByRole('heading', { name: 'Gerichte, 3' }),
    ).toBeInTheDocument()
  })

  it('keeps a meal that was created and shows it afterwards', async () => {
    const { client, announcements } = renderMealsArea()

    await openMealForm()
    await fillIn('Name', 'Linsensuppe')
    await fillIn('Zutaten', 'Zwiebel, Lorbeer')
    await fillIn('Rezept', 'Linsen kochen.')
    await save()

    expect(client.storedMeals()).toEqual([
      {
        id: 'meal-1',
        name: 'Linsensuppe',
        items: [],
        ingredientNotes: 'Zwiebel, Lorbeer',
        recipe: 'Linsen kochen.',
      },
    ])
    expect(announcements).toContain('Linsensuppe gespeichert.')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Linsensuppe' }),
    ).toHaveFocus()
  })

  it('takes over the items that were written down', async () => {
    const { client, announcements } = renderMealsArea()

    await openMealForm()
    await fillIn('Name', 'Bolognese')
    await takeOverItem('Hackfleisch', '500', 'g')
    await takeOverItem('Spaghetti')
    await save()

    expect(client.storedMeals()[0].items).toEqual([
      { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
      { name: 'Spaghetti', quantity: null },
    ])
    expect(announcements).toContain('Hackfleisch, 500 g als Item übernommen.')
  })

  it('removes an item that was taken over by mistake', async () => {
    const { client, announcements } = renderMealsArea()

    await openMealForm()
    await fillIn('Name', 'Bolognese')
    await takeOverItem('Hackfleisch', '500', 'g')
    await takeOverItem('Spaghetti')
    await userEvent.click(
      screen.getByRole('button', { name: 'Entfernen, Hackfleisch, 500 g' }),
    )
    await save()

    expect(client.storedMeals()[0].items).toEqual([
      { name: 'Spaghetti', quantity: null },
    ])
    expect(announcements).toContain('Hackfleisch entfernt, noch 1 Item.')
  })

  it('refuses to save a meal without a name', async () => {
    const { client, announcements } = renderMealsArea()

    await openMealForm()
    await save()

    expect(client.storedMeals()).toEqual([])
    expect(announcements).toContain('Bitte einen Namen eingeben.')
    expect(screen.getByText('Bitte einen Namen eingeben.')).toBeInTheDocument()
  })

  it('reports an item quantity it cannot read', async () => {
    const { announcements } = renderMealsArea()

    await openMealForm()
    await takeOverItem('Mehl', 'viel')

    expect(announcements).toContain('Die Menge muss eine Zahl sein.')
    expect(
      screen.getByRole('heading', { name: 'Einkaufs-Items, keine' }),
    ).toBeInTheDocument()
  })

  it('returns to the list without saving anything', async () => {
    const { client } = renderMealsArea()

    await openMealForm()
    await fillIn('Name', 'Linsensuppe')
    await goBackToTheMeals()

    expect(client.storedMeals()).toEqual([])
    expect(
      screen.getByRole('heading', { name: 'Gerichte, keine' }),
    ).toBeInTheDocument()
  })

  it('shows recipe and ingredient notes paragraph by paragraph', async () => {
    renderMealsArea([
      meal('bolognese', 'Bolognese', {
        items: [{ name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } }],
        ingredientNotes: 'Zwiebel\nKnoblauch',
        recipe: 'Anbraten.\n\nTomaten dazu.',
      }),
    ])

    await openMeal('Bolognese')

    expect(
      screen.getByRole('heading', { name: 'Einkaufs-Items, 1' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Hackfleisch, 500 g')).toBeInTheDocument()
    expect(screen.getByText('Zwiebel')).toBeInTheDocument()
    expect(screen.getByText('Knoblauch')).toBeInTheDocument()
    expect(screen.getByText('Anbraten.')).toBeInTheDocument()
    expect(screen.getByText('Tomaten dazu.')).toBeInTheDocument()
  })

  it('leaves out the sections a meal says nothing about', async () => {
    renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')

    expect(screen.queryByRole('heading', { name: 'Zutaten' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Rezept' })).toBeNull()
    expect(screen.queryByRole('heading', { name: /Einkaufs-Items/ })).toBeNull()
  })

  it('moves the focus to the name of the meal that was opened', async () => {
    renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Suppe' }),
    ).toHaveFocus()
  })

  it('returns from a meal to the list', async () => {
    renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await goBackToTheMeals()

    expect(screen.getByRole('heading', { name: 'Gerichte, 1' })).toHaveFocus()
  })

  it('shows the navigation on the list and nowhere else', async () => {
    renderMealsArea([meal('soup', 'Suppe')])

    expect(screen.getByTestId('navigation')).toBeInTheDocument()

    await openMeal('Suppe')

    expect(screen.queryByTestId('navigation')).toBeNull()
  })

  it('has no accessibility violations on the list', async () => {
    const { rendered } = renderMealsArea([meal('soup', 'Suppe')])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the form', async () => {
    const { rendered } = renderMealsArea()

    await openMealForm()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on a meal', async () => {
    const { rendered } = renderMealsArea([
      meal('bolognese', 'Bolognese', {
        items: [{ name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } }],
        recipe: 'Anbraten.',
      }),
    ])

    await openMeal('Bolognese')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
