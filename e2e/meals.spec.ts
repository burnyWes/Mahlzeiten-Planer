import { expect, test, type Page } from '@playwright/test'
import { prepareEmulators } from './emulatorHousehold.ts'
import { pressButton, shownItems, signIn, typeInto } from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

async function takeOverItem(page: Page, name: string, amount = '', unit = '') {
  await typeInto(page, 'Item', name)
  if (amount !== '') await typeInto(page, 'Menge', amount)
  if (unit !== '') await typeInto(page, 'Einheit', unit)
  await pressButton(page, 'Item hinzufügen')
}

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
})
