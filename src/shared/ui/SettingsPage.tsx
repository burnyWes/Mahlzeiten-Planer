import type { ReactNode } from 'react'
import { useHeadingFocus } from './useHeadingFocus'

export type SettingsChoiceOption = { value: string; label: string }

export type SettingsEntry =
  | { kind: 'page'; id: string; label: string }
  | {
      kind: 'toggle'
      id: string
      label: string
      enabled: boolean
      onToggle: () => void
    }
  | {
      kind: 'choice'
      id: string
      label: string
      options: readonly SettingsChoiceOption[]
      chosen: string
      onChoose: (value: string) => void
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

  function entryControl(entry: SettingsEntry) {
    switch (entry.kind) {
      case 'toggle':
        return (
          <label className="settingsToggle">
            <span>{entry.label}</span>
            <input
              type="checkbox"
              role="switch"
              checked={entry.enabled}
              onChange={entry.onToggle}
            />
          </label>
        )
      case 'choice':
        return (
          <div className="settingsChoice">
            <label htmlFor={entry.id}>{entry.label}</label>
            <select
              id={entry.id}
              value={entry.chosen}
              onChange={(event) => entry.onChoose(event.target.value)}
            >
              {entry.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )
      case 'page':
        return (
          <button
            type="button"
            className="mealNameButton"
            onClick={() => onOpenEntry(entry.id)}
          >
            {entry.label}
          </button>
        )
    }
  }

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
              {entryControl(entry)}
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
