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
    '\\b(?:white|black|red|green|blue|gray|grey)\\b(?!-)',
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

const TEXT_ON_ITS_BACKGROUND = [
  ['--ink', '--accent'],
  ['--surface', '--disabled'],
  ['--ink', '--surface'],
  ['--failure', '--surface'],
]

const LINES_AGAINST_THEIR_GROUND = [
  ['--ink', '--accent'],
  ['--ink', '--surface'],
  ['--accentLine', '--surface'],
  ['--fieldBorder', '--surface'],
  ['--disabled', '--surface'],
  ['--checkMark', '--surface'],
]

const READABLE_TEXT = 4.5
const VISIBLE_LINE = 3

function luminanceOfChannel(channel: number) {
  const portion = channel / 255
  return portion <= 0.03928
    ? portion / 12.92
    : ((portion + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(colour: string) {
  const [red, green, blue] = [1, 3, 5].map((start) =>
    luminanceOfChannel(parseInt(colour.slice(start, start + 2), 16)),
  )
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastOf(colour: string, ground: string) {
  const [brighter, darker] = [
    relativeLuminance(colour),
    relativeLuminance(ground),
  ].sort((one, other) => other - one)
  return (brighter + 0.05) / (darker + 0.05)
}

function tooWeak(
  palette: Map<string, string>,
  combinations: string[][],
  least: number,
) {
  return combinations
    .filter(([colour, ground]) => {
      const front = palette.get(colour)
      const back = palette.get(ground)
      return !front || !back || contrastOf(front, back) < least
    })
    .map(([colour, ground]) => `${colour} on ${ground}`)
}

function weakCombinations(palette: Map<string, string>) {
  return [
    ...tooWeak(palette, TEXT_ON_ITS_BACKGROUND, READABLE_TEXT),
    ...tooWeak(palette, LINES_AGAINST_THEIR_GROUND, VISIBLE_LINE),
  ]
}

describe('palette', () => {
  it('defines every colour in the palette', () => {
    expect(rulesOutsideThePalette(stylesheet)).not.toMatch(COLOUR)
  })

  it('tells a colour name from a property that starts with it', () => {
    expect('white-space: nowrap;').not.toMatch(COLOUR)
    expect('color: white;').toMatch(COLOUR)
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

  it('keeps every combination the app draws readable', () => {
    const [light, inverted] = paletteBlocks(stylesheet).map(([, , block]) =>
      colourTokens(block),
    )

    expect(weakCombinations(light)).toEqual([])
    expect(weakCombinations(inverted)).toEqual([])
  })

  it('applies the stored preference before the first paint', () => {
    expect(markup).toContain(
      `localStorage.getItem('${invertedColorsKeyOfTheAdapter()}')`,
    )
    expect(markup).toContain('dataset.invertedColors')
    expect(stylesheet).toContain("[data-inverted-colors='true']")
  })
})
