import { expect, test } from '@playwright/test'
import { prepareEmulators, weekPlanOnServer } from './emulatorHousehold.ts'
import {
  chooseSuggestion,
  pressButton,
  shownItems,
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

  await pressButton(page, 'Auf die Einkaufsliste')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan, 2 Artikel hinzugefügt.',
  )

  await pressButton(page, 'Einkaufsliste')

  await expect(shownItems(page)).toHaveText([
    'Hackfleisch, 3500 g',
    'Spaghetti, 7',
  ])
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

  await pressButton(page, 'Auf die Einkaufsliste')

  await expect(page.getByRole('status')).toContainText(
    'Wochenplan, 2 Artikel hinzugefügt. 1 Tag aus dem Vorrat.',
  )

  await pressButton(page, 'Einkaufsliste')

  await expect(shownItems(page)).toHaveText(['Bohnen', 'Hackfleisch, 500 g'])
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
