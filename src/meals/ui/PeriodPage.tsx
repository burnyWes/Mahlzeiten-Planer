import { useRef, useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { Stepper } from '../../shared/ui/Stepper'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { periodDaysPhrase, periodFailureMessage } from '../domain/announcements'
import {
  canHaveFewerDays,
  canHaveMoreDays,
  createPlanPeriod,
  type PlanPeriod,
  type PlanPeriodDraft,
} from '../domain/planPeriod'

type PeriodPageProps = {
  period: PlanPeriod
  onApply: (period: PlanPeriod) => void
  onBack: () => void
  announce: (text: string) => void
}

export function PeriodPage({
  period,
  onApply,
  onBack,
  announce,
}: PeriodPageProps) {
  const heading = useHeadingFocus()
  const [draft, setDraft] = useState<PlanPeriodDraft>({
    start: period.start,
    days: period.days,
  })
  const [failureMessage, setFailureMessage] = useState('')
  const startField = useRef<HTMLInputElement>(null)

  function changeDays(days: number) {
    setDraft((previous) => ({ ...previous, days }))
    announce(periodDaysPhrase(days))
  }

  function apply() {
    try {
      onApply(createPlanPeriod(draft))
    } catch (error) {
      const message = periodFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
      startField.current?.focus()
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zum Wochenplan
      </button>
      <h1 ref={heading} tabIndex={-1}>
        Zeitraum
      </h1>
      <p className="field">
        <label htmlFor="periodStart">Startdatum</label>
        <input
          id="periodStart"
          ref={startField}
          type="date"
          value={draft.start}
          aria-describedby="periodFailure"
          onChange={(event) =>
            setDraft((previous) => ({ ...previous, start: event.target.value }))
          }
        />
      </p>
      <p id="periodFailure" className="failure">
        {failureMessage}
      </p>
      <div className="field" role="group" aria-labelledby="periodDaysLabel">
        <span id="periodDaysLabel">Anzahl Tage</span>
        <Stepper
          lessLabel="Ein Tag weniger"
          moreLabel="Ein Tag mehr"
          lessDisabled={!canHaveFewerDays(draft.days)}
          moreDisabled={!canHaveMoreDays(draft.days)}
          onLess={() => changeDays(draft.days - 1)}
          onMore={() => changeDays(draft.days + 1)}
        >
          <span className="stepperAmount">{draft.days}</span>
        </Stepper>
      </div>
      <BottomBar>
        <button type="button" onClick={apply}>
          <SaveIcon />
          Übernehmen
        </button>
      </BottomBar>
    </main>
  )
}
