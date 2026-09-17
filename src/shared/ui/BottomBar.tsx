import type { ReactNode } from 'react'

export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="bottomBar">
      <div className="bottomBarContent">{children}</div>
    </div>
  )
}
