import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { createInMemoryMealsClient } from './meals/api/inMemoryMealsClient'
import { createInMemorySuppliesClient } from './meals/api/inMemorySuppliesClient'
import { createInMemoryWeekPlanClient } from './meals/api/inMemoryWeekPlanClient'
import { toPlanDate } from './meals/domain/planDate'
import type { PlanPeriod } from './meals/domain/planPeriod'
import {
  emptyWeekPlan,
  mealIn,
  planSlotsOf,
  withMealIn,
  type WeekPlan,
} from './meals/domain/weekPlan'
import type { Meal } from './meals/domain/meal'
import type { AppearanceClient } from './shared/appearance/appearanceClient'
import type { Clock } from './shared/domain/clock'
import { createInMemoryAppearanceClient } from './shared/appearance/inMemoryAppearanceClient'
import { useAppearance } from './shared/appearance/useAppearance'
import { SignedInApp } from './SignedInApp'
import { createInMemoryKnownItemsClient } from './shopping/api/inMemoryKnownItemsClient'
import {
  createInMemoryKnownUnitsClient,
  type InMemoryKnownUnitsClient,
} from './shopping/api/inMemoryKnownUnitsClient'
import { createInMemoryShoppingListClient } from './shopping/api/inMemoryShoppingListClient'
import { DEFAULT_UNITS } from './shopping/domain/knownUnit'
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

const aMonday = new Date(2026, 8, 21, 12)
const aFriday = new Date(2026, 8, 25, 12)
const aSaturday = new Date(2026, 8, 26, 12)

const MONDAY = toPlanDate('2026-09-21')
const WEEK: PlanPeriod = { start: MONDAY, days: 7 }
const WEEK_SLOTS = planSlotsOf(WEEK)
const EMPTY_PLAN = emptyWeekPlan(WEEK)

function stoppedAt(date: Date): Clock {
  return () => date
}

function renderSignedInApp(
  initialItems: readonly ShoppingItem[] = [],
  initialMeals: readonly Meal[] = [],
  knownItemsClient = createInMemoryKnownItemsClient(),
  appearanceClient = createInMemoryAppearanceClient(),
  weekPlanClient = createInMemoryWeekPlanClient(EMPTY_PLAN),
  suppliesClient = createInMemorySuppliesClient(),
  clock: Clock = stoppedAt(aMonday),
  knownUnitsClient = createInMemoryKnownUnitsClient(
    DEFAULT_UNITS.map((name) => ({ name, lastUsedAt: 0, timesUsed: 0 })),
  ),
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
      createKnownUnitsClient={() => knownUnitsClient}
      appearanceClient={appearanceClient}
      clock={clock}
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
    knownUnitsClient,
  }
}

function renderWithKnownUnits(
  knownUnitsClient: InMemoryKnownUnitsClient,
  initialMeals: readonly Meal[] = [],
) {
  return renderSignedInApp(
    [],
    initialMeals,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    knownUnitsClient,
  )
}

function knownUnit(name: string, timesUsed = 1, lastUsedAt = 1) {
  return { name, timesUsed, lastUsedAt }
}

async function addShoppingItem(name: string, amount: string, unit = '') {
  await userEvent.click(
    screen.getByRole('button', { name: 'Artikel hinzufügen' }),
  )
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.type(screen.getByLabelText('Menge'), amount)
  if (unit !== '') await userEvent.type(screen.getByLabelText('Einheit'), unit)
  await userEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }))
}

async function writeDownMeal(
  name: string,
  itemName: string,
  amount = '',
  unit = '',
) {
  await goToArea('Gerichte')
  await userEvent.click(
    screen.getByRole('button', { name: 'Gericht hinzufügen' }),
  )
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.type(screen.getByLabelText('Item'), itemName)
  if (amount !== '')
    await userEvent.type(screen.getByLabelText('Menge'), amount)
  if (unit !== '') await userEvent.type(screen.getByLabelText('Einheit'), unit)
  await userEvent.click(screen.getByRole('button', { name: 'Item hinzufügen' }))
  await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))
}

