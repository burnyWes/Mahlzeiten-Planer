import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import type { MealId } from '../domain/meal'
import type { Supply } from '../domain/supply'
import type { SuppliesClient } from './suppliesClient'

const SUPPLIES = 'supplies'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'

function toSupply(id: MealId, stored: DocumentData): Supply {
  return { mealId: id, count: Number(stored.count ?? 0) }
}

export function createFirestoreSuppliesClient(
  firestore: Firestore,
  onWriteFailure: (message: string) => void,
): SuppliesClient {
  const supplies = collection(firestore, SUPPLIES)

  function supplyDocument(mealId: MealId) {
    return doc(firestore, SUPPLIES, mealId)
  }

  function writeInBackground(write: Promise<void>) {
    write.catch(() => onWriteFailure(WRITE_FAILED))
  }

  return {
    observeSupplies(onSupplies) {
      return onSnapshot(supplies, (snapshot) => {
        onSupplies(
          snapshot.docs.map((document) =>
            toSupply(document.id, document.data()),
          ),
        )
      })
    },

    writeSupply(supply) {
      writeInBackground(
        setDoc(supplyDocument(supply.mealId), { count: supply.count }),
      )
    },

    removeSupply(mealId) {
      writeInBackground(deleteDoc(supplyDocument(mealId)))
    },
  }
}
