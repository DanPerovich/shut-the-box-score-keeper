import { useEffect, useRef, useState, type ReactNode } from 'react'

const DEFAULT_HOLD_MS = 750

interface HoldButtonProps {
  onConfirm: () => void
  disabled?: boolean
  className?: string
  holdMs?: number
  title?: string
  'aria-label'?: string
  children: ReactNode
}

export function HoldButton({
  onConfirm,
  disabled = false,
  className = '',
  holdMs = DEFAULT_HOLD_MS,
  title,
  'aria-label': ariaLabel,
  children,
}: HoldButtonProps) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const confirmedRef = useRef(false)
  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm

  const clearAnimation = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    startRef.current = null
    setHolding(false)
    setProgress(0)
  }

  const cancelHold = () => {
    if (startRef.current == null) return
    clearAnimation()
  }

  const tick = (now: number) => {
    const start = startRef.current
    if (start == null) return
    const next = Math.min(1, (now - start) / holdMs)
    setProgress(next)
    if (next >= 1) {
      clearAnimation()
      if (!confirmedRef.current) {
        confirmedRef.current = true
        onConfirmRef.current()
      }
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const startHold = () => {
    if (disabled || startRef.current != null) return
    confirmedRef.current = false
    startRef.current = performance.now()
    setHolding(true)
    setProgress(0)
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (disabled) clearAnimation()
  }, [disabled])

  const classes = ['hold-button', className].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-busy={holding || undefined}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        startHold()
      }}
      onPointerMove={(e) => {
        if (startRef.current == null) return
        const r = e.currentTarget.getBoundingClientRect()
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        ) {
          cancelHold()
        }
      }}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onLostPointerCapture={cancelHold}
      onBlur={cancelHold}
      onKeyDown={(e) => {
        if (e.key !== ' ' && e.key !== 'Enter') return
        if (e.repeat) return
        e.preventDefault()
        startHold()
      }}
      onKeyUp={(e) => {
        if (e.key !== ' ' && e.key !== 'Enter') return
        e.preventDefault()
        cancelHold()
      }}
      onClick={(e) => e.preventDefault()}
    >
      <span
        className="hold-button-fill"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />
      <span className="hold-button-label">{children}</span>
    </button>
  )
}
