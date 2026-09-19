import type { WeekPlan } from '../domain/weekPlan'

export interface WeekPlanClient {
  observeWeekPlan(onWeekPlan: (plan: WeekPlan) => void): () => void
  writeWeekPlan(plan: WeekPlan): void
}
