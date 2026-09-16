import { useState } from 'react'
import type { MealsClient } from './meals/api/mealsClient'
import { MealsArea } from './meals/ui/MealsArea'
import { useMeals } from './meals/ui/useMeals'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import type { ShoppingListClient } from './shopping/api/shoppingListClient'
import { ShoppingArea } from './shopping/ui/ShoppingArea'
import { useShoppingList } from './shopping/ui/useShoppingList'

const AREAS = [
  { id: 'shopping', label: 'Einkaufsliste' },
  { id: 'meals', label: 'Gerichte' },
] as const satisfies readonly Area<string>[]

type AreaId = (typeof AREAS)[number]['id']

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

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={setActiveArea}
    />
  )

  if (activeArea === 'meals')
    return (
      <MealsArea meals={meals} announce={announce} navigation={navigation} />
    )

  return (
    <ShoppingArea
      shoppingList={shoppingList}
      announce={announce}
      navigation={navigation}
    />
  )
}
