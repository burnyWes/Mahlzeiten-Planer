import { describe, expect, it } from 'vitest'
import {
  categoryNamed,
  ensureCategoryChosen,
  ItemCategoryMissing,
  categoryToAssign,
  EMPTY_ITEM_CATEGORY_CATALOG,
  findItemCategory,
  ItemCategoryAlreadyTaken,
  itemCategoryCatalogFromStored,
  placedItemCategory,
  placementOf,
  sameItemCategoryCatalog,
  suggestItemCategories,
  withCategoryAdded,
  withCategoryChanged,
  withoutItemCategory,
  withSortByCategory,
  type ItemCategoryCatalog,
} from './itemCategory'
import { InvalidShoppingItem } from './shoppingItem'

function catalogOf(...names: readonly string[]): ItemCategoryCatalog {
  return {
    categories: names.map((name, index) => ({ id: `k${index + 1}`, name })),
    sortByCategory: true,
  }
}

function namesOf(catalog: ItemCategoryCatalog): readonly string[] {
  return catalog.categories.map((category) => category.name)
}

function caught(action: () => unknown): unknown {
  try {
    action()
  } catch (error) {
    return error
  }
  throw new Error('nothing was thrown')
}

describe('withCategoryAdded', () => {
  it('appends a category at the end', () => {
    const catalog = withCategoryAdded(
      catalogOf('Obst/Gemüse', 'Backwaren'),
      'k9',
      '  Drogerie ',
      3,
    )

    expect(catalog.categories).toEqual([
      { id: 'k1', name: 'Obst/Gemüse' },
      { id: 'k2', name: 'Backwaren' },
      { id: 'k9', name: 'Drogerie' },
    ])
  })

  it('moves the following categories back when inserted in between', () => {
    const catalog = withCategoryAdded(
      catalogOf('Obst/Gemüse', 'Backwaren', 'Tiefkühlkost'),
      'k9',
      'Drogerie',
      2,
    )

    expect(namesOf(catalog)).toEqual([
      'Obst/Gemüse',
      'Drogerie',
      'Backwaren',
      'Tiefkühlkost',
    ])
  })

  it('keeps the position within the catalog', () => {
    expect(
      namesOf(withCategoryAdded(catalogOf('Obst'), 'k9', 'Drogerie', 7)),
    ).toEqual(['Obst', 'Drogerie'])
    expect(
      namesOf(withCategoryAdded(catalogOf('Obst'), 'k9', 'Drogerie', 0)),
    ).toEqual(['Drogerie', 'Obst'])
  })

  it('refuses a name that is already taken', () => {
    const error = caught(() =>
      withCategoryAdded(catalogOf('Tiefkühlkost'), 'k9', ' tiefkühlkost', 2),
    )

    expect(error).toBeInstanceOf(ItemCategoryAlreadyTaken)
    expect((error as ItemCategoryAlreadyTaken).category).toBe('Tiefkühlkost')
  })

  it('refuses an empty or overlong name', () => {
    expect(() => withCategoryAdded(catalogOf(), 'k9', '  ', 1)).toThrowError(
      InvalidShoppingItem,
    )
    expect(() =>
      withCategoryAdded(catalogOf(), 'k9', 'x'.repeat(101), 1),
    ).toThrowError(InvalidShoppingItem)
  })
})

