import { assignedKnownItemsHeading } from '../domain/announcements'
import type { KnownItem } from '../domain/knownItem'

type AssignedKnownItemsProps = {
  knownItems: readonly KnownItem[]
  emptyText: string
}

export function AssignedKnownItems({
  knownItems,
  emptyText,
}: AssignedKnownItemsProps) {
  return (
    <>
      <h2>{assignedKnownItemsHeading(knownItems.length)}</h2>
      {knownItems.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul className="itemList">
          {knownItems.map((knownItem) => (
            <li key={knownItem.name}>{knownItem.name}</li>
          ))}
        </ul>
      )}
    </>
  )
}
