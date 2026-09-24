import { describe, expect, it } from 'vitest'
import { InvalidMeal } from './meal'
import { CategoryAlreadyTaken, categoryToAdd } from './mealCategory'

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
