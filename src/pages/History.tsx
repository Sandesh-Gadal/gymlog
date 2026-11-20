import { Link } from 'react-router'
import { Empty } from '../components/ui'
import { fmtKg, formatDate } from '../lib/format'
import { workoutVolume } from '../lib/pr'
import { useData } from '../state/DataContext'

export function History() {
  const { workouts, prEvents, exerciseName } = useData()
  const prCount = new Map<string, number>()
  for (const e of prEvents) prCount.set(e.workoutId, (prCount.get(e.workoutId) ?? 0) + 1)

  // Group by month for scannability.
  const groups = new Map<string, typeof workouts>()
  for (const w of workouts) {
    const k = w.date.slice(0, 7)
    groups.set(k, [...(groups.get(k) ?? []), w])
  }

  return (
    <div>
      <h1 className="page-title mb-4">History</h1>
      {workouts.length === 0 && <Empty>Your logged workouts will show up here.</Empty>}
      {[...groups].map(([month, ws]) => (
        <section key={month} className="mb-5">
          <h2 className="label mb-2">
            {formatDate(`${month}-01`, { month: 'long', year: 'numeric' })} · {ws.length} workouts
          </h2>
          <ul className="space-y-2">
            {ws.map((w) => (
              <li key={w.id}>
                <Link to={`/workout/${w.id}`} className="card block">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{formatDate(w.date)}</span>
                    <span className="text-xs text-muted">
                      {prCount.get(w.id) ? <span className="mr-2 text-pr">★ {prCount.get(w.id)}</span> : null}
                      {fmtKg(workoutVolume(w))} kg
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{w.entries.map((e) => exerciseName(e.exerciseId)).join(' · ')}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
