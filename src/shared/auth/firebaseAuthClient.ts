import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  type Auth,
} from 'firebase/auth'
import type { AuthClient, SignInResult } from './authClient'

function failureCodeOf(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : 'auth/unknown'
}

export function createFirebaseAuthClient(auth: Auth): AuthClient {
  return {
    observeSession(onSession) {
      return onAuthStateChanged(auth, (user) => {
        onSession(
          user
            ? { status: 'signedIn', userId: user.uid }
            : { status: 'signedOut' },
        )
      })
    },
    async signIn({ email, password }): Promise<SignInResult> {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password)
        return { succeeded: true }
      } catch (error) {
        return { succeeded: false, failureCode: failureCodeOf(error) }
      }
    },
  }
}
