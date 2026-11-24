import { useEffect, useState } from 'react'
import { demoFor, demoImages } from '../lib/demos'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Start/end photos crossfading in a loop, so the movement reads like a slow animation.
 * Tap to pause. With reduced motion it starts paused, and tapping flips between the two.
 */
export function ExerciseDemo({ exerciseId }: { exerciseId: string }) {
  const demo = demoFor(exerciseId)
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(() => !reducedMotion())

  useEffect(() => {
    if (!playing || !demo) return
    const t = setInterval(() => setFrame((f) => 1 - f), 1200)
    return () => clearInterval(t)
  }, [playing, demo])

  if (!demo) return null
  const [start, end] = demoImages(exerciseId, import.meta.env.BASE_URL)

  return (
    <div>
      <button
        type="button"
        className="relative block aspect-[3/2] w-full overflow-hidden rounded-xl bg-surface-2"
        aria-label={playing ? 'Pause demo' : 'Play demo'}
        onClick={() => (reducedMotion() ? setFrame((f) => 1 - f) : setPlaying((p) => !p))}
      >
        {[start, end].map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? 'Start position' : 'End position'}
            loading="lazy"
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${frame === i ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
          {frame === 0 ? 'Start' : 'End'}
          {!playing && ' · paused'}
        </span>
      </button>

      <p className="mt-2 text-xs text-muted">
        <b className="text-fg capitalize">{demo.primary.join(', ')}</b>
        {demo.secondary.length > 0 && <> · also {demo.secondary.join(', ')}</>}
      </p>

      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
        {demo.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <p className="mt-2 text-[10px] text-muted">
        Photos and steps:{' '}
        <a className="underline" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
          free-exercise-db
        </a>{' '}
        (public domain)
      </p>
    </div>
  )
}