function meal(id: string, name: string, items: Meal['items'] = []): Meal {
  return {
    id,
    name,
    items,
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'mainMeal',
  }
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

function shownShoppingItemNames() {
  return within(screen.getByRole('main'))
    .getAllByRole('checkbox')
    .map((box) => box.getAttribute('aria-label'))
}

function mainMealTimeChoice() {
  return screen.getByRole('combobox', { name: 'Hauptgericht würfeln' })
}

function planOf(...ids: readonly string[]): WeekPlan {
  return ids.reduce<WeekPlan>(
    (plan, id, position) => withMealIn(plan, WEEK_SLOTS[position], id),
    EMPTY_PLAN,
  )
}

function renderSignedInAppOnFriday() {
  return renderSignedInApp(
    [],
    [],
    createInMemoryKnownItemsClient(),
    createInMemoryAppearanceClient(),
    createInMemoryWeekPlanClient(EMPTY_PLAN),
    createInMemorySuppliesClient(),
    stoppedAt(aFriday),
  )
}

async function applyPeriod(start: string, days: number) {
  await userEvent.click(screen.getByRole('button', { name: 'Zeitraum wählen' }))
  fireEvent.change(screen.getByLabelText('Startdatum'), {
    target: { value: start },
  })
  const stepButton = screen.getByRole('button', {
    name: days > 7 ? 'Ein Tag mehr' : 'Ein Tag weniger',
  })
  for (let step = 0; step < Math.abs(days - 7); step++)
    await userEvent.click(stepButton)
  await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }))
}

function shownDayName() {
  return screen.getByRole('heading', { level: 2 })
}

async function planBologneseForBreakfast() {
  await userEvent.type(
    screen.getByRole('textbox', { name: 'Frühstück' }),
    'bolo',
  )
  await userEvent.click(
    within(
      screen.getByRole('list', { name: 'Vorschläge für Frühstück' }),
    ).getByRole('button', { name: 'Bolognese' }),
  )
}

async function transferTheWeekPlan() {
  await userEvent.click(screen.getByRole('button', { name: 'Plan festlegen' }))
  await userEvent.click(
    screen.getByRole('button', { name: 'Auf die Einkaufsliste' }),
  )
}

function editThePlan() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Plan bearbeiten' }),
  )
}

