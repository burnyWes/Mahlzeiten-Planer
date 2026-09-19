import { weekdayAbbreviation, weekdayName } from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import { shownMealOn, type WeekPlan, type Weekday } from '../domain/weekPlan'

type WeekPlanRowProps = {
  day: Weekday
  plan: WeekPlan
  meals: readonly Meal[]
  onChooseMeal: (day: Weekday, id: MealId | null) => void
}

export function WeekPlanRow({
  day,
  plan,
  meals,
  onChooseMeal,
}: WeekPlanRowProps) {
  return (
    <li className="weekPlanRow">
      <span className="weekday" aria-hidden="true">
        {weekdayAbbreviation(day)}
      </span>
      <select
        aria-label={weekdayName(day)}
        value={shownMealOn(plan, day, meals)?.id ?? ''}
        onChange={(event) =>
          onChooseMeal(
            day,
            event.target.value === '' ? null : event.target.value,
          )
        }
      >
        <option value="">Kein Gericht</option>
        {meals.map((meal) => (
          <option key={meal.id} value={meal.id}>
            {meal.name}
          </option>
        ))}
      </select>
    </li>
  )
}
