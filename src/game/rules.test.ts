import { describe, expect, it } from 'vitest'
import {
  diceCount,
  nextRoundStarter,
  orderStartingWith,
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
