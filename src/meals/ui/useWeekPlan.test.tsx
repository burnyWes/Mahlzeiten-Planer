import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { WeekPlanClient } from '../api/weekPlanClient'
import {
  DEFAULT_MAIN_MEAL_TIME_RULE,
  type MainMealTimeRule,
} from '../domain/randomPlanning'
import { toPlanDate } from '../domain/planDate'
import type { PlanPeriod } from '../domain/planPeriod'
import {
  emptyWeekPlan,
  withMealIn,
  type PlanSlot,
  type WeekPlan,
} from '../domain/weekPlan'
import {
  EDITING_STAGE,
  FIXED_STAGE,
  transferredStage,
  type WeekPlanStage,
} from '../domain/weekPlanStage'
import { useWeekPlan } from './useWeekPlan'

const MONDAY = toPlanDate('2026-09-21')
const WEEK: PlanPeriod = { start: MONDAY, days: 7 }
const EMPTY_PLAN = emptyWeekPlan(WEEK)

type LaggingWeekPlanClient = WeekPlanClient & {
  deliverNextSnapshot(): void
  deliverNextStageSnapshot(): void
  deliverNextRuleSnapshot(): void
  weekPlanArrivesFromElsewhere(plan: WeekPlan): void
  ruleArrivesFromElsewhere(rule: MainMealTimeRule): void
  storedWeekPlan(): WeekPlan
}

function createLaggingWeekPlanClient(
  initialRule: MainMealTimeRule = DEFAULT_MAIN_MEAL_TIME_RULE,
): LaggingWeekPlanClient {
  let plan = EMPTY_PLAN
  let stage: WeekPlanStage = EDITING_STAGE
  const heldBackPlans: WeekPlan[] = []
  const heldBackStages: WeekPlanStage[] = []
  const heldBackRules: MainMealTimeRule[] = []
  let onPlan: (plan: WeekPlan) => void = () => {}
  let onStage: (stage: WeekPlanStage) => void = () => {}
  let onRule: (rule: MainMealTimeRule) => void = () => {}

  return {
    observeWeekPlan(onWeekPlan) {
      onPlan = onWeekPlan
      onWeekPlan(plan)
      return () => {}
    },
    writeWeekPlan(written) {
      plan = written
      heldBackPlans.push(written)
    },
    observeStage(onStageArriving) {
      onStage = onStageArriving
      onStageArriving(stage)
      return () => {}
    },
    writeStage(written) {
      stage = written
      heldBackStages.push(written)
    },
    observeMainMealTimeRule(onRuleArriving) {
      onRule = onRuleArriving
      onRuleArriving(initialRule)
      return () => {}
    },
    writeMainMealTimeRule(written) {
      heldBackRules.push(written)
    },
    deliverNextSnapshot() {
      onPlan(heldBackPlans.shift()!)
    },
    deliverNextStageSnapshot() {
      onStage(heldBackStages.shift()!)
    },
    deliverNextRuleSnapshot() {
      onRule(heldBackRules.shift()!)
    },
    weekPlanArrivesFromElsewhere(arriving) {
      plan = arriving
      onPlan(arriving)
    },
    ruleArrivesFromElsewhere(arriving) {
      onRule(arriving)
    },
    storedWeekPlan() {
      return plan
    },
  }
}

const mondayLunch: PlanSlot = { date: MONDAY, time: 'lunch' }
const mondayDinner: PlanSlot = { date: MONDAY, time: 'dinner' }
const tuesdayLunch: PlanSlot = { date: toPlanDate('2026-09-22'), time: 'lunch' }

function weekPlanOf(client: WeekPlanClient) {
  return renderHook(() => useWeekPlan(client, WEEK)).result
}

describe('useWeekPlan', () => {
  it('starts with an empty plan of the given period before the server answers', () => {
    const silentClient: WeekPlanClient = {
      ...createLaggingWeekPlanClient(),
      observeWeekPlan: () => () => {},
    }
    const period = { start: toPlanDate('2026-09-25'), days: 10 }

    const weekPlan = renderHook(() => useWeekPlan(silentClient, period)).result

    expect(weekPlan.current.plan).toEqual(emptyWeekPlan(period))
  })

  it('keeps a later choice when the snapshot of an earlier one arrives late', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.chooseMeal(mondayLunch, 'bolognese'))
    act(() => weekPlan.current.chooseMeal(mondayDinner, 'chili'))
    act(() => client.deliverNextSnapshot())
    act(() => weekPlan.current.chooseMeal(tuesdayLunch, 'bolognese'))

    const expected = withMealIn(
      withMealIn(
        withMealIn(EMPTY_PLAN, mondayLunch, 'bolognese'),
        mondayDinner,
        'chili',
      ),
      tuesdayLunch,
      'bolognese',
    )
    expect(weekPlan.current.plan).toEqual(expected)
    expect(client.storedWeekPlan()).toEqual(expected)
  })

  it('takes the plan of the other device once its own write is confirmed', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)
    const fromElsewhere = withMealIn(
      EMPTY_PLAN,
      { date: toPlanDate('2026-09-27'), time: 'dinner' },
      'soup',
    )

    act(() => weekPlan.current.chooseMeal(mondayLunch, 'bolognese'))
    act(() => client.deliverNextSnapshot())
    act(() => client.weekPlanArrivesFromElsewhere(fromElsewhere))

    expect(weekPlan.current.plan).toEqual(fromElsewhere)
  })

  it('keeps the transfer when the snapshot of the fixing arrives late', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeStage(FIXED_STAGE))
    act(() => weekPlan.current.changeStage(transferredStage([mondayLunch])))
    act(() => client.deliverNextStageSnapshot())

    expect(weekPlan.current.stage).toEqual(transferredStage([mondayLunch]))

    act(() => client.deliverNextStageSnapshot())

    expect(weekPlan.current.stage).toEqual(transferredStage([mondayLunch]))
  })

  it('takes the rule for the main meal time from the server', () => {
    const weekPlan = weekPlanOf(createLaggingWeekPlanClient('dinner'))

    expect(weekPlan.current.mainMealTimeRule).toBe('dinner')
  })

  it('keeps its own rule when a late snapshot of the old one arrives', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeMainMealTimeRule('lunch'))
    act(() => client.ruleArrivesFromElsewhere('lunchOrDinner'))

    expect(weekPlan.current.mainMealTimeRule).toBe('lunch')
  })

  it('takes the rule of the other device once its own is confirmed', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeMainMealTimeRule('lunch'))
    act(() => client.deliverNextRuleSnapshot())
    act(() => client.ruleArrivesFromElsewhere('dinner'))

    expect(weekPlan.current.mainMealTimeRule).toBe('dinner')
  })
})
