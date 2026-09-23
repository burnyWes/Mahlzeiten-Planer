import { useRef, useState, type FocusEvent } from 'react'
import { SnowflakeIcon } from '../../shared/ui/SnowflakeIcon'
import {
  mealSuggestionsLabel,
  randomMealLabel,
  weekdayAbbreviation,
  weekdayFieldLabel,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import { suggestMeals } from '../domain/mealSuggestions'
import type { Supply } from '../domain/supply'
import {
  isSuppliedOn,
  shownMealOn,
  type WeekPlan,
  type Weekday,
} from '../domain/weekPlan'
import { MealSuggestions } from './MealSuggestions'
import { ShuffleIcon } from './ShuffleIcon'

type WeekPlanRowProps = {
  day: Weekday
  plan: WeekPlan
  meals: readonly Meal[]
  randomCandidateCount: number
  supplies: readonly Supply[]
  onChooseMeal: (day: Weekday, id: MealId | null) => void
  onShuffleDay: (day: Weekday) => void
}

export function WeekPlanRow({
  day,
  plan,
  meals,
  randomCandidateCount,
  supplies,
  onChooseMeal,
  onShuffleDay,
}: WeekPlanRowProps) {
  const [typed, setTyped] = useState<string | null>(null)
  const choice = useRef<HTMLDivElement>(null)
  const plannedName = shownMealOn(plan, day, meals)?.name ?? ''
  const inSupply = isSuppliedOn(plan, day, meals, supplies)

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
        <span className="supplyMark" aria-hidden="true">
          {inSupply && <SnowflakeIcon />}
        </span>
        <input
          aria-label={weekdayFieldLabel(day, inSupply)}
          value={typed ?? plannedName}
          onChange={(event) => change(event.target.value)}
          onBlur={forgetTypingWhenLeaving}
        />
        <button
          type="button"
          className="iconButton"
          aria-label={randomMealLabel(day)}
          disabled={randomCandidateCount === 0}
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
