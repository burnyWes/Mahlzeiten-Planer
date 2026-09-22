import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { suppliesHeading } from '../domain/announcements'
import type { SuppliedMeal } from '../domain/supply'
import { SupplyListRow } from './SupplyListRow'

type SupplyListPageProps = {
  navigation: ReactNode
  supplied: readonly SuppliedMeal[]
  onAddSupply: () => void
  onOpenSupply: (supplied: SuppliedMeal) => void
}

export function SupplyListPage({
  navigation,
  supplied,
  onAddSupply,
  onOpenSupply,
}: SupplyListPageProps) {
  const heading = useHeadingFocus()

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
            {supplied.map((suppliedMeal) => (
              <SupplyListRow
                key={suppliedMeal.meal.id}
                supplied={suppliedMeal}
                onOpenSupply={onOpenSupply}
              />
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
