import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BottomBar } from './BottomBar'

type FakeVisualViewport = EventTarget & { height: number; scale: number }

const originalVisualViewport = Object.getOwnPropertyDescriptor(
  window,
  'visualViewport',
)
const originalInnerHeight = Object.getOwnPropertyDescriptor(
  window,
  'innerHeight',
)

function restoreWindowProperty(
  name: string,
  original: PropertyDescriptor | undefined,
) {
  if (original === undefined) {
    Reflect.deleteProperty(window, name)
  } else {
    Object.defineProperty(window, name, original)
  }
}

function useVisualViewport(
  visualViewport: FakeVisualViewport | undefined,
  innerHeight = 800,
) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: innerHeight,
  })
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: visualViewport,
  })
}

function fakeVisualViewport(height: number, scale = 1): FakeVisualViewport {
  return Object.assign(new EventTarget(), { height, scale })
}

function renderBottomBar() {
  render(
    <BottomBar>
      <button type="button">Speichern</button>
    </BottomBar>,
  )
  return screen.getByRole('button').closest('.bottomBar')
}

function resizeTo(visualViewport: FakeVisualViewport, height: number) {
  act(() => {
    visualViewport.height = height
    visualViewport.dispatchEvent(new Event('resize'))
  })
}

describe('BottomBar', () => {
  afterEach(() => {
    restoreWindowProperty('visualViewport', originalVisualViewport)
    restoreWindowProperty('innerHeight', originalInnerHeight)
  })

  it('stays fixed while no on-screen keyboard is open', () => {
    useVisualViewport(fakeVisualViewport(800))

    expect(renderBottomBar()).not.toHaveClass('bottomBarInFlow')
  })

  it('moves into the page flow while the on-screen keyboard is open', () => {
    const visualViewport = fakeVisualViewport(800)
    useVisualViewport(visualViewport)
    const bottomBar = renderBottomBar()

    resizeTo(visualViewport, 450)

    expect(bottomBar).toHaveClass('bottomBarInFlow')

    resizeTo(visualViewport, 800)

    expect(bottomBar).not.toHaveClass('bottomBarInFlow')
  })

  it('stays fixed while zoomed in', () => {
    useVisualViewport(fakeVisualViewport(400, 2))

    expect(renderBottomBar()).not.toHaveClass('bottomBarInFlow')
  })

  it('stays fixed without a visual viewport', () => {
    useVisualViewport(undefined)

    expect(renderBottomBar()).not.toHaveClass('bottomBarInFlow')
  })
})
