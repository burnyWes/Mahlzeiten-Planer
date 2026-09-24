import type { Meal } from '../domain/meal'
import type { MealsClient } from './mealsClient'

export type InMemoryMealsClient = MealsClient & {
  mealsArriveFromElsewhere(meals: readonly Meal[]): void
  storedMeals(): readonly Meal[]
}

export function createInMemoryMealsClient(
  initialMeals: readonly Meal[] = [],
): InMemoryMealsClient {
  let meals = [...initialMeals]
  let nextId = 1
  const listeners = new Set<(meals: readonly Meal[]) => void>()

  function publish() {
    listeners.forEach((listener) => listener([...meals]))
  }

  return {
    observeMeals(onMeals) {
      listeners.add(onMeals)
      onMeals([...meals])
      return () => listeners.delete(onMeals)
    },
    addMeal(newMeal) {
      const id = `meal-${nextId}`
      nextId += 1
      meals = [...meals, { ...newMeal, id }]
      publish()
      return id
    },
    changeMeal(id, changed) {
      meals = meals.map((meal) => (meal.id === id ? { ...changed, id } : meal))
      publish()
    },
    changeMeals(changed) {
      meals = meals.map(
        (meal) =>
          changed.find((changedMeal) => changedMeal.id === meal.id) ?? meal,
      )
      publish()
    },
    removeMeal(id) {
      meals = meals.filter((meal) => meal.id !== id)
      publish()
    },
    mealsArriveFromElsewhere(arriving) {
      meals = [...arriving]
      publish()
    },
    storedMeals() {
      return [...meals]
    },
  }
}
