import { useRef } from 'react'
import { CrossIcon } from '../../shared/ui/CrossIcon'
import { knownItemFilterName } from '../domain/announcements'
import type { ItemCategoryCatalog } from '../domain/itemCategory'
import type { KnownItemFilter } from '../domain/knownItem'

const NO_FILTER = ''
const UNCATEGORIZED: KnownItemFilter = { by: 'uncategorized' }

function filterValue(filter: KnownItemFilter): string {
  return filter.by === 'category'
    ? `category:${filter.categoryId}`
    : 'uncategorized'
}

type KnownItemFilterSelectProps = {
  catalog: ItemCategoryCatalog
  activeFilter: KnownItemFilter | null
  onChooseFilter: (filter: KnownItemFilter | null) => void
}

export function KnownItemFilterSelect({
  catalog,
  activeFilter,
  onChooseFilter,
}: KnownItemFilterSelectProps) {
  const filterSelect = useRef<HTMLSelectElement>(null)
  const categoryFilters: readonly KnownItemFilter[] = catalog.categories.map(
    (category) => ({ by: 'category', categoryId: category.id }),
  )

  function chooseFilter(value: string) {
    const chosen = [...categoryFilters, UNCATEGORIZED].find(
      (filter) => filterValue(filter) === value,
    )
    onChooseFilter(chosen ?? null)
  }

  function resetFilter() {
    onChooseFilter(null)
    filterSelect.current?.focus()
  }

  function filterOption(filter: KnownItemFilter) {
    const value = filterValue(filter)
    return (
      <option key={value} value={value}>
        {knownItemFilterName(catalog, filter)}
      </option>
    )
  }

  return (
    <div className="mealFilter">
      <label htmlFor="knownItemFilter">Filter</label>
      <select
        ref={filterSelect}
        id="knownItemFilter"
        value={activeFilter === null ? NO_FILTER : filterValue(activeFilter)}
        onChange={(event) => chooseFilter(event.target.value)}
      >
        <option value={NO_FILTER}>Alle</option>
        <optgroup label="Kategorie">
          {categoryFilters.map(filterOption)}
        </optgroup>
        {filterOption(UNCATEGORIZED)}
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
