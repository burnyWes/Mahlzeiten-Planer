import { describe, expect, it } from 'vitest'
import { InvalidQuantity } from '../../shared/domain/quantity'
import type { AdditionOutcome } from './addition'
import {
  additionAnnouncement,
  additionFailureMessage,
  additionsAnnouncement,
  checkOffAnnouncement,
  cleanUpAnnouncement,
  categoryCreatedPhrase,
  chooseCategoryHeading,
  chooseCategoryQuestion,
  withAssignedCategoryPhrase,
  withCreatedCategoryPhrase,
  cleanUpLabel,
  deleteItemCategoryHeading,
  invalidShoppingItemMessage,
  itemCategoriesHeading,
  itemCategoryCreatedAnnouncement,
  itemCategoryDeletedAnnouncement,
  itemCategoryDeletionNote,
  itemCategoryPositionText,
  itemCategoryRowLabel,
  itemCategorySavedAnnouncement,
  knownItemCreatedAnnouncement,
  knownItemDeletedAnnouncement,
  knownItemFormHeading,
  knownItemRowLabel,
  knownItemSavedAnnouncement,
  itemRemovedAnnouncement,
  knownItemsHeading,
  knownUnitCreatedAnnouncement,
  knownUnitDeletedAnnouncement,
  knownUnitSavedAnnouncement,
  knownUnitsHeading,
  lessItemLabel,
  listHeading,
  listSectionHeading,
  moreItemLabel,
  quantityChangedAnnouncement,
  removeItemHeading,
  reopenAnnouncement,
} from './announcements'
import { ItemCategoryAlreadyTaken, ItemCategoryMissing } from './itemCategory'
import { KnownItemAlreadyTaken } from './knownItem'
import { KnownUnitAlreadyTaken } from './knownUnit'
import { InvalidShoppingItem, type ShoppingItem } from './shoppingItem'

const added = {
  name: 'Milch',
  quantity: { amount: 2, unit: 'l' },
  createdAt: 1,
}

function openItem(name: string): ShoppingItem {
  return {
    id: name,
    name,
    quantity: null,
    createdAt: 1,
    checkedOffAt: null,
  }
}

describe('additionAnnouncement', () => {
  it('confirms a new item with its quantity', () => {
    const outcome: AdditionOutcome = { kind: 'newItem', item: added }

    expect(additionAnnouncement(outcome)).toBe('Milch, 2 l hinzugefügt.')
  })

  it('names the quantity the merged entry now holds', () => {
    const outcome: AdditionOutcome = {
      kind: 'mergedInto',
      item: { ...added, quantity: { amount: 1, unit: 'l' } },
      into: openItem('Milch'),
      quantity: { amount: 3, unit: 'l' },
    }

    expect(additionAnnouncement(outcome)).toBe(
      'Milch, 1 l hinzugefügt. Stand bereits offen, jetzt 3 l.',
    )
  })

  it('warns when another unit put the item beside the open one', () => {
    const outcome: AdditionOutcome = {
      kind: 'besideDifferentUnit',
      item: added,
      open: openItem('Milch'),
    }

    expect(additionAnnouncement(outcome)).toBe(
      'Milch, 2 l hinzugefügt. Achtung, Milch steht bereits offen auf der Liste.',
    )
  })
})

describe('additionFailureMessage', () => {
  it('explains a refused item', () => {
    expect(additionFailureMessage(new InvalidShoppingItem('nameMissing'))).toBe(
      'Bitte einen Namen eingeben.',
    )
  })

  it('explains a refused quantity', () => {
    expect(
      additionFailureMessage(new InvalidQuantity('unitWithoutAmount')),
    ).toBe('Zur Einheit fehlt die Menge.')
  })

  it('names an item category that is already taken', () => {
    expect(
      additionFailureMessage(new ItemCategoryAlreadyTaken('Tiefkühlkost')),
    ).toBe('Die Kategorie Tiefkühlkost gibt es schon.')
  })

  it('names a known item that is already taken', () => {
    expect(additionFailureMessage(new KnownItemAlreadyTaken('Äpfel'))).toBe(
      'Den Artikel Äpfel gibt es schon.',
    )
  })

  it('asks for a category or the way without one', () => {
    expect(additionFailureMessage(new ItemCategoryMissing())).toBe(
      'Bitte eine Kategorie eingeben oder ohne Kategorie hinzufügen.',
    )
  })

  it('names a unit that is already taken', () => {
    expect(additionFailureMessage(new KnownUnitAlreadyTaken('g'))).toBe(
      'Die Einheit g gibt es schon.',
    )
  })

  it('keeps quiet about anything else', () => {
    expect(additionFailureMessage(new Error('boom'))).toBeNull()
  })
})

