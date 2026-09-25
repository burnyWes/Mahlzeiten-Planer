import { expect, test } from '@playwright/test'
import {
  hiddenMealNamesOnServer,
  mealIdOnServer,
  prepareEmulators,
  settleWrites,
  storeMealOnServer,
  storeWeekdayPlanOnServer,
  supplyCountsOnServer,
  weekPlanMealNamesOnServer,
  weekPlanOnServer,
  weekPlanStageOnServer,
} from './emulatorHousehold.ts'
import {
  chooseSuggestion,
  pressButton,
  shownShoppingItems,
  signIn,
  stepToDay,
  takeOverItem,
  typeInto,
} from './keyboard.ts'

const A_MONDAY = new Date('2026-09-21T12:00:00')
const A_FRIDAY = new Date('2026-09-25T12:00:00')

const WEEK_DATES = [
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
]

async function mainMealsOnServer() {
  const planned = await weekPlanMealNamesOnServer()
  return WEEK_DATES.map((day) =>
    [planned[`${day}.lunch`], planned[`${day}.dinner`]].filter(Boolean),
  )
}

test.beforeEach(async ({ page }) => {
  await prepareEmulators()
  await page.clock.setFixedTime(A_MONDAY)
})

test.afterEach(async ({ page }) => {
  await settleWrites(page)
})

test('plans a week and puts its items on the shopping list', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await takeOverItem(page, 'Hackfleisch', '500', 'g')
  await takeOverItem(page, 'Spaghetti')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Wochenplan')
  await chooseSuggestion(page, 'Mittagessen', 'bolo', 'Bolognese')

  await expect(
    page.getByRole('heading', { name: 'Wochenplan, 1 von 28' }),
  ).toBeVisible()

  await pressButton(page, 'Zufallsauswahl generieren')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan neu gewürfelt, 7 von 28 Gerichten.',
  )
  await expect(
    page.getByRole('heading', { name: 'Wochenplan, 7 von 28' }),
  ).toBeVisible()
  await expect
    .poll(async () => Object.values(await weekPlanOnServer()).filter(Boolean))
    .toHaveLength(7)

  await pressButton(page, 'Plan festlegen')
  await pressButton(page, 'Auf die Einkaufsliste')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan, 2 Artikel hinzugefügt.',
  )

  await pressButton(page, 'Einkaufsliste')

  await expect
    .poll(() => shownShoppingItems(page))
    .toEqual(['Hackfleisch, 3500 g', 'Spaghetti, 7'])
})

test('buys only the meal that the supply no longer covers', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await takeOverItem(page, 'Hackfleisch', '500', 'g')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Chili')
  await takeOverItem(page, 'Bohnen')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Vorräte')
  await pressButton(page, 'Vorrat hinzufügen')
  await chooseSuggestion(page, 'Gericht', 'bolo', 'Bolognese')
  await page.getByLabel('Menge', { exact: true }).fill('1')
  await pressButton(page, 'Speichern')

  await pressButton(page, 'Wochenplan')
  await chooseSuggestion(page, 'Mittagessen', 'bolo', 'Bolognese')
  await chooseSuggestion(page, 'Abendessen', 'chi', 'Chili')
  await stepToDay(page, 'Dienstag, 22. September')
  await chooseSuggestion(page, 'Mittagessen', 'bolo', 'Bolognese')

  await expect(page.getByLabel('Mittagessen', { exact: true })).toHaveValue(
    'Bolognese',
  )

  await pressButton(page, 'Vorheriger Tag')

  await expect(
    page.getByLabel('Mittagessen, im Vorrat', { exact: true }),
  ).toHaveValue('Bolognese')

  await pressButton(page, 'Plan festlegen')
  await pressButton(page, 'Auf die Einkaufsliste')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan, 2 Artikel hinzugefügt. 1 Gericht aus dem Vorrat entnommen.',
  )
  await expect.poll(supplyCountsOnServer).toEqual([])

  await pressButton(page, 'Einkaufsliste')

  await expect
    .poll(() => shownShoppingItems(page))
    .toEqual(['Bohnen', 'Hackfleisch, 500 g'])
})

test('keeps the week plan after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Linsensuppe')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Wochenplan')
  await stepToDay(page, 'Freitag, 25. September')
  await chooseSuggestion(page, 'Abendessen', 'linsen', 'Linsensuppe')

  await expect
    .poll(async () => (await weekPlanOnServer())['2026-09-25.dinner'])
    .toEqual(expect.any(String))

  await page.reload()
  await pressButton(page, 'Wochenplan')
  await stepToDay(page, 'Freitag, 25. September')

  await expect(page.getByLabel('Abendessen', { exact: true })).toHaveValue(
    'Linsensuppe',
  )
})

