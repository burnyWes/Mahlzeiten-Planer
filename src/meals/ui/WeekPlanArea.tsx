import type { ReactNode } from 'react'
import {
  dayPlannedAnnouncement,
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
  weekPlanTransfer,
  withMealOnDay,
  type WeekPlanTransfer,
  type Weekday,
} from '../domain/weekPlan'
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

  return (
    <WeekPlanPage
      navigation={navigation}
      meals={meals}
      randomCandidateCount={candidates.length}
      plan={weekPlanning.plan}
      supplies={supplies}
      onChooseMeal={chooseMeal}
      onShuffleDay={shuffleDay}
      onShuffleWeek={shuffleWeek}
      onAddToShoppingList={() =>
        onAddToShoppingList(
          weekPlanTransfer(weekPlanning.plan, meals, supplies),
        )
      }
    />
  )
}
