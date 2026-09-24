import { expect, test, type Page } from '@playwright/test'
import {
  itemNamesOnServer,
  itemQuantitiesOnServer,
  prepareEmulators,
  storeItemOnServer,
} from './emulatorHousehold.ts'
import {
  pressButton,
  shownShoppingItems,
  signIn,
  typeInto,
} from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

async function addItem(page: Page, name: string, amount = '', unit = '') {
  await pressButton(page, 'Artikel hinzufügen')
  await typeInto(page, 'Name', name)
  if (amount !== '') await typeInto(page, 'Menge', amount)
  if (unit !== '') await typeInto(page, 'Einheit', unit)
  await pressButton(page, 'Hinzufügen')
  await pressButton(page, 'Zurück zur Liste')
}

async function openAddItemPageUntilSuggested(
  page: Page,
  typed: string,
  suggestion: string,
) {
  await expect(async () => {
    await pressButton(page, 'Artikel hinzufügen')
    await typeInto(page, 'Name', typed)
    try {
      await expect(
        page
          .getByRole('list', { name: 'Vorschläge' })
          .getByRole('button', { name: suggestion, exact: true }),
      ).toBeVisible({ timeout: 1000 })
    } catch (notYetSuggested) {
      await pressButton(page, 'Zurück zur Liste')
      throw notYetSuggested
    }
  }).toPass()
}

test('sign in, add, check off and clean up using the keyboard only', async ({
  page,
}) => {
  await page.goto('/')

  await signIn(page)
  await expect(
    page.getByRole('heading', { name: /^Einkaufsliste/ }),
  ).toBeVisible()

  await addItem(page, 'Brot')
  await addItem(page, 'Milch', '2', 'l')

  await expect
    .poll(() => shownShoppingItems(page))
    .toEqual(['Brot', 'Milch, 2 l'])
  await expect(
    page.getByRole('heading', { name: 'Einkaufsliste, 2 offen' }),
  ).toBeVisible()

  const milk = page.getByRole('checkbox', { name: 'Milch, 2 l' })
  await milk.focus()
  await page.keyboard.press('Space')

  await expect(milk).toBeChecked()
  await expect
    .poll(() => shownShoppingItems(page))
    .toEqual(['Brot', 'Milch, 2 l'])
  await expect(page.getByRole('status')).toContainText(
    'Milch abgehakt, noch 1 offen',
  )

  await pressButton(page, 'Aufräumen, 1 Änderung')

  await expect.poll(() => shownShoppingItems(page)).toEqual(['Brot'])
  await expect(page.getByRole('status')).toContainText('Aufgeräumt, 1 offen')
  await expect(
    page.getByRole('heading', { name: 'Einkaufsliste, 1 offen' }),
  ).toBeFocused()
})

test('counts a second item of the same name into the first', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await addItem(page, 'Milch', '2', 'l')
  await addItem(page, 'Milch', '1', 'l')

  await expect.poll(() => shownShoppingItems(page)).toEqual(['Milch, 3 l'])
  await expect(
    page.getByRole('heading', { name: 'Einkaufsliste, 1 offen' }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toContainText(
    'Milch, 1 l hinzugefügt. Stand bereits offen, jetzt 3 l.',
  )
})

test('keeps the added item after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await addItem(page, 'Käse')
  await expect.poll(() => shownShoppingItems(page)).toEqual(['Käse'])
  await expect.poll(itemNamesOnServer).toContain('Käse')

  await page.reload()

  await expect.poll(() => shownShoppingItems(page)).toEqual(['Käse'])
})

test('shows what the other device stored before this device ever ran', async ({
  page,
}) => {
  await storeItemOnServer('Brot', 1)
  await storeItemOnServer('Milch', 2)

  await page.goto('/')
  await signIn(page)

  await expect.poll(() => shownShoppingItems(page)).toEqual(['Brot', 'Milch'])
  await expect(page.getByRole('button', { name: /Aufräumen/ })).toHaveCount(0)
})

test('suggests an item from the history taken over at start', async ({
  page,
}) => {
  await storeItemOnServer('Hafermilch', 1)

  await page.goto('/')
  await signIn(page)
  await openAddItemPageUntilSuggested(page, 'milch', 'Hafermilch')

  await pressButton(page, 'Hafermilch')

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Hafermilch',
  )
  await expect(page.getByLabel('Menge', { exact: true })).toBeFocused()
})

test('suggests an item that was added before', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await addItem(page, 'Brot')

  await openAddItemPageUntilSuggested(page, 'br', 'Brot')
})

test('changes the quantity of an item at its row', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await addItem(page, 'Milch', '2', 'l')

  await pressButton(page, 'Mehr, Milch')
  await pressButton(page, 'Mehr, Milch')
  await pressButton(page, 'Weniger, Milch')

  await expect(page.getByRole('status')).toContainText('Milch, 3 l.')
  await expect.poll(() => shownShoppingItems(page)).toEqual(['Milch, 3 l'])
  await expect.poll(itemQuantitiesOnServer).toEqual(['Milch, 3 l'])
})
