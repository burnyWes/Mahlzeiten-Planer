import { describe, expect, it } from 'vitest'
import type { Quantity } from '../../shared/domain/quantity'
import type { ShoppingItem } from './shoppingItem'
import {
  dropConfirmedWrites,
  rememberWrite,
  withUnconfirmedWrites,
} from './unconfirmedWrites'

function item(
  id: string,
  quantity: Quantity | null = null,
  checkedOffAt: number | null = null,
): ShoppingItem {
  return { id, name: id, quantity, createdAt: 1, checkedOffAt }
}

describe('rememberWrite', () => {
  it('keeps a write until the snapshot carries it', () => {
    expect(rememberWrite([], item('milk'))).toEqual([item('milk')])
  })

  it('replaces an earlier write of the same item', () => {
    const remembered = rememberWrite(
      [item('milk', { amount: 2, unit: 'l' })],
      item('milk', { amount: 3, unit: 'l' }),
    )

    expect(remembered).toEqual([item('milk', { amount: 3, unit: 'l' })])
  })

  it('leaves the earlier writes untouched', () => {
    const earlier = [item('milk')]

    rememberWrite(earlier, item('bread'))

    expect(earlier).toHaveLength(1)
  })
})

describe('withUnconfirmedWrites', () => {
  it('adds an item the snapshot has not delivered yet', () => {
    expect(withUnconfirmedWrites([item('bread')], [item('milk')])).toEqual([
      item('bread'),
      item('milk'),
    ])
  })

  it('lifts the quantity the snapshot still shows as it was', () => {
    const known = withUnconfirmedWrites(
      [item('milk', { amount: 2, unit: 'l' })],
      [item('milk', { amount: 3, unit: 'l' })],
    )

    expect(known).toEqual([item('milk', { amount: 3, unit: 'l' })])
  })

  it('leaves the check off state to the snapshot', () => {
    const known = withUnconfirmedWrites(
      [item('milk', { amount: 3, unit: 'l' }, 500)],
      [item('milk', { amount: 3, unit: 'l' })],
    )

    expect(known[0].checkedOffAt).toBe(500)
  })

  it('reports the live items unchanged without any write', () => {
    expect(withUnconfirmedWrites([item('bread')], [])).toEqual([item('bread')])
  })
})

describe('dropConfirmedWrites', () => {
  it('drops a write the snapshot carries with the written quantity', () => {
    const remaining = dropConfirmedWrites(
      [item('milk', { amount: 3, unit: 'l' })],
      [item('milk', { amount: 3, unit: 'l' })],
    )

    expect(remaining).toEqual([])
  })

  it('keeps a write whose quantity has not arrived yet', () => {
    const remaining = dropConfirmedWrites(
      [item('milk', { amount: 3, unit: 'l' })],
      [item('milk', { amount: 2, unit: 'l' })],
    )

    expect(remaining).toHaveLength(1)
  })

  it('keeps a write the snapshot does not carry at all', () => {
    expect(dropConfirmedWrites([item('milk')], [item('bread')])).toHaveLength(1)
  })

  it('drops a write whose item the other device checked off', () => {
    const remaining = dropConfirmedWrites(
      [item('milk')],
      [item('milk', null, 500)],
    )

    expect(remaining).toEqual([])
  })
})
