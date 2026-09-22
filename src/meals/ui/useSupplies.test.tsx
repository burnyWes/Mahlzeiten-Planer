import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createInMemorySuppliesClient } from '../api/inMemorySuppliesClient'
import { withOneLess, withOneMore, type Supply } from '../domain/supply'
import { useSupplies } from './useSupplies'

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
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
})
