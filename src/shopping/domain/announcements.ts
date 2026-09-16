import {
  formatQuantity,
  InvalidQuantity,
  invalidQuantityMessage,
} from '../../shared/domain/quantity'
import type { AdditionOutcome } from './addition'
import {
  formatItemForAnnouncement,
  InvalidShoppingItem,
  type InvalidReason,
  type ShoppingItem,
} from './shoppingItem'

const messagesByReason: Record<InvalidReason, string> = {
  nameMissing: 'Bitte einen Namen eingeben.',
  nameTooLong: 'Der Name ist zu lang.',
}

export function invalidShoppingItemMessage(reason: InvalidReason): string {
  return messagesByReason[reason]
}

export function additionFailureMessage(error: unknown): string | null {
  if (error instanceof InvalidShoppingItem)
    return invalidShoppingItemMessage(error.reason)
  if (error instanceof InvalidQuantity)
    return invalidQuantityMessage(error.reason)
  return null
}

export function additionAnnouncement(outcome: AdditionOutcome): string {
  const confirmation = `${formatItemForAnnouncement(outcome.item)} hinzugefügt.`
  if (outcome.kind === 'newItem') return confirmation
  if (outcome.kind === 'mergedInto')
    return `${confirmation} Stand bereits offen, jetzt ${formatQuantity(outcome.quantity)}.`
  return `${confirmation} Achtung, ${outcome.open.name} steht bereits offen auf der Liste.`
}

export function listHeading(openCount: number): string {
  return openCount === 0
    ? 'Einkaufsliste, nichts offen'
    : `Einkaufsliste, ${openCount} offen`
}

function openCountPhrase(openCount: number): string {
  return openCount === 0 ? 'nichts mehr offen' : `noch ${openCount} offen`
}

export function checkOffAnnouncement(
  item: ShoppingItem,
  openCount: number,
): string {
  return `${item.name} abgehakt, ${openCountPhrase(openCount)}`
}

export function reopenAnnouncement(
  item: ShoppingItem,
  openCount: number,
): string {
  return `${item.name} wieder offen, ${openCount} offen`
}

export function cleanUpLabel(pendingChanges: number): string {
  return pendingChanges === 1
    ? 'Aufräumen, 1 Änderung'
    : `Aufräumen, ${pendingChanges} Änderungen`
}

export function cleanUpAnnouncement(openCount: number): string {
  return openCount === 0
    ? 'Aufgeräumt, die Liste ist leer'
    : `Aufgeräumt, ${openCount} offen`
}