describe('invalidShoppingItemMessage', () => {
  it('asks for a name', () => {
    expect(invalidShoppingItemMessage('nameMissing')).toBe(
      'Bitte einen Namen eingeben.',
    )
  })

  it('explains a name that is too long', () => {
    expect(invalidShoppingItemMessage('nameTooLong')).toBe(
      'Der Name ist zu lang.',
    )
  })
})

describe('listHeading', () => {
  it('speaks the number of open items', () => {
    expect(listHeading(3)).toBe('Einkaufsliste, 3 offen')
  })

  it('speaks a single open item', () => {
    expect(listHeading(1)).toBe('Einkaufsliste, 1 offen')
  })

  it('says that nothing is open', () => {
    expect(listHeading(0)).toBe('Einkaufsliste, nichts offen')
  })
})

describe('knownItemsHeading', () => {
  it('counts the entries of the catalog', () => {
    expect(knownItemsHeading(42)).toBe('Artikel, 42')
  })

  it('says that the catalog is empty', () => {
    expect(knownItemsHeading(0)).toBe('Artikel, keine')
  })
})

describe('knownItemDeletedAnnouncement', () => {
  it('names the entry and how many suggestions are left', () => {
    expect(knownItemDeletedAnnouncement('hackfleisch', 5)).toBe(
      'hackfleisch gelöscht, noch 5 Vorschläge.',
    )
  })

  it('speaks of a single remaining suggestion', () => {
    expect(knownItemDeletedAnnouncement('Brot', 1)).toBe(
      'Brot gelöscht, noch 1 Vorschlag.',
    )
  })

  it('says when no suggestion is left', () => {
    expect(knownItemDeletedAnnouncement('Brot', 0)).toBe(
      'Brot gelöscht, keine Vorschläge mehr.',
    )
  })
})

describe('knownItemSavedAnnouncement', () => {
  it('confirms the saved name', () => {
    expect(knownItemSavedAnnouncement('Hackfleisch')).toBe(
      'Hackfleisch gespeichert.',
    )
  })
})

describe('knownUnitsHeading', () => {
  it('counts the units of the catalog', () => {
    expect(knownUnitsHeading(7)).toBe('Einheiten, 7')
  })

  it('says that the catalog is empty', () => {
    expect(knownUnitsHeading(0)).toBe('Einheiten, keine')
  })
})

describe('knownUnitDeletedAnnouncement', () => {
  it('names the unit and how many units are left', () => {
    expect(knownUnitDeletedAnnouncement('g', 3)).toBe(
      'g gelöscht, noch 3 Einheiten.',
    )
  })

  it('speaks of a single remaining unit', () => {
    expect(knownUnitDeletedAnnouncement('g', 1)).toBe(
      'g gelöscht, noch 1 Einheit.',
    )
  })

  it('says when no unit is left', () => {
    expect(knownUnitDeletedAnnouncement('g', 0)).toBe(
      'g gelöscht, keine Einheiten mehr.',
    )
  })
})

describe('knownUnitSavedAnnouncement', () => {
  it('confirms the saved unit', () => {
    expect(knownUnitSavedAnnouncement('Zehe')).toBe('Zehe gespeichert.')
  })
})

describe('checkOffAnnouncement', () => {
  it('names the item and how many are left open', () => {
    expect(checkOffAnnouncement(openItem('Milch'), 2)).toBe(
      'Milch abgehakt, noch 2 offen',
    )
  })

  it('says when nothing is left open', () => {
    expect(checkOffAnnouncement(openItem('Milch'), 0)).toBe(
      'Milch abgehakt, nichts mehr offen',
    )
  })
})

describe('reopenAnnouncement', () => {
  it('names the item that is open again', () => {
    expect(reopenAnnouncement(openItem('Milch'), 3)).toBe(
      'Milch wieder offen, 3 offen',
    )
  })
})

describe('cleanUpLabel', () => {
  it('names a single pending change', () => {
    expect(cleanUpLabel(1)).toBe('Aufräumen, 1 Änderung')
  })

  it('names several pending changes', () => {
    expect(cleanUpLabel(4)).toBe('Aufräumen, 4 Änderungen')
  })
})

describe('cleanUpAnnouncement', () => {
  it('reports the list after cleaning up', () => {
    expect(cleanUpAnnouncement(3)).toBe('Aufgeräumt, 3 offen')
  })

  it('reports an empty list', () => {
    expect(cleanUpAnnouncement(0)).toBe('Aufgeräumt, die Liste ist leer')
  })
})

