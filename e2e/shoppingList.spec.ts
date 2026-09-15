import { expect, test, type Page } from '@playwright/test'
import {
  household,
  prepareEmulators,
  storeItemOnServer,
} from './emulatorHousehold.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

async function typeInto(page: Page, label: string, text: string) {
  await page.getByLabel(label).focus()
  await page.keyboard.type(text)
}

async function pressButton(page: Page, name: string) {
  await page.getByRole('button', { name }).focus()
  await page.keyboard.press('Enter')
}

async function signIn(page: Page) {
  await typeInto(page, 'E-Mail', household.email)
  await typeInto(page, 'Passwort', household.password)
  await pressButton(page, 'Anmelden')
}

async function addItem(page: Page, name: string, amount = '', unit = '') {
  await pressButton(page, 'Artikel hinzufügen')
  await typeInto(page, 'Name', name)
  if (amount !== '') await typeInto(page, 'Menge', amount)
  if (unit !== '') await typeInto(page, 'Einheit', unit)
  await pressButton(page, 'Hinzufügen')
  await pressButton(page, 'Zurück zur Liste')
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

  await expect(page.getByRole('listitem')).toHaveText(['Brot', 'Milch, 2 l'])
  await expect(
    page.getByRole('heading', { name: 'Einkaufsliste, 2 offen' }),
  ).toBeVisible()

  const milk = page.getByRole('checkbox', { name: 'Milch, 2 l' })
  await milk.focus()
  await page.keyboard.press('Space')

  await expect(milk).toBeChecked()
  await expect(page.getByRole('listitem')).toHaveText(['Brot', 'Milch, 2 l'])
  await expect(page.getByRole('status')).toContainText(
    'Milch abgehakt, noch 1 offen',
  )

  await pressButton(page, 'Aufräumen, 1 Änderung')

  await expect(page.getByRole('listitem')).toHaveText(['Brot'])
  await expect(page.getByRole('status')).toContainText('Aufgeräumt, 1 offen')
  await expect(
    page.getByRole('heading', { name: 'Einkaufsliste, 1 offen' }),
  ).toBeFocused()
})

test('keeps the added item after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await addItem(page, 'Käse')
  await expect(page.getByRole('listitem')).toHaveText(['Käse'])

  await page.reload()

  await expect(page.getByRole('listitem')).toHaveText(['Käse'])
})

test('shows what the other device stored before this device ever ran', async ({
  page,
}) => {
  await storeItemOnServer('Brot', 1)
  await storeItemOnServer('Milch', 2)

  await page.goto('/')
  await signIn(page)

  await expect(page.getByRole('listitem')).toHaveText(['Brot', 'Milch'])
  await expect(page.getByRole('button', { name: /Aufräumen/ })).toHaveCount(0)
})
