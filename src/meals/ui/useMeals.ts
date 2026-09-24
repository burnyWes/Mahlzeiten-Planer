import { useCallback, useEffect, useState } from 'react'
import type { MealsClient } from '../api/mealsClient'
import { byName, type Meal, type MealId, type NewMeal } from '../domain/meal'

export type Meals = {
  meals: readonly Meal[]
  addMeal: (meal: NewMeal) => MealId
  changeMeal: (id: MealId, meal: NewMeal) => void
  changeMeals: (changed: readonly Meal[]) => void
  removeMeal: (id: MealId) => void
}

export function useMeals(client: MealsClient): Meals {
  const [knownMeals, setKnownMeals] = useState<readonly Meal[]>([])

  useEffect(() => client.observeMeals(setKnownMeals), [client])

  const addMeal = useCallback((meal: NewMeal) => client.addMeal(meal), [client])

  const changeMeal = useCallback(
    (id: MealId, meal: NewMeal) => client.changeMeal(id, meal),
    [client],
  )

  const changeMeals = useCallback(
    (changed: readonly Meal[]) => client.changeMeals(changed),
    [client],
  )

  const removeMeal = useCallback(
    (id: MealId) => client.removeMeal(id),
    [client],
  )

  return {
    meals: byName(knownMeals),
    addMeal,
    changeMeal,
    changeMeals,
    removeMeal,
  }
}
