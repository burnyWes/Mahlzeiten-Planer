import type { InstallUpdate } from './appUpdateClient'

export function AppUpdateOffer({
  installUpdate,
}: {
  installUpdate: InstallUpdate
}) {
  return (
    <div className="appUpdate">
      <button type="button" onClick={installUpdate}>
        Neue Version laden
      </button>
    </div>
  )
}
