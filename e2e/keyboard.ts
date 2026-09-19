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

export async function takeOverItem(
  page: Page,
  name: string,
  amount = '',
  unit = '',
) {
  await typeInto(page, 'Item', name)
  if (amount !== '') await typeInto(page, 'Menge', amount)
  if (unit !== '') await typeInto(page, 'Einheit', unit)
  await pressButton(page, 'Item hinzufügen')
}

export async function chooseInField(page: Page, label: string, option: string) {
  await page.getByLabel(label, { exact: true }).selectOption({ label: option })
}

export function chosenInField(page: Page, label: string) {
  return page.getByLabel(label, { exact: true }).locator('option:checked')
}

export function shownItems(page: Page) {
  return page.getByRole('main').getByRole('listitem')
}

export async function signIn(page: Page) {
  await typeInto(page, 'E-Mail', household.email)
  await typeInto(page, 'Passwort', household.password)
  await pressButton(page, 'Anmelden')
}
