import { expect, type Page } from '@playwright/test'
import { household } from './emulatorHousehold.ts'

export async function typeInto(page: Page, label: string, text: string) {
  await page.getByLabel(label, { exact: true }).focus()
  await page.keyboard.type(text)
}

export async function switchCheckbox(page: Page, label: string) {
  await page.getByLabel(label, { exact: true }).focus()
  await page.keyboard.press('Space')
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

export async function chooseSuggestion(
  page: Page,
  label: string,
  typed: string,
  suggestion: string,
) {
  await typeInto(page, label, typed)
  await pressButton(page, suggestion)
}

export function shownItems(page: Page) {
  return page.getByRole('main').getByRole('listitem')
}

export function shownShoppingItems(page: Page) {
  return page
    .getByRole('main')
    .getByRole('checkbox')
    .evaluateAll((boxes) => boxes.map((box) => box.getAttribute('aria-label')))
}

export async function signIn(page: Page) {
  await typeInto(page, 'E-Mail', household.email)
  await typeInto(page, 'Passwort', household.password)
  await pressButton(page, 'Anmelden')
}

const WEEKDAY_NAMES = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
]

export async function stepToDay(page: Page, dayName: string) {
  const daysUpToTarget = WEEKDAY_NAMES.slice(
    1,
    WEEKDAY_NAMES.indexOf(dayName) + 1,
  )
  for (const nextDay of daysUpToTarget) {
    await pressButton(page, 'Nächster Tag')
    await expect(page.getByRole('heading', { level: 2 })).toHaveAccessibleName(
      nextDay,
    )
  }
}
