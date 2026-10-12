import type { BoardState, Player, ThemeId } from '../types'
import { THEME_IDS } from '../types'

export function createEmptyBoard(maxTile: number): BoardState {
  return Array.from({ length: maxTile }, () => true)
}

export function scoreFromBoard(board: BoardState): number {
  return board.reduce((sum, open, i) => (open ? sum + (i + 1) : sum), 0)
}

export function openSum(board: BoardState): number {
  return scoreFromBoard(board)
}

export function openTiles(board: BoardState): number[] {
  return board.flatMap((open, i) => (open ? [i + 1] : []))
}

export function shutTiles(board: BoardState, tiles: number[]): BoardState {
  const next = [...board]
  for (const t of tiles) {
    if (t >= 1 && t <= next.length) next[t - 1] = false
  }
  return next
}

export function openTile(board: BoardState, tile: number): BoardState {
  const next = [...board]
  if (tile >= 1 && tile <= next.length) next[tile - 1] = true
  return next
}

export function toggleTile(board: BoardState, tile: number): BoardState {
  const next = [...board]
  if (tile >= 1 && tile <= next.length) next[tile - 1] = !next[tile - 1]
  return next
}

/** All non-empty subsets of `open` that sum to `roll`. */
export function validShutCombinations(open: number[], roll: number): number[][] {
  const results: number[][] = []
  const sorted = [...open].sort((a, b) => a - b)

  function walk(start: number, remaining: number, path: number[]) {
    if (remaining === 0) {
      if (path.length > 0) results.push([...path])
      return
    }
    for (let i = start; i < sorted.length; i++) {
      const n = sorted[i]
      if (n > remaining) break
      path.push(n)
      walk(i + 1, remaining - n, path)
      path.pop()
    }
  }

  walk(0, roll, [])
  return results
}

export function selectionIsValid(
  open: number[],
  selected: number[],
  roll: number,
): boolean {
  if (selected.length === 0) return false
  const set = new Set(open)
  if (selected.some((t) => !set.has(t))) return false
  if (new Set(selected).size !== selected.length) return false
  return selected.reduce((a, b) => a + b, 0) === roll
}

export function diceCount(board: BoardState, oneDieWhenSumLeq6: boolean): 1 | 2 {
  if (oneDieWhenSumLeq6 && openSum(board) <= 6) return 1
  return 2
}

/** Sum of entered faces when every required die is set; otherwise null. */
export function rollFromDice(dice: number[], required: 1 | 2): number | null {
  if (dice.length !== required) return null
  if (dice.some((d) => d < 1 || d > 6)) return null
  return dice.reduce((a, b) => a + b, 0)
}

/**
 * Lowest score wins. On tie, pick the tied player who appears earliest in priorOrder.
 */
export function nextRoundStarter(
  scores: Record<string, number | null>,
  priorOrder: string[],
): string {
  const played = priorOrder.filter((id) => typeof scores[id] === 'number')
  if (played.length === 0) return priorOrder[0]

  let best = Infinity
  for (const id of played) {
    const s = scores[id] as number
    if (s < best) best = s
  }

  for (const id of priorOrder) {
    if (scores[id] === best) return id
  }
  return played[0]
}

/** Rotate priorOrder so starter is first, preserving relative order. */
export function orderStartingWith(priorOrder: string[], starter: string): string[] {
  const idx = priorOrder.indexOf(starter)
  if (idx <= 0) return [...priorOrder]
  return [...priorOrder.slice(idx), ...priorOrder.slice(0, idx)]
}

/**
 * Play order for the next game after a finished one: same rule as rounds —
 * lowest total goes first; ties keep prior order.
 */
export function nextGamePlayerOrder(
  players: Player[],
  scores: Record<string, number | null>[],
  lastOrder: string[],
): Player[] {
  const byId = new Map(players.map((p) => [p.id, p]))
  const order = lastOrder.filter((id) => byId.has(id))
  for (const p of players) {
    if (!order.includes(p.id)) order.push(p.id)
  }
  if (order.length === 0) return [...players]

  const totals = playerTotals(players, scores)
  const asScores: Record<string, number | null> = {}
  for (const id of order) asScores[id] = totals[id] ?? 0

  const starter = nextRoundStarter(asScores, order)
  return orderStartingWith(order, starter).map((id) => byId.get(id)!)
}

export function emptyRoundScores(players: Player[]): Record<string, number | null> {
  const row: Record<string, number | null> = {}
  for (const p of players) row[p.id] = null
  return row
}

export function playerTotals(
  players: Player[],
  scores: Record<string, number | null>[],
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const p of players) {
    totals[p.id] = scores.reduce((sum, round) => {
      const v = round[p.id]
      return sum + (typeof v === 'number' ? v : 0)
    }, 0)
  }
  return totals
}

export function pickTheme(choice: ThemeId | 'random'): ThemeId {
  if (choice !== 'random') return choice
  return THEME_IDS[Math.floor(Math.random() * THEME_IDS.length)]
}

export function newPlayerId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * After editing scores for round `editedRound`, recompute orders for later rounds.
 * Returns updated orders. Does not alter scores.
 */
export function recalculateOrdersAfterEdit(
  scores: Record<string, number | null>[],
  orders: string[][],
  editedRound: number,
  playerIds: string[],
): string[][] {
  const next = orders.map((o) => [...o])
  for (let r = editedRound + 1; r < next.length; r++) {
    const prevOrder = next[r - 1].filter((id) => playerIds.includes(id))
    if (prevOrder.length === 0) continue
    const prevScores = scores[r - 1]
    const allPrevScored = prevOrder.every((id) => typeof prevScores[id] === 'number')
    if (!allPrevScored) {
      // Previous round incomplete — keep current order filtered to active players
      next[r] = next[r].filter((id) => playerIds.includes(id))
      if (next[r].length === 0) next[r] = [...prevOrder]
      continue
    }
    const starter = nextRoundStarter(prevScores, prevOrder)
    next[r] = orderStartingWith(prevOrder, starter)
  }
  return next
}

/** Rebuild remaining queue for an in-progress round after order/player changes. */
export function rebuildQueue(
  order: string[],
  roundScores: Record<string, number | null>,
  preferredCurrent?: string | null,
): string[] {
  const pending = order.filter((id) => roundScores[id] === null)
  if (!preferredCurrent || !pending.includes(preferredCurrent)) return pending
  const idx = pending.indexOf(preferredCurrent)
  return [...pending.slice(idx), ...pending.slice(0, idx)]
}

/**
 * Swap (or move) a recorded score between two players in one round.
 * `fromPlayerId` must already have a numeric score. If `toPlayerId` is still
 * pending (null), this clears the source so they can play again — the usual
 * fix when someone accidentally played out of order.
 */
export function reassignRoundScore(
  roundScores: Record<string, number | null>,
  fromPlayerId: string,
  toPlayerId: string,
): Record<string, number | null> | null {
  if (fromPlayerId === toPlayerId) return null
  if (!(fromPlayerId in roundScores) || !(toPlayerId in roundScores)) return null
  const fromScore = roundScores[fromPlayerId]
  if (typeof fromScore !== 'number') return null
  return {
    ...roundScores,
    [fromPlayerId]: roundScores[toPlayerId] ?? null,
    [toPlayerId]: fromScore,
  }
}
