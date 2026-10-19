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

export type SwitchableRule = 'leftovers'

export const SWITCHABLE_RULES: readonly SwitchableRule[] = ['leftovers']

export const MODES_OF_RULE: Record<SwitchableRule, readonly RollingMode[]> = {
  leftovers: ROLLING_MODES,
}

export type RuleInMode = { rule: SwitchableRule; mode: RollingMode }

const SWITCHES: readonly RuleInMode[] = SWITCHABLE_RULES.flatMap((rule) =>
  MODES_OF_RULE[rule].map((mode) => ({ rule, mode })),
)

export type RollingRules = {
  mainMealTime: MainMealTimeRule
  switchedOff: readonly RuleInMode[]
}

export const DEFAULT_ROLLING_RULES: RollingRules = {
  mainMealTime: DEFAULT_MAIN_MEAL_TIME_RULE,
  switchedOff: [],
}

function sameRuleInMode(one: RuleInMode, other: RuleInMode): boolean {
  return one.rule === other.rule && one.mode === other.mode
}

function isSwitchedOff(rules: RollingRules, ruleInMode: RuleInMode): boolean {
  return rules.switchedOff.some((off) => sameRuleInMode(off, ruleInMode))
}

function hasSwitch(ruleInMode: RuleInMode): boolean {
  return SWITCHES.some((each) => sameRuleInMode(each, ruleInMode))
}

export function appliesIn(
  rules: RollingRules,
  rule: SwitchableRule,
  mode: RollingMode,
): boolean {
  return !isSwitchedOff(rules, { rule, mode })
}

export function withRuleSwitched(
  rules: RollingRules,
  ruleInMode: RuleInMode,
  on: boolean,
): RollingRules {
  if (!hasSwitch(ruleInMode)) return rules
  const others = rules.switchedOff.filter(
    (off) => !sameRuleInMode(off, ruleInMode),
  )
  return {
    ...rules,
    switchedOff: on ? others : [...others, ruleInMode],
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

export function ruleInModeKey({ rule, mode }: RuleInMode): string {
  return `${rule}.${mode}`
}

export type StoredRollingRules = {
  mainMealTime?: unknown
  switchedOff?: unknown
  leftovers?: unknown
}

function switchedOffFromKeys(keys: unknown): readonly RuleInMode[] {
  if (!Array.isArray(keys)) return []
  return SWITCHES.filter((each) => keys.includes(ruleInModeKey(each)))
}

function switchedOffBeforeTheSwitches(
  leftovers: unknown,
): readonly RuleInMode[] {
  return leftovers === false
    ? SWITCHES.filter((each) => each.rule === 'leftovers')
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
