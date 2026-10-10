import { useState } from 'react'
import { playerTotals } from '../game/rules'
import type { GameState } from '../types'

interface ScoreboardProps {
  state: GameState
  currentPlayerId?: string | null
  onEditScore: (roundIndex: number, playerId: string, score: number) => void
  onRemovePlayer: (playerId: string) => void
}

export function Scoreboard({
  state,
  currentPlayerId,
  onEditScore,
  onRemovePlayer,
}: ScoreboardProps) {
  const { players, scores, settings } = state
  const totals = playerTotals(players, scores)
  const [editing, setEditing] = useState<{
    round: number
    playerId: string
  } | null>(null)
  const [draft, setDraft] = useState('')

  const beginEdit = (round: number, playerId: string, current: number | null) => {
    if (current === null) return
    setEditing({ round, playerId })
    setDraft(String(current))
  }

  const commit = () => {
    if (!editing) return
    const n = Number(draft)
    if (!Number.isFinite(n) || n < 0) {
      setEditing(null)
      return
    }
    onEditScore(editing.round, editing.playerId, n)
    setEditing(null)
  }

  return (
    <div className="panel">
      <div className="row spread" style={{ marginBottom: '0.6rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Scoreboard</h2>
        <span className="hint">Tap a score to edit</span>
      </div>
      <div className="scoreboard">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              {Array.from({ length: settings.rounds }, (_, i) => (
                <th key={i}>R{i + 1}</th>
              ))}
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr
                key={p.id}
                className={p.id === currentPlayerId ? 'current-player' : undefined}
              >
                <td>{p.name}</td>
                {scores.map((row, ri) => {
                  const val = row[p.id]
                  const isEditing =
                    editing?.round === ri && editing.playerId === p.id
                  return (
                    <td key={ri}>
                      {isEditing ? (
                        <input
                          autoFocus
                          inputMode="numeric"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={commit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commit()
                            if (e.key === 'Escape') setEditing(null)
                          }}
                          aria-label={`Edit score for ${p.name} round ${ri + 1}`}
                          style={{
                            width: '3.2rem',
                            minHeight: 36,
                            textAlign: 'center',
                            borderRadius: 8,
                            border: '2px solid var(--accent)',
                            background: 'var(--surface-solid)',
                            color: 'var(--ink)',
                          }}
                        />
                      ) : val === null || val === undefined ? (
                        <span className="hint">—</span>
                      ) : (
                        <button
                          type="button"
                          className="score-cell"
                          onClick={() => beginEdit(ri, p.id, val)}
                        >
                          {val}
                        </button>
                      )}
                    </td>
                  )
                })}
                <td className="total">{totals[p.id]}</td>
                <td>
                  {players.length > 2 && (
                    <button
                      type="button"
                      className="ghost"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove ${p.name} from this game? Their scores will be dropped.`,
                          )
                        ) {
                          onRemovePlayer(p.id)
                        }
                      }}
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
