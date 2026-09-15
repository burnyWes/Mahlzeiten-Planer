const REPETITION_MARKER = '​'

export function announcementText(text: string, repetition: number): string {
  if (text === '') return ''
  return repetition % 2 === 0 ? text : `${text}${REPETITION_MARKER}`
}
