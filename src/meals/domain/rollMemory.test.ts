import { describe, expect, it } from 'vitest'
import { toPlanDate } from './planDate'
import {
  EMPTY_ROLL_MEMORY,
  rememberedRoll,
  rolledAt,
  type RollMemory,
} from './rollMemory'
import type { PlanSlot } from './weekPlan'

const MONDAY_LUNCH: PlanSlot = { date: toPlanDate('2026-09-21'), time: 'lunch' }
const MONDAY_DINNER: PlanSlot = {
  date: toPlanDate('2026-09-21'),
  time: 'dinner',
}
const TUESDAY_LUNCH: PlanSlot = {
  date: toPlanDate('2026-09-22'),
  time: 'lunch',
}

function rememberedOnMondayLunch(...meals: readonly string[]): RollMemory {
  return [{ slot: MONDAY_LUNCH, meals }]
}

describe('rolledAt', () => {
  it('remembers nothing in an empty memory', () => {
    expect(rolledAt(EMPTY_ROLL_MEMORY, MONDAY_LUNCH)).toEqual([])
  })
})

describe('rememberedRoll', () => {
  it('remembers the first meal rolled into an empty slot', () => {
    const roll = rememberedRoll(EMPTY_ROLL_MEMORY, MONDAY_LUNCH, null, 'g2')

    expect(rolledAt(roll.memory, MONDAY_LUNCH)).toEqual(['g2'])
    expect(roll.startedOver).toBe(false)
  })

  it('remembers the replaced meal as well', () => {
    const roll = rememberedRoll(EMPTY_ROLL_MEMORY, MONDAY_LUNCH, 'g3', 'g1')

    expect(rolledAt(roll.memory, MONDAY_LUNCH)).toEqual(['g3', 'g1'])
  })

  it('adds to the meals remembered without doubles', () => {
    const roll = rememberedRoll(
      rememberedOnMondayLunch('g2'),
      MONDAY_LUNCH,
      'g2',
      'g1',
    )

    expect(rolledAt(roll.memory, MONDAY_LUNCH)).toEqual(['g2', 'g1'])
    expect(roll.startedOver).toBe(false)
  })

  it('starts over with the replaced and the rolled meal once a remembered meal comes again', () => {
    const roll = rememberedRoll(
      rememberedOnMondayLunch('g2', 'g1', 'g3'),
      MONDAY_LUNCH,
      'g3',
      'g1',
    )

    expect(rolledAt(roll.memory, MONDAY_LUNCH)).toEqual(['g3', 'g1'])
    expect(roll.startedOver).toBe(true)
  })

  it('starts over when the replaced meal comes again', () => {
    const roll = rememberedRoll(EMPTY_ROLL_MEMORY, MONDAY_LUNCH, 'g1', 'g1')

    expect(rolledAt(roll.memory, MONDAY_LUNCH)).toEqual(['g1'])
    expect(roll.startedOver).toBe(true)
  })

  it('starts over when the only meal comes again', () => {
    const roll = rememberedRoll(
      rememberedOnMondayLunch('g1'),
      MONDAY_LUNCH,
      'g1',
      'g1',
    )

    expect(rolledAt(roll.memory, MONDAY_LUNCH)).toEqual(['g1'])
    expect(roll.startedOver).toBe(true)
  })

  it('leaves the other slots alone', () => {
    const memory: RollMemory = [
      { slot: MONDAY_LUNCH, meals: ['g1'] },
      { slot: TUESDAY_LUNCH, meals: ['g2'] },
    ]

    const roll = rememberedRoll(memory, MONDAY_LUNCH, 'g1', 'g3')

    expect(rolledAt(roll.memory, MONDAY_LUNCH)).toEqual(['g1', 'g3'])
    expect(rolledAt(roll.memory, TUESDAY_LUNCH)).toEqual(['g2'])
    expect(rolledAt(roll.memory, MONDAY_DINNER)).toEqual([])
  })
})
