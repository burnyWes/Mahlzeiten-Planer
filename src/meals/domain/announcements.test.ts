import { describe, expect, it } from 'vitest'
import { InvalidQuantity } from '../../shared/domain/quantity'
import {
  categoriesManagementHeading,
  categoryAddedAnnouncement,
  categoryDeletedAnnouncement,
  categoryDeletionNote,
  categoryFilterAnnouncement,
  categoryRowLabel,
  categorySavedAnnouncement,
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
  dayShownAnnouncement,
  fixedSlotText,
  filterResetAnnouncement,
  shownMealsCount,
  mealSuggestionsLabel,
  mealTimeFieldLabel,
  mealTimeName,
  mealWithoutItemsAnnouncement,
  lessSupplyLabel,
  moreSupplyLabel,
  planEditableAnnouncement,
  planFixedAnnouncement,
  randomMealLabel,
  replacedKindAnnouncement,
  slotPlannedAnnouncement,
  stageButtonLabel,
  transferButtonLabel,
  suppliesHeading,
  supplyAddedAnnouncement,
  supplyChangedAnnouncement,
  supplyRemovedAnnouncement,
  weekdayAbbreviation,
  weekdayName,
  weekPlanHeading,
  weekPlanShuffledAnnouncement,
  weekPlanTransferAnnouncement,
} from './announcements'
import { InvalidMeal, type MealItem, type NewMeal } from './meal'
import { CategoryAlreadyTaken } from './mealCategory'
import { InvalidSupply, type InvalidSupplyReason } from './supply'
import { MEAL_TIMES, WEEKDAYS } from './weekPlan'
import { EDITING_STAGE, FIXED_STAGE, transferredStage } from './weekPlanStage'

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
    expect(mealsHeading([])).toBe('Gerichte, keine')
  })

  it('counts the known meals', () => {
    expect(mealsHeading([bolognese, bolognese])).toBe('Gerichte, 2')
  })

  it('names the hidden meals in brackets', () => {
    expect(
      mealsHeading([bolognese, { ...bolognese, hidden: true }, bolognese]),
    ).toBe('Gerichte, 3 (1 ausgeblendet)')
  })

  it('counts every meal when all are hidden', () => {
    const hiddenBolognese = { ...bolognese, hidden: true }
    expect(mealsHeading([hiddenBolognese, hiddenBolognese])).toBe(
      'Gerichte, 2 (2 ausgeblendet)',
    )
  })

  it('counts the shown meals out of all meals', () => {
    expect(mealsHeading([bolognese, bolognese], 5)).toBe('Gerichte, 2 von 5')
  })

  it('names the hidden meals among the shown ones', () => {
    const hiddenBolognese = { ...bolognese, hidden: true }
    expect(mealsHeading([bolognese, hiddenBolognese], 5)).toBe(
      'Gerichte, 2 von 5 (1 ausgeblendet)',
    )
  })

  it('says out of how many even when every meal is shown', () => {
    expect(mealsHeading([bolognese, bolognese], 2)).toBe('Gerichte, 2 von 2')
  })
})

describe('shownMealsCount', () => {
  it('counts the meals without a filter', () => {
    expect(shownMealsCount(12, null)).toBe('12')
  })

  it('counts the shown meals out of all meals', () => {
    expect(shownMealsCount(4, 12)).toBe('4 / 12')
  })
})

describe('categoryFilterAnnouncement', () => {
  it('names the category with the shown meals out of all meals', () => {
    expect(categoryFilterAnnouncement('Suppe', 4, 12)).toBe(
      'Suppe, 4 von 12 Gerichten.',
    )
  })

  it('speaks of a single meal', () => {
    expect(categoryFilterAnnouncement('Suppe', 1, 1)).toBe(
      'Suppe, 1 von 1 Gericht.',
    )
  })
})

