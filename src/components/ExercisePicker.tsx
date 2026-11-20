import { useMemo, useState } from 'react'
import type { Exercise } from '../lib/types'

export function ExercisePicker({
  exercises,
  onPick,
  onClose,
}: {
  exercises: Exercise[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? exercises.filter((e) => e.name.toLowerCase().includes(s) || e.muscleGroup.includes(s)) : exercises
  }, [q, exercises])

  return (
    <div role="dialog" aria-modal="true" aria-label="Choose exercise" className="fixed inset-0 z-20 flex flex-col bg-bg">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 border-b border-line p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <input autoFocus className="input" placeholder="Search exercises…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
      <ul className="mx-auto w-full max-w-xl flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {filtered.map((e) => (
          <li key={e.id}>
            <button type="button" className="flex w-full items-center justify-between border-b border-line px-4 py-3 text-left" onClick={() => onPick(e.id)}>
              <span>{e.name}</span>
              <span className="text-xs text-muted capitalize">{e.muscleGroup}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="p-6 text-center text-sm text-muted">No match. Add custom exercises on the Exercises tab.</li>}
      </ul>
    </div>
  )
}
