import { useHeadingFocus } from './useHeadingFocus'

type ManagementHeaderProps = {
  heading: string
  headingLabel?: string
  addLabel: string
  onAdd: () => void
}

export function ManagementHeader({
  heading,
  headingLabel,
  addLabel,
  onAdd,
}: ManagementHeaderProps) {
  const headingElement = useHeadingFocus()

  return (
    <div className="pageHeader">
      <h1 ref={headingElement} tabIndex={-1} aria-label={headingLabel}>
        {heading}
      </h1>
      <button
        type="button"
        className="addItemButton"
        onClick={onAdd}
        aria-label={addLabel}
      >
        +
      </button>
    </div>
  )
}
