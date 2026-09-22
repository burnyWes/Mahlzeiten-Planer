import { useState, type ReactNode } from 'react'
import {
  supplyAddedAnnouncement,
  supplyChangedAnnouncement,
  supplyRemovedAnnouncement,
} from '../domain/announcements'
import type { Meal, MealId } from '../domain/meal'
import {
  combinedSupply,
  suppliedMeals,
  supplyOf,
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
  const supplied = suppliedMeals(supplies.supplies, meals)

  const addressedSupply =
    page.kind === 'list' || page.kind === 'add'
      ? null
      : (supplied.find((one) => one.meal.id === page.id) ?? null)

  function showList() {
    setPage({ kind: 'list' })
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
      supplied={supplied}
      onAddSupply={() => setPage({ kind: 'add' })}
      onOpenSupply={(one) => showSupply(one.meal.id)}
    />
  )
}
