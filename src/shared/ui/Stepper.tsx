import type { ReactNode, Ref } from 'react'

type StepperProps = {
  lessLabel: string
  moreLabel: string
  lessDisabled?: boolean
  lessButton?: Ref<HTMLButtonElement>
  moreDisabled: boolean
  onLess: () => void
  onMore: () => void
  children: ReactNode
}

export function Stepper({
  lessLabel,
  moreLabel,
  lessDisabled = false,
  lessButton,
  moreDisabled,
  onLess,
  onMore,
  children,
}: StepperProps) {
  return (
    <span className="stepper">
      <button
        ref={lessButton}
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
