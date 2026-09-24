import { describe, expect, it } from 'vitest'
import { InvalidMeal, type Meal } from './meal'
import {
  CategoryAlreadyTaken,
  categoryToAdd,
  mealCategories,
  suggestCategories,
  type CategoryOverview,
} from './mealCategory'

function meal(
  name: string,
  categories: readonly string[],
  hidden = false,
): Meal {
  return {
    id: name,
    name,
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories,
    hidden,
    kind: 'mainMeal',
  }
}

function overview(name: string, mealCount = 1): CategoryOverview {
  return { name, mealCount }
}

describe('categoryToAdd', () => {
  it('trims the written name', () => {
    expect(categoryToAdd([], [], '  Nudelgericht ')).toBe('Nudelgericht')
  })

  it('refuses a category without a name', () => {
    expect(() => categoryToAdd([], [], '   ')).toThrow(
      new InvalidMeal('nameMissing'),
    )
  })

  it('refuses a name longer than a hundred characters', () => {
    expect(() => categoryToAdd([], [], 'N'.repeat(101))).toThrow(
      new InvalidMeal('nameTooLong'),
    )
  })

  it('takes over the spelling a known category already has', () => {
    expect(categoryToAdd([], ['Suppe', 'Nudelgericht'], ' nudelgericht ')).toBe(
      'Nudelgericht',
    )
  })

  it('keeps the written spelling for a new category', () => {
    expect(categoryToAdd([], ['Suppe'], 'Auflauf')).toBe('Auflauf')
  })

  it('refuses a category the meal already carries, whatever its spelling', () => {
    const addAgain = () =>
      categoryToAdd(['Schnell', 'Nudelgericht'], [], '  nudelGERICHT ')

    expect(addAgain).toThrow(CategoryAlreadyTaken)
    expect(addAgain).toThrow(new CategoryAlreadyTaken('Nudelgericht'))
  })
})

describe('mealCategories', () => {
  it('lists every category once with the number of meals carrying it', () => {
    expect(
      mealCategories([
        meal('Bolognese', ['Nudelgericht', 'Schnell']),
        meal('Carbonara', ['Nudelgericht']),
      ]),
    ).toEqual([overview('Nudelgericht', 2), overview('Schnell', 1)])
  })

  it('counts hidden meals as well', () => {
    expect(
      mealCategories([
        meal('Bolognese', ['Nudelgericht']),
        meal('Carbonara', ['Nudelgericht'], true),
      ]),
    ).toEqual([overview('Nudelgericht', 2)])
  })

  it('treats different spellings as one category', () => {
    expect(
      mealCategories([
        meal('Carbonara', ['nudelgericht']),
        meal('Bolognese', ['Nudelgericht']),
        meal('Lasagne', ['Nudelgericht', ' NUDELGERICHT']),
      ]),
    ).toEqual([overview('Nudelgericht', 3)])
  })

  it('sorts alphabetically', () => {
    expect(
      mealCategories([meal('Suppe', ['Suppe', 'Äpfel', 'Brot'])]).map(
        (category) => category.name,
      ),
    ).toEqual(['Äpfel', 'Brot', 'Suppe'])
  })

  it('returns nothing for meals without categories', () => {
    expect(mealCategories([meal('Suppe', [])])).toEqual([])
  })
})

describe('suggestCategories', () => {
  const known = [
    overview('Nudelgericht', 3),
    overview('Suppe', 1),
    overview('Schnell', 2),
  ]

  it('suggests nothing below two typed characters', () => {
    expect(suggestCategories(known, [], 'n')).toEqual([])
  })

  it('suggests categories that contain the typed text', () => {
    expect(suggestCategories(known, [], 'GERICHT')).toEqual(['Nudelgericht'])
  })

  it('leaves out categories the meal already carries', () => {
    expect(suggestCategories(known, ['schnell'], 'sch')).toEqual([])
  })

  it('leaves out the exact match', () => {
    expect(suggestCategories(known, [], 'suppe')).toEqual([])
  })

  it('ranks categories starting with the typed text first, then by the number of meals, then alphabetically', () => {
    expect(
      suggestCategories(
        [
          overview('Eintopf', 5),
          overview('Topfgericht', 1),
          overview('Tofu', 2),
          overview('Auflauf', 1),
          overview('Toast', 1),
        ],
        [],
        'to',
      ),
    ).toEqual(['Tofu', 'Toast', 'Topfgericht', 'Eintopf'])
  })

  it('suggests at most five categories', () => {
    expect(
      suggestCategories(
        ['Aa1', 'Aa2', 'Aa3', 'Aa4', 'Aa5', 'Aa6'].map((name) =>
          overview(name),
        ),
        [],
        'aa',
      ),
    ).toHaveLength(5)
  })
})
