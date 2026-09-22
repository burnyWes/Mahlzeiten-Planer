import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryMealsClient } from '../api/inMemoryMealsClient'
import {
  createInMemoryWeekPlanClient,
  type InMemoryWeekPlanClient,
} from '../api/inMemoryWeekPlanClient'
import type { MealsClient } from '../api/mealsClient'
import type { Meal } from '../domain/meal'
import type { RandomSource } from '../domain/randomPlanning'
import type { Supply } from '../domain/supply'
import {
  EMPTY_WEEK_PLAN,
  WEEKDAYS,
  withMealOnDay,
  type WeekPlan,
  type WeekPlanTransfer,
} from '../domain/weekPlan'
import { useMeals } from './useMeals'
import { useWeekPlan } from './useWeekPlan'
import { WeekPlanArea } from './WeekPlanArea'

function meal(id: string, name: string, items: Meal['items'] = []): Meal {
  return { id, name, items, ingredientNotes: '', recipe: '' }
}

const bolognese = meal('bolognese', 'Bolognese')
const pizza = meal('pizza', 'Pizza')
const soup = meal('soup', 'Ährensuppe')
const mushrooms = meal('mushrooms', 'Crispy Pilz')

function supply(mealId: string, count: number): Supply {
  return { mealId, count }
}

type WeekPlanAreaUnderTestProps = {
  mealsClient: MealsClient
  weekPlanClient: InMemoryWeekPlanClient
  supplies: readonly Supply[]
  announce: (text: string) => void
  random: RandomSource
  onAddToShoppingList: (transfer: WeekPlanTransfer) => void
}

function WeekPlanAreaUnderTest({
  mealsClient,
  weekPlanClient,
  supplies,
  announce,
  random,
  onAddToShoppingList,
}: WeekPlanAreaUnderTestProps) {
  return (
    <WeekPlanArea
      meals={useMeals(mealsClient).meals}
      weekPlanning={useWeekPlan(weekPlanClient)}
      supplies={supplies}
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
  initialPlan: WeekPlan = EMPTY_WEEK_PLAN,
  supplies: readonly Supply[] = [],
  random: RandomSource = alwaysFirst,
) {
  const weekPlanClient = createInMemoryWeekPlanClient(initialPlan)
  const announcements: string[] = []
  const transferred: WeekPlanTransfer[] = []
  const rendered = render(
    <WeekPlanAreaUnderTest
      mealsClient={createInMemoryMealsClient(initialMeals)}
      weekPlanClient={weekPlanClient}
      supplies={supplies}
      announce={(text) => {
        announcements.push(text)
      }}
      random={random}
      onAddToShoppingList={(transfer) => {
        transferred.push(transfer)
      }}
    />,
  )
  return { weekPlanClient, announcements, transferred, rendered }
}

function addToShoppingList() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Auf die Einkaufsliste' }),
  )
}

function shuffleDay(name: string) {
  return userEvent.click(
    screen.getByRole('button', { name: `Zufallsgericht für ${name}` }),
  )
}

function shuffleWeek() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Zufallsauswahl generieren' }),
  )
}

function dayField(name: string) {
  return screen.getByRole('textbox', { name })
}

async function typeIntoDay(name: string, text: string) {
  await userEvent.clear(dayField(name))
  await userEvent.type(dayField(name), text)
}

function suggestionsFor(name: string) {
  return within(
    screen.getByRole('list', { name: `Vorschläge für ${name}` }),
  ).getAllByRole('button')
}

function noSuggestionsFor(name: string) {
  return screen.queryByRole('list', { name: `Vorschläge für ${name}` })
}

function weekdayRows() {
  return within(screen.getByRole('main')).getAllByRole('listitem')
}

function shownWeekdays() {
  return weekdayRows().map((row) => row.querySelector('.weekday')?.textContent)
}

function markedWeekdays() {
  return weekdayRows()
    .filter((row) => row.querySelector('.supplyMark svg') !== null)
    .map((row) => row.querySelector('.weekday')?.textContent)
}

