import {
  collection,
  deleteDoc,
  doc,
  getDocsFromServer,
  increment,
  limit,
  onSnapshot,
  query,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import {
  knownItemIdOf,
  knownItemsFromHistory,
  type KnownItem,
} from '../domain/knownItem'
import { toShoppingItem } from './firestoreShoppingListClient'
import type { KnownItemsClient } from './knownItemsClient'

const KNOWN_ITEMS = 'knownItems'
const ITEMS = 'items'
const MAXIMUM_WRITES_PER_BATCH = 500

function toKnownItem(stored: DocumentData): KnownItem {
  return {
    name: String(stored.name ?? ''),
    lastUsedAt: Number(stored.lastUsedAt ?? 0),
    timesUsed: Number(stored.timesUsed ?? 0),
  }
}

export function inBatches<T>(
  entries: readonly T[],
  size: number,
): readonly (readonly T[])[] {
  return Array.from({ length: Math.ceil(entries.length / size) }, (_, index) =>
    entries.slice(index * size, (index + 1) * size),
  )
}

export function ignoreFailure() {}

export function createFirestoreKnownItemsClient(
  firestore: Firestore,
): KnownItemsClient {
  const knownItems = collection(firestore, KNOWN_ITEMS)

  function knownItemDocument(name: string) {
    return doc(firestore, KNOWN_ITEMS, knownItemIdOf(name))
  }

  async function catalogIsEmptyOnServer(): Promise<boolean> {
    const snapshot = await getDocsFromServer(query(knownItems, limit(1)))
    return snapshot.empty
  }

  async function historyOnServer(): Promise<readonly KnownItem[]> {
    const snapshot = await getDocsFromServer(collection(firestore, ITEMS))
    return knownItemsFromHistory(
      snapshot.docs.map((document) =>
        toShoppingItem(document.id, document.data()),
      ),
    )
  }

  async function store(taken: readonly KnownItem[]) {
    for (const batchOfKnownItems of inBatches(
      taken,
      MAXIMUM_WRITES_PER_BATCH,
    )) {
      const batch = writeBatch(firestore)
      batchOfKnownItems.forEach((knownItem) =>
        batch.set(knownItemDocument(knownItem.name), knownItem),
      )
      await batch.commit()
    }
  }

  async function takeOverHistory() {
    if (!(await catalogIsEmptyOnServer())) return
    await store(await historyOnServer())
  }

  return {
    observeKnownItems(onKnownItems) {
      return onSnapshot(
        knownItems,
        (snapshot) => {
          onKnownItems(
            snapshot.docs.map((document) => toKnownItem(document.data())),
          )
        },
        ignoreFailure,
      )
    },

    recordUse(name, usedAt) {
      setDoc(
        knownItemDocument(name),
        { name, lastUsedAt: usedAt, timesUsed: increment(1) },
        { merge: true },
      ).catch(ignoreFailure)
    },

    removeKnownItem(name) {
      deleteDoc(knownItemDocument(name)).catch(ignoreFailure)
    },

    renameKnownItem({ written, removedName, addedUses }) {
      const batch = writeBatch(firestore)
      batch.set(
        knownItemDocument(written.name),
        {
          name: written.name,
          lastUsedAt: written.lastUsedAt,
          timesUsed: increment(addedUses),
        },
        { merge: true },
      )
      if (removedName !== null) batch.delete(knownItemDocument(removedName))
      batch.commit().catch(ignoreFailure)
    },

    takeOverHistoryIfEmpty() {
      takeOverHistory().catch(ignoreFailure)
    },
  }
}
