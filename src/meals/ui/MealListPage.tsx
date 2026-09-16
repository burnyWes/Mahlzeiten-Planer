import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealsHeading } from '../domain/announcements'
import type { Meal } from '../domain/meal'
import { MealListRow } from './MealListRow'

type MealListPageProps = {
  navigation: ReactNode
  meals: readonly Meal[]
  onAddMeal: () => void
  onOpenMeal: (meal: Meal) => void
}

export function MealListPage({
  navigation,
  meals,
  onAddMeal,
  onOpenMeal,
}: MealListPageProps) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {mealsHeading(meals.length)}
          </h1>
          <button
            type="button"
            className="addItemButton"
            onClick={onAddMeal}
            aria-label="Gericht hinzufügen"
          >
            +
          </button>
        </div>
        {meals.length === 0 ? (
          <p>Noch keine Gerichte.</p>
        ) : (
          <ul className="itemList">
            {meals.map((meal) => (
              <MealListRow key={meal.id} meal={meal} onOpenMeal={onOpenMeal} />
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
