import { useEffect, useState } from 'react'
import type { AuthClient, Session } from './authClient'

export function useSession(authClient: AuthClient): Session {
  const [session, setSession] = useState<Session>({ status: 'loading' })

  useEffect(() => authClient.observeSession(setSession), [authClient])

  return session
}
