import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { mealItemsHeading } from '../domain/announcements'
import { formatMealItem, type Meal } from '../domain/meal'
import { paragraphsOf } from '../domain/text'
import { AddToShoppingListIcon } from './AddToShoppingListIcon'
import { EditIcon } from './EditIcon'
import { TrashIcon } from './TrashIcon'

type MealPageProps = {
  meal: Meal
  onBack: () => void
  onAddToShoppingList: () => void
  onEdit: () => void
  onDelete: () => void
}

type TextSectionProps = {
  title: string
  text: string
}

function TextSection({ title, text }: TextSectionProps) {
  const paragraphs = paragraphsOf(text)
  if (paragraphs.length === 0) return null

  return (
    <>
      <h2>{title}</h2>
      {paragraphs.map((paragraph, position) => (
        <p key={`${position}-${paragraph}`}>{paragraph}</p>
      ))}
    </>
  )
}

export function MealPage({
  meal,
  onBack,
  onAddToShoppingList,
  onEdit,
  onDelete,
}: MealPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Gerichten
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {meal.name}
      </h1>
      {meal.items.length > 0 && (
        <>
          <h2>{mealItemsHeading(meal.items.length)}</h2>
          <ul className="itemList">
            {meal.items.map((item, position) => (
              <li key={`${position}-${item.name}`}>{formatMealItem(item)}</li>
            ))}
          </ul>
        </>
      )}
      <TextSection title="Zutaten" text={meal.ingredientNotes} />
      <TextSection title="Rezept" text={meal.recipe} />
      <div className="iconActions">
        <button
          type="button"
          onClick={onAddToShoppingList}
          aria-label="Auf die Einkaufsliste"
        >
          <AddToShoppingListIcon />
        </button>
        <button type="button" onClick={onEdit} aria-label="Bearbeiten">
          <EditIcon />
        </button>
        <button type="button" onClick={onDelete} aria-label="Löschen">
          <TrashIcon />
        </button>
      </div>
    </main>
  )
}
