import type { MainMealTimeRule } from '../domain/randomPlanning'
import type { WeekPlan } from '../domain/weekPlan'
import type { WeekPlanStage } from '../domain/weekPlanStage'

export interface WeekPlanClient {
  observeWeekPlan(onWeekPlan: (plan: WeekPlan) => void): () => void
  writeWeekPlan(plan: WeekPlan): void
  observeStage(onStage: (stage: WeekPlanStage) => void): () => void
  writeStage(stage: WeekPlanStage): void
  observeMainMealTimeRule(onRule: (rule: MainMealTimeRule) => void): () => void
  writeMainMealTimeRule(rule: MainMealTimeRule): void
}
