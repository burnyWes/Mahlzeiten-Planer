import type { Ref } from 'react'
import { lessSupplyLabel, moreSupplyLabel } from '../domain/announcements'
import { isFull, type SuppliedMeal } from '../domain/supply'

type SupplyListRowProps = {
  supplied: SuppliedMeal
  nameButton: Ref<HTMLButtonElement>
  onOpenSupply: (supplied: SuppliedMeal) => void
  onLess: () => void
  onMore: () => void
}

export function SupplyListRow({
  supplied,
  nameButton,
  onOpenSupply,
  onLess,
  onMore,
}: SupplyListRowProps) {
  const { meal, count } = supplied

  return (
    <li className="supplyRow">
      <button
        type="button"
        className="mealNameButton"
        ref={nameButton}
        onClick={() => onOpenSupply(supplied)}
      >
        {meal.name}
      </button>
      <span className="supplyStepper">
        <button
          type="button"
          className="stepperButton"
          aria-label={lessSupplyLabel(meal)}
          onClick={onLess}
        >
          −
        </button>
        <span className="supplyCount">{count}</span>
        <button
          type="button"
          className="stepperButton"
          aria-label={moreSupplyLabel(meal)}
          disabled={isFull(count)}
          onClick={onMore}
        >
          +
        </button>
      </span>
    </li>
  )
}
