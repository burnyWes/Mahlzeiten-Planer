import { useEffect, useRef, type RefObject } from 'react'

type PendingFocus = number | 'fallback' | null

export function useFocusAfterRemoval<Key>(
  keys: readonly Key[],
  fallback: RefObject<HTMLElement | null>,
) {
  const rows = useRef(new Map<Key, HTMLElement>())
  const pendingFocus = useRef<PendingFocus>(null)

  function followingRow(position: number): HTMLElement | null {
    const following = keys[Math.min(position, keys.length - 1)]
    return following === undefined
      ? null
      : (rows.current.get(following) ?? null)
  }

  useEffect(() => {
    const pending = pendingFocus.current
    if (pending === null) return
    pendingFocus.current = null
    const row = pending === 'fallback' ? null : followingRow(pending)
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
    pendingFocus.current = position
  }

  function fallbackAfterRemoval() {
    pendingFocus.current = 'fallback'
  }

  return { keepRow, rowRemovedAt, fallbackAfterRemoval }
}