function spentTransferButton() {
  return screen.getByRole('button', { name: 'Schon auf der Einkaufsliste' })
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
      createInMemoryWeekPlanClient(EMPTY_PLAN),
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
      screen.getByRole('heading', { name: 'Wochenplan, keine von 28' }),
    ).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Wochenplan' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens the week plan on the day of today', async () => {
    renderSignedInApp(
      [],
      [],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(EMPTY_PLAN),
      createInMemorySuppliesClient(),
      stoppedAt(aFriday),
    )

    await goToArea('Wochenplan')

    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName(
      'Freitag, 25. September',
    )
  })

  it('keeps the stepped day although the clock moves on', async () => {
    let now = aFriday
    renderSignedInApp(
      [],
      [],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(EMPTY_PLAN),
      createInMemorySuppliesClient(),
      () => now,
    )

    await goToArea('Wochenplan')
    await userEvent.click(
      screen.getByRole('button', { name: 'Vorheriger Tag' }),
    )
    now = aSaturday
    await goToArea('Gerichte')
    await goToArea('Wochenplan')

    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName(
      'Donnerstag, 24. September',
    )
  })

  it('shows today after applying a period that includes it', async () => {
    renderSignedInAppOnFriday()

    await goToArea('Wochenplan')
    await userEvent.click(screen.getByRole('button', { name: 'Nächster Tag' }))
    await applyPeriod('2026-09-24', 7)

    expect(shownDayName()).toHaveAccessibleName('Freitag, 25. September')
  })

  it('shows the first day after applying a period without today', async () => {
    renderSignedInAppOnFriday()

    await goToArea('Wochenplan')
    await applyPeriod('2026-10-01', 3)

    expect(shownDayName()).toHaveAccessibleName('Donnerstag, 1. Oktober')
  })

  it('moves to today when the other device sets a period without the chosen day', async () => {
    const { weekPlanClient } = renderSignedInAppOnFriday()

    await goToArea('Wochenplan')
    await userEvent.click(screen.getByRole('button', { name: 'Nächster Tag' }))

    expect(shownDayName()).toHaveAccessibleName('Samstag, 26. September')

    act(() =>
      weekPlanClient.weekPlanArrivesFromElsewhere(
        emptyWeekPlan({ start: toPlanDate('2026-09-25'), days: 1 }),
      ),
    )

    expect(shownDayName()).toHaveAccessibleName('Freitag, 25. September')
  })

  it('keeps the shown day after a visit to the meals area', async () => {
    renderSignedInApp()

    await goToArea('Wochenplan')
    await userEvent.click(screen.getByRole('button', { name: 'Nächster Tag' }))
    await goToArea('Gerichte')
    await goToArea('Wochenplan')

    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName(
      'Dienstag, 22. September',
    )
  })

  it('opens the week plan in the day view', async () => {
    renderSignedInApp()

    await goToArea('Wochenplan')

    expect(
      screen.getByRole('button', { name: 'Wochenansicht' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: 'Dienstag, 22. September' }),
    ).toBeNull()
  })

  it('keeps the week view after a visit to the meals area', async () => {
    renderSignedInApp()

    await goToArea('Wochenplan')
    await userEvent.click(screen.getByRole('button', { name: 'Wochenansicht' }))
    await goToArea('Gerichte')
    await goToArea('Wochenplan')

    expect(
      screen.getByRole('textbox', { name: 'Montag, 21. September' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Tagesansicht' }),
    ).toBeInTheDocument()
  })

  it('keeps the chosen meal time after a visit to the meals area', async () => {
    renderSignedInApp()

    await goToArea('Wochenplan')
    await userEvent.click(screen.getByRole('button', { name: 'Wochenansicht' }))
    await userEvent.click(screen.getByRole('button', { name: 'Snack' }))
    await goToArea('Gerichte')
    await goToArea('Wochenplan')

    expect(screen.getByRole('button', { name: 'Snack' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('keeps a planned meal for the whole household', async () => {
    const { weekPlanClient } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
    )

    await goToArea('Wochenplan')
    await planBologneseForBreakfast()

    expect(
      mealIn(weekPlanClient.storedWeekPlan(), {
        date: MONDAY,
        time: 'breakfast',
      }),
    ).toBe('bolognese')
  })

  it('says which meal was planned by hand for which meal time', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
    )

    await goToArea('Wochenplan')
    await planBologneseForBreakfast()

    expect(announcements).toEqual(['Frühstück, Bolognese.'])
  })

  it('says that the meal planned by hand is kept in store', async () => {
    const { announcements } = renderSignedInApp(
      [],
      [meal('bolognese', 'Bolognese')],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(EMPTY_PLAN),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 2 }]),
    )

    await goToArea('Wochenplan')
    await planBologneseForBreakfast()

    expect(announcements).toEqual(['Frühstück, Bolognese, im Vorrat.'])
    expect(
      screen.getByRole('textbox', { name: 'Frühstück, im Vorrat' }),
    ).toHaveValue('Bolognese')
  })

  it('says nothing of a supply that an earlier meal time has used up', async () => {
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
      screen.getByRole('textbox', { name: 'Abendessen' }),
      'bolo',
    )
    await userEvent.click(
      within(
        screen.getByRole('list', { name: 'Vorschläge für Abendessen' }),
      ).getByRole('button', { name: 'Bolognese' }),
    )

    expect(announcements).toEqual(['Abendessen, Bolognese.'])
    expect(
      screen.getByRole('textbox', { name: 'Frühstück, im Vorrat' }),
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

    expect(shownShoppingItemNames()).toEqual([
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

  it('leaves the items of a covered meal off the shopping list', async () => {
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
      'Wochenplan, 1 Artikel hinzugefügt. 1 Gericht aus dem Vorrat entnommen.',
    )
    expect(suppliesClient.storedSupplies()).toEqual([])

    await goToArea('Einkaufsliste')

    expect(shownShoppingItemNames()).toEqual(['Bohnen'])
  })

  it('buys the meal that the supply no longer reaches', async () => {
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
      'Wochenplan, 1 Artikel hinzugefügt. 1 Gericht aus dem Vorrat entnommen.',
    )

    await goToArea('Einkaufsliste')

    expect(shownShoppingItemNames()).toEqual(['Hackfleisch, 500 g'])
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
      'Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.',
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
      'Wochenplan, 1 Artikel hinzugefügt. 1 Gericht aus dem Vorrat entnommen.',
    )
    expect(announcements).not.toContain(
      'Wochenplan, 1 Artikel hinzugefügt. 1 Gericht aus dem Vorrat entnommen. Suppe hat keine Einkaufs-Items.',
    )
  })

  it('keeps what the week plan did not eat of a supply', async () => {
    const { suppliesClient } = renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese', 'bolognese')),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 3 }]),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(suppliesClient.storedSupplies()).toEqual([
      { mealId: 'bolognese', count: 1 },
    ])
    expect(
      screen.getByText('Frühstück, Bolognese, im Vorrat'),
    ).toBeInTheDocument()
  })

  it('leaves a supply alone that the week plan does not touch', async () => {
    const { suppliesClient } = renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
        meal('chili', 'Chili', [{ name: 'Bohnen', quantity: null }]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese')),
      createInMemorySuppliesClient([{ mealId: 'chili', count: 2 }]),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(suppliesClient.storedSupplies()).toEqual([
      { mealId: 'chili', count: 2 },
    ])
  })

  it('offers no second transfer of a fixed plan', async () => {
    const { suppliesClient } = renderSignedInApp(
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
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 2 }]),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()
    await userEvent.click(spentTransferButton())

    expect(spentTransferButton()).toHaveAttribute('aria-disabled', 'true')
    expect(suppliesClient.storedSupplies()).toEqual([
      { mealId: 'bolognese', count: 1 },
    ])

    await goToArea('Einkaufsliste')

    expect(shownShoppingItemNames()).toEqual(['Bohnen'])
  })

  it('buys the covered meal once the plan is fixed anew', async () => {
    const { suppliesClient } = renderSignedInApp(
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
    await editThePlan()
    await transferTheWeekPlan()

    expect(suppliesClient.storedSupplies()).toEqual([])

    await goToArea('Einkaufsliste')

    expect(shownShoppingItemNames()).toEqual([
      'Bohnen, 2',
      'Hackfleisch, 500 g',
    ])
  })

  it('keeps the snowflake of a spent supply until the plan is edited', async () => {
    renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(planOf('bolognese')),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 1 }]),
    )

    await goToArea('Wochenplan')
    await transferTheWeekPlan()

    expect(
      screen.getByText('Frühstück, Bolognese, im Vorrat'),
    ).toBeInTheDocument()

    await editThePlan()

    expect(screen.getByRole('textbox', { name: 'Frühstück' })).toHaveValue(
      'Bolognese',
    )
  })

  it('spends nothing of the supply while a meal is being planned', async () => {
    const { suppliesClient } = renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese', [
          { name: 'Hackfleisch', quantity: null },
        ]),
      ],
      createInMemoryKnownItemsClient(),
      createInMemoryAppearanceClient(),
      createInMemoryWeekPlanClient(EMPTY_PLAN),
      createInMemorySuppliesClient([{ mealId: 'bolognese', count: 2 }]),
    )

    await goToArea('Wochenplan')
    await planBologneseForBreakfast()

    expect(
      screen.getByRole('textbox', { name: 'Frühstück, im Vorrat' }),
    ).toHaveValue('Bolognese')
    expect(suppliesClient.storedSupplies()).toEqual([
      { mealId: 'bolognese', count: 2 },
    ])
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
    expect(screen.getByText('Frühstück, Bolognese')).toBeInTheDocument()
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

    expect(shownShoppingItemNames()).toEqual(['Brot', 'Milch', 'Käse'])
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

    expect(shownShoppingItemNames()).toEqual(['Brot', 'Milch', 'Käse'])
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

    expect(shownShoppingItemNames()).toEqual([
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

    expect(shownShoppingItemNames()).toEqual([
      'Hackfleisch, 1000 g',
      'Spaghetti, 2',
    ])
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

    expect(shownShoppingItemNames()).toEqual(['Hackfleisch'])
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

  it('fills an empty unit catalog with the defaults, the history and the meals', async () => {
    const knownUnitsClient = createInMemoryKnownUnitsClient(
      [],
      [
        {
          ...openItem('flour', 'Mehl', 1),
          quantity: { amount: 500, unit: 'g' },
        },
      ],
    )
    renderWithKnownUnits(knownUnitsClient, [
      meal('aioli', 'Aioli', [
        { name: 'Knoblauch', quantity: { amount: 2, unit: 'Zehe' } },
      ]),
    ])

    await waitFor(() =>
      expect(
        knownUnitsClient.storedKnownUnits().map((unit) => unit.name),
      ).toEqual(expect.arrayContaining([...DEFAULT_UNITS, 'Zehe'])),
    )
    expect(knownUnitsClient.storedKnownUnits()).toHaveLength(7)
    expect(knownUnitsClient.storedKnownUnits()).toContainEqual(
      knownUnit('g', 1, 1),
    )
    expect(knownUnitsClient.storedKnownUnits()).toContainEqual(
      knownUnit('Zehe', 1, 0),
    )
  })

  it('leaves a unit catalog that is already filled alone', async () => {
    const knownUnitsClient = createInMemoryKnownUnitsClient([knownUnit('Zehe')])
    renderWithKnownUnits(knownUnitsClient, [
      meal('bolognese', 'Bolognese', [
        { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
      ]),
    ])

    await act(async () => {})

    expect(knownUnitsClient.storedKnownUnits()).toEqual([knownUnit('Zehe')])
  })

  it('takes over the spelling of a known unit on the shopping list', async () => {
    const { client } = renderSignedInApp()

    await addShoppingItem('Zucker', '500', 'G')

    expect(client.storedItems()[0].quantity).toEqual({ amount: 500, unit: 'g' })
  })

  it('remembers the unit of an item that lands on the shopping list', async () => {
    const knownUnitsClient = createInMemoryKnownUnitsClient([
      knownUnit('g', 0, 0),
    ])
    renderWithKnownUnits(knownUnitsClient, [
      meal('bolognese', 'Bolognese', [
        { name: 'Hackfleisch', quantity: { amount: 500, unit: 'g' } },
      ]),
    ])

    await addShoppingItem('Zucker', '500', 'g')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zur Liste' }),
    )
    await goToArea('Gerichte')
    await transferToShoppingList('Bolognese')

    expect(knownUnitsClient.storedKnownUnits()).toEqual([
      expect.objectContaining({ name: 'g', timesUsed: 2 }),
    ])
    expect(knownUnitsClient.storedKnownUnits()[0].lastUsedAt).toBeGreaterThan(0)
  })

  it('remembers nothing for an item without a unit', async () => {
    const { knownUnitsClient } = renderSignedInApp()

    await addShoppingItem('Eier', '6')

    expect(knownUnitsClient.storedKnownUnits()).toEqual(
      DEFAULT_UNITS.map((name) => knownUnit(name, 0, 0)),
    )
  })

  it('suggests the units of the meals on the shopping list', async () => {
    renderSignedInApp(
      [],
      [
        meal('aioli', 'Aioli', [
          { name: 'Knoblauch', quantity: { amount: 2, unit: 'Zehe' } },
        ]),
      ],
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Artikel hinzufügen' }),
    )
    await userEvent.type(screen.getByLabelText('Einheit'), 'Ze')

    expect(
      within(
        screen.getByRole('list', { name: 'Einheiten-Vorschläge' }),
      ).getByRole('button', { name: 'Zehe' }),
    ).toBeInTheDocument()
  })

  it('remembers the name and the unit of a new meal item in both catalogs', async () => {
    const knownItemsClient = createInMemoryKnownItemsClient()
    const knownUnitsClient = createInMemoryKnownUnitsClient([
      knownUnit('g', 0, 0),
    ])
    renderSignedInApp(
      [],
      [],
      knownItemsClient,
      undefined,
      undefined,
      undefined,
      undefined,
      knownUnitsClient,
    )

    await writeDownMeal('Aioli', 'Knoblauch', '2', 'Zehe')

    expect(knownItemsClient.storedKnownItems()).toEqual([
      expect.objectContaining({ name: 'Knoblauch', timesUsed: 1 }),
    ])
    expect(knownUnitsClient.storedKnownUnits()).toEqual([
      knownUnit('g', 0, 0),
      expect.objectContaining({ name: 'Zehe', timesUsed: 1 }),
    ])
  })

  it('keeps the catalog spelling of a name remembered from a meal', async () => {
    const knownItemsClient = createInMemoryKnownItemsClient([
      { name: 'Hackfleisch', lastUsedAt: 1, timesUsed: 1 },
    ])
    renderSignedInApp([], [], knownItemsClient)

    await writeDownMeal('Bolognese', 'hackfleisch')

    expect(knownItemsClient.storedKnownItems()).toEqual([
      expect.objectContaining({ name: 'Hackfleisch', timesUsed: 2 }),
    ])
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
      screen.getByRole('button', { name: 'Artikel-Verwaltung' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Artikel-Verwaltung, 1' }),
    ).toBeInTheDocument()
  })

  it('opens the category management from the settings', async () => {
    renderSignedInApp(
      [],
      [{ ...meal('bolognese', 'Bolognese'), categories: ['Nudelgericht'] }],
    )

    await goToArea('Einstellungen')
    await userEvent.click(
      screen.getByRole('button', { name: 'Kategorie-Verwaltung' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Kategorie-Verwaltung, 1' }),
    ).toBeInTheDocument()
  })

  it('opens the unit management from the settings', async () => {
    renderSignedInApp()

    await goToArea('Einstellungen')
    await userEvent.click(
      screen.getByRole('button', { name: 'Einheiten-Verwaltung' }),
    )

    expect(
      screen.getByRole('heading', {
        name: `Einheiten-Verwaltung, ${DEFAULT_UNITS.length}`,
      }),
    ).toBeInTheDocument()
  })

  it('offers to invert the colours above the known items', async () => {
    renderSignedInApp()

    await goToArea('Einstellungen')

    expect(shownItemNames()).toEqual([
      'Farben invertieren',
      expect.stringMatching(/^Hauptgericht würfeln/),
      'Artikel-Verwaltung',
      'Kategorie-Verwaltung',
      'Einheiten-Verwaltung',
    ])
    expect(
      screen.getByRole('switch', { name: 'Farben invertieren' }),
    ).not.toBeChecked()
  })

  it('offers the main meal time below the inverted colours', async () => {
    renderSignedInApp()

    await goToArea('Einstellungen')

    const rows = within(screen.getByRole('main')).getAllByRole('listitem')
    const mainMealTime = within(rows[1]).getByRole('combobox', {
      name: 'Hauptgericht würfeln',
    })
    expect(mainMealTime).toHaveDisplayValue('Mittags oder abends')
    expect(
      within(mainMealTime)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Mittags oder abends', 'Nur mittags', 'Nur abends'])
  })

  it('remembers the main meal time for the household', async () => {
    const { weekPlanClient } = renderSignedInApp()

    await goToArea('Einstellungen')
    await userEvent.selectOptions(mainMealTimeChoice(), 'Nur abends')

    expect(mainMealTimeChoice()).toHaveDisplayValue('Nur abends')
    expect(weekPlanClient.storedMainMealTimeRule()).toBe('dinner')
  })

  it('shows the main meal time chosen on the other device', async () => {
    const { weekPlanClient } = renderSignedInApp()

    await goToArea('Einstellungen')
    act(() => weekPlanClient.mainMealTimeRuleArrivesFromElsewhere('lunch'))

    expect(mainMealTimeChoice()).toHaveDisplayValue('Nur mittags')
  })

  it('rolls the main meal of the week at the time chosen in the settings', async () => {
    const { weekPlanClient } = renderSignedInApp(
      [],
      [
        meal('bolognese', 'Bolognese'),
        { ...meal('bread', 'Brot'), kind: 'none' },
      ],
    )

    await goToArea('Einstellungen')
    await userEvent.selectOptions(mainMealTimeChoice(), 'Nur abends')
    await goToArea('Wochenplan')
    await userEvent.click(
      screen.getByRole('button', { name: 'Zufallsauswahl generieren' }),
    )

    const rolled = weekPlanClient.storedWeekPlan()
    expect(
      WEEK_SLOTS.filter((slot) => mealIn(rolled, slot) === 'bolognese').map(
        (slot) => slot.time,
      ),
    ).toEqual(Array.from({ length: 7 }, () => 'dinner'))
  })

  it('says nothing of its own when the main meal time changes', async () => {
    const { announcements } = renderSignedInApp()

    await goToArea('Einstellungen')
    await userEvent.selectOptions(mainMealTimeChoice(), 'Nur mittags')

    expect(announcements).toEqual([])
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
