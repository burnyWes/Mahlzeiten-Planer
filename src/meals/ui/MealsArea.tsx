import { useState, type ReactNode } from 'react'
import { mealSavedAnnouncement } from '../domain/announcements'
import type { MealId, NewMeal } from '../domain/meal'
import { MealFormPage } from './MealFormPage'
import { MealListPage } from './MealListPage'
import { MealPage } from './MealPage'
import type { Meals } from './useMeals'

type MealsPage =
  | { kind: 'list' }
  | { kind: 'meal'; id: MealId }
  | { kind: 'form'; id: MealId | null }

type MealsAreaProps = {
  meals: Meals
  announce: (text: string) => void
  navigation: ReactNode
}

export function MealsArea({ meals, announce, navigation }: MealsAreaProps) {
  const [page, setPage] = useState<MealsPage>({ kind: 'list' })

  function showList() {
    setPage({ kind: 'list' })
  }

  function saveNewMeal(newMeal: NewMeal) {
    setPage({ kind: 'meal', id: meals.addMeal(newMeal) })
    announce(mealSavedAnnouncement(newMeal))
  }

  if (page.kind === 'form') {
    return (
      <MealFormPage
        onSave={saveNewMeal}
        onBack={showList}
        announce={announce}
      />
    )
  }

  const shownMeal =
    page.kind === 'meal'
      ? (meals.meals.find((meal) => meal.id === page.id) ?? null)
      : null

  if (shownMeal !== null) {
    return <MealPage meal={shownMeal} onBack={showList} />
  }

  return (
    <MealListPage
      navigation={navigation}
      meals={meals.meals}
      onAddMeal={() => setPage({ kind: 'form', id: null })}
      onOpenMeal={(meal) => setPage({ kind: 'meal', id: meal.id })}
    />
  )
}
