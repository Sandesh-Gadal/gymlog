import { Link, useNavigate, useParams } from 'react-router'
import { Empty, PRBadge, SectionHeader, Sparkline, Stat } from '../components/ui'
import { estimate1RM, entryVolume, sortChronological } from '../lib/pr'
import { fmtKg, formatDate } from '../lib/format'
import { useData } from '../state/DataContext'

export function ExerciseDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { exercises, workouts, records, prEvents, repo } = useData()
  const exercise = exercises.find((e) => e.id === id)
  if (!exercise) return <p className="text-muted">Exercise not found.</p>

  const rec = records.get(id)
  const sessions = workouts
    .map((w) => ({ w, entries: w.entries.filter((e) => e.exerciseId === id) }))
    .filter((x) => x.entries.length > 0)
  const prs = prEvents.filter((e) => e.exerciseId === id).reverse()

  const trend = sortChronological(sessions.map((s) => s.w)).map((w) =>
    Math.max(0, ...w.entries.filter((e) => e.exerciseId === id).flatMap((e) => e.sets.map((s) => estimate1RM(s.weight, s.reps)))),
  )

  const deleteCustom = async () => {
    if (sessions.length && !confirm(`"${exercise.name}" is used in ${sessions.length} workouts. Those entries will show as "Unknown exercise". Delete anyway?`)) return
    await repo.remove('exercises', id)
    navigate('/exercises', { replace: true })
  }

  return (
    <div>
      <header className="mb-4">
        <p className="text-xs text-muted capitalize">{exercise.muscleGroup}</p>
        <h1 className="page-title">{exercise.name}</h1>
      </header>

      {rec ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Heaviest" value={`${fmtKg(rec.maxWeight)}`} hint="kg" />
            <Stat label="Est. 1RM" value={`${fmtKg(rec.maxE1rm)}`} hint="kg" />
            <Stat label="Volume" value={`${fmtKg(rec.maxVolume)}`} hint="kg, best session" />
          </div>
          {trend.length > 1 && (
            <div className="card mt-3">
              <div className="label">Est. 1RM trend</div>
              <Sparkline values={trend} />
            </div>
          )}
        </>
      ) : (
        <Empty>No sets logged for this exercise yet.</Empty>
      )}

      {prs.length > 0 && (
        <>
          <SectionHeader title="PR timeline" />
          <div className="space-y-2">
            {prs.slice(0, 10).map((e, i) => (
              <div key={i}>
                <p className="mb-1 text-xs text-muted">{formatDate(e.date)}</p>
                <PRBadge event={e} />
              </div>
            ))}
          </div>
        </>
      )}

      {sessions.length > 0 && <SectionHeader title={`History · ${sessions.length} sessions`} />}
      <ul className="space-y-2">
        {sessions.map(({ w, entries }) => (
          <li key={w.id}>
            <Link to={`/workout/${w.id}`} className="card block">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{formatDate(w.date)}</span>
                <span className="text-xs text-muted">{fmtKg(entries.reduce((s, e) => s + entryVolume(e), 0))} kg</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {entries.flatMap((e) => e.sets).map((s) => `${fmtKg(s.weight)}×${s.reps}`).join('  ·  ')}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {exercise.custom && (
        <button type="button" className="btn-danger mt-6 w-full" onClick={deleteCustom}>
          Delete custom exercise
        </button>
      )}
    </div>
  )
}
