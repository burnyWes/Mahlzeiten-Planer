import { useCallback, useEffect, useRef, useState } from 'react'
import type { WeekPlanClient } from '../api/weekPlanClient'
import type { MealId } from '../domain/meal'
import {
  DEFAULT_MAIN_MEAL_TIME_RULE,
  type MainMealTimeRule,
} from '../domain/randomPlanning'
import { isStaleSnapshot } from '../domain/unconfirmedWrite'
import type { PlanPeriod } from '../domain/planPeriod'
import {
  emptyWeekPlan,
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
  mainMealTimeRule: MainMealTimeRule
  chooseMeal: (slot: PlanSlot, id: MealId | null) => void
  replacePlan: (plan: WeekPlan) => void
  changeStage: (stage: WeekPlanStage) => void
  changeMainMealTimeRule: (rule: MainMealTimeRule) => void
}

export function useWeekPlan(
  client: WeekPlanClient,
  initialPeriod: PlanPeriod,
): WeekPlanning {
  const [plan, setPlan] = useState<WeekPlan>(() => emptyWeekPlan(initialPeriod))
  const [stage, setStage] = useState<WeekPlanStage>(EDITING_STAGE)
  const unconfirmedPlan = useRef<WeekPlan | null>(null)
  const unconfirmedStage = useRef<WeekPlanStage | null>(null)
  const [mainMealTimeRule, setMainMealTimeRule] = useState<MainMealTimeRule>(
    DEFAULT_MAIN_MEAL_TIME_RULE,
  )
  const unconfirmedMainMealTimeRule = useRef<MainMealTimeRule | null>(null)

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

  useEffect(
    () =>
      client.observeMainMealTimeRule((arriving) => {
        if (
          isStaleSnapshot(
            unconfirmedMainMealTimeRule.current,
            arriving,
            (one, other) => one === other,
          )
        )
          return
        unconfirmedMainMealTimeRule.current = null
        setMainMealTimeRule(arriving)
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

  const changeMainMealTimeRule = useCallback(
    (written: MainMealTimeRule) => {
      unconfirmedMainMealTimeRule.current = written
      setMainMealTimeRule(written)
      client.writeMainMealTimeRule(written)
    },
    [client],
  )

  return {
    plan,
    stage,
    mainMealTimeRule,
    chooseMeal,
    replacePlan,
    changeStage,
    changeMainMealTimeRule,
  }
}
