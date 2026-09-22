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
  await expect(shownItems(page)).toHaveText(['Bolognese−3+'])
  await expect.poll(supplyCountsOnServer).toEqual([3])

  await page.reload()
  await pressButton(page, 'Vorräte')

  await expect(page.getByRole('heading', { name: 'Vorräte, 1' })).toBeVisible()
  await expect(shownItems(page)).toHaveText(['Bolognese−3+'])
})

test('recounts a supply and removes it again', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Gerichte')
  await pressButton(page, 'Gericht hinzufügen')
  await typeInto(page, 'Name', 'Linsensuppe')
  await pressButton(page, 'Speichern')
  await pressButton(page, 'Zurück zu den Gerichten')

  await pressButton(page, 'Vorräte')
  await pressButton(page, 'Vorrat hinzufügen')
  await chooseSuggestion(page, 'Gericht', 'linsen', 'Linsensuppe')
  await pressButton(page, 'Speichern')

  await pressButton(page, 'Linsensuppe')
  await page.getByLabel('Menge', { exact: true }).fill('4')
  await pressButton(page, 'Speichern')

  await expect(page.getByRole('status')).toContainText('Linsensuppe, 4.')
  await expect(shownItems(page)).toHaveText(['Linsensuppe−4+'])
  await expect.poll(supplyCountsOnServer).toEqual([4])

  await pressButton(page, 'Linsensuppe')
  await pressButton(page, 'Löschen')
  await pressButton(page, 'Löschen')

  await expect(page.getByRole('status')).toContainText(
    'Linsensuppe entfernt, keine Vorräte mehr.',
  )
  await expect(
    page.getByRole('heading', { name: 'Vorräte, keine' }),
  ).toBeVisible()
  await expect.poll(supplyCountsOnServer).toEqual([])
})

test('changes the count of a supply at its row', async ({ page }) => {
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
  await pressButton(page, 'Speichern')

  await pressButton(page, 'Mehr, Bolognese')
  await pressButton(page, 'Mehr, Bolognese')
  await pressButton(page, 'Weniger, Bolognese')

  await expect(page.getByRole('status')).toContainText('Bolognese, 2.')
  await expect(shownItems(page)).toHaveText(['Bolognese−2+'])
  await expect.poll(supplyCountsOnServer).toEqual([2])

  await pressButton(page, 'Weniger, Bolognese')
  await pressButton(page, 'Weniger, Bolognese')

  await expect(page.getByRole('status')).toContainText(
    'Bolognese entfernt, keine Vorräte mehr.',
  )
  await expect(page.getByText('Noch keine Vorräte.')).toBeVisible()
  await expect.poll(supplyCountsOnServer).toEqual([])
})
