import type { ReactNode } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  mealTimeName,
  stageButtonLabel,
  planDateHeading,
  planDateName,
  transferButtonLabel,
  weekPlanHeading,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import type { PlanDate } from '../domain/planDate'
import { dateAfter, dateBefore, type PlanPeriod } from '../domain/planPeriod'
import type { Supply } from '../domain/supply'
import {
  MEAL_TIMES,
  plannedMealCount,
  slotCountOf,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
} from '../domain/weekPlan'
import {
  shownSlots,
  slotNamingIn,
  type WeekPlanView,
} from '../domain/weekPlanView'
import {
  canChoosePeriod,
  canClear,
  canShuffle,
  canTransfer,
  isFixed,
  type WeekPlanStage,
} from '../domain/weekPlanStage'
import { AddToShoppingListIcon } from './AddToShoppingListIcon'
import { CalendarCogIcon } from './CalendarCogIcon'
import { CalendarDaysIcon } from './CalendarDaysIcon'
import { CalendarOneIcon } from './CalendarOneIcon'
import { ChevronLeftIcon } from './ChevronLeftIcon'
import { ChevronRightIcon } from './ChevronRightIcon'
import { EditIcon } from './EditIcon'
import { EraserIcon } from './EraserIcon'
import { LockIcon } from './LockIcon'
import { MealTimeIcon } from './MealTimeIcon'
import { ShuffleIcon } from './ShuffleIcon'
import { WeekPlanRow } from './WeekPlanRow'

type WeekPlanPageProps = {
  navigation: ReactNode
  meals: readonly Meal[]
  randomCandidateCount: number
  plan: WeekPlan
  supplies: readonly Supply[]
  shownDay: PlanDate
  onShowDay: (day: PlanDate) => void
  shownView: WeekPlanView
  onShowView: (view: WeekPlanView) => void
  shownTime: MealTime
  onShowTime: (time: MealTime) => void
  onChooseMeal: (slot: PlanSlot, id: MealId | null) => void
  onShuffleSlot: (slot: PlanSlot) => void
  onShuffleWeek: () => void
  stage: WeekPlanStage
  onToggleStage: () => void
  onAddToShoppingList: () => void
  onClearPlan: () => void
  onChoosePeriod: () => void
}

type DayStepButtonProps = {
  label: string
  target: PlanDate | null
  onShowDay: (day: PlanDate) => void
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
  period,
  shownDay,
  onShowDay,
}: {
  period: PlanPeriod
  shownDay: PlanDate
  onShowDay: (day: PlanDate) => void
}) {
  return (
    <div className="dayNavigation">
      <DayStepButton
        label="Vorheriger Tag"
        target={dateBefore(period, shownDay)}
        onShowDay={onShowDay}
      >
        <ChevronLeftIcon />
      </DayStepButton>
      <h2>
        <span aria-hidden="true">{planDateHeading(shownDay)}</span>
        <span className="visuallyHidden">{planDateName(shownDay)}</span>
      </h2>
      <DayStepButton
        label="Nächster Tag"
        target={dateAfter(period, shownDay)}
        onShowDay={onShowDay}
      >
        <ChevronRightIcon />
      </DayStepButton>
    </div>
  )
}

function MealTimeNavigation({
  shownTime,
  onShowTime,
}: {
  shownTime: MealTime
  onShowTime: (time: MealTime) => void
}) {
  return (
    <div className="mealTimeNavigation" role="group" aria-label="Tageszeit">
      {MEAL_TIMES.map((time) => (
        <button
          key={time}
          type="button"
          className="iconButton"
          aria-label={mealTimeName(time)}
          aria-pressed={time === shownTime}
          onClick={() => onShowTime(time)}
        >
          <MealTimeIcon time={time} />
        </button>
      ))}
    </div>
  )
}

function ViewSwitchButton({
  shownView,
  onShowView,
}: {
  shownView: WeekPlanView
  onShowView: (view: WeekPlanView) => void
}) {
  return shownView === 'day' ? (
    <button
      type="button"
      className="iconButton"
      aria-label="Wochenansicht"
      onClick={() => onShowView('week')}
    >
      <CalendarDaysIcon />
    </button>
  ) : (
    <button
      type="button"
      className="iconButton"
      aria-label="Tagesansicht"
      onClick={() => onShowView('day')}
    >
      <CalendarOneIcon />
    </button>
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
  shownView,
  onShowView,
  shownTime,
  onShowTime,
  onChooseMeal,
  onShuffleSlot,
  onShuffleWeek,
  stage,
  onToggleStage,
  onAddToShoppingList,
  onClearPlan,
  onChoosePeriod,
}: WeekPlanPageProps) {
  const heading = useHeadingFocus()
  const plannedMeals = plannedMealCount(plan, meals)

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {weekPlanHeading(plannedMeals, slotCountOf(plan), stage)}
          </h1>
          <button
            type="button"
            className="iconButton"
            aria-label="Zeitraum wählen"
            aria-disabled={!canChoosePeriod(stage)}
            onClick={onChoosePeriod}
          >
            <CalendarCogIcon />
          </button>
        </div>
        <div className="planNavigation">
          {shownView === 'day' ? (
            <DayNavigation
              period={plan.period}
              shownDay={shownDay}
              onShowDay={onShowDay}
            />
          ) : (
            <MealTimeNavigation shownTime={shownTime} onShowTime={onShowTime} />
          )}
          <ViewSwitchButton shownView={shownView} onShowView={onShowView} />
        </div>
        {shownView === 'week' && (
          <h2 className="visuallyHidden">{mealTimeName(shownTime)}</h2>
        )}
        {meals.length === 0 && <p>Noch keine Gerichte gespeichert.</p>}
        <ul className="itemList">
          {shownSlots(shownView, plan.period, shownDay, shownTime).map(
            (slot) => (
              <WeekPlanRow
                key={`${shownView}-${slot.date}-${slot.time}`}
                slot={slot}
                naming={slotNamingIn(shownView)}
                plan={plan}
                meals={meals}
                randomCandidateCount={randomCandidateCount}
                supplies={supplies}
                stage={stage}
                onChooseMeal={onChooseMeal}
                onShuffleSlot={onShuffleSlot}
              />
            ),
          )}
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
          <button
            type="button"
            aria-label="Wochenplan leeren"
            aria-disabled={!canClear(stage, plannedMeals)}
            onClick={onClearPlan}
          >
            <EraserIcon />
          </button>
        </BottomBar>
      </main>
    </>
  )
}
