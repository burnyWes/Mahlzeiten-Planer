import type { MealTime } from './weekPlan'

export type MainMealTime = Extract<MealTime, 'lunch' | 'dinner'>

export type MainMealTimeRule = MainMealTime | 'lunchOrDinner'

export const MAIN_MEAL_TIME_RULES: readonly MainMealTimeRule[] = [
  'lunchOrDinner',
  'lunch',
  'dinner',
]

export const DEFAULT_MAIN_MEAL_TIME_RULE: MainMealTimeRule = 'lunchOrDinner'

export function isMainMealTimeRule(value: unknown): value is MainMealTimeRule {
  return MAIN_MEAL_TIME_RULES.some((rule) => rule === value)
}

export type RollingMode = 'singleMeal' | 'wholePlan'

export const ROLLING_MODES: readonly RollingMode[] = ['singleMeal', 'wholePlan']

export type RuleScope = RollingMode | 'manualChoice' | 'transfer'

export type SwitchableRule =
  | 'categories'
  | 'leftovers'
  | 'repeatingBreakfastAndSnack'
  | 'variety'
  | 'otherMeal'
  | 'alreadyRolled'
  | 'supplies'

export const SWITCHABLE_RULES: readonly SwitchableRule[] = [
  'categories',
  'leftovers',
  'repeatingBreakfastAndSnack',
  'variety',
  'otherMeal',
  'alreadyRolled',
  'supplies',
]

export const SCOPES_OF_RULE: Record<SwitchableRule, readonly RuleScope[]> = {
  categories: ROLLING_MODES,
  leftovers: [...ROLLING_MODES, 'manualChoice'],
  repeatingBreakfastAndSnack: ROLLING_MODES,
  variety: ROLLING_MODES,
  otherMeal: ['singleMeal'],
  alreadyRolled: ['singleMeal'],
  supplies: ['transfer'],
}

export type RuleInScope = { rule: SwitchableRule; scope: RuleScope }

const SWITCHES: readonly RuleInScope[] = SWITCHABLE_RULES.flatMap((rule) =>
  SCOPES_OF_RULE[rule].map((scope) => ({ rule, scope })),
)

export type RollingRules = {
  mainMealTime: MainMealTimeRule
  switchedOff: readonly RuleInScope[]
}

export const DEFAULT_ROLLING_RULES: RollingRules = {
  mainMealTime: DEFAULT_MAIN_MEAL_TIME_RULE,
  switchedOff: [],
}

function sameRuleInScope(one: RuleInScope, other: RuleInScope): boolean {
  return one.rule === other.rule && one.scope === other.scope
}

function isSwitchedOff(rules: RollingRules, ruleInScope: RuleInScope): boolean {
  return rules.switchedOff.some((off) => sameRuleInScope(off, ruleInScope))
}

function hasSwitch(ruleInScope: RuleInScope): boolean {
  return SWITCHES.some((each) => sameRuleInScope(each, ruleInScope))
}

export function appliesIn(
  rules: RollingRules,
  rule: SwitchableRule,
  scope: RuleScope,
): boolean {
  return !isSwitchedOff(rules, { rule, scope })
}

export function withRuleSwitched(
  rules: RollingRules,
  ruleInScope: RuleInScope,
  on: boolean,
): RollingRules {
  if (!hasSwitch(ruleInScope)) return rules
  const others = rules.switchedOff.filter(
    (off) => !sameRuleInScope(off, ruleInScope),
  )
  return {
    ...rules,
    switchedOff: on ? others : [...others, ruleInScope],
  }
}

export function sameRollingRules(
  one: RollingRules,
  other: RollingRules,
): boolean {
  return (
    one.mainMealTime === other.mainMealTime &&
    one.switchedOff.length === other.switchedOff.length &&
    one.switchedOff.every((off) => isSwitchedOff(other, off))
  )
}

export function ruleInScopeKey({ rule, scope }: RuleInScope): string {
  return `${rule}.${scope}`
}

export type StoredRollingRules = {
  mainMealTime?: unknown
  switchedOff?: unknown
  leftovers?: unknown
}

function switchedOffFromKeys(keys: unknown): readonly RuleInScope[] {
  if (!Array.isArray(keys)) return []
  return SWITCHES.filter((each) => keys.includes(ruleInScopeKey(each)))
}

function switchedOffBeforeTheSwitches(
  leftovers: unknown,
): readonly RuleInScope[] {
  return leftovers === false
    ? ROLLING_MODES.map((scope) => ({ rule: 'leftovers', scope }))
    : []
}

export function rollingRulesFromStored(
  stored: StoredRollingRules,
): RollingRules {
  return {
    mainMealTime: isMainMealTimeRule(stored.mainMealTime)
      ? stored.mainMealTime
      : DEFAULT_MAIN_MEAL_TIME_RULE,
    switchedOff:
      stored.switchedOff === undefined
        ? switchedOffBeforeTheSwitches(stored.leftovers)
        : switchedOffFromKeys(stored.switchedOff),
  }
}
