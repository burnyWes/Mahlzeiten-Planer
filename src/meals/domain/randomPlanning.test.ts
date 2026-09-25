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
import {
  EMPTY_WEEK_PLAN,
  mealIn,
  PLAN_SLOTS,
  WEEKDAYS,
  withMealIn,
  type MealTime,
  type PlanSlot,
  type WeekPlan,
  type Weekday,
} from './weekPlan'

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
  const planned = mealsOf(plan).filter((id) => id !== null)
  return [...new Set(planned)].map(
    (id) => planned.filter((other) => other === id).length,
  )
}

function mainMealTimesOf(
  plan: WeekPlan,
  stored: readonly Meal[],
): readonly (readonly MealTime[])[] {
  return WEEKDAYS.map((day) =>
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
        slot('monday', 'dinner'),
        anyRandom,
        [bolognese, pizza, soup],
      ),
    ).toEqual([soup])
  })

  it('keeps every meal while the plan is empty', () => {
    expect(
      rarestInThePlan(
        [bolognese, pizza],
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
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
        slot('monday', 'breakfast'),
        anyRandom,
        [bolognese, pizza],
      ),
    ).toEqual([pizza])
  })

  it('counts the meals of every meal time of the week', () => {
    const plan = withMealIn(
      withMealIn(EMPTY_WEEK_PLAN, slot('tuesday', 'snack'), 'bolognese'),
      slot('sunday', 'dinner'),
      'pizza',
    )

    expect(
      rarestInThePlan(
        [bolognese, pizza, soup],
        plan,
        slot('friday', 'lunch'),
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
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
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
        slot('monday', 'lunch'),
        anyRandom,
        [bolognese, pizza, soup],
      ),
    ).toEqual([soup])
  })
})

