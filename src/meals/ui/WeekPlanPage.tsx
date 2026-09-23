import type { ReactNode } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { weekPlanHeading } from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import type { Supply } from '../domain/supply'
import {
  plannedDayCount,
  WEEKDAYS,
  type WeekPlan,
  type Weekday,
} from '../domain/weekPlan'
import { AddToShoppingListIcon } from './AddToShoppingListIcon'
import { ShuffleIcon } from './ShuffleIcon'
import { WeekPlanRow } from './WeekPlanRow'

type WeekPlanPageProps = {
  navigation: ReactNode
  meals: readonly Meal[]
  randomCandidateCount: number
  plan: WeekPlan
  supplies: readonly Supply[]
  onChooseMeal: (day: Weekday, id: MealId | null) => void
  onShuffleDay: (day: Weekday) => void
  onShuffleWeek: () => void
  onAddToShoppingList: () => void
}

export function WeekPlanPage({
  navigation,
  meals,
  randomCandidateCount,
  plan,
  supplies,
  onChooseMeal,
  onShuffleDay,
  onShuffleWeek,
  onAddToShoppingList,
}: WeekPlanPageProps) {
  const heading = useHeadingFocus()
  const plannedDays = plannedDayCount(plan, meals)

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {weekPlanHeading(plannedDays)}
          </h1>
        </div>
        {meals.length === 0 && <p>Noch keine Gerichte gespeichert.</p>}
        <ul className="itemList">
          {WEEKDAYS.map((day) => (
            <WeekPlanRow
              key={day}
              day={day}
              plan={plan}
              meals={meals}
              randomCandidateCount={randomCandidateCount}
              supplies={supplies}
              onChooseMeal={onChooseMeal}
              onShuffleDay={onShuffleDay}
            />
          ))}
        </ul>
        <BottomBar>
          <button
            type="button"
            aria-label="Zufallsauswahl generieren"
            disabled={randomCandidateCount === 0}
            onClick={onShuffleWeek}
          >
            <ShuffleIcon />
          </button>
          <button
            type="button"
            aria-label="Auf die Einkaufsliste"
            disabled={plannedDays === 0}
            onClick={onAddToShoppingList}
          >
            <AddToShoppingListIcon />
          </button>
        </BottomBar>
      </main>
    </>
  )
}
