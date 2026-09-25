import type { ReactNode } from 'react'
import {
  dayShownAnnouncement,
  planEditableAnnouncement,
  planFixedAnnouncement,
  slotPlannedAnnouncement,
  weekPlanShuffledAnnouncement,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import {
  filledWeekPlan,
  pickMealFor,
  randomCandidates,
  type RandomSource,
} from '../domain/randomPlanning'
import type { Supply } from '../domain/supply'
import {
  coveredSlotsOf,
  isSuppliedIn,
  plannedMealCount,
  weekPlanTransfer,
  withMealIn,
  type PlanSlot,
  type WeekPlanTransfer,
  type Weekday,
} from '../domain/weekPlan'
import {
  canTransfer,
  EDITING_STAGE,
  FIXED_STAGE,
  isFixed,
  transferredStage,
} from '../domain/weekPlanStage'
import { WeekPlanPage } from './WeekPlanPage'
import type { WeekPlanning } from './useWeekPlan'

type WeekPlanAreaProps = {
  meals: readonly Meal[]
  weekPlanning: WeekPlanning
  supplies: readonly Supply[]
  shownDay: Weekday
  onShowDay: (day: Weekday) => void
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
  navigation,
  announce,
  random,
  onAddToShoppingList,
}: WeekPlanAreaProps) {
  const candidates = randomCandidates(meals)
  const { plan, stage } = weekPlanning
  const plannedMeals = plannedMealCount(plan, meals)

  function showDay(day: Weekday) {
    onShowDay(day)
    announce(dayShownAnnouncement(day))
  }

  function chooseMeal(slot: PlanSlot, id: MealId | null) {
    weekPlanning.chooseMeal(slot, id)
    const chosen = meals.find((meal) => meal.id === id)
    if (chosen === undefined) return
    const planned = withMealIn(weekPlanning.plan, slot, id)
    announce(
      slotPlannedAnnouncement(
        slot.time,
        chosen,
        isSuppliedIn(planned, slot, meals, supplies),
      ),
    )
  }

  function shuffleSlot(slot: PlanSlot) {
    const picked = pickMealFor(candidates, weekPlanning.plan, slot, random)
    if (picked === null) return
    chooseMeal(slot, picked.id)
  }

  function shuffleWeek() {
    weekPlanning.replacePlan(filledWeekPlan(candidates, random))
    announce(weekPlanShuffledAnnouncement())
  }

  function toggleStage() {
    if (isFixed(stage)) {
      weekPlanning.changeStage(EDITING_STAGE)
      announce(planEditableAnnouncement())
      return
    }
    weekPlanning.changeStage(FIXED_STAGE)
    announce(planFixedAnnouncement(plannedMeals))
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
      randomCandidateCount={candidates.length}
      plan={plan}
      supplies={supplies}
      shownDay={shownDay}
      onShowDay={showDay}
      onChooseMeal={chooseMeal}
      onShuffleSlot={shuffleSlot}
      onShuffleWeek={shuffleWeek}
      stage={stage}
      onToggleStage={toggleStage}
      onAddToShoppingList={addToShoppingList}
    />
  )
}
