import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const rules = readFileSync('firestore.rules', 'utf8')

function householdUidFrom(securityRules: string): string {
  const match = securityRules.match(/request\.auth\.uid == '([^']+)'/)
  if (!match) throw new Error('firestore.rules names no household uid')
  return match[1]
}

const householdUid = householdUidFrom(rules)
const strangerUid = `${householdUid}-someone-else`

let testEnvironment: RulesTestEnvironment

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: 'demo-mahlzeitenplaner',
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  })
})

afterAll(async () => {
  await testEnvironment.cleanup()
})

beforeEach(async () => {
  await testEnvironment.clearFirestore()
})

function itemsOf(uid: string | null) {
  const context =
    uid === null
      ? testEnvironment.unauthenticatedContext()
      : testEnvironment.authenticatedContext(uid)
  return (itemId: string) => doc(context.firestore(), 'items', itemId)
}

describe('firestore security rules', () => {
  it('lets the household write an item', async () => {
    await assertSucceeds(
      setDoc(itemsOf(householdUid)('bread'), {
        name: 'Brot',
        createdAt: 1,
        checkedOffAt: null,
      }),
    )
  })

  it('lets the household read an item', async () => {
    await assertSucceeds(getDoc(itemsOf(householdUid)('bread')))
  })

  it('refuses another account', async () => {
    await assertFails(getDoc(itemsOf(strangerUid)('bread')))
    await assertFails(setDoc(itemsOf(strangerUid)('bread'), { name: 'Brot' }))
  })

  it('refuses an unauthenticated visitor', async () => {
    await assertFails(getDoc(itemsOf(null)('bread')))
    await assertFails(setDoc(itemsOf(null)('bread'), { name: 'Brot' }))
  })

  it('refuses the household outside the items collection', async () => {
    const context = testEnvironment.authenticatedContext(householdUid)

    await assertFails(
      setDoc(doc(context.firestore(), 'households', 'ours'), { name: 'Wir' }),
    )
  })
})
