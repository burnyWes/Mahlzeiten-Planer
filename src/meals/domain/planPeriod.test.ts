import { describe, expect, it } from 'vitest'
import { toPlanDate } from './planDate'
import {
  canHaveFewerDays,
  canHaveMoreDays,
  createPlanPeriod,
  dateAfter,
  dateBefore,
  datesOf,
  includesDate,
  InvalidPlanPeriod,
  isPlanPeriod,
  lastDateOf,
  samePeriod,
  shownDayIn,
  weekOf,
  type PlanPeriod,
} from './planPeriod'

const MONDAY = toPlanDate('2026-09-21')
const FRIDAY = toPlanDate('2026-09-25')
const SATURDAY = toPlanDate('2026-09-26')
const SUNDAY = toPlanDate('2026-09-27')

const TEN_DAYS_FROM_FRIDAY: PlanPeriod = { start: FRIDAY, days: 10 }

describe('weekOf', () => {
  it('runs from the Monday to the Sunday of the week', () => {
    expect(weekOf(FRIDAY)).toEqual({ start: MONDAY, days: 7 })
  })

  it('starts a week on the Monday before a Sunday', () => {
    expect(weekOf(SUNDAY)).toEqual({ start: MONDAY, days: 7 })
  })

  it('starts a week on the Monday itself', () => {
    expect(weekOf(MONDAY)).toEqual({ start: MONDAY, days: 7 })
  })
})

describe('datesOf', () => {
  it('lists every day of the period in the order of the calendar', () => {
    const dates = datesOf(TEN_DAYS_FROM_FRIDAY)

    expect(dates).toHaveLength(10)
    expect(dates[0]).toBe(FRIDAY)
    expect(dates[9]).toBe('2026-10-04')
  })

  it('lists a single day', () => {
    expect(datesOf({ start: FRIDAY, days: 1 })).toEqual([FRIDAY])
  })
})

describe('lastDateOf', () => {
  it('gives the last day of the period', () => {
    expect(lastDateOf(TEN_DAYS_FROM_FRIDAY)).toBe('2026-10-04')
  })
})

describe('includesDate', () => {
  it('includes the first and the last day', () => {
    expect(includesDate(TEN_DAYS_FROM_FRIDAY, FRIDAY)).toBe(true)
    expect(includesDate(TEN_DAYS_FROM_FRIDAY, toPlanDate('2026-10-04'))).toBe(
      true,
    )
  })

  it('excludes the day before the start', () => {
    expect(includesDate(TEN_DAYS_FROM_FRIDAY, toPlanDate('2026-09-24'))).toBe(
      false,
    )
  })

  it('excludes the day after the end', () => {
    expect(includesDate(TEN_DAYS_FROM_FRIDAY, toPlanDate('2026-10-05'))).toBe(
      false,
    )
  })
})

describe('dateBefore', () => {
  it('gives the calendar day before', () => {
    expect(dateBefore(TEN_DAYS_FROM_FRIDAY, toPlanDate('2026-10-01'))).toBe(
      '2026-09-30',
    )
  })

  it('has no day before the start', () => {
    expect(dateBefore(TEN_DAYS_FROM_FRIDAY, FRIDAY)).toBeNull()
  })
})

describe('dateAfter', () => {
  it('gives the calendar day after, across a Sunday', () => {
    expect(dateAfter(TEN_DAYS_FROM_FRIDAY, SUNDAY)).toBe('2026-09-28')
  })

  it('has no day after the last day', () => {
    expect(dateAfter(TEN_DAYS_FROM_FRIDAY, toPlanDate('2026-10-04'))).toBeNull()
  })
})

describe('samePeriod', () => {
  it('holds for the same start and number of days', () => {
    expect(samePeriod(weekOf(FRIDAY), { start: MONDAY, days: 7 })).toBe(true)
  })

  it('fails for another start', () => {
    expect(samePeriod(weekOf(FRIDAY), { start: FRIDAY, days: 7 })).toBe(false)
  })

  it('fails for another number of days', () => {
    expect(samePeriod(weekOf(FRIDAY), { start: MONDAY, days: 8 })).toBe(false)
  })
})

