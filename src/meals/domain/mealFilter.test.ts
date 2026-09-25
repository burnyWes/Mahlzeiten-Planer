import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import type { CategoryOverview } from './mealCategory'
import { knownFilter, mealsMatching, usedMealKinds } from './mealFilter'

function meal(name: string, parts: Partial<Meal> = {}): Meal {
  return {
    id: name,
    name,
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'none',
    ...parts,
  }
}

function overview(name: string, mealCount = 1): CategoryOverview {
  return { name, mealCount }
}

describe('usedMealKinds', () => {
  it('finds no kind without meals', () => {
    expect(usedMealKinds([])).toEqual([])
  })

  it('finds no kind when no meal carries one', () => {
    expect(usedMealKinds([meal('Bolognese'), meal('Linsensuppe')])).toEqual([])
  })

  it('lists each used kind once in the fixed order', () => {
    expect(
      usedMealKinds([
        meal('Apfel', { kind: 'snack' }),
        meal('Bolognese', { kind: 'mainMeal' }),
        meal('Nüsse', { kind: 'snack' }),
        meal('Müsli', { kind: 'breakfast' }),
      ]),
    ).toEqual(['mainMeal', 'breakfast', 'snack'])
  })

  it('counts hidden meals', () => {
    expect(
      usedMealKinds([meal('Müsli', { kind: 'breakfast', hidden: true })]),
    ).toEqual(['breakfast'])
  })
})

describe('knownFilter', () => {
  const kinds = ['mainMeal', 'snack'] as const
  const categories = [overview('Auflauf'), overview('Suppe', 2)]

  it('finds nothing when nothing is chosen', () => {
    expect(knownFilter(kinds, categories, null)).toBeNull()
  })

  it('finds the chosen kind', () => {
    expect(
      knownFilter(kinds, categories, { by: 'kind', kind: 'snack' }),
    ).toEqual({ by: 'kind', kind: 'snack' })
  })

  it('finds nothing when the chosen kind is no longer used', () => {
    expect(
      knownFilter(kinds, categories, { by: 'kind', kind: 'breakfast' }),
    ).toBeNull()
  })

  it('finds the chosen category with its known spelling', () => {
    expect(
      knownFilter(kinds, categories, { by: 'category', category: 'suppe' }),
    ).toEqual({ by: 'category', category: 'Suppe' })
  })

  it('finds nothing when the chosen category is gone', () => {
    expect(
      knownFilter(kinds, categories, {
        by: 'category',
        category: 'Nudelgericht',
      }),
    ).toBeNull()
  })
})

describe('mealsMatching', () => {
  const bolognese = meal('Bolognese', {
    kind: 'mainMeal',
    categories: ['Nudelgericht'],
  })
  const muesli = meal('Müsli', { kind: 'breakfast' })
  const porridge = meal('Porridge', { kind: 'breakfast', hidden: true })
  const lentilSoup = meal('Linsensuppe', { categories: ['Suppe'] })
  const meals = [bolognese, lentilSoup, muesli, porridge]

  it('keeps every meal without a filter', () => {
    expect(mealsMatching(meals, null)).toEqual(meals)
  })

  it('keeps the meals of the chosen kind, hidden ones included', () => {
    expect(mealsMatching(meals, { by: 'kind', kind: 'breakfast' })).toEqual([
      muesli,
      porridge,
    ])
  })

  it('keeps the meals carrying the chosen category', () => {
    expect(mealsMatching(meals, { by: 'category', category: 'suppe' })).toEqual(
      [lentilSoup],
    )
  })

  it('tells a kind from a category of the same name', () => {
    const apple = meal('Apfel', { kind: 'snack' })
    const pretzel = meal('Brezel', { kind: 'mainMeal', categories: ['Snack'] })

    expect(
      mealsMatching([apple, pretzel], { by: 'kind', kind: 'snack' }),
    ).toEqual([apple])
    expect(
      mealsMatching([apple, pretzel], { by: 'category', category: 'Snack' }),
    ).toEqual([pretzel])
  })

  it('keeps the order of the meals', () => {
    expect(
      mealsMatching([porridge, bolognese, muesli], {
        by: 'kind',
        kind: 'breakfast',
      }),
    ).toEqual([porridge, muesli])
  })
})
