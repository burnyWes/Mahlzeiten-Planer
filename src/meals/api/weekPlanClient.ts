import type { RollingRules } from '../domain/randomPlanning'
import type { WeekPlan } from '../domain/weekPlan'
import type { WeekPlanStage } from '../domain/weekPlanStage'

export interface WeekPlanClient {
  observeWeekPlan(onWeekPlan: (plan: WeekPlan) => void): () => void
  writeWeekPlan(plan: WeekPlan): void
  observeStage(onStage: (stage: WeekPlanStage) => void): () => void
  writeStage(stage: WeekPlanStage): void
  observeRollingRules(onRules: (rules: RollingRules) => void): () => void
  writeRollingRules(rules: RollingRules): void
}
