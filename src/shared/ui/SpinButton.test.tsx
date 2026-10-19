import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AmountStep } from '../domain/quantity'
import { SpinButton } from './SpinButton'

function renderSpinButton(value: number | null = 3) {
  const steps: AmountStep[] = []
  const onStep = vi.fn((step: AmountStep) => steps.push(step))
  render(
    <SpinButton
      label="Menge ändern"
      value={value}
      minimum={1}
      maximum={99}
      valueText="3"
      onStep={onStep}
    >
      ▲▼
    </SpinButton>,
  )
  return { steps, onStep, field: screen.getByRole('spinbutton') }
}

function keyDownOn(field: HTMLElement, key: string) {
  return !fireEvent.keyDown(field, { key })
}

describe('SpinButton', () => {
  it('is named by its label and reports its value and bounds', () => {
    renderSpinButton()

    const field = screen.getByRole('spinbutton', { name: 'Menge ändern' })
    expect(field).toHaveAttribute('aria-valuenow', '3')
    expect(field).toHaveAttribute('aria-valuemin', '1')
    expect(field).toHaveAttribute('aria-valuemax', '99')
    expect(field).toHaveAttribute('aria-valuetext', '3')
  })

  it('reports no current value when there is none', () => {
    renderSpinButton(null)

    expect(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-valuenow')
  })

  it('steps up on arrow up without scrolling the page', () => {
    const { field, steps } = renderSpinButton()

    expect(keyDownOn(field, 'ArrowUp')).toBe(true)
    expect(steps).toEqual([1])
  })

  it('steps down on arrow down without scrolling the page', () => {
    const { field, steps } = renderSpinButton()

    expect(keyDownOn(field, 'ArrowDown')).toBe(true)
    expect(steps).toEqual([-1])
  })

  it.each(['Enter', 'ArrowLeft', 'a'])('leaves the key %s alone', (key) => {
    const { field, onStep } = renderSpinButton()

    expect(keyDownOn(field, key)).toBe(false)
    expect(onStep).not.toHaveBeenCalled()
  })

  it('can be reached with the tab key', async () => {
    const { field } = renderSpinButton()

    await userEvent.tab()

    expect(field).toHaveFocus()
  })
})
