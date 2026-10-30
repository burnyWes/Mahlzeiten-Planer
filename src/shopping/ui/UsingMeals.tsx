import { useRef } from 'react'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { usingMealsHeading } from '../domain/announcements'
import type { MealUsingItem } from '../domain/knownItem'

type UsingMealsProps = {
  usingMeals: readonly MealUsingItem[]
  onRemove: (usingMeal: MealUsingItem) => void
}

export function UsingMeals({ usingMeals, onRemove }: UsingMealsProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const { keepRow, rowRemovedAt, fallbackAfterRemoval } = useFocusAfterRemoval(
    usingMeals.map((usingMeal) => usingMeal.mealId),
    heading,
  )

  function remove(usingMeal: MealUsingItem, position: number) {
    if (usingMeals.length === 1) {
      fallbackAfterRemoval()
    } else {
      rowRemovedAt(position)
    }
    onRemove(usingMeal)
  }

  return (
    <>
      <h2 ref={heading} tabIndex={-1}>
        {usingMealsHeading(usingMeals.length)}
      </h2>
      {usingMeals.length === 0 ? (
        <p>In keinem Gericht verwendet.</p>
      ) : (
        <ul className="itemList">
          {usingMeals.map((usingMeal, position) => (
            <li key={usingMeal.mealId} className="mealItemRow">
              <span>{usingMeal.mealName}</span>
              <button
                ref={keepRow(usingMeal.mealId)}
                type="button"
                className="iconButton"
                onClick={() => remove(usingMeal, position)}
                aria-label={`Entfernen, ${usingMeal.mealName}`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
