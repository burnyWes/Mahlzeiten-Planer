import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryMealsClient } from '../api/inMemoryMealsClient'
import {
  createInMemoryWeekPlanClient,
  type InMemoryWeekPlanClient,
} from '../api/inMemoryWeekPlanClient'
import type { MealsClient } from '../api/mealsClient'
import { mealTimeName } from '../domain/announcements'
import type { Meal, MealKind } from '../domain/meal'
import type { MainMealTimeRule, RandomSource } from '../domain/randomPlanning'
import type { Supply } from '../domain/supply'
import { toPlanDate, type PlanDate } from '../domain/planDate'
import { datesOf, type PlanPeriod } from '../domain/planPeriod'
import {
  emptyWeekPlan,
  MEAL_TIMES,
  mealIn,
  planSlotsOf,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
  type WeekPlanTransfer,
} from '../domain/weekPlan'
import {
  FIXED_STAGE,
  transferredStage,
  type WeekPlanStage,
} from '../domain/weekPlanStage'
import type { WeekPlanView } from '../domain/weekPlanView'
import { useMeals } from './useMeals'
import { useWeekPlan } from './useWeekPlan'
import { WeekPlanArea } from './WeekPlanArea'

function meal(
  id: string,
  name: string,
  items: Meal['items'] = [],
  kind: MealKind = 'mainMeal',
): Meal {
  return {
    id,
    name,
    items,
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind,
  }
}

function hiddenMeal(
  id: string,
  name: string,
  kind: MealKind = 'mainMeal',
): Meal {
  return { ...meal(id, name, [], kind), hidden: true }
}

function breakfastMeal(id: string, name: string): Meal {
  return meal(id, name, [], 'breakfast')
}

function snackMeal(id: string, name: string): Meal {
  return meal(id, name, [], 'snack')
}

function sideMeal(id: string, name: string): Meal {
  return meal(id, name, [], 'none')
}

const bolognese = meal('bolognese', 'Bolognese')
const pizza = meal('pizza', 'Pizza')
const soup = meal('soup', 'Ährensuppe')
const mushrooms = meal('mushrooms', 'Crispy Pilz')
const chili = meal('chili', 'Chili')
const muesli = breakfastMeal('muesli', 'Müsli')
const porridge = breakfastMeal('porridge', 'Porridge')
const apple = snackMeal('apple', 'Apfel')
const bread = sideMeal('bread', 'Brot')
const everyKind = [muesli, bolognese, apple, bread]

const MONDAY = toPlanDate('2026-09-21')
const TUESDAY = toPlanDate('2026-09-22')
const WEDNESDAY = toPlanDate('2026-09-23')
const THURSDAY = toPlanDate('2026-09-24')
const FRIDAY = toPlanDate('2026-09-25')
const SUNDAY = toPlanDate('2026-09-27')

const WEEK: PlanPeriod = { start: MONDAY, days: 7 }
const WEEK_DATES = datesOf(WEEK)
const WEEK_SLOTS = planSlotsOf(WEEK)
const EMPTY_PLAN = emptyWeekPlan(WEEK)

const WEEKDAY_NAMES = [
  'Montag, 21. September',
  'Dienstag, 22. September',
  'Mittwoch, 23. September',
  'Donnerstag, 24. September',
  'Freitag, 25. September',
  'Samstag, 26. September',
  'Sonntag, 27. September',
]

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
}

function slot(date: PlanDate, time: MealTime): PlanSlot {
  return { date, time }
}

function planWith(
  ...planned: readonly (readonly [PlanSlot, string])[]
): WeekPlan {
  return planned.reduce<WeekPlan>(
    (plan, [plannedSlot, id]) => withMealIn(plan, plannedSlot, id),
    EMPTY_PLAN,
  )
}

function mealsOf(plan: WeekPlan): readonly (string | null)[] {
  return WEEK_SLOTS.map((each) => mealIn(plan, each))
}

function filledSlots(plan: WeekPlan): readonly PlanSlot[] {
  return WEEK_SLOTS.filter((each) => mealIn(plan, each) !== null)
}

type WeekPlanAreaUnderTestProps = {
  mealsClient: MealsClient
  weekPlanClient: InMemoryWeekPlanClient
  supplies: readonly Supply[]
  initialDay: PlanDate
  initialView: WeekPlanView
  initialTime: MealTime
  announce: (text: string) => void
  random: RandomSource
  onAddToShoppingList: (transfer: WeekPlanTransfer) => void
}

function WeekPlanAreaUnderTest({
  mealsClient,
  weekPlanClient,
  supplies,
  initialDay,
  initialView,
  initialTime,
  announce,
  random,
  onAddToShoppingList,
}: WeekPlanAreaUnderTestProps) {
  const [shownDay, setShownDay] = useState(initialDay)
  const [shownView, setShownView] = useState(initialView)
  const [shownTime, setShownTime] = useState(initialTime)
  return (
    <WeekPlanArea
      meals={useMeals(mealsClient).meals}
      weekPlanning={useWeekPlan(weekPlanClient, WEEK)}
      supplies={supplies}
      shownDay={shownDay}
      onShowDay={setShownDay}
      shownView={shownView}
      onShowView={setShownView}
      shownTime={shownTime}
      onShowTime={setShownTime}
      navigation={<div data-testid="navigation" />}
      announce={announce}
      random={random}
      onAddToShoppingList={onAddToShoppingList}
    />
  )
}

function alwaysFirst(): number {
  return 0
}

function renderWeekPlanArea(
  initialMeals: readonly Meal[] = [],
  initialPlan: WeekPlan = EMPTY_PLAN,
  supplies: readonly Supply[] = [],
  random: RandomSource = alwaysFirst,
  initialStage?: WeekPlanStage,
  initialDay: PlanDate = MONDAY,
  initialView: WeekPlanView = 'day',
  initialTime: MealTime = 'lunch',
  initialMainMealTimeRule?: MainMealTimeRule,
) {
  const weekPlanClient = createInMemoryWeekPlanClient(
    initialPlan,
    initialStage,
    initialMainMealTimeRule,
  )
  const mealsClient = createInMemoryMealsClient(initialMeals)
  const announcements: string[] = []
  const transferred: WeekPlanTransfer[] = []
  function areaWith(currentSupplies: readonly Supply[]) {
    return (
      <WeekPlanAreaUnderTest
        mealsClient={mealsClient}
        weekPlanClient={weekPlanClient}
        supplies={currentSupplies}
        initialDay={initialDay}
        initialView={initialView}
        initialTime={initialTime}
        announce={(text) => {
          announcements.push(text)
        }}
        random={random}
        onAddToShoppingList={(transfer) => {
          transferred.push(transfer)
        }}
      />
    )
  }
  const rendered = render(areaWith(supplies))
  function changeSupplies(changed: readonly Supply[]) {
    rendered.rerender(areaWith(changed))
  }
  return {
    weekPlanClient,
    announcements,
    transferred,
    rendered,
    changeSupplies,
  }
}

