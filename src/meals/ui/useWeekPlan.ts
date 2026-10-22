import { useCallback, useEffect, useRef, useState } from 'react'
import type { WeekPlanClient } from '../api/weekPlanClient'
import type { MealId } from '../domain/meal'
import {
  DEFAULT_ROLLING_RULES,
  sameRollingRules,
  withRuleSwitched,
  type MainMealTimeRule,
  type RollingRules,
  type RuleInScope,
} from '../domain/rollingRules'
import { EMPTY_ROLL_MEMORY, type RollMemory } from '../domain/rollMemory'
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
  isFixed,
  sameStage,
  type WeekPlanStage,
} from '../domain/weekPlanStage'

export type WeekPlanning = {
  plan: WeekPlan
  stage: WeekPlanStage
  rollingRules: RollingRules
  rollMemory: RollMemory
  rememberRolls: (memory: RollMemory) => void
  chooseMeal: (slot: PlanSlot, id: MealId | null) => void
  replacePlan: (plan: WeekPlan) => void
  changeStage: (stage: WeekPlanStage) => void
  changeMainMealTimeRule: (rule: MainMealTimeRule) => void
  switchRule: (ruleInScope: RuleInScope, on: boolean) => void
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
  const [rollMemory, setRollMemory] = useState<RollMemory>(EMPTY_ROLL_MEMORY)

  const forgetRollsOnceFixed = useCallback((changed: WeekPlanStage) => {
    if (isFixed(changed)) setRollMemory(EMPTY_ROLL_MEMORY)
  }, [])

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
        forgetRollsOnceFixed(arriving)
      }),
    [client, forgetRollsOnceFixed],
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
      forgetRollsOnceFixed(written)
      client.writeStage(written)
    },
    [client, forgetRollsOnceFixed],
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

  const switchRule = useCallback(
    (ruleInScope: RuleInScope, on: boolean) =>
      changeRollingRules(withRuleSwitched(rollingRules, ruleInScope, on)),
    [rollingRules, changeRollingRules],
  )

  return {
    plan,
    stage,
    rollingRules,
    rollMemory,
    rememberRolls: setRollMemory,
    chooseMeal,
    replacePlan,
    changeStage,
    changeMainMealTimeRule,
    switchRule,
  }
}
