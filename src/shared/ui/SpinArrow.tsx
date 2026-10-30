import type { PointerEvent } from 'react'

function keepFocusWhereItIs(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault()
}

type SpinArrowProps = {
  symbol: string
  onPress: () => void
}

export function SpinArrow({ symbol, onPress }: SpinArrowProps) {
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
