import type { Meal, MealId, NewMeal } from '../domain/meal'

export interface MealsClient {
  observeMeals(onMeals: (meals: readonly Meal[]) => void): () => void
  addMeal(meal: NewMeal): MealId
  changeMeal(id: MealId, meal: NewMeal): void
  changeMeals(changed: readonly Meal[]): void
  removeMeal(id: MealId): void
}
