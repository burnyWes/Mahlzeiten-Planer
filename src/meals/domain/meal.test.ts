import { describe, expect, it } from 'vitest'
import { InvalidQuantity } from '../../shared/domain/quantity'
import {
  byName,
  createMeal,
  createMealItem,
  formatMealItem,
  InvalidMeal,
  mealNamed,
  normalizeMealName,
  type Meal,
  type MealItem,
} from './meal'

const emptyDraft = { name: '', ingredientNotes: '', recipe: '' }

function meal(name: string): Meal {
  return { id: name, name, items: [], ingredientNotes: '', recipe: '' }
}

function item(name: string, amount = '', unit = ''): MealItem {
  return createMealItem({ name, amount, unit })
}

describe('createMealItem', () => {
  it('keeps name and quantity of the draft', () => {
    expect(item('Hackfleisch', '500', 'g')).toEqual({
      name: 'Hackfleisch',
      quantity: { amount: 500, unit: 'g' },
    })
  })

  it('leaves out a quantity nobody wrote down', () => {
    expect(item('Salz').quantity).toBeNull()
  })

  it('trims the name', () => {
    expect(item('  Spaghetti  ').name).toBe('Spaghetti')
  })

  it('refuses an item without a name', () => {
    expect(() => item('   ')).toThrow(new InvalidMeal('nameMissing'))
  })

  it('refuses a name longer than a hundred characters', () => {
    expect(() => item('N'.repeat(101))).toThrow(new InvalidMeal('nameTooLong'))
  })

  it('lets an unreadable quantity through as it is', () => {
    expect(() => item('Mehl', 'viel')).toThrow(
      new InvalidQuantity('amountNotANumber'),
    )
  })
})

describe('createMeal', () => {
  it('keeps name, items and both texts', () => {
    const items = [item('Hackfleisch', '500', 'g')]

    expect(
      createMeal(
        {
          name: 'Bolognese',
          ingredientNotes: 'Zwiebel, Knoblauch',
          recipe: 'Anbraten.',
        },
        items,
      ),
    ).toEqual({
      name: 'Bolognese',
      items,
      ingredientNotes: 'Zwiebel, Knoblauch',
      recipe: 'Anbraten.',
    })
  })

  it('trims the name', () => {
    expect(createMeal({ ...emptyDraft, name: '  Suppe ' }, []).name).toBe(
      'Suppe',
    )
  })

  it('refuses a meal without a name', () => {
    expect(() => createMeal(emptyDraft, [])).toThrow(
      new InvalidMeal('nameMissing'),
    )
  })

  it('refuses a name longer than a hundred characters', () => {
    expect(() =>
      createMeal({ ...emptyDraft, name: 'N'.repeat(101) }, []),
    ).toThrow(new InvalidMeal('nameTooLong'))
  })

  it('refuses ingredient notes longer than five thousand characters', () => {
    expect(() =>
      createMeal(
        { ...emptyDraft, name: 'Suppe', ingredientNotes: 'z'.repeat(5001) },
        [],
      ),
    ).toThrow(new InvalidMeal('textTooLong'))
  })

  it('refuses a recipe longer than five thousand characters', () => {
    expect(() =>
      createMeal(
        { ...emptyDraft, name: 'Suppe', recipe: 'z'.repeat(5001) },
        [],
      ),
    ).toThrow(new InvalidMeal('textTooLong'))
  })

  it('accepts a meal without items and without texts', () => {
    expect(createMeal({ ...emptyDraft, name: 'Suppe' }, [])).toEqual({
      name: 'Suppe',
      items: [],
      ingredientNotes: '',
      recipe: '',
    })
  })
})

describe('byName', () => {
  it('sorts alphabetically', () => {
    const sorted = byName([meal('Suppe'), meal('Auflauf'), meal('Brot')])

    expect(sorted.map((sortedMeal) => sortedMeal.name)).toEqual([
      'Auflauf',
      'Brot',
      'Suppe',
    ])
  })

  it('puts an umlaut where German readers look for it', () => {
    const sorted = byName([meal('Zwiebelkuchen'), meal('Äpfel'), meal('Brot')])

    expect(sorted.map((sortedMeal) => sortedMeal.name)).toEqual([
      'Äpfel',
      'Brot',
      'Zwiebelkuchen',
    ])
  })

  it('leaves the given meals untouched', () => {
    const meals = [meal('Suppe'), meal('Auflauf')]

    byName(meals)

    expect(meals.map((sortedMeal) => sortedMeal.name)).toEqual([
      'Suppe',
      'Auflauf',
    ])
  })
})

describe('formatMealItem', () => {
  it('names the quantity behind the name', () => {
    expect(formatMealItem(item('Hackfleisch', '500', 'g'))).toBe(
      'Hackfleisch, 500 g',
    )
  })

  it('names only the item when no quantity was written down', () => {
    expect(formatMealItem(item('Salz'))).toBe('Salz')
  })
})

describe('normalizeMealName', () => {
  it('lowers the case and gathers the whitespace', () => {
    expect(normalizeMealName('  Spaghetti   Bolognese ')).toBe(
      'spaghetti bolognese',
    )
  })
})

describe('mealNamed', () => {
  const meals = [meal('Bolognese'), meal('Linsensuppe')]

  it('finds the meal that was written out', () => {
    expect(mealNamed(meals, 'Bolognese')).toBe(meals[0])
  })

  it('finds the meal however it was capitalized and spaced', () => {
    expect(mealNamed(meals, '  bOLOGNESE ')).toBe(meals[0])
  })

  it('finds no meal for an empty text', () => {
    expect(mealNamed(meals, '   ')).toBeNull()
  })

  it('finds no meal for a name nobody wrote down', () => {
    expect(mealNamed(meals, 'Pizza')).toBeNull()
  })
})
