import { describe, expect, it } from 'vitest'
import { shownSlots, slotNamingIn } from './weekPlanView'

describe('slotNamingIn', () => {
  it('names the meal time in the day view', () => {
    expect(slotNamingIn('day')).toBe('time')
  })

  it('names the day in the week view', () => {
    expect(slotNamingIn('week')).toBe('day')
  })
})

describe('shownSlots', () => {
  it('shows the four meal times of the day in the day view', () => {
    expect(shownSlots('day', 'friday', 'lunch')).toEqual([
      { day: 'friday', time: 'breakfast' },
      { day: 'friday', time: 'lunch' },
      { day: 'friday', time: 'snack' },
      { day: 'friday', time: 'dinner' },
    ])
  })

  it('shows the seven days of the meal time in the week view', () => {
    expect(shownSlots('week', 'friday', 'dinner')).toEqual([
      { day: 'monday', time: 'dinner' },
      { day: 'tuesday', time: 'dinner' },
      { day: 'wednesday', time: 'dinner' },
      { day: 'thursday', time: 'dinner' },
      { day: 'friday', time: 'dinner' },
      { day: 'saturday', time: 'dinner' },
      { day: 'sunday', time: 'dinner' },
    ])
  })
})
