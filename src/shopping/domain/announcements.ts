import {
  formatItemForAnnouncement,
  type InvalidReason,
  type NewShoppingItem,
  type ShoppingItem,
} from './shoppingItem'

const messagesByReason: Record<InvalidReason, string> = {
  nameMissing: 'Bitte einen Namen eingeben.',
  nameTooLong: 'Der Name ist zu lang.',
  amountNotANumber: 'Die Menge muss eine Zahl sein.',
  amountNotPositive: 'Die Menge muss größer als null sein.',
  unitWithoutAmount: 'Zur Einheit fehlt die Menge.',
}

export function invalidShoppingItemMessage(reason: InvalidReason): string {
  return messagesByReason[reason]
}

export function additionAnnouncement(
  added: NewShoppingItem,
  alreadyOpen: ShoppingItem | null,
): string {
  const confirmation = `${formatItemForAnnouncement(added)} hinzugefügt.`
  return alreadyOpen === null
    ? confirmation
    : `${confirmation} Achtung, ${alreadyOpen.name} steht bereits offen auf der Liste.`
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
