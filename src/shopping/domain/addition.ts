import {
  addQuantities,
  canAddQuantities,
  type Quantity,
} from '../../shared/domain/quantity'
import {
  findOpenItemWithSameName,
  normalizeItemName,
  withQuantity,
  type NewShoppingItem,
  type ShoppingItem,
} from './shoppingItem'

export type AdditionOutcome =
  | { kind: 'newItem'; item: NewShoppingItem }
  | {
      kind: 'mergedInto'
      item: NewShoppingItem
      into: ShoppingItem
      quantity: Quantity
    }
  | { kind: 'besideDifferentUnit'; item: NewShoppingItem; open: ShoppingItem }

export function planAddition(
  item: NewShoppingItem,
  items: readonly ShoppingItem[],
): AdditionOutcome {
  const open = findOpenItemWithSameName(items, item.name)
  if (open === null) return { kind: 'newItem', item }
  if (!canAddQuantities(open.quantity, item.quantity))
    return { kind: 'besideDifferentUnit', item, open }
  return {
    kind: 'mergedInto',
    item,
    into: open,
    quantity: addQuantities(open.quantity, item.quantity),
  }
}

function fallTogether(
  items: readonly NewShoppingItem[],
): readonly NewShoppingItem[] {
  return items.reduce<NewShoppingItem[]>((gathered, item) => {
    const sameName = gathered.findIndex(
      (earlier) =>
        normalizeItemName(earlier.name) === normalizeItemName(item.name) &&
        canAddQuantities(earlier.quantity, item.quantity),
    )
    if (sameName === -1) return [...gathered, item]
    const earlier = gathered[sameName]
    return gathered.with(sameName, {
      ...earlier,
      quantity: addQuantities(earlier.quantity, item.quantity),
    })
  }, [])
}

function afterOutcome(
  items: readonly ShoppingItem[],
  outcome: AdditionOutcome,
): readonly ShoppingItem[] {
  if (outcome.kind !== 'mergedInto') return items
  return items.map((item) =>
    item.id === outcome.into.id ? withQuantity(item, outcome.quantity) : item,
  )
}

export function planAdditions(
  items: readonly NewShoppingItem[],
  openItems: readonly ShoppingItem[],
): readonly AdditionOutcome[] {
  let known = openItems
  return fallTogether(items).map((item) => {
    const outcome = planAddition(item, known)
    known = afterOutcome(known, outcome)
    return outcome
  })
}

export type AdditionsSummary = {
  added: number
  merged: number
  differentUnit: readonly string[]
}

export function summarizeAdditions(
  outcomes: readonly AdditionOutcome[],
): AdditionsSummary {
  return {
    added: outcomes.length,
    merged: outcomes.filter((outcome) => outcome.kind === 'mergedInto').length,
    differentUnit: outcomes
      .filter((outcome) => outcome.kind === 'besideDifferentUnit')
      .map((outcome) => outcome.open.name),
  }
}
