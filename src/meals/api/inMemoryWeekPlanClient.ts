import {
  DEFAULT_ROLLING_RULES,
  type RollingRules,
} from '../domain/randomPlanning'
import type { WeekPlan } from '../domain/weekPlan'
import { EDITING_STAGE, type WeekPlanStage } from '../domain/weekPlanStage'
import type { WeekPlanClient } from './weekPlanClient'

export type InMemoryWeekPlanClient = WeekPlanClient & {
  weekPlanArrivesFromElsewhere(plan: WeekPlan): void
  storedWeekPlan(): WeekPlan
  stageArrivesFromElsewhere(stage: WeekPlanStage): void
  storedStage(): WeekPlanStage
  rollingRulesArriveFromElsewhere(rules: RollingRules): void
  storedRollingRules(): RollingRules
}

export function createInMemoryWeekPlanClient(
  initialPlan: WeekPlan,
  initialStage: WeekPlanStage = EDITING_STAGE,
  initialRollingRules: RollingRules = DEFAULT_ROLLING_RULES,
): InMemoryWeekPlanClient {
  let plan = initialPlan
  let stage = initialStage
  let rollingRules = initialRollingRules
  const listeners = new Set<(plan: WeekPlan) => void>()
  const stageListeners = new Set<(stage: WeekPlanStage) => void>()
  const rulesListeners = new Set<(rules: RollingRules) => void>()

  function publish() {
    listeners.forEach((listener) => listener(plan))
  }

  function publishStage() {
    stageListeners.forEach((listener) => listener(stage))
  }

  function publishRollingRules() {
    rulesListeners.forEach((listener) => listener(rollingRules))
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
    observeRollingRules(onRules) {
      rulesListeners.add(onRules)
      onRules(rollingRules)
      return () => rulesListeners.delete(onRules)
    },
    writeRollingRules(written) {
      rollingRules = written
      publishRollingRules()
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
    rollingRulesArriveFromElsewhere(arriving) {
      rollingRules = arriving
      publishRollingRules()
    },
    storedRollingRules() {
      return rollingRules
    },
  }
}
