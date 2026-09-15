import { useEffect } from 'react'
import type { AuthClient } from './shared/auth/authClient'
import { SignInPage } from './shared/auth/SignInPage'
import { useSession } from './shared/auth/useSession'
import { Announcer } from './shared/ui/Announcer'
import { useAnnouncer } from './shared/ui/useAnnouncer'
import { useConnectionAnnouncements } from './shared/ui/useConnectionAnnouncements'
import type { ShoppingListClient } from './shopping/api/shoppingListClient'
import { ShoppingApp } from './shopping/ui/ShoppingApp'

type AppProps = {
  authClient: AuthClient
  createShoppingListClient: (
    onWriteFailure: (message: string) => void,
  ) => ShoppingListClient
  storageWarning?: string
}

export function App({
  authClient,
  createShoppingListClient,
  storageWarning = '',
}: AppProps) {
  const { spokenText, announce } = useAnnouncer()
  const session = useSession(authClient)

  useConnectionAnnouncements(announce)

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
        <ShoppingApp
          createShoppingListClient={createShoppingListClient}
          announce={announce}
        />
      )}
      <Announcer text={spokenText} />
    </>
  )
}
