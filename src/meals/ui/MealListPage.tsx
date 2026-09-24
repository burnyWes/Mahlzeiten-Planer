import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealsHeading, shownMealsCount } from '../domain/announcements'
import { countHiddenMeals, type Meal } from '../domain/meal'
import type { CategoryOverview } from '../domain/mealCategory'
import { LightbulbOffIcon } from './LightbulbOffIcon'
import { MealCategoryFilter } from './MealCategoryFilter'
import { MealListRow } from './MealListRow'

type MealListPageProps = {
  navigation: ReactNode
  meals: readonly Meal[]
  totalCount: number
  categories: readonly CategoryOverview[]
  activeCategory: string | null
  onChooseCategory: (category: string | null) => void
  onAddMeal: () => void
  onOpenMeal: (meal: Meal) => void
  onAddToShoppingList: (meal: Meal) => void
}

export function MealListPage({
  navigation,
  meals,
  totalCount,
  categories,
  activeCategory,
  onChooseCategory,
  onAddMeal,
  onOpenMeal,
  onAddToShoppingList,
}: MealListPageProps) {
  const heading = useHeadingFocus()
  const hiddenCount = countHiddenMeals(meals)
  const filteredFromCount = activeCategory === null ? null : totalCount

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1
            ref={heading}
            tabIndex={-1}
            aria-label={mealsHeading(meals, filteredFromCount)}
          >
            {hiddenCount === 0 && filteredFromCount === null ? (
              mealsHeading(meals)
            ) : (
              <>
                Gerichte, {shownMealsCount(meals.length, filteredFromCount)}
                {hiddenCount > 0 && (
                  <>
                    {' '}
                    ({hiddenCount} <LightbulbOffIcon className="headingIcon" />)
                  </>
                )}
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
        {categories.length > 0 && (
          <MealCategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onChooseCategory={onChooseCategory}
          />
        )}
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
