import {
  formatQuantity,
  readQuantity,
  type Quantity,
  type QuantityDraft,
} from '../../shared/domain/quantity'

export type ItemId = string

export type NewShoppingItem = {
  name: string
  quantity: Quantity | null
  createdAt: number
}

export type ShoppingItem = NewShoppingItem & {
  id: ItemId
  checkedOffAt: number | null
}

export type ShoppingItemDraft = QuantityDraft & {
  name: string
}

export type InvalidReason = 'nameMissing' | 'nameTooLong'

export class InvalidShoppingItem extends Error {
  reason: InvalidReason

  constructor(reason: InvalidReason) {
    super(reason)
    this.name = 'InvalidShoppingItem'
    this.reason = reason
  }
}

const MAXIMUM_NAME_LENGTH = 100

export function createItemName(written: string): string {
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
    name: createItemName(draft.name),
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
  const quantity = formatQuantity(item.quantity)
  return quantity === '' ? item.name : `${item.name}, ${quantity}`
}

export function inCreationOrder(
  items: readonly ShoppingItem[],
): readonly ShoppingItem[] {
  return [...items].sort(
    (one, other) =>
      one.createdAt - other.createdAt || one.id.localeCompare(other.id),
  )
}

export function checkOff(item: ShoppingItem, at: number): ShoppingItem {
  return { ...item, checkedOffAt: at }
}

export function reopen(item: ShoppingItem): ShoppingItem {
  return { ...item, checkedOffAt: null }
}

export function withQuantity(
  item: ShoppingItem,
  quantity: Quantity | null,
): ShoppingItem {
  return { ...item, quantity }
}
