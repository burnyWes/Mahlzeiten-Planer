import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'

export function SuppliesArea({ navigation }: { navigation: ReactNode }) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Vorräte
          </h1>
        </div>
      </main>
    </>
  )
}
