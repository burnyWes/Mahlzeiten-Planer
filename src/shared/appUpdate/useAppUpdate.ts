import { useEffect, useState } from 'react'
import type { AppUpdateClient, InstallUpdate } from './appUpdateClient'

const UPDATE_READY = 'Neue Version verfügbar. Der Knopf dafür steht ganz unten.'

export function useAppUpdate(
  appUpdateClient: AppUpdateClient,
  announce: (text: string) => void,
): InstallUpdate | null {
  const [installUpdate, setInstallUpdate] = useState<InstallUpdate | null>(null)

  useEffect(
    () =>
      appUpdateClient.observeUpdate((readyUpdate) => {
        setInstallUpdate(() => readyUpdate)
        announce(UPDATE_READY)
      }),
    [appUpdateClient, announce],
  )

  return installUpdate
}
