import type { ReactNode } from 'react'
import type { Meal } from '../domain/meal'
import { WeekPlanPage } from './WeekPlanPage'
import type { WeekPlanning } from './useWeekPlan'

type WeekPlanAreaProps = {
  meals: readonly Meal[]
  weekPlanning: WeekPlanning
  navigation: ReactNode
}

export function WeekPlanArea({
  meals,
  weekPlanning,
  navigation,
}: WeekPlanAreaProps) {
  return (
    <WeekPlanPage
      navigation={navigation}
      meals={meals}
      plan={weekPlanning.plan}
      onChooseMeal={weekPlanning.chooseMeal}
    />
  )
}
