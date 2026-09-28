import { useState, type ReactNode } from 'react'
import {
  supplyAddedAnnouncement,
  supplyChangedAnnouncement,
  supplyFilterAnnouncement,
  supplyFilterResetAnnouncement,
  supplyRemovedAnnouncement,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import { mealCategories } from '../domain/mealCategory'
import {
  knownFilter,
  suppliesMatching,
  usedMealKinds,
  type MealFilter,
} from '../domain/mealFilter'
import {
  combinedSupply,
  suppliedMeals,
  supplyOf,
  withOneLess,
  withOneMore,
  type SuppliedMeal,
  type Supply,
} from '../domain/supply'
import { AddSupplyPage } from './AddSupplyPage'
import { DeleteSupplyPage } from './DeleteSupplyPage'
import { SupplyListPage } from './SupplyListPage'
import { SupplyPage } from './SupplyPage'
import type { Supplies } from './useSupplies'

type SuppliesPage =
  | { kind: 'list' }
  | { kind: 'add' }
  | { kind: 'supply'; id: MealId }
  | { kind: 'delete'; id: MealId }

type SuppliesAreaProps = {
  meals: readonly Meal[]
  supplies: Supplies
  announce: (text: string) => void
  navigation: ReactNode
}

export function SuppliesArea({
  meals,
  supplies,
  announce,
  navigation,
}: SuppliesAreaProps) {
  const [page, setPage] = useState<SuppliesPage>({ kind: 'list' })
  const [chosenFilter, setChosenFilter] = useState<MealFilter | null>(null)
  const supplied = suppliedMeals(supplies.supplies, meals)
  const suppliedDishes = supplied.map((one) => one.meal)
  const kinds = usedMealKinds(suppliedDishes)
  const categories = mealCategories(suppliedDishes)
  const activeFilter = knownFilter(kinds, categories, chosenFilter)
  const shownSupplied = suppliesMatching(supplied, activeFilter)
  const chosenFilterIsGone = chosenFilter !== null && activeFilter === null
  if (chosenFilterIsGone) setChosenFilter(null)

  const addressedSupply =
    page.kind === 'list' || page.kind === 'add'
      ? null
      : (supplied.find((one) => one.meal.id === page.id) ?? null)

  function showList() {
    setPage({ kind: 'list' })
  }

  function chooseFilter(filter: MealFilter | null) {
    setChosenFilter(filter)
    announce(
      filter === null
        ? supplyFilterResetAnnouncement(supplied.length)
        : supplyFilterAnnouncement(
            filter,
            suppliesMatching(supplied, filter).length,
            supplied.length,
          ),
    )
  }

  function showSupply(id: MealId) {
    setPage({ kind: 'supply', id })
  }

  function addSupply(added: Supply) {
    const combined = combinedSupply(
      supplyOf(supplies.supplies, added.mealId),
      added,
    )
    const meal = meals.find((known) => known.id === added.mealId)
    if (meal === undefined) return
    supplies.keepSupply(combined)
    showList()
    announce(supplyAddedAnnouncement(meal, added.count, combined.count))
  }

  function recount(one: SuppliedMeal, recounted: Supply) {
    supplies.keepSupply(recounted)
    showList()
    announce(supplyChangedAnnouncement(one.meal, recounted.count))
  }

  function changeCount(
    one: SuppliedMeal,
    change: (supply: Supply) => Supply | null,
  ) {
    const changed = supplies.changeSupply(one.meal.id, change)
    if (changed === null) {
      announce(supplyRemovedAnnouncement(one.meal, supplied.length - 1))
      return
    }
    announce(supplyChangedAnnouncement(one.meal, changed.count))
  }

  function deleteSupply(one: SuppliedMeal) {
    supplies.removeSupply(one.meal.id)
    showList()
    announce(supplyRemovedAnnouncement(one.meal, supplied.length - 1))
  }

  if (page.kind === 'add')
    return (
      <AddSupplyPage
        meals={meals}
        onSave={addSupply}
        onBack={showList}
        announce={announce}
      />
    )

  if (page.kind === 'supply' && addressedSupply !== null)
    return (
      <SupplyPage
        supplied={addressedSupply}
        onSave={(recounted) => recount(addressedSupply, recounted)}
        onBack={showList}
        onDelete={() =>
          setPage({ kind: 'delete', id: addressedSupply.meal.id })
        }
        announce={announce}
      />
    )

  if (page.kind === 'delete' && addressedSupply !== null)
    return (
      <DeleteSupplyPage
        meal={addressedSupply.meal}
        onDelete={() => deleteSupply(addressedSupply)}
        onCancel={() => showSupply(addressedSupply.meal.id)}
      />
    )

  return (
    <SupplyListPage
      navigation={navigation}
      supplied={shownSupplied}
      totalCount={supplied.length}
      kinds={kinds}
      categories={categories}
      activeFilter={activeFilter}
      onChooseFilter={chooseFilter}
      onAddSupply={() => setPage({ kind: 'add' })}
      onOpenSupply={(one) => showSupply(one.meal.id)}
      onLessSupply={(one) => changeCount(one, withOneLess)}
      onMoreSupply={(one) => changeCount(one, withOneMore)}
    />
  )
}
