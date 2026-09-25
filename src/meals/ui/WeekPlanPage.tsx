import type { ReactNode } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  stageButtonLabel,
  transferButtonLabel,
  weekdayAbbreviation,
  weekdayName,
  weekPlanHeading,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import type { Supply } from '../domain/supply'
import {
  MEAL_TIMES,
  plannedMealCount,
  weekdayAfter,
  weekdayBefore,
  type PlanSlot,
  type WeekPlan,
  type Weekday,
} from '../domain/weekPlan'
import {
  canShuffle,
  canTransfer,
  isFixed,
  type WeekPlanStage,
} from '../domain/weekPlanStage'
import { AddToShoppingListIcon } from './AddToShoppingListIcon'
import { ChevronLeftIcon } from './ChevronLeftIcon'
import { ChevronRightIcon } from './ChevronRightIcon'
import { EditIcon } from './EditIcon'
import { LockIcon } from './LockIcon'
import { ShuffleIcon } from './ShuffleIcon'
import { WeekPlanRow } from './WeekPlanRow'

type WeekPlanPageProps = {
  navigation: ReactNode
  meals: readonly Meal[]
  randomCandidateCount: number
  plan: WeekPlan
  supplies: readonly Supply[]
  shownDay: Weekday
  onShowDay: (day: Weekday) => void
  onChooseMeal: (slot: PlanSlot, id: MealId | null) => void
  onShuffleSlot: (slot: PlanSlot) => void
  onShuffleWeek: () => void
  stage: WeekPlanStage
  onToggleStage: () => void
  onAddToShoppingList: () => void
}

type DayStepButtonProps = {
  label: string
  target: Weekday | null
  onShowDay: (day: Weekday) => void
  children: ReactNode
}

function DayStepButton({
  label,
  target,
  onShowDay,
  children,
}: DayStepButtonProps) {
  return (
    <button
      type="button"
      className="iconButton"
      aria-label={label}
      aria-disabled={target === null}
      onClick={() => {
        if (target !== null) onShowDay(target)
      }}
    >
      {children}
    </button>
  )
}

function DayNavigation({
  shownDay,
  onShowDay,
}: {
  shownDay: Weekday
  onShowDay: (day: Weekday) => void
}) {
  return (
    <div className="dayNavigation">
      <DayStepButton
        label="Vorheriger Tag"
        target={weekdayBefore(shownDay)}
        onShowDay={onShowDay}
      >
        <ChevronLeftIcon />
      </DayStepButton>
      <h2>
        <span aria-hidden="true">{weekdayAbbreviation(shownDay)}</span>
        <span className="visuallyHidden">{weekdayName(shownDay)}</span>
      </h2>
      <DayStepButton
        label="Nächster Tag"
        target={weekdayAfter(shownDay)}
        onShowDay={onShowDay}
      >
        <ChevronRightIcon />
      </DayStepButton>
    </div>
  )
}

export function WeekPlanPage({
  navigation,
  meals,
  randomCandidateCount,
  plan,
  supplies,
  shownDay,
  onShowDay,
  onChooseMeal,
  onShuffleSlot,
  onShuffleWeek,
  stage,
  onToggleStage,
  onAddToShoppingList,
}: WeekPlanPageProps) {
  const heading = useHeadingFocus()
  const plannedMeals = plannedMealCount(plan, meals)

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {weekPlanHeading(plannedMeals, stage)}
          </h1>
        </div>
        <DayNavigation shownDay={shownDay} onShowDay={onShowDay} />
        {meals.length === 0 && <p>Noch keine Gerichte gespeichert.</p>}
        <ul className="itemList">
          {MEAL_TIMES.map((time) => (
            <WeekPlanRow
              key={`${shownDay}-${time}`}
              slot={{ day: shownDay, time }}
              plan={plan}
              meals={meals}
              randomCandidateCount={randomCandidateCount}
              supplies={supplies}
              stage={stage}
              onChooseMeal={onChooseMeal}
              onShuffleSlot={onShuffleSlot}
            />
          ))}
        </ul>
        <BottomBar>
          <button
            type="button"
            aria-label="Zufallsauswahl generieren"
            disabled={!canShuffle(stage) || randomCandidateCount === 0}
            onClick={onShuffleWeek}
          >
            <ShuffleIcon />
          </button>
          <button
            type="button"
            aria-label={stageButtonLabel(stage)}
            onClick={onToggleStage}
          >
            {isFixed(stage) ? <EditIcon /> : <LockIcon />}
          </button>
          <button
            type="button"
            aria-label={transferButtonLabel(stage)}
            aria-disabled={!canTransfer(stage, plannedMeals)}
            onClick={onAddToShoppingList}
          >
            <AddToShoppingListIcon />
          </button>
        </BottomBar>
      </main>
    </>
  )
}
