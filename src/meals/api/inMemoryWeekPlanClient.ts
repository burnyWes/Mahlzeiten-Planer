import { EMPTY_WEEK_PLAN, type WeekPlan } from '../domain/weekPlan'
import type { WeekPlanClient } from './weekPlanClient'

export type InMemoryWeekPlanClient = WeekPlanClient & {
  weekPlanArrivesFromElsewhere(plan: WeekPlan): void
  storedWeekPlan(): WeekPlan
}

export function createInMemoryWeekPlanClient(
  initialPlan: WeekPlan = EMPTY_WEEK_PLAN,
): InMemoryWeekPlanClient {
  let plan = initialPlan
  const listeners = new Set<(plan: WeekPlan) => void>()

  function publish() {
    listeners.forEach((listener) => listener(plan))
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
    weekPlanArrivesFromElsewhere(arriving) {
      plan = arriving
      publish()
    },
    storedWeekPlan() {
      return plan
    },
  }
}
