import { useCallback, useEffect, useState } from 'react'
import type { SuppliesClient } from '../api/suppliesClient'
import type { MealId } from '../domain/meal'
import { withoutSupply, withSupply, type Supply } from '../domain/supply'

export type Supplies = {
  supplies: readonly Supply[]
  keepSupply: (supply: Supply) => void
  removeSupply: (mealId: MealId) => void
}

export function useSupplies(client: SuppliesClient): Supplies {
  const [supplies, setSupplies] = useState<readonly Supply[]>([])

  useEffect(() => client.observeSupplies(setSupplies), [client])

  const keepSupply = useCallback(
    (written: Supply) => {
      setSupplies((kept) => withSupply(kept, written))
      client.writeSupply(written)
    },
    [client],
  )

  const removeSupply = useCallback(
    (mealId: MealId) => {
      setSupplies((kept) => withoutSupply(kept, mealId))
      client.removeSupply(mealId)
    },
    [client],
  )

  return { supplies, keepSupply, removeSupply }
}
