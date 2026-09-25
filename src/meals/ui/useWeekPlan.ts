import { useCallback, useEffect, useRef, useState } from 'react'
import type { WeekPlanClient } from '../api/weekPlanClient'
import type { MealId } from '../domain/meal'
import { isStaleSnapshot } from '../domain/unconfirmedWrite'
import {
  EMPTY_WEEK_PLAN,
  sameWeekPlan,
  withMealIn,
  type PlanSlot,
  type WeekPlan,
} from '../domain/weekPlan'
import {
  EDITING_STAGE,
  sameStage,
  type WeekPlanStage,
} from '../domain/weekPlanStage'

export type WeekPlanning = {
  plan: WeekPlan
  stage: WeekPlanStage
  chooseMeal: (slot: PlanSlot, id: MealId | null) => void
  replacePlan: (plan: WeekPlan) => void
  changeStage: (stage: WeekPlanStage) => void
}

export function useWeekPlan(client: WeekPlanClient): WeekPlanning {
  const [plan, setPlan] = useState<WeekPlan>(EMPTY_WEEK_PLAN)
  const [stage, setStage] = useState<WeekPlanStage>(EDITING_STAGE)
  const unconfirmedPlan = useRef<WeekPlan | null>(null)
  const unconfirmedStage = useRef<WeekPlanStage | null>(null)

  useEffect(
    () =>
      client.observeWeekPlan((arriving) => {
        if (isStaleSnapshot(unconfirmedPlan.current, arriving, sameWeekPlan))
          return
        unconfirmedPlan.current = null
        setPlan(arriving)
      }),
    [client],
  )

  useEffect(
    () =>
      client.observeStage((arriving) => {
        if (isStaleSnapshot(unconfirmedStage.current, arriving, sameStage))
          return
        unconfirmedStage.current = null
        setStage(arriving)
      }),
    [client],
  )

  const replacePlan = useCallback(
    (written: WeekPlan) => {
      unconfirmedPlan.current = written
      setPlan(written)
      client.writeWeekPlan(written)
    },
    [client],
  )

  const chooseMeal = useCallback(
    (slot: PlanSlot, id: MealId | null) => {
      replacePlan(withMealIn(plan, slot, id))
    },
    [plan, replacePlan],
  )

  const changeStage = useCallback(
    (written: WeekPlanStage) => {
      unconfirmedStage.current = written
      setStage(written)
      client.writeStage(written)
    },
    [client],
  )

  return { plan, stage, chooseMeal, replacePlan, changeStage }
}
