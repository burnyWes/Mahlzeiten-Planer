import { useState } from 'react'
import {
  categoryCreatedAnnouncement,
  categoryDeletedAnnouncement,
  categorySavedAnnouncement,
} from '../domain/announcements'
import { createName, normalizeMealName } from '../domain/meal'
import {
  catalogCategoryToAdd,
  catalogWithCategoryRenamed,
  catalogWithoutCategory,
  mealCategories,
  sameCategory,
  withCatalogCategories,
  withCategoryRenamed,
  withoutCategory,
  type CategoryOverview,
} from '../domain/mealCategory'
import { CategoryFormPage } from './CategoryFormPage'
import { CategoryListPage } from './CategoryListPage'
import { DeleteCategoryPage } from './DeleteCategoryPage'
import type { MealCategories } from './useMealCategories'
import type { Meals } from './useMeals'

type CategoriesPage =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'form'; name: string }
  | { kind: 'delete'; name: string }

type CategoriesAreaProps = {
  meals: Meals
  mealCategories: MealCategories
  announce: (text: string) => void
  onBack: () => void
}

export function CategoriesArea({
  meals,
  mealCategories: catalog,
  announce,
  onBack,
}: CategoriesAreaProps) {
  const [page, setPage] = useState<CategoriesPage>({ kind: 'list' })
  const categories = withCatalogCategories(
    mealCategories(meals.meals),
    catalog.names,
  )

  const addressedCategory =
    page.kind === 'form' || page.kind === 'delete'
      ? (categories.find(
          (overview) =>
            normalizeMealName(overview.name) === normalizeMealName(page.name),
        ) ?? null)
      : null

  function inCatalog(name: string) {
    return catalog.names.some((category) => sameCategory(category, name))
  }

  function showList() {
    setPage({ kind: 'list' })
  }

  function createCategory(written: string) {
    const name = catalogCategoryToAdd(
      categories.map((overview) => overview.name),
      written,
    )
    catalog.writeNames([...catalog.names, name])
    showList()
    announce(categoryCreatedAnnouncement(name))
  }

  function deleteCategory(overview: CategoryOverview) {
    meals.changeMeals(withoutCategory(meals.meals, overview.name))
    if (inCatalog(overview.name))
      catalog.writeNames(catalogWithoutCategory(catalog.names, overview.name))
    showList()
    announce(categoryDeletedAnnouncement(overview.name, categories.length - 1))
  }

  function renameCategory(overview: CategoryOverview, newName: string) {
    const changed = withCategoryRenamed(meals.meals, overview.name, newName)
    const renamedInCatalog = inCatalog(overview.name)
    if (changed === null && !renamedInCatalog) {
      showList()
      return
    }
    if (changed !== null) meals.changeMeals(changed)
    if (renamedInCatalog)
      catalog.writeNames(
        catalogWithCategoryRenamed(catalog.names, overview.name, newName),
      )
    showList()
    announce(categorySavedAnnouncement(createName(newName)))
  }

  if (page.kind === 'create')
    return (
      <CategoryFormPage
        heading="Kategorie anlegen"
        initialName=""
        onSave={createCategory}
        onBack={showList}
        announce={announce}
      />
    )

  if (page.kind === 'form' && addressedCategory !== null)
    return (
      <CategoryFormPage
        heading="Kategorie bearbeiten"
        initialName={addressedCategory.name}
        onSave={(newName) => renameCategory(addressedCategory, newName)}
        onBack={showList}
        announce={announce}
      />
    )

  if (page.kind === 'delete' && addressedCategory !== null)
    return (
      <DeleteCategoryPage
        overview={addressedCategory}
        onDelete={() => deleteCategory(addressedCategory)}
        onCancel={showList}
      />
    )

  return (
    <CategoryListPage
      categories={categories}
      onBack={onBack}
      onAddCategory={() => setPage({ kind: 'create' })}
      onOpenCategory={(overview) =>
        setPage({ kind: 'form', name: overview.name })
      }
      onDeleteCategory={(overview) =>
        setPage({ kind: 'delete', name: overview.name })
      }
    />
  )
}