function renderWeekPlanAreaRolling(
  rule: MainMealTimeRule,
  initialMeals: readonly Meal[],
  initialPlan: WeekPlan = EMPTY_PLAN,
) {
  return renderWeekPlanArea(
    initialMeals,
    initialPlan,
    [],
    alwaysFirst,
    undefined,
    MONDAY,
    'day',
    'lunch',
    rule,
  )
}

function renderWeekPlanAreaOn(
  initialDay: PlanDate,
  initialMeals: readonly Meal[] = [],
  initialPlan: WeekPlan = EMPTY_PLAN,
  supplies: readonly Supply[] = [],
) {
  return renderWeekPlanArea(
    initialMeals,
    initialPlan,
    supplies,
    alwaysFirst,
    undefined,
    initialDay,
  )
}

function renderWeekView(
  initialMeals: readonly Meal[] = [],
  initialPlan: WeekPlan = EMPTY_PLAN,
  supplies: readonly Supply[] = [],
) {
  return renderWeekPlanArea(
    initialMeals,
    initialPlan,
    supplies,
    alwaysFirst,
    undefined,
    MONDAY,
    'week',
    'lunch',
  )
}

function mealTimeButton(name: string) {
  return within(screen.getByRole('group', { name: 'Tageszeit' })).getByRole(
    'button',
    { name },
  )
}

function weekViewButton() {
  return screen.getByRole('button', { name: 'Wochenansicht' })
}

function dayViewButton() {
  return screen.getByRole('button', { name: 'Tagesansicht' })
}

function transferButton() {
  return screen.getByRole('button', { name: 'Auf die Einkaufsliste' })
}

function spentTransferButton() {
  return screen.getByRole('button', { name: 'Schon auf der Einkaufsliste' })
}

function addToShoppingList() {
  return userEvent.click(transferButton())
}

function clearButton() {
  return screen.getByRole('button', { name: 'Wochenplan leeren' })
}

function clearPlan() {
  return userEvent.click(clearButton())
}

function fixPlan() {
  return userEvent.click(screen.getByRole('button', { name: 'Plan festlegen' }))
}

function editPlan() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Plan bearbeiten' }),
  )
}

