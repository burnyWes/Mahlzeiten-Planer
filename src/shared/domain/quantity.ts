export type Quantity = {
  amount: number
  unit: string | null
}

export type QuantityDraft = {
  amount: string
  unit: string
}

export type InvalidQuantityReason =
  | 'amountNotANumber'
  | 'amountNotPositive'
  | 'unitWithoutAmount'
  | 'unitsDoNotMatch'

export class InvalidQuantity extends Error {
  reason: InvalidQuantityReason

  constructor(reason: InvalidQuantityReason) {
    super(reason)
    this.name = 'InvalidQuantity'
    this.reason = reason
  }
}

export const UNITS = ['Stück', 'g', 'kg', 'ml', 'l', 'Pck.']

const ONE_WITHOUT_UNIT: Quantity = { amount: 1, unit: null }

const messagesByReason: Record<InvalidQuantityReason, string> = {
  amountNotANumber: 'Die Menge muss eine Zahl sein.',
  amountNotPositive: 'Die Menge muss größer als null sein.',
  unitWithoutAmount: 'Zur Einheit fehlt die Menge.',
  unitsDoNotMatch: 'Die Einheiten passen nicht zusammen.',
}

export function invalidQuantityMessage(reason: InvalidQuantityReason): string {
  return messagesByReason[reason]
}

function readAmount(written: string): number {
  const amount = Number(written.trim().replace(',', '.'))
  if (Number.isNaN(amount)) throw new InvalidQuantity('amountNotANumber')
  if (amount <= 0) throw new InvalidQuantity('amountNotPositive')
  return amount
}

export function readQuantity(draft: QuantityDraft): Quantity | null {
  const unit = draft.unit.trim()
  if (draft.amount.trim() === '') {
    if (unit !== '') throw new InvalidQuantity('unitWithoutAmount')
    return null
  }
  return { amount: readAmount(draft.amount), unit: unit === '' ? null : unit }
}

export function formatQuantity(quantity: Quantity | null): string {
  if (quantity === null) return ''
  const { amount, unit } = quantity
  return unit === null ? `${amount}` : `${amount} ${unit}`
}

export function sameQuantity(
  one: Quantity | null,
  other: Quantity | null,
): boolean {
  if (one === null || other === null) return one === other
  return one.amount === other.amount && one.unit === other.unit
}

export function orOneWithoutUnit(quantity: Quantity | null): Quantity {
  return quantity ?? ONE_WITHOUT_UNIT
}

export function canAddQuantities(
  one: Quantity | null,
  other: Quantity | null,
): boolean {
  return orOneWithoutUnit(one).unit === orOneWithoutUnit(other).unit
}

export function addQuantities(
  one: Quantity | null,
  other: Quantity | null,
): Quantity {
  if (!canAddQuantities(one, other))
    throw new InvalidQuantity('unitsDoNotMatch')
  const summand = orOneWithoutUnit(one)
  return {
    amount: summand.amount + orOneWithoutUnit(other).amount,
    unit: summand.unit,
  }
}
