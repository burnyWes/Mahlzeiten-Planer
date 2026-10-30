import { expect, test, type Page } from '@playwright/test'
import {
  itemCategoriesOnServer,
  itemNamesOnServer,
  knownItemNamesOnServer,
  itemQuantitiesOnServer,
  knownUnitNamesOnServer,
  prepareEmulators,
  removeItemOnServer,
  settleWrites,
  storeItemOnServer,
} from './emulatorHousehold.ts'
import {
  openAddItemPageUntilUnitSuggested,
  pressButton,
  shownShoppingItems,
  signIn,
  typeInto,
} from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

test.afterEach(async ({ page }) => {
  await settleWrites(page)
})

async function fillAndSubmitItem(
  page: Page,
  name: string,
  amount: string,
  unit: string,
) {
  await pressButton(page, 'Artikel hinzufügen')
  await typeInto(page, 'Name', name)
  if (amount !== '') await typeInto(page, 'Menge', amount)
  if (unit !== '') await typeInto(page, 'Einheit', unit)
  await pressButton(page, 'Hinzufügen')
}

async function addNewItem(page: Page, name: string, amount = '', unit = '') {
  await fillAndSubmitItem(page, name, amount, unit)
  await pressButton(page, 'Ohne Kategorie hinzufügen')
  await pressButton(page, 'Zurück zur Liste')
}

async function addKnownItem(page: Page, name: string, amount = '', unit = '') {
  await fillAndSubmitItem(page, name, amount, unit)
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

  await addNewItem(page, 'Brot')
  await addNewItem(page, 'Milch', '2', 'l')

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

  await addNewItem(page, 'Milch', '2', 'l')
  await expect.poll(knownItemNamesOnServer).toContain('Milch')
  await addKnownItem(page, 'Milch', '1', 'l')

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
  await addNewItem(page, 'Käse')
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
  await addNewItem(page, 'Brot')

  await openAddItemPageUntilSuggested(page, 'br', 'Brot')
})

test('suggests a unit and takes over its spelling', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await expect
    .poll(knownUnitNamesOnServer)
    .toEqual(expect.arrayContaining(['Stück', 'g', 'kg', 'ml', 'l', 'Pck.']))

  await openAddItemPageUntilUnitSuggested(page, 'k', 'kg')
  await typeInto(page, 'Name', 'Mehl')
  await typeInto(page, 'Menge', '1')
  await pressButton(page, 'kg')
  await expect(
    page.getByRole('button', { name: 'Hinzufügen', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await pressButton(page, 'Ohne Kategorie hinzufügen')
  await pressButton(page, 'Zurück zur Liste')
  await addNewItem(page, 'Zucker', '500', 'G')

  await expect
    .poll(() => shownShoppingItems(page))
    .toEqual(['Mehl, 1 kg', 'Zucker, 500 g'])
})

test('changes the quantity of an item at its row', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await addNewItem(page, 'Milch', '2', 'l')

  await pressButton(page, 'Mehr, Milch')
  await pressButton(page, 'Mehr, Milch')
  await pressButton(page, 'Weniger, Milch')

  await expect(page.getByRole('status')).toContainText('Milch, 3 l.')
  await expect.poll(() => shownShoppingItems(page)).toEqual(['Milch, 3 l'])
  await expect.poll(itemQuantitiesOnServer).toEqual(['Milch, 3 l'])
})

test('steps the amount of a new item with the spin button', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Artikel hinzufügen')
  await typeInto(page, 'Name', 'Mehl')
  await page.getByRole('spinbutton', { name: 'Menge ändern' }).focus()
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await typeInto(page, 'Einheit', 'kg')
  await pressButton(page, 'Hinzufügen')
  await pressButton(page, 'Ohne Kategorie hinzufügen')
  await pressButton(page, 'Zurück zur Liste')

  await expect.poll(() => shownShoppingItems(page)).toEqual(['Mehl, 3 kg'])
  await expect.poll(itemQuantitiesOnServer).toEqual(['Mehl, 3 kg'])
})

