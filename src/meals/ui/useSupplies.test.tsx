import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createInMemorySuppliesClient } from '../api/inMemorySuppliesClient'
import type { SuppliesClient } from '../api/suppliesClient'
import {
  withOneLess,
  withOneMore,
  withoutSupply,
  withSupply,
  type Supply,
} from '../domain/supply'
import { useSupplies } from './useSupplies'

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
}

type LaggingSuppliesClient = SuppliesClient & {
  deliverNextSnapshot(): void
  suppliesArriveFromElsewhere(supplies: readonly Supply[]): void
  storedSupplies(): readonly Supply[]
}

function createLaggingSuppliesClient(
  initialSupplies: readonly Supply[],
): LaggingSuppliesClient {
  let supplies = initialSupplies
  const heldBackSnapshots: (readonly Supply[])[] = []
  let onSnapshot: (supplies: readonly Supply[]) => void = () => {}

  return {
    observeSupplies(onSupplies) {
      onSnapshot = onSupplies
      onSupplies(supplies)
      return () => {}
    },
    writeSupply(written) {
      supplies = withSupply(supplies, written)
      heldBackSnapshots.push(supplies)
    },
    removeSupply(mealId) {
      supplies = withoutSupply(supplies, mealId)
      heldBackSnapshots.push(supplies)
    },
    deliverNextSnapshot() {
      onSnapshot(heldBackSnapshots.shift()!)
    },
    suppliesArriveFromElsewhere(arriving) {
      supplies = arriving
      onSnapshot(arriving)
    },
    storedSupplies() {
      return supplies
    },
  }
}

function laggingSuppliesOf(initialSupplies: readonly Supply[]) {
  const client = createLaggingSuppliesClient(initialSupplies)
  const { result } = renderHook(() => useSupplies(client))
  return { client, supplies: result }
}

function suppliesOf(initialSupplies: readonly Supply[]) {
  const client = createInMemorySuppliesClient(initialSupplies)
  const { result } = renderHook(() => useSupplies(client))
  return { client, supplies: result }
}

describe('useSupplies', () => {
  it('keeps every change that arrives before the next render', () => {
    const { client, supplies } = suppliesOf([supply('bolognese', 1)])

    act(() => {
      supplies.current.changeSupply('bolognese', withOneMore)
      supplies.current.changeSupply('bolognese', withOneMore)
    })

    expect(client.storedSupplies()).toEqual([supply('bolognese', 3)])
  })

  it('takes the last portion only once, however fast it is asked for', () => {
    const { client, supplies } = suppliesOf([supply('bolognese', 2)])

    act(() => {
      supplies.current.changeSupply('bolognese', withOneLess)
      supplies.current.changeSupply('bolognese', withOneLess)
    })

    expect(client.storedSupplies()).toEqual([])
  })

  it('reports the supply it left behind', () => {
    const { supplies } = suppliesOf([supply('bolognese', 2)])
    let changed: Supply | null = null

    act(() => {
      changed = supplies.current.changeSupply('bolognese', withOneMore)
    })

    expect(changed).toEqual(supply('bolognese', 3))
  })

  it('reports that nothing is left when the last portion is taken', () => {
    const { supplies } = suppliesOf([supply('bolognese', 1)])
    let changed: Supply | null = supply('bolognese', 1)

    act(() => {
      changed = supplies.current.changeSupply('bolognese', withOneLess)
    })

    expect(changed).toBeNull()
  })

  it('changes nothing for a meal without a supply', () => {
    const { client, supplies } = suppliesOf([supply('bolognese', 2)])

    act(() => {
      expect(supplies.current.changeSupply('soup', withOneMore)).toBeNull()
    })

    expect(client.storedSupplies()).toEqual([supply('bolognese', 2)])
  })

  it('keeps a later count when the snapshot of an earlier one arrives late', () => {
    const { client, supplies } = laggingSuppliesOf([supply('bolognese', 1)])

    act(() => {
      supplies.current.changeSupply('bolognese', withOneMore)
    })
    act(() => {
      supplies.current.changeSupply('bolognese', withOneMore)
    })
    act(() => client.deliverNextSnapshot())

    expect(supplies.current.supplies).toEqual([supply('bolognese', 3)])
  })

  it('counts on from the shown supply after a late snapshot', () => {
    const { client, supplies } = laggingSuppliesOf([supply('bolognese', 1)])

    act(() => {
      supplies.current.changeSupply('bolognese', withOneMore)
    })
    act(() => {
      supplies.current.changeSupply('bolognese', withOneMore)
    })
    act(() => client.deliverNextSnapshot())
    act(() => {
      supplies.current.changeSupply('bolognese', withOneMore)
    })

    expect(client.storedSupplies()).toEqual([supply('bolognese', 4)])
  })

  it('keeps every supply spent at once when their snapshots arrive late', () => {
    const { client, supplies } = laggingSuppliesOf([
      supply('bolognese', 2),
      supply('chili', 2),
    ])

    act(() => {
      supplies.current.changeSupply('bolognese', withOneLess)
      supplies.current.changeSupply('chili', withOneLess)
    })
    act(() => client.deliverNextSnapshot())

    expect(supplies.current.supplies).toEqual([
      supply('bolognese', 1),
      supply('chili', 1),
    ])
  })

  it('keeps a removed supply hidden while a late snapshot still carries it', () => {
    const { client, supplies } = laggingSuppliesOf([supply('bolognese', 1)])

    act(() => {
      supplies.current.changeSupply('bolognese', withOneMore)
    })
    act(() => supplies.current.removeSupply('bolognese'))
    act(() => client.deliverNextSnapshot())

    expect(supplies.current.supplies).toEqual([])
  })

  it('shows a supply the other device changed while an own write waits', () => {
    const { client, supplies } = laggingSuppliesOf([
      supply('bolognese', 1),
      supply('chili', 1),
    ])

    act(() => {
      supplies.current.changeSupply('bolognese', withOneMore)
    })
    act(() =>
      client.suppliesArriveFromElsewhere([
        supply('bolognese', 1),
        supply('chili', 5),
      ]),
    )

    expect(supplies.current.supplies).toEqual([
      supply('bolognese', 2),
      supply('chili', 5),
    ])
  })
})
