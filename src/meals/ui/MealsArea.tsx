import { useState, type ReactNode } from 'react'
import {
  filterResetAnnouncement,
  mealDeletedAnnouncement,
  mealFilterAnnouncement,
  mealHidingAnnouncement,
  mealSavedAnnouncement,
} from '../domain/announcements'
import {
  newlyUsedNames,
  newlyUsedUnits,
  withHiding,
  type Meal,
  type MealId,
  type NewMeal,
} from '../domain/meal'
import { mealCategories } from '../domain/mealCategory'
import {
  knownFilter,
  mealsMatching,
  usedMealKinds,
  type MealFilter,
} from '../domain/mealFilter'
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
  suggestNames: (
    typed: string,
    alsoInUse: readonly string[],
  ) => readonly string[]
  suggestUnits: (
    typed: string,
    alsoInUse: readonly string[],
  ) => readonly string[]
  canonicalUnit: (typed: string) => string
  onItemsUsed: (names: readonly string[], units: readonly string[]) => void
}

export function MealsArea({
  meals,
  announce,
  navigation,
  onAddToShoppingList,
  onMealDeleted,
  suggestNames,
  suggestUnits,
  canonicalUnit,
  onItemsUsed,
}: MealsAreaProps) {
  const [page, setPage] = useState<MealsPage>({ kind: 'list' })
  const [chosenFilter, setChosenFilter] = useState<MealFilter | null>(null)

  const categories = mealCategories(meals.meals)
  const kinds = usedMealKinds(meals.meals)
  const activeFilter = knownFilter(kinds, categories, chosenFilter)

  const addressedMeal =
    page.kind === 'list' || page.id === null
      ? null
      : (meals.meals.find((meal) => meal.id === page.id) ?? null)

  function showList() {
    setPage({ kind: 'list' })
  }

  function chooseFilter(filter: MealFilter | null) {
    setChosenFilter(filter)
    announce(
      filter === null
        ? filterResetAnnouncement(meals.meals.length)
        : mealFilterAnnouncement(
            filter,
            mealsMatching(meals.meals, filter).length,
            meals.meals.length,
          ),
    )
  }

  function showMeal(id: MealId) {
    setPage({ kind: 'meal', id })
  }

  function rememberNewItems(before: Meal | null, newMeal: NewMeal) {
    const itemsBefore = before?.items ?? []
    const names = newlyUsedNames(itemsBefore, newMeal.items)
    const units = newlyUsedUnits(itemsBefore, newMeal.items)
    if (names.length > 0 || units.length > 0) onItemsUsed(names, units)
  }

  function saveMeal(editedId: MealId | null, newMeal: NewMeal) {
    if (editedId === null) {
      showMeal(meals.addMeal(newMeal))
    } else {
      meals.changeMeal(editedId, newMeal)
      showMeal(editedId)
    }
    rememberNewItems(addressedMeal, newMeal)
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
        suggestUnits={suggestUnits}
        canonicalUnit={canonicalUnit}
        knownCategories={categories}
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
      meals={mealsMatching(meals.meals, activeFilter)}
      totalCount={meals.meals.length}
      kinds={kinds}
      categories={categories}
      activeFilter={activeFilter}
      onChooseFilter={chooseFilter}
      onAddMeal={() => setPage({ kind: 'form', id: null })}
      onOpenMeal={(meal) => setPage({ kind: 'meal', id: meal.id })}
      onAddToShoppingList={onAddToShoppingList}
    />
  )
}
