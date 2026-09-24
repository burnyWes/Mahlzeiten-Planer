import { expect, test } from '@playwright/test'
import {
  hiddenMealNamesOnServer,
  prepareEmulators,
  supplyCountsOnServer,
  weekPlanOnServer,
  weekPlanStageOnServer,
} from './emulatorHousehold.ts'
import {
  chooseSuggestion,
  pressButton,
  shownShoppingItems,
  signIn,
  takeOverItem,
  typeInto,
} from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
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
  await chooseSuggestion(page, 'Montag', 'bolo', 'Bolognese')

  await expect(
    page.getByRole('heading', { name: 'Wochenplan, 1 von 7' }),
  ).toBeVisible()

  await pressButton(page, 'Zufallsauswahl generieren')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan neu gewürfelt, 7 Gerichte.',
  )
  await expect(
    page.getByRole('heading', { name: 'Wochenplan, 7 von 7' }),
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

test('buys only the day that the supply no longer covers', async ({ page }) => {
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
  await chooseSuggestion(page, 'Montag', 'bolo', 'Bolognese')
  await chooseSuggestion(page, 'Dienstag', 'chi', 'Chili')
  await chooseSuggestion(page, 'Mittwoch', 'bolo', 'Bolognese')

  await expect(
    page.getByLabel('Montag, im Vorrat', { exact: true }),
  ).toHaveValue('Bolognese')
  await expect(page.getByLabel('Mittwoch', { exact: true })).toHaveValue(
    'Bolognese',
  )

  await pressButton(page, 'Plan festlegen')
  await pressButton(page, 'Auf die Einkaufsliste')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan, 2 Artikel hinzugefügt. 1 Tag aus dem Vorrat entnommen.',
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
  await chooseSuggestion(page, 'Freitag', 'linsen', 'Linsensuppe')

  await expect
    .poll(async () => (await weekPlanOnServer()).friday)
    .toEqual(expect.any(String))

  await page.reload()
  await pressButton(page, 'Wochenplan')

  await expect(page.getByLabel('Freitag', { exact: true })).toHaveValue(
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
  await chooseSuggestion(page, 'Montag', 'linsen', 'Linsensuppe')
  await pressButton(page, 'Plan festlegen')

  await expect(page.getByRole('status')).toContainText(
    'Plan festgelegt, 1 von 7 Tagen geplant.',
  )
  await expect
    .poll(async () => (await weekPlanStageOnServer()).mode)
    .toBe('reading')

  await page.reload()
  await pressButton(page, 'Wochenplan')

  await expect(
    page.getByRole('heading', { name: 'Wochenplan, 1 von 7, festgelegt' }),
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Montag' })).toHaveCount(0)
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
    .poll(async () => new Set(Object.values(await weekPlanOnServer())).size)
    .toBe(1)
  await expect(page.getByLabel('Montag', { exact: true })).toHaveValue(
    'Bolognese',
  )
  await expect(page.getByLabel('Sonntag', { exact: true })).toHaveValue(
    'Bolognese',
  )
})

test('lines the weekday field up with its shuffle button', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Wochenplan')

  const field = await page.getByLabel('Montag', { exact: true }).boundingBox()
  const shuffle = await page
    .getByRole('button', { name: 'Zufallsgericht für Montag', exact: true })
    .boundingBox()

  expect(field!.height).toBeCloseTo(shuffle!.height, 0)
  expect(field!.y).toBeCloseTo(shuffle!.y, 0)
})
