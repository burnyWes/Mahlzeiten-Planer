import { doc, onSnapshot, setDoc, type Firestore } from 'firebase/firestore'
import { mealCategoryNamesFromStored } from '../domain/mealCategory'
import type { MealCategoriesClient } from './mealCategoriesClient'

const MEAL_CATEGORIES = 'mealCategories'
const CATALOG = 'catalog'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'

export function createFirestoreMealCategoriesClient(
  firestore: Firestore,
  onWriteFailure: (message: string) => void,
): MealCategoriesClient {
  const catalogDocument = doc(firestore, MEAL_CATEGORIES, CATALOG)

  return {
    observeCatalog(onNames) {
      return onSnapshot(catalogDocument, (snapshot) =>
        onNames(mealCategoryNamesFromStored(snapshot.data())),
      )
    },

    writeCatalog(names) {
      setDoc(catalogDocument, { names: [...names] }).catch(() =>
        onWriteFailure(WRITE_FAILED),
      )
    },
  }
}
