import { useCallback, useEffect, useRef, useState } from 'react'
import type { KnownItemsClient } from '../api/knownItemsClient'
import type { KnownItem } from '../domain/knownItem'

export type KnownItems = {
  knownItems: readonly KnownItem[]
  removeKnownItem: (name: string) => void
}

export function useKnownItems(client: KnownItemsClient): KnownItems {
  const [knownItems, setKnownItems] = useState<readonly KnownItem[]>([])
  const tookOverHistoryFor = useRef<KnownItemsClient | null>(null)

  useEffect(() => client.observeKnownItems(setKnownItems), [client])

  useEffect(() => {
    if (tookOverHistoryFor.current === client) return
    tookOverHistoryFor.current = client
    client.takeOverHistoryIfEmpty()
  }, [client])

  const removeKnownItem = useCallback(
    (name: string) => client.removeKnownItem(name),
    [client],
  )

  return { knownItems, removeKnownItem }
}
