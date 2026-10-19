import { expect, test, type Page } from '@playwright/test'
import {
  knownUnitNamesOnServer,
  prepareEmulators,
  rollingRulesOnServer,
  settleWrites,
  storeRollingRulesOnServer,
} from './emulatorHousehold.ts'
import { pressButton, shownItems, signIn, typeInto } from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

test.afterEach(async ({ page }) => {
  await settleWrites(page)
})

function mainMealTimeChoice(page: Page) {
  return page.getByRole('combobox', { name: 'Hauptgericht' })
}

function ruleSwitch(page: Page, name: string) {
  return page.getByRole('switch', { name })
}

async function openRollingRules(page: Page) {
  await pressButton(page, 'Einstellungen')
  await pressButton(page, 'Regel-Verwaltung')
}

test('remembers the main meal time for the household after a reload', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await openRollingRules(page)
  await expect(mainMealTimeChoice(page)).toHaveValue('lunchOrDinner')
  await mainMealTimeChoice(page).focus()
  await mainMealTimeChoice(page).selectOption({ label: 'Nur abends' })
  await settleWrites(page)

  await expect
    .poll(async () => (await rollingRulesOnServer()).mainMealTime)
    .toBe('dinner')

  await page.reload()
  await openRollingRules(page)

  await expect(mainMealTimeChoice(page)).toHaveValue('dinner')
})

test('switches off leftovers for a single meal only', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await openRollingRules(page)
  await expect(ruleSwitch(page, 'Reste, Einzelgericht')).toBeChecked()
  await ruleSwitch(page, 'Reste, Einzelgericht').focus()
  await page.keyboard.press('Space')
  await settleWrites(page)

  await expect.poll(rollingRulesOnServer).toEqual({
    mainMealTime: 'lunchOrDinner',
    switchedOff: ['leftovers.singleMeal'],
    leftovers: null,
  })

  await mainMealTimeChoice(page).focus()
  await mainMealTimeChoice(page).selectOption({ label: 'Nur abends' })
  await settleWrites(page)

  await expect.poll(rollingRulesOnServer).toEqual({
    mainMealTime: 'dinner',
    switchedOff: ['leftovers.singleMeal'],
    leftovers: null,
  })

  await page.reload()
  await openRollingRules(page)

  await expect(ruleSwitch(page, 'Reste, Einzelgericht')).not.toBeChecked()
  await expect(ruleSwitch(page, 'Reste, Gesamtplan')).toBeChecked()
})

test('takes over leftovers switched off before the update', async ({
  page,
}) => {
  await storeRollingRulesOnServer({
    mainMealTime: 'lunchOrDinner',
    leftovers: false,
  })

  await page.goto('/')
  await signIn(page)
  await openRollingRules(page)

  await expect(ruleSwitch(page, 'Reste, Einzelgericht')).not.toBeChecked()
  await expect(ruleSwitch(page, 'Reste, Gesamtplan')).not.toBeChecked()
})

test('merges a misspelt unit into the right one', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await expect.poll(knownUnitNamesOnServer).toContain('g')

  await pressButton(page, 'Artikel hinzufügen')
  await typeInto(page, 'Name', 'Mehl')
  await typeInto(page, 'Menge', '500')
  await typeInto(page, 'Einheit', 'gr')
  await pressButton(page, 'Hinzufügen')
  await pressButton(page, 'Zurück zur Liste')
  await expect.poll(knownUnitNamesOnServer).toContain('gr')

  await pressButton(page, 'Einstellungen')
  await pressButton(page, 'Einheiten-Verwaltung')
  await pressButton(page, 'gr')
  await page.getByLabel('Name', { exact: true }).fill('')
  await typeInto(page, 'Name', 'g')
  await pressButton(page, 'Speichern')

  await expect(
    page.getByRole('heading', { name: /^Einheiten-Verwaltung/ }),
  ).toBeVisible()
  await expect(
    shownItems(page).getByRole('button', { name: 'gr', exact: true }),
  ).toHaveCount(0)
  await expect.poll(knownUnitNamesOnServer).toContain('g')
  await expect.poll(knownUnitNamesOnServer).not.toContain('gr')
})
