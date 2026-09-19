import { useCallback, useEffect, useState } from 'react'
import type { WeekPlanClient } from '../api/weekPlanClient'
import type { MealId } from '../domain/meal'
import {
  EMPTY_WEEK_PLAN,
  withMealOnDay,
  type WeekPlan,
  type Weekday,
} from '../domain/weekPlan'

export type WeekPlanning = {
  plan: WeekPlan
  chooseMeal: (day: Weekday, id: MealId | null) => void
  replacePlan: (plan: WeekPlan) => void
}

export function useWeekPlan(client: WeekPlanClient): WeekPlanning {
  const [plan, setPlan] = useState<WeekPlan>(EMPTY_WEEK_PLAN)

  useEffect(() => client.observeWeekPlan(setPlan), [client])

  const replacePlan = useCallback(
    (written: WeekPlan) => {
      setPlan(written)
      client.writeWeekPlan(written)
    },
    [client],
  )

  const chooseMeal = useCallback(
    (day: Weekday, id: MealId | null) => {
      replacePlan(withMealOnDay(plan, day, id))
    },
    [plan, replacePlan],
  )

  return { plan, chooseMeal, replacePlan }
}
