import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import { suggestMeals } from './mealSuggestions'

function meal(name: string, id = name): Meal {
  return {
    id,
    name,
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'mainMeal',
  }
}

function suggestedNames(meals: readonly Meal[], typed: string) {
  return suggestMeals(meals, typed).map((suggested) => suggested.name)
}

const milkRice = meal('Milchreis')
const cauliflower = meal('Blumenkohl mit Milchsauce')
const bolognese = meal('Bolognese')

describe('suggestMeals', () => {
  it('suggests nothing below two typed letters', () => {
    expect(suggestedNames([milkRice], 'M')).toEqual([])
    expect(suggestedNames([milkRice], ' ')).toEqual([])
  })

  it('finds the typed text anywhere in the name', () => {
    expect(suggestedNames([milkRice, cauliflower, bolognese], 'milch')).toEqual(
      ['Milchreis', 'Blumenkohl mit Milchsauce'],
    )
  })

  it('ignores upper and lower case', () => {
    expect(suggestedNames([milkRice], 'MILCH')).toEqual(['Milchreis'])
  })

  it('drops the name that was typed in full', () => {
    expect(
      suggestedNames([milkRice, meal('Milchreis mit Zimt')], 'Milchreis'),
    ).toEqual(['Milchreis mit Zimt'])
  })

  it('puts the meals that start with the typed text in front', () => {
    expect(suggestedNames([cauliflower, milkRice], 'milch')).toEqual([
      'Milchreis',
      'Blumenkohl mit Milchsauce',
    ])
  })

  it('sorts equally good matches alphabetically', () => {
    expect(
      suggestedNames([meal('Milchsuppe'), meal('Milchbrötchen')], 'milch'),
    ).toEqual(['Milchbrötchen', 'Milchsuppe'])
  })

  it('suggests at most five meals', () => {
    const many = Array.from({ length: 8 }, (_, position) =>
      meal(`Auflauf ${position}`),
    )

    expect(suggestedNames(many, 'auflauf')).toHaveLength(5)
  })

  it('keeps two meals of the same name apart', () => {
    const suggested = suggestMeals(
      [meal('Auflauf', 'one'), meal('Auflauf', 'other')],
      'aufl',
    )

    expect(suggested.map((one) => one.id)).toEqual(['one', 'other'])
  })
})
