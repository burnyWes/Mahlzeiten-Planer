import { describe, expect, it } from 'vitest'
import { paragraphsOf } from './text'

describe('paragraphsOf', () => {
  it('reads a single line as one paragraph', () => {
    expect(paragraphsOf('Hackfleisch anbraten.')).toEqual([
      'Hackfleisch anbraten.',
    ])
  })

  it('reads every line as its own paragraph', () => {
    expect(paragraphsOf('Anbraten.\nTomaten dazu.')).toEqual([
      'Anbraten.',
      'Tomaten dazu.',
    ])
  })

  it('drops blank lines between the paragraphs', () => {
    expect(paragraphsOf('Anbraten.\n\n\nTomaten dazu.')).toEqual([
      'Anbraten.',
      'Tomaten dazu.',
    ])
  })

  it('drops surrounding whitespace of every paragraph', () => {
    expect(paragraphsOf('  Anbraten.  \n\t Tomaten dazu. ')).toEqual([
      'Anbraten.',
      'Tomaten dazu.',
    ])
  })

  it('reads a text of blank lines as no paragraph at all', () => {
    expect(paragraphsOf('   \n \n')).toEqual([])
  })

  it('reads an empty text as no paragraph at all', () => {
    expect(paragraphsOf('')).toEqual([])
  })

  it('keeps line breaks written as carriage returns apart', () => {
    expect(paragraphsOf('Anbraten.\r\nTomaten dazu.')).toEqual([
      'Anbraten.',
      'Tomaten dazu.',
    ])
  })
})
