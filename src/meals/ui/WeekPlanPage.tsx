import type { ReactNode } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  stageButtonLabel,
  transferButtonLabel,
  weekPlanHeading,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import type { Supply } from '../domain/supply'
import {
  plannedDayCount,
  WEEKDAYS,
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
  onChooseMeal: (day: Weekday, id: MealId | null) => void
  onShuffleDay: (day: Weekday) => void
  onShuffleWeek: () => void
  stage: WeekPlanStage
  onToggleStage: () => void
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
  stage,
  onToggleStage,
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
            {weekPlanHeading(plannedDays, stage)}
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
              stage={stage}
              onChooseMeal={onChooseMeal}
              onShuffleDay={onShuffleDay}
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
            aria-disabled={!canTransfer(stage, plannedDays)}
            onClick={onAddToShoppingList}
          >
            <AddToShoppingListIcon />
          </button>
        </BottomBar>
      </main>
    </>
  )
}
