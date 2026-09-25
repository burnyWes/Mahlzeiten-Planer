import { describe, expect, it } from 'vitest'
import type { Supply } from './supply'
import {
  dropConfirmedSupplies,
  rememberSupplyWrite,
  withUnconfirmedSupplies,
} from './unconfirmedSupplies'

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
}

describe('withUnconfirmedSupplies', () => {
  it('overlays the own count while the snapshot still shows an earlier one', () => {
    const unconfirmed = rememberSupplyWrite(
      [],
      'bolognese',
      supply('bolognese', 4),
    )

    expect(
      withUnconfirmedSupplies([supply('bolognese', 1)], unconfirmed),
    ).toEqual([supply('bolognese', 4)])
  })

  it('hides a supply removed here while the snapshot still carries it', () => {
    const unconfirmed = rememberSupplyWrite([], 'bolognese', null)

    expect(
      withUnconfirmedSupplies(
        [supply('bolognese', 1), supply('chili', 2)],
        unconfirmed,
      ),
    ).toEqual([supply('chili', 2)])
  })

  it('adds a supply kept here that the snapshot has not delivered yet', () => {
    const unconfirmed = rememberSupplyWrite([], 'soup', supply('soup', 3))

    expect(withUnconfirmedSupplies([supply('chili', 2)], unconfirmed)).toEqual([
      supply('chili', 2),
      supply('soup', 3),
    ])
  })

  it('takes supplies without an own write straight from the snapshot', () => {
    const unconfirmed = rememberSupplyWrite(
      [],
      'bolognese',
      supply('bolognese', 4),
    )

    expect(
      withUnconfirmedSupplies(
        [supply('bolognese', 1), supply('chili', 5)],
        unconfirmed,
      ),
    ).toEqual([supply('bolognese', 4), supply('chili', 5)])
  })
})

describe('dropConfirmedSupplies', () => {
  it('drops an own write once the snapshot carries its count', () => {
    const unconfirmed = rememberSupplyWrite(
      [],
      'bolognese',
      supply('bolognese', 4),
    )

    expect(
      dropConfirmedSupplies(unconfirmed, [supply('bolognese', 4)]),
    ).toEqual([])
  })

  it('drops an own removal once the snapshot no longer carries the supply', () => {
    const unconfirmed = rememberSupplyWrite([], 'bolognese', null)

    expect(dropConfirmedSupplies(unconfirmed, [supply('chili', 2)])).toEqual([])
  })

  it('keeps an own write while the snapshot shows another count', () => {
    const unconfirmed = rememberSupplyWrite(
      [],
      'bolognese',
      supply('bolognese', 4),
    )

    expect(
      dropConfirmedSupplies(unconfirmed, [supply('bolognese', 1)]),
    ).toEqual(unconfirmed)
  })
})

describe('rememberSupplyWrite', () => {
  it('replaces an earlier own write of the same meal', () => {
    const earlier = rememberSupplyWrite([], 'bolognese', supply('bolognese', 4))

    expect(
      rememberSupplyWrite(earlier, 'bolognese', supply('bolognese', 5)),
    ).toEqual([{ mealId: 'bolognese', supply: supply('bolognese', 5) }])
  })
})
