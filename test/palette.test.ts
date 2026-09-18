import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(
  new URL('../src/index.css', import.meta.url),
  'utf8',
)

const markup = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

const adapter = readFileSync(
  new URL(
    '../src/shared/appearance/localStorageAppearanceClient.ts',
    import.meta.url,
  ),
  'utf8',
)

function invertedColorsKeyOfTheAdapter() {
  const declaration = adapter.match(/INVERTED_COLORS_KEY = '([^']+)'/)
  if (!declaration)
    throw new Error('the appearance adapter names no storage key')
  return declaration[1]
}

const COLOUR = new RegExp(
  [
    '#[0-9a-f]{3,8}\\b',
    '\\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\\(',
    '\\b(?:white|black|red|green|blue|gray|grey)\\b',
  ].join('|'),
  'i',
)

function rulesOutsideThePalette(stylesheet: string) {
  return stylesheet.replace(/:root[^{]*\{[^}]*\}/g, '')
}

function paletteBlocks(stylesheet: string) {
  return [...stylesheet.matchAll(/:root([^{]*)\{([^}]*)\}/g)]
}

function colourTokens(block: string) {
  return new Map(
    [...block.matchAll(/(--[a-zA-Z]+):\s*(#[0-9a-f]{6})\b/g)].map(
      ([, token, colour]) => [token, colour],
    ),
  )
}

function complementOf(colour: string) {
  const channels = [1, 3, 5].map(
    (start) => 255 - parseInt(colour.slice(start, start + 2), 16),
  )
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

describe('palette', () => {
  it('defines every colour in the palette', () => {
    expect(rulesOutsideThePalette(stylesheet)).not.toMatch(COLOUR)
  })

  it('inverts every colour of the palette exactly', () => {
    const [light, inverted] = paletteBlocks(stylesheet).map(([, , block]) =>
      colourTokens(block),
    )

    expect(inverted.size).toBe(light.size)
    expect(light.size).toBeGreaterThan(0)
    inverted.forEach((colour, token) => {
      expect([token, colour]).toEqual([token, complementOf(light.get(token)!)])
    })
  })

  it('applies the stored preference before the first paint', () => {
    expect(markup).toContain(
      `localStorage.getItem('${invertedColorsKeyOfTheAdapter()}')`,
    )
    expect(markup).toContain('dataset.invertedColors')
    expect(stylesheet).toContain("[data-inverted-colors='true']")
  })
})