describe('withCategoryChanged', () => {
  it('moves a category forward', () => {
    const catalog = withCategoryChanged(
      catalogOf('Obst', 'Backwaren', 'Süßigkeiten', 'Tiefkühlkost'),
      'k4',
      'Tiefkühlkost',
      2,
    )

    expect(namesOf(catalog)).toEqual([
      'Obst',
      'Tiefkühlkost',
      'Backwaren',
      'Süßigkeiten',
    ])
  })

  it('moves a category backward', () => {
    const catalog = withCategoryChanged(
      catalogOf('Obst', 'Backwaren', 'Süßigkeiten', 'Tiefkühlkost'),
      'k1',
      'Obst',
      3,
    )

    expect(namesOf(catalog)).toEqual([
      'Backwaren',
      'Süßigkeiten',
      'Obst',
      'Tiefkühlkost',
    ])
  })

  it('renames a category in place', () => {
    const catalog = withCategoryChanged(
      catalogOf('Obst', 'backwaren'),
      'k2',
      'Brot',
      2,
    )

    expect(catalog.categories).toEqual([
      { id: 'k1', name: 'Obst' },
      { id: 'k2', name: 'Brot' },
    ])
  })

  it('allows its own name in another spelling', () => {
    const catalog = withCategoryChanged(
      catalogOf('Obst', 'backwaren'),
      'k2',
      'Backwaren',
      2,
    )

    expect(namesOf(catalog)).toEqual(['Obst', 'Backwaren'])
  })

  it('refuses the name of another category', () => {
    const error = caught(() =>
      withCategoryChanged(catalogOf('Obst', 'Backwaren'), 'k2', 'obst', 2),
    )

    expect(error).toBeInstanceOf(ItemCategoryAlreadyTaken)
    expect((error as ItemCategoryAlreadyTaken).category).toBe('Obst')
  })

  it('keeps the position within the catalog', () => {
    expect(
      namesOf(withCategoryChanged(catalogOf('Obst', 'Brot'), 'k1', 'Obst', 9)),
    ).toEqual(['Brot', 'Obst'])
  })

  it('leaves the catalog alone for an unknown category', () => {
    const catalog = catalogOf('Obst')

    expect(withCategoryChanged(catalog, 'k9', 'Brot', 1)).toBe(catalog)
  })
})

describe('withoutItemCategory', () => {
  it('removes the category', () => {
    expect(
      namesOf(withoutItemCategory(catalogOf('Obst', 'Brot', 'Käse'), 'k2')),
    ).toEqual(['Obst', 'Käse'])
  })
})

describe('withSortByCategory', () => {
  it('switches the sorting', () => {
    expect(withSortByCategory(catalogOf('Obst'), false)).toEqual({
      ...catalogOf('Obst'),
      sortByCategory: false,
    })
  })
})

describe('placementOf', () => {
  it('counts the position from one', () => {
    expect(placementOf(catalogOf('Obst', 'Brot', 'Käse'), 'k2')).toEqual({
      position: 2,
      count: 3,
    })
  })

  it('knows no placement of an unknown category', () => {
    expect(placementOf(catalogOf('Obst'), 'k9')).toBeNull()
  })
})

describe('placedItemCategory', () => {
  it('names the category with its placement', () => {
    expect(placedItemCategory(catalogOf('Obst', 'Brot'), 'k2')).toEqual({
      category: { id: 'k2', name: 'Brot' },
      placement: { position: 2, count: 2 },
    })
  })

  it('places no unknown category', () => {
    expect(placedItemCategory(catalogOf('Obst'), 'k9')).toBeNull()
  })
})

describe('categoryNamed', () => {
  it('finds a category by its normalized name', () => {
    expect(categoryNamed(catalogOf('Obst/Gemüse'), ' obst/gemüse ')).toEqual({
      id: 'k1',
      name: 'Obst/Gemüse',
    })
  })

  it('finds nothing for an unknown name', () => {
    expect(categoryNamed(catalogOf('Obst'), 'Brot')).toBeNull()
  })
})

describe('findItemCategory', () => {
  it('finds a category by its id', () => {
    expect(findItemCategory(catalogOf('Obst', 'Brot'), 'k2')).toEqual({
      id: 'k2',
      name: 'Brot',
    })
  })

  it('finds nothing without or with an unknown id', () => {
    expect(findItemCategory(catalogOf('Obst'), null)).toBeNull()
    expect(findItemCategory(catalogOf('Obst'), 'k9')).toBeNull()
  })
})

