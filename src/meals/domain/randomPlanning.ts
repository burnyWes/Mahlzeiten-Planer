import type { Meal, MealKind } from './meal'
import { sameCategory } from './mealCategory'
import {
  EMPTY_WEEK_PLAN,
  MEAL_TIMES,
  mealIn,
  PLAN_SLOTS,
  sameSlot,
  shownMealIn,
  weekdayAfter,
  weekdayBefore,
  WEEKDAYS,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
  type Weekday,
} from './weekPlan'

export type RandomSource = () => number

export type MainMealTime = Extract<MealTime, 'lunch' | 'dinner'>

export type PlanningRule = (
  candidates: readonly Meal[],
  plan: WeekPlan,
  slot: PlanSlot,
  random: RandomSource,
  meals: readonly Meal[],
) => readonly Meal[]

const EVEN_CHANCE = 0.5

const STAYING_CHANCE = 0.5

const TIMES_THAT_STAY: readonly MealTime[] = ['breakfast', 'snack']

const KINDS_ROLLED_AT: Record<MealTime, readonly MealKind[]> = {
  breakfast: ['breakfast', 'snack'],
  lunch: ['mainMeal', 'none', 'snack'],
  snack: ['snack'],
  dinner: ['mainMeal', 'none', 'snack'],
}

const MAIN_MEAL_KINDS: readonly MealKind[] = ['mainMeal']

const KINDS_BESIDE_THE_MAIN_MEAL: readonly MealKind[] = ['none', 'snack']

const MAIN_MEAL_TIMES: readonly MainMealTime[] = ['lunch', 'dinner']

const KINDS_KEPT_APART: readonly MealKind[] = ['mainMeal', 'none']

export function mainMealTimeOf(random: RandomSource): MainMealTime {
  return random() < EVEN_CHANCE ? 'lunch' : 'dinner'
}

export function randomCandidates(meals: readonly Meal[]): readonly Meal[] {
  return meals.filter((meal) => !meal.hidden)
}

function isMainMealTime(time: MealTime): time is MainMealTime {
  return time === 'lunch' || time === 'dinner'
}

function otherMainMealTime(time: MainMealTime): MainMealTime {
  return time === 'lunch' ? 'dinner' : 'lunch'
}

function kindsBesideTheOtherMainMealTime(
  meals: readonly Meal[],
  plan: WeekPlan,
  day: Weekday,
  time: MainMealTime,
  random: RandomSource,
  mainMealTime: MainMealTime | null,
): readonly MealKind[] {
  const other = shownMealIn(plan, { day, time: otherMainMealTime(time) }, meals)
  if (other !== null) {
    return other.kind === 'mainMeal'
      ? KINDS_BESIDE_THE_MAIN_MEAL
      : MAIN_MEAL_KINDS
  }
  return (mainMealTime ?? mainMealTimeOf(random)) === time
    ? MAIN_MEAL_KINDS
    : KINDS_BESIDE_THE_MAIN_MEAL
}

function allowedFor(
  meals: readonly Meal[],
  plan: WeekPlan,
  slot: PlanSlot,
  random: RandomSource,
  mainMealTime: MainMealTime | null,
): readonly Meal[] {
  const suitingTheTime = randomCandidates(meals).filter((meal) =>
    KINDS_ROLLED_AT[slot.time].includes(meal.kind),
  )
  if (!isMainMealTime(slot.time)) return suitingTheTime
  const kindsOfTheDay = kindsBesideTheOtherMainMealTime(
    meals,
    plan,
    slot.day,
    slot.time,
    random,
    mainMealTime,
  )
  return suitingTheTime.filter((meal) => kindsOfTheDay.includes(meal.kind))
}

function timesPlanned(plan: WeekPlan, meal: Meal): number {
  return PLAN_SLOTS.filter((slot) => mealIn(plan, slot) === meal.id).length
}

export const rarestInThePlan: PlanningRule = (candidates, plan) => {
  const fewest = Math.min(...candidates.map((meal) => timesPlanned(plan, meal)))
  return candidates.filter((meal) => timesPlanned(plan, meal) === fewest)
}

