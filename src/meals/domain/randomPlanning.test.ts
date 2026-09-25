import { describe, expect, it } from 'vitest'
import type { Meal, MealKind } from './meal'
import {
  apartFromSameCategory,
  filledWeekPlan,
  isMainMealTimeRule,
  MAIN_MEAL_TIME_RULES,
  mainMealTimeOf,
  narrowedBy,
  otherThanPlanned,
  pickMealFor,
  randomCandidates,
  rarestInThePlan,
  stayingLikeTheDayBefore,
  type PlanningRule,
  type RandomSource,
} from './randomPlanning'
import { toPlanDate, type PlanDate } from './planDate'
import { datesOf, type PlanPeriod } from './planPeriod'
import {
  emptyWeekPlan,
  mealIn,
  planSlotsOf,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
} from './weekPlan'

const MONDAY = toPlanDate('2026-09-21')
const TUESDAY = toPlanDate('2026-09-22')
const WEDNESDAY = toPlanDate('2026-09-23')
const FRIDAY = toPlanDate('2026-09-25')
const SATURDAY = toPlanDate('2026-09-26')
const SUNDAY = toPlanDate('2026-09-27')
const NEXT_MONDAY = toPlanDate('2026-09-28')

const WEEK: PlanPeriod = { start: MONDAY, days: 7 }
const WEEK_DATES = datesOf(WEEK)
const WEEK_SLOTS = planSlotsOf(WEEK)
const EMPTY_PLAN = emptyWeekPlan(WEEK)

function meal(
  id: string,
  kind: MealKind = 'mainMeal',
  categories: readonly string[] = [],
): Meal {
  return {
    id,
    name: id,
    items: [],
    ingredientNotes: '',
    recipe: '',
    categories,
    hidden: false,
    kind,
  }
}

function meals(
  count: number,
  kind: MealKind = 'mainMeal',
  prefix = 'meal',
): readonly Meal[] {
  return Array.from({ length: count }, (_, position) =>
    meal(`${prefix}-${position + 1}`, kind),
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
      id === null ? plan : withMealIn(plan, WEEK_SLOTS[position], id),
    EMPTY_PLAN,
  )
}

function slot(date: PlanDate, time: MealTime): PlanSlot {
  return { date, time }
}

function mealsOf(plan: WeekPlan): readonly (string | null)[] {
  return WEEK_SLOTS.map((each) => mealIn(plan, each))
}

function timesPlannedIn(plan: WeekPlan): readonly number[] {
  const planned = mealsOf(plan).filter((id) => id !== null)
  return [...new Set(planned)].map(
    (id) => planned.filter((other) => other === id).length,
  )
}

function mainMealTimesOf(
  plan: WeekPlan,
  stored: readonly Meal[],
): readonly (readonly MealTime[])[] {
  return WEEK_DATES.map((day) =>
    (['lunch', 'dinner'] as const).filter(
      (time) =>
        stored.find((each) => each.id === mealIn(plan, slot(day, time)))
          ?.kind === 'mainMeal',
    ),
  )
}

