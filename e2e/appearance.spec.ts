import { expect, test, type Page } from '@playwright/test'
import { prepareEmulators } from './emulatorHousehold.ts'
import { pressButton, signIn } from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

function invertedColorsSwitch(page: Page) {
  return page.getByRole('switch', { name: 'Farben invertieren' })
}

test('remembers the inverted colours after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await pressButton(page, 'Einstellungen')
  await invertedColorsSwitch(page).focus()
  await page.keyboard.press('Space')

  await expect(page.locator('html')).toHaveAttribute(
    'data-inverted-colors',
    'true',
  )

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute(
    'data-inverted-colors',
    'true',
  )

  await pressButton(page, 'Einstellungen')

  await expect(invertedColorsSwitch(page)).toBeChecked()
})
