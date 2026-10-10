import { useMemo, type CSSProperties } from 'react'
import { playerTotals } from '../game/rules'
import { useGame } from '../game/GameContext'

const CONFETTI_COUNT = 28

export function ResultsScreen() {
  const { state, newGame } = useGame()
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
    <div className="app-shell results-screen">
      <header className="winner-hero" aria-live="polite">
        <div className="winner-burst" aria-hidden="true">
          {confetti.map((c) => {
            const style = {
              left: c.left,
              animationDelay: c.delay,
              animationDuration: c.duration,
              width: c.size,
              height: c.size,
              '--spin': c.rotate,
            } as CSSProperties
            return (
              <span
                key={c.id}
                className={`confetti confetti-${c.hue}`}
                style={style}
              />
            )
          })}

          <span className="burst-ring burst-ring-a" />
          <span className="burst-ring burst-ring-b" />
        </div>

        <p className="winner-eyebrow">
          {shutTheBox ? 'Shut the Box!' : isTie ? 'Dead heat' : 'Champion'}
        </p>
        <h1 className="winner-name">{winnerLabel}</h1>
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
            return (
              <li
                key={p.id}
                className={`standings-row${isWinner ? ' is-winner' : ''}`}
                style={{ animationDelay: `${0.55 + i * 0.1}s` }}
              >
                <span className="standings-rank">#{i + 1}</span>
                <span className="standings-name">{p.name}</span>
                <span className="standings-total">{totals[p.id]}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="panel scoreboard" style={{ animationDelay: '1s' }}>
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