function shuffleSlot(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Zufallsgericht für ${name}` }),
  )
}

function shuffleWeek() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Zufallsauswahl generieren' }),
  )
}

function previousDayButton() {
  return screen.getByRole('button', { name: 'Vorheriger Tag' })
}

function nextDayButton() {
  return screen.getByRole('button', { name: 'Nächster Tag' })
}

function shownDayHeading() {
  return screen.getByRole('heading', { level: 2 })
}

function mealTimeField(name: string) {
  return screen.getByRole('textbox', { name })
}

async function typeIntoMealTime(name: string, text: string) {
  await userEvent.clear(mealTimeField(name))
  await userEvent.type(mealTimeField(name), text)
}

function suggestionsFor(name: string) {
  return within(
    screen.getByRole('list', { name: `Vorschläge für ${name}` }),
  ).getAllByRole('button')
}

function noSuggestionsFor(name: string) {
  return screen.queryByRole('list', { name: `Vorschläge für ${name}` })
}

function mealTimeRows() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .filter((row) => row.classList.contains('weekPlanRow'))
}

function markedMealTimes() {
  const rows = mealTimeRows()
  return MEAL_TIMES.filter(
    (_, position) => rows[position].querySelector('.supplyMark svg') !== null,
  ).map(mealTimeName)
}

describe('WeekPlanArea', () => {
  it('shows the four meal times of the shown day', () => {
    renderWeekPlanArea([bolognese])

    const mealTimes = ['Frühstück', 'Mittagessen', 'Snack', 'Abendessen']

    expect(mealTimes.map((name) => mealTimeField(name).tagName)).toEqual(
      mealTimes.map(() => 'INPUT'),
    )
    expect(mealTimeRows()).toHaveLength(4)
    expect(shownDayHeading()).toHaveAccessibleName('Montag, 21. September')
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 28' }),
    ).toHaveFocus()
  })

  it('shows an icon in front of every meal time', () => {
    renderWeekPlanArea([bolognese])

    const marks = mealTimeRows().map((row) =>
      row.querySelector('.mealTimeMark'),
    )

    expect(marks.map((mark) => mark?.querySelector('svg') !== null)).toEqual(
      MEAL_TIMES.map(() => true),
    )
    expect(marks.map((mark) => mark?.getAttribute('aria-hidden'))).toEqual(
      MEAL_TIMES.map(() => 'true'),
    )
  })

  it('names the shown day with its date', () => {
    renderWeekPlanAreaOn(FRIDAY)

    expect(shownDayHeading()).toHaveAccessibleName('Freitag, 25. September')
    expect(
      shownDayHeading().querySelector('[aria-hidden="true"]')?.textContent,
    ).toBe('Fr. 25.09.')
  })

  it('steps to the next day and says which it is', async () => {
    const { announcements } = renderWeekPlanArea([bolognese])

    await userEvent.click(nextDayButton())

    expect(shownDayHeading()).toHaveAccessibleName('Dienstag, 22. September')
    expect(announcements).toEqual(['Dienstag, 22. September.'])
    expect(nextDayButton()).toHaveFocus()
  })

  it('steps back to the day before', async () => {
    const { announcements } = renderWeekPlanAreaOn(WEDNESDAY, [bolognese])

    await userEvent.click(previousDayButton())

    expect(shownDayHeading()).toHaveAccessibleName('Dienstag, 22. September')
    expect(announcements).toEqual(['Dienstag, 22. September.'])
    expect(previousDayButton()).toHaveFocus()
  })

  it('locks the step back on Monday', async () => {
    const { announcements } = renderWeekPlanArea([bolognese])

    expect(previousDayButton()).toHaveAttribute('aria-disabled', 'true')
    expect(nextDayButton()).toHaveAttribute('aria-disabled', 'false')

    await userEvent.click(previousDayButton())

    expect(shownDayHeading()).toHaveAccessibleName('Montag, 21. September')
    expect(announcements).toEqual([])
    expect(previousDayButton()).toHaveFocus()
  })

  it('locks the step forward on Sunday', async () => {
    const { announcements } = renderWeekPlanAreaOn(SUNDAY, [bolognese])

    expect(nextDayButton()).toHaveAttribute('aria-disabled', 'true')
    expect(previousDayButton()).toHaveAttribute('aria-disabled', 'false')

    await userEvent.click(nextDayButton())

    expect(shownDayHeading()).toHaveAccessibleName('Sonntag, 27. September')
    expect(announcements).toEqual([])
    expect(nextDayButton()).toHaveFocus()
  })

  it('shows the meals of the day that was stepped to', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(TUESDAY, 'lunch'), 'bolognese']),
    )

    expect(mealTimeField('Mittagessen')).toHaveValue('')

    await userEvent.click(nextDayButton())

    expect(mealTimeField('Mittagessen')).toHaveValue('Bolognese')
  })

  it('forgets what was typed when the day changes', async () => {
    renderWeekPlanArea([bolognese])

    await typeIntoMealTime('Frühstück', 'bo')
    await userEvent.click(nextDayButton())
    await userEvent.click(previousDayButton())

    expect(mealTimeField('Frühstück')).toHaveValue('')
  })

  it('marks every meal time whose meal is kept in store', () => {
    renderWeekPlanArea(
      [bolognese, pizza],
      planWith(
        [slot(MONDAY, 'lunch'), 'bolognese'],
        [slot(MONDAY, 'snack'), 'pizza'],
        [slot(MONDAY, 'dinner'), 'bolognese'],
      ),
      [supply('bolognese', 2)],
    )

    expect(markedMealTimes()).toEqual(['Mittagessen', 'Abendessen'])
  })

  it('names the field of a covered meal time after the supply', () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    expect(mealTimeField('Mittagessen, im Vorrat')).toHaveValue('Bolognese')
    expect(mealTimeField('Abendessen')).toHaveValue('')
  })

  it('keeps the room for the mark in every row', () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    expect(
      mealTimeRows().map((row) => row.querySelector('.supplyMark') !== null),
    ).toEqual(MEAL_TIMES.map(() => true))
  })

  it('drops the mark when the meal time turns to a meal without a supply', async () => {
    renderWeekPlanArea(
      [bolognese, pizza],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await userEvent.clear(mealTimeField('Mittagessen, im Vorrat'))
    await userEvent.type(mealTimeField('Mittagessen'), 'pi')
    await userEvent.click(suggestionsFor('Mittagessen')[0])

    expect(markedMealTimes()).toEqual([])
    expect(mealTimeField('Mittagessen')).toHaveValue('Pizza')
  })

  it('spends a single portion on the earlier of two meal times', () => {
    renderWeekPlanArea(
      [bolognese],
      planWith(
        [slot(MONDAY, 'lunch'), 'bolognese'],
        [slot(MONDAY, 'dinner'), 'bolognese'],
      ),
      [supply('bolognese', 1)],
    )

    expect(markedMealTimes()).toEqual(['Mittagessen'])
    expect(mealTimeField('Mittagessen, im Vorrat')).toHaveValue('Bolognese')
    expect(mealTimeField('Abendessen')).toHaveValue('Bolognese')
  })

  it('spends the supply on an earlier day before the shown one', () => {
    renderWeekPlanAreaOn(
      TUESDAY,
      [bolognese],
      planWith(
        [slot(MONDAY, 'dinner'), 'bolognese'],
        [slot(TUESDAY, 'breakfast'), 'bolognese'],
      ),
      [supply('bolognese', 1)],
    )

    expect(markedMealTimes()).toEqual([])
    expect(mealTimeField('Frühstück')).toHaveValue('Bolognese')
  })

  it('lets the mark move on when the covered meal time is emptied', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith(
        [slot(MONDAY, 'breakfast'), 'bolognese'],
        [slot(MONDAY, 'lunch'), 'bolognese'],
        [slot(MONDAY, 'dinner'), 'bolognese'],
      ),
      [supply('bolognese', 1)],
    )

    await userEvent.clear(mealTimeField('Frühstück, im Vorrat'))

    expect(markedMealTimes()).toEqual(['Mittagessen'])
    expect(mealTimeField('Mittagessen, im Vorrat')).toHaveValue('Bolognese')
    expect(mealTimeField('Abendessen')).toHaveValue('Bolognese')
  })

  it('suggests the meals that match what was typed', async () => {
    renderWeekPlanArea([bolognese, pizza, mushrooms])

    await typeIntoMealTime('Frühstück', 'p')
    expect(noSuggestionsFor('Frühstück')).toBeNull()

    await typeIntoMealTime('Frühstück', 'pi')

    expect(suggestionsFor('Frühstück').map((one) => one.textContent)).toEqual([
      'Pizza',
      'Crispy Pilz',
    ])
    expect(noSuggestionsFor('Mittagessen')).toBeNull()
  })

  it('keeps the meal of a suggestion that was pressed', async () => {
    const { weekPlanClient } = renderWeekPlanArea([bolognese, pizza])

    await typeIntoMealTime('Snack', 'pi')
    await userEvent.click(suggestionsFor('Snack')[0])

    expect(mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'snack'))).toBe(
      'pizza',
    )
    expect(mealTimeField('Snack')).toHaveValue('Pizza')
    expect(noSuggestionsFor('Snack')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 1 von 28' }),
    ).toBeInTheDocument()
  })

  it('empties a meal time when the field is cleared', async () => {
    const { weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await userEvent.clear(mealTimeField('Mittagessen'))

    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'lunch')),
    ).toBeNull()
    expect(mealTimeField('Mittagessen')).toHaveValue('')
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 28' }),
    ).toBeInTheDocument()
  })

  it('returns to the planned meal when typing led nowhere', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await userEvent.type(mealTimeField('Mittagessen'), 'quark')
    expect(mealTimeField('Mittagessen')).toHaveValue('Bolognesequark')

    await userEvent.click(mealTimeField('Abendessen'))

    expect(mealTimeField('Mittagessen')).toHaveValue('Bolognese')
  })

  it('shows the plan that the other device wrote', async () => {
    const { weekPlanClient } = renderWeekPlanAreaOn(SUNDAY, [bolognese, pizza])

    await act(async () => {
      weekPlanClient.weekPlanArrivesFromElsewhere(
        planWith([slot(SUNDAY, 'dinner'), 'bolognese']),
      )
    })

    expect(mealTimeField('Abendessen')).toHaveValue('Bolognese')
  })

  it('shows no meal in a meal time whose meal was deleted meanwhile', () => {
    renderWeekPlanArea([bolognese], planWith([slot(MONDAY, 'dinner'), 'gone']))

    expect(mealTimeField('Abendessen')).toHaveValue('')
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 28' }),
    ).toBeInTheDocument()
  })

  it('reports that no meal is stored yet', async () => {
    renderWeekPlanArea()

    expect(
      screen.getByText('Noch keine Gerichte gespeichert.'),
    ).toBeInTheDocument()

    await typeIntoMealTime('Frühstück', 'bo')

    expect(noSuggestionsFor('Frühstück')).toBeNull()
  })

  it('shows the navigation above the plan', () => {
    renderWeekPlanArea()

    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('names the heading after the planned meals', () => {
    renderWeekPlanArea(
      [bolognese, pizza],
      planWith(
        [slot(MONDAY, 'lunch'), 'bolognese'],
        [slot(THURSDAY, 'dinner'), 'pizza'],
      ),
    )

    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 2 von 28' }),
    ).toBeInTheDocument()
  })

  it('rolls a meal for one meal time and says which one it is', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([muesli])

    await shuffleSlot('Frühstück')

    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'breakfast')),
    ).toBe('muesli')
    expect(mealTimeField('Frühstück')).toHaveValue('Müsli')
    expect(announcements).toEqual(['Frühstück, Müsli.'])
  })

  it('says that the rolled meal of the meal time is kept in store', async () => {
    const { announcements } = renderWeekPlanArea([pizza], EMPTY_PLAN, [
      supply('pizza', 1),
    ])

    await shuffleSlot('Mittagessen')

    expect(announcements).toEqual(['Mittagessen, Pizza, im Vorrat.'])
    expect(markedMealTimes()).toEqual(['Mittagessen'])
  })

  it('says nothing of a supply that an earlier day already spent', async () => {
    const { announcements } = renderWeekPlanAreaOn(
      WEDNESDAY,
      [pizza],
      planWith([slot(MONDAY, 'lunch'), 'pizza']),
      [supply('pizza', 1)],
    )

    await shuffleSlot('Mittagessen')

    expect(announcements).toEqual(['Mittagessen, Pizza.'])
    expect(markedMealTimes()).toEqual([])
  })

  it('says which meal a suggestion put in the meal time', async () => {
    const { announcements } = renderWeekPlanArea([bolognese, pizza])

    await typeIntoMealTime('Abendessen', 'pi')
    await userEvent.click(suggestionsFor('Abendessen')[0])

    expect(announcements).toEqual(['Abendessen, Pizza.'])
  })

  it('says that the meal of a suggestion is kept in store', async () => {
    const { announcements } = renderWeekPlanArea(
      [bolognese, pizza],
      EMPTY_PLAN,
      [supply('pizza', 3)],
    )

    await typeIntoMealTime('Abendessen', 'pi')
    await userEvent.click(suggestionsFor('Abendessen')[0])

    expect(announcements).toEqual(['Abendessen, Pizza, im Vorrat.'])
  })

  it('says nothing when a field is emptied', async () => {
    const { announcements } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await userEvent.clear(mealTimeField('Mittagessen, im Vorrat'))

    expect(announcements).toEqual([])
    expect(mealTimeField('Mittagessen')).toHaveValue('')
  })

  it('leaves the other meal times alone while it rolls one', async () => {
    const { weekPlanClient } = renderWeekPlanArea([apple])

    await shuffleSlot('Snack')

    expect(filledSlots(weekPlanClient.storedWeekPlan())).toEqual([
      slot(MONDAY, 'snack'),
    ])
  })

  it('rolls the other meal on the second press', async () => {
    const { weekPlanClient } = renderWeekPlanArea([muesli, porridge])

    await shuffleSlot('Frühstück')
    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'breakfast')),
    ).toBe('muesli')

    await shuffleSlot('Frühstück')
    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'breakfast')),
    ).toBe('porridge')
  })

  it('rolls the whole week over a meal time that was chosen by hand', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea(
      everyKind,
      planWith([slot(MONDAY, 'breakfast'), 'bolognese']),
    )

    await shuffleWeek()

    const rolledEachDay = ['apple', 'bolognese', 'apple', 'bread']
    expect(mealsOf(weekPlanClient.storedWeekPlan())).toEqual(
      WEEK_SLOTS.map((_, position) => rolledEachDay[position % 4]),
    )
    expect(announcements).toEqual([
      'Wochenplan neu gewürfelt, 28 von 28 Gerichten.',
    ])
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 28 von 28' }),
    ).toBeInTheDocument()
  })

  it('rolls the whole week and not only the shown day', async () => {
    const { weekPlanClient } = renderWeekPlanAreaOn(WEDNESDAY, everyKind)

    await shuffleWeek()

    expect(filledSlots(weekPlanClient.storedWeekPlan())).toEqual(WEEK_SLOTS)
  })

  it('never rolls a hidden meal for a meal time', async () => {
    const values = [0, 0.5, 0.999]
    let rolled = 0
    const { weekPlanClient } = renderWeekPlanArea(
      [
        hiddenMeal('bolognese', 'Bolognese'),
        pizza,
        hiddenMeal('nuts', 'Nüsse', 'snack'),
        apple,
      ],
      EMPTY_PLAN,
      [],
      () => {
        const value = values[rolled % values.length]
        rolled += 1
        return value
      },
    )

    await shuffleSlot('Frühstück')
    await shuffleSlot('Mittagessen')
    await shuffleSlot('Snack')
    await shuffleSlot('Abendessen')

    expect(
      mealsOf(weekPlanClient.storedWeekPlan()).filter((id) => id !== null),
    ).toEqual(['apple', 'apple', 'apple', 'pizza'])
  })

  it('never rolls a hidden meal into the week', async () => {
    const { weekPlanClient } = renderWeekPlanArea([
      hiddenMeal('bolognese', 'Bolognese'),
      pizza,
      muesli,
      apple,
      bread,
    ])

    await shuffleWeek()

    const planned = mealsOf(weekPlanClient.storedWeekPlan())
    expect(planned).not.toContain('bolognese')
    expect(planned).not.toContain(null)
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 28 von 28' }),
    ).toBeInTheDocument()
  })

  it('leaves the slots empty that no meal suits and counts the rolled ones', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([
      bolognese,
      pizza,
    ])

    await shuffleWeek()

    expect(filledSlots(weekPlanClient.storedWeekPlan())).toHaveLength(7)
    expect(announcements).toEqual([
      'Wochenplan neu gewürfelt, 7 von 28 Gerichten.',
    ])
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 7 von 28' }),
    ).toBeInTheDocument()
  })

  it('says that no meal suits the meal time and keeps what was planned', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'breakfast'), 'bolognese']),
    )

    await shuffleSlot('Frühstück')

    expect(announcements).toEqual(['Frühstück, kein passendes Gericht.'])
    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'breakfast')),
    ).toBe('bolognese')
    expect(mealTimeField('Frühstück')).toHaveValue('Bolognese')
  })

  it('says that no meal suits the day of the week', async () => {
    const { weekPlanClient, announcements } = renderWeekView([muesli])

    await shuffleSlot('Montag, 21. September')

    expect(announcements).toEqual([
      'Montag, 21. September, kein passendes Gericht.',
    ])
    expect(filledSlots(weekPlanClient.storedWeekPlan())).toEqual([])
  })

  it('puts a main meal into the breakfast by hand', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([
      bolognese,
      muesli,
    ])

    await typeIntoMealTime('Frühstück', 'bol')
    await userEvent.click(suggestionsFor('Frühstück')[0])

    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'breakfast')),
    ).toBe('bolognese')
    expect(announcements).toEqual(['Frühstück, Bolognese.'])
  })

  it('rolls a side for the dinner beside a main meal at lunch', async () => {
    const { weekPlanClient } = renderWeekPlanArea(
      [bolognese, pizza, bread],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await shuffleSlot('Abendessen')

    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'dinner')),
    ).toBe('bread')
  })

  it('rolls the main meal of the week in the evening when the household wants it so', async () => {
    const { weekPlanClient } = renderWeekPlanAreaRolling('dinner', [
      bolognese,
      bread,
    ])

    await shuffleWeek()

    const rolled = weekPlanClient.storedWeekPlan()
    expect(
      WEEK_DATES.map((day) => [
        mealIn(rolled, slot(day, 'lunch')),
        mealIn(rolled, slot(day, 'dinner')),
      ]),
    ).toEqual(WEEK_DATES.map(() => ['bread', 'bolognese']))
  })

  it('says that no meal suits the dinner when the main meal is rolled only at lunch', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanAreaRolling(
      'lunch',
      [bolognese, pizza],
    )

    await shuffleSlot('Abendessen')

    expect(announcements).toEqual(['Abendessen, kein passendes Gericht.'])
    expect(filledSlots(weekPlanClient.storedWeekPlan())).toEqual([])
  })

  it('leaves the plan alone when the rule for the main meal changes', async () => {
    const planned = planWith([slot(MONDAY, 'dinner'), 'bolognese'])
    const { weekPlanClient } = renderWeekPlanArea([bolognese, bread], planned)

    act(() => weekPlanClient.mainMealTimeRuleArrivesFromElsewhere('lunch'))

    expect(weekPlanClient.storedWeekPlan()).toEqual(planned)
    expect(mealTimeField('Abendessen')).toHaveValue('Bolognese')
  })

  it('rolls no side of the same category beside the main meal', async () => {
    const lasagne = { ...meal('lasagne', 'Lasagne'), categories: ['Nudeln'] }
    const carbonara = {
      ...sideMeal('carbonara', 'Carbonara'),
      categories: ['Nudeln'],
    }
    const breadOfItsOwn = { ...bread, categories: ['Brot'] }
    const { weekPlanClient } = renderWeekPlanArea(
      [lasagne, carbonara, breadOfItsOwn],
      planWith([slot(MONDAY, 'lunch'), 'lasagne']),
      [],
      () => 0.99,
    )

    await shuffleSlot('Abendessen')

    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'dinner')),
    ).toBe('bread')
  })

  it('offers no rolling when every meal is hidden', () => {
    renderWeekPlanArea([
      hiddenMeal('bolognese', 'Bolognese'),
      hiddenMeal('pizza', 'Pizza'),
    ])

    expect(
      screen.getByRole('button', { name: 'Zufallsauswahl generieren' }),
    ).toBeDisabled()
    screen
      .getAllByRole('button', { name: /^Zufallsgericht für/ })
      .forEach((button) => {
        expect(button).toBeDisabled()
      })
  })

  it('suggests a hidden meal for a meal time anyway', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([
      hiddenMeal('bolognese', 'Bolognese'),
      pizza,
    ])

    await typeIntoMealTime('Frühstück', 'bol')
    await userEvent.click(suggestionsFor('Frühstück')[0])

    expect(
      mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'breakfast')),
    ).toBe('bolognese')
    expect(mealTimeField('Frühstück')).toHaveValue('Bolognese')
    expect(announcements).toEqual(['Frühstück, Bolognese.'])
  })

  it('leaves a hidden meal standing where it was planned', () => {
    renderWeekPlanArea(
      [hiddenMeal('bolognese', 'Bolognese')],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    expect(mealTimeField('Mittagessen')).toHaveValue('Bolognese')
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 1 von 28' }),
    ).toBeInTheDocument()
  })

  it('offers no rolling without a stored meal', () => {
    renderWeekPlanArea()

    expect(
      screen.getByRole('button', { name: 'Zufallsauswahl generieren' }),
    ).toBeDisabled()
    expect(
      screen.getAllByRole('button', { name: /^Zufallsgericht für/ }),
    ).toHaveLength(4)
    screen
      .getAllByRole('button', { name: /^Zufallsgericht für/ })
      .forEach((button) => {
        expect(button).toBeDisabled()
      })
  })

  it('shows the rolling, stepping and clearing buttons as icons only', () => {
    renderWeekPlanArea([pizza])

    expect(
      screen.getByRole('button', { name: 'Zufallsgericht für Frühstück' })
        .textContent,
    ).toBe('')
    expect(
      screen.getByRole('button', { name: 'Zufallsauswahl generieren' })
        .textContent,
    ).toBe('')
    expect(previousDayButton().textContent).toBe('')
    expect(nextDayButton().textContent).toBe('')
    expect(clearButton().textContent).toBe('')
    expect(weekViewButton().textContent).toBe('')
  })

  it('offers no transfer while no meal time carries a meal', async () => {
    renderWeekPlanArea([bolognese])

    await fixPlan()

    expect(transferButton()).toHaveAttribute('aria-disabled', 'true')
  })

  it('offers no transfer while the plan is being edited', () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    expect(transferButton()).toHaveAttribute('aria-disabled', 'true')
  })

  it('hands nothing over when the locked transfer is pressed', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await addToShoppingList()

    expect(transferred).toEqual([])
  })

  it('hands the planned meals over in the order of the slots', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese, pizza],
      planWith(
        [slot(MONDAY, 'dinner'), 'bolognese'],
        [slot(MONDAY, 'lunch'), 'pizza'],
      ),
    )

    await fixPlan()
    await addToShoppingList()

    expect(transferred).toEqual([
      { mealsToBuy: [pizza, bolognese], spentSupplies: [] },
    ])
  })

  it('hands over the meals of every day, not only of the shown one', async () => {
    const { transferred } = renderWeekPlanAreaOn(
      FRIDAY,
      [bolognese, pizza, soup],
      planWith(
        [slot(SUNDAY, 'snack'), 'soup'],
        [slot(FRIDAY, 'dinner'), 'bolognese'],
        [slot(MONDAY, 'lunch'), 'pizza'],
      ),
    )

    await fixPlan()
    await addToShoppingList()

    expect(transferred).toEqual([
      { mealsToBuy: [pizza, bolognese, soup], spentSupplies: [] },
    ])
  })

  it('leaves out a meal time whose meal was deleted meanwhile', async () => {
    const { transferred, weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      planWith(
        [slot(MONDAY, 'lunch'), 'gone'],
        [slot(SUNDAY, 'dinner'), 'bolognese'],
      ),
    )

    await fixPlan()
    await addToShoppingList()

    expect(transferred).toEqual([
      { mealsToBuy: [bolognese], spentSupplies: [] },
    ])
    expect(mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'lunch'))).toBe(
      'gone',
    )
  })

  it('leaves the covered meal times out of the transfer', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese, pizza],
      planWith(
        [slot(MONDAY, 'lunch'), 'bolognese'],
        [slot(MONDAY, 'snack'), 'pizza'],
        [slot(MONDAY, 'dinner'), 'bolognese'],
      ),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()

    expect(transferred).toEqual([
      {
        mealsToBuy: [pizza, bolognese],
        spentSupplies: [supply('bolognese', 1)],
      },
    ])
  })

  it('keeps the transfer within reach when every meal time is covered', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await fixPlan()

    expect(transferButton()).not.toHaveAttribute('aria-disabled', 'true')

    await addToShoppingList()

    expect(transferred).toEqual([
      { mealsToBuy: [], spentSupplies: [supply('bolognese', 1)] },
    ])
  })

  it('leaves the plan standing after the transfer', async () => {
    const plan = planWith([slot(MONDAY, 'lunch'), 'bolognese'])
    const { weekPlanClient } = renderWeekPlanArea([bolognese], plan)

    await fixPlan()
    await addToShoppingList()

    expect(weekPlanClient.storedWeekPlan()).toEqual(plan)
    expect(screen.getByText('Mittagessen, Bolognese')).toBeInTheDocument()
  })

  it('switches to reading and says how many meals are planned', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await fixPlan()

    expect(weekPlanClient.storedStage()).toEqual(FIXED_STAGE)
    expect(announcements).toEqual([
      'Plan festgelegt, 1 von 28 Gerichten geplant.',
    ])
  })

  it('says that the plan can be edited again', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([bolognese])

    await fixPlan()
    await editPlan()

    expect(weekPlanClient.storedStage()).toEqual({ mode: 'editing' })
    expect(announcements).toEqual([
      'Plan festgelegt, keine von 28 Gerichten geplant.',
      'Plan wieder bearbeitbar.',
    ])
    expect(mealTimeField('Frühstück')).toBeInTheDocument()
  })

  it('names the stage button after what it does', async () => {
    renderWeekPlanArea([bolognese])

    expect(
      screen.getByRole('button', { name: 'Plan festlegen' }).textContent,
    ).toBe('')

    await fixPlan()

    expect(
      screen.getByRole('button', { name: 'Plan bearbeiten' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Plan festlegen' })).toBeNull()
  })

  it('orders the bottom bar as rolling, stage, transfer and clearing', () => {
    const { rendered } = renderWeekPlanArea([bolognese])

    const bottomBar =
      rendered.container.querySelector<HTMLElement>('.bottomBarContent')!
    expect(
      within(bottomBar)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual([
      'Zufallsauswahl generieren',
      'Plan festlegen',
      'Auf die Einkaufsliste',
      'Wochenplan leeren',
    ])
  })

  it('shows each meal time as text while the plan is fixed', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await fixPlan()

    expect(
      screen.getByText('Mittagessen, Bolognese, im Vorrat'),
    ).toBeInTheDocument()
    expect(screen.getByText('Abendessen, nichts geplant')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(markedMealTimes()).toEqual(['Mittagessen'])
  })

  it('keeps stepping through the days while the plan is fixed', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(TUESDAY, 'snack'), 'bolognese']),
      [],
      alwaysFirst,
      FIXED_STAGE,
    )

    await userEvent.click(nextDayButton())

    expect(screen.getByText('Snack, Bolognese')).toBeInTheDocument()
  })

  it('locks the week rolling and hides the meal time rolling while the plan is fixed', async () => {
    renderWeekPlanArea([bolognese])

    await fixPlan()

    expect(
      screen.getByRole('button', { name: 'Zufallsauswahl generieren' }),
    ).toBeDisabled()
    expect(
      screen.queryAllByRole('button', { name: /^Zufallsgericht für/ }),
    ).toEqual([])
  })

  it('names the heading after the fixed plan', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await fixPlan()

    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 1 von 28, festgelegt' }),
    ).toBeInTheDocument()
  })

  it('shows the stage that the other device wrote', async () => {
    const { weekPlanClient } = renderWeekPlanArea([bolognese])

    await act(async () => {
      weekPlanClient.stageArrivesFromElsewhere(FIXED_STAGE)
    })

    expect(
      screen.getByRole('button', { name: 'Plan bearbeiten' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('keeps the stage button focused after switching', async () => {
    renderWeekPlanArea([bolognese])

    await fixPlan()

    expect(
      screen.getByRole('button', { name: 'Plan bearbeiten' }),
    ).toHaveFocus()

    await editPlan()

    expect(screen.getByRole('button', { name: 'Plan festlegen' })).toHaveFocus()
  })

  it('forgets what was typed once the plan is fixed', async () => {
    renderWeekPlanArea([bolognese])

    await typeIntoMealTime('Frühstück', 'bo')
    await fixPlan()
    await editPlan()

    expect(mealTimeField('Frühstück')).toHaveValue('')
  })

  it('starts fixed when the stored stage says so', () => {
    renderWeekPlanArea([bolognese], EMPTY_PLAN, [], alwaysFirst, FIXED_STAGE)

    expect(
      screen.getByRole('heading', {
        name: 'Wochenplan, keine von 28, festgelegt',
      }),
    ).toHaveFocus()
  })

  it('has no accessibility violations after the week was rolled', async () => {
    const { rendered } = renderWeekPlanArea([bolognese, pizza, soup])

    await shuffleWeek()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations with suggestions shown', async () => {
    const { rendered } = renderWeekPlanArea([bolognese, pizza, soup])

    await typeIntoMealTime('Frühstück', 'en')

    expect(
      screen.getByRole('list', { name: 'Vorschläge für Frühstück' }),
    ).toBeInTheDocument()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the plan', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese, pizza],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on a day in the middle of the week', async () => {
    const { rendered } = renderWeekPlanAreaOn(
      WEDNESDAY,
      [bolognese, pizza],
      planWith([slot(WEDNESDAY, 'lunch'), 'bolognese']),
    )

    expect(previousDayButton()).toHaveAttribute('aria-disabled', 'false')
    expect(nextDayButton()).toHaveAttribute('aria-disabled', 'false')
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on Sunday', async () => {
    const { rendered } = renderWeekPlanAreaOn(SUNDAY, [bolognese, pizza])

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on a plan with a supply', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese, pizza],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    expect(mealTimeField('Mittagessen, im Vorrat')).toBeInTheDocument()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('locks the transfer after it was pressed once', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await fixPlan()
    await addToShoppingList()

    expect(spentTransferButton()).toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.queryByRole('button', { name: 'Auf die Einkaufsliste' }),
    ).toBeNull()

    await userEvent.click(spentTransferButton())

    expect(transferred).toHaveLength(1)
  })

  it('keeps the transfer button focused after the transfer', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await fixPlan()
    await addToShoppingList()

    expect(spentTransferButton()).toHaveFocus()
  })

  it('records the covered slots of the transfer', async () => {
    const { weekPlanClient } = renderWeekPlanArea(
      [bolognese, pizza],
      planWith(
        [slot(MONDAY, 'lunch'), 'bolognese'],
        [slot(MONDAY, 'dinner'), 'pizza'],
      ),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()

    expect(weekPlanClient.storedStage()).toEqual({
      mode: 'reading',
      coveredSlots: [slot(MONDAY, 'lunch')],
    })
  })

  it('keeps the marks of the transfer when the supply is spent', async () => {
    const { changeSupplies } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()
    changeSupplies([])

    expect(markedMealTimes()).toEqual(['Mittagessen'])
    expect(
      screen.getByText('Mittagessen, Bolognese, im Vorrat'),
    ).toBeInTheDocument()
  })

  it('shows the live supply again once the plan is edited', async () => {
    const { changeSupplies, weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()
    changeSupplies([])
    await editPlan()

    expect(weekPlanClient.storedStage()).toEqual({ mode: 'editing' })
    expect(markedMealTimes()).toEqual([])
    expect(mealTimeField('Mittagessen')).toHaveValue('Bolognese')
  })

  it('offers the transfer again after the plan was fixed anew', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await fixPlan()
    await addToShoppingList()
    await editPlan()
    await fixPlan()

    expect(transferButton()).not.toHaveAttribute('aria-disabled', 'true')

    await addToShoppingList()

    expect(transferred).toHaveLength(2)
  })

  it('names the heading after the transfer', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await fixPlan()
    await addToShoppingList()

    expect(
      screen.getByRole('heading', {
        name: 'Wochenplan, 1 von 28, festgelegt, übertragen',
      }),
    ).toBeInTheDocument()
  })

  it('shows the transfer that the other device made', async () => {
    const { weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await act(async () => {
      weekPlanClient.stageArrivesFromElsewhere(
        transferredStage([slot(MONDAY, 'lunch')]),
      )
    })

    expect(spentTransferButton()).toHaveAttribute('aria-disabled', 'true')
    expect(markedMealTimes()).toEqual(['Mittagessen'])
  })

  it('has no accessibility violations after the transfer', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on a fixed plan', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese, pizza],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await fixPlan()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('clears every meal time of the week and says so', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea(
      [bolognese, pizza],
      planWith(
        [slot(MONDAY, 'lunch'), 'bolognese'],
        [slot(SUNDAY, 'dinner'), 'pizza'],
      ),
    )

    await clearPlan()

    expect(mealsOf(weekPlanClient.storedWeekPlan())).toEqual(
      mealsOf(EMPTY_PLAN),
    )
    expect(announcements.at(-1)).toBe('Wochenplan geleert.')
  })

  it('names the heading after the cleared plan', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await clearPlan()

    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 28' }),
    ).toBeInTheDocument()
  })

  it('keeps the clear button focused after clearing', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await clearPlan()

    expect(clearButton()).toHaveFocus()
    expect(clearButton()).toHaveAttribute('aria-disabled', 'true')
  })

  it('offers no clearing while no meal time carries a meal', () => {
    renderWeekPlanArea([bolognese])

    expect(clearButton()).toHaveAttribute('aria-disabled', 'true')
  })

  it('offers no clearing while the plan is fixed', async () => {
    const planned = planWith([slot(MONDAY, 'lunch'), 'bolognese'])
    const { weekPlanClient, announcements } = renderWeekPlanArea(
      [bolognese],
      planned,
    )

    await fixPlan()
    const announcementsBefore = announcements.length
    await clearPlan()

    expect(clearButton()).toHaveAttribute('aria-disabled', 'true')
    expect(mealsOf(weekPlanClient.storedWeekPlan())).toEqual(mealsOf(planned))
    expect(announcements).toHaveLength(announcementsBefore)
  })

  it('offers no clearing after the transfer', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await fixPlan()
    await addToShoppingList()

    expect(clearButton()).toHaveAttribute('aria-disabled', 'true')
  })

  it('has no accessibility violations after the plan was cleared', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await clearPlan()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations without a stored meal', async () => {
    const { rendered } = renderWeekPlanArea()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('offers the week view from the day view', () => {
    renderWeekPlanArea([bolognese])

    expect(weekViewButton().querySelector('svg')).not.toBeNull()
    expect(weekViewButton().textContent).toBe('')
  })

  it('switches to the week view and says which meal time it shows', async () => {
    const { announcements } = renderWeekPlanArea([bolognese])

    await userEvent.click(weekViewButton())

    expect(WEEKDAY_NAMES.map((name) => mealTimeField(name).tagName)).toEqual(
      WEEKDAY_NAMES.map(() => 'INPUT'),
    )
    expect(mealTimeRows()).toHaveLength(7)
    expect(announcements).toEqual(['Wochenansicht, Mittagessen.'])
    expect(dayViewButton()).toHaveFocus()
  })

  it('switches back to the day that was shown before', async () => {
    const { announcements } = renderWeekPlanAreaOn(WEDNESDAY, [bolognese])

    await userEvent.click(weekViewButton())
    await userEvent.click(dayViewButton())

    expect(shownDayHeading()).toHaveAccessibleName('Mittwoch, 23. September')
    expect(announcements.at(-1)).toBe('Tagesansicht, Mittwoch, 23. September.')
    expect(weekViewButton()).toHaveFocus()
  })

  it('shows the lunch of every day in the week view', () => {
    renderWeekView(
      [bolognese, chili],
      planWith(
        [slot(TUESDAY, 'lunch'), 'bolognese'],
        [slot(TUESDAY, 'dinner'), 'chili'],
      ),
    )

    expect(mealTimeField('Dienstag, 22. September')).toHaveValue('Bolognese')
  })

  it('marks each row of the week view with weekday and day of month', () => {
    renderWeekView([bolognese])

    const marks = mealTimeRows().map((row) => row.querySelector('.weekdayMark'))

    expect(marks.map((mark) => mark?.textContent)).toEqual([
      'Mo. 21.',
      'Di. 22.',
      'Mi. 23.',
      'Do. 24.',
      'Fr. 25.',
      'Sa. 26.',
      'So. 27.',
    ])
    expect(marks.map((mark) => mark?.getAttribute('aria-hidden'))).toEqual(
      WEEKDAY_NAMES.map(() => 'true'),
    )
  })

  it('names the rolling of a row after its day', async () => {
    const { weekPlanClient, announcements } = renderWeekView([pizza])

    await shuffleSlot('Montag, 21. September')

    expect(mealIn(weekPlanClient.storedWeekPlan(), slot(MONDAY, 'lunch'))).toBe(
      'pizza',
    )
    expect(announcements).toEqual(['Montag, 21. September, Pizza.'])
  })

  it('says which meal a suggestion put on a day of the week', async () => {
    const { announcements } = renderWeekView([bolognese, pizza])

    await typeIntoMealTime('Montag, 21. September', 'bo')
    await userEvent.click(suggestionsFor('Montag, 21. September')[0])

    expect(announcements).toEqual(['Montag, 21. September, Bolognese.'])
  })

  it('says that the meal of a day of the week is kept in store', async () => {
    const { announcements } = renderWeekView([bolognese, pizza], EMPTY_PLAN, [
      supply('bolognese', 1),
    ])

    await typeIntoMealTime('Montag, 21. September', 'bo')
    await userEvent.click(suggestionsFor('Montag, 21. September')[0])

    expect(announcements).toEqual([
      'Montag, 21. September, Bolognese, im Vorrat.',
    ])
  })

  it('names the field of a covered day after the supply', () => {
    renderWeekView(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    expect(mealTimeField('Montag, 21. September, im Vorrat')).toHaveValue(
      'Bolognese',
    )
    expect(mealTimeField('Dienstag, 22. September')).toHaveValue('')
  })

  it('shows each day as text while the plan is fixed', async () => {
    renderWeekView([bolognese], planWith([slot(MONDAY, 'lunch'), 'bolognese']))

    await fixPlan()

    expect(
      screen.getByText('Montag, 21. September, Bolognese'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Dienstag, 22. September, nichts geplant'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('forgets what was typed when the view changes', async () => {
    renderWeekPlanArea(
      [bolognese],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
    )

    await userEvent.type(mealTimeField('Mittagessen'), 'quark')
    await userEvent.click(weekViewButton())
    await userEvent.click(dayViewButton())

    expect(mealTimeField('Mittagessen')).toHaveValue('Bolognese')
  })

  it('keeps the week view while the plan is fixed', async () => {
    renderWeekView([bolognese])

    await fixPlan()

    expect(dayViewButton()).toBeEnabled()
    expect(dayViewButton()).not.toHaveAttribute('aria-disabled', 'true')

    await userEvent.click(dayViewButton())

    expect(weekViewButton()).toBeInTheDocument()
  })

  it('has no accessibility violations in the week view', async () => {
    const { rendered } = renderWeekView(
      [bolognese, pizza],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await typeIntoMealTime('Dienstag, 22. September', 'pi')

    expect(
      screen.getByRole('list', {
        name: 'Vorschläge für Dienstag, 22. September',
      }),
    ).toBeInTheDocument()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('offers the four meal times in the week view', () => {
    renderWeekView([bolognese])

    const buttons = within(
      screen.getByRole('group', { name: 'Tageszeit' }),
    ).getAllByRole('button')

    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Frühstück',
      'Mittagessen',
      'Snack',
      'Abendessen',
    ])
    expect(
      buttons.map((button) => button.querySelector('svg') !== null),
    ).toEqual(MEAL_TIMES.map(() => true))
    expect(buttons.map((button) => button.textContent)).toEqual(
      MEAL_TIMES.map(() => ''),
    )
  })

  it('marks the shown meal time as pressed', () => {
    renderWeekView([bolognese])

    expect(
      MEAL_TIMES.map(mealTimeName).map((name) =>
        mealTimeButton(name).getAttribute('aria-pressed'),
      ),
    ).toEqual(['false', 'true', 'false', 'false'])
  })

  it('shows the dinner of every day after the dinner was chosen', async () => {
    const { announcements } = renderWeekView(
      [bolognese, chili],
      planWith(
        [slot(TUESDAY, 'lunch'), 'bolognese'],
        [slot(TUESDAY, 'dinner'), 'chili'],
      ),
    )

    await userEvent.click(mealTimeButton('Abendessen'))

    expect(mealTimeField('Dienstag, 22. September')).toHaveValue('Chili')
    expect(mealTimeButton('Abendessen')).toHaveAttribute('aria-pressed', 'true')
    expect(mealTimeButton('Mittagessen')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(announcements).toEqual(['Abendessen.'])
    expect(mealTimeButton('Abendessen')).toHaveFocus()
  })

  it('says nothing when the shown meal time is chosen again', async () => {
    const { announcements } = renderWeekView([bolognese])

    await userEvent.click(mealTimeButton('Mittagessen'))

    expect(announcements).toEqual([])
    expect(mealTimeButton('Mittagessen')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('names the meal time in a hidden heading of the week view', async () => {
    renderWeekView([bolognese])

    expect(shownDayHeading()).toHaveAccessibleName('Mittagessen')
    expect(shownDayHeading()).toHaveClass('visuallyHidden')

    await userEvent.click(mealTimeButton('Snack'))

    expect(shownDayHeading()).toHaveAccessibleName('Snack')
  })

  it('names the meal time that was chosen when switching to the week', async () => {
    const { announcements } = renderWeekPlanArea(
      [bolognese],
      EMPTY_PLAN,
      [],
      alwaysFirst,
      undefined,
      MONDAY,
      'day',
      'snack',
    )

    await userEvent.click(weekViewButton())

    expect(announcements).toEqual(['Wochenansicht, Snack.'])
  })

  it('keeps the shown day when the meal time changes', async () => {
    renderWeekPlanAreaOn(FRIDAY, [bolognese])

    await userEvent.click(weekViewButton())
    await userEvent.click(mealTimeButton('Abendessen'))
    await userEvent.click(dayViewButton())

    expect(shownDayHeading()).toHaveAccessibleName('Freitag, 25. September')
  })

  it('forgets what was typed when the meal time changes', async () => {
    renderWeekView([bolognese], planWith([slot(MONDAY, 'lunch'), 'bolognese']))

    await userEvent.type(mealTimeField('Montag, 21. September'), 'quark')
    await userEvent.click(mealTimeButton('Abendessen'))
    await userEvent.click(mealTimeButton('Mittagessen'))

    expect(mealTimeField('Montag, 21. September')).toHaveValue('Bolognese')
  })

  it('has no accessibility violations with another meal time chosen', async () => {
    const { rendered } = renderWeekView(
      [bolognese, pizza],
      planWith([slot(MONDAY, 'dinner'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await userEvent.click(mealTimeButton('Abendessen'))

    expect(mealTimeField('Montag, 21. September, im Vorrat')).toHaveValue(
      'Bolognese',
    )
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations in the week view of a fixed plan', async () => {
    const { rendered } = renderWeekView(
      [bolognese, pizza],
      planWith([slot(MONDAY, 'lunch'), 'bolognese']),
      [supply('bolognese', 1)],
    )

    await fixPlan()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
