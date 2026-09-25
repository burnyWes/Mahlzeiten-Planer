import { useState } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { Stepper } from '../../shared/ui/Stepper'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  periodDaysPhrase,
  planDateHeading,
  planDateName,
} from '../domain/announcements'
import {
  canHaveFewerDays,
  canHaveMoreDays,
  withEarlierStart,
  withFewerDays,
  withLaterStart,
  withMoreDays,
  type PlanPeriod,
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
  const [chosen, setChosen] = useState(period)

  function moveStart(change: (period: PlanPeriod) => PlanPeriod) {
    const moved = change(chosen)
    setChosen(moved)
    announce(planDateName(moved.start))
  }

  function changeDays(change: (period: PlanPeriod) => PlanPeriod) {
    const changed = change(chosen)
    setChosen(changed)
    announce(periodDaysPhrase(changed.days))
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zum Wochenplan
      </button>
      <h1 ref={heading} tabIndex={-1}>
        Zeitraum
      </h1>
      <div className="field" role="group" aria-labelledby="periodStartLabel">
        <span id="periodStartLabel">Startdatum</span>
        <Stepper
          lessLabel="Ein Tag früher"
          moreLabel="Ein Tag später"
          moreDisabled={false}
          onLess={() => moveStart(withEarlierStart)}
          onMore={() => moveStart(withLaterStart)}
        >
          <span className="stepperAmount">
            <span aria-hidden="true">{planDateHeading(chosen.start)}</span>
            <span className="visuallyHidden">{planDateName(chosen.start)}</span>
          </span>
        </Stepper>
      </div>
      <div className="field" role="group" aria-labelledby="periodDaysLabel">
        <span id="periodDaysLabel">Anzahl Tage</span>
        <Stepper
          lessLabel="Ein Tag weniger"
          moreLabel="Ein Tag mehr"
          lessDisabled={!canHaveFewerDays(chosen.days)}
          moreDisabled={!canHaveMoreDays(chosen.days)}
          onLess={() => changeDays(withFewerDays)}
          onMore={() => changeDays(withMoreDays)}
        >
          <span className="stepperAmount">{chosen.days}</span>
        </Stepper>
      </div>
      <BottomBar>
        <button type="button" onClick={() => onApply(chosen)}>
          <SaveIcon />
          Übernehmen
        </button>
      </BottomBar>
    </main>
  )
}
