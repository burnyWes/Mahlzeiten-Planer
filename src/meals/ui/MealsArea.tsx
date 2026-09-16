import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'

type MealsAreaProps = {
  navigation: ReactNode
}

export function MealsArea({ navigation }: MealsAreaProps) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Gerichte, keine
          </h1>
        </div>
        <p>Noch keine Gerichte.</p>
      </main>
    </>
  )
}
