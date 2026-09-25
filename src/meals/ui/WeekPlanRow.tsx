import { useRef, useState, type FocusEvent } from 'react'
import { SnowflakeIcon } from '../../shared/ui/SnowflakeIcon'
import {
  fixedSlotText,
  mealSuggestionsLabel,
  mealTimeFieldLabel,
  randomMealLabel,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import { suggestMeals } from '../domain/mealSuggestions'
import type { Supply } from '../domain/supply'
import {
  shownMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
} from '../domain/weekPlan'
import {
  isCoveredIn,
  isFixed,
  type WeekPlanStage,
} from '../domain/weekPlanStage'
import { MealSuggestions } from './MealSuggestions'
import { MealTimeIcon } from './MealTimeIcon'
import { ShuffleIcon } from './ShuffleIcon'

type WeekPlanRowProps = {
  slot: PlanSlot
  plan: WeekPlan
  meals: readonly Meal[]
  randomCandidateCount: number
  supplies: readonly Supply[]
  stage: WeekPlanStage
  onChooseMeal: (slot: PlanSlot, id: MealId | null) => void
  onShuffleSlot: (slot: PlanSlot) => void
}

export function WeekPlanRow(props: WeekPlanRowProps) {
  return (
    <li className="weekPlanRow">
      {isFixed(props.stage) ? (
        <FixedSlot {...props} />
      ) : (
        <EditableSlot {...props} />
      )}
    </li>
  )
}

function MealTimeMarks({
  time,
  inSupply,
}: {
  time: MealTime
  inSupply: boolean
}) {
  return (
    <>
      <span className="mealTimeMark" aria-hidden="true">
        <MealTimeIcon time={time} />
      </span>
      <span className="supplyMark" aria-hidden="true">
        {inSupply && <SnowflakeIcon />}
      </span>
    </>
  )
}

function ShuffleSlotButton({
  slot,
  randomCandidateCount,
  onShuffleSlot,
}: WeekPlanRowProps) {
  return (
    <button
      type="button"
      className="iconButton"
      aria-label={randomMealLabel(slot.time)}
      disabled={randomCandidateCount === 0}
      onClick={() => onShuffleSlot(slot)}
    >
      <ShuffleIcon />
    </button>
  )
}

function FixedSlot(props: WeekPlanRowProps) {
  const { slot, plan, meals, supplies, stage } = props
  const planned = shownMealIn(plan, slot, meals)
  const inSupply = isCoveredIn(stage, plan, slot, meals, supplies)

  return (
    <div className="weekPlanChoice">
      <MealTimeMarks time={slot.time} inSupply={inSupply} />
      <span className="weekPlanMeal" aria-hidden="true">
        {planned?.name}
      </span>
      <span className="visuallyHidden">
        {fixedSlotText(slot.time, planned, inSupply)}
      </span>
    </div>
  )
}

function EditableSlot(props: WeekPlanRowProps) {
  const { slot, plan, meals, supplies, stage, onChooseMeal } = props
  const [typed, setTyped] = useState<string | null>(null)
  const choice = useRef<HTMLDivElement>(null)
  const plannedName = shownMealIn(plan, slot, meals)?.name ?? ''
  const inSupply = isCoveredIn(stage, plan, slot, meals, supplies)

  function change(written: string) {
    setTyped(written)
    if (written === '') onChooseMeal(slot, null)
  }

  function chooseSuggestion(meal: Meal) {
    onChooseMeal(slot, meal.id)
    setTyped(null)
  }

  function forgetTypingWhenLeaving(event: FocusEvent<HTMLInputElement>) {
    if (choice.current?.contains(event.relatedTarget)) return
    setTyped(null)
  }

  return (
    <div className="weekPlanChoice" ref={choice}>
      <MealTimeMarks time={slot.time} inSupply={inSupply} />
      <input
        aria-label={mealTimeFieldLabel(slot.time, inSupply)}
        value={typed ?? plannedName}
        onChange={(event) => change(event.target.value)}
        onBlur={forgetTypingWhenLeaving}
      />
      <ShuffleSlotButton {...props} />
      <MealSuggestions
        label={mealSuggestionsLabel(slot.time)}
        meals={suggestMeals(meals, typed ?? '')}
        onChoose={chooseSuggestion}
      />
    </div>
  )
}