describe('itemCategoryCatalogFromStored', () => {
  it('starts sorted and without categories when nothing is stored', () => {
    expect(itemCategoryCatalogFromStored(undefined)).toEqual(
      EMPTY_ITEM_CATEGORY_CATALOG,
    )
    expect(EMPTY_ITEM_CATEGORY_CATALOG).toEqual({
      categories: [],
      sortByCategory: true,
    })
  })

  it('skips incomplete categories', () => {
    expect(
      itemCategoryCatalogFromStored({
        categories: [
          { id: 'k1' },
          { name: 'Brot' },
          { id: 'k3', name: 'Käse' },
        ],
      }),
    ).toEqual({
      categories: [{ id: 'k3', name: 'Käse' }],
      sortByCategory: true,
    })
  })

  it('reads a complete catalog', () => {
    expect(
      itemCategoryCatalogFromStored({
        categories: [
          { id: 'k1', name: 'Obst' },
          { id: 'k2', name: 'Brot' },
        ],
        sortByCategory: false,
      }),
    ).toEqual({ ...catalogOf('Obst', 'Brot'), sortByCategory: false })
  })
})

describe('suggestItemCategories', () => {
  const catalog = catalogOf(
    'Obst/Gemüse',
    'Tiefkühlkost',
    'Kühlregal',
    'Drogerie',
  )

  it('suggests nothing before the first character', () => {
    expect(suggestItemCategories(catalog, ' ')).toEqual([])
  })

  it('puts the categories starting with the typed text first, then keeps the order', () => {
    expect(suggestItemCategories(catalog, 'k')).toEqual([
      'Kühlregal',
      'Tiefkühlkost',
    ])
  })

  it('leaves out the category typed exactly', () => {
    expect(suggestItemCategories(catalog, 'drogerie')).toEqual([])
  })

  it('suggests at most five categories', () => {
    expect(
      suggestItemCategories(catalogOf('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), 'a'),
    ).toEqual(['a1', 'a2', 'a3', 'a4', 'a5'])
  })
})

describe('sameItemCategoryCatalog', () => {
  it('compares order, names and the sorting', () => {
    const catalog = catalogOf('Obst', 'Brot')

    expect(sameItemCategoryCatalog(catalog, catalogOf('Obst', 'Brot'))).toBe(
      true,
    )
    expect(sameItemCategoryCatalog(catalog, catalogOf('Brot', 'Obst'))).toBe(
      false,
    )
    expect(sameItemCategoryCatalog(catalog, catalogOf('Obst', 'Käse'))).toBe(
      false,
    )
    expect(
      sameItemCategoryCatalog(catalog, withSortByCategory(catalog, false)),
    ).toBe(false)
  })
})

describe('categoryToAssign', () => {
  const catalog = catalogOf('Obst/Gemüse', 'Backwaren')

  it('assigns no category for an empty field', () => {
    expect(categoryToAssign(catalog, '  ', 'k9')).toEqual({
      catalog,
      categoryId: null,
      created: null,
    })
  })

  it('assigns the category with the same normalized name', () => {
    expect(categoryToAssign(catalog, 'obst/gemüse ', 'k9')).toEqual({
      catalog,
      categoryId: 'k1',
      created: null,
    })
  })

  it('creates an unknown category at the end', () => {
    const assignment = categoryToAssign(catalog, ' Drogerie', 'k9')

    expect(namesOf(assignment.catalog)).toEqual([
      'Obst/Gemüse',
      'Backwaren',
      'Drogerie',
    ])
    expect(assignment.categoryId).toBe('k9')
    expect(assignment.created).toEqual({
      category: { id: 'k9', name: 'Drogerie' },
      placement: { position: 3, count: 3 },
    })
  })

  it('refuses an overlong category', () => {
    expect(() => categoryToAssign(catalog, 'x'.repeat(101), 'k9')).toThrowError(
      InvalidShoppingItem,
    )
  })
})

describe('ensureCategoryChosen', () => {
  it('refuses an empty category', () => {
    expect(() => ensureCategoryChosen('  ')).toThrowError(ItemCategoryMissing)
  })

  it('accepts a written category', () => {
    expect(() => ensureCategoryChosen('Obst')).not.toThrow()
  })
})
