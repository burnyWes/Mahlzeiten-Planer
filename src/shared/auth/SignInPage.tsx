import { useState, type FormEvent } from 'react'
import type { AuthClient } from './authClient'
import { areCredentialsComplete } from './credentials'
import { signInFailureMessage } from './signInFailure'

type SignInPageProps = {
  authClient: AuthClient
  announce: (text: string) => void
}

const INCOMPLETE_CREDENTIALS_MESSAGE = 'Bitte E-Mail und Passwort eingeben.'

export function SignInPage({ authClient, announce }: SignInPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failureMessage, setFailureMessage] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  function reportFailure(message: string) {
    setFailureMessage(message)
    announce(message)
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const credentials = { email, password }

    if (!areCredentialsComplete(credentials)) {
      reportFailure(INCOMPLETE_CREDENTIALS_MESSAGE)
      return
    }

    setFailureMessage('')
    setSigningIn(true)
    const result = await authClient.signIn(credentials)
    setSigningIn(false)

    if (!result.succeeded) {
      reportFailure(signInFailureMessage(result.failureCode))
    }
  }

  return (
    <main className="page">
      <h1>Mahlzeiten-Planer</h1>
      <form
        onSubmit={submitCredentials}
        aria-label="Anmeldung"
        aria-describedby="signInFailure"
      >
        <p className="field">
          <label htmlFor="email">E-Mail</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </p>
        <p className="field">
          <label htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </p>
        <p id="signInFailure" className="failure">
          {failureMessage}
        </p>
        <button type="submit" disabled={signingIn}>
          Anmelden
        </button>
      </form>
    </main>
  )
}
