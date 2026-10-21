import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  mainMealTimeExplanation,
  mainMealTimeHeading,
  mainMealTimeRuleName,
  ruleScopeName,
  rollingRulesHeading,
  ruleSwitchName,
  switchableRuleExplanation,
  switchableRuleName,
} from '../domain/announcements'
import {
  appliesIn,
  isMainMealTimeRule,
  MAIN_MEAL_TIME_RULES,
  SCOPES_OF_RULE,
  SWITCHABLE_RULES,
  type MainMealTimeRule,
  type RollingRules,
  type RuleInScope,
  type SwitchableRule,
} from '../domain/rollingRules'

type RollingRulesPageProps = {
  rollingRules: RollingRules
  onChooseMainMealTime: (rule: MainMealTimeRule) => void
  onSwitchRule: (ruleInScope: RuleInScope, on: boolean) => void
  onBack: () => void
}

const MAIN_MEAL_TIME_HEADING_ID = 'rule-mainMealTime-heading'
const MAIN_MEAL_TIME_EXPLANATION_ID = 'rule-mainMealTime-explanation'

function headingIdOf(rule: SwitchableRule): string {
  return `rule-${rule}-heading`
}

function explanationIdOf(rule: SwitchableRule): string {
  return `rule-${rule}-explanation`
}

export function RollingRulesPage({
  rollingRules,
  onChooseMainMealTime,
  onSwitchRule,
  onBack,
}: RollingRulesPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {rollingRulesHeading()}
      </h1>
      <section
        className="ruleGroup"
        aria-labelledby={MAIN_MEAL_TIME_HEADING_ID}
      >
        <h2 id={MAIN_MEAL_TIME_HEADING_ID}>{mainMealTimeHeading()}</h2>
        <p id={MAIN_MEAL_TIME_EXPLANATION_ID}>{mainMealTimeExplanation()}</p>
        <select
          aria-labelledby={MAIN_MEAL_TIME_HEADING_ID}
          aria-describedby={MAIN_MEAL_TIME_EXPLANATION_ID}
          value={rollingRules.mainMealTime}
          onChange={(event) => {
            if (isMainMealTimeRule(event.target.value))
              onChooseMainMealTime(event.target.value)
          }}
        >
          {MAIN_MEAL_TIME_RULES.map((rule) => (
            <option key={rule} value={rule}>
              {mainMealTimeRuleName(rule)}
            </option>
          ))}
        </select>
      </section>
      {SWITCHABLE_RULES.map((rule) => (
        <section
          key={rule}
          className="ruleGroup"
          aria-labelledby={headingIdOf(rule)}
        >
          <h2 id={headingIdOf(rule)}>{switchableRuleName(rule)}</h2>
          <p id={explanationIdOf(rule)}>{switchableRuleExplanation(rule)}</p>
          {SCOPES_OF_RULE[rule].map((scope) => (
            <label key={scope} className="settingsToggle">
              <span>{ruleScopeName(scope)}</span>
              <input
                type="checkbox"
                role="switch"
                aria-label={ruleSwitchName({ rule, scope })}
                aria-describedby={explanationIdOf(rule)}
                checked={appliesIn(rollingRules, rule, scope)}
                onChange={(event) =>
                  onSwitchRule({ rule, scope }, event.target.checked)
                }
              />
            </label>
          ))}
        </section>
      ))}
    </main>
  )
}
