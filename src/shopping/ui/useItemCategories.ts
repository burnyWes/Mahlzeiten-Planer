import { useCallback, useEffect, useRef, useState } from 'react'
import { isStaleSnapshot } from '../../shared/domain/unconfirmedWrite'
import type { ItemCategoriesClient } from '../api/itemCategoriesClient'
import {
  categoryToAssign,
  EMPTY_ITEM_CATEGORY_CATALOG,
  placedItemCategory,
  sameItemCategoryCatalog,
  withCategoryAdded,
  withCategoryChanged,
  withoutItemCategory,
  withSortByCategory,
  type CategoryAssignment,
  type ItemCategoryCatalog,
  type ItemCategoryId,
  type PlacedItemCategory,
} from '../domain/itemCategory'

export type ItemCategories = {
  catalog: ItemCategoryCatalog
  loaded: boolean
  addCategory: (name: string, position: number) => PlacedItemCategory | null
  changeCategory: (
    id: ItemCategoryId,
    name: string,
    position: number,
  ) => PlacedItemCategory | null
  removeCategory: (id: ItemCategoryId) => void
  switchSortByCategory: (on: boolean) => void
  planCategoryAssignment: (typed: string) => CategoryAssignment
  applyCategoryAssignment: (assignment: CategoryAssignment) => void
}

export function useItemCategories(
  client: ItemCategoriesClient,
): ItemCategories {
  const [catalog, setCatalog] = useState(EMPTY_ITEM_CATEGORY_CATALOG)
  const [loaded, setLoaded] = useState(false)
  const latestCatalog = useRef(EMPTY_ITEM_CATEGORY_CATALOG)
  const unconfirmedCatalog = useRef<ItemCategoryCatalog | null>(null)

  useEffect(
    () =>
      client.observeCatalog((arriving) => {
        setLoaded(true)
        if (
          isStaleSnapshot(
            unconfirmedCatalog.current,
            arriving,
            sameItemCategoryCatalog,
          )
        )
          return
        unconfirmedCatalog.current = null
        latestCatalog.current = arriving
        setCatalog(arriving)
      }),
    [client],
  )

  const writeCatalog = useCallback(
    (written: ItemCategoryCatalog) => {
      unconfirmedCatalog.current = written
      latestCatalog.current = written
      setCatalog(written)
      client.writeCatalog(written)
    },
    [client],
  )

  const addCategory = useCallback(
    (name: string, position: number) => {
      const id = client.newCategoryId()
      const written = withCategoryAdded(
        latestCatalog.current,
        id,
        name,
        position,
      )
      writeCatalog(written)
      return placedItemCategory(written, id)
    },
    [client, writeCatalog],
  )

  const changeCategory = useCallback(
    (id: ItemCategoryId, name: string, position: number) => {
      const written = withCategoryChanged(
        latestCatalog.current,
        id,
        name,
        position,
      )
      if (written === latestCatalog.current) return null
      writeCatalog(written)
      return placedItemCategory(written, id)
    },
    [writeCatalog],
  )

  const removeCategory = useCallback(
    (id: ItemCategoryId) =>
      writeCatalog(withoutItemCategory(latestCatalog.current, id)),
    [writeCatalog],
  )

  const switchSortByCategory = useCallback(
    (on: boolean) =>
      writeCatalog(withSortByCategory(latestCatalog.current, on)),
    [writeCatalog],
  )

  const planCategoryAssignment = useCallback(
    (typed: string) =>
      categoryToAssign(latestCatalog.current, typed, client.newCategoryId()),
    [client],
  )

  const applyCategoryAssignment = useCallback(
    (assignment: CategoryAssignment) => {
      if (assignment.created !== null) writeCatalog(assignment.catalog)
    },
    [writeCatalog],
  )

  return {
    catalog,
    loaded,
    addCategory,
    changeCategory,
    removeCategory,
    switchSortByCategory,
    planCategoryAssignment,
    applyCategoryAssignment,
  }
}
