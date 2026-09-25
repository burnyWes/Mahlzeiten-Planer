import { describe, expect, it } from 'vitest'
import type { Meal } from './meal'
import {
  filledWeekPlan,
  narrowedBy,
  pickMealFor,
  randomCandidates,
  rarestInThePlan,
  type PlanningRule,
  type RandomSource,
} from './randomPlanning'
import {
  EMPTY_WEEK_PLAN,
  mealIn,
  PLAN_SLOTS,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
  type Weekday,
} from './weekPlan'

function meal(id: string): Meal {
  return {
    id,
    name: id,
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories: [],
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
      id === null ? plan : withMealIn(plan, PLAN_SLOTS[position], id),
    EMPTY_WEEK_PLAN,
  )
}

function slot(day: Weekday, time: MealTime): PlanSlot {
  return { day, time }
}

function mealsOf(plan: WeekPlan): readonly (string | null)[] {
  return PLAN_SLOTS.map((each) => mealIn(plan, each))
}

function timesPlannedIn(plan: WeekPlan): readonly number[] {
  const planned = mealsOf(plan)
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

    expect(
      rarestInThePlan([bolognese, pizza, soup], plan, slot('monday', 'dinner')),
    ).toEqual([soup])
  })

  it('keeps every meal while the plan is empty', () => {
    expect(
      rarestInThePlan(
        [bolognese, pizza],
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
      ),
    ).toEqual([bolognese, pizza])
  })

  it('counts the slot that is being rolled as well', () => {
    const plan = planOf('bolognese')

    expect(
      rarestInThePlan([bolognese, pizza], plan, slot('monday', 'breakfast')),
    ).toEqual([pizza])
  })

  it('counts the meals of every meal time of the week', () => {
    const plan = withMealIn(
      withMealIn(EMPTY_WEEK_PLAN, slot('tuesday', 'snack'), 'bolognese'),
      slot('sunday', 'dinner'),
      'pizza',
    )

    expect(
      rarestInThePlan([bolognese, pizza, soup], plan, slot('friday', 'lunch')),
    ).toEqual([soup])
  })
})

describe('narrowedBy', () => {
  const nothingLeft: PlanningRule = () => []

  it('skips a rule that would leave nothing', () => {
    expect(
      narrowedBy(
        [nothingLeft],
        [bolognese, pizza],
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
      ),
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
        slot('monday', 'lunch'),
      ),
    ).toEqual([soup])
  })
})

describe('pickMealFor', () => {
  it('picks nothing when no meal is stored', () => {
    expect(
      pickMealFor([], EMPTY_WEEK_PLAN, slot('monday', 'lunch'), sequence([0])),
    ).toBeNull()
  })

  it('picks the only meal there is', () => {
    expect(
      pickMealFor(
        [bolognese],
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([0.5]),
      ),
    ).toEqual(bolognese)
  })

  it('avoids the meal of that slot while another one is rarer in the plan', () => {
    const plan = planOf('bolognese')

    expect(
      pickMealFor(
        [bolognese, pizza],
        plan,
        slot('monday', 'breakfast'),
        sequence([0.9]),
      ),
    ).toEqual(pizza)
  })

  it('may pick the same meal again once every meal is planned equally often', () => {
    const plan = planOf('bolognese', 'pizza')

    expect(
      pickMealFor(
        [bolognese, pizza],
        plan,
        slot('monday', 'breakfast'),
        sequence([0]),
      ),
    ).toEqual(bolognese)
  })

  it('stays inside the candidates at both edges of the random source', () => {
    const candidates = [bolognese, pizza, soup]

    expect(
      pickMealFor(
        candidates,
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([0]),
      ),
    ).toEqual(bolognese)
    expect(
      pickMealFor(
        candidates,
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([0.999999]),
      ),
    ).toEqual(soup)
    expect(
      pickMealFor(
        candidates,
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([1]),
      ),
    ).toEqual(soup)
  })
})

describe('filledWeekPlan', () => {
  it('leaves the plan empty without a stored meal', () => {
    expect(filledWeekPlan([], sequence([0.3]))).toEqual(EMPTY_WEEK_PLAN)
  })

  it('fills 28 slots with 28 meals without repeating one', () => {
    const plan = filledWeekPlan(meals(28), sequence([0.7, 0.1, 0.9, 0.4]))
    const planned = mealsOf(plan)

    expect(new Set(planned).size).toBe(28)
    expect(planned).not.toContain(null)
  })

  it('spreads three meals over the 28 slots as evenly as it can', () => {
    const plan = filledWeekPlan(meals(3), sequence([0.7, 0.1, 0.9, 0.4]))
    const timesPlanned = [...timesPlannedIn(plan)].sort(
      (fewer, more) => fewer - more,
    )

    expect(timesPlanned).toEqual([9, 9, 10])
  })

  it('walks through the candidates when the random source always gives zero', () => {
    const plan = filledWeekPlan(meals(28), sequence([0]))

    expect(mealsOf(plan)).toEqual(
      Array.from({ length: 28 }, (_, position) => `meal-${position + 1}`),
    )
  })
})
