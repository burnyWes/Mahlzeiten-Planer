import {
  MEAL_TIMES,
  WEEKDAYS,
  type MealTime,
  type PlanSlot,
  type Weekday,
} from './weekPlan'

export type WeekPlanView = 'day' | 'week'

export type SlotNaming = 'time' | 'day'

export function slotNamingIn(view: WeekPlanView): SlotNaming {
  return view === 'day' ? 'time' : 'day'
}

export function shownSlots(
  view: WeekPlanView,
  day: Weekday,
  time: MealTime,
): readonly PlanSlot[] {
  return view === 'day'
    ? MEAL_TIMES.map((each) => ({ day, time: each }))
    : WEEKDAYS.map((each) => ({ day: each, time }))
}
