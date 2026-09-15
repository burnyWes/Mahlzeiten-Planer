import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
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
export const storageWarning = localStore.survivesRestart
  ? ''
  : 'Ohne Speicher auf diesem Gerät. Änderungen gehen beim Schließen verloren.'
