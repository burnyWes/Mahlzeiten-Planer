import { useRef } from 'react'
import { mealFilterName } from '../domain/announcements'
import type { ChosenMealKind } from '../domain/meal'
import type { CategoryOverview } from '../domain/mealCategory'
import type { MealFilter } from '../domain/mealFilter'
import { CrossIcon } from './CrossIcon'

const NO_FILTER = ''

function filterValue(filter: MealFilter): string {
  return filter.by === 'kind'
    ? `kind:${filter.kind}`
    : `category:${filter.category}`
}

type MealFilterSelectProps = {
  kinds: readonly ChosenMealKind[]
  categories: readonly CategoryOverview[]
  activeFilter: MealFilter | null
  onChooseFilter: (filter: MealFilter | null) => void
}

export function MealFilterSelect({
  kinds,
  categories,
  activeFilter,
  onChooseFilter,
}: MealFilterSelectProps) {
  const filterSelect = useRef<HTMLSelectElement>(null)
  const kindFilters: readonly MealFilter[] = kinds.map((kind) => ({
    by: 'kind',
    kind,
  }))
  const categoryFilters: readonly MealFilter[] = categories.map((category) => ({
    by: 'category',
    category: category.name,
  }))

  function chooseFilter(value: string) {
    const chosen = [...kindFilters, ...categoryFilters].find(
      (filter) => filterValue(filter) === value,
    )
    onChooseFilter(chosen ?? null)
  }

  function resetFilter() {
    onChooseFilter(null)
    filterSelect.current?.focus()
  }

  function filterOption(filter: MealFilter) {
    const value = filterValue(filter)
    return (
      <option key={value} value={value}>
        {mealFilterName(filter)}
      </option>
    )
  }

  return (
    <div className="mealFilter">
      <label htmlFor="mealFilter">Filter</label>
      <select
        ref={filterSelect}
        id="mealFilter"
        value={activeFilter === null ? NO_FILTER : filterValue(activeFilter)}
        onChange={(event) => chooseFilter(event.target.value)}
      >
        <option value={NO_FILTER}>Alle</option>
        {kindFilters.length > 0 && (
          <optgroup label="Art">{kindFilters.map(filterOption)}</optgroup>
        )}
        {categoryFilters.length > 0 && (
          <optgroup label="Kategorie">
            {categoryFilters.map(filterOption)}
          </optgroup>
        )}
      </select>
      {activeFilter !== null && (
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
