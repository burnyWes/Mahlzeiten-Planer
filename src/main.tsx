import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { createFirestoreMealsClient } from './meals/api/firestoreMealsClient.ts'
import { createServiceWorkerAppUpdateClient } from './shared/appUpdate/serviceWorkerAppUpdateClient.ts'
import { auth, firestore, storageWarning } from './shared/auth/firebase.ts'
import { createFirebaseAuthClient } from './shared/auth/firebaseAuthClient.ts'
import { createFirestoreShoppingListClient } from './shopping/api/firestoreShoppingListClient.ts'
import './index.css'

const sessionStartedAt = Date.now()

const openShoppingList = (onWriteFailure: (message: string) => void) =>
  createFirestoreShoppingListClient(firestore, sessionStartedAt, onWriteFailure)

const openMeals = (onWriteFailure: (message: string) => void) =>
  createFirestoreMealsClient(firestore, onWriteFailure)

const appUpdateClient = createServiceWorkerAppUpdateClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      authClient={createFirebaseAuthClient(auth)}
      createShoppingListClient={openShoppingList}
      createMealsClient={openMeals}
      appUpdateClient={appUpdateClient}
      storageWarning={storageWarning}
    />
  </StrictMode>,
)