const bolognese = meal('bolognese')
const pizza = meal('pizza')
const soup = meal('soup')
const bread = meal('bread', 'none')
const muesli = meal('muesli', 'breakfast')
const apple = meal('apple', 'snack')
const hiddenBolognese = { ...bolognese, hidden: true }
const porridge = meal('porridge', 'breakfast')
const lasagne = meal('lasagne', 'mainMeal', ['Nudeln'])
const pasta = meal('pasta', 'mainMeal', ['Nudeln'])
const penne = meal('penne', 'mainMeal', ['Nudeln'])
const rice = meal('rice', 'mainMeal', ['Reis'])
const carbonara = meal('carbonara', 'none', ['Nudeln'])
const noodleSnack = meal('noodleSnack', 'snack', ['Nudeln'])
const noodleBreakfast = meal('noodleBreakfast', 'breakfast', ['Nudeln'])
const anyRandom = sequence([0])

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
      rarestInThePlan(
        [bolognese, pizza, soup],
        plan,
        slot(MONDAY, 'dinner'),
        anyRandom,
        [bolognese, pizza, soup],
      ),
    ).toEqual([soup])
  })

  it('keeps every meal while the plan is empty', () => {
    expect(
      rarestInThePlan(
        [bolognese, pizza],
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        anyRandom,
        [bolognese, pizza],
      ),
    ).toEqual([bolognese, pizza])
  })

  it('counts the slot that is being rolled as well', () => {
    const plan = planOf('bolognese')

    expect(
      rarestInThePlan(
        [bolognese, pizza],
        plan,
        slot(MONDAY, 'breakfast'),
        anyRandom,
        [bolognese, pizza],
      ),
    ).toEqual([pizza])
  })

  it('counts the meals of every meal time of the week', () => {
    const plan = withMealIn(
      withMealIn(EMPTY_PLAN, slot(TUESDAY, 'snack'), 'bolognese'),
      slot(SUNDAY, 'dinner'),
      'pizza',
    )

    expect(
      rarestInThePlan(
        [bolognese, pizza, soup],
        plan,
        slot(FRIDAY, 'lunch'),
        anyRandom,
        [bolognese, pizza, soup],
      ),
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
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        anyRandom,
        [bolognese, pizza],
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
        slot(MONDAY, 'lunch'),
        anyRandom,
        [bolognese, pizza, soup],
      ),
    ).toEqual([soup])
  })
})

