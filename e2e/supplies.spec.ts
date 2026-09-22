import { expect, test } from '@playwright/test'
import { prepareEmulators, supplyCountsOnServer } from './emulatorHousehold.ts'
import {
  chooseSuggestion,
  pressButton,
  shownItems,
  signIn,
  typeInto,
} from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

test('keeps a supply of a meal after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Bolognese')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Vorräte')
  await pressButton(page, 'Vorrat hinzufügen')
  await chooseSuggestion(page, 'Gericht', 'bolo', 'Bolognese')
  await page.getByLabel('Menge', { exact: true }).fill('3')
  await pressButton(page, 'Speichern')

  await expect(page.getByRole('status')).toContainText('Bolognese, 3.')
  await expect(shownItems(page)).toHaveText(['Bolognese3'])
  await expect.poll(supplyCountsOnServer).toEqual([3])

  await page.reload()
  await pressButton(page, 'Vorräte')

  await expect(page.getByRole('heading', { name: 'Vorräte, 1' })).toBeVisible()
  await expect(shownItems(page)).toHaveText(['Bolognese3'])
})
