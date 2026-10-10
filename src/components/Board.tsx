interface BoardProps {
  maxTile: number
  board: boolean[]
  selectedTiles: number[]
  validateDice: boolean
  onTap: (tile: number) => void
}

export function Board({
  maxTile,
  board,
  selectedTiles,
  validateDice,
  onTap,
}: BoardProps) {
  return (
    <div className="board-wrap" aria-label="Shut the Box board">
      <div className="board" data-tiles={maxTile}>
        {Array.from({ length: maxTile }, (_, i) => {
          const tile = i + 1
          const open = board[i]
          const selected = selectedTiles.includes(tile)
          return (
            <button
              key={tile}
              type="button"
              className={`tile ${open ? 'open' : 'shut'}${selected ? ' selected' : ''}`}
              onClick={() => onTap(tile)}
              disabled={validateDice ? !open : false}
              aria-pressed={!open}
              aria-label={`Tile ${tile}${open ? ' open' : ' shut'}`}
            >
              {tile}
            </button>
          )
        })}
      </div>
    </div>
  )
}
