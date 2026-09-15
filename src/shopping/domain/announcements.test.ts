import { describe, expect, it } from 'vitest'
import {
  additionAnnouncement,
  checkOffAnnouncement,
  cleanUpAnnouncement,
  cleanUpLabel,
  invalidShoppingItemMessage,
  listHeading,
  reopenAnnouncement,
} from './announcements'
import type { ShoppingItem } from './shoppingItem'

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
  it('confirms the item with its quantity', () => {
    expect(additionAnnouncement(added, null)).toBe('Milch, 2 l hinzugefügt.')
  })

  it('warns that the same name is already on the list', () => {
    expect(additionAnnouncement(added, openItem('Milch'))).toBe(
      'Milch, 2 l hinzugefügt. Achtung, Milch steht bereits offen auf der Liste.',
    )
  })
})

describe('invalidShoppingItemMessage', () => {
  it('asks for a name', () => {
    expect(invalidShoppingItemMessage('nameMissing')).toBe(
      'Bitte einen Namen eingeben.',
    )
  })

  it('explains a missing amount next to a unit', () => {
    expect(invalidShoppingItemMessage('unitWithoutAmount')).toBe(
      'Zur Einheit fehlt die Menge.',
    )
  })

  it('explains an amount that is not a number', () => {
    expect(invalidShoppingItemMessage('amountNotANumber')).toBe(
      'Die Menge muss eine Zahl sein.',
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