export const otherThanPlanned: PlanningRule = (candidates, plan, slot) =>
  candidates.filter((meal) => meal.id !== mealIn(plan, slot))

function isKeptApart(meal: Meal): boolean {
  return KINDS_KEPT_APART.includes(meal.kind)
}

function neighbouringMainMealSlots(slot: PlanSlot): readonly PlanSlot[] {
  return [weekdayBefore(slot.day), slot.day, weekdayAfter(slot.day)]
    .filter((day) => day !== null)
    .flatMap((day) => MAIN_MEAL_TIMES.map((time) => ({ day, time })))
    .filter((neighbour) => !sameSlot(neighbour, slot))
}

function neighbouringCategories(
  plan: WeekPlan,
  slot: PlanSlot,
  meals: readonly Meal[],
): readonly string[] {
  return neighbouringMainMealSlots(slot).flatMap((neighbour) => {
    const planned = shownMealIn(plan, neighbour, meals)
    return planned !== null && isKeptApart(planned) ? planned.categories : []
  })
}

function sharesAnyCategory(meal: Meal, categories: readonly string[]): boolean {
  return meal.categories.some((category) =>
    categories.some((other) => sameCategory(category, other)),
  )
}

export const apartFromSameCategory: PlanningRule = (
  candidates,
  plan,
  slot,
  _random,
  meals,
) => {
  const nearby = neighbouringCategories(plan, slot, meals)
  return candidates.filter(
    (meal) => !isKeptApart(meal) || !sharesAnyCategory(meal, nearby),
  )
}

function mealOfTheDayBefore(
  candidates: readonly Meal[],
  plan: WeekPlan,
  slot: PlanSlot,
): Meal | null {
  const dayBefore = weekdayBefore(slot.day)
  if (dayBefore === null) return null
  const planned = mealIn(plan, { day: dayBefore, time: slot.time })
  return candidates.find((meal) => meal.id === planned) ?? null
}

export const stayingLikeTheDayBefore: PlanningRule = (
  candidates,
  plan,
  slot,
  random,
) => {
  if (!TIMES_THAT_STAY.includes(slot.time)) return candidates
  const yesterdays = mealOfTheDayBefore(candidates, plan, slot)
  if (yesterdays === null) return candidates
  return random() < STAYING_CHANCE
    ? [yesterdays]
    : candidates.filter((meal) => meal !== yesterdays)
}

export const PLANNING_RULES: readonly PlanningRule[] = [
  otherThanPlanned,
  apartFromSameCategory,
  stayingLikeTheDayBefore,
  rarestInThePlan,
]

export function narrowedBy(
  rules: readonly PlanningRule[],
  candidates: readonly Meal[],
  plan: WeekPlan,
  slot: PlanSlot,
  random: RandomSource,
  meals: readonly Meal[],
): readonly Meal[] {
  return rules.reduce((left, rule) => {
    const narrowed = rule(left, plan, slot, random, meals)
    return narrowed.length === 0 ? left : narrowed
  }, candidates)
}

export function pickMealFor(
  meals: readonly Meal[],
  plan: WeekPlan,
  slot: PlanSlot,
  random: RandomSource,
  mainMealTime: MainMealTime | null = null,
): Meal | null {
  const allowed = allowedFor(meals, plan, slot, random, mainMealTime)
  if (allowed.length === 0) return null
  const left = narrowedBy(PLANNING_RULES, allowed, plan, slot, random, meals)
  return left[Math.min(Math.floor(random() * left.length), left.length - 1)]
}

function filledDay(
  meals: readonly Meal[],
  plan: WeekPlan,
  day: Weekday,
  random: RandomSource,
): WeekPlan {
  const mainMealTime = mainMealTimeOf(random)
  return MEAL_TIMES.reduce((filled, time) => {
    const slot = { day, time }
    const picked = pickMealFor(meals, filled, slot, random, mainMealTime)
    return picked === null ? filled : withMealIn(filled, slot, picked.id)
  }, plan)
}

export function filledWeekPlan(
  meals: readonly Meal[],
  random: RandomSource,
): WeekPlan {
  return WEEKDAYS.reduce(
    (plan, day) => filledDay(meals, plan, day, random),
    EMPTY_WEEK_PLAN,
  )
}
