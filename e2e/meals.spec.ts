import { expect, test } from '@playwright/test'
import {
  breakfastMealNamesOnServer,
  hiddenMealNamesOnServer,
  mealCategoriesOnServer,
  nonMainMealNamesOnServer,
  prepareEmulators,
  settleWrites,
  snackMealNamesOnServer,
  storeMealOnServer,
} from './emulatorHousehold.ts'
import {
  pressButton,
  shownItems,
  shownShoppingItems,
  signIn,
  switchCheckbox,
  takeOverItem,
  typeInto,
} from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

test.afterEach(async ({ page }) => {
  await settleWrites(page)
})

test('writes down a meal and transfers it to the shopping list using the keyboard only', async ({
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

  await expect(
    page.getByRole('heading', { level: 1, name: 'Bolognese' }),
  ).toBeVisible()

  await pressButton(page, 'Auf die Einkaufsliste')

  await expect(page.getByRole('status')).toContainText(
    'Bolognese, 2 Artikel hinzugefügt.',
  )

  await pressButton(page, 'Zurück zu den Gerichten')
  await pressButton(page, 'Einkaufsliste')

  await expect
    .poll(() => shownShoppingItems(page))
    .toEqual(['Hackfleisch, 500 g', 'Spaghetti'])
})

test('keeps a meal hidden after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Ausblenden')

  await expect(page.getByRole('status')).toContainText(
    'Bolognese ausgeblendet.',
  )
  await expect.poll(hiddenMealNamesOnServer).toEqual(['Bolognese'])

  await page.reload()
  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Bolognese, ausgeblendet')

  await expect(
    page.getByRole('button', { name: 'Einblenden', exact: true }),
  ).toBeVisible()
})

test('keeps a meal out of the main meals after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Bearbeiten')
  await switchCheckbox(page, 'Hauptgericht')
  await pressButton(page, 'Speichern')

  await expect.poll(nonMainMealNamesOnServer).toEqual(['Bolognese'])

  await page.reload()
  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Bolognese')
  await pressButton(page, 'Bearbeiten')

  await expect(
    page.getByRole('checkbox', { name: 'Hauptgericht', exact: true }),
  ).not.toBeChecked()
})

test('treats a stored meal without the field as a main meal', async ({
  page,
}) => {
  await storeMealOnServer('Erbsensuppe')

  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Erbsensuppe')
  await pressButton(page, 'Bearbeiten')

  await expect(
    page.getByRole('checkbox', { name: 'Hauptgericht', exact: true }),
  ).toBeChecked()
})

test('keeps a meal as a breakfast after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Bearbeiten')
  await switchCheckbox(page, 'Frühstück')
  await pressButton(page, 'Speichern')

  await expect.poll(breakfastMealNamesOnServer).toEqual(['Bolognese'])

  await page.reload()
  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Bolognese')
  await pressButton(page, 'Bearbeiten')

  await expect(
    page.getByRole('checkbox', { name: 'Frühstück', exact: true }),
  ).toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: 'Hauptgericht', exact: true }),
  ).not.toBeChecked()
})

test('treats a stored meal that is no main meal as neither', async ({
  page,
}) => {
  await storeMealOnServer('Milchreis', { mainMeal: false })

  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Milchreis')
  await pressButton(page, 'Bearbeiten')

  await expect(
    page.getByRole('checkbox', { name: 'Hauptgericht', exact: true }),
  ).not.toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: 'Frühstück', exact: true }),
  ).not.toBeChecked()
})

test('keeps a meal as a snack after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Bearbeiten')
  await switchCheckbox(page, 'Snack')
  await pressButton(page, 'Speichern')

  await expect.poll(snackMealNamesOnServer).toEqual(['Bolognese'])

  await page.reload()
  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Bolognese')
  await pressButton(page, 'Bearbeiten')

  await expect(
    page.getByRole('checkbox', { name: 'Snack', exact: true }),
  ).toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: 'Hauptgericht', exact: true }),
  ).not.toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: 'Frühstück', exact: true }),
  ).not.toBeChecked()
})

test('reads a stored snack without the main meal field as a snack', async ({
  page,
}) => {
  await storeMealOnServer('Nussmix', { snack: true })

  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Nussmix')
  await pressButton(page, 'Bearbeiten')

  await expect(
    page.getByRole('checkbox', { name: 'Snack', exact: true }),
  ).toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: 'Hauptgericht', exact: true }),
  ).not.toBeChecked()
})

test('keeps the actions of a long meal in view at the bottom of the screen', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await takeOverItem(page, 'Hackfleisch', '500', 'g')
  await page
    .getByLabel('Rezept', { exact: true })
    .fill('Schritt\n\n'.repeat(60))
  await pressButton(page, 'Speichern')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Bolognese' }),
  ).toBeVisible()
  for (const name of ['Auf die Einkaufsliste', 'Bearbeiten', 'Löschen']) {
    await expect(
      page.getByRole('button', { name, exact: true }),
    ).toBeInViewport()
  }

  await pressButton(page, 'Auf die Einkaufsliste')
  await expect(page.getByRole('status')).toContainText(
    'Bolognese, 1 Artikel hinzugefügt.',
  )
  await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')

  const status = await page.getByRole('status').boundingBox()
  const deleteButton = await page
    .getByRole('button', { name: 'Löschen', exact: true })
    .boundingBox()
  expect(status!.y + status!.height).toBeLessThanOrEqual(deleteButton!.y)

  await pressButton(page, 'Bearbeiten')

  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
  await expect(
    page.getByRole('button', { name: 'Speichern', exact: true }),
  ).toBeInViewport()
})

test('keeps the categories of a meal after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Bearbeiten')
  await typeInto(page, 'Kategorie', 'Nudelgericht')
  await pressButton(page, 'Kategorie hinzufügen')
  await typeInto(page, 'Kategorie', 'Schnell')
  await pressButton(page, 'Kategorie hinzufügen')
  await pressButton(page, 'Speichern')

  await expect
    .poll(mealCategoriesOnServer)
    .toEqual({ Bolognese: ['Nudelgericht', 'Schnell'] })

  await page.reload()
  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Bolognese')

  await expect(
    page.getByRole('heading', { level: 2, name: 'Kategorien' }),
  ).toBeVisible()
  await expect(shownItems(page)).toHaveText(['Nudelgericht', 'Schnell'])
})

test('deletes a category from every meal', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  for (const name of ['Bolognese', 'Carbonara']) {
    await pressButton(page, 'Gericht hinzufügen')
    await typeInto(page, 'Name', name)
    await typeInto(page, 'Kategorie', 'Nudelgericht')
    await pressButton(page, 'Kategorie hinzufügen')
    await pressButton(page, 'Speichern')
    await pressButton(page, 'Zurück zu den Gerichten')
  }

  await expect.poll(mealCategoriesOnServer).toEqual({
    Bolognese: ['Nudelgericht'],
    Carbonara: ['Nudelgericht'],
  })

  await pressButton(page, 'Einstellungen')
  await pressButton(page, 'Kategorie-Verwaltung')
  await pressButton(page, 'Löschen, Nudelgericht')
  await pressButton(page, 'Löschen')

  await expect(page.getByRole('status')).toContainText(
    'Nudelgericht gelöscht, keine Kategorien mehr.',
  )
  await expect
    .poll(mealCategoriesOnServer)
    .toEqual({ Bolognese: [], Carbonara: [] })
})
