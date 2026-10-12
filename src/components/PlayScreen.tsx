import { useGame } from '../game/GameContext'
import { Board } from './Board'
import { DiceInput } from './DiceInput'
import { HoldButton } from './HoldButton'
import { Scoreboard } from './Scoreboard'

export function PlayScreen() {
  const {
    state,
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
    reassignScore,
    currentScore,
    newGame,
  } = useGame()

  const { turn, players, settings } = state
  if (!turn) return null

  const currentId = turn.queue[0]
  const current = players.find((p) => p.id === currentId)
  const canSkip = turn.queue.length > 1
  const canUndo = turn.shutHistory.length > 0

  return (
    <div className="app-shell">
      <div className="turn-banner" key={currentId}>
        <div className="who">{current?.name ?? 'Player'}&apos;s turn</div>
        <div className="meta">
          Round {turn.roundIndex + 1} of {settings.rounds}
          {turn.queue.length > 1
            ? ` · ${turn.queue.length} left this round`
            : ' · last this round'}
        </div>
        <div className="score-pill">
          <span>Score</span>
          <strong>{currentScore}</strong>
        </div>
      </div>

      <Board
        maxTile={settings.maxTile}
        board={turn.board}
        selectedTiles={turn.selectedTiles}
        validateDice={settings.validateDice}
        onTap={tapTile}
      />

      {settings.validateDice && (
        <DiceInput
          dice={turn.dice}
          oneDieWhenSumLeq6={settings.oneDieWhenSumLeq6}
          board={turn.board}
          selectedTiles={turn.selectedTiles}
          onSetDie={setDie}
          onClearDice={clearDice}
          onConfirm={confirmSelection}
          onClearSelection={clearSelection}
        />
      )}

      <Scoreboard
        state={state}
        currentPlayerId={currentId}
        onEditScore={editScore}
        onReassignScore={reassignScore}
        onRemovePlayer={removePlayer}
      />

      <div className="actions">
        <HoldButton
          className="secondary primary-wide"
          onConfirm={endTurn}
          title="Hold to confirm"
          aria-label={`Hold to end turn and record ${currentScore}`}
        >
          End turn · {currentScore}
        </HoldButton>
      </div>

      <div className="actions actions-centered">
        <button type="button" className="secondary" onClick={undoShut} disabled={!canUndo}>
          Undo
        </button>
        <button
          type="button"
          className="secondary"
          onClick={resetTurnBoard}
          title="Reset board"
          aria-label="Reset board"
        >
          Reset
        </button>
        <button
          type="button"
          className="secondary"
          onClick={skipTurn}
          disabled={!canSkip}
          title="Skip — come back later"
          aria-label="Skip turn and come back later"
        >
          Skip
        </button>
      </div>

      <button
        type="button"
        className="ghost"
        onClick={() => {
          if (window.confirm('Abandon this game and return to setup?')) newGame()
        }}
      >
        Abandon game
      </button>
    </div>
  )
}
