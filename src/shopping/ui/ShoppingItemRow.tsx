import {
  formatItemForAnnouncement,
  isCheckedOff,
  type ShoppingItem,
} from '../domain/shoppingItem'

type ShoppingItemRowProps = {
  item: ShoppingItem
  onToggle: (item: ShoppingItem) => void
}

export function ShoppingItemRow({ item, onToggle }: ShoppingItemRowProps) {
  const checkedOff = isCheckedOff(item)

  return (
    <li>
      <label className={checkedOff ? 'itemCheckedOff' : 'itemOpen'}>
        <input
          type="checkbox"
          checked={checkedOff}
          onChange={() => onToggle(item)}
        />
        <span>{formatItemForAnnouncement(item)}</span>
      </label>
    </li>
  )
}
