import { describe, expect, it } from 'vitest'
import { signInFailureMessage } from './signInFailure'

describe('sign in failure', () => {
  it('reports wrong credentials without naming which part was wrong', () => {
    expect(signInFailureMessage('auth/invalid-credential')).toBe(
      'E-Mail oder Passwort stimmt nicht.',
    )
  })

  it('reports a malformed email address', () => {
    expect(signInFailureMessage('auth/invalid-email')).toBe(
      'Die E-Mail-Adresse ist nicht gültig.',
    )
  })

  it('reports a missing connection', () => {
    expect(signInFailureMessage('auth/network-request-failed')).toBe(
      'Keine Verbindung. Die Anmeldung braucht Netz.',
    )
  })

  it('reports too many attempts', () => {
    expect(signInFailureMessage('auth/too-many-requests')).toBe(
      'Zu viele Versuche. Bitte später erneut versuchen.',
    )
  })

  it('falls back to a general message for an unknown code', () => {
    expect(signInFailureMessage('auth/internal-error')).toBe(
      'Anmeldung fehlgeschlagen.',
    )
  })
})
