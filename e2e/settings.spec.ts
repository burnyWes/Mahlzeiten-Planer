import { expect, test, type Page } from '@playwright/test'
import {
  mainMealTimeRuleOnServer,
  prepareEmulators,
  settleWrites,
} from './emulatorHousehold.ts'
import { pressButton, signIn } from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

test.afterEach(async ({ page }) => {
  await settleWrites(page)
})

function mainMealTimeChoice(page: Page) {
  return page.getByRole('combobox', { name: 'Hauptgericht würfeln' })
}

test('remembers the main meal time for the household after a reload', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Einstellungen')
  await expect(mainMealTimeChoice(page)).toHaveValue('lunchOrDinner')
  await mainMealTimeChoice(page).focus()
  await mainMealTimeChoice(page).selectOption({ label: 'Nur abends' })
  await settleWrites(page)

  await expect.poll(mainMealTimeRuleOnServer).toBe('dinner')

  await page.reload()
  await pressButton(page, 'Einstellungen')

  await expect(mainMealTimeChoice(page)).toHaveValue('dinner')
})
