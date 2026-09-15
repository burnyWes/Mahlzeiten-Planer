import { describe, expect, it } from 'vitest'
import { areCredentialsComplete } from './credentials'

describe('credentials', () => {
  it('accepts an email address together with a password', () => {
    expect(
      areCredentialsComplete({
        email: 'haushalt@example.com',
        password: 'geheim',
      }),
    ).toBe(true)
  })

  it('rejects a missing password', () => {
    expect(
      areCredentialsComplete({ email: 'haushalt@example.com', password: '' }),
    ).toBe(false)
  })

  it('rejects a password made of spaces', () => {
    expect(
      areCredentialsComplete({
        email: 'haushalt@example.com',
        password: '   ',
      }),
    ).toBe(false)
  })

  it('rejects a missing email address', () => {
    expect(areCredentialsComplete({ email: '   ', password: 'geheim' })).toBe(
      false,
    )
  })

  it('keeps a password with leading and trailing spaces', () => {
    expect(
      areCredentialsComplete({
        email: 'haushalt@example.com',
        password: ' a ',
      }),
    ).toBe(true)
  })
})
