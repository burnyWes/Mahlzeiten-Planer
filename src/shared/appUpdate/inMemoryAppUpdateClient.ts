import type { AppUpdateClient, InstallUpdate } from './appUpdateClient'

export type ReleasableAppUpdateClient = AppUpdateClient & {
  releaseUpdate(installUpdate: InstallUpdate): void
}

export function createInMemoryAppUpdateClient(): ReleasableAppUpdateClient {
  const listeners = new Set<(installUpdate: InstallUpdate) => void>()

  return {
    observeUpdate(onUpdateReady) {
      listeners.add(onUpdateReady)
      return () => listeners.delete(onUpdateReady)
    },
    releaseUpdate(installUpdate) {
      listeners.forEach((listener) => listener(installUpdate))
    },
  }
}
