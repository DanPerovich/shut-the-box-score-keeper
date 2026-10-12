/**
 * Celebration motion via requestAnimationFrame + direct style writes.
 * iOS Chrome (WKWebView) routinely skips CSS animations and stalls WAAPI
 * composited timelines; mutating opacity/transform each frame always works.
 */

export type Pose = {
  opacity?: number
  x?: number
  y?: number
  scale?: number
  rotate?: number
  /** Used for rings that are centered with translate(-50%, -50%) */
  centered?: boolean
  backgroundPosition?: string
}

export type TweenOpts = {
  duration: number
  delay?: number
  /** 0–1 progress easing; default ease-out */
  ease?: (t: number) => number
  from: Pose
  to: Pose
  /** Optional mid keyframes as { at: 0–1, pose } */
  through?: Array<{ at: number; pose: Pose }>
  iterations?: number
  onDone?: () => void
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function poseAt(from: Pose, to: Pose, t: number, through?: TweenOpts['through']): Pose {
  if (!through?.length) {
    return mixPose(from, to, t)
  }
  const keys = [{ at: 0, pose: from }, ...through, { at: 1, pose: to }]
  let i = 0
  while (i < keys.length - 1 && t > keys[i + 1]!.at) i += 1
  const a = keys[i]!
  const b = keys[i + 1]!
  const local = b.at === a.at ? 1 : (t - a.at) / (b.at - a.at)
  return mixPose(a.pose, b.pose, local)
}

function mixPose(a: Pose, b: Pose, t: number): Pose {
  const out: Pose = { centered: b.centered ?? a.centered }
  if (a.opacity != null || b.opacity != null) {
    out.opacity = lerp(a.opacity ?? 1, b.opacity ?? 1, t)
  }
  if (a.x != null || b.x != null) out.x = lerp(a.x ?? 0, b.x ?? 0, t)
  if (a.y != null || b.y != null) out.y = lerp(a.y ?? 0, b.y ?? 0, t)
  if (a.scale != null || b.scale != null) {
    out.scale = lerp(a.scale ?? 1, b.scale ?? 1, t)
  }
  if (a.rotate != null || b.rotate != null) {
    out.rotate = lerp(a.rotate ?? 0, b.rotate ?? 0, t)
  }
  if (b.backgroundPosition != null) {
    // Snap / simple lerp of percentage if both are `% 50%`
    const parse = (s: string | undefined, fallback: number) => {
      if (!s) return fallback
      const m = /^([\d.]+)%/.exec(s)
      return m ? Number(m[1]) : fallback
    }
    const x = lerp(parse(a.backgroundPosition, 0), parse(b.backgroundPosition, 100), t)
    out.backgroundPosition = `${x}% 50%`
  }
  return out
}

function applyPose(el: HTMLElement, pose: Pose): void {
  if (pose.opacity != null) el.style.opacity = String(pose.opacity)
  if (pose.backgroundPosition != null) {
    el.style.backgroundPosition = pose.backgroundPosition
  }
  const x = pose.x ?? 0
  const y = pose.y ?? 0
  const scale = pose.scale ?? 1
  const rotate = pose.rotate ?? 0
  const needsTransform =
    pose.x != null ||
    pose.y != null ||
    pose.scale != null ||
    pose.rotate != null ||
    pose.centered
  if (needsTransform) {
    const origin = pose.centered ? 'translate3d(-50%, -50%, 0) ' : ''
    el.style.transform = `${origin}translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`
  }
}

export type Running = { cancel: () => void }

/**
 * Animate an element by writing styles each frame.
 * Returns a cancel handle. No-ops when reduced motion is on (applies `to` immediately).
 */
export function tween(el: Element | null | undefined, opts: TweenOpts): Running {
  if (!(el instanceof HTMLElement)) return { cancel() {} }

  const delay = opts.delay ?? 0
  const ease = opts.ease ?? easeOutCubic
  const iterations = opts.iterations ?? 1
  let raf = 0
  let cancelled = false
  let start = 0
  let iteration = 0

  const finish = () => {
    applyPose(el, opts.to)
    opts.onDone?.()
  }

  if (prefersReducedMotion()) {
    finish()
    return { cancel() {} }
  }

  applyPose(el, opts.from)

  const frame = (now: number) => {
    if (cancelled) return
    if (!start) start = now + delay
    const elapsed = now - start
    if (elapsed < 0) {
      raf = requestAnimationFrame(frame)
      return
    }
    const raw = Math.min(1, elapsed / opts.duration)
    const t = ease(raw)
    applyPose(el, poseAt(opts.from, opts.to, t, opts.through))
    if (raw < 1) {
      raf = requestAnimationFrame(frame)
      return
    }
    iteration += 1
    if (iterations === Infinity || iteration < iterations) {
      start = now
      raf = requestAnimationFrame(frame)
      return
    }
    finish()
  }

  raf = requestAnimationFrame(frame)

  return {
    cancel() {
      cancelled = true
      cancelAnimationFrame(raf)
    },
  }
}

export function tweenMany(runners: Running[]): Running {
  return {
    cancel() {
      for (const r of runners) r.cancel()
    },
  }
}
