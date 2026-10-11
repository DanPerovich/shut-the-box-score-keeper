import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { playerTotals } from '../game/rules'
import { useGame } from '../game/GameContext'

const CONFETTI_COUNT = 28

export function ResultsScreen() {
  const { state, newGame } = useGame()
  const [motionReady, setMotionReady] = useState(false)
  const totals = playerTotals(state.players, state.scores)
  const ranked = [...state.players].sort(
    (a, b) => totals[a.id] - totals[b.id] || a.name.localeCompare(b.name),
  )
  const winner = ranked[0]
  const winnerTotal = winner ? totals[winner.id] : 0
  const tied = ranked.filter((p) => totals[p.id] === winnerTotal)
  const isTie = tied.length > 1
  const shutTheBox = winnerTotal === 0

  // Defer the celebrating class until after paint. Double rAF alone is flaky on
  // iOS WebKit after a screen transition, so also fall back to a short timeout.
  useEffect(() => {
    let cancelled = false
    let inner = 0
    const start = () => {
      if (!cancelled) setMotionReady(true)
    }
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(start)
    })
    const timer = window.setTimeout(start, 50)
    return () => {
      cancelled = true
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
      window.clearTimeout(timer)
    }
  }, [])

  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: `${4 + ((i * 37) % 92)}%`,
        delay: `${(i % 10) * 0.08}s`,
        duration: `${1.8 + (i % 5) * 0.25}s`,
        rotate: `${(i * 47) % 360}deg`,
        size: `${6 + (i % 4) * 3}px`,
        hue: i % 4,
      })),
    [],
  )

  const winnerLabel = isTie
    ? tied.map((p) => p.name).join(' & ')
    : (winner?.name ?? 'Winner')

  return (
    <div
      className={`app-shell results-screen${motionReady ? ' is-celebrating' : ''}`}
    >
      <header className="winner-hero" aria-live="polite">
        {/* Mount burst only once celebrating so iOS applies the full animation shorthand on insert */}
        {motionReady && (
          <div className="winner-burst" aria-hidden="true">
            {confetti.map((c) => {
              // Full animation shorthand inline — Safari drops animations when
              // delay/duration longhands are set before animation-name.
              const slotStyle = {
                left: c.left,
                animation: `confetti-fall ${c.duration} cubic-bezier(0.22, 0.7, 0.3, 1) ${c.delay} forwards`,
              } as CSSProperties
              const pieceStyle = {
                width: c.size,
                height: c.size,
                transform: `rotate(${c.rotate})`,
              } as CSSProperties
              return (
                <span key={c.id} className="confetti-slot" style={slotStyle}>
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
        )}

        <p className="winner-eyebrow">
          {shutTheBox ? 'Shut the Box!' : isTie ? 'Dead heat' : 'Champion'}
        </p>
        <h1 className="winner-name" data-label={winnerLabel}>
          {winnerLabel}
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

      <section className="panel standings-panel">
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Final standings</h2>
        <ol className="standings-list">
          {ranked.map((p, i) => {
            const isWinner = totals[p.id] === winnerTotal
            const rowStyle = motionReady
              ? ({
                  animation: `standings-in 0.45s cubic-bezier(0.2, 0.9, 0.3, 1) ${0.55 + i * 0.1}s backwards`,
                } as CSSProperties)
              : undefined
            return (
              <li
                key={p.id}
                className={`standings-row${isWinner ? ' is-winner' : ''}`}
                style={rowStyle}
              >
                <span className="standings-rank">#{i + 1}</span>
                <span className="standings-name">{p.name}</span>
                <span className="standings-total">{totals[p.id]}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section
        className="panel scoreboard"
        style={
          motionReady
            ? ({
                animation: 'fade-up 0.55s ease-out 1s backwards',
              } as CSSProperties)
            : undefined
        }
      >
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
