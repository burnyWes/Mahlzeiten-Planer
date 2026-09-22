import type { SuppliedMeal } from '../domain/supply'

type SupplyListRowProps = {
  supplied: SuppliedMeal
  onOpenSupply: (supplied: SuppliedMeal) => void
}

export function SupplyListRow({ supplied, onOpenSupply }: SupplyListRowProps) {
  return (
    <li className="supplyRow">
      <button
        type="button"
        className="mealNameButton"
        onClick={() => onOpenSupply(supplied)}
      >
        {supplied.meal.name}
      </button>
      <span className="supplyCount">{supplied.count}</span>
    </li>
  )
}
