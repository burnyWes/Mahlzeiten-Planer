import type { AppearanceClient } from './appearanceClient'

export type StoringAppearanceClient = AppearanceClient & {
  storedInvertedColors(): boolean
}

export function createInMemoryAppearanceClient(
  invertedColors = false,
): StoringAppearanceClient {
  let storedInvertedColors = invertedColors

  return {
    readInvertedColors: () => storedInvertedColors,
    writeInvertedColors: (wanted) => {
      storedInvertedColors = wanted
    },
    storedInvertedColors: () => storedInvertedColors,
  }
}
