import type { ReactNode } from 'react'

export type Area<Id extends string> = {
  id: Id
  label: string
  icon: ReactNode
}

type NavigationBarProps<Id extends string> = {
  areas: readonly Area<Id>[]
  activeArea: Id
  onSelectArea: (area: Id) => void
}

export function NavigationBar<Id extends string>({
  areas,
  activeArea,
  onSelectArea,
}: NavigationBarProps<Id>) {
  return (
    <nav aria-label="Bereiche" className="navigationBar">
      <ul>
        {areas.map((area) => (
          <li key={area.id}>
            <button
              type="button"
              aria-current={area.id === activeArea ? 'page' : undefined}
              aria-label={area.label}
              onClick={() => onSelectArea(area.id)}
            >
              {area.icon}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
