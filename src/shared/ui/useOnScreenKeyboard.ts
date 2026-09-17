import { useEffect, useState } from 'react'

const KEYBOARD_MIN_HEIGHT = 150

function isKeyboardOpen() {
  const viewport = window.visualViewport
  if (!viewport) return false
  const hiddenHeight = window.innerHeight - viewport.height * viewport.scale
  return hiddenHeight > KEYBOARD_MIN_HEIGHT
}

export function useOnScreenKeyboard() {
  const [keyboardOpen, setKeyboardOpen] = useState(isKeyboardOpen)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setKeyboardOpen(isKeyboardOpen())
    viewport.addEventListener('resize', update)
    return () => viewport.removeEventListener('resize', update)
  }, [])

  return keyboardOpen
}
