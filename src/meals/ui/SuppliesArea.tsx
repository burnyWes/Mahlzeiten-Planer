import { useState, type ReactNode } from 'react'
import { supplyAddedAnnouncement } from '../domain/announcements'
import type { Meal } from '../domain/meal'
import {
  combinedSupply,
  suppliedMeals,
  supplyOf,
  type Supply,
} from '../domain/supply'
import { AddSupplyPage } from './AddSupplyPage'
import { SupplyListPage } from './SupplyListPage'
import type { Supplies } from './useSupplies'

type SuppliesPage = { kind: 'list' } | { kind: 'add' }

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

  function showList() {
    setPage({ kind: 'list' })
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

  if (page.kind === 'add')
    return (
      <AddSupplyPage
        meals={meals}
        onSave={addSupply}
        onBack={showList}
        announce={announce}
      />
    )

  return (
    <SupplyListPage
      navigation={navigation}
      supplied={suppliedMeals(supplies.supplies, meals)}
      onAddSupply={() => setPage({ kind: 'add' })}
    />
  )
}
