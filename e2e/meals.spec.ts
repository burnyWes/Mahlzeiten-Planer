import { expect, test } from '@playwright/test'
import {
  hiddenMealNamesOnServer,
  prepareEmulators,
} from './emulatorHousehold.ts'
import {
  pressButton,
  shownItems,
  signIn,
  takeOverItem,
  typeInto,
} from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
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

  await expect(shownItems(page)).toHaveText(['Hackfleisch, 500 g', 'Spaghetti'])
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
