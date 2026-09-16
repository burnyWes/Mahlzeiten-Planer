import { useEffect, useRef, useState } from 'react'
import type { KnownItemsClient } from '../api/knownItemsClient'
import type { KnownItem } from '../domain/knownItem'

export function useKnownItems(client: KnownItemsClient): readonly KnownItem[] {
  const [knownItems, setKnownItems] = useState<readonly KnownItem[]>([])
  const tookOverHistoryFor = useRef<KnownItemsClient | null>(null)

  useEffect(() => client.observeKnownItems(setKnownItems), [client])

  useEffect(() => {
    if (tookOverHistoryFor.current === client) return
    tookOverHistoryFor.current = client
    client.takeOverHistoryIfEmpty()
  }, [client])

  return knownItems
}
