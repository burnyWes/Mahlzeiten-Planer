import { useCallback, useEffect, useRef, useState } from 'react'
import type { KnownItemsClient } from '../api/knownItemsClient'
import type { KnownItem, KnownItemRename } from '../domain/knownItem'

export type KnownItems = {
  knownItems: readonly KnownItem[]
  loaded: boolean
  removeKnownItem: (name: string) => void
  renameKnownItem: (rename: KnownItemRename) => void
  addKnownItem: (knownItem: KnownItem) => void
}

export function useKnownItems(client: KnownItemsClient): KnownItems {
  const [knownItems, setKnownItems] = useState<readonly KnownItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const tookOverHistoryFor = useRef<KnownItemsClient | null>(null)

  useEffect(
    () =>
      client.observeKnownItems((observed) => {
        setKnownItems(observed)
        setLoaded(true)
      }),
    [client],
  )

  useEffect(() => {
    if (tookOverHistoryFor.current === client) return
    tookOverHistoryFor.current = client
    client.takeOverHistoryIfEmpty()
  }, [client])

  const removeKnownItem = useCallback(
    (name: string) => client.removeKnownItem(name),
    [client],
  )

  const renameKnownItem = useCallback(
    (rename: KnownItemRename) => client.renameKnownItem(rename),
    [client],
  )

  const addKnownItem = useCallback(
    (knownItem: KnownItem) => client.addKnownItem(knownItem),
    [client],
  )

  return {
    knownItems,
    loaded,
    removeKnownItem,
    renameKnownItem,
    addKnownItem,
  }
}
