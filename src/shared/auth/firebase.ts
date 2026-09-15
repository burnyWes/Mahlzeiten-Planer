import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { firebaseConfig } from './firebaseConfig'

const app = initializeApp(firebaseConfig)

type LocalStore = {
  firestore: Firestore
  survivesRestart: boolean
}

function openLocalStore(): LocalStore {
  try {
    return {
      firestore: initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }),
      survivesRestart: true,
    }
  } catch {
    return {
      firestore: initializeFirestore(app, { localCache: memoryLocalCache() }),
      survivesRestart: false,
    }
  }
}

const localStore = openLocalStore()

export const auth = getAuth(app)
export const firestore = localStore.firestore

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
}
export const storageWarning = localStore.survivesRestart
  ? ''
  : 'Ohne Speicher auf diesem Gerät. Änderungen gehen beim Schließen verloren.'
