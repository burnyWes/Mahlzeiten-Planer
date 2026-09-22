import type { ReactNode } from 'react'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { suppliesHeading } from '../domain/announcements'
import type { MealId } from '../domain/meal'
import { isLastPortion, type SuppliedMeal } from '../domain/supply'
import { SupplyListRow } from './SupplyListRow'

type SupplyListPageProps = {
  navigation: ReactNode
  supplied: readonly SuppliedMeal[]
  onAddSupply: () => void
  onOpenSupply: (supplied: SuppliedMeal) => void
  onLessSupply: (supplied: SuppliedMeal) => void
  onMoreSupply: (supplied: SuppliedMeal) => void
}

export function SupplyListPage({
  navigation,
  supplied,
  onAddSupply,
  onOpenSupply,
  onLessSupply,
  onMoreSupply,
}: SupplyListPageProps) {
  const heading = useHeadingFocus()
  const suppliedMealIds: readonly MealId[] = supplied.map(
    (suppliedMeal) => suppliedMeal.meal.id,
  )
  const { keepRow, rowRemovedAt } = useFocusAfterRemoval(
    suppliedMealIds,
    heading,
  )

  function takeOneLess(suppliedMeal: SuppliedMeal, position: number) {
    if (isLastPortion(suppliedMeal.count)) rowRemovedAt(position)
    onLessSupply(suppliedMeal)
  }

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {suppliesHeading(supplied.length)}
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
