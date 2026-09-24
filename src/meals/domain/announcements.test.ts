import { describe, expect, it } from 'vitest'
import { InvalidQuantity } from '../../shared/domain/quantity'
import {
  categoryAddedAnnouncement,
  categoryRemovedAnnouncement,
  invalidMealMessage,
  hidingLabel,
  mealFailureMessage,
  mealHidingAnnouncement,
  mealNameLabel,
  mealItemAddedAnnouncement,
  mealCategoriesHeading,
  mealItemsHeading,
  mealDeletedAnnouncement,
  mealItemRemovedAnnouncement,
  mealSavedAnnouncement,
  mealsHeading,
  dayPlannedAnnouncement,
  mealSuggestionsLabel,
  mealWithoutItemsAnnouncement,
  lessSupplyLabel,
  moreSupplyLabel,
  randomMealLabel,
  replacedKindAnnouncement,
  suppliesHeading,
  supplyAddedAnnouncement,
  supplyChangedAnnouncement,
  supplyRemovedAnnouncement,
  weekdayAbbreviation,
  weekdayFieldLabel,
  weekdayName,
  weekPlanHeading,
  weekPlanShuffledAnnouncement,
  weekPlanTransferAnnouncement,
} from './announcements'
import { InvalidMeal, type MealItem, type NewMeal } from './meal'
import { CategoryAlreadyTaken } from './mealCategory'
import { InvalidSupply, type InvalidSupplyReason } from './supply'
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
  categories: [],
  hidden: false,
  kind: 'mainMeal',
}

describe('mealsHeading', () => {
  it('says that no meal is known yet', () => {
    expect(mealsHeading(0)).toBe('Gerichte, keine')
  })

  it('counts the known meals', () => {
    expect(mealsHeading(2)).toBe('Gerichte, 2')
  })
})

describe('mealCategoriesHeading', () => {
  it('says that the meal carries no category yet', () => {
    expect(mealCategoriesHeading(0)).toBe('Kategorien, keine')
  })

  it('counts the categories of the meal', () => {
    expect(mealCategoriesHeading(2)).toBe('Kategorien, 2')
  })
})

describe('categoryAddedAnnouncement', () => {
  it('names the category that was taken over', () => {
    expect(categoryAddedAnnouncement('Nudelgericht')).toBe(
      'Nudelgericht als Kategorie übernommen.',
    )
  })
})