describe('isPlanPeriod', () => {
  it('accepts a start date and one up to ten days', () => {
    expect(isPlanPeriod({ start: '2026-09-25', days: 1 })).toBe(true)
    expect(isPlanPeriod({ start: '2026-09-25', days: 10 })).toBe(true)
  })

  it('refuses a missing or invalid start', () => {
    expect(isPlanPeriod({ days: 7 })).toBe(false)
    expect(isPlanPeriod({ start: '2026-02-30', days: 7 })).toBe(false)
  })

  it('refuses a number of days outside one up to ten', () => {
    expect(isPlanPeriod({ start: '2026-09-25', days: 0 })).toBe(false)
    expect(isPlanPeriod({ start: '2026-09-25', days: 11 })).toBe(false)
    expect(isPlanPeriod({ start: '2026-09-25', days: 2.5 })).toBe(false)
    expect(isPlanPeriod({ start: '2026-09-25', days: '7' })).toBe(false)
  })

  it('refuses anything but an object', () => {
    expect(isPlanPeriod(null)).toBe(false)
    expect(isPlanPeriod('2026-09-25')).toBe(false)
  })
})

describe('shownDayIn', () => {
  const week = weekOf(FRIDAY)

  it('keeps the chosen day while it lies in the period', () => {
    expect(shownDayIn(week, SATURDAY, FRIDAY)).toBe(SATURDAY)
  })

  it('shows today when the chosen day lies outside the period', () => {
    expect(shownDayIn(week, toPlanDate('2026-10-02'), FRIDAY)).toBe(FRIDAY)
  })

  it('shows today when no day was chosen', () => {
    expect(shownDayIn(week, null, FRIDAY)).toBe(FRIDAY)
  })

  it('shows the first day when neither the chosen day nor today lie in the period', () => {
    expect(
      shownDayIn(
        { start: toPlanDate('2026-10-01'), days: 3 },
        SATURDAY,
        FRIDAY,
      ),
    ).toBe('2026-10-01')
  })
})

describe('createPlanPeriod', () => {
  function reasonFor(start: string, days: number) {
    try {
      createPlanPeriod({ start, days })
    } catch (error) {
      return error instanceof InvalidPlanPeriod ? error.reason : error
    }
    return null
  }

  it('creates a period from a start date and a number of days', () => {
    expect(createPlanPeriod({ start: '2026-09-25', days: 10 })).toEqual({
      start: FRIDAY,
      days: 10,
    })
  })

  it('accepts a start date in the past', () => {
    expect(createPlanPeriod({ start: '2020-01-06', days: 1 })).toEqual({
      start: '2020-01-06',
      days: 1,
    })
  })

  it('refuses a missing start date', () => {
    expect(reasonFor('', 7)).toBe('startMissing')
  })

  it('refuses a start date the calendar does not have', () => {
    expect(reasonFor('2026-02-30', 7)).toBe('startMissing')
  })

  it('refuses no day, more than ten days and part of a day', () => {
    expect(reasonFor('2026-09-25', 0)).toBe('daysOutOfRange')
    expect(reasonFor('2026-09-25', 11)).toBe('daysOutOfRange')
    expect(reasonFor('2026-09-25', 2.5)).toBe('daysOutOfRange')
  })
})

describe('canHaveFewerDays', () => {
  it('allows fewer days above one', () => {
    expect(canHaveFewerDays(2)).toBe(true)
  })

  it('allows no fewer than one day', () => {
    expect(canHaveFewerDays(1)).toBe(false)
  })
})

describe('canHaveMoreDays', () => {
  it('allows more days below ten', () => {
    expect(canHaveMoreDays(9)).toBe(true)
  })

  it('allows no more than ten days', () => {
    expect(canHaveMoreDays(10)).toBe(false)
  })
})
