import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  or,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import type { Quantity } from '../../shared/domain/quantity'
import type { ItemId, ShoppingItem } from '../domain/shoppingItem'
import type { ShoppingListClient } from './shoppingListClient'

const ITEMS = 'items'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'

function readQuantity(stored: DocumentData): Quantity | null {
  const quantity = stored.quantity
  if (quantity === null || quantity === undefined) return null
  return {
    amount: Number(quantity.amount),
    unit: quantity.unit === null ? null : String(quantity.unit),
  }
}

export function toShoppingItem(id: ItemId, stored: DocumentData): ShoppingItem {
  return {
    id,
    name: String(stored.name ?? ''),
    quantity: readQuantity(stored),
    createdAt: Number(stored.createdAt ?? 0),
    checkedOffAt:
      stored.checkedOffAt === null || stored.checkedOffAt === undefined
        ? null
        : Number(stored.checkedOffAt),
  }
}

function isRemovedElsewhere(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'not-found'
  )
}

export function createFirestoreShoppingListClient(
  firestore: Firestore,
  sessionStartedAt: number,
  onWriteFailure: (message: string) => void,
): ShoppingListClient {
  const items = collection(firestore, ITEMS)

  function itemDocument(id: ItemId) {
    return doc(firestore, ITEMS, id)
  }

  function writeInBackground(write: Promise<void>) {
    write.catch(() => onWriteFailure(WRITE_FAILED))
  }

  function updateInBackground(id: ItemId, changes: DocumentData) {
    updateDoc(itemDocument(id), changes).catch((error: unknown) => {
      if (isRemovedElsewhere(error)) return
      onWriteFailure(WRITE_FAILED)
    })
  }

  return {
    observeItems(onItems) {
      return onSnapshot(
        query(
          items,
          or(
            where('checkedOffAt', '==', null),
            where('checkedOffAt', '>=', sessionStartedAt),
          ),
        ),
        (snapshot) =>
          onItems(
            snapshot.docs.map((document) =>
              toShoppingItem(document.id, document.data()),
            ),
          ),
      )
    },

    addItem(newItem) {
      const reference = doc(items)
      writeInBackground(setDoc(reference, { ...newItem, checkedOffAt: null }))
      return reference.id
    },

    changeQuantity(id, quantity) {
      updateInBackground(id, { quantity })
    },

    checkOffItem(id) {
      updateInBackground(id, { checkedOffAt: Date.now() })
    },

    reopenItem(id) {
      updateInBackground(id, { checkedOffAt: null })
    },

    removeItem(id) {
      writeInBackground(deleteDoc(itemDocument(id)))
    },
  }
}
