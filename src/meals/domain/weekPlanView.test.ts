import { describe, expect, it } from 'vitest'
import { toPlanDate } from './planDate'
import { shownSlots, slotNamingIn } from './weekPlanView'

const FRIDAY = toPlanDate('2026-09-25')

describe('slotNamingIn', () => {
  it('names the meal time in the day view', () => {
    expect(slotNamingIn('day')).toBe('time')
  })

  it('names the day in the week view', () => {
    expect(slotNamingIn('week')).toBe('day')
  })
})

describe('shownSlots', () => {
  const week = { start: toPlanDate('2026-09-21'), days: 7 }

  it('shows the four meal times of the day in the day view', () => {
    expect(shownSlots('day', week, FRIDAY, 'lunch')).toEqual([
      { date: FRIDAY, time: 'breakfast' },
      { date: FRIDAY, time: 'lunch' },
      { date: FRIDAY, time: 'snack' },
      { date: FRIDAY, time: 'dinner' },
    ])
  })

  it('shows the seven days of the meal time in the week view', () => {
    expect(shownSlots('week', week, FRIDAY, 'dinner')).toEqual([
      { date: '2026-09-21', time: 'dinner' },
      { date: '2026-09-22', time: 'dinner' },
      { date: '2026-09-23', time: 'dinner' },
      { date: '2026-09-24', time: 'dinner' },
      { date: '2026-09-25', time: 'dinner' },
      { date: '2026-09-26', time: 'dinner' },
      { date: '2026-09-27', time: 'dinner' },
    ])
  })

  it('shows every day of a ten day period in the week view', () => {
    const slots = shownSlots(
      'week',
      { start: FRIDAY, days: 10 },
      FRIDAY,
      'lunch',
    )

    expect(slots).toHaveLength(10)
    expect(slots[0]).toEqual({ date: FRIDAY, time: 'lunch' })
    expect(slots[9]).toEqual({ date: '2026-10-04', time: 'lunch' })
  })
})
