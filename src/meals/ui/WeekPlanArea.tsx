import type { ReactNode } from 'react'
import {
  dayShownAnnouncement,
  dayViewShownAnnouncement,
  mealTimeShownAnnouncement,
  noMatchingMealAnnouncement,
  planEditableAnnouncement,
  planFixedAnnouncement,
  slotPlannedAnnouncement,
  weekPlanClearedAnnouncement,
  weekPlanShuffledAnnouncement,
  weekViewShownAnnouncement,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import {
  filledWeekPlan,
  pickMealFor,
  randomCandidates,
  type RandomSource,
} from '../domain/randomPlanning'
import type { PlanDate } from '../domain/planDate'
import type { Supply } from '../domain/supply'
import {
  coveredSlotsOf,
  emptied,
  isSuppliedIn,
  plannedMealCount,
  slotCountOf,
  weekPlanTransfer,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlanTransfer,
} from '../domain/weekPlan'
import {
  canClear,
  canTransfer,
  EDITING_STAGE,
  FIXED_STAGE,
  isFixed,
  transferredStage,
} from '../domain/weekPlanStage'
import { slotNamingIn, type WeekPlanView } from '../domain/weekPlanView'
import { WeekPlanPage } from './WeekPlanPage'
import type { WeekPlanning } from './useWeekPlan'

type WeekPlanAreaProps = {
  meals: readonly Meal[]
  weekPlanning: WeekPlanning
  supplies: readonly Supply[]
  shownDay: PlanDate
  onShowDay: (day: PlanDate) => void
  shownView: WeekPlanView
  onShowView: (view: WeekPlanView) => void
  shownTime: MealTime
  onShowTime: (time: MealTime) => void
  navigation: ReactNode
  announce: (text: string) => void
  random: RandomSource
  onAddToShoppingList: (transfer: WeekPlanTransfer) => void
}

export function WeekPlanArea({
  meals,
  weekPlanning,
  supplies,
  shownDay,
  onShowDay,
  shownView,
  onShowView,
  shownTime,
  onShowTime,
  navigation,
  announce,
  random,
  onAddToShoppingList,
}: WeekPlanAreaProps) {
  const randomCandidateCount = randomCandidates(meals).length
  const { plan, stage, mainMealTimeRule } = weekPlanning
  const plannedMeals = plannedMealCount(plan, meals)

  function showDay(day: PlanDate) {
    onShowDay(day)
    announce(dayShownAnnouncement(day))
  }

  function showView(view: WeekPlanView) {
    onShowView(view)
    announce(
      view === 'week'
        ? weekViewShownAnnouncement(shownTime)
        : dayViewShownAnnouncement(shownDay),
    )
  }

  function showTime(time: MealTime) {
    if (time === shownTime) return
    onShowTime(time)
    announce(mealTimeShownAnnouncement(time))
  }

  function chooseMeal(slot: PlanSlot, id: MealId | null) {
    weekPlanning.chooseMeal(slot, id)
    const chosen = meals.find((meal) => meal.id === id)
    if (chosen === undefined) return
    const planned = withMealIn(weekPlanning.plan, slot, id)
    announce(
      slotPlannedAnnouncement(
        slot,
        slotNamingIn(shownView),
        chosen,
        isSuppliedIn(planned, slot, meals, supplies),
      ),
    )
  }

  function shuffleSlot(slot: PlanSlot) {
    const picked = pickMealFor(
      meals,
      weekPlanning.plan,
      slot,
      random,
      mainMealTimeRule,
    )
    if (picked === null) {
      announce(noMatchingMealAnnouncement(slot, slotNamingIn(shownView)))
      return
    }
    chooseMeal(slot, picked.id)
  }

  function shuffleWeek() {
    const rolled = filledWeekPlan(meals, plan.period, random, mainMealTimeRule)
    weekPlanning.replacePlan(rolled)
    announce(
      weekPlanShuffledAnnouncement(
        plannedMealCount(rolled, meals),
        slotCountOf(rolled),
      ),
    )
  }

  function clearPlan() {
    if (!canClear(stage, plannedMeals)) return
    weekPlanning.replacePlan(emptied(plan))
    announce(weekPlanClearedAnnouncement())
  }

  function toggleStage() {
    if (isFixed(stage)) {
      weekPlanning.changeStage(EDITING_STAGE)
      announce(planEditableAnnouncement())
      return
    }
    weekPlanning.changeStage(FIXED_STAGE)
    announce(planFixedAnnouncement(plannedMeals, slotCountOf(plan)))
  }

  function addToShoppingList() {
    if (!canTransfer(stage, plannedMeals)) return
    weekPlanning.changeStage(
      transferredStage(coveredSlotsOf(plan, meals, supplies)),
    )
    onAddToShoppingList(weekPlanTransfer(plan, meals, supplies))
  }

  return (
    <WeekPlanPage
      navigation={navigation}
      meals={meals}
      randomCandidateCount={randomCandidateCount}
      plan={plan}
      supplies={supplies}
      shownDay={shownDay}
      onShowDay={showDay}
      shownView={shownView}
      onShowView={showView}
      shownTime={shownTime}
      onShowTime={showTime}
      onChooseMeal={chooseMeal}
      onShuffleSlot={shuffleSlot}
      onShuffleWeek={shuffleWeek}
      stage={stage}
      onToggleStage={toggleStage}
      onAddToShoppingList={addToShoppingList}
      onClearPlan={clearPlan}
    />
  )
}
