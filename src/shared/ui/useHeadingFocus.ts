import { useEffect, useRef } from 'react'

export function useHeadingFocus() {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return heading
}
