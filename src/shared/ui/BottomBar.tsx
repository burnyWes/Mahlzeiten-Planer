import type { ReactNode } from 'react'
import { useOnScreenKeyboard } from './useOnScreenKeyboard'

export function BottomBar({ children }: { children: ReactNode }) {
  const keyboardOpen = useOnScreenKeyboard()

  return (
    <div className={keyboardOpen ? 'bottomBar bottomBarInFlow' : 'bottomBar'}>
      <div className="bottomBarContent">{children}</div>
    </div>
  )
}
