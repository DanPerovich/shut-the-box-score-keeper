/** Classic die face (1–6) drawn with pips. */
export function DieFace({ value, size = 44 }: { value: number; size?: number }) {
  const pips = PIP_LAYOUT[value] ?? []
  return (
    <svg
      className="die-face"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="12"
        className="die-face-body"
      />
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5.5" className="die-face-pip" />
      ))}
    </svg>
  )
}

/** Pip centers on a 3×3 grid inside the face. */
const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[32, 32]],
  2: [
    [18, 18],
    [46, 46],
  ],
  3: [
    [18, 18],
    [32, 32],
    [46, 46],
  ],
  4: [
    [18, 18],
    [46, 18],
    [18, 46],
    [46, 46],
  ],
  5: [
    [18, 18],
    [46, 18],
    [32, 32],
    [18, 46],
    [46, 46],
  ],
  6: [
    [18, 16],
    [46, 16],
    [18, 32],
    [46, 32],
    [18, 48],
    [46, 48],
  ],
}
