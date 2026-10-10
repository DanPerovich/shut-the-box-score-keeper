import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  GameSettings,
  GameState,
  Player,
  ThemeId,
  TurnState,
} from '../types'
import { DEFAULT_SETTINGS } from '../types'
import {
  createEmptyBoard,
  diceCount,
  emptyRoundScores,
  nextRoundStarter,
  openTiles,
  orderStartingWith,
  pickTheme,
  rebuildQueue,
  recalculateOrdersAfterEdit,
  rollFromDice,
  scoreFromBoard,
  selectionIsValid,
  shutTiles,
  toggleTile,
} from './rules'
import { clearGame, loadGame, saveGame, saveLastSetup } from './storage'

interface GameContextValue {
  state: GameState
  startGame: (players: Player[], settings: GameSettings) => void
  newGame: () => void
  dismissResume: () => void
  hasResume: boolean
  resumeGame: () => void
  endTurn: () => void
  skipTurn: () => void
  undoShut: () => void
  resetTurnBoard: () => void
  tapTile: (tile: number) => void
  setDie: (index: number, face: number) => void
  clearDice: () => void
  confirmSelection: () => void
  clearSelection: () => void
  removePlayer: (playerId: string) => void
  editScore: (roundIndex: number, playerId: string, score: number) => void
  currentScore: number
}

const GameContext = createContext<GameContextValue | null>(null)

function freshSetupState(): GameState {
  return {
    screen: 'setup',
    settings: { ...DEFAULT_SETTINGS },
    resolvedTheme: 'walnut',
    players: [],
    scores: [],
    orders: [],
    turn: null,
  }
}