describe('additionsAnnouncement', () => {
  it('counts what a transfer brought to the list', () => {
    expect(
      additionsAnnouncement({ added: 3, merged: 0, differentUnit: [] }),
    ).toBe('3 Artikel hinzugefügt.')
  })

  it('names how many of them went into an entry that was already open', () => {
    expect(
      additionsAnnouncement({ added: 3, merged: 1, differentUnit: [] }),
    ).toBe('3 Artikel hinzugefügt. 1 zusammengefasst.')
  })

  it('warns about every article that met another unit', () => {
    expect(
      additionsAnnouncement({
        added: 2,
        merged: 0,
        differentUnit: ['Milch', 'Mehl'],
      }),
    ).toBe(
      '2 Artikel hinzugefügt. Achtung, Milch steht mit anderer Einheit bereits offen. ' +
        'Achtung, Mehl steht mit anderer Einheit bereits offen.',
    )
  })
})

describe('the quantity stepper', () => {
  it('names the stepper buttons after the item', () => {
    expect(lessItemLabel(openItem('Mehl'))).toBe('Weniger, Mehl')
    expect(moreItemLabel(openItem('Mehl'))).toBe('Mehr, Mehl')
  })

  it('announces the changed quantity with its unit', () => {
    expect(
      quantityChangedAnnouncement({
        ...openItem('Mehl'),
        quantity: { amount: 501, unit: 'g' },
      }),
    ).toBe('Mehl, 501 g.')
  })

  it('announces the changed quantity without unit', () => {
    expect(
      quantityChangedAnnouncement({
        ...openItem('Brot'),
        quantity: { amount: 2, unit: null },
      }),
    ).toBe('Brot, 2.')
  })
})

describe('listSectionHeading', () => {
  it('names the category of the section', () => {
    expect(listSectionHeading({ id: 'k1', name: 'Obst/Gemüse' })).toBe(
      'Obst/Gemüse',
    )
  })

  it('names the section without a category', () => {
    expect(listSectionHeading(null)).toBe('Ohne Kategorie')
  })
})

describe('removeItemHeading', () => {
  it('asks whether the item should be removed', () => {
    expect(removeItemHeading(openItem('Brot'))).toBe('Brot entfernen?')
  })
})

describe('itemRemovedAnnouncement', () => {
  it('names the removed item and what is still open', () => {
    expect(itemRemovedAnnouncement(openItem('Milch'), 3)).toBe(
      'Milch entfernt, noch 3 offen.',
    )
  })

  it('says that nothing is open any more', () => {
    expect(itemRemovedAnnouncement(openItem('Milch'), 0)).toBe(
      'Milch entfernt, nichts mehr offen.',
    )
  })
})

describe('itemCategoriesHeading', () => {
  it('speaks the number of categories', () => {
    expect(itemCategoriesHeading(4)).toBe('Artikelkategorien, 4')
  })

  it('says that there are no categories', () => {
    expect(itemCategoriesHeading(0)).toBe('Artikelkategorien, keine')
  })
})

describe('itemCategoryRowLabel', () => {
  const fruit = { id: 'k1', name: 'Obst/Gemüse' }

  it('names position, category and the number of items', () => {
    expect(itemCategoryRowLabel(fruit, { position: 1, count: 4 }, 12)).toBe(
      '1. Obst/Gemüse, 12 Artikel',
    )
  })

  it('speaks a single item', () => {
    expect(itemCategoryRowLabel(fruit, { position: 1, count: 4 }, 1)).toBe(
      '1. Obst/Gemüse, 1 Artikel',
    )
  })
})

describe('itemCategoryPositionText', () => {
  it('names the position among all categories', () => {
    expect(itemCategoryPositionText({ position: 2, count: 4 })).toBe('2 von 4')
  })
})

describe('itemCategoryCreatedAnnouncement', () => {
  it('names the category and its position', () => {
    expect(
      itemCategoryCreatedAnnouncement('Drogerie', { position: 5, count: 5 }),
    ).toBe('Drogerie angelegt, Position 5 von 5.')
  })
})

describe('itemCategorySavedAnnouncement', () => {
  it('names the category and its position', () => {
    expect(
      itemCategorySavedAnnouncement('Backwaren', { position: 2, count: 4 }),
    ).toBe('Backwaren gespeichert, Position 2 von 4.')
  })
})

describe('itemCategoryDeletionNote', () => {
  it('counts the items losing their category', () => {
    expect(itemCategoryDeletionNote(7)).toBe(
      '7 Artikel haben dann keine Kategorie mehr.',
    )
  })

  it('speaks a single item', () => {
    expect(itemCategoryDeletionNote(1)).toBe(
      '1 Artikel hat dann keine Kategorie mehr.',
    )
  })

  it('says that no item belongs to the category', () => {
    expect(itemCategoryDeletionNote(0)).toBe(
      'Kein Artikel ist dieser Kategorie zugeordnet.',
    )
  })
})

