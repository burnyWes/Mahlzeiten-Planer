import type { ReactNode } from 'react'
import {
  dayPlannedAnnouncement,
  weekPlanShuffledAnnouncement,
} from '../domain/announcements'
import type { Meal } from '../domain/meal'
import {
  filledWeekPlan,
  pickMealForDay,
  type RandomSource,
} from '../domain/randomPlanning'
import { plannedMeals, type Weekday } from '../domain/weekPlan'
import { WeekPlanPage } from './WeekPlanPage'
import type { WeekPlanning } from './useWeekPlan'

type WeekPlanAreaProps = {
  meals: readonly Meal[]
  weekPlanning: WeekPlanning
  navigation: ReactNode
  announce: (text: string) => void
  random: RandomSource
  onAddToShoppingList: (planned: readonly Meal[]) => void
}

export function WeekPlanArea({
  meals,
  weekPlanning,
  navigation,
  announce,
  random,
  onAddToShoppingList,
}: WeekPlanAreaProps) {
  function shuffleDay(day: Weekday) {
    const picked = pickMealForDay(meals, weekPlanning.plan, day, random)
    if (picked === null) return
    weekPlanning.chooseMeal(day, picked.id)
    announce(dayPlannedAnnouncement(day, picked))
  }

  function shuffleWeek() {
    weekPlanning.replacePlan(filledWeekPlan(meals, random))
    announce(weekPlanShuffledAnnouncement())
  }

  return (
    <WeekPlanPage
      navigation={navigation}
      meals={meals}
      plan={weekPlanning.plan}
      onChooseMeal={weekPlanning.chooseMeal}
      onShuffleDay={shuffleDay}
      onShuffleWeek={shuffleWeek}
      onAddToShoppingList={() =>
        onAddToShoppingList(plannedMeals(weekPlanning.plan, meals))
      }
    />
  )
}
