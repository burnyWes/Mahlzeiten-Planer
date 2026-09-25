import { describe, expect, it } from 'vitest'
import {
  dayOfMonth,
  daysAfter,
  isPlanDate,
  monthOf,
  planDateOf,
  toPlanDate,
  WEEKDAYS,
  weekdayOf,
} from './planDate'

describe('WEEKDAYS', () => {
  it('runs from Monday to Sunday', () => {
    expect(WEEKDAYS).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ])
  })
})

describe('isPlanDate', () => {
  it('accepts a calendar date written as year, month and day', () => {
    expect(isPlanDate('2026-09-25')).toBe(true)
  })

  it('refuses an empty text', () => {
    expect(isPlanDate('')).toBe(false)
  })

  it('refuses a date written the German way', () => {
    expect(isPlanDate('25.09.2026')).toBe(false)
  })

  it('refuses a day the calendar does not have', () => {
    expect(isPlanDate('2026-02-30')).toBe(false)
  })

  it('refuses anything but a text', () => {
    expect(isPlanDate(42)).toBe(false)
  })
})

describe('toPlanDate', () => {
  it('keeps a valid date', () => {
    expect(toPlanDate('2026-09-25')).toBe('2026-09-25')
  })

  it('refuses a text that is no date', () => {
    expect(() => toPlanDate('2026-13-01')).toThrow(RangeError)
  })
})

describe('planDateOf', () => {
  it('takes the local day shortly after midnight', () => {
    expect(planDateOf(new Date(2026, 8, 25, 0, 5))).toBe('2026-09-25')
  })

  it('takes the local day shortly before midnight', () => {
    expect(planDateOf(new Date(2026, 0, 3, 23, 55))).toBe('2026-01-03')
  })
})

describe('daysAfter', () => {
  it('counts across the end of a month', () => {
    expect(daysAfter(toPlanDate('2026-09-25'), 6)).toBe('2026-10-01')
  })

  it('counts across the change to winter time', () => {
    expect(daysAfter(toPlanDate('2026-10-24'), 2)).toBe('2026-10-26')
  })

  it('counts across the change to summer time', () => {
    expect(daysAfter(toPlanDate('2026-03-28'), 2)).toBe('2026-03-30')
  })

  it('counts backwards', () => {
    expect(daysAfter(toPlanDate('2026-10-01'), -1)).toBe('2026-09-30')
  })

  it('counts across the end of a year', () => {
    expect(daysAfter(toPlanDate('2026-12-31'), 1)).toBe('2027-01-01')
  })
})

describe('weekdayOf', () => {
  it('names a Monday as monday', () => {
    expect(weekdayOf(toPlanDate('2026-09-21'))).toBe('monday')
  })

  it('names a Friday as friday', () => {
    expect(weekdayOf(toPlanDate('2026-09-25'))).toBe('friday')
  })

  it('names a Sunday as sunday', () => {
    expect(weekdayOf(toPlanDate('2026-09-27'))).toBe('sunday')
  })
})

describe('dayOfMonth', () => {
  it('gives the day within the month', () => {
    expect(dayOfMonth(toPlanDate('2026-10-04'))).toBe(4)
  })
})

describe('monthOf', () => {
  it('counts the months from one', () => {
    expect(monthOf(toPlanDate('2026-01-31'))).toBe(1)
    expect(monthOf(toPlanDate('2026-12-01'))).toBe(12)
  })
})
