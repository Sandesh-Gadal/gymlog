import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { PRBadge } from '../components/ui'
import { estimate1RM, entryVolume, workoutVolume } from '../lib/pr'
import { fmtKg, formatDate } from '../lib/format'
import { useData } from '../state/DataContext'

export function WorkoutView() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { workouts, prEvents, achievements, exerciseName, repo, ready } = useData()
  const workout = workouts.find((w) => w.id === id)

  if (!workout) return <p className="text-muted">{ready ? 'Workout not found.' : 'Loading…'}</p>

  const prs = prEvents.filter((e) => e.workoutId === workout.id)
  const justSaved = params.get('saved') === '1'
  const newBadges = achievements.filter((a) => a.unlocked?.workoutId === workout.id)

  const remove = async () => {
    if (!confirm('Delete this workout? This cannot be undone.')) return
    await repo.remove('workouts', workout.id)
    navigate('/history', { replace: true })
  }

  return (
    <div>
      {justSaved && (
        <div role="status" className="mb-4 rounded-2xl border border-accent bg-surface p-4 text-sm">
          <b>Workout saved.</b> {prs.length ? `You set ${prs.length} new PR${prs.length > 1 ? 's' : ''}! 🎉` : 'Nice work.'}
          {newBadges.length > 0 && (
            <Link to="/achievements" className="mt-3 flex flex-wrap gap-2">
              {newBadges.map((a) => (
                <span key={a.id} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
                  {a.emoji} Badge unlocked: {a.name}
                </span>
              ))}
            </Link>
          )}
        </div>
      )}
      <header className="mb-4">
        <p className="text-xs text-muted">
          {workout.durationMin ? `${workout.durationMin} min · ` : ''}
          {fmtKg(workoutVolume(workout))} kg volume
        </p>
        <h1 className="page-title">{formatDate(workout.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h1>
        {workout.notes && <p className="mt-1 text-sm text-muted">{workout.notes}</p>}
      </header>

      {prs.length > 0 && (
        <div className="mb-4 space-y-2">
          {prs.map((e, i) => (
            <PRBadge key={i} event={e} exerciseName={exerciseName(e.exerciseId)} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {workout.entries.map((e, i) => (
          <section key={i} className="card">
            <div className="mb-2 flex items-baseline justify-between">
              <Link to={`/exercises/${e.exerciseId}`} className="font-semibold hover:text-accent">
                {exerciseName(e.exerciseId)}
              </Link>
              <span className="text-xs text-muted">{fmtKg(entryVolume(e))} kg</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="text-left font-medium">Set</th>
                  <th className="text-right font-medium">Weight</th>
                  <th className="text-right font-medium">Reps</th>
                  <th className="text-right font-medium">e1RM</th>
                </tr>
              </thead>
              <tbody>
                {e.sets.map((s, si) => (
                  <tr key={si} className="border-t border-line">
                    <td className="py-1.5">{si + 1}</td>
                    <td className="text-right">{fmtKg(s.weight)} kg</td>
                    <td className="text-right">{s.reps}</td>
                    <td className="text-right text-muted">{fmtKg(estimate1RM(s.weight, s.reps))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {e.notes && <p className="mt-2 text-xs text-muted">{e.notes}</p>}
          </section>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" className="btn-danger" onClick={remove}>
          Delete
        </button>
        <Link to={`/workout/${workout.id}/edit`} className="btn-ghost flex-1">
          Edit
        </Link>
      </div>
    </div>
  )
}
