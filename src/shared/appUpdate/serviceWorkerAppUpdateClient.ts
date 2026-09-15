import { registerSW } from 'virtual:pwa-register'
import type { AppUpdateClient, InstallUpdate } from './appUpdateClient'

export function createServiceWorkerAppUpdateClient(): AppUpdateClient {
  const listeners = new Set<(installUpdate: InstallUpdate) => void>()
  let waitingUpdate: InstallUpdate | null = null

  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      const installUpdate = () => {
        void updateServiceWorker(true)
      }
      waitingUpdate = installUpdate
      listeners.forEach((listener) => listener(installUpdate))
    },
  })

  return {
    observeUpdate(onUpdateReady) {
      listeners.add(onUpdateReady)
      if (waitingUpdate !== null) onUpdateReady(waitingUpdate)
      return () => listeners.delete(onUpdateReady)
    },
  }
}
