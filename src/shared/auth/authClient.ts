import type { Credentials } from './credentials'

export type Session =
  | { status: 'loading' }
  | { status: 'signedIn'; userId: string }
  | { status: 'signedOut' }

export type SignInResult =
  { succeeded: true } | { succeeded: false; failureCode: string }

export interface AuthClient {
  observeSession(onSession: (session: Session) => void): () => void
  signIn(credentials: Credentials): Promise<SignInResult>
}
