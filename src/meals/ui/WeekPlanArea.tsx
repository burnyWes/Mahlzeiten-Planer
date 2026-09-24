import type { ReactNode } from 'react'
import {
  dayPlannedAnnouncement,
  planEditableAnnouncement,
  planFixedAnnouncement,
  weekPlanShuffledAnnouncement,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import {
  filledWeekPlan,
  pickMealForDay,
  randomCandidates,
  type RandomSource,
} from '../domain/randomPlanning'
import type { Supply } from '../domain/supply'
import {
  isSuppliedOn,
  plannedDayCount,
  weekPlanTransfer,
  withMealOnDay,
  type WeekPlanTransfer,
  type Weekday,
} from '../domain/weekPlan'
import {
  canTransfer,
  EDITING_STAGE,
  FIXED_STAGE,
  isFixed,
} from '../domain/weekPlanStage'
import { WeekPlanPage } from './WeekPlanPage'
import type { WeekPlanning } from './useWeekPlan'

type WeekPlanAreaProps = {
  meals: readonly Meal[]
  weekPlanning: WeekPlanning
  supplies: readonly Supply[]
  navigation: ReactNode
  announce: (text: string) => void
  random: RandomSource
  onAddToShoppingList: (transfer: WeekPlanTransfer) => void
}

export function WeekPlanArea({
  meals,
  weekPlanning,
  supplies,
  navigation,
  announce,
  random,
  onAddToShoppingList,
}: WeekPlanAreaProps) {
  const candidates = randomCandidates(meals)
  const { plan, stage } = weekPlanning
  const plannedDays = plannedDayCount(plan, meals)

  function chooseMeal(day: Weekday, id: MealId | null) {
    weekPlanning.chooseMeal(day, id)
    const chosen = meals.find((meal) => meal.id === id)
    if (chosen === undefined) return
    const planned = withMealOnDay(weekPlanning.plan, day, id)
    announce(
      dayPlannedAnnouncement(
        day,
        chosen,
        isSuppliedOn(planned, day, meals, supplies),
      ),
    )
  }

  function shuffleDay(day: Weekday) {
    const picked = pickMealForDay(candidates, weekPlanning.plan, day, random)
    if (picked === null) return
    chooseMeal(day, picked.id)
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
    announce(planFixedAnnouncement(plannedDays))
  }

  function addToShoppingList() {
    if (!canTransfer(stage, plannedDays)) return
    onAddToShoppingList(weekPlanTransfer(plan, meals, supplies))
  }

  return (
    <WeekPlanPage
      navigation={navigation}
      meals={meals}
      randomCandidateCount={candidates.length}
      plan={plan}
      supplies={supplies}
      onChooseMeal={chooseMeal}
      onShuffleDay={shuffleDay}
      onShuffleWeek={shuffleWeek}
      stage={stage}
      onToggleStage={toggleStage}
      onAddToShoppingList={addToShoppingList}
    />
  )
}