test('removes an item with its last unit', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await addNewItem(page, 'Brot')
  await addNewItem(page, 'Milch')

  await pressButton(page, 'Weniger, Brot')
  await expect(
    page.getByRole('heading', { name: 'Brot entfernen?' }),
  ).toBeFocused()
  await pressButton(page, 'Entfernen')

  await expect(page.getByRole('status')).toContainText(
    'Brot entfernt, noch 1 offen.',
  )
  await expect.poll(() => shownShoppingItems(page)).toEqual(['Milch'])
  await expect(
    page.getByRole('heading', { name: 'Einkaufsliste, 1 offen' }),
  ).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Milch' })).toBeFocused()
  await expect.poll(itemNamesOnServer).toEqual(['Milch'])

  await page.reload()

  await expect.poll(() => shownShoppingItems(page)).toEqual(['Milch'])
})

test('lets go of an item the other device removed during an own step', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)
  await addNewItem(page, 'Milch')
  await settleWrites(page)

  await page.context().setOffline(true)
  await pressButton(page, 'Mehr, Milch')
  await expect.poll(() => shownShoppingItems(page)).toEqual(['Milch, 2'])
  await removeItemOnServer('Milch')
  await page.context().setOffline(false)
  await settleWrites(page)

  await expect.poll(() => shownShoppingItems(page)).toEqual([])
  await expect(page.getByRole('status')).not.toContainText(
    'Konnte nicht gespeichert werden.',
  )
  await expect.poll(itemNamesOnServer).toEqual([])
})

async function createItemCategory(page: Page, name: string) {
  await pressButton(page, 'Artikelkategorie anlegen')
  await typeInto(page, 'Name', name)
  await pressButton(page, 'Speichern')
}

async function createKnownItem(page: Page, name: string, category: string) {
  await pressButton(page, 'Artikel anlegen')
  await typeInto(page, 'Name', name)
  await typeInto(page, 'Kategorie', category)
  await pressButton(page, 'Speichern')
}

function sectionHeadings(page: Page) {
  return page.getByRole('main').getByRole('heading', { level: 2 })
}

test('groups the list by the order of the item categories', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Einstellungen')
  await pressButton(page, 'Artikelkategorien')
  await createItemCategory(page, 'Obst/Gemüse')
  await createItemCategory(page, 'Tiefkühlkost')
  await pressButton(page, 'Zurück zu den Einstellungen')
  await pressButton(page, 'Artikel')
  await createKnownItem(page, 'Pizza', 'Tiefkühlkost')
  await createKnownItem(page, 'Äpfel', 'Obst/Gemüse')
  await expect
    .poll(knownItemNamesOnServer)
    .toEqual(expect.arrayContaining(['Pizza', 'Äpfel']))
  await pressButton(page, 'Zurück zu den Einstellungen')
  await pressButton(page, 'Einkaufsliste')

  await addKnownItem(page, 'Pizza')
  await addNewItem(page, 'Batterien')
  await addKnownItem(page, 'Äpfel')

  await expect(sectionHeadings(page)).toHaveText([
    'Obst/Gemüse',
    'Tiefkühlkost',
    'Ohne Kategorie',
  ])
  expect(await shownShoppingItems(page)).toEqual([
    'Äpfel',
    'Pizza',
    'Batterien',
  ])

  await pressButton(page, 'Einstellungen')
  await pressButton(page, 'Artikelkategorien')
  await page.getByRole('switch', { name: 'Nach Kategorien sortieren' }).focus()
  await page.keyboard.press('Space')
  await pressButton(page, 'Zurück zu den Einstellungen')
  await pressButton(page, 'Einkaufsliste')

  await expect(sectionHeadings(page)).toHaveCount(0)
  expect(await shownShoppingItems(page)).toEqual([
    'Pizza',
    'Batterien',
    'Äpfel',
  ])
})

test('asks for the category of a new item', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await fillAndSubmitItem(page, 'Bananen', '3', '')

  await expect(
    page.getByRole('heading', { name: 'Kategorie für Bananen' }),
  ).toBeVisible()
  await expect(page.getByLabel('Kategorie', { exact: true })).toBeFocused()
  await typeInto(page, 'Kategorie', 'Obst/Gemüse')
  await pressButton(page, 'Mit Kategorie hinzufügen')

  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
  await expect(page.getByRole('status')).toContainText(
    'Bananen, 3 hinzugefügt. Kategorie Obst/Gemüse neu angelegt, Position 1.',
  )
  await pressButton(page, 'Zurück zur Liste')

  await expect(sectionHeadings(page)).toHaveText(['Obst/Gemüse'])
  expect(await shownShoppingItems(page)).toEqual(['Bananen, 3'])
  await expect
    .poll(async () => (await itemCategoriesOnServer()).names)
    .toEqual(['Obst/Gemüse'])
})
