import type { ReactNode } from 'react'
import { useHeadingFocus } from './useHeadingFocus'

export type SettingsEntry = {
  id: string
  label: string
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
              <button
                type="button"
                className="mealNameButton"
                onClick={() => onOpenEntry(entry.id)}
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
