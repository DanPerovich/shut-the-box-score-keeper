import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import { playerTotals } from '../game/rules'
import { useGame } from '../game/GameContext'

const CONFETTI_COUNT = 28

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** WAAPI helper — CSS animations are unreliable in iOS Chrome (WKWebView). */
function animateEl(
  el: Element | null | undefined,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): Animation | undefined {
  if (!el || typeof (el as HTMLElement).animate !== 'function') return
  try {
    const anim = (el as HTMLElement).animate(keyframes, {
      fill: 'both',
      ...options,
    })
    // Slightly off 1.0 boots some iOS WebKit animations off a stuck CA timeline.
    try {
      anim.playbackRate = 1.000001
    } catch {
      /* ignore */
    }
    return anim
  } catch {
    return
  }
}

export function ResultsScreen() {
  const { state, newGame } = useGame()
  const rootRef = useRef<HTMLDivElement>(null)
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

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return

    const animations: Animation[] = []
    const track = (anim: Animation | undefined) => {
      if (anim) animations.push(anim)
    }

    // Start synchronously after DOM commit — WAAPI is reliable on iOS Chrome
    // when not deferred behind CSS class toggles / late rAF.
    track(
      animateEl(
        root.querySelector('.winner-hero'),
        [
          { opacity: 0, transform: 'translate3d(0, 16px, 0) scale(0.92)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        ],
        { duration: 700, easing: 'cubic-bezier(0.16, 1.1, 0.3, 1)' },
      ),
    )

    track(
      animateEl(
        root.querySelector('.winner-eyebrow'),
        [
          { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 550, delay: 150, easing: 'ease-out' },
      ),
    )

    track(
      animateEl(
        root.querySelector('.winner-name'),
        [
          { opacity: 0, transform: 'translate3d(0, 0, 0) scale(0.4) rotate(-4deg)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1.12) rotate(1.5deg)', offset: 0.55 },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(0.96) rotate(-0.5deg)', offset: 0.75 },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1) rotate(0deg)' },
        ],
        { duration: 850, delay: 250, easing: 'cubic-bezier(0.12, 1.25, 0.3, 1)' },
      ),
    )

    track(
      animateEl(
        root.querySelector('.winner-name-shine'),
        [
          { backgroundPosition: '0% 50%', opacity: 1 },
          { backgroundPosition: '100% 50%', opacity: 1, offset: 0.5 },
          { backgroundPosition: '0% 50%', opacity: 1 },
        ],
        { duration: 2400, delay: 1100, easing: 'ease-in-out', iterations: Infinity },
      ),
    )

    track(
      animateEl(
        root.querySelector('.winner-score-wrap'),
        [
          { opacity: 0, transform: 'translate3d(0, 18px, 0) scale(0.7)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        ],
        { duration: 700, delay: 450, easing: 'cubic-bezier(0.16, 1.2, 0.3, 1)' },
      ),
    )

    track(
      animateEl(
        root.querySelector('.winner-score'),
        [
          { transform: 'translate3d(0, 0, 0) scale(1)' },
          { transform: 'translate3d(0, 0, 0) scale(1.06)', offset: 0.5 },
          { transform: 'translate3d(0, 0, 0) scale(1)' },
        ],
        { duration: 1400, delay: 900, easing: 'ease-in-out', iterations: Infinity },
      ),
    )

    track(
      animateEl(
        root.querySelector('.winner-tagline'),
        [
          { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 550, delay: 700, easing: 'ease-out' },
      ),
    )

    track(
      animateEl(
        root.querySelector('.standings-panel'),
        [
          { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 550, delay: 500, easing: 'ease-out' },
      ),
    )

    root.querySelectorAll<HTMLElement>('.standings-row').forEach((row, i) => {
      track(
        animateEl(
          row,
          [
            { opacity: 0, transform: 'translate3d(-12px, 0, 0)' },
            { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          ],
          {
            duration: 450,
            delay: 550 + i * 100,
            easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
          },
        ),
      )
    })

    track(
      animateEl(
        root.querySelector('.scoreboard'),
        [
          { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 550, delay: 1000, easing: 'ease-out' },
      ),
    )

    track(
      animateEl(
        root.querySelector('.results-cta'),
        [
          { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 550, delay: 1150, easing: 'ease-out' },
      ),
    )

    root.querySelectorAll<HTMLElement>('.burst-ring').forEach((ring, i) => {
      track(
        animateEl(
          ring,
          [
            { opacity: 0.9, transform: 'translate3d(-50%, -50%, 0) scale(0.2)' },
            { opacity: 0.35, transform: 'translate3d(-50%, -50%, 0) scale(4)', offset: 0.7 },
            { opacity: 0, transform: 'translate3d(-50%, -50%, 0) scale(7.5)' },
          ],
          {
            duration: i === 0 ? 1100 : 1250,
            delay: i === 0 ? 100 : 280,
            easing: 'cubic-bezier(0.15, 0.85, 0.3, 1)',
            fill: 'forwards',
          },
        ),
      )
    })

    root.querySelectorAll<HTMLElement>('.confetti-slot').forEach((slot, i) => {
      const piece = confetti[i]
      if (!piece) return
      track(
        animateEl(
          slot,
          [
            { opacity: 0, transform: 'translate3d(0, -10px, 0) scale(0.6)' },
            { opacity: 1, transform: 'translate3d(0, 30px, 0) scale(1)', offset: 0.12 },
            { opacity: 0, transform: 'translate3d(0, 220px, 0) scale(1)' },
          ],
          {
            duration: piece.duration,
            delay: piece.delay,
            easing: 'cubic-bezier(0.22, 0.7, 0.3, 1)',
            fill: 'forwards',
          },
        ),
      )
    })

    return () => {
      for (const anim of animations) anim.cancel()
    }
  }, [confetti])

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
