import type { PointerEvent } from 'react'
import type { AmountStep } from '../domain/quantity'
import { SpinButton } from './SpinButton'

function keepFocusWhereItIs(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault()
}

type SpinArrowProps = {
  symbol: string
  onPress: () => void
}

function SpinArrow({ symbol, onPress }: SpinArrowProps) {
  return (
    <button
      type="button"
      className="spinArrow"
      aria-hidden="true"
      tabIndex={-1}
      onPointerDown={keepFocusWhereItIs}
      onClick={onPress}
    >
      {symbol}
    </button>
  )
}

type AmountSpinnerProps = {
  valueText: string
  value: number | null
  minimum: number
  maximum: number
  onStep: (step: AmountStep) => void
}

export function AmountSpinner({
  valueText,
  value,
  minimum,
  maximum,
  onStep,
}: AmountSpinnerProps) {
  return (
    <SpinButton
      label="Menge ändern"
      className="amountSpinner"
      value={value}
      minimum={minimum}
      maximum={maximum}
      valueText={valueText}
      onStep={onStep}
    >
      <SpinArrow symbol="▲" onPress={() => onStep(1)} />
      <SpinArrow symbol="▼" onPress={() => onStep(-1)} />
    </SpinButton>
  )
}
