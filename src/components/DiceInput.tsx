import { useEffect, useState } from 'react'
import { diceCount, openTiles, rollFromDice, selectionIsValid } from '../game/rules'
import { DieFace } from './DieFace'

interface DiceInputProps {
  dice: number[]
  oneDieWhenSumLeq6: boolean
  board: boolean[]
  selectedTiles: number[]
  onSetDie: (index: number, face: number) => void
  onClearDice: () => void
  onConfirm: () => void
  onClearSelection: () => void
}

export function DiceInput({
  dice,
  oneDieWhenSumLeq6,
  board,
  selectedTiles,
  onSetDie,
  onClearDice,
  onConfirm,
  onClearSelection,
}: DiceInputProps) {
  const required = diceCount(board, oneDieWhenSumLeq6)
  const roll = rollFromDice(dice, required)
  const open = openTiles(board)
  const canConfirm =
    roll !== null && selectionIsValid(open, selectedTiles, roll)

  const nextEmpty = Math.min(dice.length, required - 1)
  const [activeSlot, setActiveSlot] = useState(nextEmpty)

  useEffect(() => {
    setActiveSlot((prev) => Math.min(prev, required - 1))
  }, [required])

  useEffect(() => {
    if (dice.length < required) setActiveSlot(dice.length)
  }, [dice.length, required])

  const slot = Math.min(Math.max(activeSlot, 0), required - 1)

  return (
    <div className="panel stack">
      <div className="row spread">
        <strong>Dice rolled</strong>
        <span className="hint">
          Tap each die face · {required} die{required === 2 ? 's' : ''}
        </span>
      </div>

      <div className="die-slots" role="group" aria-label="Entered dice">
        {Array.from({ length: required }, (_, i) => {
          const face = dice[i]
          const filled = typeof face === 'number'
          return (
            <button
              key={i}
              type="button"
              className={`die-slot${slot === i ? ' active' : ''}${filled ? ' filled' : ''}`}
              onClick={() => {
                if (i <= dice.length) setActiveSlot(i)
              }}
              aria-label={
                filled
                  ? `Die ${i + 1}: ${face}. Tap to change.`
                  : `Die ${i + 1}: not set. Tap to select.`
              }
              aria-pressed={slot === i}
            >
              {filled ? (
                <DieFace value={face} size={56} />
              ) : (
                <span className="die-slot-empty">Die {i + 1}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="dice-faces" role="group" aria-label="Die faces">
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <button
            key={face}
            type="button"
            className={`die-face-btn${dice[slot] === face ? ' active' : ''}`}
            onClick={() => {
              if (slot > dice.length) return
              onSetDie(slot, face)
            }}
            aria-label={`Die face ${face}`}
          >
            <DieFace value={face} size={48} />
          </button>
        ))}
      </div>

      <p className="hint">
        {roll === null
          ? `Select the face for die ${slot + 1}.`
          : `Total ${roll}. Select tiles that sum to ${roll}${
              selectedTiles.length
                ? ` · ${selectedTiles.join(' + ')}`
                : ''
            }`}
      </p>

      <div className="actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            onClearDice()
            setActiveSlot(0)
          }}
          disabled={dice.length === 0}
        >
          Clear dice
        </button>
        <button type="button" className="secondary" onClick={onClearSelection}>
          Clear tiles
        </button>
        <button type="button" onClick={onConfirm} disabled={!canConfirm}>
          Shut selected
        </button>
      </div>
    </div>
  )
}
