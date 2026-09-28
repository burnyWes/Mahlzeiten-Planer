import type { ReactNode } from 'react'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { shownMealsCount, suppliesHeading } from '../domain/announcements'
import type { ChosenMealKind, MealId } from '../domain/meal'
import type { CategoryOverview } from '../domain/mealCategory'
import type { MealFilter } from '../domain/mealFilter'
import { isLastPortion, type SuppliedMeal } from '../domain/supply'
import { MealFilterSelect } from './MealFilterSelect'
import { SupplyListRow } from './SupplyListRow'

type SupplyListPageProps = {
  navigation: ReactNode
  supplied: readonly SuppliedMeal[]
  totalCount: number
  kinds: readonly ChosenMealKind[]
  categories: readonly CategoryOverview[]
  activeFilter: MealFilter | null
  onChooseFilter: (filter: MealFilter | null) => void
  onAddSupply: () => void
  onOpenSupply: (supplied: SuppliedMeal) => void
  onLessSupply: (supplied: SuppliedMeal) => void
  onMoreSupply: (supplied: SuppliedMeal) => void
}

export function SupplyListPage({
  navigation,
  supplied,
  totalCount,
  kinds,
  categories,
  activeFilter,
  onChooseFilter,
  onAddSupply,
  onOpenSupply,
  onLessSupply,
  onMoreSupply,
}: SupplyListPageProps) {
  const heading = useHeadingFocus()
  const suppliedMealIds: readonly MealId[] = supplied.map(
    (suppliedMeal) => suppliedMeal.meal.id,
  )
  const { keepRow, rowRemovedAt, fallbackAfterRemoval } = useFocusAfterRemoval(
    suppliedMealIds,
    heading,
  )
  const filteredFromCount = activeFilter === null ? null : totalCount

  function takeOneLess(suppliedMeal: SuppliedMeal, position: number) {
    if (isLastPortion(suppliedMeal.count)) {
      const removesLastFilteredRow =
        activeFilter !== null && supplied.length === 1
      if (removesLastFilteredRow) {
        fallbackAfterRemoval()
      } else {
        rowRemovedAt(position)
      }
    }
    onLessSupply(suppliedMeal)
  }

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1
            ref={heading}
            tabIndex={-1}
            aria-label={suppliesHeading(supplied.length, filteredFromCount)}
          >
            {filteredFromCount === null
              ? suppliesHeading(supplied.length)
              : `Vorräte, ${shownMealsCount(supplied.length, filteredFromCount)}`}
          </h1>
          <button
            type="button"
            className="addItemButton"
            onClick={onAddSupply}
            aria-label="Vorrat hinzufügen"
          >
            +
          </button>
        </div>
        {(kinds.length > 0 || categories.length > 0) && (
          <MealFilterSelect
            kinds={kinds}
            categories={categories}
            activeFilter={activeFilter}
            onChooseFilter={onChooseFilter}
          />
        )}
        {supplied.length === 0 ? (
          <p>Noch keine Vorräte.</p>
        ) : (
          <ul className="itemList">
            {supplied.map((suppliedMeal, position) => (
              <SupplyListRow
                key={suppliedMeal.meal.id}
                supplied={suppliedMeal}
                nameButton={keepRow(suppliedMeal.meal.id)}
                onOpenSupply={onOpenSupply}
                onLess={() => takeOneLess(suppliedMeal, position)}
                onMore={() => onMoreSupply(suppliedMeal)}
              />
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
