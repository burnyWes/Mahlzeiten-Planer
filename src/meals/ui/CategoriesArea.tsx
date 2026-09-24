import { useState } from 'react'
import {
  categoryDeletedAnnouncement,
  categorySavedAnnouncement,
} from '../domain/announcements'
import { createName, normalizeMealName } from '../domain/meal'
import {
  mealCategories,
  withCategoryRenamed,
  withoutCategory,
  type CategoryOverview,
} from '../domain/mealCategory'
import { CategoryFormPage } from './CategoryFormPage'
import { CategoryListPage } from './CategoryListPage'
import { DeleteCategoryPage } from './DeleteCategoryPage'
import type { Meals } from './useMeals'

type CategoriesPage =
  | { kind: 'list' }
  | { kind: 'form'; name: string }
  | { kind: 'delete'; name: string }

type CategoriesAreaProps = {
  meals: Meals
  announce: (text: string) => void
  onBack: () => void
}

export function CategoriesArea({
  meals,
  announce,
  onBack,
}: CategoriesAreaProps) {
  const [page, setPage] = useState<CategoriesPage>({ kind: 'list' })
  const categories = mealCategories(meals.meals)

  const addressedCategory =
    page.kind === 'list'
      ? null
      : (categories.find(
          (overview) =>
            normalizeMealName(overview.name) === normalizeMealName(page.name),
        ) ?? null)

  function showList() {
    setPage({ kind: 'list' })
  }

  function deleteCategory(overview: CategoryOverview) {
    meals.changeMeals(withoutCategory(meals.meals, overview.name))
    showList()
    announce(categoryDeletedAnnouncement(overview.name, categories.length - 1))
  }

  function renameCategory(overview: CategoryOverview, newName: string) {
    const changed = withCategoryRenamed(meals.meals, overview.name, newName)
    if (changed === null) {
      showList()
      return
    }
    meals.changeMeals(changed)
    showList()
    announce(categorySavedAnnouncement(createName(newName)))
  }

  if (page.kind === 'form' && addressedCategory !== null)
    return (
      <CategoryFormPage
        overview={addressedCategory}
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
      onOpenCategory={(overview) =>
        setPage({ kind: 'form', name: overview.name })
      }
      onDeleteCategory={(overview) =>
        setPage({ kind: 'delete', name: overview.name })
      }
    />
  )
}
