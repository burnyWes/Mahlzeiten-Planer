import { describe, expect, it } from 'vitest'
import { InvalidQuantity } from '../../shared/domain/quantity'
import {
  invalidMealMessage,
  mealFailureMessage,
  mealItemAddedAnnouncement,
  mealItemsHeading,
  mealItemRemovedAnnouncement,
  mealSavedAnnouncement,
  mealsHeading,
  mealWithoutItemsAnnouncement,
} from './announcements'
import { InvalidMeal, type MealItem, type NewMeal } from './meal'

const mincedMeat: MealItem = {
  name: 'Hackfleisch',
  quantity: { amount: 500, unit: 'g' },
}

const bolognese: NewMeal = {
  name: 'Spaghetti Bolognese',
  items: [],
  ingredientNotes: '',
  recipe: '',
}

describe('mealsHeading', () => {
  it('says that no meal is known yet', () => {
    expect(mealsHeading(0)).toBe('Gerichte, keine')
  })

  it('counts the known meals', () => {
    expect(mealsHeading(2)).toBe('Gerichte, 2')
  })
})

describe('mealItemsHeading', () => {
  it('says that the meal carries no item yet', () => {
    expect(mealItemsHeading(0)).toBe('Einkaufs-Items, keine')
  })

  it('counts the items of the meal', () => {
    expect(mealItemsHeading(3)).toBe('Einkaufs-Items, 3')
  })
})

describe('invalidMealMessage', () => {
  it('asks for a name', () => {
    expect(invalidMealMessage('nameMissing')).toBe(
      'Bitte einen Namen eingeben.',
    )
  })

  it('reports a name that is too long', () => {
    expect(invalidMealMessage('nameTooLong')).toBe('Der Name ist zu lang.')
  })

  it('reports a text that is too long', () => {
    expect(invalidMealMessage('textTooLong')).toBe('Der Text ist zu lang.')
  })
})

describe('mealFailureMessage', () => {
  it('resolves an invalid meal', () => {
    expect(mealFailureMessage(new InvalidMeal('nameMissing'))).toBe(
      'Bitte einen Namen eingeben.',
    )
  })

  it('resolves an unreadable quantity', () => {
    expect(mealFailureMessage(new InvalidQuantity('amountNotANumber'))).toBe(
      'Die Menge muss eine Zahl sein.',
    )
  })

  it('leaves anything else to the caller', () => {
    expect(mealFailureMessage(new Error('etwas anderes'))).toBeNull()
  })
})

describe('mealItemAddedAnnouncement', () => {
  it('confirms the item with its quantity', () => {
    expect(mealItemAddedAnnouncement(mincedMeat)).toBe(
      'Hackfleisch, 500 g als Item übernommen.',
    )
  })
})

describe('mealItemRemovedAnnouncement', () => {
  it('counts the items that are left', () => {
    expect(mealItemRemovedAnnouncement(mincedMeat, 2)).toBe(
      'Hackfleisch entfernt, noch 2 Items.',
    )
  })

  it('speaks of a single item in the singular', () => {
    expect(mealItemRemovedAnnouncement(mincedMeat, 1)).toBe(
      'Hackfleisch entfernt, noch 1 Item.',
    )
  })

  it('says that nothing is left', () => {
    expect(mealItemRemovedAnnouncement(mincedMeat, 0)).toBe(
      'Hackfleisch entfernt, keine Items mehr.',
    )
  })
})

describe('mealSavedAnnouncement', () => {
  it('confirms the meal by its name', () => {
    expect(mealSavedAnnouncement(bolognese)).toBe(
      'Spaghetti Bolognese gespeichert.',
    )
  })
})

describe('mealWithoutItemsAnnouncement', () => {
  it('reports that there is nothing to transfer', () => {
    expect(mealWithoutItemsAnnouncement(bolognese)).toBe(
      'Spaghetti Bolognese hat keine Einkaufs-Items.',
    )
  })
})
