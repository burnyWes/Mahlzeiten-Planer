import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { AmountStep } from '../domain/quantity'
import { AmountSpinner } from './AmountSpinner'

function renderAmountSpinner() {
  const steps: AmountStep[] = []
  render(
    <AmountSpinner
      valueText="2"
      value={2}
      minimum={1}
      maximum={99}
      onStep={(step) => steps.push(step)}
    />,
  )
  return { steps }
}

function arrow(symbol: string) {
  return screen.getByText(symbol)
}

describe('AmountSpinner', () => {
  it('offers itself as one adjustable element named for changing the amount', () => {
    renderAmountSpinner()

    expect(
      screen.getByRole('spinbutton', { name: 'Menge ändern' }),
    ).toHaveAttribute('aria-valuetext', '2')
    expect(arrow('▲')).toHaveAttribute('aria-hidden', 'true')
    expect(arrow('▼')).toHaveAttribute('aria-hidden', 'true')
  })

  it('steps up and down with its arrows', async () => {
    const { steps } = renderAmountSpinner()

    await userEvent.click(arrow('▲'))
    await userEvent.click(arrow('▼'))

    expect(steps).toEqual([1, -1])
  })

  it.each(['▲', '▼'])(
    'keeps the focus where it is when %s is touched',
    (symbol) => {
      renderAmountSpinner()

      expect(fireEvent.pointerDown(arrow(symbol))).toBe(false)
    },
  )

  it('leaves its arrows out of the tab order', async () => {
    renderAmountSpinner()

    await userEvent.tab()
    expect(screen.getByRole('spinbutton')).toHaveFocus()

    await userEvent.tab()
    expect(document.body).toHaveFocus()
  })
})