describe('WeekPlanArea', () => {
  it('shows a row for every weekday of an empty plan', () => {
    renderWeekPlanArea([bolognese])

    expect(shownWeekdays()).toEqual([
      'Mo.',
      'Di.',
      'Mi.',
      'Do.',
      'Fr.',
      'Sa.',
      'So.',
    ])
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 7' }),
    ).toHaveFocus()
  })

  it('names every field after the full weekday', () => {
    renderWeekPlanArea([bolognese])

    const weekdays = [
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
      'Sonntag',
    ]

    expect(weekdays.map((name) => dayField(name).tagName)).toEqual(
      weekdays.map(() => 'INPUT'),
    )
  })

  it('marks every day whose meal is kept in store', () => {
    renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(
        withMealOnDay(
          withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
          'tuesday',
          'pizza',
        ),
        'wednesday',
        'bolognese',
      ),
      [supply('bolognese', 2)],
    )

    expect(markedWeekdays()).toEqual(['Mo.', 'Mi.'])
  })

  it('names the field of a covered day after the supply', () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    expect(dayField('Montag, im Vorrat')).toHaveValue('Bolognese')
    expect(dayField('Dienstag')).toHaveValue('')
  })

  it('keeps the room for the mark in every row', () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    expect(
      weekdayRows().map((row) => row.querySelector('.supplyMark') !== null),
    ).toEqual(WEEKDAYS.map(() => true))
  })

  it('drops the mark when the day turns to a meal without a supply', async () => {
    renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    await userEvent.clear(dayField('Montag, im Vorrat'))
    await userEvent.type(dayField('Montag'), 'pi')
    await userEvent.click(suggestionsFor('Montag')[0])

    expect(markedWeekdays()).toEqual([])
    expect(dayField('Montag')).toHaveValue('Pizza')
  })

  it('spends a single portion on the earlier of two days', () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(
        withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
        'wednesday',
        'bolognese',
      ),
      [supply('bolognese', 1)],
    )

    expect(markedWeekdays()).toEqual(['Mo.'])
    expect(dayField('Montag, im Vorrat')).toHaveValue('Bolognese')
    expect(dayField('Mittwoch')).toHaveValue('Bolognese')
  })

  it('lets the mark move on when the covered day is emptied', async () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(
        withMealOnDay(
          withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
          'wednesday',
          'bolognese',
        ),
        'friday',
        'bolognese',
      ),
      [supply('bolognese', 1)],
    )

    await userEvent.clear(dayField('Montag, im Vorrat'))

    expect(markedWeekdays()).toEqual(['Mi.'])
    expect(dayField('Mittwoch, im Vorrat')).toHaveValue('Bolognese')
    expect(dayField('Freitag')).toHaveValue('Bolognese')
  })

  it('suggests the meals that match what was typed', async () => {
    renderWeekPlanArea([bolognese, pizza, mushrooms])

    await typeIntoDay('Montag', 'p')
    expect(noSuggestionsFor('Montag')).toBeNull()

    await typeIntoDay('Montag', 'pi')

    expect(suggestionsFor('Montag').map((one) => one.textContent)).toEqual([
      'Pizza',
      'Crispy Pilz',
    ])
    expect(noSuggestionsFor('Dienstag')).toBeNull()
  })

  it('keeps the meal of a suggestion that was pressed', async () => {
    const { weekPlanClient } = renderWeekPlanArea([bolognese, pizza])

    await typeIntoDay('Mittwoch', 'pi')
    await userEvent.click(suggestionsFor('Mittwoch')[0])

    expect(weekPlanClient.storedWeekPlan().wednesday).toBe('pizza')
    expect(dayField('Mittwoch')).toHaveValue('Pizza')
    expect(noSuggestionsFor('Mittwoch')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 1 von 7' }),
    ).toBeInTheDocument()
  })

  it('empties a day when the field is cleared', async () => {
    const { weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await userEvent.clear(dayField('Montag'))

    expect(weekPlanClient.storedWeekPlan().monday).toBeNull()
    expect(dayField('Montag')).toHaveValue('')
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 7' }),
    ).toBeInTheDocument()
  })

  it('returns to the planned meal when typing led nowhere', async () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await userEvent.type(dayField('Montag'), 'quark')
    expect(dayField('Montag')).toHaveValue('Bolognesequark')

    await userEvent.click(dayField('Dienstag'))

    expect(dayField('Montag')).toHaveValue('Bolognese')
  })

  it('shows the plan that the other device wrote', async () => {
    const { weekPlanClient } = renderWeekPlanArea([bolognese, pizza])

    await act(async () => {
      weekPlanClient.weekPlanArrivesFromElsewhere(
        withMealOnDay(EMPTY_WEEK_PLAN, 'sunday', 'bolognese'),
      )
    })

    expect(dayField('Sonntag')).toHaveValue('Bolognese')
  })

  it('shows no meal on a day whose meal was deleted meanwhile', () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'friday', 'gone'),
    )

    expect(dayField('Freitag')).toHaveValue('')
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 7' }),
    ).toBeInTheDocument()
  })

  it('reports that no meal is stored yet', async () => {
    renderWeekPlanArea()

    expect(
      screen.getByText('Noch keine Gerichte gespeichert.'),
    ).toBeInTheDocument()

    await typeIntoDay('Montag', 'bo')

    expect(noSuggestionsFor('Montag')).toBeNull()
  })

  it('shows the navigation above the plan', () => {
    renderWeekPlanArea()

    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('rolls a meal for one day and says which one it is', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([pizza])

    await shuffleDay('Montag')

    expect(weekPlanClient.storedWeekPlan().monday).toBe('pizza')
    expect(dayField('Montag')).toHaveValue('Pizza')
    expect(announcements).toEqual(['Montag, Pizza.'])
  })

  it('says that the rolled meal of the day is kept in store', async () => {
    const { announcements } = renderWeekPlanArea([pizza], EMPTY_WEEK_PLAN, [
      supply('pizza', 1),
    ])

    await shuffleDay('Montag')

    expect(announcements).toEqual(['Montag, Pizza, im Vorrat.'])
    expect(markedWeekdays()).toEqual(['Mo.'])
  })

  it('says nothing of a supply that the earlier day already spent', async () => {
    const { announcements } = renderWeekPlanArea(
      [pizza],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza'),
      [supply('pizza', 1)],
    )

    await shuffleDay('Mittwoch')

    expect(announcements).toEqual(['Mittwoch, Pizza.'])
    expect(markedWeekdays()).toEqual(['Mo.'])
  })

  it('says which meal a suggestion put on the day', async () => {
    const { announcements } = renderWeekPlanArea([bolognese, pizza])

    await typeIntoDay('Mittwoch', 'pi')
    await userEvent.click(suggestionsFor('Mittwoch')[0])

    expect(announcements).toEqual(['Mittwoch, Pizza.'])
  })

  it('says that the meal of a suggestion is kept in store', async () => {
    const { announcements } = renderWeekPlanArea(
      [bolognese, pizza],
      EMPTY_WEEK_PLAN,
      [supply('pizza', 3)],
    )

    await typeIntoDay('Mittwoch', 'pi')
    await userEvent.click(suggestionsFor('Mittwoch')[0])

    expect(announcements).toEqual(['Mittwoch, Pizza, im Vorrat.'])
  })

  it('says nothing when a field is emptied', async () => {
    const { announcements } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    await userEvent.clear(dayField('Montag, im Vorrat'))

    expect(announcements).toEqual([])
    expect(dayField('Montag')).toHaveValue('')
  })

  it('leaves the other days alone while it rolls one', async () => {
    const { weekPlanClient } = renderWeekPlanArea([pizza])

    await shuffleDay('Mittwoch')

    expect(
      WEEKDAYS.filter((day) => weekPlanClient.storedWeekPlan()[day]),
    ).toEqual(['wednesday'])
  })

  it('rolls the other meal on the second press', async () => {
    const { weekPlanClient } = renderWeekPlanArea([bolognese, pizza])

    await shuffleDay('Montag')
    expect(weekPlanClient.storedWeekPlan().monday).toBe('bolognese')

    await shuffleDay('Montag')
    expect(weekPlanClient.storedWeekPlan().monday).toBe('pizza')
  })

  it('rolls the whole week over a day that was chosen by hand', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea(
      [bolognese, pizza, soup],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'pizza'),
    )

    await shuffleWeek()

    const plan = weekPlanClient.storedWeekPlan()
    expect(WEEKDAYS.map((day) => plan[day])).toEqual([
      'soup',
      'bolognese',
      'pizza',
      'soup',
      'bolognese',
      'pizza',
      'soup',
    ])
    expect(announcements).toEqual(['Wochenplan neu gewürfelt, 7 Gerichte.'])
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 7 von 7' }),
    ).toBeInTheDocument()
  })

  it('offers no rolling without a stored meal', () => {
    renderWeekPlanArea()

    expect(
      screen.getByRole('button', { name: 'Zufallsauswahl generieren' }),
    ).toBeDisabled()
    expect(
      screen.getAllByRole('button', { name: /^Zufallsgericht für/ }),
    ).toHaveLength(7)
    screen
      .getAllByRole('button', { name: /^Zufallsgericht für/ })
      .forEach((button) => {
        expect(button).toBeDisabled()
      })
  })

  it('shows the rolling buttons as icons only', () => {
    renderWeekPlanArea([pizza])

    expect(
      screen.getByRole('button', { name: 'Zufallsgericht für Montag' })
        .textContent,
    ).toBe('')
    expect(
      screen.getByRole('button', { name: 'Zufallsauswahl generieren' })
        .textContent,
    ).toBe('')
  })

  it('offers no transfer while no day carries a meal', () => {
    renderWeekPlanArea([bolognese])

    expect(
      screen.getByRole('button', { name: 'Auf die Einkaufsliste' }),
    ).toBeDisabled()
  })

  it('hands the planned meals over in the order of the weekdays', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(
        withMealOnDay(EMPTY_WEEK_PLAN, 'friday', 'bolognese'),
        'tuesday',
        'pizza',
      ),
    )

    await addToShoppingList()

    expect(transferred).toEqual([
      { mealsToBuy: [pizza, bolognese], suppliedDays: 0 },
    ])
  })

  it('leaves out a day whose meal was deleted meanwhile', async () => {
    const { transferred, weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(
        withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'gone'),
        'sunday',
        'bolognese',
      ),
    )

    await addToShoppingList()

    expect(transferred).toEqual([{ mealsToBuy: [bolognese], suppliedDays: 0 }])
    expect(weekPlanClient.storedWeekPlan().monday).toBe('gone')
  })

  it('leaves the covered days out of the transfer', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(
        withMealOnDay(
          withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
          'tuesday',
          'pizza',
        ),
        'wednesday',
        'bolognese',
      ),
      [supply('bolognese', 1)],
    )

    await addToShoppingList()

    expect(transferred).toEqual([
      { mealsToBuy: [pizza, bolognese], suppliedDays: 1 },
    ])
  })

  it('keeps the transfer within reach when every day is covered', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    expect(
      screen.getByRole('button', { name: 'Auf die Einkaufsliste' }),
    ).toBeEnabled()

    await addToShoppingList()

    expect(transferred).toEqual([{ mealsToBuy: [], suppliedDays: 1 }])
  })

  it('leaves the plan standing after the transfer', async () => {
    const plan = withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese')
    const { weekPlanClient } = renderWeekPlanArea([bolognese], plan)

    await addToShoppingList()

    expect(weekPlanClient.storedWeekPlan()).toEqual(plan)
    expect(dayField('Montag')).toHaveValue('Bolognese')
  })

  it('has no accessibility violations after the week was rolled', async () => {
    const { rendered } = renderWeekPlanArea([bolognese, pizza, soup])

    await shuffleWeek()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations with suggestions shown', async () => {
    const { rendered } = renderWeekPlanArea([bolognese, pizza, soup])

    await typeIntoDay('Montag', 'en')

    expect(
      screen.getByRole('list', { name: 'Vorschläge für Montag' }),
    ).toBeInTheDocument()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the plan', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on a plan with a supply', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    expect(dayField('Montag, im Vorrat')).toBeInTheDocument()
    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations without a stored meal', async () => {
    const { rendered } = renderWeekPlanArea()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
