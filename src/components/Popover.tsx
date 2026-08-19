import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '../lib/cx'

export function useDismiss(onClose: () => void, enabled = true) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [enabled, onClose])

  return ref
}

export function Popover({
  children,
  className,
  onClose,
}: {
  children: ReactNode
  className?: string
  onClose: () => void
}) {
  const ref = useDismiss(onClose)
  return (
    <div ref={ref} className={cx('popover', className)} role="menu">
      {children}
    </div>
  )
}

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
