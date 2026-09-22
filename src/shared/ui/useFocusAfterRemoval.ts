import { useEffect, useRef, type RefObject } from 'react'

export function useFocusAfterRemoval<Key>(
  keys: readonly Key[],
  fallback: RefObject<HTMLElement | null>,
) {
  const rows = useRef(new Map<Key, HTMLElement>())
  const removedPosition = useRef<number | null>(null)

  useEffect(() => {
    const position = removedPosition.current
    if (position === null) return
    removedPosition.current = null
    const following = keys[Math.min(position, keys.length - 1)]
    const row = following === undefined ? null : rows.current.get(following)
    ;(row ?? fallback.current)?.focus()
  })

  function keepRow(key: Key) {
    return (row: HTMLElement | null) => {
      if (row === null) {
        rows.current.delete(key)
      } else {
        rows.current.set(key, row)
      }
    }
  }

  function rowRemovedAt(position: number) {
    removedPosition.current = position
  }

  return { keepRow, rowRemovedAt }
}
