import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { createFirestoreMealsClient } from './meals/api/firestoreMealsClient.ts'
import { createFirestoreSuppliesClient } from './meals/api/firestoreSuppliesClient.ts'
import { createFirestoreWeekPlanClient } from './meals/api/firestoreWeekPlanClient.ts'
import { createLocalStorageAppearanceClient } from './shared/appearance/localStorageAppearanceClient.ts'
import { createServiceWorkerAppUpdateClient } from './shared/appUpdate/serviceWorkerAppUpdateClient.ts'
import { auth, firestore, storageWarning } from './shared/auth/firebase.ts'
import { createFirebaseAuthClient } from './shared/auth/firebaseAuthClient.ts'
import { createFirestoreKnownItemsClient } from './shopping/api/firestoreKnownItemsClient.ts'
import { createFirestoreKnownUnitsClient } from './shopping/api/firestoreKnownUnitsClient.ts'
import { createFirestoreShoppingListClient } from './shopping/api/firestoreShoppingListClient.ts'
import './index.css'

const sessionStartedAt = Date.now()

const openShoppingList = (onWriteFailure: (message: string) => void) =>
  createFirestoreShoppingListClient(firestore, sessionStartedAt, onWriteFailure)

const openMeals = (onWriteFailure: (message: string) => void) =>
  createFirestoreMealsClient(firestore, onWriteFailure)

const openWeekPlan = (onWriteFailure: (message: string) => void) =>
  createFirestoreWeekPlanClient(firestore, onWriteFailure)

const openSupplies = (onWriteFailure: (message: string) => void) =>
  createFirestoreSuppliesClient(firestore, onWriteFailure)

const openKnownItems = () => createFirestoreKnownItemsClient(firestore)

const openKnownUnits = () => createFirestoreKnownUnitsClient(firestore)

const appUpdateClient = createServiceWorkerAppUpdateClient()

const appearanceClient = createLocalStorageAppearanceClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      authClient={createFirebaseAuthClient(auth)}
      createShoppingListClient={openShoppingList}
      createMealsClient={openMeals}
      createWeekPlanClient={openWeekPlan}
      createSuppliesClient={openSupplies}
      createKnownItemsClient={openKnownItems}
      createKnownUnitsClient={openKnownUnits}
      appUpdateClient={appUpdateClient}
      appearanceClient={appearanceClient}
      storageWarning={storageWarning}
    />
  </StrictMode>,
)
