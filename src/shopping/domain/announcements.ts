import {
  formatQuantity,
  InvalidQuantity,
  invalidQuantityMessage,
} from '../../shared/domain/quantity'
import type { AdditionOutcome, AdditionsSummary } from './addition'
import {
  findItemCategory,
  ItemCategoryAlreadyTaken,
  ItemCategoryMissing,
  type CategoryAssignment,
  type CategoryPlacement,
  type ItemCategory,
  type PlacedItemCategory,
} from './itemCategory'
import { KnownItemAlreadyTaken, type KnownItem } from './knownItem'
import { KnownUnitAlreadyTaken } from './knownUnit'
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
  if (error instanceof KnownUnitAlreadyTaken)
    return `Die Einheit ${error.knownUnit} gibt es schon.`
  if (error instanceof KnownItemAlreadyTaken)
    return `Den Artikel ${error.knownItem} gibt es schon.`
  if (error instanceof ItemCategoryMissing)
    return 'Bitte eine Kategorie eingeben oder ohne Kategorie hinzufügen.'
  if (error instanceof ItemCategoryAlreadyTaken)
    return `Die Kategorie ${error.category} gibt es schon.`
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

export function listSectionHeading(category: ItemCategory | null): string {
  return category === null ? 'Ohne Kategorie' : category.name
}

export function listHeading(openCount: number): string {
  return openCount === 0
    ? 'Einkaufsliste, nichts offen'
    : `Einkaufsliste, ${openCount} offen`
}

export function knownItemsHeading(knownItemCount: number): string {
  return knownItemCount === 0 ? 'Artikel, keine' : `Artikel, ${knownItemCount}`
}

export function knownItemRowLabel(
  knownItem: KnownItem,
  category: ItemCategory | null,
): string {
  return category === null
    ? knownItem.name
    : `${knownItem.name} (${category.name})`
}

export type KnownItemFormMode = 'create' | 'edit'

export function knownItemFormHeading(mode: KnownItemFormMode): string {
  return mode === 'create' ? 'Artikel anlegen' : 'Artikel bearbeiten'
}

export function knownItemCreatedAnnouncement(name: string): string {
  return `${name} angelegt.`
}

export function categoryCreatedPhrase(
  name: string,
  placement: CategoryPlacement,
): string {
  return `Kategorie ${name} neu angelegt, Position ${placement.position}.`
}

export function withCreatedCategoryPhrase(
  announcement: string,
  created: PlacedItemCategory | null,
): string {
  if (created === null) return announcement
  return `${announcement} ${categoryCreatedPhrase(created.category.name, created.placement)}`
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

export function knownUnitsHeading(knownUnitCount: number): string {
  return knownUnitCount === 0
    ? 'Einheiten, keine'
    : `Einheiten, ${knownUnitCount}`
}

export function knownUnitCreatedAnnouncement(name: string): string {
  return `${name} angelegt.`
}

export function knownUnitSavedAnnouncement(name: string): string {
  return `${name} gespeichert.`
}

function remainingKnownUnitPhrase(remainingKnownUnits: number): string {
  if (remainingKnownUnits === 0) return 'keine Einheiten mehr'
  return remainingKnownUnits === 1
    ? 'noch 1 Einheit'
    : `noch ${remainingKnownUnits} Einheiten`
}

export function knownUnitDeletedAnnouncement(
  name: string,
  remainingKnownUnits: number,
): string {
  return `${name} gelöscht, ${remainingKnownUnitPhrase(remainingKnownUnits)}.`
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

export function removeItemHeading(item: ShoppingItem): string {
  return `${item.name} entfernen?`
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

export function itemCategoriesHeading(categoryCount: number): string {
  return categoryCount === 0
    ? 'Artikelkategorien, keine'
    : `Artikelkategorien, ${categoryCount}`
}

export function itemCategoryRowLabel(
  category: ItemCategory,
  placement: CategoryPlacement,
  assignedCount: number,
): string {
  return `${placement.position}. ${category.name}, ${assignedCount} Artikel`
}

export function itemCategoryPositionText(placement: CategoryPlacement): string {
  return `${placement.position} von ${placement.count}`
}

export function itemCategoryCreatedAnnouncement(
  name: string,
  placement: CategoryPlacement,
): string {
  return `${name} angelegt, Position ${itemCategoryPositionText(placement)}.`
}

export function itemCategorySavedAnnouncement(
  name: string,
  placement: CategoryPlacement,
): string {
  return `${name} gespeichert, Position ${itemCategoryPositionText(placement)}.`
}

export function itemCategoryDeletionNote(assignedCount: number): string {
  if (assignedCount === 0)
    return 'Kein Artikel ist dieser Kategorie zugeordnet.'
  return assignedCount === 1
    ? '1 Artikel hat dann keine Kategorie mehr.'
    : `${assignedCount} Artikel haben dann keine Kategorie mehr.`
}

function remainingItemCategoryPhrase(remainingCategories: number): string {
  if (remainingCategories === 0) return 'keine Kategorien mehr'
  return remainingCategories === 1
    ? 'noch 1 Kategorie'
    : `noch ${remainingCategories} Kategorien`
}

export function itemCategoryDeletedAnnouncement(
  name: string,
  remainingCategories: number,
): string {
  return `${name} gelöscht, ${remainingItemCategoryPhrase(remainingCategories)}.`
}

export function deleteItemCategoryHeading(name: string): string {
  return `${name} löschen?`
}

export function chooseCategoryHeading(name: string): string {
  return `Kategorie für ${name}`
}

export function chooseCategoryQuestion(name: string): string {
  return `${name} ist neu. In welche Kategorie?`
}

export function withAssignedCategoryPhrase(
  announcement: string,
  assignment: CategoryAssignment,
): string {
  if (assignment.created !== null)
    return withCreatedCategoryPhrase(announcement, assignment.created)
  const category = findItemCategory(assignment.catalog, assignment.categoryId)
  return category === null
    ? announcement
    : `${announcement} Kategorie ${category.name}.`
}
