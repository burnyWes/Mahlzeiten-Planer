import { describe, expect, it } from 'vitest'
import { isStaleSnapshot } from './unconfirmedWrite'

function sameNumber(one: number, other: number): boolean {
  return one === other
}

describe('isStaleSnapshot', () => {
  it('takes every snapshot while no own write is unconfirmed', () => {
    expect(isStaleSnapshot(null, 1, sameNumber)).toBe(false)
  })

  it('skips a snapshot that differs from the unconfirmed write', () => {
    expect(isStaleSnapshot(2, 1, sameNumber)).toBe(true)
  })

  it('takes the snapshot that carries the unconfirmed write', () => {
    expect(isStaleSnapshot(2, 2, sameNumber)).toBe(false)
  })
})
