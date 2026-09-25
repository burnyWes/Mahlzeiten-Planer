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
import { knownItemIdOf } from '../domain/knownItem'
import { knownUnitsFromHistory, type KnownUnit } from '../domain/knownUnit'
import { ignoreFailure, inBatches } from './firestoreKnownItemsClient'
import { toShoppingItem } from './firestoreShoppingListClient'
import type { KnownUnitsClient } from './knownUnitsClient'

const KNOWN_UNITS = 'units'
const ITEMS = 'items'
const MAXIMUM_WRITES_PER_BATCH = 500

function toKnownUnit(stored: DocumentData): KnownUnit {
  return {
    name: String(stored.name ?? ''),
    lastUsedAt: Number(stored.lastUsedAt ?? 0),
    timesUsed: Number(stored.timesUsed ?? 0),
  }
}

export function createFirestoreKnownUnitsClient(
  firestore: Firestore,
): KnownUnitsClient {
  const knownUnits = collection(firestore, KNOWN_UNITS)

  function knownUnitDocument(unit: string) {
    return doc(firestore, KNOWN_UNITS, knownItemIdOf(unit))
  }

  async function catalogIsEmptyOnServer(): Promise<boolean> {
    const snapshot = await getDocsFromServer(query(knownUnits, limit(1)))
    return snapshot.empty
  }

  async function historyOnServer(
    unitsOfMeals: () => Promise<readonly string[]>,
  ): Promise<readonly KnownUnit[]> {
    const snapshot = await getDocsFromServer(collection(firestore, ITEMS))
    const items = snapshot.docs.map((document) =>
      toShoppingItem(document.id, document.data()),
    )
    return knownUnitsFromHistory(items, await unitsOfMeals())
  }

  async function store(taken: readonly KnownUnit[]) {
    for (const batchOfKnownUnits of inBatches(
      taken,
      MAXIMUM_WRITES_PER_BATCH,
    )) {
      const batch = writeBatch(firestore)
      batchOfKnownUnits.forEach((knownUnit) =>
        batch.set(knownUnitDocument(knownUnit.name), knownUnit),
      )
      await batch.commit()
    }
  }

  async function takeOver(unitsOfMeals: () => Promise<readonly string[]>) {
    if (!(await catalogIsEmptyOnServer())) return
    await store(await historyOnServer(unitsOfMeals))
  }

  return {
    observeKnownUnits(onKnownUnits) {
      return onSnapshot(
        knownUnits,
        (snapshot) => {
          onKnownUnits(
            snapshot.docs.map((document) => toKnownUnit(document.data())),
          )
        },
        ignoreFailure,
      )
    },

    recordUse(unit, usedAt) {
      setDoc(
        knownUnitDocument(unit),
        { name: unit, lastUsedAt: usedAt, timesUsed: increment(1) },
        { merge: true },
      ).catch(ignoreFailure)
    },

    removeKnownUnit(unit) {
      deleteDoc(knownUnitDocument(unit)).catch(ignoreFailure)
    },

    renameKnownUnit({ written, removedName, addedUses }) {
      const batch = writeBatch(firestore)
      batch.set(
        knownUnitDocument(written.name),
        {
          name: written.name,
          lastUsedAt: written.lastUsedAt,
          timesUsed: increment(addedUses),
        },
        { merge: true },
      )
      if (removedName !== null) batch.delete(knownUnitDocument(removedName))
      batch.commit().catch(ignoreFailure)
    },

    takeOverIfEmpty(unitsOfMeals) {
      takeOver(unitsOfMeals).catch(ignoreFailure)
    },
  }
}
