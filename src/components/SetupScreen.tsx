import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { newPlayerId } from '../game/rules'
import { loadLastSetup } from '../game/storage'
import { forceRefreshApp } from '../pwa'
import {
  DEFAULT_PLAYER_NAMES,
  DEFAULT_SETTINGS,
  type GameSettings,
  type Player,
  type ThemeChoice,
  THEME_IDS,
} from '../types'
import { useGame } from '../game/GameContext'

const THEME_LABELS: Record<ThemeChoice, string> = {
  random: 'Random',
  walnut: 'Walnut pub',
  slate: 'Slate modern',
  carnival: 'Carnival',
  nautical: 'Nautical',
}

function playersFromNames(names: string[] | undefined): Player[] {
  const list =
    names && names.length >= 2
      ? names
      : [DEFAULT_PLAYER_NAMES[0], DEFAULT_PLAYER_NAMES[1]]
  return list.map((name) => ({ id: newPlayerId(), name }))
}

function reorderById(list: Player[], fromId: string, toId: string): Player[] {
  if (fromId === toId) return list
  const from = list.findIndex((p) => p.id === fromId)
  const to = list.findIndex((p) => p.id === toId)
  if (from < 0 || to < 0) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function SetupScreen() {
  const { startGame, hasResume, resumeGame, dismissResume } = useGame()
  const [players, setPlayers] = useState<Player[]>(() =>
    playersFromNames(loadLastSetup()?.playerNames),
  )
  const [settings, setSettings] = useState<GameSettings>(
    () => loadLastSetup()?.settings ?? { ...DEFAULT_SETTINGS },
  )
  const [roundsText, setRoundsText] = useState(() =>
    String(
      loadLastSetup()?.settings?.rounds ?? DEFAULT_SETTINGS.rounds,
    ),
  )
  const [refreshing, setRefreshing] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const dragIdRef = useRef<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const canStart = useMemo(
    () =>
      players.length >= 2 &&
      players.length <= 8 &&
      players.every((p) => p.name.trim().length > 0) &&
      roundsText !== '' &&
      settings.rounds >= 1 &&
      settings.rounds <= 20 &&
      settings.maxTile >= 6 &&
      settings.maxTile <= 12,
    [players, settings, roundsText],
  )

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K],
  ) => setSettings((s) => ({ ...s, [key]: value }))

  const playerIdAtPoint = (clientY: number): string | null => {
    const root = listRef.current
    if (!root) return null
    const rows = root.querySelectorAll<HTMLElement>('[data-player-id]')
    for (const row of rows) {
      const rect = row.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return row.dataset.playerId ?? null
      }
    }
    return null
  }

  const onHandlePointerDown = (
    e: ReactPointerEvent<HTMLButtonElement>,
    playerId: string,
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragIdRef.current = playerId
    setDraggingId(playerId)
    setOverId(playerId)
  }

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const fromId = dragIdRef.current
    if (!fromId) return
    const toId = playerIdAtPoint(e.clientY)
    if (!toId) return
    setOverId(toId)
    if (toId !== fromId) {
      setPlayers((list) => reorderById(list, fromId, toId))
    }
  }

  const onHandlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragIdRef.current) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // already released
    }
    dragIdRef.current = null
    setDraggingId(null)
    setOverId(null)
  }

  return (
    <div className="app-shell">
      <header>
        <h1 className="brand">Shut the Box</h1>
        <p className="brand-sub">Score keeper for real dice · save to your home screen</p>
      </header>

      {hasResume && (
        <div className="panel resume-banner">
          <strong>Resume unfinished game?</strong>
          <div className="actions">
            <button type="button" onClick={resumeGame}>
              Resume
            </button>
            <button type="button" className="secondary" onClick={dismissResume}>
              Discard
            </button>
          </div>
        </div>
      )}

      <section className="panel">
        <div className="row spread" style={{ marginBottom: '0.35rem' }}>
          <h2 style={{ fontSize: '1.15rem' }}>Players</h2>
          <span className="hint">{players.length} / 8</span>
        </div>
        <p className="hint" style={{ marginBottom: '0.75rem' }}>
          Drag to set play order · top player goes first
        </p>
        <div ref={listRef}>
          {players.map((p, i) => (
            <div
              className={`player-row${draggingId === p.id ? ' is-dragging' : ''}${
                overId === p.id && draggingId && draggingId !== p.id
                  ? ' is-drag-over'
                  : ''
              }`}
              key={p.id}
              data-player-id={p.id}
            >
              <button
                type="button"
                className="player-drag-handle"
                aria-label={`Drag to reorder player ${i + 1}`}
                onPointerDown={(e) => onHandlePointerDown(e, p.id)}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
              >
                ⠿
              </button>
              <input
                value={p.name}
                aria-label={`Player ${i + 1} name`}
                onChange={(e) =>
                  setPlayers((list) =>
                    list.map((x) =>
                      x.id === p.id ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="secondary"
                disabled={players.length <= 2}
                onClick={() =>
                  setPlayers((list) => list.filter((x) => x.id !== p.id))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="secondary"
          disabled={players.length >= 8}
          onClick={() =>
            setPlayers((list) => [
              ...list,
              {
                id: newPlayerId(),
                name: DEFAULT_PLAYER_NAMES[list.length] ?? `Player ${list.length + 1}`,
              },
            ])
          }
        >
          Add player
        </button>
      </section>

      <section className="panel">
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Game settings</h2>

        <div className="field">
          <label htmlFor="maxTile">Board size (1 to N)</label>
          <select
            id="maxTile"
            value={settings.maxTile}
            onChange={(e) => updateSetting('maxTile', Number(e.target.value))}
          >
            {Array.from({ length: 7 }, (_, i) => i + 6).map((n) => (
              <option key={n} value={n}>
                1–{n}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="rounds">Rounds</label>
          <input
            id="rounds"
            type="number"
            min={1}
            max={20}
            inputMode="numeric"
            value={roundsText}
            onChange={(e) => {
              const raw = e.target.value
              setRoundsText(raw)
              if (raw === '') return
              const n = Number(raw)
              if (!Number.isFinite(n)) return
              updateSetting(
                'rounds',
                Math.min(20, Math.max(1, Math.floor(n))),
              )
            }}
            onBlur={() => {
              const n = Number(roundsText)
              const clamped =
                roundsText !== '' && Number.isFinite(n)
                  ? Math.min(20, Math.max(1, Math.floor(n)))
                  : 1
              updateSetting('rounds', clamped)
              setRoundsText(String(clamped))
            }}
          />
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.validateDice}
            onChange={(e) => updateSetting('validateDice', e.target.checked)}
          />
          Validate dice totals (optional)
        </label>

        {settings.validateDice && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.oneDieWhenSumLeq6}
              onChange={(e) =>
                updateSetting('oneDieWhenSumLeq6', e.target.checked)
              }
            />
            Use 1 die when open tiles sum to 6 or less
          </label>
        )}

        <div className="field" style={{ marginTop: '0.75rem' }}>
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            value={settings.themeChoice}
            onChange={(e) =>
              updateSetting('themeChoice', e.target.value as ThemeChoice)
            }
          >
            <option value="random">{THEME_LABELS.random}</option>
            {THEME_IDS.map((id) => (
              <option key={id} value={id}>
                {THEME_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p className="hint" style={{ textAlign: 'center' }}>
        Tip: In Safari or Chrome, use Share / menu → Add to Home Screen for a full-screen app.
      </p>

      <button
        type="button"
        className="primary-wide"
        style={{ width: '100%' }}
        disabled={!canStart}
        onClick={() =>
          startGame(
            players.map((p) => ({ ...p, name: p.name.trim() })),
            settings,
          )
        }
      >
        Start game
      </button>

      <button
        type="button"
        className="secondary"
        style={{ width: '100%', marginTop: '0.75rem' }}
        disabled={refreshing}
        onClick={() => {
          setRefreshing(true)
          void forceRefreshApp()
        }}
      >
        {refreshing ? 'Refreshing…' : 'Refresh app for updates'}
      </button>
      <p className="hint" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        Clears the cached app and reloads the latest version. Saved games stay intact.
      </p>
    </div>
  )
}
