import { useCallback, useEffect, useRef, useState } from 'react'
import { isStaleSnapshot } from '../../shared/domain/unconfirmedWrite'
import type { MealCategoriesClient } from '../api/mealCategoriesClient'
import { sameCatalogNames } from '../domain/mealCategory'

export type MealCategories = {
  names: readonly string[]
  writeNames: (names: readonly string[]) => void
}

export function useMealCategories(
  client: MealCategoriesClient,
): MealCategories {
  const [names, setNames] = useState<readonly string[]>([])
  const unconfirmedNames = useRef<readonly string[] | null>(null)

  useEffect(
    () =>
      client.observeCatalog((arriving) => {
        if (
          isStaleSnapshot(unconfirmedNames.current, arriving, sameCatalogNames)
        )
          return
        unconfirmedNames.current = null
        setNames(arriving)
      }),
    [client],
  )

  const writeNames = useCallback(
    (written: readonly string[]) => {
      unconfirmedNames.current = written
      setNames(written)
      client.writeCatalog(written)
    },
    [client],
  )

  return { names, writeNames }
}
