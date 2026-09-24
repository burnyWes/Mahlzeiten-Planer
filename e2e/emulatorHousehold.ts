import { readFileSync } from 'node:fs'
import { firebaseConfig } from '../src/shared/auth/firebaseConfig.ts'

const PROJECT = firebaseConfig.projectId
const AUTH_EMULATOR = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080'

export const household = {
  email: 'haushalt@example.com',
  password: 'einkaufen',
}

function householdUid(): string {
  const rules = readFileSync('firestore.rules', 'utf8')
  const match = rules.match(/request\.auth\.uid == '([^']+)'/)
  if (!match) throw new Error('firestore.rules names no household uid')
  return match[1]
}

async function callEmulator(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`${method} ${url} failed: ${await response.text()}`)
  }
}

export async function prepareEmulators(): Promise<void> {
  await callEmulator(
    `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT}/accounts`,
    'DELETE',
  )
  await callEmulator(
    `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    'DELETE',
  )
  await callEmulator(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts`,
    'POST',
    {
      localId: householdUid(),
      email: household.email,
      password: household.password,
      emailVerified: true,
    },
  )
}

type ListedItems = {
  documents?: readonly { fields: { name: { stringValue: string } } }[]
}

export async function itemNamesOnServer(): Promise<readonly string[]> {
  const url = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/items`
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer owner' },
  })
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${await response.text()}`)
  }
  const listed = (await response.json()) as ListedItems
  return (listed.documents ?? []).map(
    (document) => document.fields.name.stringValue,
  )
}

type StoredAmount = { integerValue?: string; doubleValue?: number }

type StoredQuantity = {
  nullValue?: null
  mapValue?: {
    fields: {
      amount: StoredAmount
      unit: { stringValue?: string; nullValue?: null }
    }
  }
}

type ListedItemsWithQuantity = {
  documents?: readonly {
    fields: { name: { stringValue: string }; quantity?: StoredQuantity }
  }[]
}

function storedAmount(amount: StoredAmount): number {
  return amount.integerValue === undefined
    ? Number(amount.doubleValue)
    : Number(amount.integerValue)
}

function storedItemWithQuantity(
  name: string,
  quantity: StoredQuantity | undefined,
): string {
  const fields = quantity?.mapValue?.fields
  if (fields === undefined) return name
  const amount = storedAmount(fields.amount)
  const unit = fields.unit.stringValue
  return unit === undefined
    ? `${name}, ${amount}`
    : `${name}, ${amount} ${unit}`
}

export async function itemQuantitiesOnServer(): Promise<readonly string[]> {
  const url = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/items`
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer owner' },
  })
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${await response.text()}`)
  }
  const listed = (await response.json()) as ListedItemsWithQuantity
  return (listed.documents ?? []).map((document) =>
    storedItemWithQuantity(
      document.fields.name.stringValue,
      document.fields.quantity,
    ),
  )
}

type StoredWeekPlan = {
  fields?: Record<string, { stringValue?: string }>
}

export async function weekPlanOnServer(): Promise<
  Record<string, string | null>
> {
  const url = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/weekPlan/current`
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer owner' },
  })
  if (!response.ok) return {}
  const stored = (await response.json()) as StoredWeekPlan
  return Object.fromEntries(
    Object.entries(stored.fields ?? {}).map(([day, value]) => [
      day,
      value.stringValue ?? null,
    ]),
  )
}

export async function storeItemOnServer(
  name: string,
  createdAt: number,
): Promise<void> {
  await callEmulator(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/items`,
    'POST',
    {
      fields: {
        name: { stringValue: name },
        quantity: { nullValue: null },
        createdAt: { integerValue: String(createdAt) },
        checkedOffAt: { nullValue: null },
      },
    },
  )
}

type ListedMeals = {
  documents?: readonly {
    fields: {
      name: { stringValue: string }
      hidden?: { booleanValue?: boolean }
      mainMeal?: { booleanValue?: boolean }
      breakfast?: { booleanValue?: boolean }
    }
  }[]
}

export async function hiddenMealNamesOnServer(): Promise<readonly string[]> {
  const url = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/meals`
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer owner' },
  })
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${await response.text()}`)
  }
  const listed = (await response.json()) as ListedMeals
  return (listed.documents ?? [])
    .filter((document) => document.fields.hidden?.booleanValue === true)
    .map((document) => document.fields.name.stringValue)
}

export async function nonMainMealNamesOnServer(): Promise<readonly string[]> {
  const url = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/meals`
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer owner' },
  })
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${await response.text()}`)
  }
  const listed = (await response.json()) as ListedMeals
  return (listed.documents ?? [])
    .filter((document) => document.fields.mainMeal?.booleanValue === false)
    .map((document) => document.fields.name.stringValue)
}

export async function breakfastMealNamesOnServer(): Promise<readonly string[]> {
  const url = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/meals`
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer owner' },
  })
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${await response.text()}`)
  }
  const listed = (await response.json()) as ListedMeals
  return (listed.documents ?? [])
    .filter((document) => document.fields.breakfast?.booleanValue === true)
    .map((document) => document.fields.name.stringValue)
}

type StoredMealFlags = { mainMeal?: boolean; breakfast?: boolean }

export async function storeMealOnServer(
  name: string,
  flags: StoredMealFlags = {},
): Promise<void> {
  const flagFields = Object.fromEntries(
    Object.entries(flags).map(([field, value]) => [
      field,
      { booleanValue: value },
    ]),
  )
  await callEmulator(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/meals`,
    'POST',
    {
      fields: {
        name: { stringValue: name },
        ingredientNotes: { stringValue: '' },
        recipe: { stringValue: '' },
        ...flagFields,
      },
    },
  )
}

type ListedSupplies = {
  documents?: readonly { fields: { count: { integerValue: string } } }[]
}

export async function supplyCountsOnServer(): Promise<readonly number[]> {
  const url = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/supplies`
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer owner' },
  })
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${await response.text()}`)
  }
  const listed = (await response.json()) as ListedSupplies
  return (listed.documents ?? []).map((document) =>
    Number(document.fields.count.integerValue),
  )
}
