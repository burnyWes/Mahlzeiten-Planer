import { describe, expect, it } from 'vitest'
import { InvalidQuantity } from '../../shared/domain/quantity'
import type { AdditionOutcome } from './addition'
import {
  additionAnnouncement,
  additionFailureMessage,
  checkOffAnnouncement,
  cleanUpAnnouncement,
  cleanUpLabel,
  invalidShoppingItemMessage,
  listHeading,
  reopenAnnouncement,
} from './announcements'
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
