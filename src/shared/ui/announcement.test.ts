import { describe, expect, it } from 'vitest'
import { announcementText } from './announcement'

describe('announcement', () => {
  it('carries the spoken text', () => {
    expect(announcementText('Milch hinzugefügt.', 1)).toContain(
      'Milch hinzugefügt.',
    )
  })

  it('differs between two announcements of the same text so it is read again', () => {
    expect(announcementText('Milch hinzugefügt.', 1)).not.toBe(
      announcementText('Milch hinzugefügt.', 2),
    )
  })

  it('stays empty while nothing has been announced', () => {
    expect(announcementText('', 0)).toBe('')
  })
})
