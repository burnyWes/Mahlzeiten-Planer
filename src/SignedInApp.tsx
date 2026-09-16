import { useState } from 'react'
import type { MealsClient } from './meals/api/mealsClient'
import { mealWithoutItemsAnnouncement } from './meals/domain/announcements'
import type { Meal } from './meals/domain/meal'
import { MealsArea } from './meals/ui/MealsArea'
import { useMeals } from './meals/ui/useMeals'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import type { ShoppingListClient } from './shopping/api/shoppingListClient'
import { additionsAnnouncement } from './shopping/domain/announcements'
import type { NewShoppingItem } from './shopping/domain/shoppingItem'
import { ShoppingArea } from './shopping/ui/ShoppingArea'
import { useShoppingList } from './shopping/ui/useShoppingList'

const AREAS = [
  { id: 'shopping', label: 'Einkaufsliste' },
  { id: 'meals', label: 'Gerichte' },
] as const satisfies readonly Area<string>[]

type AreaId = (typeof AREAS)[number]['id']

function shoppingItemsOf(meal: Meal): readonly NewShoppingItem[] {
  const createdAt = Date.now()
  return meal.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    createdAt,
  }))
}

type SignedInAppProps = {
  createShoppingListClient: (
    onWriteFailure: (message: string) => void,
  ) => ShoppingListClient
  createMealsClient: (onWriteFailure: (message: string) => void) => MealsClient
  announce: (text: string) => void
}

export function SignedInApp({
  createShoppingListClient,
  createMealsClient,
  announce,
}: SignedInAppProps) {
  const [shoppingListClient] = useState(() =>
    createShoppingListClient(announce),
  )
  const [mealsClient] = useState(() => createMealsClient(announce))
  const shoppingList = useShoppingList(shoppingListClient)
  const meals = useMeals(mealsClient)
  const [activeArea, setActiveArea] = useState<AreaId>('shopping')

  function addMealToShoppingList(meal: Meal) {
    if (meal.items.length === 0) {
      announce(mealWithoutItemsAnnouncement(meal))
      return
    }
    const summary = shoppingList.addItems(shoppingItemsOf(meal))
    announce(`${meal.name}, ${additionsAnnouncement(summary)}`)
  }

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={setActiveArea}
    />
  )

  if (activeArea === 'meals')
    return (
      <MealsArea
        meals={meals}
        announce={announce}
        navigation={navigation}
        onAddToShoppingList={addMealToShoppingList}
      />
    )

  return (
    <ShoppingArea
      shoppingList={shoppingList}
      announce={announce}
      navigation={navigation}
    />
  )
}
