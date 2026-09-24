import type { ReactNode } from 'react'

type StepperProps = {
  lessLabel: string
  moreLabel: string
  moreDisabled: boolean
  onLess: () => void
  onMore: () => void
  children: ReactNode
}

export function Stepper({
  lessLabel,
  moreLabel,
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
