import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import type { AuthClient, SignInResult } from './authClient'
import type { Credentials } from './credentials'
import { SignInPage } from './SignInPage'

function createRecordingAuthClient(result: SignInResult) {
  const attempts: Credentials[] = []
  const client: AuthClient = {
    observeSession(onSession) {
      onSession({ status: 'signedOut' })
      return () => {}
    },
    signIn(credentials) {
      attempts.push(credentials)
      return Promise.resolve(result)
    },
  }
  return { attempts, client }
}

function renderSignInPage(result: SignInResult) {
  const announcements: string[] = []
  const { attempts, client } = createRecordingAuthClient(result)
  const rendered = render(
    <SignInPage
      authClient={client}
      announce={(text) => {
        announcements.push(text)
      }}
    />,
  )
  return { announcements, attempts, rendered }
}

describe('SignInPage', () => {
  it('does not sign in while the password is empty', async () => {
    const { attempts, announcements } = renderSignInPage({ succeeded: true })

    await userEvent.type(
      screen.getByLabelText('E-Mail'),
      'haushalt@example.com',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(attempts).toHaveLength(0)
    expect(announcements).toContain('Bitte E-Mail und Passwort eingeben.')
    expect(
      screen.getByText('Bitte E-Mail und Passwort eingeben.'),
    ).toBeInTheDocument()
  })

  it('announces wrong credentials without saying which part was wrong', async () => {
    const { announcements } = renderSignInPage({
      succeeded: false,
      failureCode: 'auth/invalid-credential',
    })

    await userEvent.type(
      screen.getByLabelText('E-Mail'),
      'haushalt@example.com',
    )
    await userEvent.type(screen.getByLabelText('Passwort'), 'falsch')
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(announcements).toContain('E-Mail oder Passwort stimmt nicht.')
  })

  it('passes the entered credentials on to the auth client', async () => {
    const { attempts } = renderSignInPage({ succeeded: true })

    await userEvent.type(
      screen.getByLabelText('E-Mail'),
      'haushalt@example.com',
    )
    await userEvent.type(screen.getByLabelText('Passwort'), 'geheim')
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(attempts).toEqual([
      { email: 'haushalt@example.com', password: 'geheim' },
    ])
  })

  it('describes the form by its failure message', () => {
    renderSignInPage({ succeeded: true })

    expect(
      screen
        .getByRole('form', { name: 'Anmeldung' })
        .getAttribute('aria-describedby'),
    ).toBe('signInFailure')
  })

  it('has no accessibility violations', async () => {
    const { rendered } = renderSignInPage({ succeeded: true })

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