describe('categoryRemovedAnnouncement', () => {
  it('says that no category is left', () => {
    expect(categoryRemovedAnnouncement('Nudelgericht', 0)).toBe(
      'Nudelgericht entfernt, keine Kategorien mehr.',
    )
  })

  it('counts a single remaining category', () => {
    expect(categoryRemovedAnnouncement('Nudelgericht', 1)).toBe(
      'Nudelgericht entfernt, noch 1 Kategorie.',
    )
  })

  it('counts the remaining categories', () => {
    expect(categoryRemovedAnnouncement('Nudelgericht', 3)).toBe(
      'Nudelgericht entfernt, noch 3 Kategorien.',
    )
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

  it('names the category the meal already carries', () => {
    expect(mealFailureMessage(new CategoryAlreadyTaken('Nudelgericht'))).toBe(
      'Nudelgericht ist schon eingetragen.',
    )
  })

  it('resolves every way a supply can be invalid', () => {
    const reasons: readonly InvalidSupplyReason[] = [
      'mealUnknown',
      'countNotANumber',
      'countNotWhole',
      'countNotPositive',
      'countTooLarge',
    ]

    reasons.forEach((reason) => {
      expect(mealFailureMessage(new InvalidSupply(reason))).not.toBe('')
      expect(mealFailureMessage(new InvalidSupply(reason))).not.toBeNull()
    })
  })

  it('names the meal that is unknown to the supplies', () => {
    expect(mealFailureMessage(new InvalidSupply('mealUnknown'))).toBe(
      'Dieses Gericht gibt es nicht.',
    )
  })

  it('reports a count between two whole numbers', () => {
    expect(mealFailureMessage(new InvalidSupply('countNotWhole'))).toBe(
      'Die Anzahl muss eine ganze Zahl sein.',
    )
  })

  it('reports a count that is too large', () => {
    expect(mealFailureMessage(new InvalidSupply('countTooLarge'))).toBe(
      'Die Anzahl ist zu groß.',
    )
  })

  it('leaves anything else to the caller', () => {
    expect(mealFailureMessage(new Error('etwas anderes'))).toBeNull()
  })
})

describe('suppliesHeading', () => {
  it('says that nothing is kept in store yet', () => {
    expect(suppliesHeading(0)).toBe('Vorräte, keine')
  })

  it('counts the supplies', () => {
    expect(suppliesHeading(3)).toBe('Vorräte, 3')
  })
})

describe('supplyAddedAnnouncement', () => {
  it('names the count of a supply that was not kept before', () => {
    expect(supplyAddedAnnouncement(bolognese, 2, 2)).toBe(
      'Spaghetti Bolognese, 2.',
    )
  })

  it('names the growth and the new total of a supply that was kept', () => {
    expect(supplyAddedAnnouncement(bolognese, 2, 5)).toBe(
      'Spaghetti Bolognese, 2 dazu, jetzt 5.',
    )
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

describe('replacedKindAnnouncement', () => {
  it('names the main meal mark that a breakfast took away', () => {
    expect(replacedKindAnnouncement('mainMeal', 'breakfast')).toBe(
      'Hauptgericht abgewählt.',
    )
  })

  it('names the breakfast mark that a main meal took away', () => {
    expect(replacedKindAnnouncement('breakfast', 'mainMeal')).toBe(
      'Frühstück abgewählt.',
    )
  })

  it('says nothing when a mark is only taken away', () => {
    expect(replacedKindAnnouncement('mainMeal', 'none')).toBeNull()
    expect(replacedKindAnnouncement('breakfast', 'none')).toBeNull()
  })

  it('says nothing when a meal had no mark before', () => {
    expect(replacedKindAnnouncement('none', 'mainMeal')).toBeNull()
    expect(replacedKindAnnouncement('none', 'breakfast')).toBeNull()
  })

  it('says nothing when the kind stayed the same', () => {
    expect(replacedKindAnnouncement('mainMeal', 'mainMeal')).toBeNull()
    expect(replacedKindAnnouncement('breakfast', 'breakfast')).toBeNull()
    expect(replacedKindAnnouncement('none', 'none')).toBeNull()
  })
})

describe('hidingLabel', () => {
  it('offers to hide a meal that is visible', () => {
    expect(hidingLabel(false)).toBe('Ausblenden')
  })

  it('offers to show a meal that is hidden', () => {
    expect(hidingLabel(true)).toBe('Einblenden')
  })
})

describe('mealNameLabel', () => {
  it('names a visible meal by its name alone', () => {
    expect(mealNameLabel(bolognese)).toBe('Spaghetti Bolognese')
  })

  it('tells that a hidden meal is hidden', () => {
    expect(mealNameLabel({ ...bolognese, hidden: true })).toBe(
      'Spaghetti Bolognese, ausgeblendet',
    )
  })
})

describe('mealHidingAnnouncement', () => {
  it('confirms that the meal was hidden', () => {
    expect(mealHidingAnnouncement(bolognese, true)).toBe(
      'Spaghetti Bolognese ausgeblendet.',
    )
  })

  it('confirms that the meal was shown again', () => {
    expect(mealHidingAnnouncement(bolognese, false)).toBe(
      'Spaghetti Bolognese eingeblendet.',
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

describe('weekdayFieldLabel', () => {
  it('names the weekday of a day without a supply', () => {
    expect(weekdayFieldLabel('monday', false)).toBe('Montag')
  })

  it('adds the supply to the weekday of a covered day', () => {
    expect(weekdayFieldLabel('monday', true)).toBe('Montag, im Vorrat')
  })
})

describe('dayPlannedAnnouncement', () => {
  it('says which meal landed on which day', () => {
    expect(dayPlannedAnnouncement('monday', bolognese, false)).toBe(
      'Montag, Spaghetti Bolognese.',
    )
  })

  it('says that the meal of the day is kept in store', () => {
    expect(dayPlannedAnnouncement('monday', bolognese, true)).toBe(
      'Montag, Spaghetti Bolognese, im Vorrat.',
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

describe('weekPlanTransferAnnouncement', () => {
  const soup: NewMeal = {
    name: 'Suppe',
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'mainMeal',
  }

  it('puts the week plan in front of what was added', () => {
    expect(
      weekPlanTransferAnnouncement(
        '14 Artikel hinzugefügt. 3 zusammengefasst.',
        [],
        0,
      ),
    ).toBe('Wochenplan, 14 Artikel hinzugefügt. 3 zusammengefasst.')
  })

  it('names a planned meal that carries no item', () => {
    expect(
      weekPlanTransferAnnouncement('6 Artikel hinzugefügt.', [soup], 0),
    ).toBe('Wochenplan, 6 Artikel hinzugefügt. Suppe hat keine Einkaufs-Items.')
  })

  it('says only what is missing when nothing was added', () => {
    expect(weekPlanTransferAnnouncement('', [soup], 0)).toBe(
      'Suppe hat keine Einkaufs-Items.',
    )
  })

  it('counts the days that the supply covered', () => {
    expect(weekPlanTransferAnnouncement('6 Artikel hinzugefügt.', [], 3)).toBe(
      'Wochenplan, 6 Artikel hinzugefügt. 3 Tage aus dem Vorrat entnommen.',
    )
  })

  it('speaks of a single covered day in the singular', () => {
    expect(weekPlanTransferAnnouncement('6 Artikel hinzugefügt.', [], 1)).toBe(
      'Wochenplan, 6 Artikel hinzugefügt. 1 Tag aus dem Vorrat entnommen.',
    )
  })

  it('says that the whole week came out of the supply', () => {
    expect(weekPlanTransferAnnouncement('', [], 4)).toBe(
      'Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.',
    )
  })

  it('names the week plan first when only a hint is left', () => {
    expect(weekPlanTransferAnnouncement('', [soup], 2)).toBe(
      'Wochenplan, nichts hinzugefügt. 2 Tage aus dem Vorrat entnommen. Suppe hat keine Einkaufs-Items.',
    )
  })
})

describe('supplyChangedAnnouncement', () => {
  it('names the meal and its new count', () => {
    expect(supplyChangedAnnouncement(bolognese, 5)).toBe(
      'Spaghetti Bolognese, 5.',
    )
  })
})

describe('supplyRemovedAnnouncement', () => {
  it('counts the supplies that are left', () => {
    expect(supplyRemovedAnnouncement(bolognese, 2)).toBe(
      'Spaghetti Bolognese entfernt, noch 2 Vorräte.',
    )
  })

  it('speaks of a single supply in the singular', () => {
    expect(supplyRemovedAnnouncement(bolognese, 1)).toBe(
      'Spaghetti Bolognese entfernt, noch 1 Vorrat.',
    )
  })

  it('says that no supply is left', () => {
    expect(supplyRemovedAnnouncement(bolognese, 0)).toBe(
      'Spaghetti Bolognese entfernt, keine Vorräte mehr.',
    )
  })
})

describe('lessSupplyLabel', () => {
  it('names the meal the button counts down', () => {
    expect(lessSupplyLabel(bolognese)).toBe('Weniger, Spaghetti Bolognese')
  })
})

describe('moreSupplyLabel', () => {
  it('names the meal the button counts up', () => {
    expect(moreSupplyLabel(bolognese)).toBe('Mehr, Spaghetti Bolognese')
  })
})

describe('mealSuggestionsLabel', () => {
  it('names the day the suggestions belong to', () => {
    expect(mealSuggestionsLabel('monday')).toBe('Vorschläge für Montag')
  })
})
