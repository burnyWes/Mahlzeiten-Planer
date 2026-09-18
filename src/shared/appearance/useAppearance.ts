import { useEffect, useState } from 'react'
import type { AppearanceClient } from './appearanceClient'

export type Appearance = {
  invertedColors: boolean
  toggleInvertedColors: () => void
}

export function useAppearance(appearanceClient: AppearanceClient): Appearance {
  const [invertedColors, setInvertedColors] = useState(() =>
    appearanceClient.readInvertedColors(),
  )

  useEffect(() => {
    document.documentElement.dataset.invertedColors = String(invertedColors)
  }, [invertedColors])

  return {
    invertedColors,
    toggleInvertedColors() {
      const wanted = !invertedColors
      appearanceClient.writeInvertedColors(wanted)
      setInvertedColors(wanted)
    },
  }
}
