import { useState, type ReactNode } from 'react'
import {
  allMealsRolledAnnouncement,
  dayShownAnnouncement,
  dayViewShownAnnouncement,
  leftoversPlannedAnnouncement,
  mealTimeShownAnnouncement,
  noMatchingMealAnnouncement,
  periodAppliedAnnouncement,
  slotClearedAnnouncement,
  planEditableAnnouncement,
  planFixedAnnouncement,
  slotPlannedAnnouncement,
  weekPlanClearedAnnouncement,
  weekPlanShuffledAnnouncement,
  weekViewShownAnnouncement,
} from '../domain/announcements'
import {
  chosenInto,
  leftoversRolledAfter,
  rolledInto,
} from '../domain/leftovers'
import type { Meal, MealId } from '../domain/meal'
import {
  filledWeekPlan,
  randomCandidates,
  rollSingleMeal,
  type RandomSource,
} from '../domain/randomPlanning'
import type { PlanDate } from '../domain/planDate'
import type { PlanPeriod } from '../domain/planPeriod'
import { appliesIn } from '../domain/rollingRules'
import type { Supply } from '../domain/supply'
import {
  coveredSlotsOf,
  emptied,
  plannedMealCount,
  slotCountOf,
  weekPlanTransfer,
  withPeriod,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
  type WeekPlanTransfer,
} from '../domain/weekPlan'
import {
  canChoosePeriod,
  canClear,
  canTransfer,
  EDITING_STAGE,
  FIXED_STAGE,
  isFixed,
  slotMarkOf,
  transferredStage,
} from '../domain/weekPlanStage'
import { slotNamingIn, type WeekPlanView } from '../domain/weekPlanView'
import { PeriodPage } from './PeriodPage'
import { WeekPlanPage } from './WeekPlanPage'
import type { WeekPlanning } from './useWeekPlan'

type WeekPlanAreaProps = {
  meals: readonly Meal[]
  weekPlanning: WeekPlanning
  supplies: readonly Supply[]
  shownDay: PlanDate
  onShowDay: (day: PlanDate) => void
  shownView: WeekPlanView
  onShowView: (view: WeekPlanView) => void
  shownTime: MealTime
  onShowTime: (time: MealTime) => void
  navigation: ReactNode
  announce: (text: string) => void
  random: RandomSource
  onAddToShoppingList: (transfer: WeekPlanTransfer) => void
  onPeriodApplied: () => void
}

