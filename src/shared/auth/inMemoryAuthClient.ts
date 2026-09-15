import type { AuthClient, Session, SignInResult } from './authClient'
import type { Credentials } from './credentials'

type KnownAccount = Credentials & { userId: string }

export function createInMemoryAuthClient(
  knownAccount: KnownAccount,
  initialSession: Session = { status: 'signedOut' },
): AuthClient {
  let session = initialSession
  const listeners = new Set<(session: Session) => void>()

  function publish(next: Session) {
    session = next
    listeners.forEach((listener) => listener(session))
  }

  return {
    observeSession(onSession) {
      listeners.add(onSession)
      onSession(session)
      return () => listeners.delete(onSession)
    },
    async signIn(credentials): Promise<SignInResult> {
      if (
        credentials.email !== knownAccount.email ||
        credentials.password !== knownAccount.password
      ) {
        return { succeeded: false, failureCode: 'auth/invalid-credential' }
      }
      publish({ status: 'signedIn', userId: knownAccount.userId })
      return { succeeded: true }
    },
  }
}
