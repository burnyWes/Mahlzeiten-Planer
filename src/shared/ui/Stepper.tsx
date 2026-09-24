import type { ReactNode } from 'react'

type StepperProps = {
  lessLabel: string
  moreLabel: string
  lessDisabled?: boolean
  moreDisabled: boolean
  onLess: () => void
  onMore: () => void
  children: ReactNode
}

export function Stepper({
  lessLabel,
  moreLabel,
  lessDisabled,
  moreDisabled,
  onLess,
  onMore,
  children,
}: StepperProps) {
  return (
    <span className="stepper">
      <button
        type="button"
        className="stepperButton"
        aria-label={lessLabel}
        disabled={lessDisabled}
        onClick={onLess}
      >
        −
      </button>
      {children}
      <button
        type="button"
        className="stepperButton"
        aria-label={moreLabel}
        disabled={moreDisabled}
        onClick={onMore}
      >
        +
      </button>
    </span>
  )
}
