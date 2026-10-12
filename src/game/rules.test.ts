import { describe, expect, it } from 'vitest'
import {
  diceCount,
  nextGamePlayerOrder,
  nextRoundStarter,
  orderStartingWith,
  reassignRoundScore,
  rollFromDice,
  scoreFromBoard,
  selectionIsValid,
  validShutCombinations,
} from './rules'

describe('scoreFromBoard', () => {
  it('sums open tiles', () => {
    // 1 open, 2 shut, 3 open => 4
    expect(scoreFromBoard([true, false, true])).toBe(4)
  })

  it('returns 0 when box is shut', () => {
    expect(scoreFromBoard([false, false, false])).toBe(0)
  })
})

describe('validShutCombinations', () => {
  it('finds combinations that sum to roll', () => {
    const combos = validShutCombinations([1, 2, 3, 4], 5)
    expect(combos).toContainEqual([1, 4])
    expect(combos).toContainEqual([2, 3])
    expect(validShutCombinations([1, 2, 3, 4], 6)).toContainEqual([1, 2, 3])
  })
})

describe('selectionIsValid', () => {
  it('accepts exact sum of open tiles', () => {
    expect(selectionIsValid([1, 2, 3, 4], [1, 3], 4)).toBe(true)
  })

  it('rejects wrong sum or closed tiles', () => {
    expect(selectionIsValid([1, 2, 3], [1, 2], 5)).toBe(false)
    expect(selectionIsValid([1, 2, 3], [4], 4)).toBe(false)
  })
})

describe('nextRoundStarter', () => {
  it('picks lowest score', () => {
    expect(
      nextRoundStarter({ a: 10, b: 3, c: 8 }, ['a', 'b', 'c']),
    ).toBe('b')
  })

  it('breaks ties by earliest in prior order', () => {
    expect(
      nextRoundStarter({ a: 5, b: 5, c: 9 }, ['a', 'b', 'c']),
    ).toBe('a')
    expect(
      nextRoundStarter({ a: 5, b: 5, c: 9 }, ['b', 'a', 'c']),
    ).toBe('b')
  })
})

describe('orderStartingWith', () => {
  it('rotates order', () => {
    expect(orderStartingWith(['a', 'b', 'c'], 'b')).toEqual(['b', 'c', 'a'])
  })
})

describe('nextGamePlayerOrder', () => {
  const players = [
    { id: 'a', name: 'Ann' },
    { id: 'b', name: 'Ben' },
    { id: 'c', name: 'Cam' },
  ]

  it('puts lowest total first for the next game', () => {
    const next = nextGamePlayerOrder(
      players,
      [{ a: 10, b: 3, c: 8 }],
      ['a', 'b', 'c'],
    )
    expect(next.map((p) => p.id)).toEqual(['b', 'c', 'a'])
  })

  it('uses totals across rounds and breaks ties by prior order', () => {
    const next = nextGamePlayerOrder(
      players,
      [
        { a: 5, b: 4, c: 9 },
        { a: 0, b: 1, c: 2 },
      ],
      ['a', 'b', 'c'],
    )
    // totals: a=5, b=5, c=11 — tie broken by prior order → a
    expect(next.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('rollFromDice', () => {
  it('sums faces only when all dice are set', () => {
    expect(rollFromDice([3], 2)).toBeNull()
    expect(rollFromDice([3, 4], 2)).toBe(7)
    expect(rollFromDice([5], 1)).toBe(5)
  })
})

describe('diceCount', () => {
  it('uses one die when rule applies and open sum is at most 6', () => {
    const board = [true, true, false, false, false, false] // open 1+2=3
    expect(diceCount(board, true)).toBe(1)
    expect(diceCount(board, false)).toBe(2)
  })
})

describe('reassignRoundScore', () => {
  it('moves a score onto a pending player and clears the source', () => {
    expect(
      reassignRoundScore({ a: 15, b: null, c: 4 }, 'a', 'b'),
    ).toEqual({ a: null, b: 15, c: 4 })
  })

  it('swaps two recorded scores', () => {
    expect(
      reassignRoundScore({ a: 15, b: 3, c: 4 }, 'a', 'b'),
    ).toEqual({ a: 3, b: 15, c: 4 })
  })

  it('rejects missing scores or same player', () => {
    expect(reassignRoundScore({ a: null, b: 3 }, 'a', 'b')).toBeNull()
    expect(reassignRoundScore({ a: 15, b: 3 }, 'a', 'a')).toBeNull()
  })
})
