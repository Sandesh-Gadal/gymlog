import { useEffect, useState } from 'react'
import { formatClock } from '../lib/format'

/** Countdown bar above the bottom nav. Times from a fixed end timestamp, so it stays right if the app is backgrounded. */
export function RestTimer({ endsAt, onAdjust, onClose }: { endsAt: number; onAdjust: (deltaSec: number) => void; onClose: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  const left = Math.ceil((endsAt - now) / 1000)
  const over = left <= 0

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!over) return
    navigator.vibrate?.([200, 100, 200])
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [over, onClose])

  return (
    <div role="timer" aria-label="Rest timer" className="fixed inset-x-0 bottom-20 z-10 mx-auto max-w-xl px-4 pb-[env(safe-area-inset-bottom)]">
      <div className={`flex items-center gap-2 rounded-2xl border p-2 pl-4 shadow-lg ${over ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface'}`}>
        <span className="flex-1 text-sm">
          {over ? (
            <b>Rest over. Next set!</b>
          ) : (
            <>
              <span className="text-muted">Rest </span>
              <b className="text-lg tabular-nums">{formatClock(left)}</b>
            </>
          )}
        </span>
        {!over && (
          <>
            <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => onAdjust(-15)}>
              −15
            </button>
            <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => onAdjust(15)}>
              +15
            </button>
          </>
        )}
        <button type="button" className={`min-h-9 px-3 text-sm font-semibold ${over ? '' : 'text-muted'}`} onClick={onClose}>
          {over ? 'OK' : 'Skip'}
        </button>
      </div>
    </div>
  )
}
