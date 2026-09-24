import { describe, expect, it } from 'vitest'
import {
  canShuffle,
  canTransfer,
  EDITING_STAGE,
  FIXED_STAGE,
  isFixed,
} from './weekPlanStage'

describe('EDITING_STAGE', () => {
  it('is not fixed', () => {
    expect(isFixed(EDITING_STAGE)).toBe(false)
  })

  it('allows rolling', () => {
    expect(canShuffle(EDITING_STAGE)).toBe(true)
  })

  it('offers no transfer however many days are planned', () => {
    expect(canTransfer(EDITING_STAGE, 5)).toBe(false)
  })
})

describe('FIXED_STAGE', () => {
  it('is fixed', () => {
    expect(isFixed(FIXED_STAGE)).toBe(true)
  })

  it('allows no rolling', () => {
    expect(canShuffle(FIXED_STAGE)).toBe(false)
  })

  it('offers the transfer once a day is planned', () => {
    expect(canTransfer(FIXED_STAGE, 1)).toBe(true)
  })

  it('offers no transfer while no day is planned', () => {
    expect(canTransfer(FIXED_STAGE, 0)).toBe(false)
  })
})