function startRoundTurn(
  roundIndex: number,
  order: string[],
  maxTile: number,
): TurnState {
  return {
    roundIndex,
    queue: [...order],
    board: createEmptyBoard(maxTile),
    shutHistory: [],
    selectedTiles: [],
    dice: [],
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<GameState | null>(() => loadGame())
  const [state, setState] = useState<GameState>(() => freshSetupState())

  const hasResume = Boolean(saved && saved.screen === 'play')

  useEffect(() => {
    if (state.screen === 'setup') return
    saveGame(state)
  }, [state])

  const resumeGame = useCallback(() => {
    if (!saved) return
    setState(saved)
    setSaved(null)
  }, [saved])

  const dismissResume = useCallback(() => {
    clearGame()
    setSaved(null)
  }, [])

  const newGame = useCallback(() => {
    setState((prev) => {
      if (prev.screen !== 'setup' && prev.players.length >= 2) {
        saveLastSetup(prev.players, prev.settings)
      }
      return freshSetupState()
    })
    clearGame()
    setSaved(null)
  }, [])

  const startGame = useCallback((players: Player[], settings: GameSettings) => {
    saveLastSetup(players, settings)
    const theme: ThemeId = pickTheme(settings.themeChoice)
    const order = players.map((p) => p.id)
    const scores = Array.from({ length: settings.rounds }, () =>
      emptyRoundScores(players),
    )
    const orders = [order, ...Array.from({ length: settings.rounds - 1 }, () => [...order])]
    setState({
      screen: 'play',
      settings,
      resolvedTheme: theme,
      players,
      scores,
      orders,
      turn: startRoundTurn(0, order, settings.maxTile),
    })
  }, [])

  const endTurn = useCallback(() => {
    setState((prev) => {
      if (!prev.turn || prev.turn.queue.length === 0) return prev
      const playerId = prev.turn.queue[0]
      const score = scoreFromBoard(prev.turn.board)
      const scores = prev.scores.map((row, i) =>
        i === prev.turn!.roundIndex ? { ...row, [playerId]: score } : row,
      )
      const queue = prev.turn.queue.slice(1)

      if (queue.length > 0) {
        return {
          ...prev,
          scores,
          turn: {
            ...prev.turn,
            queue,
            board: createEmptyBoard(prev.settings.maxTile),
            shutHistory: [],
            selectedTiles: [],
            dice: [],
          },
        }
      }

      // Round complete
      const nextRound = prev.turn.roundIndex + 1
      if (nextRound >= prev.settings.rounds) {
        return { ...prev, scores, turn: null, screen: 'results' }
      }

      const priorOrder = prev.orders[prev.turn.roundIndex]
      const starter = nextRoundStarter(scores[prev.turn.roundIndex], priorOrder)
      const newOrder = orderStartingWith(priorOrder, starter)
      const orders = prev.orders.map((o, i) => (i === nextRound ? newOrder : o))

      return {
        ...prev,
        scores,
        orders,
        turn: startRoundTurn(nextRound, newOrder, prev.settings.maxTile),
      }
    })
  }, [])

  const skipTurn = useCallback(() => {
    setState((prev) => {
      if (!prev.turn || prev.turn.queue.length < 2) return prev
      const [current, ...rest] = prev.turn.queue
      return {
        ...prev,
        turn: {
          ...prev.turn,
          queue: [...rest, current],
          board: createEmptyBoard(prev.settings.maxTile),
          shutHistory: [],
          selectedTiles: [],
          dice: [],
        },
      }
    })
  }, [])

  const undoShut = useCallback(() => {
    setState((prev) => {
      if (!prev.turn) return prev
      if (prev.settings.validateDice) {
        // Undo last confirmed shut group isn't tracked as groups; reopen last tile in history
      }
      const history = prev.turn.shutHistory
      if (history.length === 0) return prev
      const last = history[history.length - 1]
      const board = [...prev.turn.board]
      board[last - 1] = true
      return {
        ...prev,
        turn: {
          ...prev.turn,
          board,
          shutHistory: history.slice(0, -1),
          selectedTiles: [],
        },
      }
    })
  }, [])

  const resetTurnBoard = useCallback(() => {
    setState((prev) => {
      if (!prev.turn) return prev
      return {
        ...prev,
        turn: {
          ...prev.turn,
          board: createEmptyBoard(prev.settings.maxTile),
          shutHistory: [],
          selectedTiles: [],
          dice: [],
        },
      }
    })
  }, [])

  const tapTile = useCallback((tile: number) => {
    setState((prev) => {
      if (!prev.turn) return prev
      const { board, selectedTiles, dice } = prev.turn

      if (!prev.settings.validateDice) {
        const wasOpen = board[tile - 1]
        const nextBoard = toggleTile(board, tile)
        let shutHistory = prev.turn.shutHistory
        if (wasOpen) {
          shutHistory = [...shutHistory, tile]
        } else {
          shutHistory = shutHistory.filter((t) => t !== tile)
        }
        return {
          ...prev,
          turn: { ...prev.turn, board: nextBoard, shutHistory },
        }
      }

      const required = diceCount(board, prev.settings.oneDieWhenSumLeq6)
      const roll = rollFromDice(dice, required)
      if (roll === null) return prev
      if (!board[tile - 1]) return prev
      const selected = selectedTiles.includes(tile)
        ? selectedTiles.filter((t) => t !== tile)
        : [...selectedTiles, tile]
      return { ...prev, turn: { ...prev.turn, selectedTiles: selected } }
    })
  }, [])

  const setDie = useCallback((index: number, face: number) => {
    setState((prev) => {
      if (!prev.turn) return prev
      if (face < 1 || face > 6 || index < 0) return prev
      const required = diceCount(
        prev.turn.board,
        prev.settings.oneDieWhenSumLeq6,
      )
      if (index >= required || index > prev.turn.dice.length) return prev
      const next = prev.turn.dice.slice(0, required)
      if (index < next.length) next[index] = face
      else next.push(face)
      return {
        ...prev,
        turn: {
          ...prev.turn,
          dice: next,
          selectedTiles: [],
        },
      }
    })
  }, [])

  const clearDice = useCallback(() => {
    setState((prev) => {
      if (!prev.turn) return prev
      return {
        ...prev,
        turn: { ...prev.turn, dice: [], selectedTiles: [] },
      }
    })
  }, [])

  const confirmSelection = useCallback(() => {
    setState((prev) => {
      if (!prev.turn) return prev
      const required = diceCount(
        prev.turn.board,
        prev.settings.oneDieWhenSumLeq6,
      )
      const roll = rollFromDice(prev.turn.dice, required)
      if (roll === null) return prev
      const open = openTiles(prev.turn.board)
      const selected = prev.turn.selectedTiles
      if (!selectionIsValid(open, selected, roll)) return prev
      const board = shutTiles(prev.turn.board, selected)
      return {
        ...prev,
        turn: {
          ...prev.turn,
          board,
          shutHistory: [...prev.turn.shutHistory, ...selected],
          selectedTiles: [],
          dice: [],
        },
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setState((prev) => {
      if (!prev.turn) return prev
      return { ...prev, turn: { ...prev.turn, selectedTiles: [] } }
    })
  }, [])

  const removePlayer = useCallback((playerId: string) => {
    setState((prev) => {
      if (prev.players.length <= 2) return prev
      const players = prev.players.filter((p) => p.id !== playerId)
      const scores = prev.scores.map((row) => {
        const next = { ...row }
        delete next[playerId]
        return next
      })
      const orders = prev.orders.map((o) => o.filter((id) => id !== playerId))

      if (prev.screen === 'results') {
        return { ...prev, players, scores, orders }
      }

      if (!prev.turn) return { ...prev, players, scores, orders }

      const roundIndex = prev.turn.roundIndex
      const order = orders[roundIndex]
      const queue = rebuildQueue(
        order,
        scores[roundIndex],
        prev.turn.queue[0] === playerId ? null : prev.turn.queue[0],
      )

      if (queue.length === 0) {
        const nextRound = roundIndex + 1
        if (nextRound >= prev.settings.rounds) {
          return {
            ...prev,
            players,
            scores,
            orders,
            turn: null,
            screen: 'results',
          }
        }
        const priorOrder = orders[roundIndex]
        const starter = nextRoundStarter(scores[roundIndex], priorOrder)
        const newOrder = orderStartingWith(priorOrder, starter)
        const nextOrders = orders.map((o, i) => (i === nextRound ? newOrder : o))
        return {
          ...prev,
          players,
          scores,
          orders: nextOrders,
          turn: startRoundTurn(nextRound, newOrder, prev.settings.maxTile),
        }
      }

      const resetBoard = prev.turn.queue[0] === playerId
      return {
        ...prev,
        players,
        scores,
        orders,
        turn: {
          ...prev.turn,
          queue,
          board: resetBoard
            ? createEmptyBoard(prev.settings.maxTile)
            : prev.turn.board,
          shutHistory: resetBoard ? [] : prev.turn.shutHistory,
          selectedTiles: resetBoard ? [] : prev.turn.selectedTiles,
          dice: resetBoard ? [] : prev.turn.dice,
        },
      }
    })
  }, [])

  const editScore = useCallback(
    (roundIndex: number, playerId: string, score: number) => {
      setState((prev) => {
        if (roundIndex < 0 || roundIndex >= prev.scores.length) return prev
        if (!prev.players.some((p) => p.id === playerId)) return prev
        const clamped = Math.max(0, Math.floor(score))
        const scores = prev.scores.map((row, i) =>
          i === roundIndex ? { ...row, [playerId]: clamped } : row,
        )
        const playerIds = prev.players.map((p) => p.id)
        let orders = recalculateOrdersAfterEdit(
          scores,
          prev.orders,
          roundIndex,
          playerIds,
        )

        if (!prev.turn || prev.screen !== 'play') {
          return { ...prev, scores, orders }
        }

        // If current round order changed, rebuild queue for pending players
        const currentRound = prev.turn.roundIndex
        if (currentRound > roundIndex) {
          const order = orders[currentRound]
          const preferred = prev.turn.queue[0]
          const queue = rebuildQueue(order, scores[currentRound], preferred)
          return {
            ...prev,
            scores,
            orders,
            turn: { ...prev.turn, queue },
          }
        }

        return { ...prev, scores, orders }
      })
    },
    [],
  )

  const currentScore = state.turn ? scoreFromBoard(state.turn.board) : 0

  const value = useMemo(
    () => ({
      state,
      startGame,
      newGame,
      dismissResume,
      hasResume,
      resumeGame,
      endTurn,
      skipTurn,
      undoShut,
      resetTurnBoard,
      tapTile,
      setDie,
      clearDice,
      confirmSelection,
      clearSelection,
      removePlayer,
      editScore,
      currentScore,
    }),
    [
      state,
      startGame,
      newGame,
      dismissResume,
      hasResume,
      resumeGame,
      endTurn,
      skipTurn,
      undoShut,
      resetTurnBoard,
      tapTile,
      setDie,
      clearDice,
      confirmSelection,
      clearSelection,
      removePlayer,
      editScore,
      currentScore,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
