import { useState, type ReactNode } from 'react'
import {
  mealDeletedAnnouncement,
  mealHidingAnnouncement,
  mealSavedAnnouncement,
} from '../domain/announcements'
import {
  withHiding,
  type Meal,
  type MealId,
  type NewMeal,
} from '../domain/meal'
import { mealCategories } from '../domain/mealCategory'
import { DeleteMealPage } from './DeleteMealPage'
import { MealFormPage } from './MealFormPage'
import { MealListPage } from './MealListPage'
import { MealPage } from './MealPage'
import type { Meals } from './useMeals'

type MealsPage =
  | { kind: 'list' }
  | { kind: 'meal'; id: MealId }
  | { kind: 'form'; id: MealId | null }
  | { kind: 'delete'; id: MealId }

type MealsAreaProps = {
  meals: Meals
  announce: (text: string) => void
  navigation: ReactNode
  onAddToShoppingList: (meal: Meal) => void
  onMealDeleted: (id: MealId) => void
  suggestNames: (typed: string) => readonly string[]
}

export function MealsArea({
  meals,
  announce,
  navigation,
  onAddToShoppingList,
  onMealDeleted,
  suggestNames,
}: MealsAreaProps) {
  const [page, setPage] = useState<MealsPage>({ kind: 'list' })

  const addressedMeal =
    page.kind === 'list' || page.id === null
      ? null
      : (meals.meals.find((meal) => meal.id === page.id) ?? null)

  function showList() {
    setPage({ kind: 'list' })
  }

  function showMeal(id: MealId) {
    setPage({ kind: 'meal', id })
  }

  function saveMeal(editedId: MealId | null, newMeal: NewMeal) {
    if (editedId === null) {
      showMeal(meals.addMeal(newMeal))
    } else {
      meals.changeMeal(editedId, newMeal)
      showMeal(editedId)
    }
    announce(mealSavedAnnouncement(newMeal))
  }

  function switchHiding(meal: Meal) {
    const hidden = !meal.hidden
    meals.changeMeal(meal.id, withHiding(meal, hidden))
    announce(mealHidingAnnouncement(meal, hidden))
  }

  function deleteMeal(meal: Meal) {
    meals.removeMeal(meal.id)
    onMealDeleted(meal.id)
    showList()
    announce(mealDeletedAnnouncement(meal, meals.meals.length - 1))
  }

  if (page.kind === 'form' && (page.id === null || addressedMeal !== null)) {
    const editedId = page.id
    return (
      <MealFormPage
        editedMeal={addressedMeal}
        onSave={(newMeal) => saveMeal(editedId, newMeal)}
        onBack={
          addressedMeal === null ? showList : () => showMeal(addressedMeal.id)
        }
        announce={announce}
        suggestNames={suggestNames}
        knownCategories={mealCategories(meals.meals)}
      />
    )
  }

  if (page.kind === 'meal' && addressedMeal !== null) {
    return (
      <MealPage
        meal={addressedMeal}
        onBack={showList}
        onAddToShoppingList={() => onAddToShoppingList(addressedMeal)}
        onSwitchHiding={() => switchHiding(addressedMeal)}
        onEdit={() => setPage({ kind: 'form', id: addressedMeal.id })}
        onDelete={() => setPage({ kind: 'delete', id: addressedMeal.id })}
      />
    )
  }

  if (page.kind === 'delete' && addressedMeal !== null) {
    return (
      <DeleteMealPage
        meal={addressedMeal}
        onDelete={() => deleteMeal(addressedMeal)}
        onCancel={() => showMeal(addressedMeal.id)}
      />
    )
  }

  return (
    <MealListPage
      navigation={navigation}
      meals={meals.meals}
      onAddMeal={() => setPage({ kind: 'form', id: null })}
      onOpenMeal={(meal) => setPage({ kind: 'meal', id: meal.id })}
      onAddToShoppingList={onAddToShoppingList}
    />
  )
}