test('shows a plan of weekdays on the dates of this week', async ({ page }) => {
  await storeMealOnServer('Linsensuppe')
  await storeWeekdayPlanOnServer({
    friday: { lunch: await mealIdOnServer('Linsensuppe') },
  })

  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Wochenplan')
  await stepToDay(page, 'Freitag, 25. September')

  await expect(page.getByLabel('Mittagessen', { exact: true })).toHaveValue(
    'Linsensuppe',
  )
})

test('keeps the fixed plan after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Linsensuppe')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Wochenplan')
  await chooseSuggestion(page, 'Mittagessen', 'linsen', 'Linsensuppe')
  await pressButton(page, 'Plan festlegen')

  await expect(page.getByRole('status')).toContainText(
    'Plan festgelegt, 1 von 28 Gerichten geplant.',
  )
  await expect
    .poll(async () => (await weekPlanStageOnServer()).mode)
    .toBe('reading')

  await page.reload()
  await pressButton(page, 'Wochenplan')

  await expect(
    page.getByRole('heading', { name: 'Wochenplan, 1 von 28, festgelegt' }),
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Mittagessen' })).toHaveCount(
    0,
  )
})

test('transfers a fixed plan only once', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await takeOverItem(page, 'Hackfleisch', '500', 'g')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Vorräte')
  await pressButton(page, 'Vorrat hinzufügen')
  await chooseSuggestion(page, 'Gericht', 'bolo', 'Bolognese')
  await page.getByLabel('Menge', { exact: true }).fill('1')
  await pressButton(page, 'Speichern')

  await pressButton(page, 'Wochenplan')
  await chooseSuggestion(page, 'Mittagessen', 'bolo', 'Bolognese')

  await expect(
    page.getByLabel('Mittagessen, im Vorrat', { exact: true }),
  ).toHaveValue('Bolognese')

  await pressButton(page, 'Plan festlegen')
  await pressButton(page, 'Auf die Einkaufsliste')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.',
  )
  await expect
    .poll(async () => (await weekPlanStageOnServer()).coveredSlots)
    .toEqual(['2026-09-21.lunch'])
  await expect.poll(supplyCountsOnServer).toEqual([])

  await page.reload()
  await pressButton(page, 'Wochenplan')

  await expect(
    page.getByRole('heading', {
      name: 'Wochenplan, 1 von 28, festgelegt, übertragen',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: 'Schon auf der Einkaufsliste',
      exact: true,
    }),
  ).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByText('Mittagessen, Bolognese, im Vorrat')).toHaveCount(
    1,
  )
})

test('never rolls a hidden meal into the week', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Chili')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Ausblenden')

  await expect.poll(hiddenMealNamesOnServer).toEqual(['Chili'])

  await pressButton(page, 'Zurück zu den Gerichten')
  await pressButton(page, 'Wochenplan')
  await pressButton(page, 'Zufallsauswahl generieren')

  await expect
    .poll(async () => Object.values(await weekPlanOnServer()).filter(Boolean))
    .toHaveLength(7)
  await expect
    .poll(async () => {
      const planned = Object.values(await weekPlanOnServer()).filter(Boolean)
      return new Set(planned).size
    })
    .toBe(1)
  await expect
    .poll(mainMealsOnServer)
    .toEqual(WEEK_DATES.map(() => ['Bolognese']))
})

test('rolls every meal into a slot that suits it', async ({ page }) => {
  await storeMealOnServer('Müsli', { breakfast: true })
  await storeMealOnServer('Apfel', { snack: true })
  await storeMealOnServer('Brot', { mainMeal: false })
  await storeMealOnServer('Bolognese')

  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Wochenplan')
  await expect(
    page.getByRole('button', {
      name: 'Zufallsauswahl generieren',
      exact: true,
    }),
  ).toBeEnabled()
  await pressButton(page, 'Zufallsauswahl generieren')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan neu gewürfelt, 28 von 28 Gerichten.',
  )
  await expect
    .poll(async () => {
      const planned = await weekPlanMealNamesOnServer()
      return WEEK_DATES.map((day) => ({
        breakfast: ['Müsli', 'Apfel'].includes(
          planned[`${day}.breakfast`] ?? '',
        ),
        snack: planned[`${day}.snack`],
        mainMeals: [planned[`${day}.lunch`], planned[`${day}.dinner`]].filter(
          (name) => name === 'Bolognese',
        ).length,
        besideTheMainMeal: [
          planned[`${day}.lunch`],
          planned[`${day}.dinner`],
        ].some((name) => name === 'Brot' || name === 'Apfel'),
      }))
    })
    .toEqual(
      WEEK_DATES.map(() => ({
        breakfast: true,
        snack: 'Apfel',
        mainMeals: 1,
        besideTheMainMeal: true,
      })),
    )
})

