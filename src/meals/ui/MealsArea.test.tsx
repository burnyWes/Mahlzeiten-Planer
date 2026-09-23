import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryMealsClient } from '../api/inMemoryMealsClient'
import type { MealsClient } from '../api/mealsClient'
import type { Meal, MealId } from '../domain/meal'
import { MealsArea } from './MealsArea'
import { useMeals } from './useMeals'

function meal(id: string, name: string, parts: Partial<Meal> = {}): Meal {
  return {
    id,
    name,
    items: [],
    ingredientNotes: '',
    recipe: '',
    hidden: false,
    kind: 'mainMeal',
    ...parts,
  }
}

type MealsAreaUnderTestProps = {
  client: MealsClient
  announce: (text: string) => void
  onAddToShoppingList: (meal: Meal) => void
  onMealDeleted: (id: MealId) => void
  suggestNames: (typed: string) => readonly string[]
}

function MealsAreaUnderTest({
  client,
  announce,
  onAddToShoppingList,
  onMealDeleted,
  suggestNames,
}: MealsAreaUnderTestProps) {
  return (
    <MealsArea
      meals={useMeals(client)}
      announce={announce}
      navigation={<div data-testid="navigation" />}
      onAddToShoppingList={onAddToShoppingList}
      onMealDeleted={onMealDeleted}
      suggestNames={suggestNames}
    />
  )
}

function suggestingFrom(suggestableNames: readonly string[]) {
  return (typed: string) =>
    typed.length < 2
      ? []
      : suggestableNames.filter((name) =>
          name.toLowerCase().includes(typed.toLowerCase()),
        )
}

function renderMealsArea(
  initialMeals: readonly Meal[] = [],
  suggestableNames: readonly string[] = [],
) {
  const client = createInMemoryMealsClient(initialMeals)
  const announcements: string[] = []
  const transferred: Meal[] = []
  const deletedMealIds: MealId[] = []
  const rendered = render(
    <MealsAreaUnderTest
      client={client}
      announce={(text) => {
        announcements.push(text)
      }}
      onAddToShoppingList={(meal) => {
        transferred.push(meal)
      }}
      onMealDeleted={(id) => {
        deletedMealIds.push(id)
      }}
      suggestNames={suggestingFrom(suggestableNames)}
    />,
  )
  return { client, announcements, transferred, deletedMealIds, rendered }
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

function editMeal() {
  return userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }))
}

function mainMealBox() {
  return screen.getByRole('checkbox', { name: 'Hauptgericht' })
}

function switchMainMeal() {
  return userEvent.click(mainMealBox())
}

function breakfastBox() {
  return screen.getByRole('checkbox', { name: 'Frühstück' })
}

function switchBreakfast() {
  return userEvent.click(breakfastBox())
}

function switchHiding(label: string) {
  return userEvent.click(screen.getByRole('button', { name: label }))
}

function askToDeleteMeal() {
  return userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
}

function confirmDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
}

function cancelDeletion() {
  return userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
}

function clearField(label: string) {
  return userEvent.clear(screen.getByLabelText(label))
}

function save() {
  return userEvent.click(screen.getByRole('button', { name: 'Speichern' }))
}

function mealRows() {
  return within(screen.getByRole('main')).getAllByRole('listitem')
}