describe('itemCategoryDeletedAnnouncement', () => {
  it('names the remaining categories', () => {
    expect(itemCategoryDeletedAnnouncement('Tiefkühlkost', 3)).toBe(
      'Tiefkühlkost gelöscht, noch 3 Kategorien.',
    )
  })

  it('speaks a single remaining category', () => {
    expect(itemCategoryDeletedAnnouncement('Tiefkühlkost', 1)).toBe(
      'Tiefkühlkost gelöscht, noch 1 Kategorie.',
    )
  })

  it('says that no category is left', () => {
    expect(itemCategoryDeletedAnnouncement('Tiefkühlkost', 0)).toBe(
      'Tiefkühlkost gelöscht, keine Kategorien mehr.',
    )
  })
})

describe('deleteItemCategoryHeading', () => {
  it('asks whether the category should be deleted', () => {
    expect(deleteItemCategoryHeading('Tiefkühlkost')).toBe(
      'Tiefkühlkost löschen?',
    )
  })
})

describe('knownItemRowLabel', () => {
  const apples = {
    name: 'Äpfel',
    lastUsedAt: 1,
    timesUsed: 1,
    categoryId: 'k1',
  }

  it('names the item with its category', () => {
    expect(knownItemRowLabel(apples, { id: 'k1', name: 'Obst/Gemüse' })).toBe(
      'Äpfel (Obst/Gemüse)',
    )
  })

  it('names only the item without a category', () => {
    expect(knownItemRowLabel(apples, null)).toBe('Äpfel')
  })
})

describe('knownItemFormHeading', () => {
  it('names creating and editing an item', () => {
    expect(knownItemFormHeading('create')).toBe('Artikel anlegen')
    expect(knownItemFormHeading('edit')).toBe('Artikel bearbeiten')
  })
})

describe('knownItemCreatedAnnouncement', () => {
  it('confirms the created item', () => {
    expect(knownItemCreatedAnnouncement('Äpfel')).toBe('Äpfel angelegt.')
  })
})

describe('categoryCreatedPhrase', () => {
  it('names the new category and its position', () => {
    expect(categoryCreatedPhrase('Drogerie', { position: 5, count: 5 })).toBe(
      'Kategorie Drogerie neu angelegt, Position 5.',
    )
  })
})

describe('withCreatedCategoryPhrase', () => {
  it('adds the newly created category', () => {
    expect(
      withCreatedCategoryPhrase('Äpfel gespeichert.', {
        category: { id: 'k5', name: 'Drogerie' },
        placement: { position: 5, count: 5 },
      }),
    ).toBe('Äpfel gespeichert. Kategorie Drogerie neu angelegt, Position 5.')
  })

  it('keeps the announcement without a new category', () => {
    expect(withCreatedCategoryPhrase('Äpfel gespeichert.', null)).toBe(
      'Äpfel gespeichert.',
    )
  })
})

describe('chooseCategoryHeading', () => {
  it('names the new item', () => {
    expect(chooseCategoryHeading('Bananen')).toBe('Kategorie für Bananen')
  })
})

describe('chooseCategoryQuestion', () => {
  it('asks for the category of the new item', () => {
    expect(chooseCategoryQuestion('Bananen')).toBe(
      'Bananen ist neu. In welche Kategorie?',
    )
  })
})

describe('withAssignedCategoryPhrase', () => {
  const catalog = {
    categories: [{ id: 'k1', name: 'Obst/Gemüse' }],
    sortByCategory: true,
  }

  it('names the assigned category', () => {
    expect(
      withAssignedCategoryPhrase('Bananen hinzugefügt.', {
        catalog,
        categoryId: 'k1',
        created: null,
      }),
    ).toBe('Bananen hinzugefügt. Kategorie Obst/Gemüse.')
  })

  it('names a newly created category with its position', () => {
    expect(
      withAssignedCategoryPhrase('Seife hinzugefügt.', {
        catalog,
        categoryId: 'k5',
        created: {
          category: { id: 'k5', name: 'Drogerie' },
          placement: { position: 5, count: 5 },
        },
      }),
    ).toBe('Seife hinzugefügt. Kategorie Drogerie neu angelegt, Position 5.')
  })

  it('keeps the announcement without a category', () => {
    expect(
      withAssignedCategoryPhrase('Seife hinzugefügt.', {
        catalog,
        categoryId: null,
        created: null,
      }),
    ).toBe('Seife hinzugefügt.')
  })
})

describe('knownUnitCreatedAnnouncement', () => {
  it('confirms the created unit', () => {
    expect(knownUnitCreatedAnnouncement('Dose')).toBe('Dose angelegt.')
  })
})
