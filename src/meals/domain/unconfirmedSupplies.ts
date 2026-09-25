import type { MealId } from './meal'
import { supplyOf, withoutSupply, withSupply, type Supply } from './supply'

export type UnconfirmedSupply = {
  mealId: MealId
  supply: Supply | null
}

export type UnconfirmedSupplies = readonly UnconfirmedSupply[]

export function rememberSupplyWrite(
  unconfirmed: UnconfirmedSupplies,
  mealId: MealId,
  supply: Supply | null,
): UnconfirmedSupplies {
  return [
    ...unconfirmed.filter((write) => write.mealId !== mealId),
    { mealId, supply },
  ]
}

export function withUnconfirmedSupplies(
  live: readonly Supply[],
  unconfirmed: UnconfirmedSupplies,
): readonly Supply[] {
  return unconfirmed.reduce(
    (supplies, write) =>
      write.supply === null
        ? withoutSupply(supplies, write.mealId)
        : withSupply(supplies, write.supply),
    live,
  )
}

function isConfirmed(write: UnconfirmedSupply, live: readonly Supply[]) {
  const arriving = supplyOf(live, write.mealId)
  if (write.supply === null) return arriving === null
  return arriving !== null && arriving.count === write.supply.count
}

export function dropConfirmedSupplies(
  unconfirmed: UnconfirmedSupplies,
  live: readonly Supply[],
): UnconfirmedSupplies {
  return unconfirmed.filter((write) => !isConfirmed(write, live))
}
