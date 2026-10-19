import { describe, expect, it } from 'vitest'
import {
  appliesIn,
  DEFAULT_ROLLING_RULES,
  isMainMealTimeRule,
  MAIN_MEAL_TIME_RULES,
  MODES_OF_RULE,
  SWITCHABLE_RULES,
  rollingRulesFromStored,
  ruleInModeKey,
  sameRollingRules,
  withRuleSwitched,
  type RollingRules,
  type RuleInMode,
} from './rollingRules'

const LEFTOVERS_FOR_A_SINGLE_MEAL: RuleInMode = {
  rule: 'leftovers',
  mode: 'singleMeal',
}

const LEFTOVERS_FOR_THE_WHOLE_PLAN: RuleInMode = {
  rule: 'leftovers',
  mode: 'wholePlan',
}

function switchedOff(...rulesInModes: readonly RuleInMode[]): RollingRules {
  return { mainMealTime: 'dinner', switchedOff: rulesInModes }
}

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

describe('DEFAULT_ROLLING_RULES', () => {
  it('rolls the main meal at lunch or dinner with every rule switched on', () => {
    expect(DEFAULT_ROLLING_RULES).toEqual({
      mainMealTime: 'lunchOrDinner',
      switchedOff: [],
    })
  })
})

describe('appliesIn', () => {
  it('applies every rule in every mode while nothing is switched off', () => {
    expect(appliesIn(switchedOff(), 'leftovers', 'singleMeal')).toBe(true)
    expect(appliesIn(switchedOff(), 'leftovers', 'wholePlan')).toBe(true)
  })

  it('leaves out a rule only in the mode it is switched off for', () => {
    const rules = switchedOff(LEFTOVERS_FOR_A_SINGLE_MEAL)

    expect(appliesIn(rules, 'leftovers', 'singleMeal')).toBe(false)
    expect(appliesIn(rules, 'leftovers', 'wholePlan')).toBe(true)
  })
})

describe('withRuleSwitched', () => {
  it('switches a rule off in one mode', () => {
    expect(
      withRuleSwitched(switchedOff(), LEFTOVERS_FOR_A_SINGLE_MEAL, false),
    ).toEqual(switchedOff(LEFTOVERS_FOR_A_SINGLE_MEAL))
  })

  it('switches a rule off only once', () => {
    const rules = switchedOff(LEFTOVERS_FOR_A_SINGLE_MEAL)

    expect(withRuleSwitched(rules, LEFTOVERS_FOR_A_SINGLE_MEAL, false)).toEqual(
      rules,
    )
  })

  it('switches a rule on again', () => {
    const rules = switchedOff(
      LEFTOVERS_FOR_A_SINGLE_MEAL,
      LEFTOVERS_FOR_THE_WHOLE_PLAN,
    )

    expect(
      withRuleSwitched(rules, { rule: 'leftovers', mode: 'singleMeal' }, true),
    ).toEqual(switchedOff(LEFTOVERS_FOR_THE_WHOLE_PLAN))
  })

  it('keeps the time of the main meal', () => {
    expect(
      withRuleSwitched(
        { mainMealTime: 'lunch', switchedOff: [] },
        LEFTOVERS_FOR_THE_WHOLE_PLAN,
        false,
      ).mainMealTime,
    ).toBe('lunch')
  })

  it('changes nothing for a mode the rule has no switch in', () => {
    const rules = switchedOff()
    const unknownMode = {
      rule: 'leftovers',
      mode: 'everyOtherDay',
    } as unknown as RuleInMode

    expect(withRuleSwitched(rules, unknownMode, false)).toEqual(rules)
  })

  it('switches the other meal off for a single meal only', () => {
    const rules = switchedOff()

    expect(
      withRuleSwitched(rules, { rule: 'otherMeal', mode: 'wholePlan' }, false),
    ).toEqual(rules)
    expect(
      withRuleSwitched(rules, { rule: 'otherMeal', mode: 'singleMeal' }, false),
    ).toEqual(switchedOff({ rule: 'otherMeal', mode: 'singleMeal' }))
  })
})

