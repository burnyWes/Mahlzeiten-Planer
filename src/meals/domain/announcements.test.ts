import { describe, expect, it } from 'vitest'
import { InvalidQuantity } from '../../shared/domain/quantity'
import {
  invalidMealMessage,
  mealFailureMessage,
  mealItemAddedAnnouncement,
  mealItemsHeading,
  mealDeletedAnnouncement,
  mealItemRemovedAnnouncement,
  mealSavedAnnouncement,
  mealsHeading,
  dayPlannedAnnouncement,
  mealWithoutItemsAnnouncement,
  randomMealLabel,
  weekdayAbbreviation,
  weekdayName,
  weekPlanHeading,
  weekPlanShuffledAnnouncement,
} from './announcements'
import { InvalidMeal, type MealItem, type NewMeal } from './meal'
import { WEEKDAYS } from './weekPlan'

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

describe('mealDeletedAnnouncement', () => {
  it('counts the meals that are left', () => {
    expect(mealDeletedAnnouncement(bolognese, 2)).toBe(
      'Spaghetti Bolognese gelöscht, noch 2 Gerichte.',
    )
  })

  it('speaks of a single meal in the singular', () => {
    expect(mealDeletedAnnouncement(bolognese, 1)).toBe(
      'Spaghetti Bolognese gelöscht, noch 1 Gericht.',
    )
  })

  it('says that no meal is left', () => {
    expect(mealDeletedAnnouncement(bolognese, 0)).toBe(
      'Spaghetti Bolognese gelöscht, keine Gerichte mehr.',
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

describe('weekdayName', () => {
  it('names every weekday in full', () => {
    expect(WEEKDAYS.map(weekdayName)).toEqual([
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
      'Sonntag',
    ])
  })
})

describe('weekdayAbbreviation', () => {
  it('shortens every weekday to two letters and a dot', () => {
    expect(WEEKDAYS.map(weekdayAbbreviation)).toEqual([
      'Mo.',
      'Di.',
      'Mi.',
      'Do.',
      'Fr.',
      'Sa.',
      'So.',
    ])
  })
})

describe('weekPlanHeading', () => {
  it('says that no day is planned yet', () => {
    expect(weekPlanHeading(0)).toBe('Wochenplan, keine von 7')
  })

  it('counts the days that carry a meal', () => {
    expect(weekPlanHeading(5)).toBe('Wochenplan, 5 von 7')
  })
})

describe('randomMealLabel', () => {
  it('names the day the button rolls for', () => {
    expect(randomMealLabel('monday')).toBe('Zufallsgericht für Montag')
  })
})

describe('dayPlannedAnnouncement', () => {
  it('says which meal landed on which day', () => {
    expect(dayPlannedAnnouncement('monday', bolognese)).toBe(
      'Montag, Spaghetti Bolognese.',
    )
  })
})

describe('weekPlanShuffledAnnouncement', () => {
  it('counts the days that were rolled', () => {
    expect(weekPlanShuffledAnnouncement()).toBe(
      'Wochenplan neu gewürfelt, 7 Gerichte.',
    )
  })
})
