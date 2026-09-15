import { useEffect } from 'react'
import type { AuthClient } from './shared/auth/authClient'
import { SignInPage } from './shared/auth/SignInPage'
import { useSession } from './shared/auth/useSession'
import { Announcer } from './shared/ui/Announcer'
import { useAnnouncer } from './shared/ui/useAnnouncer'

type AppProps = {
  authClient: AuthClient
  storageWarning?: string
}

export function App({ authClient, storageWarning = '' }: AppProps) {
  const { spokenText, announce } = useAnnouncer()
  const session = useSession(authClient)

  useEffect(() => {
    if (storageWarning !== '') announce(storageWarning)
  }, [storageWarning, announce])

  return (
    <>
      {session.status === 'loading' && <p className="page">Wird geladen.</p>}
      {session.status === 'signedOut' && (
        <SignInPage authClient={authClient} announce={announce} />
      )}
      {session.status === 'signedIn' && (
        <main className="page">
          <h1>Einkaufsliste</h1>
        </main>
      )}
      <Announcer text={spokenText} />
    </>
  )
}
