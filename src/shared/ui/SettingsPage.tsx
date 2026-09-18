import type { ReactNode } from 'react'
import { useHeadingFocus } from './useHeadingFocus'

export type SettingsEntry =
  | { kind: 'page'; id: string; label: string }
  | {
      kind: 'toggle'
      id: string
      label: string
      enabled: boolean
      onToggle: () => void
    }

type SettingsPageProps = {
  navigation: ReactNode
  entries: readonly SettingsEntry[]
  onOpenEntry: (id: string) => void
}

export function SettingsPage({
  navigation,
  entries,
  onOpenEntry,
}: SettingsPageProps) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Einstellungen
          </h1>
        </div>
        <ul className="itemList">
          {entries.map((entry) => (
            <li key={entry.id} className="mealRow">
              {entry.kind === 'toggle' ? (
                <label className="settingsToggle">
                  <span>{entry.label}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={entry.enabled}
                    onChange={entry.onToggle}
                  />
                </label>
              ) : (
                <button
                  type="button"
                  className="mealNameButton"
                  onClick={() => onOpenEntry(entry.id)}
                >
                  {entry.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
