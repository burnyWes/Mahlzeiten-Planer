import { createName, normalizeMealName } from './meal'

export class CategoryAlreadyTaken extends Error {
  category: string

  constructor(category: string) {
    super(category)
    this.name = 'CategoryAlreadyTaken'
    this.category = category
  }
}

function sameCategory(one: string, other: string): boolean {
  return normalizeMealName(one) === normalizeMealName(other)
}

export function categoryToAdd(
  taken: readonly string[],
  known: readonly string[],
  written: string,
): string {
  const name = createName(written)
  const alreadyTaken = taken.find((category) => sameCategory(category, name))
  if (alreadyTaken !== undefined) throw new CategoryAlreadyTaken(alreadyTaken)
  return known.find((category) => sameCategory(category, name)) ?? name
}
