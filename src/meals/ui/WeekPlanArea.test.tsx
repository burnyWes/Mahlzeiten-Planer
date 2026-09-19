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
import {
  EMPTY_WEEK_PLAN,
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
}

function WeekPlanAreaUnderTest({
  mealsClient,
  weekPlanClient,
}: WeekPlanAreaUnderTestProps) {
  return (
    <WeekPlanArea
      meals={useMeals(mealsClient).meals}
      weekPlanning={useWeekPlan(weekPlanClient)}
      navigation={<div data-testid="navigation" />}
    />
  )
}

function renderWeekPlanArea(
  initialMeals: readonly Meal[] = [],
  initialPlan: WeekPlan = EMPTY_WEEK_PLAN,
) {
  const weekPlanClient = createInMemoryWeekPlanClient(initialPlan)
  const rendered = render(
    <WeekPlanAreaUnderTest
      mealsClient={createInMemoryMealsClient(initialMeals)}
      weekPlanClient={weekPlanClient}
    />,
  )
  return { weekPlanClient, rendered }
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
