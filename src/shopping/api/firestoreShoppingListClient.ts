import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type QuerySnapshot,
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

  return {
    observeItems(onItems) {
      const openItems = new Map<ItemId, ShoppingItem>()
      const checkedOffThisSession = new Map<ItemId, ShoppingItem>()
      const answered = new Set<string>()

      function publish() {
        if (answered.size < 2) return
        const merged = new Map([...checkedOffThisSession, ...openItems])
        onItems([...merged.values()])
      }

      function collectInto(
        known: Map<ItemId, ShoppingItem>,
        observation: string,
      ) {
        return (snapshot: QuerySnapshot) => {
          known.clear()
          snapshot.forEach((document) => {
            known.set(document.id, toShoppingItem(document.id, document.data()))
          })
          answered.add(observation)
          publish()
        }
      }

      const unsubscribeOpen = onSnapshot(
        query(items, where('checkedOffAt', '==', null)),
        collectInto(openItems, 'open'),
      )
      const unsubscribeCheckedOff = onSnapshot(
        query(items, where('checkedOffAt', '>=', sessionStartedAt)),
        collectInto(checkedOffThisSession, 'checkedOff'),
      )

      return () => {
        unsubscribeOpen()
        unsubscribeCheckedOff()
      }
    },

    addItem(newItem) {
      const reference = doc(items)
      writeInBackground(setDoc(reference, { ...newItem, checkedOffAt: null }))
      return reference.id
    },

    changeQuantity(id, quantity) {
      writeInBackground(updateDoc(itemDocument(id), { quantity }))
    },

    checkOffItem(id) {
      writeInBackground(
        updateDoc(itemDocument(id), { checkedOffAt: Date.now() }),
      )
    },

    reopenItem(id) {
      writeInBackground(updateDoc(itemDocument(id), { checkedOffAt: null }))
    },
  }
}
