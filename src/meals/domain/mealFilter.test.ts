import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import type { CategoryOverview } from './mealCategory'
import {
  knownFilter,
  mealsMatching,
  suppliesMatching,
  usedMealKinds,
} from './mealFilter'
import type { SuppliedMeal } from './supply'

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
    leftovers: false,
    ...parts,
  }
}

function supplied(suppliedMeal: Meal, count: number): SuppliedMeal {
  return { meal: suppliedMeal, count }
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

  it('keeps the meals carrying the chosen category, whatever its spelling', () => {
    const onionSoup = meal('Zwiebelsuppe', { categories: ['suppe'] })

    expect(
      mealsMatching([lentilSoup, onionSoup, bolognese], {
        by: 'category',
        category: 'SUPPE',
      }),
    ).toEqual([lentilSoup, onionSoup])
  })

  it('keeps hidden meals carrying the chosen category', () => {
    const onionSoup = meal('Zwiebelsuppe', {
      categories: ['Schnell'],
      hidden: true,
    })

    expect(
      mealsMatching([bolognese, onionSoup], {
        by: 'category',
        category: 'Schnell',
      }),
    ).toEqual([onionSoup])
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

describe('suppliesMatching', () => {
  const lasagne = supplied(
    meal('Lasagne', { kind: 'mainMeal', categories: ['Vegetarisch'] }),
    2,
  )
  const nuts = supplied(meal('Nüsse', { kind: 'snack' }), 1)
  const soup = supplied(meal('Suppe', { categories: ['Suppe'] }), 3)
  const all = [lasagne, nuts, soup]

  it('keeps every supply without a filter', () => {
    expect(suppliesMatching(all, null)).toEqual(all)
  })

  it('keeps the supplies whose meal has the chosen kind', () => {
    expect(suppliesMatching(all, { by: 'kind', kind: 'snack' })).toEqual([nuts])
  })

  it('keeps the supplies whose meal carries the chosen category', () => {
    expect(
      suppliesMatching(all, { by: 'category', category: 'suppe' }),
    ).toEqual([soup])
  })

  it('tells a kind from a category of the same name', () => {
    const apple = supplied(meal('Apfel', { kind: 'snack' }), 1)
    const pretzel = supplied(
      meal('Brezel', { kind: 'mainMeal', categories: ['Snack'] }),
      4,
    )

    expect(
      suppliesMatching([apple, pretzel], { by: 'kind', kind: 'snack' }),
    ).toEqual([apple])
    expect(
      suppliesMatching([apple, pretzel], { by: 'category', category: 'Snack' }),
    ).toEqual([pretzel])
  })

  it('keeps the order and the counts of the supplies', () => {
    const muesli = supplied(meal('Müsli', { kind: 'snack' }), 5)

    expect(
      suppliesMatching([soup, muesli, lasagne, nuts], {
        by: 'kind',
        kind: 'snack',
      }),
    ).toEqual([
      { meal: muesli.meal, count: 5 },
      { meal: nuts.meal, count: 1 },
    ])
  })
})
