import { useRef } from 'react'
import type { CategoryOverview } from '../domain/mealCategory'
import { CrossIcon } from './CrossIcon'

const EVERY_CATEGORY = ''

type MealCategoryFilterProps = {
  categories: readonly CategoryOverview[]
  activeCategory: string | null
  onChooseCategory: (category: string | null) => void
}

export function MealCategoryFilter({
  categories,
  activeCategory,
  onChooseCategory,
}: MealCategoryFilterProps) {
  const categorySelect = useRef<HTMLSelectElement>(null)

  function resetFilter() {
    onChooseCategory(null)
    categorySelect.current?.focus()
  }

  return (
    <div className="categoryFilter">
      <label htmlFor="mealCategoryFilter">Kategorie</label>
      <select
        ref={categorySelect}
        id="mealCategoryFilter"
        value={activeCategory ?? EVERY_CATEGORY}
        onChange={(event) =>
          onChooseCategory(
            event.target.value === EVERY_CATEGORY ? null : event.target.value,
          )
        }
      >
        <option value={EVERY_CATEGORY}>Alle</option>
        {categories.map((category) => (
          <option key={category.name} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
      {activeCategory !== null && (
        <button
          type="button"
          className="iconButton"
          onClick={resetFilter}
          aria-label="Filter zurücksetzen"
        >
          <CrossIcon />
        </button>
      )}
    </div>
  )
}
