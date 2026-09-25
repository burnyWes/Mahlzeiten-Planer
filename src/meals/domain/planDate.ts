export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export type PlanDate = string & { readonly planDate: unique symbol }

const PLAN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const MILLISECONDS_PER_DAY = 86_400_000

const DAYS_FROM_SUNDAY_TO_MONDAY = 6

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

function writtenDate(year: number, month: number, day: number): string {
  return `${year}-${twoDigits(month)}-${twoDigits(day)}`
}

function utcTimeOf(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function writtenDateAt(utcTime: number): string {
  const moment = new Date(utcTime)
  return writtenDate(
    moment.getUTCFullYear(),
    moment.getUTCMonth() + 1,
    moment.getUTCDate(),
  )
}

export function isPlanDate(value: unknown): value is PlanDate {
  return (
    typeof value === 'string' &&
    PLAN_DATE_PATTERN.test(value) &&
    writtenDateAt(utcTimeOf(value)) === value
  )
}

export function toPlanDate(text: string): PlanDate {
  if (!isPlanDate(text)) throw new RangeError(`${text} is no calendar date`)
  return text
}

export function planDateOf(date: Date): PlanDate {
  return toPlanDate(
    writtenDate(date.getFullYear(), date.getMonth() + 1, date.getDate()),
  )
}

export function daysAfter(date: PlanDate, count: number): PlanDate {
  return toPlanDate(
    writtenDateAt(utcTimeOf(date) + count * MILLISECONDS_PER_DAY),
  )
}

export function weekdayOf(date: PlanDate): Weekday {
  return WEEKDAYS[
    (new Date(utcTimeOf(date)).getUTCDay() + DAYS_FROM_SUNDAY_TO_MONDAY) %
      WEEKDAYS.length
  ]
}

export function dayOfMonth(date: PlanDate): number {
  return new Date(utcTimeOf(date)).getUTCDate()
}

export function monthOf(date: PlanDate): number {
  return new Date(utcTimeOf(date)).getUTCMonth() + 1
}
