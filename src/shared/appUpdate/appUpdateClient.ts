export type InstallUpdate = () => void

export interface AppUpdateClient {
  observeUpdate(
    onUpdateReady: (installUpdate: InstallUpdate) => void,
  ): () => void
}
