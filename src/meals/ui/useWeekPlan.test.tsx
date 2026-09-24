import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { WeekPlanClient } from '../api/weekPlanClient'
import {
  EMPTY_WEEK_PLAN,
  withMealOnDay,
  type WeekPlan,
} from '../domain/weekPlan'
import {
  EDITING_STAGE,
  FIXED_STAGE,
  transferredStage,
  type WeekPlanStage,
} from '../domain/weekPlanStage'
import { useWeekPlan } from './useWeekPlan'

type LaggingWeekPlanClient = WeekPlanClient & {
  deliverNextSnapshot(): void
  deliverNextStageSnapshot(): void
  weekPlanArrivesFromElsewhere(plan: WeekPlan): void
  storedWeekPlan(): WeekPlan
}

function createLaggingWeekPlanClient(): LaggingWeekPlanClient {
  let plan = EMPTY_WEEK_PLAN
  let stage: WeekPlanStage = EDITING_STAGE
  const heldBackPlans: WeekPlan[] = []
  const heldBackStages: WeekPlanStage[] = []
  let onPlan: (plan: WeekPlan) => void = () => {}
  let onStage: (stage: WeekPlanStage) => void = () => {}

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
    deliverNextSnapshot() {
      onPlan(heldBackPlans.shift()!)
    },
    deliverNextStageSnapshot() {
      onStage(heldBackStages.shift()!)
    },
    weekPlanArrivesFromElsewhere(arriving) {
      plan = arriving
      onPlan(arriving)
    },
    storedWeekPlan() {
      return plan
    },
  }
}

function weekPlanOf(client: WeekPlanClient) {
  return renderHook(() => useWeekPlan(client)).result
}

describe('useWeekPlan', () => {
  it('keeps a later choice when the snapshot of an earlier one arrives late', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.chooseMeal('monday', 'bolognese'))
    act(() => weekPlan.current.chooseMeal('tuesday', 'chili'))
    act(() => client.deliverNextSnapshot())
    act(() => weekPlan.current.chooseMeal('wednesday', 'bolognese'))

    const expected = withMealOnDay(
      withMealOnDay(
        withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
        'tuesday',
        'chili',
      ),
      'wednesday',
      'bolognese',
    )
    expect(weekPlan.current.plan).toEqual(expected)
    expect(client.storedWeekPlan()).toEqual(expected)
  })

  it('takes the plan of the other device once its own write is confirmed', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)
    const fromElsewhere = withMealOnDay(EMPTY_WEEK_PLAN, 'sunday', 'soup')

    act(() => weekPlan.current.chooseMeal('monday', 'bolognese'))
    act(() => client.deliverNextSnapshot())
    act(() => client.weekPlanArrivesFromElsewhere(fromElsewhere))

    expect(weekPlan.current.plan).toEqual(fromElsewhere)
  })

  it('keeps the transfer when the snapshot of the fixing arrives late', () => {
    const client = createLaggingWeekPlanClient()
    const weekPlan = weekPlanOf(client)

    act(() => weekPlan.current.changeStage(FIXED_STAGE))
    act(() => weekPlan.current.changeStage(transferredStage(['monday'])))
    act(() => client.deliverNextStageSnapshot())

    expect(weekPlan.current.stage).toEqual(transferredStage(['monday']))

    act(() => client.deliverNextStageSnapshot())

    expect(weekPlan.current.stage).toEqual(transferredStage(['monday']))
  })
})
