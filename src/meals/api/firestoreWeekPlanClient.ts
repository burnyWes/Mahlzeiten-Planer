import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import { EMPTY_WEEK_PLAN, WEEKDAYS, type WeekPlan } from '../domain/weekPlan'
import type { WeekPlanClient } from './weekPlanClient'

const WEEK_PLAN = 'weekPlan'
const CURRENT = 'current'

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

export function createFirestoreWeekPlanClient(
  firestore: Firestore,
  onWriteFailure: (message: string) => void,
): WeekPlanClient {
  const weekPlan = doc(firestore, WEEK_PLAN, CURRENT)

  return {
    observeWeekPlan(onWeekPlan) {
      return onSnapshot(weekPlan, (snapshot) => {
        onWeekPlan(toWeekPlan(snapshot.data()))
      })
    },

    writeWeekPlan(plan) {
      setDoc(weekPlan, { ...plan }).catch(() => onWriteFailure(WRITE_FAILED))
    },
  }
}
