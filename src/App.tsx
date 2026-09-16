import { useEffect } from 'react'
import { SignedInApp } from './SignedInApp'
import { AppUpdateOffer } from './shared/appUpdate/AppUpdateOffer'
import type { AppUpdateClient } from './shared/appUpdate/appUpdateClient'
import { useAppUpdate } from './shared/appUpdate/useAppUpdate'
import type { AuthClient } from './shared/auth/authClient'
import { SignInPage } from './shared/auth/SignInPage'
import { useSession } from './shared/auth/useSession'
import { Announcer } from './shared/ui/Announcer'
import { useAnnouncer } from './shared/ui/useAnnouncer'
import { useConnectionAnnouncements } from './shared/ui/useConnectionAnnouncements'
import type { ShoppingListClient } from './shopping/api/shoppingListClient'

type AppProps = {
  authClient: AuthClient
  createShoppingListClient: (
    onWriteFailure: (message: string) => void,
  ) => ShoppingListClient
  appUpdateClient: AppUpdateClient
  storageWarning?: string
}

export function App({
  authClient,
  createShoppingListClient,
  appUpdateClient,
  storageWarning = '',
}: AppProps) {
  const { spokenText, announce } = useAnnouncer()
  const session = useSession(authClient)
  const installUpdate = useAppUpdate(appUpdateClient, announce)

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
        <SignedInApp
          createShoppingListClient={createShoppingListClient}
          announce={announce}
        />
      )}
      {installUpdate !== null && (
        <AppUpdateOffer installUpdate={installUpdate} />
      )}
      <Announcer text={spokenText} />
    </>
  )
}
