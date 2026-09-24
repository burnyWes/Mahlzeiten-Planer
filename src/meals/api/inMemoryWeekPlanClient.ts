import { EMPTY_WEEK_PLAN, type WeekPlan } from '../domain/weekPlan'
import { EDITING_STAGE, type WeekPlanStage } from '../domain/weekPlanStage'
import type { WeekPlanClient } from './weekPlanClient'

export type InMemoryWeekPlanClient = WeekPlanClient & {
  weekPlanArrivesFromElsewhere(plan: WeekPlan): void
  storedWeekPlan(): WeekPlan
  stageArrivesFromElsewhere(stage: WeekPlanStage): void
  storedStage(): WeekPlanStage
}

export function createInMemoryWeekPlanClient(
  initialPlan: WeekPlan = EMPTY_WEEK_PLAN,
  initialStage: WeekPlanStage = EDITING_STAGE,
): InMemoryWeekPlanClient {
  let plan = initialPlan
  let stage = initialStage
  const listeners = new Set<(plan: WeekPlan) => void>()
  const stageListeners = new Set<(stage: WeekPlanStage) => void>()

  function publish() {
    listeners.forEach((listener) => listener(plan))
  }

  function publishStage() {
    stageListeners.forEach((listener) => listener(stage))
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
  }
}
