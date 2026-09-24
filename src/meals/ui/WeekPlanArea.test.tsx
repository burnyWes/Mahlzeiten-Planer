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
import {
  FIXED_STAGE,
  transferredStage,
  type WeekPlanStage,
} from '../domain/weekPlanStage'
import { useMeals } from './useMeals'
import { useWeekPlan } from './useWeekPlan'
import { WeekPlanArea } from './WeekPlanArea'

function meal(id: string, name: string, items: Meal['items'] = []): Meal {
  return {
    id,
    name,
    items,
    ingredientNotes: '',
    recipe: '',
    categories: [],
    hidden: false,
    kind: 'mainMeal',
  }
}

function hiddenMeal(id: string, name: string): Meal {
  return { ...meal(id, name), hidden: true }
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
  initialStage?: WeekPlanStage,
) {
  const weekPlanClient = createInMemoryWeekPlanClient(initialPlan, initialStage)
  const mealsClient = createInMemoryMealsClient(initialMeals)
  const announcements: string[] = []
  const transferred: WeekPlanTransfer[] = []
  function areaWith(currentSupplies: readonly Supply[]) {
    return (
      <WeekPlanAreaUnderTest
        mealsClient={mealsClient}
        weekPlanClient={weekPlanClient}
        supplies={currentSupplies}
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

function transferButton() {
  return screen.getByRole('button', { name: 'Auf die Einkaufsliste' })
}

function spentTransferButton() {
  return screen.getByRole('button', { name: 'Schon auf der Einkaufsliste' })
}

function addToShoppingList() {
  return userEvent.click(transferButton())
}

function fixPlan() {
  return userEvent.click(screen.getByRole('button', { name: 'Plan festlegen' }))
}

function editPlan() {
  return userEvent.click(
    screen.getByRole('button', { name: 'Plan bearbeiten' }),
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

  it('never rolls a hidden meal for a day', async () => {
    const values = [0, 0.5, 0.999]
    let rolled = 0
    const { weekPlanClient } = renderWeekPlanArea(
      [hiddenMeal('bolognese', 'Bolognese'), pizza],
      EMPTY_WEEK_PLAN,
      [],
      () => {
        const value = values[rolled % values.length]
        rolled += 1
        return value
      },
    )

    await shuffleDay('Montag')
    await shuffleDay('Dienstag')
    await shuffleDay('Mittwoch')

    const plan = weekPlanClient.storedWeekPlan()
    expect([plan.monday, plan.tuesday, plan.wednesday]).toEqual([
      'pizza',
      'pizza',
      'pizza',
    ])
  })

  it('never rolls a hidden meal into the week', async () => {
    const { weekPlanClient } = renderWeekPlanArea([
      hiddenMeal('bolognese', 'Bolognese'),
      pizza,
      soup,
    ])

    await shuffleWeek()

    const plan = weekPlanClient.storedWeekPlan()
    expect(WEEKDAYS.map((day) => plan[day])).not.toContain('bolognese')
    expect(WEEKDAYS.map((day) => plan[day])).not.toContain(null)
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 7 von 7' }),
    ).toBeInTheDocument()
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

  it('suggests a hidden meal for a day anyway', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([
      hiddenMeal('bolognese', 'Bolognese'),
      pizza,
    ])

    await typeIntoDay('Montag', 'bol')
    await userEvent.click(suggestionsFor('Montag')[0])

    expect(weekPlanClient.storedWeekPlan().monday).toBe('bolognese')
    expect(dayField('Montag')).toHaveValue('Bolognese')
    expect(announcements).toEqual(['Montag, Bolognese.'])
  })

  it('leaves a hidden meal standing where it was planned', () => {
    renderWeekPlanArea(
      [hiddenMeal('bolognese', 'Bolognese')],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    expect(dayField('Montag')).toHaveValue('Bolognese')
    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 1 von 7' }),
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

  it('offers no transfer while no day carries a meal', async () => {
    renderWeekPlanArea([bolognese])

    await fixPlan()

    expect(transferButton()).toHaveAttribute('aria-disabled', 'true')
  })

  it('offers no transfer while the plan is being edited', () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    expect(transferButton()).toHaveAttribute('aria-disabled', 'true')
  })

  it('hands nothing over when the locked transfer is pressed', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await addToShoppingList()

    expect(transferred).toEqual([])
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

    await fixPlan()
    await addToShoppingList()

    expect(transferred).toEqual([
      { mealsToBuy: [pizza, bolognese], spentSupplies: [] },
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

    await fixPlan()
    await addToShoppingList()

    expect(transferred).toEqual([
      { mealsToBuy: [bolognese], spentSupplies: [] },
    ])
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

    await fixPlan()
    await addToShoppingList()

    expect(transferred).toEqual([
      {
        mealsToBuy: [pizza, bolognese],
        spentSupplies: [supply('bolognese', 1)],
      },
    ])
  })

  it('keeps the transfer within reach when every day is covered', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
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
    const plan = withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese')
    const { weekPlanClient } = renderWeekPlanArea([bolognese], plan)

    await fixPlan()
    await addToShoppingList()

    expect(weekPlanClient.storedWeekPlan()).toEqual(plan)
    expect(screen.getByText('Montag, Bolognese')).toBeInTheDocument()
  })

  it('switches to reading and says how many days are planned', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await fixPlan()

    expect(weekPlanClient.storedStage()).toEqual(FIXED_STAGE)
    expect(announcements).toEqual(['Plan festgelegt, 1 von 7 Tagen geplant.'])
  })

  it('says that the plan can be edited again', async () => {
    const { weekPlanClient, announcements } = renderWeekPlanArea([bolognese])

    await fixPlan()
    await editPlan()

    expect(weekPlanClient.storedStage()).toEqual({ mode: 'editing' })
    expect(announcements).toEqual([
      'Plan festgelegt, keine von 7 Tagen geplant.',
      'Plan wieder bearbeitbar.',
    ])
    expect(dayField('Montag')).toBeInTheDocument()
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

  it('puts the stage button between the rolling and the transfer', () => {
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
    ])
  })

  it('shows each day as text while the plan is fixed', async () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    await fixPlan()

    expect(screen.getByText('Montag, Bolognese, im Vorrat')).toBeInTheDocument()
    expect(screen.getByText('Mittwoch, nichts geplant')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(markedWeekdays()).toEqual(['Mo.'])
  })

  it('locks every rolling button while the plan is fixed', async () => {
    renderWeekPlanArea([bolognese])

    await fixPlan()

    expect(
      screen.getByRole('button', { name: 'Zufallsauswahl generieren' }),
    ).toBeDisabled()
    screen
      .getAllByRole('button', { name: /^Zufallsgericht für/ })
      .forEach((button) => {
        expect(button).toBeDisabled()
      })
  })

  it('names the heading after the fixed plan', async () => {
    renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await fixPlan()

    expect(
      screen.getByRole('heading', { name: 'Wochenplan, 1 von 7, festgelegt' }),
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

    await typeIntoDay('Montag', 'bo')
    await fixPlan()
    await editPlan()

    expect(dayField('Montag')).toHaveValue('')
  })

  it('starts fixed when the stored stage says so', () => {
    renderWeekPlanArea(
      [bolognese],
      EMPTY_WEEK_PLAN,
      [],
      alwaysFirst,
      FIXED_STAGE,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Wochenplan, keine von 7, festgelegt',
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

  it('locks the transfer after it was pressed once', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
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
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await fixPlan()
    await addToShoppingList()

    expect(spentTransferButton()).toHaveFocus()
  })

  it('records the covered days of the transfer', async () => {
    const { weekPlanClient } = renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(
        withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
        'tuesday',
        'pizza',
      ),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()

    expect(weekPlanClient.storedStage()).toEqual({
      mode: 'reading',
      coveredDays: ['monday'],
    })
  })

  it('keeps the marks of the transfer when the supply is spent', async () => {
    const { changeSupplies } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()
    changeSupplies([])

    expect(markedWeekdays()).toEqual(['Mo.'])
    expect(screen.getByText('Montag, Bolognese, im Vorrat')).toBeInTheDocument()
  })

  it('shows the live supply again once the plan is edited', async () => {
    const { changeSupplies, weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()
    changeSupplies([])
    await editPlan()

    expect(weekPlanClient.storedStage()).toEqual({ mode: 'editing' })
    expect(markedWeekdays()).toEqual([])
    expect(dayField('Montag')).toHaveValue('Bolognese')
  })

  it('offers the transfer again after the plan was fixed anew', async () => {
    const { transferred } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
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
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await fixPlan()
    await addToShoppingList()

    expect(
      screen.getByRole('heading', {
        name: 'Wochenplan, 1 von 7, festgelegt, übertragen',
      }),
    ).toBeInTheDocument()
  })

  it('shows the transfer that the other device made', async () => {
    const { weekPlanClient } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
    )

    await act(async () => {
      weekPlanClient.stageArrivesFromElsewhere(transferredStage(['monday']))
    })

    expect(spentTransferButton()).toHaveAttribute('aria-disabled', 'true')
    expect(markedWeekdays()).toEqual(['Mo.'])
  })

  it('has no accessibility violations after the transfer', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    await fixPlan()
    await addToShoppingList()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations on a fixed plan', async () => {
    const { rendered } = renderWeekPlanArea(
      [bolognese, pizza],
      withMealOnDay(EMPTY_WEEK_PLAN, 'monday', 'bolognese'),
      [supply('bolognese', 1)],
    )

    await fixPlan()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })

  it('has no accessibility violations without a stored meal', async () => {
    const { rendered } = renderWeekPlanArea()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
