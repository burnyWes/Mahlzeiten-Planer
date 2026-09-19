import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { weekPlanHeading } from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import {
  plannedDayCount,
  WEEKDAYS,
  type WeekPlan,
  type Weekday,
} from '../domain/weekPlan'
import { WeekPlanRow } from './WeekPlanRow'

type WeekPlanPageProps = {
  navigation: ReactNode
  meals: readonly Meal[]
  plan: WeekPlan
  onChooseMeal: (day: Weekday, id: MealId | null) => void
}

export function WeekPlanPage({
  navigation,
  meals,
  plan,
  onChooseMeal,
}: WeekPlanPageProps) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {weekPlanHeading(plannedDayCount(plan, meals))}
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
              onChooseMeal={onChooseMeal}
            />
          ))}
        </ul>
      </main>
    </>
  )
}
