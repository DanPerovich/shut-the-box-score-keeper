import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  easeOutBack,
  easeOutCubic,
  prefersReducedMotion,
  tween,
  tweenMany,
  type Running,
} from '../celebrate'
import { playerTotals } from '../game/rules'
import { useGame } from '../game/GameContext'

const CONFETTI_COUNT = 28

function runCelebration(root: HTMLElement, confetti: Array<{ delay: number; duration: number }>, force: boolean) {
  const runners: Running[] = []
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)
  const opts = { force }

  runners.push(
    tween(q('.winner-hero'), {
      ...opts,
      duration: 700,
      ease: easeOutBack,
      from: { opacity: 0, y: 16, scale: 0.92 },
      to: { opacity: 1, y: 0, scale: 1 },
    }),
  )

  runners.push(
    tween(q('.winner-eyebrow'), {
      ...opts,
      duration: 550,
      delay: 150,
      ease: easeOutCubic,
      from: { opacity: 0, y: 8 },
      to: { opacity: 1, y: 0 },
    }),
  )

  runners.push(
    tween(q('.winner-name'), {
      ...opts,
      duration: 850,
      delay: 250,
      ease: easeOutBack,
      from: { opacity: 0, scale: 0.4, rotate: -4 },
      through: [
        { at: 0.55, pose: { opacity: 1, scale: 1.12, rotate: 1.5 } },
        { at: 0.75, pose: { opacity: 1, scale: 0.96, rotate: -0.5 } },
      ],
      to: { opacity: 1, scale: 1, rotate: 0 },
    }),
  )

  const shine = q<HTMLElement>('.winner-name-shine')
  if (shine) {
    shine.style.opacity = '1'
    runners.push(
      tween(shine, {
        ...opts,
        duration: 2400,
        delay: 1100,
        ease: (t) => t,
        iterations: Infinity,
        from: { backgroundPosition: '0% 50%' },
        through: [{ at: 0.5, pose: { backgroundPosition: '100% 50%' } }],
        to: { backgroundPosition: '0% 50%' },
      }),
    )
  }

  runners.push(
    tween(q('.winner-score-wrap'), {
      ...opts,
      duration: 700,
      delay: 450,
      ease: easeOutBack,
      from: { opacity: 0, y: 18, scale: 0.7 },
      to: { opacity: 1, y: 0, scale: 1 },
    }),
  )

  runners.push(
    tween(q('.winner-score'), {
      ...opts,
      duration: 1400,
      delay: 900,
      ease: (t) => t,
      iterations: Infinity,
      from: { scale: 1 },
      through: [{ at: 0.5, pose: { scale: 1.06 } }],
      to: { scale: 1 },
    }),
  )

  runners.push(
    tween(q('.winner-tagline'), {
      ...opts,
      duration: 550,
      delay: 700,
      ease: easeOutCubic,
      from: { opacity: 0, y: 14 },
      to: { opacity: 1, y: 0 },
    }),
  )

  runners.push(
    tween(q('.standings-panel'), {
      ...opts,
      duration: 550,
      delay: 500,
      ease: easeOutCubic,
      from: { opacity: 0, y: 14 },
      to: { opacity: 1, y: 0 },
    }),
  )

  root.querySelectorAll<HTMLElement>('.standings-row').forEach((row, i) => {
    runners.push(
      tween(row, {
        ...opts,
        duration: 450,
        delay: 550 + i * 100,
        ease: easeOutCubic,
        from: { opacity: 0, x: -12 },
        to: { opacity: 1, x: 0 },
      }),
    )
  })

  runners.push(
    tween(q('.scoreboard'), {
      ...opts,
      duration: 550,
      delay: 1000,
      ease: easeOutCubic,
      from: { opacity: 0, y: 14 },
      to: { opacity: 1, y: 0 },
    }),
  )

  runners.push(
    tween(q('.results-cta'), {
      ...opts,
      duration: 550,
      delay: 1150,
      ease: easeOutCubic,
      from: { opacity: 0, y: 14 },
      to: { opacity: 1, y: 0 },
    }),
  )

  root.querySelectorAll<HTMLElement>('.burst-ring').forEach((ring, i) => {
    runners.push(
      tween(ring, {
        ...opts,
        duration: i === 0 ? 1100 : 1250,
        delay: i === 0 ? 100 : 280,
        ease: easeOutCubic,
        from: { opacity: 0.9, scale: 0.2, centered: true },
        through: [{ at: 0.7, pose: { opacity: 0.35, scale: 4, centered: true } }],
        to: { opacity: 0, scale: 7.5, centered: true },
      }),
    )
  })

  root.querySelectorAll<HTMLElement>('.confetti-slot').forEach((slot, i) => {
    const piece = confetti[i]
    if (!piece) return
    runners.push(
      tween(slot, {
        ...opts,
        duration: piece.duration,
        delay: piece.delay,
        ease: easeOutCubic,
        from: { opacity: 0, y: -10, scale: 0.6 },
        through: [{ at: 0.12, pose: { opacity: 1, y: 30, scale: 1 } }],
        to: { opacity: 0, y: 220, scale: 1 },
      }),
    )
  })

  return tweenMany(runners)
}