describe('otherThanPlanned', () => {
  it('leaves out the meal that stands in the slot', () => {
    const plan = withMealIn(EMPTY_PLAN, slot(MONDAY, 'breakfast'), 'muesli')

    expect(
      otherThanPlanned(
        [muesli, porridge],
        plan,
        slot(MONDAY, 'breakfast'),
        anyRandom,
        [muesli, porridge],
      ),
    ).toEqual([porridge])
  })

  it('keeps every meal for an empty slot', () => {
    expect(
      otherThanPlanned(
        [muesli, porridge],
        EMPTY_PLAN,
        slot(MONDAY, 'breakfast'),
        anyRandom,
        [muesli, porridge],
      ),
    ).toEqual([muesli, porridge])
  })

  it('rolls the planned meal again when no other one suits', () => {
    const plan = withMealIn(EMPTY_PLAN, slot(MONDAY, 'breakfast'), 'muesli')

    expect(
      pickMealFor(
        [muesli, bolognese],
        plan,
        slot(MONDAY, 'breakfast'),
        sequence([0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(muesli)
  })

  it('rolls another meal than the planned one', () => {
    const plan = withMealIn(EMPTY_PLAN, slot(MONDAY, 'breakfast'), 'porridge')

    expect(
      pickMealFor(
        [muesli, porridge],
        withMealIn(plan, slot(FRIDAY, 'breakfast'), 'muesli'),
        slot(MONDAY, 'breakfast'),
        sequence([0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(muesli)
  })
})

describe('apartFromSameCategory', () => {
  function apartFor(
    plan: WeekPlan,
    rolled: PlanSlot,
    candidates: readonly Meal[] = [pasta, rice],
    stored: readonly Meal[] = [lasagne, ...candidates],
  ): readonly Meal[] {
    return apartFromSameCategory(candidates, plan, rolled, anyRandom, stored)
  }

  function planned(at: PlanSlot, id: string): WeekPlan {
    return withMealIn(EMPTY_PLAN, at, id)
  }

  it('leaves out a meal that shares a category with the day before', () => {
    expect(
      apartFor(
        planned(slot(MONDAY, 'dinner'), 'lasagne'),
        slot(TUESDAY, 'lunch'),
      ),
    ).toEqual([rice])
  })

  it('leaves out a meal that shares a category with the day after', () => {
    expect(
      apartFor(
        planned(slot(WEDNESDAY, 'lunch'), 'lasagne'),
        slot(TUESDAY, 'dinner'),
      ),
    ).toEqual([rice])
  })

  it('leaves out a meal that shares a category with the other meal time of the day', () => {
    expect(
      apartFor(
        planned(slot(TUESDAY, 'lunch'), 'lasagne'),
        slot(TUESDAY, 'dinner'),
      ),
    ).toEqual([rice])
  })

  it('compares the categories regardless of their case', () => {
    const lowerLasagne = meal('lasagne', 'mainMeal', ['nudeln'])

    expect(
      apartFor(
        planned(slot(MONDAY, 'dinner'), 'lasagne'),
        slot(TUESDAY, 'lunch'),
        [pasta, rice],
        [lowerLasagne, pasta, rice],
      ),
    ).toEqual([rice])
  })

  it('keeps a side apart as well', () => {
    expect(
      apartFor(
        planned(slot(MONDAY, 'dinner'), 'lasagne'),
        slot(TUESDAY, 'lunch'),
        [carbonara, rice],
      ),
    ).toEqual([rice])
  })

  it('does not count a snack or a breakfast beside it', () => {
    const plan = withMealIn(
      planned(slot(MONDAY, 'dinner'), 'noodleSnack'),
      slot(TUESDAY, 'dinner'),
      'noodleBreakfast',
    )

    expect(
      apartFor(
        plan,
        slot(TUESDAY, 'lunch'),
        [pasta, rice],
        [noodleSnack, noodleBreakfast, pasta, rice],
      ),
    ).toEqual([pasta, rice])
  })

  it('keeps a snack that shares a category', () => {
    expect(
      apartFor(
        planned(slot(MONDAY, 'dinner'), 'lasagne'),
        slot(TUESDAY, 'lunch'),
        [noodleSnack, rice],
      ),
    ).toEqual([noodleSnack, rice])
  })

  it('does not count the slot that is being rolled', () => {
    expect(
      apartFor(
        planned(slot(TUESDAY, 'lunch'), 'lasagne'),
        slot(TUESDAY, 'lunch'),
      ),
    ).toEqual([pasta, rice])
  })

  it('keeps the same category apart across a Sunday', () => {
    const acrossTheWeekend = emptyWeekPlan({ start: SATURDAY, days: 3 })

    expect(
      apartFor(
        withMealIn(acrossTheWeekend, slot(SUNDAY, 'dinner'), 'lasagne'),
        slot(NEXT_MONDAY, 'lunch'),
      ),
    ).toEqual([rice])
  })

  it('looks at no day before the start of the period', () => {
    expect(
      apartFor(
        planned(slot(SUNDAY, 'dinner'), 'lasagne'),
        slot(MONDAY, 'lunch'),
      ),
    ).toEqual([pasta, rice])
  })

  it('looks at no day after the end of the period', () => {
    expect(
      apartFor(
        planned(slot(MONDAY, 'lunch'), 'lasagne'),
        slot(SUNDAY, 'dinner'),
      ),
    ).toEqual([pasta, rice])
  })

  it('counts a hidden meal beside it', () => {
    expect(
      apartFor(
        planned(slot(MONDAY, 'dinner'), 'lasagne'),
        slot(TUESDAY, 'lunch'),
        [pasta, rice],
        [{ ...lasagne, hidden: true }, pasta, rice],
      ),
    ).toEqual([rice])
  })

  it('keeps the categories apart before it looks for the rarest meal', () => {
    const plan = withMealIn(
      withMealIn(
        planned(slot(MONDAY, 'dinner'), 'lasagne'),
        slot(TUESDAY, 'dinner'),
        'bread',
      ),
      slot(FRIDAY, 'lunch'),
      'rice',
    )

    expect(
      pickMealFor(
        [lasagne, pasta, rice, bread],
        plan,
        slot(TUESDAY, 'lunch'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(rice)
  })

  it('leaves the choice to the rarest meal when every meal shares a category', () => {
    const plan = withMealIn(
      withMealIn(
        planned(slot(MONDAY, 'dinner'), 'lasagne'),
        slot(TUESDAY, 'dinner'),
        'bread',
      ),
      slot(FRIDAY, 'lunch'),
      'penne',
    )

    expect(
      pickMealFor(
        [lasagne, pasta, penne, bread],
        plan,
        slot(TUESDAY, 'lunch'),
        sequence([0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(pasta)
  })
})

describe('stayingLikeTheDayBefore', () => {
  const mondayMuesli = withMealIn(
    EMPTY_PLAN,
    slot(MONDAY, 'breakfast'),
    'muesli',
  )

  function countingRandom(value: number) {
    const tossed: number[] = []
    const random: RandomSource = () => {
      tossed.push(value)
      return value
    }
    return { random, tossed }
  }

  it('stays with the meal of the day before below the staying chance', () => {
    expect(
      pickMealFor(
        [muesli, porridge],
        mondayMuesli,
        slot(TUESDAY, 'breakfast'),
        sequence([0, 0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(muesli)
  })

  it('changes to another meal from the staying chance on', () => {
    const coins = [0.5, 0.99]

    coins.forEach((coin) =>
      expect(
        pickMealFor(
          [muesli, porridge],
          mondayMuesli,
          slot(TUESDAY, 'breakfast'),
          sequence([coin, 0]),
          'lunchOrDinner',
        ),
      ).toEqual(porridge),
    )
  })

  it('stays with the snack of the day before', () => {
    const plan = withMealIn(EMPTY_PLAN, slot(MONDAY, 'snack'), 'apple')
    const nuts = meal('nuts', 'snack')

    expect(
      pickMealFor(
        [nuts, apple],
        plan,
        slot(TUESDAY, 'snack'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(apple)
  })

  it('tosses no coin on the first day of the period', () => {
    const { random, tossed } = countingRandom(0)

    expect(
      stayingLikeTheDayBefore(
        [muesli, porridge],
        withMealIn(EMPTY_PLAN, slot(SUNDAY, 'breakfast'), 'muesli'),
        slot(MONDAY, 'breakfast'),
        random,
        [muesli, porridge],
      ),
    ).toEqual([muesli, porridge])
    expect(tossed).toEqual([])
  })

  it('tosses no coin when the day before is empty', () => {
    const { random, tossed } = countingRandom(0)

    expect(
      stayingLikeTheDayBefore(
        [muesli, porridge],
        EMPTY_PLAN,
        slot(TUESDAY, 'breakfast'),
        random,
        [muesli, porridge],
      ),
    ).toEqual([muesli, porridge])
    expect(tossed).toEqual([])
  })

  it('tosses no coin when the meal of the day before does not suit the slot', () => {
    const { random, tossed } = countingRandom(0)

    expect(
      stayingLikeTheDayBefore(
        [muesli, porridge],
        withMealIn(EMPTY_PLAN, slot(MONDAY, 'breakfast'), 'bolognese'),
        slot(TUESDAY, 'breakfast'),
        random,
        [bolognese, muesli, porridge],
      ),
    ).toEqual([muesli, porridge])
    expect(tossed).toEqual([])
  })

  it('never stays at lunch or dinner, not even with a snack', () => {
    const { random, tossed } = countingRandom(0)
    const plan = withMealIn(
      withMealIn(EMPTY_PLAN, slot(MONDAY, 'lunch'), 'apple'),
      slot(MONDAY, 'dinner'),
      'apple',
    )
    const times = ['lunch', 'dinner'] as const

    times.forEach((time) =>
      expect(
        stayingLikeTheDayBefore(
          [bread, apple],
          plan,
          slot(TUESDAY, time),
          random,
          [bread, apple],
        ),
      ).toEqual([bread, apple]),
    )
    expect(tossed).toEqual([])
  })

  it('rolls another meal than the planned one even if it stood there the day before', () => {
    const plan = withMealIn(mondayMuesli, slot(TUESDAY, 'breakfast'), 'muesli')

    expect(
      pickMealFor(
        [muesli, porridge],
        plan,
        slot(TUESDAY, 'breakfast'),
        sequence([0.99, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(porridge)
  })

  it('keeps the same breakfast all week when it always stays', () => {
    const plan = filledWeekPlan(
      meals(3, 'breakfast'),
      WEEK,
      sequence([0]),
      'lunchOrDinner',
    )

    expect(
      WEEK_DATES.map((day) => mealIn(plan, slot(day, 'breakfast'))),
    ).toEqual(WEEK_DATES.map(() => 'meal-1'))
  })

  it('keeps the same snack all week when it always stays', () => {
    const plan = filledWeekPlan(
      meals(3, 'snack'),
      WEEK,
      sequence([0]),
      'lunchOrDinner',
    )
    const mondaySnack = mealIn(plan, slot(MONDAY, 'snack'))

    expect(mondaySnack).not.toBeNull()
    expect(WEEK_DATES.map((day) => mealIn(plan, slot(day, 'snack')))).toEqual(
      WEEK_DATES.map(() => mondaySnack),
    )
  })

  it('changes the breakfast every day when it never stays', () => {
    const plan = filledWeekPlan(
      meals(3, 'breakfast'),
      WEEK,
      sequence([0.99]),
      'lunchOrDinner',
    )
    const breakfasts = WEEK_DATES.map((day) =>
      mealIn(plan, slot(day, 'breakfast')),
    )

    expect(
      breakfasts
        .slice(1)
        .map((breakfast, position) => breakfast !== breakfasts[position]),
    ).toEqual(WEEK_DATES.slice(1).map(() => true))
  })
})

describe('mainMealTimeOf', () => {
  it('puts the main meal at lunch below an even chance', () => {
    expect(mainMealTimeOf(sequence([0]))).toBe('lunch')
    expect(mainMealTimeOf(sequence([0.49]))).toBe('lunch')
  })

  it('puts the main meal at dinner from an even chance on', () => {
    expect(mainMealTimeOf(sequence([0.5]))).toBe('dinner')
  })
})

describe('isMainMealTimeRule', () => {
  it('accepts every rule for the time of the main meal', () => {
    expect(MAIN_MEAL_TIME_RULES.every(isMainMealTimeRule)).toBe(true)
    expect(MAIN_MEAL_TIME_RULES).toEqual(['lunchOrDinner', 'lunch', 'dinner'])
  })

  it('rejects anything else', () => {
    expect(isMainMealTimeRule('breakfast')).toBe(false)
    expect(isMainMealTimeRule(undefined)).toBe(false)
    expect(isMainMealTimeRule(42)).toBe(false)
  })
})

describe('pickMealFor', () => {
  it('picks nothing when no meal is stored', () => {
    expect(
      pickMealFor(
        [],
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toBeNull()
  })

  it('picks the only meal there is', () => {
    expect(
      pickMealFor(
        [bolognese],
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        sequence([0, 0.5]),
        'lunchOrDinner',
      ),
    ).toEqual(bolognese)
  })

  it('never picks a hidden meal', () => {
    expect(
      pickMealFor(
        [hiddenBolognese, pizza],
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        sequence([0, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(pizza)
  })

  it('avoids the meal of that slot while another one is rarer in the plan', () => {
    const plan = planOf('muesli')

    expect(
      pickMealFor(
        [muesli, apple],
        plan,
        slot(MONDAY, 'breakfast'),
        sequence([0.9]),
        'lunchOrDinner',
      ),
    ).toEqual(apple)
  })

  it('may pick the same meal again once every meal is planned equally often', () => {
    const plan = planOf(null, null, null, null, 'muesli', null, 'apple')

    expect(
      pickMealFor(
        [muesli, apple],
        plan,
        slot(MONDAY, 'breakfast'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(muesli)
  })

  it('stays inside the candidates at both edges of the random source', () => {
    const snacks = meals(3, 'snack')

    expect(
      pickMealFor(
        snacks,
        EMPTY_PLAN,
        slot(MONDAY, 'snack'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(snacks[0])
    expect(
      pickMealFor(
        snacks,
        EMPTY_PLAN,
        slot(MONDAY, 'snack'),
        sequence([0.999999]),
        'lunchOrDinner',
      ),
    ).toEqual(snacks[2])
    expect(
      pickMealFor(
        snacks,
        EMPTY_PLAN,
        slot(MONDAY, 'snack'),
        sequence([1]),
        'lunchOrDinner',
      ),
    ).toEqual(snacks[2])
  })

  it('rolls only a breakfast or a snack for the breakfast', () => {
    const stored = [bolognese, bread, muesli, apple]

    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'breakfast'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(muesli)
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'breakfast'),
        sequence([0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(apple)
  })

  it('rolls only a snack for the snack', () => {
    expect(
      pickMealFor(
        [muesli, bolognese, bread, apple],
        EMPTY_PLAN,
        slot(MONDAY, 'snack'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(apple)
  })

  it('never rolls a breakfast for lunch or dinner', () => {
    const times = ['lunch', 'dinner'] as const
    const coins = [0, 0.5]

    times.forEach((time) =>
      coins.forEach((coin) =>
        expect(
          pickMealFor(
            [muesli],
            EMPTY_PLAN,
            slot(MONDAY, time),
            sequence([coin, 0]),
            'lunchOrDinner',
          ),
        ).toBeNull(),
      ),
    )
  })

  it('rolls a side or a snack beside the main meal of the day', () => {
    const plan = withMealIn(EMPTY_PLAN, slot(MONDAY, 'dinner'), 'bolognese')
    const stored = [bolognese, pizza, bread, apple]

    expect(
      pickMealFor(
        stored,
        plan,
        slot(MONDAY, 'lunch'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        plan,
        slot(MONDAY, 'lunch'),
        sequence([0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(apple)
  })

  it('rolls a main meal beside a side, a snack or a breakfast of the day', () => {
    const besides = ['bread', 'apple', 'muesli']

    besides.forEach((beside) =>
      expect(
        pickMealFor(
          [muesli, pizza, bread, apple],
          withMealIn(EMPTY_PLAN, slot(MONDAY, 'lunch'), beside),
          slot(MONDAY, 'dinner'),
          sequence([0.99]),
          'lunchOrDinner',
        ),
      ).toEqual(pizza),
    )
  })

  it('tosses a coin for the main meal while the other meal time is empty', () => {
    const stored = [pizza, bread]

    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        sequence([0, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(pizza)
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        sequence([0.5, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'dinner'),
        sequence([0, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'dinner'),
        sequence([0.5, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(pizza)
  })

  it('follows the given main meal time instead of tossing a coin', () => {
    expect(
      pickMealFor(
        [pizza, bread],
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        sequence([0]),
        'lunchOrDinner',
        'dinner',
      ),
    ).toEqual(bread)
  })

  it('counts a hidden main meal on the other meal time as the main meal', () => {
    expect(
      pickMealFor(
        [hiddenBolognese, pizza, bread],
        withMealIn(EMPTY_PLAN, slot(MONDAY, 'dinner'), 'bolognese'),
        slot(MONDAY, 'lunch'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
  })

  it('counts an unknown meal on the other meal time as empty', () => {
    const plan = withMealIn(EMPTY_PLAN, slot(MONDAY, 'dinner'), 'gone')

    expect(
      pickMealFor(
        [pizza, bread],
        plan,
        slot(MONDAY, 'lunch'),
        sequence([0, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(pizza)
    expect(
      pickMealFor(
        [pizza, bread],
        plan,
        slot(MONDAY, 'lunch'),
        sequence([0.5, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
  })

  it('picks nothing when no stored meal suits the slot', () => {
    expect(
      pickMealFor(
        [bolognese],
        EMPTY_PLAN,
        slot(MONDAY, 'breakfast'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toBeNull()
  })
})

describe('filledWeekPlan', () => {
  const everyKind = [muesli, bolognese, bread, apple]
  const mixedRandom = () => sequence([0.3, 0.8, 0.6, 0.1, 0.9, 0.7])

  it('leaves the plan empty without a stored meal', () => {
    expect(filledWeekPlan([], WEEK, sequence([0.3]), 'lunchOrDinner')).toEqual(
      EMPTY_PLAN,
    )
  })

  it('fills every slot without repeating a meal when it never stays and enough meals of each kind are stored', () => {
    const stored = [
      ...meals(7, 'breakfast', 'breakfast'),
      ...meals(21, 'snack', 'snack'),
      ...meals(7, 'mainMeal', 'main'),
      ...meals(7, 'none', 'side'),
    ]
    const plan = filledWeekPlan(stored, WEEK, sequence([0.99]), 'lunchOrDinner')
    const planned = mealsOf(plan)

    expect(new Set(planned).size).toBe(28)
    expect(planned).not.toContain(null)
  })

  it('spreads the meals of one kind over their slots as evenly as it can when it never stays', () => {
    const plan = filledWeekPlan(
      meals(3, 'snack'),
      WEEK,
      sequence([0.99]),
      'lunchOrDinner',
    )

    expect(timesPlannedIn(plan)).toEqual([7, 7, 7])
  })

  it('fills every day of a ten day period', () => {
    const tenDays = { start: FRIDAY, days: 10 }
    const plan = filledWeekPlan(
      everyKind,
      tenDays,
      mixedRandom(),
      'lunchOrDinner',
    )

    expect(
      datesOf(tenDays).map((date) => mealIn(plan, slot(date, 'snack'))),
    ).toEqual(datesOf(tenDays).map(() => 'apple'))
    expect(plan.period).toEqual(tenDays)
  })

  it('walks through the candidates when the random source always gives zero', () => {
    const plan = filledWeekPlan(meals(7), WEEK, sequence([0]), 'lunchOrDinner')

    expect(mealsOf(plan)).toEqual(
      WEEK_DATES.flatMap((_, position) => [
        null,
        `meal-${position + 1}`,
        null,
        null,
      ]),
    )
  })

  it('plans exactly one main meal a day, now at lunch and now at dinner', () => {
    const plan = filledWeekPlan(everyKind, WEEK, mixedRandom(), 'lunchOrDinner')
    const mainMealTimes = mainMealTimesOf(plan, everyKind)

    expect(mainMealTimes.map((times) => times.length)).toEqual(
      WEEK_DATES.map(() => 1),
    )
    expect(new Set(mainMealTimes.flat())).toEqual(new Set(['lunch', 'dinner']))
  })

  it('puts a side or a snack beside the main meal of each day', () => {
    const plan = filledWeekPlan(everyKind, WEEK, mixedRandom(), 'lunchOrDinner')

    WEEK_DATES.forEach((day) =>
      expect(
        [mealIn(plan, slot(day, 'lunch')), mealIn(plan, slot(day, 'dinner'))]
          .filter((id) => id !== 'bolognese')
          .map((id) => ['bread', 'apple'].includes(id ?? '')),
      ).toEqual([true]),
    )
  })

  it('rolls a breakfast or a snack for every breakfast and a snack for every snack', () => {
    const plan = filledWeekPlan(everyKind, WEEK, mixedRandom(), 'lunchOrDinner')

    WEEK_DATES.forEach((day) => {
      expect(['muesli', 'apple']).toContain(
        mealIn(plan, slot(day, 'breakfast')),
      )
      expect(mealIn(plan, slot(day, 'snack'))).toBe('apple')
    })
  })

  it('never plans the same category of main meal on two days in a row', () => {
    const plan = filledWeekPlan(
      [pasta, penne, rice, meal('risotto', 'mainMeal', ['Reis'])],
      WEEK,
      sequence([0]),
      'lunchOrDinner',
    )

    expect(WEEK_DATES.map((day) => mealIn(plan, slot(day, 'lunch')))).toEqual([
      'pasta',
      'rice',
      'penne',
      'risotto',
      'pasta',
      'rice',
      'penne',
    ])
  })

  it('leaves every slot empty that no stored meal suits', () => {
    const plan = filledWeekPlan(
      [bolognese],
      WEEK,
      mixedRandom(),
      'lunchOrDinner',
    )

    expect(mealsOf(plan).filter((id) => id !== null)).toHaveLength(7)
    WEEK_DATES.forEach((day) => {
      expect(mealIn(plan, slot(day, 'breakfast'))).toBeNull()
      expect(mealIn(plan, slot(day, 'snack'))).toBeNull()
    })
    expect(
      mainMealTimesOf(plan, [bolognese]).map((times) => times.length),
    ).toEqual(WEEK_DATES.map(() => 1))
  })
})

describe('filledWeekPlan with a fixed main meal time', () => {
  const everyKind = [muesli, bolognese, bread, apple]
  const mixedRandom = () => sequence([0.3, 0.8, 0.6, 0.1, 0.9, 0.7])
  const times = ['lunch', 'dinner'] as const

  it('plans the main meal of every day at the chosen time', () => {
    times.forEach((time) =>
      expect(
        mainMealTimesOf(
          filledWeekPlan(everyKind, WEEK, mixedRandom(), time),
          everyKind,
        ),
      ).toEqual(WEEK_DATES.map(() => [time])),
    )
  })

  it('puts a side or a snack at the other time of every day', () => {
    const plan = filledWeekPlan(everyKind, WEEK, mixedRandom(), 'lunch')

    WEEK_DATES.forEach((day) =>
      expect(['bread', 'apple']).toContain(mealIn(plan, slot(day, 'dinner'))),
    )
  })

  it('tosses no coin for the time of the main meal', () => {
    const plan = filledWeekPlan(
      [bolognese, bread],
      WEEK,
      sequence([0]),
      'dinner',
    )

    expect(mainMealTimesOf(plan, [bolognese, bread])).toEqual(
      WEEK_DATES.map(() => ['dinner']),
    )
  })

  it('leaves the other time empty with nothing but main meals', () => {
    const stored = meals(7)
    const plan = filledWeekPlan(stored, WEEK, mixedRandom(), 'lunch')

    expect(mealsOf(plan).filter((id) => id !== null)).toHaveLength(7)
    expect(mainMealTimesOf(plan, stored)).toEqual(
      WEEK_DATES.map(() => ['lunch']),
    )
  })

  it('still rolls the breakfast and the snack', () => {
    const plan = filledWeekPlan(everyKind, WEEK, mixedRandom(), 'lunch')

    WEEK_DATES.forEach((day) => {
      expect(['muesli', 'apple']).toContain(
        mealIn(plan, slot(day, 'breakfast')),
      )
      expect(mealIn(plan, slot(day, 'snack'))).toBe('apple')
    })
  })
})

describe('pickMealFor with a fixed main meal time', () => {
  const stored = [muesli, pizza, bread, apple]

  function onlyAt(time: MealTime, id: string): WeekPlan {
    return withMealIn(EMPTY_PLAN, slot(MONDAY, time), id)
  }

  function countingRandom() {
    const counted = { calls: 0 }
    const random: RandomSource = () => {
      counted.calls += 1
      return 0
    }
    return { random, counted }
  }

  it('never rolls a main meal at the other time while it is empty', () => {
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'dinner'),
        sequence([0]),
        'lunch',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'dinner'),
        sequence([0.99]),
        'lunch',
      ),
    ).toEqual(apple)
  })

  it('never rolls a main meal at the other time beside a side', () => {
    expect(
      pickMealFor(
        stored,
        onlyAt('lunch', 'bread'),
        slot(MONDAY, 'dinner'),
        sequence([0]),
        'lunch',
      ),
    ).toEqual(apple)
  })

  it('picks nothing at the other time with nothing but main meals', () => {
    expect(
      pickMealFor(
        [pizza, bolognese],
        EMPTY_PLAN,
        slot(MONDAY, 'dinner'),
        sequence([0]),
        'lunch',
      ),
    ).toBeNull()
  })

  it('rolls the main meal at the chosen time without tossing a coin', () => {
    const { random, counted } = countingRandom()

    expect(
      pickMealFor(stored, EMPTY_PLAN, slot(MONDAY, 'lunch'), random, 'lunch'),
    ).toEqual(pizza)
    expect(counted.calls).toBe(1)
  })

  it('rolls the main meal at the chosen time beside a side, a snack or a breakfast', () => {
    const besides = ['bread', 'apple', 'muesli']

    besides.forEach((beside) =>
      expect(
        pickMealFor(
          stored,
          onlyAt('dinner', beside),
          slot(MONDAY, 'lunch'),
          sequence([0.99]),
          'lunch',
        ),
      ).toEqual(pizza),
    )
  })

  it('rolls a side or a snack at the chosen time beside a main meal set by hand', () => {
    expect(
      pickMealFor(
        [bolognese, ...stored],
        onlyAt('dinner', 'bolognese'),
        slot(MONDAY, 'lunch'),
        sequence([0]),
        'lunch',
      ),
    ).toEqual(bread)
  })

  it('mirrors every rule for dinner', () => {
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'lunch'),
        sequence([0]),
        'dinner',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'dinner'),
        sequence([0.99]),
        'dinner',
      ),
    ).toEqual(pizza)
    expect(
      pickMealFor(
        [bolognese, ...stored],
        onlyAt('lunch', 'bolognese'),
        slot(MONDAY, 'dinner'),
        sequence([0]),
        'dinner',
      ),
    ).toEqual(bread)
  })

  it('leaves the breakfast and the snack alone', () => {
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'breakfast'),
        sequence([0]),
        'lunch',
      ),
    ).toEqual(muesli)
    expect(
      pickMealFor(
        stored,
        EMPTY_PLAN,
        slot(MONDAY, 'snack'),
        sequence([0]),
        'dinner',
      ),
    ).toEqual(apple)
  })
})
