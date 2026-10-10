export type ThemeId = 'walnut' | 'slate' | 'carnival' | 'nautical'

export type ThemeChoice = ThemeId | 'random'

export type Screen = 'setup' | 'play' | 'results'

export interface GameSettings {
  maxTile: number
  rounds: number
  validateDice: boolean
  oneDieWhenSumLeq6: boolean
  themeChoice: ThemeChoice
}

export interface Player {
  id: string
  name: string
}

/** true = tile still open */
export type BoardState = boolean[]

export interface TurnState {
  roundIndex: number
  /** Players still due to score this round, in play order. Index 0 is current. */
  queue: string[]
  board: BoardState
  /** Tile numbers shut this turn, in order (for undo). */
  shutHistory: number[]
  /** Selected tiles awaiting confirm in validation mode. */
  selectedTiles: number[]
  /** Individual die faces (1–6) entered for the current throw, in order. */
  dice: number[]
}

export interface GameState {
  screen: Screen
  settings: GameSettings
  resolvedTheme: ThemeId
  players: Player[]
  /** scores[roundIndex][playerId] = number | null (null = not yet played) */
  scores: Record<string, number | null>[]
  /** Full play order for each round (set when round starts). */
  orders: string[][]
  turn: TurnState | null
}

export const DEFAULT_SETTINGS: GameSettings = {
  maxTile: 12,
  rounds: 1,
  validateDice: false,
  oneDieWhenSumLeq6: false,
  themeChoice: 'random',
}

export const THEME_IDS: ThemeId[] = ['walnut', 'slate', 'carnival', 'nautical']

export const DEFAULT_PLAYER_NAMES = [
  'Player 1',
  'Player 2',
  'Player 3',
  'Player 4',
  'Player 5',
  'Player 6',
  'Player 7',
  'Player 8',
]

export const STORAGE_KEY = 'shut-the-box-game-v1'
export const LAST_SETUP_KEY = 'shut-the-box-last-setup-v1'

export interface LastSetup {
  settings: GameSettings
  playerNames: string[]
}
