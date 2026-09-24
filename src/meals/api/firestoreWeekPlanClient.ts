import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import {
  EMPTY_WEEK_PLAN,
  WEEKDAYS,
  type WeekPlan,
  type Weekday,
} from '../domain/weekPlan'
import { EDITING_STAGE, type WeekPlanStage } from '../domain/weekPlanStage'
import type { WeekPlanClient } from './weekPlanClient'

const WEEK_PLAN = 'weekPlan'
const CURRENT = 'current'
const STAGE = 'stage'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'

function toWeekPlan(stored: DocumentData | undefined): WeekPlan {
  return WEEKDAYS.reduce(
    (plan, day) => ({
      ...plan,
      [day]: typeof stored?.[day] === 'string' ? stored[day] : null,
    }),
    EMPTY_WEEK_PLAN,
  )
}

function isWeekday(value: unknown): value is Weekday {
  return WEEKDAYS.some((day) => day === value)
}

function toCoveredDays(stored: unknown): readonly Weekday[] | null {
  return Array.isArray(stored) ? stored.filter(isWeekday) : null
}

function toWeekPlanStage(stored: DocumentData | undefined): WeekPlanStage {
  return stored?.mode === 'reading'
    ? { mode: 'reading', coveredDays: toCoveredDays(stored.coveredDays) }
    : EDITING_STAGE
}

function fromWeekPlanStage(stage: WeekPlanStage): DocumentData {
  return stage.mode === 'reading'
    ? { mode: stage.mode, coveredDays: stage.coveredDays }
    : { mode: stage.mode }
}

export function createFirestoreWeekPlanClient(
  firestore: Firestore,
  onWriteFailure: (message: string) => void,
): WeekPlanClient {
  const weekPlan = doc(firestore, WEEK_PLAN, CURRENT)
  const stage = doc(firestore, WEEK_PLAN, STAGE)

  return {
    observeWeekPlan(onWeekPlan) {
      return onSnapshot(weekPlan, (snapshot) => {
        onWeekPlan(toWeekPlan(snapshot.data()))
      })
    },

    writeWeekPlan(plan) {
      setDoc(weekPlan, { ...plan }).catch(() => onWriteFailure(WRITE_FAILED))
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
  }
}
