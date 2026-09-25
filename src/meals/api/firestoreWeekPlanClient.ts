import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import type { Clock } from '../../shared/domain/clock'
import {
  isPlanDate,
  planDateOf,
  WEEKDAYS,
  type PlanDate,
  type Weekday,
} from '../domain/planDate'
import {
  datesOf,
  isPlanPeriod,
  weekOf,
  type PlanPeriod,
} from '../domain/planPeriod'
import {
  DEFAULT_MAIN_MEAL_TIME_RULE,
  isMainMealTimeRule,
  type MainMealTimeRule,
} from '../domain/randomPlanning'
import {
  dateOfWeekday,
  MEAL_TIMES,
  mealIn,
  weekPlanFromWeekdays,
  type DayPlan,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
} from '../domain/weekPlan'
import { EDITING_STAGE, type WeekPlanStage } from '../domain/weekPlanStage'
import type { WeekPlanClient } from './weekPlanClient'

const WEEK_PLAN = 'weekPlan'
const DATED_MEALS = 'datedMeals'
const WEEKDAY_MEALS = 'meals'
const MEAL_STAGE = 'mealStage'
const ROLLING_RULES = 'rollingRules'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'

function toDayPlan(stored: unknown): DayPlan {
  const storedDay: Partial<Record<MealTime, unknown>> =
    typeof stored === 'object' && stored !== null ? stored : {}
  return Object.fromEntries(
    MEAL_TIMES.map((time) => {
      const storedId = storedDay[time]
      return [time, typeof storedId === 'string' ? storedId : null]
    }),
  ) as DayPlan
}

function toWeekPlan(stored: DocumentData | undefined): WeekPlan | null {
  const period: unknown = { start: stored?.start, days: stored?.days }
  if (!isPlanPeriod(period)) return null
  return {
    period,
    days: Object.fromEntries(
      datesOf(period).map((date) => [date, toDayPlan(stored?.plan?.[date])]),
    ),
  }
}

function fromDayPlan(plan: WeekPlan, date: PlanDate): DocumentData {
  return Object.fromEntries(
    MEAL_TIMES.map((time) => [time, mealIn(plan, { date, time })]),
  )
}

function fromWeekPlan(plan: WeekPlan): DocumentData {
  return {
    start: plan.period.start,
    days: plan.period.days,
    plan: Object.fromEntries(
      datesOf(plan.period).map((date) => [date, fromDayPlan(plan, date)]),
    ),
  }
}

function toWeekdays(
  stored: DocumentData | undefined,
): Readonly<Record<Weekday, DayPlan>> {
  return Object.fromEntries(
    WEEKDAYS.map((day) => [day, toDayPlan(stored?.[day])]),
  ) as Record<Weekday, DayPlan>
}

function isWeekday(value: unknown): value is Weekday {
  return WEEKDAYS.some((day) => day === value)
}

function isMealTime(value: unknown): value is MealTime {
  return MEAL_TIMES.some((time) => time === value)
}

function toPlanSlot(stored: unknown, week: PlanPeriod): PlanSlot[] {
  if (typeof stored !== 'object' || stored === null) return []
  const { date, day, time } = stored as Record<string, unknown>
  if (!isMealTime(time)) return []
  if (isPlanDate(date)) return [{ date, time }]
  if (isWeekday(day)) return [{ date: dateOfWeekday(week, day), time }]
  return []
}

function toCoveredSlots(
  stored: unknown,
  week: PlanPeriod,
): readonly PlanSlot[] | null {
  return Array.isArray(stored)
    ? stored.flatMap((each) => toPlanSlot(each, week))
    : null
}

function toWeekPlanStage(
  stored: DocumentData | undefined,
  week: PlanPeriod,
): WeekPlanStage {
  return stored?.mode === 'reading'
    ? {
        mode: 'reading',
        coveredSlots: toCoveredSlots(stored.coveredSlots, week),
      }
    : EDITING_STAGE
}

function fromWeekPlanStage(stage: WeekPlanStage): DocumentData {
  return stage.mode === 'reading'
    ? {
        mode: stage.mode,
        coveredSlots:
          stage.coveredSlots?.map(({ date, time }) => ({ date, time })) ?? null,
      }
    : { mode: stage.mode }
}

function toMainMealTimeRule(
  stored: DocumentData | undefined,
): MainMealTimeRule {
  const storedRule: unknown = stored?.mainMealTime
  return isMainMealTimeRule(storedRule)
    ? storedRule
    : DEFAULT_MAIN_MEAL_TIME_RULE
}

export function createFirestoreWeekPlanClient(
  firestore: Firestore,
  onWriteFailure: (message: string) => void,
  clock: Clock,
): WeekPlanClient {
  const weekPlan = doc(firestore, WEEK_PLAN, DATED_MEALS)
  const weekdayPlan = doc(firestore, WEEK_PLAN, WEEKDAY_MEALS)
  const stage = doc(firestore, WEEK_PLAN, MEAL_STAGE)
  const rollingRules = doc(firestore, WEEK_PLAN, ROLLING_RULES)

  const currentWeek = () => weekOf(planDateOf(clock()))

  return {
    observeWeekPlan(onWeekPlan) {
      let datedPlanArrived = false
      let weekdayPlanRequested = false
      let stopped = false

      function moveWeekdayPlan() {
        weekdayPlanRequested = true
        getDoc(weekdayPlan)
          .then(
            (snapshot) => snapshot.data(),
            () => undefined,
          )
          .then((stored) => {
            if (stopped || datedPlanArrived) return
            onWeekPlan(weekPlanFromWeekdays(toWeekdays(stored), currentWeek()))
          })
      }

      const stopListening = onSnapshot(weekPlan, (snapshot) => {
        const arriving = toWeekPlan(snapshot.data())
        if (arriving !== null) {
          datedPlanArrived = true
          onWeekPlan(arriving)
        } else if (!weekdayPlanRequested) moveWeekdayPlan()
      })

      return () => {
        stopped = true
        stopListening()
      }
    },

    writeWeekPlan(plan) {
      setDoc(weekPlan, fromWeekPlan(plan)).catch(() =>
        onWriteFailure(WRITE_FAILED),
      )
    },

    observeStage(onStage) {
      return onSnapshot(stage, (snapshot) => {
        onStage(toWeekPlanStage(snapshot.data(), currentWeek()))
      })
    },

    writeStage(written) {
      setDoc(stage, fromWeekPlanStage(written)).catch(() =>
        onWriteFailure(WRITE_FAILED),
      )
    },

    observeMainMealTimeRule(onRule) {
      return onSnapshot(rollingRules, (snapshot) => {
        onRule(toMainMealTimeRule(snapshot.data()))
      })
    },

    writeMainMealTimeRule(rule) {
      setDoc(rollingRules, { mainMealTime: rule }).catch(() =>
        onWriteFailure(WRITE_FAILED),
      )
    },
  }
}
