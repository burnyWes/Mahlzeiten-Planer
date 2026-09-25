import {
  DEFAULT_MAIN_MEAL_TIME_RULE,
  type MainMealTimeRule,
} from '../domain/randomPlanning'
import { EMPTY_WEEK_PLAN, type WeekPlan } from '../domain/weekPlan'
import { EDITING_STAGE, type WeekPlanStage } from '../domain/weekPlanStage'
import type { WeekPlanClient } from './weekPlanClient'

export type InMemoryWeekPlanClient = WeekPlanClient & {
  weekPlanArrivesFromElsewhere(plan: WeekPlan): void
  storedWeekPlan(): WeekPlan
  stageArrivesFromElsewhere(stage: WeekPlanStage): void
  storedStage(): WeekPlanStage
  mainMealTimeRuleArrivesFromElsewhere(rule: MainMealTimeRule): void
  storedMainMealTimeRule(): MainMealTimeRule
}

export function createInMemoryWeekPlanClient(
  initialPlan: WeekPlan = EMPTY_WEEK_PLAN,
  initialStage: WeekPlanStage = EDITING_STAGE,
  initialMainMealTimeRule: MainMealTimeRule = DEFAULT_MAIN_MEAL_TIME_RULE,
): InMemoryWeekPlanClient {
  let plan = initialPlan
  let stage = initialStage
  let mainMealTimeRule = initialMainMealTimeRule
  const listeners = new Set<(plan: WeekPlan) => void>()
  const stageListeners = new Set<(stage: WeekPlanStage) => void>()
  const ruleListeners = new Set<(rule: MainMealTimeRule) => void>()

  function publish() {
    listeners.forEach((listener) => listener(plan))
  }

  function publishStage() {
    stageListeners.forEach((listener) => listener(stage))
  }

  function publishMainMealTimeRule() {
    ruleListeners.forEach((listener) => listener(mainMealTimeRule))
  }

  return {
    observeWeekPlan(onWeekPlan) {
      listeners.add(onWeekPlan)
      onWeekPlan(plan)
      return () => listeners.delete(onWeekPlan)
    },
    writeWeekPlan(written) {
      plan = written
      publish()
    },
    observeStage(onStage) {
      stageListeners.add(onStage)
      onStage(stage)
      return () => stageListeners.delete(onStage)
    },
    writeStage(written) {
      stage = written
      publishStage()
    },
    observeMainMealTimeRule(onRule) {
      ruleListeners.add(onRule)
      onRule(mainMealTimeRule)
      return () => ruleListeners.delete(onRule)
    },
    writeMainMealTimeRule(written) {
      mainMealTimeRule = written
      publishMainMealTimeRule()
    },
    weekPlanArrivesFromElsewhere(arriving) {
      plan = arriving
      publish()
    },
    storedWeekPlan() {
      return plan
    },
    stageArrivesFromElsewhere(arriving) {
      stage = arriving
      publishStage()
    },
    storedStage() {
      return stage
    },
    mainMealTimeRuleArrivesFromElsewhere(arriving) {
      mainMealTimeRule = arriving
      publishMainMealTimeRule()
    },
    storedMainMealTimeRule() {
      return mainMealTimeRule
    },
  }
}
