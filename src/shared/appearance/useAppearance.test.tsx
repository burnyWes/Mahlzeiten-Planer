import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInMemoryAppearanceClient } from './inMemoryAppearanceClient'
import { useAppearance } from './useAppearance'

const LIGHT_ACCENT = '#ebacd2'
const INVERTED_ACCENT = '#14532d'

function systemBar() {
  return document.querySelector('meta[name="theme-color"]')
}

function givenASystemBar(content = 'untouched') {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', content)
  document.head.append(meta)
}

function givenThePalette() {
  const palette = document.createElement('style')
  palette.textContent = `
    :root { --accent: ${LIGHT_ACCENT}; }
    :root[data-inverted-colors='true'] { --accent: ${INVERTED_ACCENT}; }
  `
  document.head.append(palette)
}

function renderAppearance(invertedColors = false) {
  const { result } = renderHook(() =>
    useAppearance(createInMemoryAppearanceClient(invertedColors)),
  )
  return result
}

describe('useAppearance', () => {
  beforeEach(() => {
    document.head.replaceChildren()
    delete document.documentElement.dataset.invertedColors
  })

  it('paints the system bar in the accent of the palette', () => {
    givenASystemBar()
    givenThePalette()

    renderAppearance()

    expect(systemBar()?.getAttribute('content')).toBe(LIGHT_ACCENT)
  })

  it('turns the system bar over with the colours', () => {
    givenASystemBar()
    givenThePalette()
    const appearance = renderAppearance()

    act(() => appearance.current.toggleInvertedColors())

    expect(document.documentElement.dataset.invertedColors).toBe('true')
    expect(systemBar()?.getAttribute('content')).toBe(INVERTED_ACCENT)
  })

  it('leaves the system bar alone when the palette says nothing', () => {
    givenASystemBar()

    renderAppearance()

    expect(systemBar()?.getAttribute('content')).toBe('untouched')
  })
})
