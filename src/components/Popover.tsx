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
    <div
      ref={ref}
      className={cx(
        'absolute top-[calc(100%+6px)] right-0 z-20 min-w-[188px] rounded-xl border border-border-subtle bg-panel p-1.5 shadow-float',
        className,
      )}
      role="menu"
    >
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/35"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-[min(32.5rem,calc(100vw-2rem))] max-h-[min(40rem,calc(100dvh-2rem))] overflow-auto rounded-2xl bg-panel px-6 pt-[22px] pb-5 shadow-float max-md:px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title" className="mb-3 text-xl tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
