import { useState } from 'react'
import { MealsArea } from './meals/ui/MealsArea'
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
  announce: (text: string) => void
}

export function SignedInApp({
  createShoppingListClient,
  announce,
}: SignedInAppProps) {
  const [shoppingListClient] = useState(() =>
    createShoppingListClient(announce),
  )
  const shoppingList = useShoppingList(shoppingListClient)
  const [activeArea, setActiveArea] = useState<AreaId>('shopping')

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={setActiveArea}
    />
  )

  if (activeArea === 'meals') return <MealsArea navigation={navigation} />

  return (
    <ShoppingArea
      shoppingList={shoppingList}
      announce={announce}
      navigation={navigation}
    />
  )
}