export function WeekPlanArea({
  meals,
  weekPlanning,
  supplies,
  shownDay,
  onShowDay,
  shownView,
  onShowView,
  shownTime,
  onShowTime,
  navigation,
  announce,
  random,
  onAddToShoppingList,
  onPeriodApplied,
}: WeekPlanAreaProps) {
  const [page, setPage] = useState<'plan' | 'period'>('plan')
  const randomCandidateCount = randomCandidates(meals).length
  const { plan, stage, rollingRules } = weekPlanning
  const plannedMeals = plannedMealCount(plan, meals)

  function showDay(day: PlanDate) {
    onShowDay(day)
    announce(dayShownAnnouncement(day))
  }

  function showView(view: WeekPlanView) {
    onShowView(view)
    announce(
      view === 'week'
        ? weekViewShownAnnouncement(shownTime)
        : dayViewShownAnnouncement(shownDay),
    )
  }

  function showTime(time: MealTime) {
    if (time === shownTime) return
    onShowTime(time)
    announce(mealTimeShownAnnouncement(time))
  }

  function chooseMeal(slot: PlanSlot, id: MealId | null) {
    const planned = chosenInto(
      weekPlanning.plan,
      slot,
      id,
      meals,
      supplies,
      rollingRules,
    )
    weekPlanning.replacePlan(planned)
    const chosen = meals.find((meal) => meal.id === id)
    if (chosen === undefined) return
    announce(plannedAnnouncement(planned, slot, chosen))
  }

  function clearSlot(slot: PlanSlot) {
    weekPlanning.chooseMeal(slot, null)
    announce(slotClearedAnnouncement(slot, slotNamingIn(shownView)))
  }

  function plannedAnnouncement(planned: WeekPlan, slot: PlanSlot, meal: Meal) {
    const slotAnnouncement = slotPlannedAnnouncement(
      slot,
      slotNamingIn(shownView),
      meal,
      slotMarkOf(stage, planned, slot, meals, supplies),
    )
    const leftoverSlot = leftoversRolledAfter(planned, slot)
    return leftoverSlot === null
      ? slotAnnouncement
      : `${slotAnnouncement} ${leftoversPlannedAnnouncement(leftoverSlot, meal)}`
  }

  function shuffleSlot(slot: PlanSlot) {
    const roll = rollSingleMeal(
      meals,
      weekPlanning.plan,
      slot,
      random,
      rollingRules,
      weekPlanning.rollMemory,
    )
    if (roll === null) {
      announce(noMatchingMealAnnouncement(slot, slotNamingIn(shownView)))
      return
    }
    weekPlanning.rememberRolls(roll.memory)
    const rolled = rolledInto(
      weekPlanning.plan,
      slot,
      roll.meal,
      meals,
      supplies,
      rollingRules,
      'singleMeal',
    )
    weekPlanning.replacePlan(rolled)
    const rolledAnnouncement = plannedAnnouncement(rolled, slot, roll.meal)
    announce(
      roll.startedOver
        ? `${allMealsRolledAnnouncement()} ${rolledAnnouncement}`
        : rolledAnnouncement,
    )
  }

  function shuffleWeek() {
    const rolled = filledWeekPlan(
      meals,
      plan.period,
      random,
      rollingRules,
      supplies,
    )
    weekPlanning.replacePlan(rolled)
    announce(
      weekPlanShuffledAnnouncement(
        plannedMealCount(rolled, meals),
        slotCountOf(rolled),
      ),
    )
  }

  function clearPlan() {
    if (!canClear(stage, plannedMeals)) return
    weekPlanning.replacePlan(emptied(plan))
    announce(weekPlanClearedAnnouncement())
  }

  function toggleStage() {
    if (isFixed(stage)) {
      weekPlanning.changeStage(EDITING_STAGE)
      announce(planEditableAnnouncement())
      return
    }
    weekPlanning.changeStage(FIXED_STAGE)
    announce(planFixedAnnouncement(plannedMeals, slotCountOf(plan)))
  }

  function addToShoppingList() {
    if (!canTransfer(stage, plannedMeals)) return
    weekPlanning.changeStage(
      transferredStage(coveredSlotsOf(plan, meals, supplies)),
    )
    onAddToShoppingList(
      weekPlanTransfer(
        plan,
        meals,
        supplies,
        appliesIn(rollingRules, 'supplies', 'transfer'),
      ),
    )
  }

  function openPeriod() {
    if (!canChoosePeriod(stage)) return
    setPage('period')
  }

  function applyPeriod(period: PlanPeriod) {
    if (!canChoosePeriod(stage)) return
    weekPlanning.replacePlan(withPeriod(plan, period))
    onPeriodApplied()
    setPage('plan')
    announce(periodAppliedAnnouncement(period))
  }

  if (page === 'period')
    return (
      <PeriodPage
        period={plan.period}
        onApply={applyPeriod}
        onBack={() => setPage('plan')}
        announce={announce}
      />
    )

  return (
    <WeekPlanPage
      navigation={navigation}
      meals={meals}
      randomCandidateCount={randomCandidateCount}
      plan={plan}
      supplies={supplies}
      shownDay={shownDay}
      onShowDay={showDay}
      shownView={shownView}
      onShowView={showView}
      shownTime={shownTime}
      onShowTime={showTime}
      onChooseMeal={chooseMeal}
      onShuffleSlot={shuffleSlot}
      onClearSlot={clearSlot}
      onShuffleWeek={shuffleWeek}
      stage={stage}
      onToggleStage={toggleStage}
      onAddToShoppingList={addToShoppingList}
      onClearPlan={clearPlan}
      onChoosePeriod={openPeriod}
    />
  )
}
