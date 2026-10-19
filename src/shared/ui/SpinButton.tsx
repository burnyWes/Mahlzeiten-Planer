import type { KeyboardEvent, ReactNode } from 'react'
import type { AmountStep } from '../domain/quantity'

const STEP_OF_KEY: Partial<Record<string, AmountStep>> = {
  ArrowUp: 1,
  ArrowDown: -1,
}

type SpinButtonProps = {
  label: string
  className?: string
  value: number | null
  minimum: number
  maximum: number
  valueText: string
  onStep: (step: AmountStep) => void
  children: ReactNode
}

export function SpinButton({
  label,
  className,
  value,
  minimum,
  maximum,
  valueText,
  onStep,
  children,
}: SpinButtonProps) {
  function stepOnArrowKey(event: KeyboardEvent<HTMLDivElement>) {
    const step = STEP_OF_KEY[event.key]
    if (step === undefined) return
    event.preventDefault()
    onStep(step)
  }

  return (
    <div
      role="spinbutton"
      className={className}
      tabIndex={0}
      aria-label={label}
      aria-valuenow={value ?? undefined}
      aria-valuemin={minimum}
      aria-valuemax={maximum}
      aria-valuetext={valueText}
      onKeyDown={stepOnArrowKey}
    >
      {children}
    </div>
  )
}
