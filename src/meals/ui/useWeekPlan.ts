import { useCallback, useEffect, useRef, useState } from 'react'
import type { WeekPlanClient } from '../api/weekPlanClient'
import type { MealId } from '../domain/meal'
import {
  DEFAULT_ROLLING_RULES,
  sameRollingRules,
  type MainMealTimeRule,
  type RollingRules,
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
  rollingRules: RollingRules
  chooseMeal: (slot: PlanSlot, id: MealId | null) => void
  replacePlan: (plan: WeekPlan) => void
  changeStage: (stage: WeekPlanStage) => void
  changeMainMealTimeRule: (rule: MainMealTimeRule) => void
  changeLeftoverPlanning: (plansLeftovers: boolean) => void
}

export function useWeekPlan(
  client: WeekPlanClient,
  initialPeriod: PlanPeriod,
): WeekPlanning {
  const [plan, setPlan] = useState<WeekPlan>(() => emptyWeekPlan(initialPeriod))
  const [stage, setStage] = useState<WeekPlanStage>(EDITING_STAGE)
  const unconfirmedPlan = useRef<WeekPlan | null>(null)
  const unconfirmedStage = useRef<WeekPlanStage | null>(null)
  const [rollingRules, setRollingRules] = useState<RollingRules>(
    DEFAULT_ROLLING_RULES,
  )
  const unconfirmedRollingRules = useRef<RollingRules | null>(null)

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
      client.observeRollingRules((arriving) => {
        if (
          isStaleSnapshot(
            unconfirmedRollingRules.current,
            arriving,
            sameRollingRules,
          )
        )
          return
        unconfirmedRollingRules.current = null
        setRollingRules(arriving)
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

  const changeRollingRules = useCallback(
    (written: RollingRules) => {
      unconfirmedRollingRules.current = written
      setRollingRules(written)
      client.writeRollingRules(written)
    },
    [client],
  )

  const changeMainMealTimeRule = useCallback(
    (mainMealTime: MainMealTimeRule) =>
      changeRollingRules({ ...rollingRules, mainMealTime }),
    [rollingRules, changeRollingRules],
  )

  const changeLeftoverPlanning = useCallback(
    (plansLeftovers: boolean) =>
      changeRollingRules({ ...rollingRules, plansLeftovers }),
    [rollingRules, changeRollingRules],
  )

  return {
    plan,
    stage,
    rollingRules,
    chooseMeal,
    replacePlan,
    changeStage,
    changeMainMealTimeRule,
    changeLeftoverPlanning,
  }
}
