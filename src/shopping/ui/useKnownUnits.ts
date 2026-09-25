import { useCallback, useEffect, useRef, useState } from 'react'
import type { KnownUnitsClient } from '../api/knownUnitsClient'
import type { KnownUnit, KnownUnitRename } from '../domain/knownUnit'

export type KnownUnits = {
  knownUnits: readonly KnownUnit[]
  removeKnownUnit: (unit: string) => void
  renameKnownUnit: (rename: KnownUnitRename) => void
}

export function useKnownUnits(
  client: KnownUnitsClient,
  unitsOfMeals: () => Promise<readonly string[]>,
): KnownUnits {
  const [knownUnits, setKnownUnits] = useState<readonly KnownUnit[]>([])
  const tookOverFor = useRef<KnownUnitsClient | null>(null)
  const latestUnitsOfMeals = useRef(unitsOfMeals)

  useEffect(() => {
    latestUnitsOfMeals.current = unitsOfMeals
  }, [unitsOfMeals])

  useEffect(() => client.observeKnownUnits(setKnownUnits), [client])

  useEffect(() => {
    if (tookOverFor.current === client) return
    tookOverFor.current = client
    client.takeOverIfEmpty(() => latestUnitsOfMeals.current())
  }, [client])

  const removeKnownUnit = useCallback(
    (unit: string) => client.removeKnownUnit(unit),
    [client],
  )

  const renameKnownUnit = useCallback(
    (rename: KnownUnitRename) => client.renameKnownUnit(rename),
    [client],
  )

  return { knownUnits, removeKnownUnit, renameKnownUnit }
}
