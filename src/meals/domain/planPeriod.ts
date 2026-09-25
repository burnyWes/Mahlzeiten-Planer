import {
  daysAfter,
  isPlanDate,
  WEEKDAYS,
  weekdayOf,
  type PlanDate,
} from './planDate'

export const MIN_PERIOD_DAYS = 1
export const MAX_PERIOD_DAYS = 10

export type PlanPeriod = {
  readonly start: PlanDate
  readonly days: number
}

function isPeriodLength(days: unknown): days is number {
  return (
    typeof days === 'number' &&
    Number.isInteger(days) &&
    days >= MIN_PERIOD_DAYS &&
    days <= MAX_PERIOD_DAYS
  )
}

export function isPlanPeriod(value: unknown): value is PlanPeriod {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<Record<keyof PlanPeriod, unknown>>
  return isPlanDate(candidate.start) && isPeriodLength(candidate.days)
}

export function weekOf(today: PlanDate): PlanPeriod {
  return {
    start: daysAfter(today, -WEEKDAYS.indexOf(weekdayOf(today))),
    days: WEEKDAYS.length,
  }
}

export function datesOf(period: PlanPeriod): readonly PlanDate[] {
  return Array.from({ length: period.days }, (_, offset) =>
    daysAfter(period.start, offset),
  )
}

export function lastDateOf(period: PlanPeriod): PlanDate {
  return daysAfter(period.start, period.days - 1)
}

export function includesDate(period: PlanPeriod, date: PlanDate): boolean {
  return period.start <= date && date <= lastDateOf(period)
}

function dateWithin(period: PlanPeriod, date: PlanDate): PlanDate | null {
  return includesDate(period, date) ? date : null
}

export function dateBefore(
  period: PlanPeriod,
  date: PlanDate,
): PlanDate | null {
  return dateWithin(period, daysAfter(date, -1))
}

export function dateAfter(period: PlanPeriod, date: PlanDate): PlanDate | null {
  return dateWithin(period, daysAfter(date, 1))
}

export function samePeriod(one: PlanPeriod, other: PlanPeriod): boolean {
  return one.start === other.start && one.days === other.days
}

export function shownDayIn(
  period: PlanPeriod,
  chosenDay: PlanDate | null,
  today: PlanDate,
): PlanDate {
  if (chosenDay !== null && includesDate(period, chosenDay)) return chosenDay
  return dateWithin(period, today) ?? period.start
}
