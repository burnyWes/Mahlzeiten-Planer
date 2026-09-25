import { useCallback, useEffect, useRef, useState } from 'react'
import type { SuppliesClient } from '../api/suppliesClient'
import type { MealId } from '../domain/meal'
import { supplyOf, type Supply } from '../domain/supply'
import {
  dropConfirmedSupplies,
  rememberSupplyWrite,
  withUnconfirmedSupplies,
  type UnconfirmedSupplies,
} from '../domain/unconfirmedSupplies'

export type Supplies = {
  supplies: readonly Supply[]
  keepSupply: (supply: Supply) => void
  removeSupply: (mealId: MealId) => void
  changeSupply: (
    mealId: MealId,
    change: (supply: Supply) => Supply | null,
  ) => Supply | null
}

export function useSupplies(client: SuppliesClient): Supplies {
  const [supplies, setSupplies] = useState<readonly Supply[]>([])
  const kept = useRef<readonly Supply[]>([])
  const live = useRef<readonly Supply[]>([])
  const unconfirmed = useRef<UnconfirmedSupplies>([])

  const show = useCallback(() => {
    kept.current = withUnconfirmedSupplies(live.current, unconfirmed.current)
    setSupplies(kept.current)
  }, [])

  useEffect(
    () =>
      client.observeSupplies((arriving) => {
        live.current = arriving
        unconfirmed.current = dropConfirmedSupplies(
          unconfirmed.current,
          arriving,
        )
        show()
      }),
    [client, show],
  )

  const rememberWrite = useCallback(
    (mealId: MealId, written: Supply | null) => {
      unconfirmed.current = rememberSupplyWrite(
        unconfirmed.current,
        mealId,
        written,
      )
      show()
    },
    [show],
  )

  const keepSupply = useCallback(
    (written: Supply) => {
      rememberWrite(written.mealId, written)
      client.writeSupply(written)
    },
    [client, rememberWrite],
  )

  const removeSupply = useCallback(
    (mealId: MealId) => {
      rememberWrite(mealId, null)
      client.removeSupply(mealId)
    },
    [client, rememberWrite],
  )

  const changeSupply = useCallback(
    (mealId: MealId, change: (supply: Supply) => Supply | null) => {
      const supply = supplyOf(kept.current, mealId)
      if (supply === null) return null
      const changed = change(supply)
      if (changed === null) {
        removeSupply(mealId)
        return null
      }
      keepSupply(changed)
      return changed
    },
    [keepSupply, removeSupply],
  )

  return { supplies, keepSupply, removeSupply, changeSupply }
}
