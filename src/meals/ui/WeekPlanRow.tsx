import { useRef, useState, type FocusEvent } from 'react'
import { SnowflakeIcon } from '../../shared/ui/SnowflakeIcon'
import {
  fixedDayText,
  mealSuggestionsLabel,
  randomMealLabel,
  weekdayAbbreviation,
  weekdayFieldLabel,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import { suggestMeals } from '../domain/mealSuggestions'
import type { Supply } from '../domain/supply'
import { shownMealOn, type WeekPlan, type Weekday } from '../domain/weekPlan'
import {
  isCoveredOn,
  isFixed,
  type WeekPlanStage,
} from '../domain/weekPlanStage'
import { MealSuggestions } from './MealSuggestions'
import { ShuffleIcon } from './ShuffleIcon'

type WeekPlanRowProps = {
  day: Weekday
  plan: WeekPlan
  meals: readonly Meal[]
  randomCandidateCount: number
  supplies: readonly Supply[]
  stage: WeekPlanStage
  onChooseMeal: (day: Weekday, id: MealId | null) => void
  onShuffleDay: (day: Weekday) => void
}

export function WeekPlanRow(props: WeekPlanRowProps) {
  return (
    <li className="weekPlanRow">
      {isFixed(props.stage) ? (
        <FixedDay {...props} />
      ) : (
        <EditableDay {...props} />
      )}
    </li>
  )
}

function DayMarks({ day, inSupply }: { day: Weekday; inSupply: boolean }) {
  return (
    <>
      <span className="weekday" aria-hidden="true">
        {weekdayAbbreviation(day)}
      </span>
      <span className="supplyMark" aria-hidden="true">
        {inSupply && <SnowflakeIcon />}
      </span>
    </>
  )
}

function ShuffleDayButton({
  day,
  randomCandidateCount,
  onShuffleDay,
}: WeekPlanRowProps) {
  return (
    <button
      type="button"
      className="iconButton"
      aria-label={randomMealLabel(day)}
      disabled={randomCandidateCount === 0}
      onClick={() => onShuffleDay(day)}
    >
      <ShuffleIcon />
    </button>
  )
}

function FixedDay(props: WeekPlanRowProps) {
  const { day, plan, meals, supplies, stage } = props
  const planned = shownMealOn(plan, day, meals)
  const inSupply = isCoveredOn(stage, plan, day, meals, supplies)

  return (
    <div className="weekPlanChoice">
      <DayMarks day={day} inSupply={inSupply} />
      <span className="weekPlanMeal" aria-hidden="true">
        {planned?.name}
      </span>
      <span className="visuallyHidden">
        {fixedDayText(day, planned, inSupply)}
      </span>
    </div>
  )
}

function EditableDay(props: WeekPlanRowProps) {
  const { day, plan, meals, supplies, stage, onChooseMeal } = props
  const [typed, setTyped] = useState<string | null>(null)
  const choice = useRef<HTMLDivElement>(null)
  const plannedName = shownMealOn(plan, day, meals)?.name ?? ''
  const inSupply = isCoveredOn(stage, plan, day, meals, supplies)

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
    <div className="weekPlanChoice" ref={choice}>
      <DayMarks day={day} inSupply={inSupply} />
      <input
        aria-label={weekdayFieldLabel(day, inSupply)}
        value={typed ?? plannedName}
        onChange={(event) => change(event.target.value)}
        onBlur={forgetTypingWhenLeaving}
      />
      <ShuffleDayButton {...props} />
      <MealSuggestions
        label={mealSuggestionsLabel(day)}
        meals={suggestMeals(meals, typed ?? '')}
        onChoose={chooseSuggestion}
      />
    </div>
  )
}
