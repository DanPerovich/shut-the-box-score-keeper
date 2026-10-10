import type { GameSettings, GameState, LastSetup, Player } from '../types'
import {
  DEFAULT_SETTINGS,
  LAST_SETUP_KEY,
  STORAGE_KEY,
  THEME_IDS,
} from '../types'

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.screen !== 'play' && parsed.screen !== 'results') return null
    return normalizeGameState(parsed)
  } catch {
    return null
  }
}

/** Migrate older saves that stored a single roll total. */
function normalizeGameState(state: GameState): GameState {
  if (!state.turn) return state
  const turn = state.turn as GameState['turn'] & { roll?: number | null }
  if (Array.isArray(turn.dice)) return state
  const { roll: _roll, ...rest } = turn
  return {
    ...state,
    turn: { ...rest, dice: [] },
  }
}

export function saveGame(state: GameState): void {
  try {
    if (state.screen === 'setup') {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function clampSettings(raw: Partial<GameSettings> | undefined): GameSettings {
  const themeChoice =
    raw?.themeChoice === 'random' ||
    (raw?.themeChoice && THEME_IDS.includes(raw.themeChoice))
      ? raw.themeChoice
      : DEFAULT_SETTINGS.themeChoice

  const maxTile = Number(raw?.maxTile)
  const rounds = Number(raw?.rounds)

  return {
    maxTile: Number.isFinite(maxTile)
      ? Math.min(12, Math.max(6, Math.floor(maxTile)))
      : DEFAULT_SETTINGS.maxTile,
    rounds: Number.isFinite(rounds)
      ? Math.min(20, Math.max(1, Math.floor(rounds)))
      : DEFAULT_SETTINGS.rounds,
    validateDice: Boolean(raw?.validateDice),
    oneDieWhenSumLeq6: Boolean(raw?.oneDieWhenSumLeq6),
    themeChoice,
  }
}

export function saveLastSetup(players: Player[], settings: GameSettings): void {
  try {
    const payload: LastSetup = {
      settings: clampSettings(settings),
      playerNames: players.map((p) => p.name.trim()).filter(Boolean).slice(0, 8),
    }
    if (payload.playerNames.length < 2) return
    localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function loadLastSetup(): LastSetup | null {
  try {
    const raw = localStorage.getItem(LAST_SETUP_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastSetup
    if (!parsed || typeof parsed !== 'object') return null
    const names = Array.isArray(parsed.playerNames)
      ? parsed.playerNames
          .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
          .map((n) => n.trim())
          .slice(0, 8)
      : []
    if (names.length < 2) return null
    return {
      settings: clampSettings(parsed.settings),
      playerNames: names,
    }
  } catch {
    return null
  }
}