describe('SWITCHABLE_RULES', () => {
  it('lists the rules in the order of the rule management', () => {
    expect(SWITCHABLE_RULES).toEqual([
      'categories',
      'leftovers',
      'repeatingBreakfastAndSnack',
      'variety',
      'otherMeal',
    ])
  })

  it('offers every rule for both ways of rolling but the other meal for a single meal only', () => {
    expect(SWITCHABLE_RULES.map((rule) => [rule, MODES_OF_RULE[rule]])).toEqual(
      [
        ['categories', ['singleMeal', 'wholePlan']],
        ['leftovers', ['singleMeal', 'wholePlan']],
        ['repeatingBreakfastAndSnack', ['singleMeal', 'wholePlan']],
        ['variety', ['singleMeal', 'wholePlan']],
        ['otherMeal', ['singleMeal']],
      ],
    )
  })
})

describe('sameRollingRules', () => {
  it('takes rules with the same time and the same rules switched off as the same', () => {
    expect(
      sameRollingRules(
        switchedOff(LEFTOVERS_FOR_A_SINGLE_MEAL),
        switchedOff(LEFTOVERS_FOR_A_SINGLE_MEAL),
      ),
    ).toBe(true)
  })

  it('tells rules apart by the time of the main meal', () => {
    expect(
      sameRollingRules(
        { mainMealTime: 'dinner', switchedOff: [] },
        { mainMealTime: 'lunch', switchedOff: [] },
      ),
    ).toBe(false)
  })

  it('compares the rules switched off regardless of their order', () => {
    expect(
      sameRollingRules(
        switchedOff(LEFTOVERS_FOR_A_SINGLE_MEAL, LEFTOVERS_FOR_THE_WHOLE_PLAN),
        switchedOff(LEFTOVERS_FOR_THE_WHOLE_PLAN, LEFTOVERS_FOR_A_SINGLE_MEAL),
      ),
    ).toBe(true)
  })

  it('tells rules apart by the rules switched off', () => {
    expect(
      sameRollingRules(
        switchedOff(LEFTOVERS_FOR_A_SINGLE_MEAL),
        switchedOff(LEFTOVERS_FOR_A_SINGLE_MEAL, LEFTOVERS_FOR_THE_WHOLE_PLAN),
      ),
    ).toBe(false)
  })
})

describe('ruleInModeKey', () => {
  it('joins the rule and the mode with a dot', () => {
    expect(ruleInModeKey(LEFTOVERS_FOR_THE_WHOLE_PLAN)).toBe(
      'leftovers.wholePlan',
    )
  })
})

describe('rollingRulesFromStored', () => {
  it('reads an empty document as the default rules', () => {
    expect(rollingRulesFromStored({})).toEqual(DEFAULT_ROLLING_RULES)
  })

  it('reads the time of the main meal', () => {
    expect(rollingRulesFromStored({ mainMealTime: 'lunch' }).mainMealTime).toBe(
      'lunch',
    )
  })

  it('falls back to the default time for an unknown time', () => {
    expect(
      rollingRulesFromStored({ mainMealTime: 'breakfast' }).mainMealTime,
    ).toBe('lunchOrDinner')
  })

  it('reads the rules switched off', () => {
    expect(
      rollingRulesFromStored({ switchedOff: ['leftovers.singleMeal'] })
        .switchedOff,
    ).toEqual([LEFTOVERS_FOR_A_SINGLE_MEAL])
  })

  it('passes over unknown, broken or impossible keys', () => {
    expect(
      rollingRulesFromStored({
        switchedOff: ['otherMeal.wholePlan', 'foo', 42, 'leftovers.wholePlan'],
      }).switchedOff,
    ).toEqual([LEFTOVERS_FOR_THE_WHOLE_PLAN])
  })

  it('reads the categories switched off for the whole plan', () => {
    expect(
      rollingRulesFromStored({ switchedOff: ['categories.wholePlan'] })
        .switchedOff,
    ).toEqual([{ rule: 'categories', mode: 'wholePlan' }])
  })

  it('reads anything but a list of keys as nothing switched off', () => {
    expect(
      rollingRulesFromStored({ switchedOff: 'leftovers.wholePlan' })
        .switchedOff,
    ).toEqual([])
  })

  it('takes over leftovers switched off before the rules could be switched one by one', () => {
    expect(rollingRulesFromStored({ leftovers: false }).switchedOff).toEqual([
      LEFTOVERS_FOR_A_SINGLE_MEAL,
      LEFTOVERS_FOR_THE_WHOLE_PLAN,
    ])
  })

  it('ignores the old leftovers once the rules switched off are stored', () => {
    expect(
      rollingRulesFromStored({ leftovers: false, switchedOff: [] }).switchedOff,
    ).toEqual([])
  })
})
