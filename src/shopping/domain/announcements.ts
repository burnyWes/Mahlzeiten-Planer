import {
  formatQuantity,
  InvalidQuantity,
  invalidQuantityMessage,
} from '../../shared/domain/quantity'
import type { AdditionOutcome, AdditionsSummary } from './addition'
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

export function additionsAnnouncement(summary: AdditionsSummary): string {
  const merged =
    summary.merged > 0 ? [`${summary.merged} zusammengefasst.`] : []
  const conflicts = summary.differentUnit.map(
    (name) => `Achtung, ${name} steht mit anderer Einheit bereits offen.`,
  )
  return [
    `${summary.added} Artikel hinzugefügt.`,
    ...merged,
    ...conflicts,
  ].join(' ')
}

export function listHeading(openCount: number): string {
  return openCount === 0
    ? 'Einkaufsliste, nichts offen'
    : `Einkaufsliste, ${openCount} offen`
}

export function knownItemsHeading(knownItemCount: number): string {
  return knownItemCount === 0
    ? 'Artikelverwaltung, keine'
    : `Artikelverwaltung, ${knownItemCount}`
}

export function knownItemSavedAnnouncement(name: string): string {
  return `${name} gespeichert.`
}

function remainingKnownItemPhrase(remainingKnownItems: number): string {
  if (remainingKnownItems === 0) return 'keine Vorschläge mehr'
  return remainingKnownItems === 1
    ? 'noch 1 Vorschlag'
    : `noch ${remainingKnownItems} Vorschläge`
}

export function knownItemDeletedAnnouncement(
  name: string,
  remainingKnownItems: number,
): string {
  return `${name} gelöscht, ${remainingKnownItemPhrase(remainingKnownItems)}.`
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

export function itemRemovedAnnouncement(
  item: ShoppingItem,
  openCount: number,
): string {
  return `${item.name} entfernt, ${openCountPhrase(openCount)}.`
}

export function quantityChangedAnnouncement(item: ShoppingItem): string {
  return `${formatItemForAnnouncement(item)}.`
}

export function lessItemLabel(item: ShoppingItem): string {
  return `Weniger, ${item.name}`
}

export function moreItemLabel(item: ShoppingItem): string {
  return `Mehr, ${item.name}`
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
