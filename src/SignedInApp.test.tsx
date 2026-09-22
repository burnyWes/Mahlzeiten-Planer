import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { createInMemoryMealsClient } from './meals/api/inMemoryMealsClient'
import { createInMemorySuppliesClient } from './meals/api/inMemorySuppliesClient'
import { createInMemoryWeekPlanClient } from './meals/api/inMemoryWeekPlanClient'
import {
  EMPTY_WEEK_PLAN,
  WEEKDAYS,
  withMealOnDay,
  type WeekPlan,
} from './meals/domain/weekPlan'
import type { Meal } from './meals/domain/meal'
import type { AppearanceClient } from './shared/appearance/appearanceClient'
import { createInMemoryAppearanceClient } from './shared/appearance/inMemoryAppearanceClient'
import { useAppearance } from './shared/appearance/useAppearance'
import { SignedInApp } from './SignedInApp'
import { createInMemoryKnownItemsClient } from './shopping/api/inMemoryKnownItemsClient'
import { createInMemoryShoppingListClient } from './shopping/api/inMemoryShoppingListClient'
import type { ShoppingItem } from './shopping/domain/shoppingItem'
import { accessibilityViolations } from './testSupport/accessibility'

function openItem(id: string, name: string, createdAt: number): ShoppingItem {
  return { id, name, quantity: null, createdAt, checkedOffAt: null }
}

type SignedInAppWithAppearanceProps = Omit<
  ComponentProps<typeof SignedInApp>,
  'appearance'
> & { appearanceClient: AppearanceClient }

function SignedInAppWithAppearance({
  appearanceClient,
  ...props
}: SignedInAppWithAppearanceProps) {
  return <SignedInApp {...props} appearance={useAppearance(appearanceClient)} />
}

function renderSignedInApp(
  initialItems: readonly ShoppingItem[] = [],
  initialMeals: readonly Meal[] = [],
  knownItemsClient = createInMemoryKnownItemsClient(),
  appearanceClient = createInMemoryAppearanceClient(),
  weekPlanClient = createInMemoryWeekPlanClient(),
  suppliesClient = createInMemorySuppliesClient(),
) {
  const client = createInMemoryShoppingListClient(initialItems)
  const announcements: string[] = []
  const rendered = render(
    <SignedInAppWithAppearance
      createShoppingListClient={() => client}
      createMealsClient={() => createInMemoryMealsClient(initialMeals)}
      createWeekPlanClient={() => weekPlanClient}
      createSuppliesClient={() => suppliesClient}
      createKnownItemsClient={() => knownItemsClient}
      appearanceClient={appearanceClient}
      announce={(text) => {
        announcements.push(text)
      }}
    />,
  )
  return {
    client,
    announcements,
    rendered,
    appearanceClient,
    weekPlanClient,
    suppliesClient,
  }
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

function planOf(...ids: readonly string[]): WeekPlan {
  return ids.reduce<WeekPlan>(
    (plan, id, position) => withMealOnDay(plan, WEEKDAYS[position], id),
    EMPTY_WEEK_PLAN,
  )
}

async function planBologneseOnMonday() {
  await userEvent.type(screen.getByRole('textbox', { name: 'Montag' }), 'bolo')
  await userEvent.click(
    within(
      screen.getByRole('list', { name: 'Vorschläge für Montag' }),
    ).getByRole('button', { name: 'Bolognese' }),
  )
}

function transferTheWeekPlan() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Auf die Einkaufsliste' }),
  )
}

function tabNames() {
  return within(screen.getByRole('navigation'))
    .getAllByRole('button')
    .map((tab) => tab.getAttribute('aria-label') ?? tab.textContent)
}