test('rolls the main meal only in the evening when the household wants it so', async ({
  page,
}) => {
  await storeMealOnServer('Bolognese')
  await storeMealOnServer('Brot', { mainMeal: false })

  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Einstellungen')
  await page
    .getByRole('combobox', { name: 'Hauptgericht würfeln' })
    .selectOption({ label: 'Nur abends' })
  await pressButton(page, 'Wochenplan')
  await expect(
    page.getByRole('button', {
      name: 'Zufallsauswahl generieren',
      exact: true,
    }),
  ).toBeEnabled()
  await pressButton(page, 'Zufallsauswahl generieren')

  await expect
    .poll(async () => {
      const planned = await weekPlanMealNamesOnServer()
      return WEEK_DATES.map((day) => [
        planned[`${day}.lunch`],
        planned[`${day}.dinner`],
      ])
    })
    .toEqual(WEEK_DATES.map(() => ['Brot', 'Bolognese']))
})

test('lines the meal time field up with its shuffle button', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Wochenplan')

  const field = await page
    .getByLabel('Frühstück', { exact: true })
    .boundingBox()
  const shuffle = await page
    .getByRole('button', { name: 'Zufallsgericht für Frühstück', exact: true })
    .boundingBox()

  expect(field!.height).toBeCloseTo(shuffle!.height, 0)
  expect(field!.y).toBeCloseTo(shuffle!.y, 0)
})

test('steps through the week with the arrows', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Wochenplan')

  const previousDay = page.getByRole('button', {
    name: 'Vorheriger Tag',
    exact: true,
  })
  const nextDay = page.getByRole('button', {
    name: 'Nächster Tag',
    exact: true,
  })

  await expect(page.getByRole('heading', { level: 2 })).toHaveAccessibleName(
    'Montag, 21. September',
  )
  await expect(previousDay).toHaveAttribute('aria-disabled', 'true')

  await stepToDay(page, 'Sonntag, 27. September')

  await expect(page.getByRole('status')).toContainText(
    'Sonntag, 27. September.',
  )
  await expect(nextDay).toHaveAttribute('aria-disabled', 'true')
  await expect(nextDay).toBeFocused()
  await expect(previousDay).toHaveAttribute('aria-disabled', 'false')
})

test('opens the week plan on the day of today', async ({ page }) => {
  await page.clock.setFixedTime(A_FRIDAY)
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Wochenplan')

  await expect(page.getByRole('heading', { level: 2 })).toHaveAccessibleName(
    'Freitag, 25. September',
  )
  await expect(
    page.getByRole('button', { name: 'Vorheriger Tag', exact: true }),
  ).toHaveAttribute('aria-disabled', 'false')
  await expect(
    page.getByRole('button', { name: 'Nächster Tag', exact: true }),
  ).toHaveAttribute('aria-disabled', 'false')
})

test('plans a day of the week in the week view', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Wochenplan')
  await pressButton(page, 'Wochenansicht')

  await expect(page.getByRole('status')).toContainText(
    'Wochenansicht, Mittagessen.',
  )

  await chooseSuggestion(page, 'Donnerstag, 24. September', 'bolo', 'Bolognese')

  await expect
    .poll(async () => (await weekPlanOnServer())['2026-09-24.lunch'])
    .toEqual(expect.any(String))

  await pressButton(page, 'Tagesansicht')
  await stepToDay(page, 'Donnerstag, 24. September')

  await expect(page.getByLabel('Mittagessen', { exact: true })).toHaveValue(
    'Bolognese',
  )
})

test('shows the dinner of the whole week', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Chili')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Wochenplan')
  await chooseSuggestion(page, 'Abendessen', 'chi', 'Chili')

  await expect
    .poll(async () => (await weekPlanOnServer())['2026-09-21.dinner'])
    .toEqual(expect.any(String))

  await pressButton(page, 'Wochenansicht')
  await pressButton(page, 'Abendessen')

  await expect(page.getByRole('status')).toContainText('Abendessen.')
  await expect(
    page.getByLabel('Montag, 21. September', { exact: true }),
  ).toHaveValue('Chili')
  await expect(
    page.getByRole('button', { name: 'Abendessen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
})
