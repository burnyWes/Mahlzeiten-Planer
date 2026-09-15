import { useEffect } from 'react'

const LOST = 'Offline. Änderungen werden gespeichert.'
const BACK = 'Wieder online.'

export function useConnectionAnnouncements(
  announce: (text: string) => void,
): void {
  useEffect(() => {
    const announceLoss = () => announce(LOST)
    const announceReturn = () => announce(BACK)

    window.addEventListener('offline', announceLoss)
    window.addEventListener('online', announceReturn)
    if (!navigator.onLine) announceLoss()

    return () => {
      window.removeEventListener('offline', announceLoss)
      window.removeEventListener('online', announceReturn)
    }
  }, [announce])
}
