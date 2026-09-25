import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
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

function collectionOf(collectionName: string) {
  return (uid: string | null) => {
    const context =
      uid === null
        ? testEnvironment.unauthenticatedContext()
        : testEnvironment.authenticatedContext(uid)
    return (documentId: string) =>
      doc(context.firestore(), collectionName, documentId)
  }
}

const itemsOf = collectionOf('items')
const mealsOf = collectionOf('meals')
const knownItemsOf = collectionOf('knownItems')
const suppliesOf = collectionOf('supplies')
const weekPlanOf = collectionOf('weekPlan')

const milk = { name: 'Milch', lastUsedAt: 1, timesUsed: 1 }

const emptyDay = { breakfast: null, lunch: null, snack: null, dinner: null }

const weekPlan = {
  monday: { ...emptyDay, lunch: 'bolognese' },
  tuesday: emptyDay,
  wednesday: emptyDay,
  thursday: emptyDay,
  friday: emptyDay,
  saturday: emptyDay,
  sunday: emptyDay,
}

const weekPlanStage = {
  mode: 'reading',
  coveredSlots: [{ day: 'monday', time: 'lunch' }],
}

const bolognese = {
  name: 'Spaghetti Bolognese',
  items: [],
  ingredientNotes: '',
  recipe: '',
}

const supply = { count: 3 }

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

  it('lets the household write a meal', async () => {
    await assertSucceeds(setDoc(mealsOf(householdUid)('bolognese'), bolognese))
  })

  it('lets the household read a meal', async () => {
    await assertSucceeds(getDoc(mealsOf(householdUid)('bolognese')))
  })

  it('refuses another account on the meals', async () => {
    await assertFails(getDoc(mealsOf(strangerUid)('bolognese')))
    await assertFails(setDoc(mealsOf(strangerUid)('bolognese'), bolognese))
  })

  it('refuses an unauthenticated visitor on the meals', async () => {
    await assertFails(getDoc(mealsOf(null)('bolognese')))
    await assertFails(setDoc(mealsOf(null)('bolognese'), bolognese))
  })

  it('lets the household write the week plan', async () => {
    await assertSucceeds(setDoc(weekPlanOf(householdUid)('meals'), weekPlan))
  })

  it('lets the household read the week plan', async () => {
    await assertSucceeds(getDoc(weekPlanOf(householdUid)('meals')))
  })

  it('refuses another account on the week plan', async () => {
    await assertFails(getDoc(weekPlanOf(strangerUid)('meals')))
    await assertFails(setDoc(weekPlanOf(strangerUid)('meals'), weekPlan))
  })

  it('refuses an unauthenticated visitor on the week plan', async () => {
    await assertFails(getDoc(weekPlanOf(null)('meals')))
    await assertFails(setDoc(weekPlanOf(null)('meals'), weekPlan))
  })

  it('lets the household write the stage of the week plan', async () => {
    await assertSucceeds(
      setDoc(weekPlanOf(householdUid)('mealStage'), weekPlanStage),
    )
  })

  it('lets the household read the stage of the week plan', async () => {
    await assertSucceeds(getDoc(weekPlanOf(householdUid)('mealStage')))
  })

  it('refuses another account on the stage of the week plan', async () => {
    await assertFails(getDoc(weekPlanOf(strangerUid)('mealStage')))
    await assertFails(
      setDoc(weekPlanOf(strangerUid)('mealStage'), weekPlanStage),
    )
  })

  it('lets the household write a known item', async () => {
    await assertSucceeds(setDoc(knownItemsOf(householdUid)('milch'), milk))
  })

  it('lets the household read a known item', async () => {
    await assertSucceeds(getDoc(knownItemsOf(householdUid)('milch')))
  })

  it('lets the household delete a known item', async () => {
    await assertSucceeds(deleteDoc(knownItemsOf(householdUid)('milch')))
  })

  it('refuses another account on the known items', async () => {
    await assertFails(getDoc(knownItemsOf(strangerUid)('milch')))
    await assertFails(setDoc(knownItemsOf(strangerUid)('milch'), milk))
  })

  it('refuses an unauthenticated visitor on the known items', async () => {
    await assertFails(getDoc(knownItemsOf(null)('milch')))
    await assertFails(setDoc(knownItemsOf(null)('milch'), milk))
  })

  it('lets the household write a supply', async () => {
    await assertSucceeds(setDoc(suppliesOf(householdUid)('bolognese'), supply))
  })

  it('lets the household read a supply', async () => {
    await assertSucceeds(getDoc(suppliesOf(householdUid)('bolognese')))
  })

  it('lets the household delete a supply', async () => {
    await assertSucceeds(deleteDoc(suppliesOf(householdUid)('bolognese')))
  })

  it('refuses another account on the supplies', async () => {
    await assertFails(getDoc(suppliesOf(strangerUid)('bolognese')))
    await assertFails(setDoc(suppliesOf(strangerUid)('bolognese'), supply))
  })

  it('refuses an unauthenticated visitor on the supplies', async () => {
    await assertFails(getDoc(suppliesOf(null)('bolognese')))
    await assertFails(setDoc(suppliesOf(null)('bolognese'), supply))
  })

  it('refuses the household outside the released collections', async () => {
    const context = testEnvironment.authenticatedContext(householdUid)

    await assertFails(
      setDoc(doc(context.firestore(), 'households', 'ours'), { name: 'Wir' }),
    )
  })
})
