export type Quantity = {
  amount: number
  unit: string | null
}

export type QuantityDraft = {
  amount: string
  unit: string
}

export type AmountStep = 1 | -1

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

const ONE_WITHOUT_UNIT: Quantity = { amount: 1, unit: null }

const AMOUNT_OF_EMPTY_FIELD = '1'

const messagesByReason: Record<InvalidQuantityReason, string> = {
  amountNotANumber: 'Die Menge muss eine Zahl sein.',
  amountNotPositive: 'Die Menge muss größer als null sein.',
  unitWithoutAmount: 'Zur Einheit fehlt die Menge.',
  unitsDoNotMatch: 'Die Einheiten passen nicht zusammen.',
}

export function invalidQuantityMessage(reason: InvalidQuantityReason): string {
  return messagesByReason[reason]
}

export const MAXIMUM_STEPPED_AMOUNT = 9999

const SMALLEST_STEPPED_AMOUNT = 1

export function roundedAmount(amount: number): number {
  return Math.round(amount * 1_000_000) / 1_000_000
}

function writtenNumber(written: string): number {
  return Number(written.trim().replace(',', '.'))
}

function writtenWithComma(amount: number): string {
  return String(amount).replace('.', ',')
}

function readAmount(written: string): number {
  const amount = writtenNumber(written)
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

export function spokenAmount(written: string): string {
  const trimmed = written.trim()
  return trimmed === '' ? AMOUNT_OF_EMPTY_FIELD : trimmed
}

export function readSteppedAmount(written: string): number | null {
  if (written.trim() === '') return Number(AMOUNT_OF_EMPTY_FIELD)
  const amount = writtenNumber(written)
  return Number.isNaN(amount) || amount <= 0 ? null : amount
}

export function stepWrittenAmount(
  written: string,
  step: AmountStep,
): string | null {
  const amount = readSteppedAmount(written)
  if (amount === null) return null
  const stepped = roundedAmount(amount + step)
  if (stepped < SMALLEST_STEPPED_AMOUNT || stepped > MAXIMUM_STEPPED_AMOUNT)
    return null
  return writtenWithComma(stepped)
}
