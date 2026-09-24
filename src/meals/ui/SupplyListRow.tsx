import type { Ref } from 'react'
import { Stepper } from '../../shared/ui/Stepper'
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
      <Stepper
        lessLabel={lessSupplyLabel(meal)}
        moreLabel={moreSupplyLabel(meal)}
        moreDisabled={isFull(count)}
        onLess={onLess}
        onMore={onMore}
      >
        <span className="stepperAmount">{count}</span>
      </Stepper>
    </li>
  )
}
