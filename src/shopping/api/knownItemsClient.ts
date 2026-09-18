import type { KnownItem } from '../domain/knownItem'

export interface KnownItemsClient {
  observeKnownItems(
    onKnownItems: (knownItems: readonly KnownItem[]) => void,
  ): () => void
  recordUse(name: string, usedAt: number): void
  removeKnownItem(name: string): void
  takeOverHistoryIfEmpty(): void
}
