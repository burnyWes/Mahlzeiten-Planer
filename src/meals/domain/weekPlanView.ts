import type { PlanDate } from './planDate'
import { datesOf, type PlanPeriod } from './planPeriod'
import { MEAL_TIMES, type MealTime, type PlanSlot } from './weekPlan'

export type WeekPlanView = 'day' | 'week'

export type SlotNaming = 'time' | 'day'

export function slotNamingIn(view: WeekPlanView): SlotNaming {
  return view === 'day' ? 'time' : 'day'
}

export function shownSlots(
  view: WeekPlanView,
  period: PlanPeriod,
  day: PlanDate,
  time: MealTime,
): readonly PlanSlot[] {
  return view === 'day'
    ? MEAL_TIMES.map((each) => ({ date: day, time: each }))
    : datesOf(period).map((date) => ({ date, time }))
}