describe('SignedInApp', () => {
  it('names the five areas in the order of their use', () => {
    renderSignedInApp()

    expect(tabNames()).toEqual([
      'Einkaufsliste',
      'Wochenplan',
      'Gerichte',
      'Vorräte',
      'Einstellungen',
    ])
    expect(
      within(screen.getByRole('navigation'))
        .getAllByRole('button')
        .map((tab) => tab.textContent),
    ).toEqual(['', '', '', '', ''])
  })

  it('switches to the supplies and marks them as the current area', async () => {
    renderSignedInApp()

    await goToArea('Vorräte')

    expect(
      screen.getByRole('heading', { name: 'Vorräte, keine' }),
    ).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Vorräte' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens the supplies with nothing kept in store', async () => {
    renderSignedInApp()

    await goToArea('Vorräte')

    expect(
      screen.getByRole('heading', { name: 'Vorräte, keine' }),
    ).toHaveFocus()
    expect(
      screen.getByRole('button', { name: 'Vorrat hinzufügen' }),
    ).toBeInTheDocument()
  })

  it('keeps a supply for a meal of the household', async () => {
    const { suppliesClient, announcements } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
    )

    await goToArea('Vorräte')
    await userEvent.click(
      screen.getByRole('button', { name: 'Vorrat hinzufügen' }),
    )
    await userEvent.type(screen.getByLabelText('Gericht'), 'Bolognese')
    await userEvent.clear(screen.getByLabelText('Menge'))
    await userEvent.type(screen.getByLabelText('Menge'), '3')
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(suppliesClient.storedSupplies()).toEqual([
      { mealId: 'bolognese', count: 3 },
    ])
    expect(announcements).toContain('Bolognese, 3.')
  })

  it('has no accessibility violations on the supplies', async () => {
    const { rendered } = renderSignedInApp()

    await goToArea('Vorräte')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('lets the supply of a deleted meal go with it', async () => {
    const { suppliesClient } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
    )

    await goToArea('Vorräte')
    await userEvent.click(
      screen.getByRole('button', { name: 'Vorrat hinzufügen' }),
    )
    await userEvent.type(screen.getByLabelText('Gericht'), 'Bolognese')
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(suppliesClient.storedSupplies()).toHaveLength(1)

    await goToArea('Gerichte')
    await userEvent.click(screen.getByRole('button', { name: 'Bolognese' }))
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    await goToArea('Vorräte')

    expect(suppliesClient.storedSupplies()).toEqual([])
    expect(
      screen.getByRole('heading', { name: 'Vorräte, keine' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations on the inverted supplies', async () => {
    const { rendered } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(true),
      createInMemoryWeekPlanClient(),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 3 }]),
    )

    await goToArea('Vorräte')

    expect(
      screen.getByRole('button', { name: 'Mehr, Bolognese' }),
    ).toBeInTheDocument()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('switches to the week plan and marks it as the current area', async () => {
    renderSignedInApp()

    await goToArea('Wochenplan')

    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 7' }),
    ).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Wochenplan' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('keeps a planned day for the whole household', async () => {
    const { weekPlanClient } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
    )

    await goToArea('Wochenplan')
    await planBologneseOnMonday()

    expect(weekPlanClient.storedWeekPlan().monday).toBe('bolognese')
  })

  it('says which meal was planned by hand on which day', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
    )

    await goToArea('Wochenplan')
    await planBologneseOnMonday()

    expect(announcements).toEqual(['Montag, Bolognese.'])
  })

  it('says that the meal planned by hand is kept in store', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 2 }]),
    )

    await goToArea('Wochenplan')
    await planBologneseOnMonday()

    expect(announcements).toEqual(['Montag, Bolognese, im Vorrat.'])
    expect(
      screen.getByRole('textbox', { name: 'Montag, im Vorrat' }),
    ).toHaveValue('Bolognese')
  })

  it('says nothing of a supply that a further day has used up', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese')),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 1 }]),
    )

    await goToArea('Wochenplan')
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Mittwoch' }),
      'bolo',
    )
    await userEvent.click(
      within(
        screen.getByRole('list', { name: 'Vorschläge für Mittwoch' }),
      ).getByRole('button', { name: 'Bolognese' }),
    )

    expect(announcements).toEqual(['Mittwoch, Bolognese.'])
    expect(
      screen.getByRole('textbox', { name: 'Montag, im Vorrat' }),
    ).toHaveValue('Bolognese')
  })

  it('gathers the items of the planned meals on the shopping list', async () => {
    const { announcements } = renderSignedInApp(
      [openItem('bread', 'Brot', 1)],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
          { name: 'Brot', quantity: null },
        ]),
        meal('chili', 'Chili', [
          { name: 'Bohnen', quantity: null },
          { name: 'Brot', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese', 'chili')),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(announcements).toContain(
      'Wochenplan, 3 Artikel hinzugefügt. 1 zusammengefasst.',
    )

    await goToArea('Einkaufsliste')

    expect(shownItemNames()).toEqual([
      'Brot, 3',
      'Hackfleisch, 500 g',
      'Bohnen',
    ])
  })

  it('names a planned meal without items once, however often it is planned', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [
        meal('soup', 'Suppe'),
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('soup', 'bolognese', 'soup')),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(announcements).toContain(
      'Wochenplan, 1 Artikel hinzugefügt. Suppe hat keine Einkaufs-Items.',
    )
  })

  it('leaves the items of a covered day off the shopping list', async () => {
    const { announcements, suppliesClient } = renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
        ]),
        meal('chili', 'Chili', [{ name: 'Bohnen', quantity: null }]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese', 'chili')),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 1 }]),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(announcements).toContain(
      'Wochenplan, 1 Artikel hinzugefügt. 1 Tag aus dem Vorrat.',
    )
    expect(suppliesClient.storedSupplies()).toEqual([
      { mealId: 'bolognese', count: 1 },
    ])

    await goToArea('Einkaufsliste')

    expect(shownItemNames()).toEqual(['Bohnen'])
  })

  it('buys the day that the supply no longer reaches', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese', 'bolognese')),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 1 }]),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(announcements).toContain(
      'Wochenplan, 1 Artikel hinzugefügt. 1 Tag aus dem Vorrat.',
    )

    await goToArea('Einkaufsliste')

    expect(shownItemNames()).toEqual(['Hackfleisch, 500 g'])
  })

  it('says that the whole week came out of the supply', async () => {
    const { client, announcements } = renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese', 'bolognese')),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 2 }]),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(announcements).toContain(
      'Wochenplan, alle Gerichte aus dem Vorrat, nichts hinzugefügt.',
    )
    expect(client.storedItems()).toEqual([])
  })

  it('spares the hint about a covered meal without items', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [
        meal('soup', 'Suppe'),
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('soup', 'bolognese')),
      createInMemorySuppliesClient([{ mealId: 'soup', count: 1 }]),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(announcements).toContain(
      'Wochenplan, 1 Artikel hinzugefügt. 1 Tag aus dem Vorrat.',
    )
    expect(announcements).not.toContain(
      'Wochenplan, 1 Artikel hinzugefügt. 1 Tag aus dem Vorrat. Suppe hat keine Einkaufs-Items.',
    )
  })

  it('leaves the week plan standing after the transfer', async () => {
    const weekPlanClient = createInMemoryWeekPlanClient(planOf('bolognese'))
    renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      weekPlanClient,
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(weekPlanClient.storedWeekPlan()).toEqual(planOf('bolognese'))
    expect(screen.getByRole('textbox', { name: 'Montag' })).toHaveValue(
      'Bolognese',
    )
  })

  it('counts an item of the week plan once per transfer', async () => {
    const knownItemsClient = createInMemoryKnownItemsClient()
    renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
      knownItemsClient,
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese', 'bolognese')),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(knownItemsClient.storedKnownItems()).toEqual([
      expect.objectContaining({ name: 'Hackfleisch', timesUsed: 1 }),
    ])
  })

  it('has no accessibility violations on the week plan', async () => {
    const { rendered } = renderSignedInApp([], [meal('bolognese', 'Bolognese')])

    await goToArea('Wochenplan')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

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

  it('leaves the shopping list as it was after a visit to the supplies', async () => {
    renderSignedInApp([
      openItem('bread', 'Brot', 1),
      openItem('milk', 'Milch', 2),
      openItem('cheese', 'Käse', 3),
    ])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    await goToArea('Vorräte')
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

  it('keeps the groomed name when a meal is transferred', async () => {
    renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'hackfleisch', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient([
        { name: 'Hackfleisch', lastUsedAt: 1, timesUsed: 1 },
      ]),
    )

    await goToArea('Gerichte')
    await transferToShoppingList('Bolognese')
    await goToArea('Einkaufsliste')

    expect(shownItemNames()).toEqual(['Hackfleisch'])
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

  it('suggests an item of a meal that was never bought while adding an item', async () => {
    renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Artikel hinzufügen' }),
    )
    await userEvent.type(screen.getByLabelText('Name'), 'hack')

    expect(
      within(screen.getByRole('list', { name: 'Vorschläge' })).getByRole(
        'button',
        { name: 'Hackfleisch' },
      ),
    ).toBeInTheDocument()
  })

  it('suggests a bought item in the meal editor', async () => {
    renderSignedInApp(
      [],
      [],
      createInMemoryKnownItemsClient([
        { name: 'Hafermilch', lastUsedAt: 1, timesUsed: 1 },
      ]),
    )

    await goToArea('Gerichte')
    await userEvent.click(
      screen.getByRole('button', { name: 'Gericht hinzufügen' }),
    )
    await userEvent.type(screen.getByLabelText('Item'), 'milch')

    expect(
      within(screen.getByRole('list', { name: 'Vorschläge' })).getByRole(
        'button',
        { name: 'Hafermilch' },
      ),
    ).toBeInTheDocument()
  })

  it('reaches the settings through the gear button', async () => {
    renderSignedInApp()

    const settings = screen.getByRole('button', { name: 'Einstellungen' })
    expect(settings.textContent).toBe('')

    await goToArea('Einstellungen')

    expect(
      screen.getByRole('button', { name: 'Einstellungen' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('heading', { name: 'Einstellungen' }),
    ).toBeInTheDocument()
  })

  it('opens the known items from the settings', async () => {
    renderSignedInApp(
      [],
      [],
      createInMemoryKnownItemsClient([
        { name: 'Hafermilch', lastUsedAt: 1, timesUsed: 1 },
      ]),
    )

    await goToArea('Einstellungen')
    await userEvent.click(
      screen.getByRole('button', { name: 'Artikelverwaltung' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Artikelverwaltung, 1' }),
    ).toBeInTheDocument()
  })

  it('offers to invert the colours above the known items', async () => {
    renderSignedInApp()

    await goToArea('Einstellungen')

    expect(shownItemNames()).toEqual([
      'Farben invertieren',
      'Artikelverwaltung',
    ])
    expect(
      screen.getByRole('switch', { name: 'Farben invertieren' }),
    ).not.toBeChecked()
  })

  it('remembers the inverted colours on this device', async () => {
    const { appearanceClient } = renderSignedInApp()

    await goToArea('Einstellungen')
    await userEvent.click(
      screen.getByRole('switch', { name: 'Farben invertieren' }),
    )

    expect(
      screen.getByRole('switch', { name: 'Farben invertieren' }),
    ).toBeChecked()
    expect(appearanceClient.storedInvertedColors()).toBe(true)
  })

  it('says nothing of its own when the colours are inverted', async () => {
    const { announcements } = renderSignedInApp()

    await goToArea('Einstellungen')
    await userEvent.click(
      screen.getByRole('switch', { name: 'Farben invertieren' }),
    )

    expect(announcements).toEqual([])
  })

  it('has no accessibility violations on the settings', async () => {
    const { rendered } = renderSignedInApp()

    await goToArea('Einstellungen')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the inverted settings', async () => {
    const { rendered } = renderSignedInApp(
      [],
      [],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(true),
    )

    await goToArea('Einstellungen')

    expect(await accessibilityViolations(rendered.container)).toEqual([])
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
