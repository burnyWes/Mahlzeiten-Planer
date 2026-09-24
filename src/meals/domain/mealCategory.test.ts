import { describe, expect, it } from 'vitest'
import { InvalidMeal, type Meal } from './meal'
import {
  CategoryAlreadyTaken,
  categoryToAdd,
  knownCategory,
  mealCategories,
  mealsInCategory,
  suggestCategories,
  withCategoryRenamed,
  withoutCategory,
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

describe('withoutCategory', () => {
  it('removes the category from every meal carrying it, whatever its spelling', () => {
    expect(
      withoutCategory(
        [
          meal('Bolognese', ['Nudelgericht']),
          meal('Carbonara', ['nudelgericht']),
        ],
        'Nudelgericht',
      ),
    ).toEqual([meal('Bolognese', []), meal('Carbonara', [])])
  })

  it('returns only the changed meals', () => {
    expect(
      withoutCategory(
        [meal('Bolognese', ['Nudelgericht']), meal('Suppe', ['Suppe'])],
        'Nudelgericht',
      ),
    ).toEqual([meal('Bolognese', [])])
  })

  it('keeps the order of the remaining categories', () => {
    expect(
      withoutCategory(
        [meal('Bolognese', ['Schnell', 'Nudelgericht', 'Italienisch'])],
        'Nudelgericht',
      ),
    ).toEqual([meal('Bolognese', ['Schnell', 'Italienisch'])])
  })

  it('returns nothing when no meal carries the category', () => {
    expect(withoutCategory([meal('Suppe', ['Suppe'])], 'Nudelgericht')).toEqual(
      [],
    )
  })
})

describe('withCategoryRenamed', () => {
  it('corrects the spelling in every meal carrying the category', () => {
    expect(
      withCategoryRenamed(
        [
          meal('Bolognese', ['nudelgericht']),
          meal('Carbonara', ['Nudelgericht ']),
        ],
        'nudelgericht',
        'Nudelgericht',
      ),
    ).toEqual([
      meal('Bolognese', ['Nudelgericht']),
      meal('Carbonara', ['Nudelgericht']),
    ])
  })

  it('renames to a free name', () => {
    expect(
      withCategoryRenamed(
        [meal('Bolognese', ['Schnell', 'Nudeln'])],
        'Nudeln',
        '  Nudelgericht ',
      ),
    ).toEqual([meal('Bolognese', ['Schnell', 'Nudelgericht'])])
  })

  it('merges into an existing category, keeping it once at the first position', () => {
    expect(
      withCategoryRenamed(
        [
          meal('Lasagne', [
            'Schnell',
            'Nudelgerichte',
            'Auflauf',
            'Nudelgericht',
          ]),
        ],
        'Nudelgerichte',
        'Nudelgericht',
      ),
    ).toEqual([meal('Lasagne', ['Schnell', 'Nudelgericht', 'Auflauf'])])
  })

  it('spreads the new spelling to meals that carried only the target', () => {
    expect(
      withCategoryRenamed(
        [
          meal('Bolognese', ['Nudelgerichte']),
          meal('Carbonara', ['nudelgericht']),
        ],
        'Nudelgerichte',
        'Nudelgericht',
      ),
    ).toEqual([
      meal('Bolognese', ['Nudelgericht']),
      meal('Carbonara', ['Nudelgericht']),
    ])
  })

  it('returns only the changed meals', () => {
    expect(
      withCategoryRenamed(
        [
          meal('Bolognese', ['Nudelgerichte']),
          meal('Carbonara', ['Nudelgericht']),
          meal('Suppe', ['Suppe']),
        ],
        'Nudelgerichte',
        'Nudelgericht',
      ),
    ).toEqual([meal('Bolognese', ['Nudelgericht'])])
  })

  it('returns nothing when the name stays the same', () => {
    expect(
      withCategoryRenamed(
        [meal('Bolognese', ['Nudelgericht'])],
        'Nudelgericht',
        'Nudelgericht',
      ),
    ).toEqual([])
  })

  it('refuses an empty name', () => {
    expect(() =>
      withCategoryRenamed(
        [meal('Bolognese', ['Nudelgericht'])],
        'Nudelgericht',
        '  ',
      ),
    ).toThrow(new InvalidMeal('nameMissing'))
    expect(() => withCategoryRenamed([], 'Nudelgericht', '  ')).toThrow(
      new InvalidMeal('nameMissing'),
    )
  })

  it('refuses a name longer than a hundred characters', () => {
    expect(() =>
      withCategoryRenamed(
        [meal('Bolognese', ['Nudelgericht'])],
        'Nudelgericht',
        'N'.repeat(101),
      ),
    ).toThrow(new InvalidMeal('nameTooLong'))
    expect(() =>
      withCategoryRenamed([], 'Nudelgericht', 'N'.repeat(101)),
    ).toThrow(new InvalidMeal('nameTooLong'))
  })

  it('returns null when no meal carries the category any more', () => {
    expect(
      withCategoryRenamed([meal('Suppe', ['Suppe'])], 'Nudelgericht', 'Nudeln'),
    ).toBeNull()
  })
})

describe('knownCategory', () => {
  const known = [overview('Auflauf'), overview('Suppe', 2)]

  it('finds nothing when nothing is chosen', () => {
    expect(knownCategory(known, null)).toBeNull()
  })

  it('finds the chosen category', () => {
    expect(knownCategory(known, 'Suppe')).toBe('Suppe')
  })

  it('answers with the known spelling', () => {
    expect(knownCategory(known, 'suppe')).toBe('Suppe')
  })

  it('finds nothing when the chosen category is gone', () => {
    expect(knownCategory(known, 'Nudelgericht')).toBeNull()
  })
})

describe('mealsInCategory', () => {
  const bolognese = meal('Bolognese', ['Nudelgericht'])
  const lentilSoup = meal('Linsensuppe', ['Suppe'])
  const onionSoup = meal('Zwiebelsuppe', ['suppe', 'Schnell'], true)
  const meals = [bolognese, lentilSoup, onionSoup]

  it('keeps every meal without a category chosen', () => {
    expect(mealsInCategory(meals, null)).toEqual(meals)
  })

  it('keeps the meals carrying the category, whatever its spelling', () => {
    expect(mealsInCategory(meals, 'SUPPE')).toEqual([lentilSoup, onionSoup])
  })

  it('keeps hidden meals carrying the category', () => {
    expect(mealsInCategory(meals, 'Schnell')).toEqual([onionSoup])
  })

  it('keeps the order of the meals', () => {
    expect(
      mealsInCategory([onionSoup, bolognese, lentilSoup], 'Suppe'),
    ).toEqual([onionSoup, lentilSoup])
  })
})