describe('otherThanPlanned', () => {
  it('leaves out the meal that stands in the slot', () => {
    const plan = withMealIn(
      EMPTY_WEEK_PLAN,
      slot('monday', 'breakfast'),
      'muesli',
    )

    expect(
      otherThanPlanned(
        [muesli, porridge],
        plan,
        slot('monday', 'breakfast'),
        anyRandom,
        [muesli, porridge],
      ),
    ).toEqual([porridge])
  })

  it('keeps every meal for an empty slot', () => {
    expect(
      otherThanPlanned(
        [muesli, porridge],
        EMPTY_WEEK_PLAN,
        slot('monday', 'breakfast'),
        anyRandom,
        [muesli, porridge],
      ),
    ).toEqual([muesli, porridge])
  })

  it('rolls the planned meal again when no other one suits', () => {
    const plan = withMealIn(
      EMPTY_WEEK_PLAN,
      slot('monday', 'breakfast'),
      'muesli',
    )

    expect(
      pickMealFor(
        [muesli, bolognese],
        plan,
        slot('monday', 'breakfast'),
        sequence([0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(muesli)
  })

  it('rolls another meal than the planned one', () => {
    const plan = withMealIn(
      EMPTY_WEEK_PLAN,
      slot('monday', 'breakfast'),
      'porridge',
    )

    expect(
      pickMealFor(
        [muesli, porridge],
        withMealIn(plan, slot('friday', 'breakfast'), 'muesli'),
        slot('monday', 'breakfast'),
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
    return withMealIn(EMPTY_WEEK_PLAN, at, id)
  }

  it('leaves out a meal that shares a category with the day before', () => {
    expect(
      apartFor(
        planned(slot('monday', 'dinner'), 'lasagne'),
        slot('tuesday', 'lunch'),
      ),
    ).toEqual([rice])
  })

  it('leaves out a meal that shares a category with the day after', () => {
    expect(
      apartFor(
        planned(slot('wednesday', 'lunch'), 'lasagne'),
        slot('tuesday', 'dinner'),
      ),
    ).toEqual([rice])
  })

  it('leaves out a meal that shares a category with the other meal time of the day', () => {
    expect(
      apartFor(
        planned(slot('tuesday', 'lunch'), 'lasagne'),
        slot('tuesday', 'dinner'),
      ),
    ).toEqual([rice])
  })

  it('compares the categories regardless of their case', () => {
    const lowerLasagne = meal('lasagne', 'mainMeal', ['nudeln'])

    expect(
      apartFor(
        planned(slot('monday', 'dinner'), 'lasagne'),
        slot('tuesday', 'lunch'),
        [pasta, rice],
        [lowerLasagne, pasta, rice],
      ),
    ).toEqual([rice])
  })

  it('keeps a side apart as well', () => {
    expect(
      apartFor(
        planned(slot('monday', 'dinner'), 'lasagne'),
        slot('tuesday', 'lunch'),
        [carbonara, rice],
      ),
    ).toEqual([rice])
  })

  it('does not count a snack or a breakfast beside it', () => {
    const plan = withMealIn(
      planned(slot('monday', 'dinner'), 'noodleSnack'),
      slot('tuesday', 'dinner'),
      'noodleBreakfast',
    )

    expect(
      apartFor(
        plan,
        slot('tuesday', 'lunch'),
        [pasta, rice],
        [noodleSnack, noodleBreakfast, pasta, rice],
      ),
    ).toEqual([pasta, rice])
  })

  it('keeps a snack that shares a category', () => {
    expect(
      apartFor(
        planned(slot('monday', 'dinner'), 'lasagne'),
        slot('tuesday', 'lunch'),
        [noodleSnack, rice],
      ),
    ).toEqual([noodleSnack, rice])
  })

  it('does not count the slot that is being rolled', () => {
    expect(
      apartFor(
        planned(slot('tuesday', 'lunch'), 'lasagne'),
        slot('tuesday', 'lunch'),
      ),
    ).toEqual([pasta, rice])
  })

  it('looks at no day before Monday', () => {
    expect(
      apartFor(
        planned(slot('sunday', 'dinner'), 'lasagne'),
        slot('monday', 'lunch'),
      ),
    ).toEqual([pasta, rice])
  })

  it('looks at no day after Sunday', () => {
    expect(
      apartFor(
        planned(slot('monday', 'lunch'), 'lasagne'),
        slot('sunday', 'dinner'),
      ),
    ).toEqual([pasta, rice])
  })

  it('counts a hidden meal beside it', () => {
    expect(
      apartFor(
        planned(slot('monday', 'dinner'), 'lasagne'),
        slot('tuesday', 'lunch'),
        [pasta, rice],
        [{ ...lasagne, hidden: true }, pasta, rice],
      ),
    ).toEqual([rice])
  })

  it('keeps the categories apart before it looks for the rarest meal', () => {
    const plan = withMealIn(
      withMealIn(
        planned(slot('monday', 'dinner'), 'lasagne'),
        slot('tuesday', 'dinner'),
        'bread',
      ),
      slot('friday', 'lunch'),
      'rice',
    )

    expect(
      pickMealFor(
        [lasagne, pasta, rice, bread],
        plan,
        slot('tuesday', 'lunch'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(rice)
  })

  it('leaves the choice to the rarest meal when every meal shares a category', () => {
    const plan = withMealIn(
      withMealIn(
        planned(slot('monday', 'dinner'), 'lasagne'),
        slot('tuesday', 'dinner'),
        'bread',
      ),
      slot('friday', 'lunch'),
      'penne',
    )

    expect(
      pickMealFor(
        [lasagne, pasta, penne, bread],
        plan,
        slot('tuesday', 'lunch'),
        sequence([0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(pasta)
  })
})

describe('stayingLikeTheDayBefore', () => {
  const mondayMuesli = withMealIn(
    EMPTY_WEEK_PLAN,
    slot('monday', 'breakfast'),
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
        slot('tuesday', 'breakfast'),
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
          slot('tuesday', 'breakfast'),
          sequence([coin, 0]),
          'lunchOrDinner',
        ),
      ).toEqual(porridge),
    )
  })

  it('stays with the snack of the day before', () => {
    const plan = withMealIn(EMPTY_WEEK_PLAN, slot('monday', 'snack'), 'apple')
    const nuts = meal('nuts', 'snack')

    expect(
      pickMealFor(
        [nuts, apple],
        plan,
        slot('tuesday', 'snack'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(apple)
  })

  it('tosses no coin on Monday', () => {
    const { random, tossed } = countingRandom(0)

    expect(
      stayingLikeTheDayBefore(
        [muesli, porridge],
        withMealIn(EMPTY_WEEK_PLAN, slot('sunday', 'breakfast'), 'muesli'),
        slot('monday', 'breakfast'),
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
        EMPTY_WEEK_PLAN,
        slot('tuesday', 'breakfast'),
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
        withMealIn(EMPTY_WEEK_PLAN, slot('monday', 'breakfast'), 'bolognese'),
        slot('tuesday', 'breakfast'),
        random,
        [bolognese, muesli, porridge],
      ),
    ).toEqual([muesli, porridge])
    expect(tossed).toEqual([])
  })

  it('never stays at lunch or dinner, not even with a snack', () => {
    const { random, tossed } = countingRandom(0)
    const plan = withMealIn(
      withMealIn(EMPTY_WEEK_PLAN, slot('monday', 'lunch'), 'apple'),
      slot('monday', 'dinner'),
      'apple',
    )
    const times = ['lunch', 'dinner'] as const

    times.forEach((time) =>
      expect(
        stayingLikeTheDayBefore(
          [bread, apple],
          plan,
          slot('tuesday', time),
          random,
          [bread, apple],
        ),
      ).toEqual([bread, apple]),
    )
    expect(tossed).toEqual([])
  })

  it('rolls another meal than the planned one even if it stood there the day before', () => {
    const plan = withMealIn(
      mondayMuesli,
      slot('tuesday', 'breakfast'),
      'muesli',
    )

    expect(
      pickMealFor(
        [muesli, porridge],
        plan,
        slot('tuesday', 'breakfast'),
        sequence([0.99, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(porridge)
  })

  it('keeps the same breakfast all week when it always stays', () => {
    const plan = filledWeekPlan(
      meals(3, 'breakfast'),
      sequence([0]),
      'lunchOrDinner',
    )

    expect(WEEKDAYS.map((day) => mealIn(plan, slot(day, 'breakfast')))).toEqual(
      WEEKDAYS.map(() => 'meal-1'),
    )
  })

  it('keeps the same snack all week when it always stays', () => {
    const plan = filledWeekPlan(
      meals(3, 'snack'),
      sequence([0]),
      'lunchOrDinner',
    )
    const mondaySnack = mealIn(plan, slot('monday', 'snack'))

    expect(mondaySnack).not.toBeNull()
    expect(WEEKDAYS.map((day) => mealIn(plan, slot(day, 'snack')))).toEqual(
      WEEKDAYS.map(() => mondaySnack),
    )
  })

  it('changes the breakfast every day when it never stays', () => {
    const plan = filledWeekPlan(
      meals(3, 'breakfast'),
      sequence([0.99]),
      'lunchOrDinner',
    )
    const breakfasts = WEEKDAYS.map((day) =>
      mealIn(plan, slot(day, 'breakfast')),
    )

    expect(
      breakfasts
        .slice(1)
        .map((breakfast, position) => breakfast !== breakfasts[position]),
    ).toEqual(WEEKDAYS.slice(1).map(() => true))
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
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toBeNull()
  })

  it('picks the only meal there is', () => {
    expect(
      pickMealFor(
        [bolognese],
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([0, 0.5]),
        'lunchOrDinner',
      ),
    ).toEqual(bolognese)
  })

  it('never picks a hidden meal', () => {
    expect(
      pickMealFor(
        [hiddenBolognese, pizza],
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
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
        slot('monday', 'breakfast'),
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
        slot('monday', 'breakfast'),
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
        EMPTY_WEEK_PLAN,
        slot('monday', 'snack'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(snacks[0])
    expect(
      pickMealFor(
        snacks,
        EMPTY_WEEK_PLAN,
        slot('monday', 'snack'),
        sequence([0.999999]),
        'lunchOrDinner',
      ),
    ).toEqual(snacks[2])
    expect(
      pickMealFor(
        snacks,
        EMPTY_WEEK_PLAN,
        slot('monday', 'snack'),
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
        EMPTY_WEEK_PLAN,
        slot('monday', 'breakfast'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(muesli)
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'breakfast'),
        sequence([0.99]),
        'lunchOrDinner',
      ),
    ).toEqual(apple)
  })

  it('rolls only a snack for the snack', () => {
    expect(
      pickMealFor(
        [muesli, bolognese, bread, apple],
        EMPTY_WEEK_PLAN,
        slot('monday', 'snack'),
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
            EMPTY_WEEK_PLAN,
            slot('monday', time),
            sequence([coin, 0]),
            'lunchOrDinner',
          ),
        ).toBeNull(),
      ),
    )
  })

  it('rolls a side or a snack beside the main meal of the day', () => {
    const plan = withMealIn(
      EMPTY_WEEK_PLAN,
      slot('monday', 'dinner'),
      'bolognese',
    )
    const stored = [bolognese, pizza, bread, apple]

    expect(
      pickMealFor(
        stored,
        plan,
        slot('monday', 'lunch'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        plan,
        slot('monday', 'lunch'),
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
          withMealIn(EMPTY_WEEK_PLAN, slot('monday', 'lunch'), beside),
          slot('monday', 'dinner'),
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
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([0, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(pizza)
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([0.5, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'dinner'),
        sequence([0, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'dinner'),
        sequence([0.5, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(pizza)
  })

  it('follows the given main meal time instead of tossing a coin', () => {
    expect(
      pickMealFor(
        [pizza, bread],
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
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
        withMealIn(EMPTY_WEEK_PLAN, slot('monday', 'dinner'), 'bolognese'),
        slot('monday', 'lunch'),
        sequence([0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
  })

  it('counts an unknown meal on the other meal time as empty', () => {
    const plan = withMealIn(EMPTY_WEEK_PLAN, slot('monday', 'dinner'), 'gone')

    expect(
      pickMealFor(
        [pizza, bread],
        plan,
        slot('monday', 'lunch'),
        sequence([0, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(pizza)
    expect(
      pickMealFor(
        [pizza, bread],
        plan,
        slot('monday', 'lunch'),
        sequence([0.5, 0]),
        'lunchOrDinner',
      ),
    ).toEqual(bread)
  })

  it('picks nothing when no stored meal suits the slot', () => {
    expect(
      pickMealFor(
        [bolognese],
        EMPTY_WEEK_PLAN,
        slot('monday', 'breakfast'),
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
    expect(filledWeekPlan([], sequence([0.3]), 'lunchOrDinner')).toEqual(
      EMPTY_WEEK_PLAN,
    )
  })

  it('fills every slot without repeating a meal when it never stays and enough meals of each kind are stored', () => {
    const stored = [
      ...meals(7, 'breakfast', 'breakfast'),
      ...meals(21, 'snack', 'snack'),
      ...meals(7, 'mainMeal', 'main'),
      ...meals(7, 'none', 'side'),
    ]
    const plan = filledWeekPlan(stored, sequence([0.99]), 'lunchOrDinner')
    const planned = mealsOf(plan)

    expect(new Set(planned).size).toBe(28)
    expect(planned).not.toContain(null)
  })

  it('spreads the meals of one kind over their slots as evenly as it can when it never stays', () => {
    const plan = filledWeekPlan(
      meals(3, 'snack'),
      sequence([0.99]),
      'lunchOrDinner',
    )

    expect(timesPlannedIn(plan)).toEqual([7, 7, 7])
  })

  it('walks through the candidates when the random source always gives zero', () => {
    const plan = filledWeekPlan(meals(7), sequence([0]), 'lunchOrDinner')

    expect(mealsOf(plan)).toEqual(
      WEEKDAYS.flatMap((_, position) => [
        null,
        `meal-${position + 1}`,
        null,
        null,
      ]),
    )
  })

  it('plans exactly one main meal a day, now at lunch and now at dinner', () => {
    const plan = filledWeekPlan(everyKind, mixedRandom(), 'lunchOrDinner')
    const mainMealTimes = mainMealTimesOf(plan, everyKind)

    expect(mainMealTimes.map((times) => times.length)).toEqual(
      WEEKDAYS.map(() => 1),
    )
    expect(new Set(mainMealTimes.flat())).toEqual(new Set(['lunch', 'dinner']))
  })

  it('puts a side or a snack beside the main meal of each day', () => {
    const plan = filledWeekPlan(everyKind, mixedRandom(), 'lunchOrDinner')

    WEEKDAYS.forEach((day) =>
      expect(
        [mealIn(plan, slot(day, 'lunch')), mealIn(plan, slot(day, 'dinner'))]
          .filter((id) => id !== 'bolognese')
          .map((id) => ['bread', 'apple'].includes(id ?? '')),
      ).toEqual([true]),
    )
  })

  it('rolls a breakfast or a snack for every breakfast and a snack for every snack', () => {
    const plan = filledWeekPlan(everyKind, mixedRandom(), 'lunchOrDinner')

    WEEKDAYS.forEach((day) => {
      expect(['muesli', 'apple']).toContain(
        mealIn(plan, slot(day, 'breakfast')),
      )
      expect(mealIn(plan, slot(day, 'snack'))).toBe('apple')
    })
  })

  it('never plans the same category of main meal on two days in a row', () => {
    const plan = filledWeekPlan(
      [pasta, penne, rice, meal('risotto', 'mainMeal', ['Reis'])],
      sequence([0]),
      'lunchOrDinner',
    )

    expect(WEEKDAYS.map((day) => mealIn(plan, slot(day, 'lunch')))).toEqual([
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
    const plan = filledWeekPlan([bolognese], mixedRandom(), 'lunchOrDinner')

    expect(mealsOf(plan).filter((id) => id !== null)).toHaveLength(7)
    WEEKDAYS.forEach((day) => {
      expect(mealIn(plan, slot(day, 'breakfast'))).toBeNull()
      expect(mealIn(plan, slot(day, 'snack'))).toBeNull()
    })
    expect(
      mainMealTimesOf(plan, [bolognese]).map((times) => times.length),
    ).toEqual(WEEKDAYS.map(() => 1))
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
          filledWeekPlan(everyKind, mixedRandom(), time),
          everyKind,
        ),
      ).toEqual(WEEKDAYS.map(() => [time])),
    )
  })

  it('puts a side or a snack at the other time of every day', () => {
    const plan = filledWeekPlan(everyKind, mixedRandom(), 'lunch')

    WEEKDAYS.forEach((day) =>
      expect(['bread', 'apple']).toContain(mealIn(plan, slot(day, 'dinner'))),
    )
  })

  it('tosses no coin for the time of the main meal', () => {
    const plan = filledWeekPlan([bolognese, bread], sequence([0]), 'dinner')

    expect(mainMealTimesOf(plan, [bolognese, bread])).toEqual(
      WEEKDAYS.map(() => ['dinner']),
    )
  })

  it('leaves the other time empty with nothing but main meals', () => {
    const stored = meals(7)
    const plan = filledWeekPlan(stored, mixedRandom(), 'lunch')

    expect(mealsOf(plan).filter((id) => id !== null)).toHaveLength(7)
    expect(mainMealTimesOf(plan, stored)).toEqual(WEEKDAYS.map(() => ['lunch']))
  })

  it('still rolls the breakfast and the snack', () => {
    const plan = filledWeekPlan(everyKind, mixedRandom(), 'lunch')

    WEEKDAYS.forEach((day) => {
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
    return withMealIn(EMPTY_WEEK_PLAN, slot('monday', time), id)
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
        EMPTY_WEEK_PLAN,
        slot('monday', 'dinner'),
        sequence([0]),
        'lunch',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'dinner'),
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
        slot('monday', 'dinner'),
        sequence([0]),
        'lunch',
      ),
    ).toEqual(apple)
  })

  it('picks nothing at the other time with nothing but main meals', () => {
    expect(
      pickMealFor(
        [pizza, bolognese],
        EMPTY_WEEK_PLAN,
        slot('monday', 'dinner'),
        sequence([0]),
        'lunch',
      ),
    ).toBeNull()
  })

  it('rolls the main meal at the chosen time without tossing a coin', () => {
    const { random, counted } = countingRandom()

    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        random,
        'lunch',
      ),
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
          slot('monday', 'lunch'),
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
        slot('monday', 'lunch'),
        sequence([0]),
        'lunch',
      ),
    ).toEqual(bread)
  })

  it('mirrors every rule for dinner', () => {
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'lunch'),
        sequence([0]),
        'dinner',
      ),
    ).toEqual(bread)
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'dinner'),
        sequence([0.99]),
        'dinner',
      ),
    ).toEqual(pizza)
    expect(
      pickMealFor(
        [bolognese, ...stored],
        onlyAt('lunch', 'bolognese'),
        slot('monday', 'dinner'),
        sequence([0]),
        'dinner',
      ),
    ).toEqual(bread)
  })

  it('leaves the breakfast and the snack alone', () => {
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'breakfast'),
        sequence([0]),
        'lunch',
      ),
    ).toEqual(muesli)
    expect(
      pickMealFor(
        stored,
        EMPTY_WEEK_PLAN,
        slot('monday', 'snack'),
        sequence([0]),
        'dinner',
      ),
    ).toEqual(apple)
  })
})
