import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import {
  DEFAULT_MAIN_MEAL_TIME_RULE,
  isMainMealTimeRule,
  type MainMealTimeRule,
} from '../domain/randomPlanning'
import {
  EMPTY_WEEK_PLAN,
  MEAL_TIMES,
  PLAN_SLOTS,
  WEEKDAYS,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
  type Weekday,
} from '../domain/weekPlan'
import { EDITING_STAGE, type WeekPlanStage } from '../domain/weekPlanStage'
import type { WeekPlanClient } from './weekPlanClient'

const WEEK_PLAN = 'weekPlan'
const MEALS = 'meals'
const MEAL_STAGE = 'mealStage'
const ROLLING_RULES = 'rollingRules'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'

function toWeekPlan(stored: DocumentData | undefined): WeekPlan {
  return PLAN_SLOTS.reduce((plan, { day, time }) => {
    const storedId: unknown = stored?.[day]?.[time]
    return typeof storedId === 'string'
      ? withMealIn(plan, { day, time }, storedId)
      : plan
  }, EMPTY_WEEK_PLAN)
}

function fromWeekPlan(plan: WeekPlan): DocumentData {
  return Object.fromEntries(WEEKDAYS.map((day) => [day, { ...plan[day] }]))
}

function isWeekday(value: unknown): value is Weekday {
  return WEEKDAYS.some((day) => day === value)
}

function isMealTime(value: unknown): value is MealTime {
  return MEAL_TIMES.some((time) => time === value)
}

function isPlanSlot(value: unknown): value is PlanSlot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'day' in value &&
    'time' in value &&
    isWeekday(value.day) &&
    isMealTime(value.time)
  )
}

function toCoveredSlots(stored: unknown): readonly PlanSlot[] | null {
  return Array.isArray(stored)
    ? stored.filter(isPlanSlot).map(({ day, time }) => ({ day, time }))
    : null
}

function toWeekPlanStage(stored: DocumentData | undefined): WeekPlanStage {
  return stored?.mode === 'reading'
    ? { mode: 'reading', coveredSlots: toCoveredSlots(stored.coveredSlots) }
    : EDITING_STAGE
}

function fromWeekPlanStage(stage: WeekPlanStage): DocumentData {
  return stage.mode === 'reading'
    ? {
        mode: stage.mode,
        coveredSlots:
          stage.coveredSlots?.map(({ day, time }) => ({ day, time })) ?? null,
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
): WeekPlanClient {
  const weekPlan = doc(firestore, WEEK_PLAN, MEALS)
  const stage = doc(firestore, WEEK_PLAN, MEAL_STAGE)
  const rollingRules = doc(firestore, WEEK_PLAN, ROLLING_RULES)

  return {
    observeWeekPlan(onWeekPlan) {
      return onSnapshot(weekPlan, (snapshot) => {
        onWeekPlan(toWeekPlan(snapshot.data()))
      })
    },

    writeWeekPlan(plan) {
      setDoc(weekPlan, fromWeekPlan(plan)).catch(() =>
        onWriteFailure(WRITE_FAILED),
      )
    },

    observeStage(onStage) {
      return onSnapshot(stage, (snapshot) => {
        onStage(toWeekPlanStage(snapshot.data()))
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
