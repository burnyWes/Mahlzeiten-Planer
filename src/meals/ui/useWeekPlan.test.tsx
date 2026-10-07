import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { WeekPlanClient } from '../api/weekPlanClient'
import { withLeftoversIn } from '../domain/leftovers'
import {
  DEFAULT_ROLLING_RULES,
  type RollingRules,
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
  deliverNextRulesSnapshot(): void
  weekPlanArrivesFromElsewhere(plan: WeekPlan): void
  rulesArriveFromElsewhere(rules: RollingRules): void
  storedWeekPlan(): WeekPlan
  writtenRules(): readonly RollingRules[]
}

function createLaggingWeekPlanClient(
  initialRules: RollingRules = DEFAULT_ROLLING_RULES,
): LaggingWeekPlanClient {
  let plan = EMPTY_PLAN
  let stage: WeekPlanStage = EDITING_STAGE
  const heldBackPlans: WeekPlan[] = []
  const heldBackStages: WeekPlanStage[] = []
  const heldBackRules: RollingRules[] = []
  const writtenRules: RollingRules[] = []
  let onPlan: (plan: WeekPlan) => void = () => {}
  let onStage: (stage: WeekPlanStage) => void = () => {}
  let onRules: (rules: RollingRules) => void = () => {}

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
    observeRollingRules(onRulesArriving) {
      onRules = onRulesArriving
      onRulesArriving(initialRules)
      return () => {}
    },
    writeRollingRules(written) {
      heldBackRules.push(written)
      writtenRules.push(written)
    },
    deliverNextSnapshot() {
      onPlan(heldBackPlans.shift()!)
    },
    deliverNextStageSnapshot() {
      onStage(heldBackStages.shift()!)
    },
    deliverNextRulesSnapshot() {
      onRules(heldBackRules.shift()!)
    },
    weekPlanArrivesFromElsewhere(arriving) {
      plan = arriving
      onPlan(arriving)
    },
    rulesArriveFromElsewhere(arriving) {
      onRules(arriving)
    },
    storedWeekPlan() {
      return plan
    },
    writtenRules() {
      return [...writtenRules]
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

  it('keeps its leftovers when a late snapshot differs only in them', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)
    const withoutLeftovers = withMealIn(
      withMealIn(EMPTY_PLAN, mondayDinner, 'bolognese'),
      { date: toPlanDate('2026-09-22'), time: 'dinner' },
      'bolognese',
    )
    const withLeftovers = withLeftoversIn(
      withMealIn(EMPTY_PLAN, mondayDinner, 'bolognese'),
      { date: toPlanDate('2026-09-22'), time: 'dinner' },
      'bolognese',
    )

    act(() => weekPlan.current.replacePlan(withLeftovers))
    act(() => client.weekPlanArrivesFromElsewhere(withoutLeftovers))

    expect(weekPlan.current.plan).toEqual(withLeftovers)
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

  it('takes the rolling rules from the server', () => {
    const weekPlan = weekPlanOf(
      createLaggingWeekPlanClient({
        mainMealTime: 'dinner',
        plansLeftovers: false,
      }),
    )

    expect(weekPlan.current.rollingRules).toEqual({
      mainMealTime: 'dinner',
      plansLeftovers: false,
    })
  })

  it('keeps its own rules when a late snapshot of the old ones arrives', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeMainMealTimeRule('lunch'))
    act(() => client.rulesArriveFromElsewhere(DEFAULT_ROLLING_RULES))

    expect(weekPlan.current.rollingRules.mainMealTime).toBe('lunch')
  })

  it('takes the rules of the other device once its own are confirmed', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeMainMealTimeRule('lunch'))
    act(() => client.deliverNextRulesSnapshot())
    act(() =>
      client.rulesArriveFromElsewhere({
        mainMealTime: 'dinner',
        plansLeftovers: true,
      }),
    )

    expect(weekPlan.current.rollingRules.mainMealTime).toBe('dinner')
  })

  it('keeps the leftovers when the time of the main meal changes', () => {
    const client = createLaggingWeekPlanClient({
      mainMealTime: 'lunchOrDinner',
      plansLeftovers: false,
    })
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeMainMealTimeRule('dinner'))

    expect(client.writtenRules()).toEqual([
      { mainMealTime: 'dinner', plansLeftovers: false },
    ])
  })

  it('keeps the time of the main meal when the leftovers change', () => {
    const client = createLaggingWeekPlanClient({
      mainMealTime: 'dinner',
      plansLeftovers: true,
    })
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeLeftoverPlanning(false))

    expect(weekPlan.current.rollingRules).toEqual({
      mainMealTime: 'dinner',
      plansLeftovers: false,
    })
    expect(client.writtenRules()).toEqual([
      { mainMealTime: 'dinner', plansLeftovers: false },
    ])
  })

  it('keeps its own leftover planning when a late snapshot arrives', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeLeftoverPlanning(false))
    act(() => client.rulesArriveFromElsewhere(DEFAULT_ROLLING_RULES))

    expect(weekPlan.current.rollingRules.plansLeftovers).toBe(false)
  })
})
