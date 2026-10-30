import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import { itemCategoryCatalogFromStored } from '../domain/itemCategory'
import { ignoreFailure } from './firestoreKnownItemsClient'
import type { ItemCategoriesClient } from './itemCategoriesClient'

const ITEM_CATEGORIES = 'itemCategories'
const CATALOG = 'catalog'

export function createFirestoreItemCategoriesClient(
  firestore: Firestore,
): ItemCategoriesClient {
  const catalogDocument = doc(firestore, ITEM_CATEGORIES, CATALOG)

  return {
    observeCatalog(onCatalog) {
      return onSnapshot(
        catalogDocument,
        (snapshot) => onCatalog(itemCategoryCatalogFromStored(snapshot.data())),
        ignoreFailure,
      )
    },

    writeCatalog({ categories, sortByCategory }) {
      setDoc(catalogDocument, {
        categories: categories.map(({ id, name }) => ({ id, name })),
        sortByCategory,
      }).catch(ignoreFailure)
    },

    newCategoryId() {
      return doc(collection(firestore, ITEM_CATEGORIES)).id
    },
  }
}
