import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import type { Quantity } from '../../shared/domain/quantity'
import type { Meal, MealId, MealItem, MealKind, NewMeal } from '../domain/meal'
import type { MealsClient } from './mealsClient'

const MEALS = 'meals'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'

function readQuantity(stored: DocumentData): Quantity | null {
  const quantity = stored.quantity
  if (quantity === null || quantity === undefined) return null
  return {
    amount: Number(quantity.amount),
    unit: quantity.unit === null ? null : String(quantity.unit),
  }
}

function toMealItem(stored: DocumentData): MealItem {
  return { name: String(stored.name ?? ''), quantity: readQuantity(stored) }
}

function toMealItems(stored: DocumentData): readonly MealItem[] {
  return Array.isArray(stored.items) ? stored.items.map(toMealItem) : []
}

function toCategories(stored: DocumentData): readonly string[] {
  return Array.isArray(stored.categories) ? stored.categories.map(String) : []
}

function toKind(stored: DocumentData): MealKind {
  if (stored.breakfast === true) return 'breakfast'
  return stored.mainMeal !== false ? 'mainMeal' : 'none'
}

function toMeal(id: MealId, stored: DocumentData): Meal {
  return {
    id,
    name: String(stored.name ?? ''),
    items: toMealItems(stored),
    ingredientNotes: String(stored.ingredientNotes ?? ''),
    recipe: String(stored.recipe ?? ''),
    categories: toCategories(stored),
    hidden: stored.hidden === true,
    kind: toKind(stored),
  }
}

function toDocument(meal: NewMeal): DocumentData {
  return {
    name: meal.name,
    items: meal.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
    })),
    ingredientNotes: meal.ingredientNotes,
    recipe: meal.recipe,
    categories: [...meal.categories],
    hidden: meal.hidden,
    mainMeal: meal.kind === 'mainMeal',
    breakfast: meal.kind === 'breakfast',
  }
}

export function createFirestoreMealsClient(
  firestore: Firestore,
  onWriteFailure: (message: string) => void,
): MealsClient {
  const meals = collection(firestore, MEALS)

  function mealDocument(id: MealId) {
    return doc(firestore, MEALS, id)
  }

  function writeInBackground(write: Promise<void>) {
    write.catch(() => onWriteFailure(WRITE_FAILED))
  }

  return {
    observeMeals(onMeals) {
      return onSnapshot(meals, (snapshot) => {
        onMeals(
          snapshot.docs.map((document) => toMeal(document.id, document.data())),
        )
      })
    },

    addMeal(newMeal) {
      const reference = doc(meals)
      writeInBackground(setDoc(reference, toDocument(newMeal)))
      return reference.id
    },

    changeMeal(id, changed) {
      writeInBackground(setDoc(mealDocument(id), toDocument(changed)))
    },

    changeMeals(changed) {
      if (changed.length === 0) return
      const batch = writeBatch(firestore)
      changed.forEach((meal) =>
        batch.set(mealDocument(meal.id), toDocument(meal)),
      )
      writeInBackground(batch.commit())
    },

    removeMeal(id) {
      writeInBackground(deleteDoc(mealDocument(id)))
    },
  }
}
