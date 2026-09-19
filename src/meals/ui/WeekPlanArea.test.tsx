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
import {
  EMPTY_WEEK_PLAN,
  WEEKDAYS,
  withMealOnDay,
  type WeekPlan,
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

type WeekPlanAreaUnderTestProps = {
  mealsClient: MealsClient
  weekPlanClient: InMemoryWeekPlanClient
  announce: (text: string) => void
  random: RandomSource
}

function WeekPlanAreaUnderTest({
  mealsClient,
  weekPlanClient,
  announce,
  random,
}: WeekPlanAreaUnderTestProps) {
  return (
    <WeekPlanArea
      meals={useMeals(mealsClient).meals}
      weekPlanning={useWeekPlan(weekPlanClient)}
      navigation={<div data-testid="navigation" />}
      announce={announce}
      random={random}
    />
  )
}

function alwaysFirst(): number {
  return 0
}

function renderWeekPlanArea(
  initialMeals: readonly Meal[] = [],
  initialPlan: WeekPlan = EMPTY_WEEK_PLAN,
  random: RandomSource = alwaysFirst,
) {
  const weekPlanClient = createInMemoryWeekPlanClient(initialPlan)
  const announcements: string[] = []
  const rendered = render(
    <WeekPlanAreaUnderTest
      mealsClient={createInMemoryMealsClient(initialMeals)}
      weekPlanClient={weekPlanClient}
      announce={(text) => {
        announcements.push(text)
      }}
      random={random}
    />,
  )
  return { weekPlanClient, announcements, rendered }
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
  return screen.getByRole('combobox', { name })
}

function shownWeekdays() {
  return within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((row) => row.firstElementChild?.textContent)
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
      weekdays.map(() => 'SELECT'),
    )
  })

  it('offers no meal and the known meals in German alphabetical order', () => {
    renderWeekPlanArea([pizza, soup, bolognese])

    expect(
      within(dayField('Montag'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Kein Gericht', 'Ährensuppe', 'Bolognese', 'Pizza'])
  })

  it('keeps a meal that was chosen by hand', async () => {
    const { weekPlanClient } = renderWeekPlanArea([bolognese, pizza])

    await userEvent.selectOptions(dayField('Mittwoch'), 'pizza')

    expect(weekPlanClient.storedWeekPlan().wednesday).toBe('pizza')
    expect(dayField('Mittwoch')).toHaveValue('pizza')
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 1 von 7' }),
    ).toBeInTheDocument()
  })

  it('empties a day again', async () => {
    const { weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await userEvent.selectOptions(dayField('Montag'), '')

    expect(weekPlanClient.storedWeekPlan().monday).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, keine von 7' }),
    ).toBeInTheDocument()
  })

  it('shows the plan that the other device wrote', async () => {
    const { weekPlanClient } = renderWeekPlanArea([bolognese, pizza])

    await act(async () => {
      weekPlanClient.weekPlanArrivesFromElsewhere(
        withMealOnDay(EMPTY_WEEK_PLAN, 'sunday', 'bolognese'),
      )
    })

    expect(dayField('Sonntag')).toHaveValue('bolognese')
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

  it('reports that no meal is stored yet', () => {
    renderWeekPlanArea()

    expect(
      screen.getByText('Noch keine Gerichte gespeichert.'),
    ).toBeInTheDocument()
    expect(
      within(dayField('Montag'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Kein Gericht'])
  })

  it('shows the navigation above the plan', () => {
    renderWeekPlanArea()

    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('rolls a meal for one day and says which one it is', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([pizza])

    await shuffleDay('Montag')

    expect(weekPlanClient.storedWeekPlan().monday).toBe('pizza')
    expect(dayField('Montag')).toHaveValue('pizza')
    expect(announcements).toEqual(['Montag, Pizza.'])
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

  it('has no accessibility violations after the week was rolled', async () => {
    const { rendered } = renderWeekPlanArea([bolognese, pizza, soup])

    await shuffleWeek()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on the plan', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations without a stored meal', async () => {
    const { rendered } = renderWeekPlanArea()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
