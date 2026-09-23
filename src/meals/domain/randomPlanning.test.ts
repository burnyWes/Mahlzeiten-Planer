import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import {
  filledWeekPlan,
  narrowedBy,
  pickMealForDay,
  randomCandidates,
  rarestInThePlan,
  type PlanningRule,
  type RandomSource,
} from './randomPlanning'
import {
  EMPTY_WEEK_PLAN,
  WEEKDAYS,
  withMealOnDay,
  type WeekPlan,
} from './weekPlan'

function meal(id: string): Meal {
  return {
    id,
    name: id,
    items: [],
    ingredientNotes: '',
    recipe: '',
    hidden: false,
    kind: 'mainMeal',
  }
}

function meals(count: number): readonly Meal[] {
  return Array.from({ length: count }, (_, position) =>
    meal(`meal-${position + 1}`),
  )
}

function sequence(values: readonly number[]): RandomSource {
  let position = 0
  return () => {
    const value = values[position % values.length]
    position += 1
    return value
  }
}

function planOf(...ids: readonly (string | null)[]): WeekPlan {
  return ids.reduce<WeekPlan>(
    (plan, id, position) =>
      id === null ? plan : withMealOnDay(plan, WEEKDAYS[position], id),
    EMPTY_WEEK_PLAN,
  )
}

function timesPlannedIn(plan: WeekPlan): readonly number[] {
  const planned = WEEKDAYS.map((day) => plan[day])
  return [...new Set(planned)].map(
    (id) => planned.filter((other) => other === id).length,
  )
}

const bolognese = meal('bolognese')
const pizza = meal('pizza')
const soup = meal('soup')

describe('randomCandidates', () => {
  const hiddenPizza = { ...pizza, hidden: true }

  it('leaves out the meals that are hidden', () => {
    expect(randomCandidates([bolognese, hiddenPizza, soup])).toEqual([
      bolognese,
      soup,
    ])
  })

  it('keeps the order of the meals that are left', () => {
    expect(randomCandidates([soup, bolognese])).toEqual([soup, bolognese])
  })

  it('leaves nothing over when every meal is hidden', () => {
    expect(randomCandidates([hiddenPizza])).toEqual([])
  })

  it('leaves nothing over without a stored meal', () => {
    expect(randomCandidates([])).toEqual([])
  })
})

describe('rarestInThePlan', () => {
  it('keeps only the meals that stand in the plan least often', () => {
    const plan = planOf('bolognese', 'bolognese', 'pizza')

    expect(rarestInThePlan([bolognese, pizza, soup], plan, 'thursday')).toEqual(
      [soup],
    )
  })

  it('keeps every meal while the plan is empty', () => {
    expect(
      rarestInThePlan([bolognese, pizza], EMPTY_WEEK_PLAN, 'monday'),
    ).toEqual([bolognese, pizza])
  })

  it('counts the day that is being rolled as well', () => {
    const plan = planOf('bolognese')

    expect(rarestInThePlan([bolognese, pizza], plan, 'monday')).toEqual([pizza])
  })
})

describe('narrowedBy', () => {
  const nothingLeft: PlanningRule = () => []

  it('skips a rule that would leave nothing', () => {
    expect(
      narrowedBy([nothingLeft], [bolognese, pizza], EMPTY_WEEK_PLAN, 'monday'),
    ).toEqual([bolognese, pizza])
  })

  it('narrows through one rule after the other', () => {
    const withoutPizza: PlanningRule = (candidates) =>
      candidates.filter((candidate) => candidate.id !== 'pizza')

    expect(
      narrowedBy(
        [withoutPizza, rarestInThePlan],
        [bolognese, pizza, soup],
        planOf('bolognese'),
        'tuesday',
      ),
    ).toEqual([soup])
  })
})

describe('pickMealForDay', () => {
  it('picks nothing when no meal is stored', () => {
    expect(
      pickMealForDay([], EMPTY_WEEK_PLAN, 'monday', sequence([0])),
    ).toBeNull()
  })

  it('picks the only meal there is', () => {
    expect(
      pickMealForDay([bolognese], EMPTY_WEEK_PLAN, 'monday', sequence([0.5])),
    ).toEqual(bolognese)
  })

  it('avoids the meal of that day while another one is rarer in the plan', () => {
    const plan = planOf('bolognese')

    expect(
      pickMealForDay([bolognese, pizza], plan, 'monday', sequence([0.9])),
    ).toEqual(pizza)
  })

  it('may pick the same meal again once every meal is planned equally often', () => {
    const plan = planOf('bolognese', 'pizza')

    expect(
      pickMealForDay([bolognese, pizza], plan, 'monday', sequence([0])),
    ).toEqual(bolognese)
  })

  it('stays inside the candidates at both edges of the random source', () => {
    const candidates = [bolognese, pizza, soup]

    expect(
      pickMealForDay(candidates, EMPTY_WEEK_PLAN, 'monday', sequence([0])),
    ).toEqual(bolognese)
    expect(
      pickMealForDay(
        candidates,
        EMPTY_WEEK_PLAN,
        'monday',
        sequence([0.999999]),
      ),
    ).toEqual(soup)
    expect(
      pickMealForDay(candidates, EMPTY_WEEK_PLAN, 'monday', sequence([1])),
    ).toEqual(soup)
  })
})

describe('filledWeekPlan', () => {
  it('leaves the plan empty without a stored meal', () => {
    expect(filledWeekPlan([], sequence([0.3]))).toEqual(EMPTY_WEEK_PLAN)
  })

  it('fills seven days with seven meals without repeating one', () => {
    const plan = filledWeekPlan(meals(7), sequence([0.7, 0.1, 0.9, 0.4]))
    const planned = WEEKDAYS.map((day) => plan[day])

    expect(new Set(planned).size).toBe(7)
    expect(planned).not.toContain(null)
  })

  it('spreads three meals over the week as evenly as it can', () => {
    const plan = filledWeekPlan(meals(3), sequence([0.7, 0.1, 0.9, 0.4]))
    const timesPlanned = [...timesPlannedIn(plan)].sort()

    expect(timesPlanned).toEqual([2, 2, 3])
  })

  it('walks through the candidates when the random source always gives zero', () => {
    const plan = filledWeekPlan(meals(7), sequence([0]))

    expect(WEEKDAYS.map((day) => plan[day])).toEqual([
      'meal-1',
      'meal-2',
      'meal-3',
      'meal-4',
      'meal-5',
      'meal-6',
      'meal-7',
    ])
  })
})
