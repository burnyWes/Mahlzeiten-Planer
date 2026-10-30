import { useHeadingFocus } from './useHeadingFocus'

type ManagementHeaderProps = {
  heading: string
  addLabel: string
  onAdd: () => void
}

export function ManagementHeader({
  heading,
  addLabel,
  onAdd,
}: ManagementHeaderProps) {
  const headingElement = useHeadingFocus()

  return (
    <div className="pageHeader">
      <h1 ref={headingElement} tabIndex={-1}>
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
