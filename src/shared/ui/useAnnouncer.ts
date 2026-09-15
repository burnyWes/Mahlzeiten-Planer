import { useCallback, useState } from 'react'
import { announcementText } from './announcement'

export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState({ text: '', repetition: 0 })

  const announce = useCallback((text: string) => {
    setAnnouncement((previous) => ({
      text,
      repetition: previous.repetition + 1,
    }))
  }, [])

  return {
    spokenText: announcementText(announcement.text, announcement.repetition),
    announce,
  }
}
