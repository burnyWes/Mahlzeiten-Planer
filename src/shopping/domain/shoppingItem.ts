export type ItemId = string

export type Quantity = {
  amount: number
  unit: string | null
}

export type NewShoppingItem = {
  name: string
  quantity: Quantity | null
  createdAt: number
}

export type ShoppingItem = NewShoppingItem & {
  id: ItemId
  checkedOffAt: number | null
}

export type ShoppingItemDraft = {
  name: string
  amount: string
  unit: string
}

export type InvalidReason =
  | 'nameMissing'
  | 'nameTooLong'
  | 'amountNotANumber'
  | 'amountNotPositive'
  | 'unitWithoutAmount'

export class InvalidShoppingItem extends Error {
  reason: InvalidReason

  constructor(reason: InvalidReason) {
    super(reason)
    this.name = 'InvalidShoppingItem'
    this.reason = reason
  }
}

const MAXIMUM_NAME_LENGTH = 100

function readAmount(written: string): number {
  const amount = Number(written.trim().replace(',', '.'))
  if (Number.isNaN(amount)) throw new InvalidShoppingItem('amountNotANumber')
  if (amount <= 0) throw new InvalidShoppingItem('amountNotPositive')
  return amount
}

function readQuantity(draft: ShoppingItemDraft): Quantity | null {
  const unit = draft.unit.trim()
  if (draft.amount.trim() === '') {
    if (unit !== '') throw new InvalidShoppingItem('unitWithoutAmount')
    return null
  }
  return { amount: readAmount(draft.amount), unit: unit === '' ? null : unit }
}

function readName(written: string): string {
  const name = written.trim()
  if (name === '') throw new InvalidShoppingItem('nameMissing')
  if (name.length > MAXIMUM_NAME_LENGTH)
    throw new InvalidShoppingItem('nameTooLong')
  return name
}

export function createShoppingItem(
  draft: ShoppingItemDraft,
  createdAt: number,
): NewShoppingItem {
  return {
    name: readName(draft.name),
    quantity: readQuantity(draft),
    createdAt,
  }
}

export function normalizeItemName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE')
}

export function isOpen(item: ShoppingItem): boolean {
  return item.checkedOffAt === null
}

export function isCheckedOff(item: ShoppingItem): boolean {
  return !isOpen(item)
}

export function findOpenItemWithSameName(
  items: readonly ShoppingItem[],
  name: string,
): ShoppingItem | null {
  const wanted = normalizeItemName(name)
  return (
    items.find(
      (item) => isOpen(item) && normalizeItemName(item.name) === wanted,
    ) ?? null
  )
}

export function formatItemForAnnouncement(item: NewShoppingItem): string {
  if (item.quantity === null) return item.name
  const { amount, unit } = item.quantity
  return unit === null
    ? `${item.name}, ${amount}`
    : `${item.name}, ${amount} ${unit}`
}

export function inCreationOrder(
  items: readonly ShoppingItem[],
): readonly ShoppingItem[] {
  return [...items].sort(
    (one, other) =>
      one.createdAt - other.createdAt || one.id.localeCompare(other.id),
  )
}
