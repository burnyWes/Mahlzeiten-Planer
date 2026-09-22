import { useCallback, useEffect, useRef, useState } from 'react'
import type { SuppliesClient } from '../api/suppliesClient'
import type { MealId } from '../domain/meal'
import {
  supplyOf,
  withoutSupply,
  withSupply,
  type Supply,
} from '../domain/supply'

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

  const publish = useCallback((written: readonly Supply[]) => {
    kept.current = written
    setSupplies(written)
  }, [])

  useEffect(() => client.observeSupplies(publish), [client, publish])

  const keepSupply = useCallback(
    (written: Supply) => {
      publish(withSupply(kept.current, written))
      client.writeSupply(written)
    },
    [client, publish],
  )

  const removeSupply = useCallback(
    (mealId: MealId) => {
      publish(withoutSupply(kept.current, mealId))
      client.removeSupply(mealId)
    },
    [client, publish],
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
