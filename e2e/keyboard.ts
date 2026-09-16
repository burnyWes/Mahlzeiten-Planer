import type { Page } from '@playwright/test'
import { household } from './emulatorHousehold.ts'

export async function typeInto(page: Page, label: string, text: string) {
  await page.getByLabel(label, { exact: true }).focus()
  await page.keyboard.type(text)
}

export async function pressButton(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).focus()
  await page.keyboard.press('Enter')
}

export function shownItems(page: Page) {
  return page.getByRole('main').getByRole('listitem')
}

export async function signIn(page: Page) {
  await typeInto(page, 'E-Mail', household.email)
  await typeInto(page, 'Passwort', household.password)
  await pressButton(page, 'Anmelden')
}