function shownMealNames() {
  return mealRows().map(
    (row) => within(row).getAllByRole('button')[0].textContent,
  )
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
        hidden: false,
        kind: 'mainMeal',
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

  it('shows the removal of a taken over item as an icon only', async () => {
    renderMealsArea()

    await openMealForm()
    await takeOverItem('Hackfleisch', '500', 'g')

    expect(
      screen.getByRole('button', { name: 'Entfernen, Hackfleisch, 500 g' })
        .textContent,
    ).toBe('')
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

  it('opens a known meal for editing with everything filled in', async () => {
    renderMealsArea([
      meal('bolognese', 'Bolognese', {
        items: [{ name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } }],
        ingredientNotes: 'Zwiebel',
        recipe: 'Anbraten.',
      }),
    ])

    await openMeal('Bolognese')
    await editMeal()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Gericht bearbeiten' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Bolognese')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(screen.getByLabelText('Zutaten')).toHaveValue('Zwiebel')
    expect(screen.getByLabelText('Rezept')).toHaveValue('Anbraten.')
    expect(screen.getByText('Hackfleisch, 500 g')).toBeInTheDocument()
    expect(mainMealBox()).toBeChecked()
    expect(breakfastBox()).not.toBeChecked()
  })

  it('keeps the change to a meal instead of creating a second one', async () => {
    const { client, announcements } = renderMealsArea([
      meal('bolognese', 'Bolognese', { recipe: 'Anbraten.' }),
    ])

    await openMeal('Bolognese')
    await editMeal()
    await clearField('Name')
    await fillIn('Name', 'Bolognese vom Rind')
    await save()

    expect(client.storedMeals()).toEqual([
      {
        id: 'bolognese',
        name: 'Bolognese vom Rind',
        items: [],
        ingredientNotes: '',
        recipe: 'Anbraten.',
        hidden: false,
        kind: 'mainMeal',
      },
    ])
    expect(announcements).toContain('Bolognese vom Rind gespeichert.')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Bolognese vom Rind' }),
    ).toHaveFocus()
  })

  it('returns from editing to the meal without changing it', async () => {
    const { client } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await editMeal()
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zum Gericht' }),
    )

    expect(client.storedMeals()[0].name).toBe('Suppe')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Suppe' }),
    ).toHaveFocus()
  })

  it('asks before it deletes a meal and keeps it when asked to cancel', async () => {
    const { client } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await askToDeleteMeal()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Suppe löschen?' }),
    ).toHaveFocus()

    await cancelDeletion()

    expect(client.storedMeals()).toHaveLength(1)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Suppe' }),
    ).toHaveFocus()
  })

  it('deletes a meal once the deletion is confirmed', async () => {
    const { client, announcements } = renderMealsArea([
      meal('soup', 'Suppe'),
      meal('stew', 'Eintopf'),
    ])

    await openMeal('Suppe')
    await askToDeleteMeal()
    await confirmDeletion()

    expect(client.storedMeals()).toEqual([meal('stew', 'Eintopf')])
    expect(announcements).toContain('Suppe gelöscht, noch 1 Gericht.')
    expect(screen.getByRole('heading', { name: 'Gerichte, 1' })).toHaveFocus()
  })

  it('reports the meal that was deleted so its supply can go with it', async () => {
    const { deletedMealIds } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await askToDeleteMeal()
    await confirmDeletion()

    expect(deletedMealIds).toEqual(['soup'])
  })

  it('returns to the list when the other device removes the shown meal', async () => {
    const { client } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await act(async () => {
      client.mealsArriveFromElsewhere([])
    })

    expect(
      screen.getByRole('heading', { name: 'Gerichte, keine' }),
    ).toBeInTheDocument()
  })

  it('returns to the list when the meal to be deleted is already gone', async () => {
    const { client } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await askToDeleteMeal()
    await act(async () => {
      client.mealsArriveFromElsewhere([])
    })

    expect(
      screen.getByRole('heading', { name: 'Gerichte, keine' }),
    ).toBeInTheDocument()
  })

  it('hands the meal of a row over for the transfer', async () => {
    const { transferred } = renderMealsArea([meal('soup', 'Suppe')])

    await userEvent.click(
      screen.getByRole('button', { name: 'Auf die Einkaufsliste, Suppe' }),
    )

    expect(transferred).toEqual([meal('soup', 'Suppe')])
  })

  it('hands the shown meal over for the transfer and stays on it', async () => {
    const { transferred } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await userEvent.click(
      screen.getByRole('button', { name: 'Auf die Einkaufsliste' }),
    )

    expect(transferred).toEqual([meal('soup', 'Suppe')])
    expect(
      screen.getByRole('heading', { level: 1, name: 'Suppe' }),
    ).toBeInTheDocument()
  })

  it('hides a meal and says so', async () => {
    const { client, announcements } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await switchHiding('Ausblenden')

    expect(client.storedMeals()[0].hidden).toBe(true)
    expect(announcements).toContain('Suppe ausgeblendet.')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Suppe' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Einblenden' }),
    ).toBeInTheDocument()
  })

  it('shows a hidden meal again', async () => {
    const { client, announcements } = renderMealsArea([
      meal('soup', 'Suppe', { hidden: true }),
    ])

    await openMeal('Suppe, ausgeblendet')
    await switchHiding('Einblenden')

    expect(client.storedMeals()[0].hidden).toBe(false)
    expect(announcements).toContain('Suppe eingeblendet.')
    expect(
      screen.getByRole('button', { name: 'Ausblenden' }),
    ).toBeInTheDocument()
  })

  it('names a hidden meal as hidden in the list', () => {
    renderMealsArea([
      meal('soup', 'Suppe', { hidden: true }),
      meal('stew', 'Eintopf'),
    ])

    expect(
      screen.getByRole('button', { name: 'Suppe, ausgeblendet' }).textContent,
    ).toBe('Suppe')
    expect(screen.getByRole('button', { name: 'Eintopf' })).toBeInTheDocument()
    expect(shownMealNames()).toEqual(['Eintopf', 'Suppe'])
  })

  it('keeps the room for the mark in every row', () => {
    renderMealsArea([
      meal('soup', 'Suppe', { hidden: true }),
      meal('stew', 'Eintopf'),
    ])

    expect(
      mealRows().map((row) => row.querySelector('.hiddenMark') !== null),
    ).toEqual([true, true])
    expect(
      mealRows().map((row) => row.querySelector('.hiddenMark svg') !== null),
    ).toEqual([false, true])
  })

  it('keeps a meal hidden when it is edited', async () => {
    const { client } = renderMealsArea([
      meal('soup', 'Suppe', { hidden: true }),
    ])

    await openMeal('Suppe, ausgeblendet')
    await editMeal()
    await fillIn('Rezept', 'Kochen.')
    await save()

    expect(client.storedMeals()[0]).toEqual(
      meal('soup', 'Suppe', { hidden: true, recipe: 'Kochen.' }),
    )
  })

  it('marks a new meal as a main meal', async () => {
    const { client } = renderMealsArea()

    await openMealForm()
    await fillIn('Name', 'Linsensuppe')

    expect(mainMealBox()).toBeChecked()

    await save()

    expect(client.storedMeals()[0].kind).toBe('mainMeal')
  })

  it('keeps a meal that is no main meal', async () => {
    const { client } = renderMealsArea()

    await openMealForm()
    await fillIn('Name', 'Milchreis')
    await switchMainMeal()
    await save()

    expect(client.storedMeals()[0].kind).toBe('none')
  })

  it('shows whether the edited meal is a main meal', async () => {
    renderMealsArea([
      meal('rice', 'Milchreis', { kind: 'none' }),
      meal('soup', 'Suppe'),
    ])

    await openMeal('Milchreis')
    await editMeal()

    expect(mainMealBox()).not.toBeChecked()

    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zum Gericht' }),
    )
    await goBackToTheMeals()
    await openMeal('Suppe')
    await editMeal()

    expect(mainMealBox()).toBeChecked()
  })

  it('takes a meal back into the main meals', async () => {
    const { client } = renderMealsArea([
      meal('rice', 'Milchreis', { kind: 'none' }),
    ])

    await openMeal('Milchreis')
    await editMeal()
    await switchMainMeal()
    await save()

    expect(client.storedMeals()[0].kind).toBe('mainMeal')
  })

  it('keeps a meal hidden when its main meal state changes', async () => {
    const { client } = renderMealsArea([
      meal('soup', 'Suppe', { hidden: true }),
    ])

    await openMeal('Suppe, ausgeblendet')
    await editMeal()
    await switchMainMeal()
    await save()

    expect(client.storedMeals()[0]).toEqual(
      meal('soup', 'Suppe', { hidden: true, kind: 'none' }),
    )
  })

  it('forgets the main meal state that was not saved', async () => {
    const { client } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await editMeal()
    await switchMainMeal()
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zum Gericht' }),
    )
    await editMeal()

    expect(mainMealBox()).toBeChecked()
    expect(client.storedMeals()[0].kind).toBe('mainMeal')
  })

  it('leaves a new meal out of the breakfasts', async () => {
    const { client } = renderMealsArea()

    await openMealForm()
    await fillIn('Name', 'Linsensuppe')

    expect(breakfastBox()).not.toBeChecked()
    expect(mainMealBox()).toBeChecked()

    await save()

    expect(client.storedMeals()[0].kind).toBe('mainMeal')
  })

  it('marks a meal as breakfast', async () => {
    const { client } = renderMealsArea()

    await openMealForm()
    await fillIn('Name', 'Milchreis')
    await switchBreakfast()
    await save()

    expect(client.storedMeals()[0].kind).toBe('breakfast')
  })

  it('takes the main meal mark away when a meal becomes breakfast', async () => {
    renderMealsArea()

    await openMealForm()
    await switchBreakfast()

    expect(mainMealBox()).not.toBeChecked()
    expect(breakfastBox()).toBeChecked()
  })

  it('takes the breakfast mark away when a meal becomes a main meal', async () => {
    renderMealsArea([meal('rice', 'Milchreis', { kind: 'breakfast' })])

    await openMeal('Milchreis')
    await editMeal()
    await switchMainMeal()

    expect(breakfastBox()).not.toBeChecked()
    expect(mainMealBox()).toBeChecked()
  })

  it('says which mark it took away', async () => {
    const { announcements } = renderMealsArea([
      meal('rice', 'Milchreis', { kind: 'breakfast' }),
      meal('soup', 'Suppe'),
    ])

    await openMeal('Suppe')
    await editMeal()
    await switchBreakfast()

    expect(announcements).toContain('Hauptgericht abgewählt.')

    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zum Gericht' }),
    )
    await goBackToTheMeals()
    await openMeal('Milchreis')
    await editMeal()
    await switchMainMeal()

    expect(announcements).toContain('Frühstück abgewählt.')
  })

  it('says nothing when a mark is only taken away', async () => {
    const { announcements } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await editMeal()
    await switchMainMeal()

    expect(mainMealBox()).not.toBeChecked()
    expect(breakfastBox()).not.toBeChecked()
    expect(announcements).not.toContain('Hauptgericht abgewählt.')
    expect(announcements).not.toContain('Frühstück abgewählt.')
  })

  it('shows a meal without any kind again', async () => {
    renderMealsArea([meal('rice', 'Milchreis', { kind: 'none' })])

    await openMeal('Milchreis')
    await editMeal()

    expect(mainMealBox()).not.toBeChecked()
    expect(breakfastBox()).not.toBeChecked()
  })

  it('shows whether the edited meal is a breakfast', async () => {
    renderMealsArea([meal('rice', 'Milchreis', { kind: 'breakfast' })])

    await openMeal('Milchreis')
    await editMeal()

    expect(breakfastBox()).toBeChecked()
    expect(mainMealBox()).not.toBeChecked()
  })

  it('forgets the kind that was not saved', async () => {
    const { client } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await editMeal()
    await switchBreakfast()
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zum Gericht' }),
    )
    await editMeal()

    expect(mainMealBox()).toBeChecked()
    expect(breakfastBox()).not.toBeChecked()
    expect(client.storedMeals()[0].kind).toBe('mainMeal')
  })

  it('keeps a meal hidden when its kind changes', async () => {
    const { client } = renderMealsArea([
      meal('soup', 'Suppe', { hidden: true }),
    ])

    await openMeal('Suppe, ausgeblendet')
    await editMeal()
    await switchBreakfast()
    await save()

    expect(client.storedMeals()[0]).toEqual(
      meal('soup', 'Suppe', { hidden: true, kind: 'breakfast' }),
    )
  })

  it('shows the actions of a meal as icons only in one row', async () => {
    renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    const actions = [
      'Auf die Einkaufsliste',
      'Ausblenden',
      'Bearbeiten',
      'Löschen',
    ].map((name) => screen.getByRole('button', { name }))

    expect(actions.map((action) => action.textContent)).toEqual([
      '',
      '',
      '',
      '',
    ])
    expect(Array.from(actions[0].parentElement?.children ?? [])).toEqual(
      actions,
    )
  })

  it('shows a save symbol next to the save text', async () => {
    renderMealsArea()

    await openMealForm()
    const saveButton = screen.getByRole('button', { name: 'Speichern' })

    expect(saveButton.textContent).toBe('Speichern')
    expect(saveButton.firstElementChild?.tagName).toBe('svg')
    expect(saveButton.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('has no accessibility violations on the confirmation page', async () => {
    const { rendered } = renderMealsArea([meal('soup', 'Suppe')])

    await openMeal('Suppe')
    await askToDeleteMeal()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
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

  it('has no accessibility violations on the form of a meal that is no main meal', async () => {
    const { rendered } = renderMealsArea([
      meal('rice', 'Milchreis', { kind: 'none' }),
    ])

    await openMeal('Milchreis')
    await editMeal()

    expect(mainMealBox()).not.toBeChecked()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the form of a breakfast', async () => {
    const { rendered } = renderMealsArea([
      meal('rice', 'Milchreis', { kind: 'breakfast' }),
    ])

    await openMeal('Milchreis')
    await editMeal()

    expect(breakfastBox()).toBeChecked()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the form with an item taken over', async () => {
    const { rendered } = renderMealsArea()

    await openMealForm()
    await takeOverItem('Hackfleisch', '500', 'g')

    expect(
      screen.getByRole('button', { name: 'Entfernen, Hackfleisch, 500 g' }),
    ).toBeInTheDocument()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('suggests names below the item field', async () => {
    renderMealsArea([], ['Hackfleisch', 'Schafskäse', 'Spaghetti'])

    await openMealForm()
    await userEvent.type(screen.getByLabelText('Item'), 'ha')

    expect(
      within(screen.getByRole('list', { name: 'Vorschläge' }))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Hackfleisch', 'Schafskäse'])
  })

  it('takes a suggestion into the item field and moves the focus to the amount', async () => {
    renderMealsArea([], ['Hackfleisch'])

    await openMealForm()
    await userEvent.type(screen.getByLabelText('Item'), 'hack')
    await userEvent.click(screen.getByRole('button', { name: 'Hackfleisch' }))

    expect(screen.getByLabelText('Item')).toHaveValue('Hackfleisch')
    expect(screen.getByLabelText('Menge')).toHaveFocus()
  })

  it('has no accessibility violations on the form with suggestions shown', async () => {
    const { rendered } = renderMealsArea([], ['Hackfleisch'])

    await openMealForm()
    await userEvent.type(screen.getByLabelText('Item'), 'hack')

    expect(screen.getByRole('list', { name: 'Vorschläge' })).toBeInTheDocument()
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

  it('has no accessibility violations on a hidden meal', async () => {
    const { rendered } = renderMealsArea([
      meal('bolognese', 'Bolognese', { hidden: true }),
    ])

    expect(await accessibilityViolations(rendered.container)).toEqual([])

    await openMeal('Bolognese, ausgeblendet')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
