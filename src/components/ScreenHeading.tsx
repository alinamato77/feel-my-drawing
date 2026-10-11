import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/** Screen title that receives focus on mount, so screen readers announce each new screen. */
export function ScreenHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return (
    <h1 ref={ref} tabIndex={-1} className={`outline-none ${className}`}>
      {children}
    </h1>
  )
}
