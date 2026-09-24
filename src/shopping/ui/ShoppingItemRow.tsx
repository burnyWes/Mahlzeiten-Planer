import type { Ref } from 'react'
import { formatQuantity } from '../../shared/domain/quantity'
import { Stepper } from '../../shared/ui/Stepper'
import { lessItemLabel, moreItemLabel } from '../domain/announcements'
import {
  canTakeOneMore,
  formatItemForAnnouncement,
  isCheckedOff,
  steppedQuantity,
  type ShoppingItem,
} from '../domain/shoppingItem'

type ShoppingItemRowProps = {
  item: ShoppingItem
  checkbox: Ref<HTMLInputElement>
  onToggle: (item: ShoppingItem) => void
  onLess: () => void
  onMore: () => void
}

export function ShoppingItemRow({
  item,
  checkbox,
  onToggle,
  onLess,
  onMore,
}: ShoppingItemRowProps) {
  if (isCheckedOff(item)) {
    return (
      <li className="shoppingRow">
        <label className="itemCheckedOff">
          <input
            type="checkbox"
            ref={checkbox}
            checked
            aria-label={formatItemForAnnouncement(item)}
            onChange={() => onToggle(item)}
          />
          <span>{formatItemForAnnouncement(item)}</span>
        </label>
      </li>
    )
  }

  return (
    <li className="shoppingRow">
      <label className="itemOpen">
        <input
          type="checkbox"
          ref={checkbox}
          checked={false}
          aria-label={formatItemForAnnouncement(item)}
          onChange={() => onToggle(item)}
        />
        <span>{item.name}</span>
      </label>
      <Stepper
        lessLabel={lessItemLabel(item)}
        moreLabel={moreItemLabel(item)}
        moreDisabled={!canTakeOneMore(item)}
        onLess={onLess}
        onMore={onMore}
      >
        <span className="stepperAmount" aria-hidden="true">
          {formatQuantity(steppedQuantity(item))}
        </span>
      </Stepper>
    </li>
  )
}
