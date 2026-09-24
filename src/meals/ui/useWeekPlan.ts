import { useCallback, useEffect, useState } from 'react'
import type { WeekPlanClient } from '../api/weekPlanClient'
import type { MealId } from '../domain/meal'
import {
  EMPTY_WEEK_PLAN,
  withMealOnDay,
  type WeekPlan,
  type Weekday,
} from '../domain/weekPlan'
import { EDITING_STAGE, type WeekPlanStage } from '../domain/weekPlanStage'

export type WeekPlanning = {
  plan: WeekPlan
  stage: WeekPlanStage
  chooseMeal: (day: Weekday, id: MealId | null) => void
  replacePlan: (plan: WeekPlan) => void
  changeStage: (stage: WeekPlanStage) => void
}

export function useWeekPlan(client: WeekPlanClient): WeekPlanning {
  const [plan, setPlan] = useState<WeekPlan>(EMPTY_WEEK_PLAN)
  const [stage, setStage] = useState<WeekPlanStage>(EDITING_STAGE)

  useEffect(() => client.observeWeekPlan(setPlan), [client])
  useEffect(() => client.observeStage(setStage), [client])

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

  const changeStage = useCallback(
    (written: WeekPlanStage) => {
      setStage(written)
      client.writeStage(written)
    },
    [client],
  )

  return { plan, stage, chooseMeal, replacePlan, changeStage }
}
