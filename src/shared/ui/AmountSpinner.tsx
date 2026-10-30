import type { AmountStep } from '../domain/quantity'
import { SpinArrow } from './SpinArrow'
import { SpinButton } from './SpinButton'

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
