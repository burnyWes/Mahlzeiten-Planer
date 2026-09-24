import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealsHeading } from '../domain/announcements'
import { countHiddenMeals, type Meal } from '../domain/meal'
import { LightbulbOffIcon } from './LightbulbOffIcon'
import { MealListRow } from './MealListRow'

type MealListPageProps = {
  navigation: ReactNode
  meals: readonly Meal[]
  onAddMeal: () => void
  onOpenMeal: (meal: Meal) => void
  onAddToShoppingList: (meal: Meal) => void
}

export function MealListPage({
  navigation,
  meals,
  onAddMeal,
  onOpenMeal,
  onAddToShoppingList,
}: MealListPageProps) {
  const heading = useHeadingFocus()
  const hiddenCount = countHiddenMeals(meals)

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1} aria-label={mealsHeading(meals)}>
            {hiddenCount === 0 ? (
              mealsHeading(meals)
            ) : (
              <>
                Gerichte, {meals.length} ({hiddenCount}{' '}
                <LightbulbOffIcon className="headingIcon" />)
              </>
            )}
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
              <MealListRow
                key={meal.id}
                meal={meal}
                onOpenMeal={onOpenMeal}
                onAddToShoppingList={onAddToShoppingList}
              />
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
