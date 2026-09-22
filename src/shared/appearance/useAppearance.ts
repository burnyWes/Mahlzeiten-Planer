import { useEffect, useState } from 'react'
import type { AppearanceClient } from './appearanceClient'

export type Appearance = {
  invertedColors: boolean
  toggleInvertedColors: () => void
}

function applyAccentToTheSystemBar() {
  const systemBar = document.querySelector('meta[name="theme-color"]')
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent')
    .trim()
  if (systemBar && accent) systemBar.setAttribute('content', accent)
}

export function useAppearance(appearanceClient: AppearanceClient): Appearance {
  const [invertedColors, setInvertedColors] = useState(() =>
    appearanceClient.readInvertedColors(),
  )

  useEffect(() => {
    document.documentElement.dataset.invertedColors = String(invertedColors)
    applyAccentToTheSystemBar()
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
