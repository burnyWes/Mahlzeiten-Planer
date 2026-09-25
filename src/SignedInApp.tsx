import { useState } from 'react'
import type { MealsClient } from './meals/api/mealsClient'
import type { SuppliesClient } from './meals/api/suppliesClient'
import type { WeekPlanClient } from './meals/api/weekPlanClient'
import {
  mainMealTimeRuleName,
  mealWithoutItemsAnnouncement,
  weekPlanTransferAnnouncement,
} from './meals/domain/announcements'
import type { Meal } from './meals/domain/meal'
import {
  isMainMealTimeRule,
  MAIN_MEAL_TIME_RULES,
  type RandomSource,
} from './meals/domain/randomPlanning'
import { withoutPortions } from './meals/domain/supply'
import {
  mealsWithoutItems,
  suppliedMealCount,
  weekdayOf,
  type MealTime,
  type WeekPlanTransfer,
  type Weekday,
} from './meals/domain/weekPlan'
import type { WeekPlanView } from './meals/domain/weekPlanView'
import { CategoriesArea } from './meals/ui/CategoriesArea'
import { MealsArea } from './meals/ui/MealsArea'
import { SuppliesArea } from './meals/ui/SuppliesArea'
import { useMeals } from './meals/ui/useMeals'
import { useSupplies } from './meals/ui/useSupplies'
import { useWeekPlan } from './meals/ui/useWeekPlan'
import { WeekPlanArea } from './meals/ui/WeekPlanArea'
import type { Appearance } from './shared/appearance/useAppearance'
import type { Clock } from './shared/domain/clock'
import { CalendarIcon } from './shared/ui/CalendarIcon'
import { ChecklistIcon } from './shared/ui/ChecklistIcon'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import { PlateIcon } from './shared/ui/PlateIcon'
import { SettingsIcon } from './shared/ui/SettingsIcon'
import { SettingsPage, type SettingsEntry } from './shared/ui/SettingsPage'
import { SnowflakeIcon } from './shared/ui/SnowflakeIcon'
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
  { id: 'supplies', label: 'Vorräte', icon: <SnowflakeIcon /> },
  { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
] as const satisfies readonly Area<string>[]

type AreaId = (typeof AREAS)[number]['id']

const KNOWN_ITEMS_ENTRY = 'knownItems'
const CATEGORIES_ENTRY = 'categories'

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
  createSuppliesClient: (
    onWriteFailure: (message: string) => void,
  ) => SuppliesClient
  createKnownItemsClient: () => KnownItemsClient
  appearance: Appearance
  announce: (text: string) => void
  random?: RandomSource
  clock?: Clock
}

export function SignedInApp({
  createShoppingListClient,
  createMealsClient,
  createWeekPlanClient,
  createSuppliesClient,
  createKnownItemsClient,
  appearance,
  announce,
  random = Math.random,
  clock = () => new Date(),
}: SignedInAppProps) {
  const [shoppingListClient] = useState(() =>
    createShoppingListClient(announce),
  )
  const [mealsClient] = useState(() => createMealsClient(announce))
  const [weekPlanClient] = useState(() => createWeekPlanClient(announce))
  const [suppliesClient] = useState(() => createSuppliesClient(announce))
  const [knownItemsClient] = useState(createKnownItemsClient)
  const knownItems = useKnownItems(knownItemsClient)
  const shoppingList = useShoppingList(
    shoppingListClient,
    knownItemsClient,
    knownItems.knownItems,
  )
  const meals = useMeals(mealsClient)
  const weekPlanning = useWeekPlan(weekPlanClient)
  const supplies = useSupplies(suppliesClient)
  const [activeArea, setActiveArea] = useState<AreaId>('shopping')
  const [shownDay, setShownDay] = useState<Weekday>(() => weekdayOf(clock()))
  const [shownView, setShownView] = useState<WeekPlanView>('day')
  const [shownTime, setShownTime] = useState<MealTime>('lunch')
  const [settingsEntry, setSettingsEntry] = useState<string | null>(null)

  function addMealToShoppingList(meal: Meal) {
    if (meal.items.length === 0) {
      announce(mealWithoutItemsAnnouncement(meal))
      return
    }
    const summary = shoppingList.addItems(shoppingItemsOf([meal]))
    announce(`${meal.name}, ${additionsAnnouncement(summary)}`)
  }

  function addWeekPlanToShoppingList(transfer: WeekPlanTransfer) {
    const items = shoppingItemsOf(transfer.mealsToBuy)
    const additions =
      items.length === 0
        ? ''
        : additionsAnnouncement(shoppingList.addItems(items))
    for (const spent of transfer.spentSupplies)
      supplies.changeSupply(spent.mealId, (supply) =>
        withoutPortions(supply, spent.count),
      )
    announce(
      weekPlanTransferAnnouncement(
        additions,
        mealsWithoutItems(transfer.mealsToBuy),
        suppliedMealCount(transfer),
      ),
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
    {
      kind: 'choice',
      id: 'mainMealTimeRule',
      label: 'Hauptgericht würfeln',
      options: MAIN_MEAL_TIME_RULES.map((rule) => ({
        value: rule,
        label: mainMealTimeRuleName(rule),
      })),
      chosen: weekPlanning.mainMealTimeRule,
      onChoose: (value) => {
        if (isMainMealTimeRule(value))
          weekPlanning.changeMainMealTimeRule(value)
      },
    },
    { kind: 'page', id: KNOWN_ITEMS_ENTRY, label: 'Artikel-Verwaltung' },
    { kind: 'page', id: CATEGORIES_ENTRY, label: 'Kategorie-Verwaltung' },
  ]

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={setActiveArea}
    />
  )

  if (activeArea === 'settings' && settingsEntry === KNOWN_ITEMS_ENTRY)
    return (
      <KnownItemsArea
        knownItems={knownItems}
        announce={announce}
        onBack={() => setSettingsEntry(null)}
      />
    )

  if (activeArea === 'settings' && settingsEntry === CATEGORIES_ENTRY)
    return (
      <CategoriesArea
        meals={meals}
        announce={announce}
        onBack={() => setSettingsEntry(null)}
      />
    )

  if (activeArea === 'settings')
    return (
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
        supplies={supplies.supplies}
        shownDay={shownDay}
        onShowDay={setShownDay}
        shownView={shownView}
        onShowView={setShownView}
        shownTime={shownTime}
        onShowTime={setShownTime}
        navigation={navigation}
        announce={announce}
        random={random}
        onAddToShoppingList={addWeekPlanToShoppingList}
      />
    )

  if (activeArea === 'supplies')
    return (
      <SuppliesArea
        meals={meals.meals}
        supplies={supplies}
        announce={announce}
        navigation={navigation}
      />
    )

  if (activeArea === 'meals')
    return (
      <MealsArea
        meals={meals}
        announce={announce}
        navigation={navigation}
        onAddToShoppingList={addMealToShoppingList}
        onMealDeleted={supplies.removeSupply}
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
