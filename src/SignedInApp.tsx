import { useState } from 'react'
import type { MealsClient } from './meals/api/mealsClient'
import type { WeekPlanClient } from './meals/api/weekPlanClient'
import {
  mealWithoutItemsAnnouncement,
  weekPlanTransferAnnouncement,
} from './meals/domain/announcements'
import type { Meal } from './meals/domain/meal'
import type { RandomSource } from './meals/domain/randomPlanning'
import { mealsWithoutItems } from './meals/domain/weekPlan'
import { MealsArea } from './meals/ui/MealsArea'
import { useMeals } from './meals/ui/useMeals'
import { useWeekPlan } from './meals/ui/useWeekPlan'
import { WeekPlanArea } from './meals/ui/WeekPlanArea'
import type { Appearance } from './shared/appearance/useAppearance'
import { CalendarIcon } from './shared/ui/CalendarIcon'
import { ChecklistIcon } from './shared/ui/ChecklistIcon'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import { PlateIcon } from './shared/ui/PlateIcon'
import { SettingsIcon } from './shared/ui/SettingsIcon'
import { SettingsPage, type SettingsEntry } from './shared/ui/SettingsPage'
import type { KnownItemsClient } from './shopping/api/knownItemsClient'
import type { ShoppingListClient } from './shopping/api/shoppingListClient'
import { additionsAnnouncement } from './shopping/domain/announcements'
import { suggestNames, withNamesInUse } from './shopping/domain/knownItem'
import type { NewShoppingItem } from './shopping/domain/shoppingItem'
import { KnownItemsArea } from './shopping/ui/KnownItemsArea'
import { ShoppingArea } from './shopping/ui/ShoppingArea'
import { useKnownItems } from './shopping/ui/useKnownItems'
import { useShoppingList } from './shopping/ui/useShoppingList'

const AREAS = [
  { id: 'shopping', label: 'Einkaufsliste', icon: <ChecklistIcon /> },
  { id: 'weekPlan', label: 'Wochenplan', icon: <CalendarIcon /> },
  { id: 'meals', label: 'Gerichte', icon: <PlateIcon /> },
  { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
] as const satisfies readonly Area<string>[]

type AreaId = (typeof AREAS)[number]['id']

const KNOWN_ITEMS_ENTRY = 'knownItems'

function shoppingItemsOf(meals: readonly Meal[]): readonly NewShoppingItem[] {
  const createdAt = Date.now()
  return meals.flatMap((meal) =>
    meal.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      createdAt,
    })),
  )
}

type SignedInAppProps = {
  createShoppingListClient: (
    onWriteFailure: (message: string) => void,
  ) => ShoppingListClient
  createMealsClient: (onWriteFailure: (message: string) => void) => MealsClient
  createWeekPlanClient: (
    onWriteFailure: (message: string) => void,
  ) => WeekPlanClient
  createKnownItemsClient: () => KnownItemsClient
  appearance: Appearance
  announce: (text: string) => void
  random?: RandomSource
}

export function SignedInApp({
  createShoppingListClient,
  createMealsClient,
  createWeekPlanClient,
  createKnownItemsClient,
  appearance,
  announce,
  random = Math.random,
}: SignedInAppProps) {
  const [shoppingListClient] = useState(() =>
    createShoppingListClient(announce),
  )
  const [mealsClient] = useState(() => createMealsClient(announce))
  const [weekPlanClient] = useState(() => createWeekPlanClient(announce))
  const [knownItemsClient] = useState(createKnownItemsClient)
  const knownItems = useKnownItems(knownItemsClient)
  const shoppingList = useShoppingList(
    shoppingListClient,
    knownItemsClient,
    knownItems.knownItems,
  )
  const meals = useMeals(mealsClient)
  const weekPlanning = useWeekPlan(weekPlanClient)
  const [activeArea, setActiveArea] = useState<AreaId>('shopping')
  const [settingsEntry, setSettingsEntry] = useState<string | null>(null)

  function addMealToShoppingList(meal: Meal) {
    if (meal.items.length === 0) {
      announce(mealWithoutItemsAnnouncement(meal))
      return
    }
    const summary = shoppingList.addItems(shoppingItemsOf([meal]))
    announce(`${meal.name}, ${additionsAnnouncement(summary)}`)
  }

  function addWeekPlanToShoppingList(planned: readonly Meal[]) {
    const items = shoppingItemsOf(planned)
    const additions =
      items.length === 0
        ? ''
        : additionsAnnouncement(shoppingList.addItems(items))
    announce(
      weekPlanTransferAnnouncement(additions, mealsWithoutItems(planned)),
    )
  }

  function suggestKnownNames(typed: string) {
    const mealItemNames = meals.meals.flatMap((meal) =>
      meal.items.map((item) => item.name),
    )
    return suggestNames(
      withNamesInUse(knownItems.knownItems, mealItemNames),
      typed,
    )
  }

  const settingsEntries: readonly SettingsEntry[] = [
    {
      kind: 'toggle',
      id: 'invertedColors',
      label: 'Farben invertieren',
      enabled: appearance.invertedColors,
      onToggle: appearance.toggleInvertedColors,
    },
    { kind: 'page', id: KNOWN_ITEMS_ENTRY, label: 'Artikelverwaltung' },
  ]

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={setActiveArea}
    />
  )

  if (activeArea === 'settings')
    return settingsEntry === KNOWN_ITEMS_ENTRY ? (
      <KnownItemsArea
        knownItems={knownItems}
        announce={announce}
        onBack={() => setSettingsEntry(null)}
      />
    ) : (
      <SettingsPage
        navigation={navigation}
        entries={settingsEntries}
        onOpenEntry={setSettingsEntry}
      />
    )

  if (activeArea === 'weekPlan')
    return (
      <WeekPlanArea
        meals={meals.meals}
        weekPlanning={weekPlanning}
        navigation={navigation}
        announce={announce}
        random={random}
        onAddToShoppingList={addWeekPlanToShoppingList}
      />
    )

  if (activeArea === 'meals')
    return (
      <MealsArea
        meals={meals}
        announce={announce}
        navigation={navigation}
        onAddToShoppingList={addMealToShoppingList}
        suggestNames={suggestKnownNames}
      />
    )

  return (
    <ShoppingArea
      shoppingList={shoppingList}
      announce={announce}
      navigation={navigation}
      suggestNames={suggestKnownNames}
    />
  )
}
