import type { KnownUnit, KnownUnitRename } from '../domain/knownUnit'

export interface KnownUnitsClient {
  observeKnownUnits(
    onKnownUnits: (knownUnits: readonly KnownUnit[]) => void,
  ): () => void
  recordUse(unit: string, usedAt: number): void
  removeKnownUnit(unit: string): void
  renameKnownUnit(rename: KnownUnitRename): void
  takeOverIfEmpty(unitsOfMeals: () => Promise<readonly string[]>): void
}
