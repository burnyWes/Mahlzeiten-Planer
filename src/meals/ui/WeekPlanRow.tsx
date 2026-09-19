import { useRef, useState, type FocusEvent } from 'react'
import {
  mealSuggestionsLabel,
  randomMealLabel,
  weekdayAbbreviation,
  weekdayName,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import { suggestMeals } from '../domain/mealSuggestions'
import { shownMealOn, type WeekPlan, type Weekday } from '../domain/weekPlan'
import { MealSuggestions } from './MealSuggestions'
import { ShuffleIcon } from './ShuffleIcon'

type WeekPlanRowProps = {
  day: Weekday
  plan: WeekPlan
  meals: readonly Meal[]
  onChooseMeal: (day: Weekday, id: MealId | null) => void
  onShuffleDay: (day: Weekday) => void
}

export function WeekPlanRow({
  day,
  plan,
  meals,
  onChooseMeal,
  onShuffleDay,
}: WeekPlanRowProps) {
  const [typed, setTyped] = useState<string | null>(null)
  const choice = useRef<HTMLDivElement>(null)
  const plannedName = shownMealOn(plan, day, meals)?.name ?? ''

  function change(written: string) {
    setTyped(written)
    if (written === '') onChooseMeal(day, null)
  }

  function chooseSuggestion(meal: Meal) {
    onChooseMeal(day, meal.id)
    setTyped(null)
  }

  function forgetTypingWhenLeaving(event: FocusEvent<HTMLInputElement>) {
    if (choice.current?.contains(event.relatedTarget)) return
    setTyped(null)
  }

  return (
    <li className="weekPlanRow">
      <div className="weekPlanChoice" ref={choice}>
        <span className="weekday" aria-hidden="true">
          {weekdayAbbreviation(day)}
        </span>
        <input
          aria-label={weekdayName(day)}
          value={typed ?? plannedName}
          onChange={(event) => change(event.target.value)}
          onBlur={forgetTypingWhenLeaving}
        />
        <button
          type="button"
          className="iconButton"
          aria-label={randomMealLabel(day)}
          disabled={meals.length === 0}
          onClick={() => onShuffleDay(day)}
        >
          <ShuffleIcon />
        </button>
        <MealSuggestions
          label={mealSuggestionsLabel(day)}
          meals={suggestMeals(meals, typed ?? '')}
          onChoose={chooseSuggestion}
        />
      </div>
    </li>
  )
}