export function ResultsScreen() {
  const { state, newGame } = useGame()
  const rootRef = useRef<HTMLDivElement>(null)
  const runningRef = useRef<Running | null>(null)
  const [motionBlocked, setMotionBlocked] = useState(() => prefersReducedMotion())
  const totals = playerTotals(state.players, state.scores)
  const ranked = [...state.players].sort(
    (a, b) => totals[a.id] - totals[b.id] || a.name.localeCompare(b.name),
  )
  const winner = ranked[0]
  const winnerTotal = winner ? totals[winner.id] : 0
  const tied = ranked.filter((p) => totals[p.id] === winnerTotal)
  const isTie = tied.length > 1
  const shutTheBox = winnerTotal === 0

  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: `${4 + ((i * 37) % 92)}%`,
        delay: (i % 10) * 80,
        duration: 1800 + (i % 5) * 250,
        rotate: `${(i * 47) % 360}deg`,
        size: `${6 + (i % 4) * 3}px`,
        hue: i % 4,
      })),
    [],
  )

  const winnerLabel = isTie
    ? tied.map((p) => p.name).join(' & ')
    : (winner?.name ?? 'Winner')

  const startCelebration = useCallback(
    (force: boolean) => {
      const root = rootRef.current
      if (!root) return
      runningRef.current?.cancel()
      runningRef.current = runCelebration(root, confetti, force)
    },
    [confetti],
  )

  useLayoutEffect(() => {
    const blocked = prefersReducedMotion()
    setMotionBlocked(blocked)
    startCelebration(false)

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setMotionBlocked(mq.matches)
    mq.addEventListener('change', onChange)

    return () => {
      mq.removeEventListener('change', onChange)
      runningRef.current?.cancel()
      runningRef.current = null
    }
  }, [startCelebration])

  return (
    <div ref={rootRef} className="app-shell results-screen">
      <header className="winner-hero" aria-live="polite">
        <div className="winner-burst" aria-hidden="true">
          {confetti.map((c) => {
            const pieceStyle = {
              width: c.size,
              height: c.size,
              transform: `rotate(${c.rotate})`,
            } as CSSProperties
            return (
              <span key={c.id} className="confetti-slot" style={{ left: c.left }}>
                <span
                  className={`confetti confetti-${c.hue}`}
                  style={pieceStyle}
                />
              </span>
            )
          })}

          <span className="burst-ring burst-ring-a" />
          <span className="burst-ring burst-ring-b" />
        </div>

        <p className="winner-eyebrow">
          {shutTheBox ? 'Shut the Box!' : isTie ? 'Dead heat' : 'Champion'}
        </p>
        <h1 className="winner-name">
          <span className="winner-name-label">{winnerLabel}</span>
          <span className="winner-name-shine" aria-hidden="true">
            {winnerLabel}
          </span>
        </h1>
        <div className="winner-score-wrap">
          <span className="winner-score-label">
            {isTie ? 'Tied score' : 'Winning score'}
          </span>
          <strong className="winner-score">{winnerTotal}</strong>
        </div>
        {shutTheBox && (
          <p className="winner-tagline">Every tile shut — perfect round energy</p>
        )}
        {!shutTheBox && (
          <p className="winner-tagline">Lower total wins · well played</p>
        )}
      </header>

      {motionBlocked && (
        <div className="motion-blocked-note" role="status">
          <p>
            Celebration animation is off because <strong>Reduce Motion</strong> is
            enabled on this iPhone (Settings → Accessibility → Motion).
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => startCelebration(true)}
          >
            Play celebration once
          </button>
        </div>
      )}

      {!motionBlocked && (
        <button
          type="button"
          className="ghost replay-celebration"
          onClick={() => startCelebration(true)}
        >
          Replay celebration
        </button>
      )}

      <section className="panel standings-panel">
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Final standings</h2>
        <ol className="standings-list">
          {ranked.map((p, i) => {
            const isWinner = totals[p.id] === winnerTotal
            return (
              <li
                key={p.id}
                className={`standings-row${isWinner ? ' is-winner' : ''}`}
              >
                <span className="standings-rank">#{i + 1}</span>
                <span className="standings-name">{p.name}</span>
                <span className="standings-total">{totals[p.id]}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="panel scoreboard">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              {Array.from({ length: state.settings.rounds }, (_, i) => (
                <th key={i}>R{i + 1}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                {state.scores.map((row, ri) => (
                  <td key={ri}>{row[p.id] ?? '—'}</td>
                ))}
                <td className="total">{totals[p.id]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <button
        type="button"
        className="primary-wide results-cta"
        style={{ width: '100%' }}
        onClick={newGame}
      >
        New game
      </button>
    </div>
  )
}
