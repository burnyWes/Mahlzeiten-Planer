import { describe, expect, it } from 'vitest'
import type { Quantity } from '../../shared/domain/quantity'
import type { ShoppingItem } from './shoppingItem'
import {
  dropConfirmedWrites,
  rememberWrite,
  withUnconfirmedWrites,
  type UnconfirmedWrite,
} from './unconfirmedWrites'

function item(
  id: string,
  quantity: Quantity | null = null,
  checkedOffAt: number | null = null,
): ShoppingItem {
  return { id, name: id, quantity, createdAt: 1, checkedOffAt }
}

function write(
  written: ShoppingItem,
  before: ShoppingItem | null = null,
): UnconfirmedWrite {
  return { written, before }
}

describe('rememberWrite', () => {
  it('keeps a write until the snapshot carries it', () => {
    expect(rememberWrite([], item('milk'), null)).toEqual([write(item('milk'))])
  })

  it('replaces an earlier write of the same item', () => {
    const remembered = rememberWrite(
      [write(item('milk', { amount: 2, unit: 'l' }))],
      item('milk', { amount: 3, unit: 'l' }),
      null,
    )

    expect(remembered).toEqual([write(item('milk', { amount: 3, unit: 'l' }))])
  })

  it('keeps the state before the earliest write of the same item', () => {
    const remembered = rememberWrite(
      [write(item('milk', { amount: 2, unit: 'l' }), item('milk'))],
      item('milk', { amount: 3, unit: 'l' }),
      item('milk', { amount: 2, unit: 'l' }),
    )

    expect(remembered).toEqual([
      write(item('milk', { amount: 3, unit: 'l' }), item('milk')),
    ])
  })

  it('leaves the earlier writes untouched', () => {
    const earlier = [write(item('milk'))]

    rememberWrite(earlier, item('bread'), null)

    expect(earlier).toHaveLength(1)
  })
})

describe('withUnconfirmedWrites', () => {
  it('adds an item the snapshot has not delivered yet', () => {
    expect(
      withUnconfirmedWrites([item('bread')], [write(item('milk'))]),
    ).toEqual([item('bread'), item('milk')])
  })

  it('lifts the quantity the snapshot still shows as it was', () => {
    const known = withUnconfirmedWrites(
      [item('milk', { amount: 2, unit: 'l' })],
      [
        write(
          item('milk', { amount: 3, unit: 'l' }),
          item('milk', { amount: 2, unit: 'l' }),
        ),
      ],
    )

    expect(known).toEqual([item('milk', { amount: 3, unit: 'l' })])
  })

  it('lifts the check off state the snapshot does not carry yet', () => {
    const known = withUnconfirmedWrites(
      [item('milk')],
      [write(item('milk', null, 500), item('milk'))],
    )

    expect(known).toEqual([item('milk', null, 500)])
  })

  it('lifts an item the snapshot still reports as checked off', () => {
    const known = withUnconfirmedWrites(
      [item('milk', null, 500)],
      [write(item('milk'), item('milk', null, 500))],
    )

    expect(known).toEqual([item('milk')])
  })

  it('reports the live items unchanged without any write', () => {
    expect(withUnconfirmedWrites([item('bread')], [])).toEqual([item('bread')])
  })
})

describe('dropConfirmedWrites', () => {
  it('drops a write the snapshot carries as it was written', () => {
    const remaining = dropConfirmedWrites(
      [
        write(
          item('milk', { amount: 3, unit: 'l' }),
          item('milk', { amount: 2, unit: 'l' }),
        ),
      ],
      [item('milk', { amount: 3, unit: 'l' })],
    )

    expect(remaining).toEqual([])
  })

  it('keeps a write the snapshot does not carry at all', () => {
    const remaining = dropConfirmedWrites(
      [write(item('milk', null, 500), item('milk'))],
      [item('bread')],
    )

    expect(remaining).toHaveLength(1)
  })

  it('keeps a write while the snapshot still shows the state before it', () => {
    const remaining = dropConfirmedWrites(
      [write(item('milk', null, 500), item('milk'))],
      [item('milk')],
    )

    expect(remaining).toHaveLength(1)
  })

  it('drops a write the other device has overtaken with a quantity', () => {
    const remaining = dropConfirmedWrites(
      [
        write(
          item('milk', { amount: 3, unit: 'l' }),
          item('milk', { amount: 2, unit: 'l' }),
        ),
      ],
      [item('milk', { amount: 5, unit: 'l' })],
    )

    expect(remaining).toEqual([])
  })

  it('drops a write the other device has overtaken with a check off', () => {
    const remaining = dropConfirmedWrites(
      [write(item('milk'), item('milk', null, 500))],
      [item('milk', null, 900)],
    )

    expect(remaining).toEqual([])
  })

  it('keeps a write without a state before it while the snapshot shows another one', () => {
    const remaining = dropConfirmedWrites(
      [write(item('milk', { amount: 3, unit: 'l' }))],
      [item('milk', { amount: 2, unit: 'l' })],
    )

    expect(remaining).toHaveLength(1)
  })

  it('drops a write back to the state before it once the snapshot carries it', () => {
    const remaining = dropConfirmedWrites(
      [write(item('milk'), item('milk'))],
      [item('milk')],
    )

    expect(remaining).toEqual([])
  })
})
