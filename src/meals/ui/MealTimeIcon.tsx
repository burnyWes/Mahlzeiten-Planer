import type { ComponentType } from 'react'
import type { MealTime } from '../domain/weekPlan'
import { AppleIcon } from './AppleIcon'
import { MoonIcon } from './MoonIcon'
import { SunIcon } from './SunIcon'
import { SunriseIcon } from './SunriseIcon'

const iconsByMealTime: Record<MealTime, ComponentType> = {
  breakfast: SunriseIcon,
  lunch: SunIcon,
  snack: AppleIcon,
  dinner: MoonIcon,
}

export function MealTimeIcon({ time }: { time: MealTime }) {
  const Icon = iconsByMealTime[time]
  return <Icon />
}