describe('filterResetAnnouncement', () => {
  it('counts every meal', () => {
    expect(filterResetAnnouncement(12)).toBe(
      'Filter zurückgesetzt, 12 Gerichte.',
    )
  })

  it('speaks of a single meal', () => {
    expect(filterResetAnnouncement(1)).toBe('Filter zurückgesetzt, 1 Gericht.')
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

describe('categoriesManagementHeading', () => {
  it('says that no category is known yet', () => {
    expect(categoriesManagementHeading(0)).toBe('Kategorie-Verwaltung, keine')
  })

  it('counts the known categories', () => {
    expect(categoriesManagementHeading(3)).toBe('Kategorie-Verwaltung, 3')
  })
})

describe('categoryRowLabel', () => {
  it('names the category with the number of its meals', () => {
    expect(categoryRowLabel({ name: 'Nudelgericht', mealCount: 5 })).toBe(
      'Nudelgericht, 5',
    )
  })
})

describe('categoryDeletionNote', () => {
  it('names a single meal', () => {
    expect(categoryDeletionNote(1)).toBe(
      'Die Kategorie wird aus 1 Gericht entfernt. Die Gerichte selbst bleiben erhalten.',
    )
  })

  it('counts the meals', () => {
    expect(categoryDeletionNote(5)).toBe(
      'Die Kategorie wird aus 5 Gerichten entfernt. Die Gerichte selbst bleiben erhalten.',
    )
  })
})

describe('categoryDeletedAnnouncement', () => {
  it('says that no category is left', () => {
    expect(categoryDeletedAnnouncement('Nudelgericht', 0)).toBe(
      'Nudelgericht gelöscht, keine Kategorien mehr.',
    )
  })

  it('counts a single remaining category', () => {
    expect(categoryDeletedAnnouncement('Nudelgericht', 1)).toBe(
      'Nudelgericht gelöscht, noch 1 Kategorie.',
    )
  })

  it('counts the remaining categories', () => {
    expect(categoryDeletedAnnouncement('Nudelgericht', 2)).toBe(
      'Nudelgericht gelöscht, noch 2 Kategorien.',
    )
  })
})

describe('categorySavedAnnouncement', () => {
  it('names the saved category', () => {
    expect(categorySavedAnnouncement('Nudelgericht')).toBe(
      'Nudelgericht gespeichert.',
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

  it('names the main meal mark that a snack took away', () => {
    expect(replacedKindAnnouncement('mainMeal', 'snack')).toBe(
      'Hauptgericht abgewählt.',
    )
  })

  it('names the breakfast mark that a snack took away', () => {
    expect(replacedKindAnnouncement('breakfast', 'snack')).toBe(
      'Frühstück abgewählt.',
    )
  })

  it('names the snack mark that another kind took away', () => {
    expect(replacedKindAnnouncement('snack', 'mainMeal')).toBe(
      'Snack abgewählt.',
    )
    expect(replacedKindAnnouncement('snack', 'breakfast')).toBe(
      'Snack abgewählt.',
    )
  })

  it('says nothing when a mark is only taken away', () => {
    expect(replacedKindAnnouncement('mainMeal', 'none')).toBeNull()
    expect(replacedKindAnnouncement('breakfast', 'none')).toBeNull()
    expect(replacedKindAnnouncement('snack', 'none')).toBeNull()
  })

  it('says nothing when a meal had no mark before', () => {
    expect(replacedKindAnnouncement('none', 'mainMeal')).toBeNull()
    expect(replacedKindAnnouncement('none', 'breakfast')).toBeNull()
    expect(replacedKindAnnouncement('none', 'snack')).toBeNull()
  })

  it('says nothing when the kind stayed the same', () => {
    expect(replacedKindAnnouncement('mainMeal', 'mainMeal')).toBeNull()
    expect(replacedKindAnnouncement('breakfast', 'breakfast')).toBeNull()
    expect(replacedKindAnnouncement('snack', 'snack')).toBeNull()
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

describe('mealTimeName', () => {
  it('names every meal time', () => {
    expect(MEAL_TIMES.map(mealTimeName)).toEqual([
      'Frühstück',
      'Mittagessen',
      'Snack',
      'Abendessen',
    ])
  })
})

describe('dayShownAnnouncement', () => {
  it('names the day that is shown now', () => {
    expect(dayShownAnnouncement('saturday')).toBe('Samstag.')
  })
})

describe('weekPlanHeading', () => {
  it('says that no meal is planned yet', () => {
    expect(weekPlanHeading(0, EDITING_STAGE)).toBe('Wochenplan, keine von 28')
  })

  it('counts the slots that carry a meal', () => {
    expect(weekPlanHeading(12, EDITING_STAGE)).toBe('Wochenplan, 12 von 28')
  })

  it('adds that the plan is fixed', () => {
    expect(weekPlanHeading(12, FIXED_STAGE)).toBe(
      'Wochenplan, 12 von 28, festgelegt',
    )
  })

  it('adds that the fixed plan was transferred', () => {
    expect(
      weekPlanHeading(12, transferredStage([{ day: 'monday', time: 'lunch' }])),
    ).toBe('Wochenplan, 12 von 28, festgelegt, übertragen')
  })

  it('adds that an empty plan is fixed', () => {
    expect(weekPlanHeading(0, FIXED_STAGE)).toBe(
      'Wochenplan, keine von 28, festgelegt',
    )
  })
})

describe('planFixedAnnouncement', () => {
  it('says how many meals are planned', () => {
    expect(planFixedAnnouncement(12)).toBe(
      'Plan festgelegt, 12 von 28 Gerichten geplant.',
    )
  })

  it('says that no meal is planned', () => {
    expect(planFixedAnnouncement(0)).toBe(
      'Plan festgelegt, keine von 28 Gerichten geplant.',
    )
  })
})

describe('planEditableAnnouncement', () => {
  it('says that the plan can be edited again', () => {
    expect(planEditableAnnouncement()).toBe('Plan wieder bearbeitbar.')
  })
})

describe('stageButtonLabel', () => {
  it('offers to fix a plan that is being edited', () => {
    expect(stageButtonLabel(EDITING_STAGE)).toBe('Plan festlegen')
  })

  it('offers to edit a fixed plan', () => {
    expect(stageButtonLabel(FIXED_STAGE)).toBe('Plan bearbeiten')
  })
})

describe('transferButtonLabel', () => {
  it('offers the transfer before it happened', () => {
    expect(transferButtonLabel(FIXED_STAGE)).toBe('Auf die Einkaufsliste')
    expect(transferButtonLabel(EDITING_STAGE)).toBe('Auf die Einkaufsliste')
  })

  it('says that the plan is on the shopping list already', () => {
    expect(transferButtonLabel(transferredStage([]))).toBe(
      'Schon auf der Einkaufsliste',
    )
  })
})

describe('fixedSlotText', () => {
  it('names the meal time, the meal and the supply', () => {
    expect(fixedSlotText('breakfast', bolognese, true)).toBe(
      'Frühstück, Spaghetti Bolognese, im Vorrat',
    )
  })

  it('names the meal time and the meal without a supply', () => {
    expect(fixedSlotText('breakfast', bolognese, false)).toBe(
      'Frühstück, Spaghetti Bolognese',
    )
  })

  it('says that nothing is planned for the meal time', () => {
    expect(fixedSlotText('snack', null, false)).toBe('Snack, nichts geplant')
  })
})

describe('randomMealLabel', () => {
  it('names the meal time the button rolls for', () => {
    expect(randomMealLabel('breakfast')).toBe('Zufallsgericht für Frühstück')
  })
})

describe('mealTimeFieldLabel', () => {
  it('names the meal time of a slot without a supply', () => {
    expect(mealTimeFieldLabel('dinner', false)).toBe('Abendessen')
  })

  it('adds the supply to the meal time of a covered slot', () => {
    expect(mealTimeFieldLabel('dinner', true)).toBe('Abendessen, im Vorrat')
  })
})

describe('slotPlannedAnnouncement', () => {
  it('says which meal landed in which meal time', () => {
    expect(slotPlannedAnnouncement('lunch', bolognese, false)).toBe(
      'Mittagessen, Spaghetti Bolognese.',
    )
  })

  it('says that the meal of the slot is kept in store', () => {
    expect(slotPlannedAnnouncement('lunch', bolognese, true)).toBe(
      'Mittagessen, Spaghetti Bolognese, im Vorrat.',
    )
  })
})

describe('weekPlanShuffledAnnouncement', () => {
  it('counts the slots that were rolled', () => {
    expect(weekPlanShuffledAnnouncement()).toBe(
      'Wochenplan neu gewürfelt, 28 Gerichte.',
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

  it('counts the meals that the supply covered', () => {
    expect(weekPlanTransferAnnouncement('6 Artikel hinzugefügt.', [], 2)).toBe(
      'Wochenplan, 6 Artikel hinzugefügt. 2 Gerichte aus dem Vorrat entnommen.',
    )
  })

  it('speaks of a single covered meal in the singular', () => {
    expect(weekPlanTransferAnnouncement('6 Artikel hinzugefügt.', [], 1)).toBe(
      'Wochenplan, 6 Artikel hinzugefügt. 1 Gericht aus dem Vorrat entnommen.',
    )
  })

  it('says that the whole week came out of the supply', () => {
    expect(weekPlanTransferAnnouncement('', [], 4)).toBe(
      'Wochenplan, alle Gerichte aus dem Vorrat entnommen, nichts hinzugefügt.',
    )
  })

  it('names the week plan first when only a hint is left', () => {
    expect(weekPlanTransferAnnouncement('', [soup], 2)).toBe(
      'Wochenplan, nichts hinzugefügt. 2 Gerichte aus dem Vorrat entnommen. Suppe hat keine Einkaufs-Items.',
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
  it('names the meal time the suggestions belong to', () => {
    expect(mealSuggestionsLabel('snack')).toBe('Vorschläge für Snack')
  })
})
