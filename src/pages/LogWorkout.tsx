import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ExercisePicker } from '../components/ExercisePicker'
import { fmtKg, formatDate, newId, todayISO } from '../lib/format'
import { formatTarget, itemsFor, repsHint, sessionFor } from '../lib/plan'
import type { Plan, PlanSession, Workout, WorkoutEntry } from '../lib/types'
import { entriesFromPlan, toWorkoutEntries, type DraftEntry } from '../lib/workoutForm'
import { useData } from '../state/DataContext'

interface Draft {
  date: string
  notes: string
  durationMin: string
  startedAt: number
  entries: DraftEntry[]
  /** plan session this draft was started from (null = daily items only); undefined = not from the plan */
  sessionId?: string | null
}

const DRAFT_KEY = 'gymlog:draft'

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Draft) : null
  } catch {
    return null
  }
}
function saveDraft(d: Draft | null) {
  try {
    if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

function emptyDraft(): Draft {
  return { date: todayISO(), notes: '', durationMin: '', startedAt: Date.now(), entries: [] }
}

function fromWorkout(w: Workout): Draft {
  return {
    date: w.date,
    notes: w.notes ?? '',
    durationMin: w.durationMin ? String(w.durationMin) : '',
    startedAt: w.createdAt,
    entries: w.entries.map((e) => ({
      key: newId(),
      exerciseId: e.exerciseId,
      notes: e.notes ?? '',
      sets: e.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps) })),
    })),
  }
}

export function LogWorkout() {
  const { id } = useParams()
  const { workouts, ready } = useData()
  const editing = id ? workouts.find((w) => w.id === id) : undefined
  if (id && !editing) return <p className="text-muted">{ready ? 'Workout not found.' : 'Loading…'}</p>
  // Keyed so the form re-initialises when switching between new/edit targets.
  return <WorkoutForm key={id ?? 'new'} editing={editing} initial={editing ? fromWorkout(editing) : (loadDraft() ?? emptyDraft())} />
}

function WorkoutForm({ editing, initial }: { editing?: Workout; initial: Draft }) {
  const id = editing?.id
  const navigate = useNavigate()
  const { workouts, exercises, exerciseName, repo, plan } = useData()
  const [draft, setDraft] = useState<Draft>(initial)
  const [picking, setPicking] = useState(false)

  // Persist new-workout drafts so closing the app mid-session loses nothing.
  useEffect(() => {
    if (!id) saveDraft(draft.entries.length || draft.notes ? draft : null)
  }, [id, draft])

  /** Most recent previous sets per exercise, for "last time" hints and prefill. */
  const lastSets = useMemo(() => {
    const m = new Map<string, { date: string; sets: WorkoutEntry['sets'] }>()
    for (const w of workouts) {
      if (w.id === id) continue
      for (const e of w.entries) if (!m.has(e.exerciseId)) m.set(e.exerciseId, { date: w.date, sets: e.sets })
    }
    return m
  }, [workouts, id])

  const update = (fn: (d: Draft) => Draft) => setDraft((d) => fn(structuredClone(d)))

  // Targets come from the session this draft was started from, else whatever is planned for its date.
  const session =
    draft.sessionId === undefined ? sessionFor(plan, draft.date) : (plan?.sessions.find((s) => s.id === draft.sessionId) ?? null)
  const targets = useMemo(() => new Map(itemsFor(plan, session).map((i) => [i.exerciseId, i])), [plan, session])

  const startFromPlan = (s: PlanSession | null) =>
    update((d) => ({
      ...d,
      sessionId: s?.id ?? null,
      startedAt: Date.now(),
      entries: entriesFromPlan(itemsFor(plan, s), (exId) => lastSets.get(exId)?.sets, newId),
    }))

  const addExercise = (exerciseId: string) => {
    setPicking(false)
    const prev = lastSets.get(exerciseId)?.sets[0]
    update((d) => {
      d.entries.push({
        key: newId(),
        exerciseId,
        notes: '',
        sets: [{ weight: prev ? String(prev.weight) : '', reps: prev ? String(prev.reps) : '' }],
      })
      return d
    })
  }

  const entries = toWorkoutEntries(draft.entries)
  const canSave = entries.length > 0

  const save = async () => {
    if (!canSave) return
    const now = Date.now()
    const elapsed = Math.round((now - draft.startedAt) / 60000)
    const duration = Number(draft.durationMin) || (!editing && elapsed > 0 && elapsed < 300 ? elapsed : undefined)
    const workout: Workout = {
      id: editing?.id ?? newId(),
      date: draft.date,
      notes: draft.notes.trim() || undefined,
      durationMin: duration,
      entries,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    }
    await repo.put('workouts', workout)
    if (!id) saveDraft(null)
    navigate(`/workout/${workout.id}${editing ? '' : '?saved=1'}`, { replace: true })
  }

  const discard = () => {
    if (draft.entries.length && !confirm('Discard this workout?')) return
    if (!id) saveDraft(null)
    if (id) navigate(-1)
    else setDraft(emptyDraft())
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="page-title">{editing ? 'Edit workout' : 'Log workout'}</h1>
        <input
          type="date"
          aria-label="Workout date"
          className="input w-auto"
          value={draft.date}
          max={todayISO()}
          onChange={(e) => update((d) => ((d.date = e.target.value || todayISO()), d))}
        />
      </header>

      {!id && draft.entries.length === 0 && (
        <PlanStart plan={plan} date={draft.date} onStart={startFromPlan} />
      )}
      {draft.sessionId !== undefined && session?.notes && draft.entries.length > 0 && (
        <p className="mb-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
          <b className="text-fg">{session.title}</b> · {session.notes}
        </p>
      )}

      <div className="space-y-3">
        {draft.entries.map((entry, ei) => {
          const last = lastSets.get(entry.exerciseId)
          const target = targets.get(entry.exerciseId)
          return (
            <section key={entry.key} className="card" aria-label={exerciseName(entry.exerciseId)}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">
                    {exerciseName(entry.exerciseId)}
                    {target && <span className="ml-2 text-xs font-medium text-accent">{formatTarget(target)}</span>}
                  </h2>
                  {last && (
                    <p className="text-xs text-muted">
                      Last ({formatDate(last.date, { day: 'numeric', month: 'short' })}):{' '}
                      {last.sets.map((s) => `${fmtKg(s.weight)}×${s.reps}`).join(', ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs text-danger"
                  onClick={() => update((d) => (d.entries.splice(ei, 1), d))}
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 text-xs text-muted">
                <span>Set</span>
                <span>Weight (kg)</span>
                <span>Reps</span>
                <span />
              </div>
              {entry.sets.map((s, si) => (
                <div key={si} className="mt-1.5 grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2">
                  <span className="text-center text-sm font-semibold text-muted">{si + 1}</span>
                  <input
                    className="input"
                    inputMode="decimal"
                    aria-label={`Set ${si + 1} weight`}
                    placeholder="0"
                    value={s.weight}
                    onChange={(e) => update((d) => ((d.entries[ei].sets[si].weight = e.target.value.replace(',', '.')), d))}
                  />
                  <input
                    className="input"
                    inputMode="numeric"
                    aria-label={`Set ${si + 1} reps`}
                    placeholder={target ? repsHint(target) : '0'}
                    value={s.reps}
                    onChange={(e) => update((d) => ((d.entries[ei].sets[si].reps = e.target.value), d))}
                  />
                  <button
                    type="button"
                    aria-label={`Delete set ${si + 1}`}
                    className="text-lg text-muted"
                    onClick={() => update((d) => (d.entries[ei].sets.splice(si, 1), d))}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={() =>
                    update((d) => {
                      const sets = d.entries[ei].sets
                      sets.push({ ...(sets[sets.length - 1] ?? { weight: '', reps: '' }) })
                      return d
                    })
                  }
                >
                  + Add set
                </button>
              </div>
              <input
                className="input mt-2 text-sm"
                placeholder="Notes (optional)"
                value={entry.notes}
                onChange={(e) => update((d) => ((d.entries[ei].notes = e.target.value), d))}
              />
            </section>
          )
        })}
      </div>

      <button type="button" className="btn-ghost mt-3 w-full border-dashed" onClick={() => setPicking(true)}>
        + Add exercise
      </button>

      <div className="mt-4 grid grid-cols-[1fr_8rem] gap-2">
        <input
          className="input"
          placeholder="Workout notes (optional)"
          value={draft.notes}
          onChange={(e) => update((d) => ((d.notes = e.target.value), d))}
        />
        <input
          className="input"
          inputMode="numeric"
          aria-label="Duration in minutes"
          placeholder="Min (auto)"
          value={draft.durationMin}
          onChange={(e) => update((d) => ((d.durationMin = e.target.value), d))}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" className="btn-ghost" onClick={discard}>
          {id ? 'Cancel' : 'Discard'}
        </button>
        <button type="button" className="btn-primary flex-1" disabled={!canSave} onClick={save}>
          Save workout
        </button>
      </div>

      {picking && <ExercisePicker exercises={exercises} onPick={addExercise} onClose={() => setPicking(false)} />}
    </div>
  )
}

/** Shown on an empty new workout: start today's planned session (or another one). */
function PlanStart({ plan, date, onStart }: { plan: Plan | null; date: string; onStart: (s: PlanSession | null) => void }) {
  if (!plan) {
    return (
      <Link to="/plan" className="card mb-3 block text-sm text-muted">
        Tip: set up a <span className="text-accent">weekly plan</span> to fill in your exercises automatically.
      </Link>
    )
  }
  const planned = sessionFor(plan, date)
  const items = itemsFor(plan, planned)
  const others = plan.sessions.filter((s) => s.id !== planned?.id && s.items.length)
  return (
    <section className="card mb-3" aria-label="Planned workout">
      <span className="label">{date === todayISO() ? 'Today' : formatDate(date)}</span>
      <h2 className="text-lg font-bold">{planned?.title ?? 'Rest day'}</h2>
      {planned?.notes && <p className="text-xs text-muted">{planned.notes}</p>}
      {items.length > 0 && (
        <>
          <ul className="mt-2 mb-3 space-y-0.5 text-sm text-muted">
            {items.map((i) => (
              <PlanLine key={i.exerciseId} exerciseId={i.exerciseId} target={formatTarget(i)} />
            ))}
          </ul>
          <button type="button" className="btn-primary w-full" onClick={() => onStart(planned)}>
            {planned ? `Start ${planned.title}` : 'Start mobility'}
          </button>
        </>
      )}
      {others.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Or do</span>
          {others.map((s) => (
            <button key={s.id} type="button" className="btn-ghost min-h-9 px-3 text-xs" onClick={() => onStart(s)}>
              {s.title}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function PlanLine({ exerciseId, target }: { exerciseId: string; target: string }) {
  const { exerciseName } = useData()
  return (
    <li className="flex justify-between gap-2">
      <span className="truncate">{exerciseName(exerciseId)}</span>
      <span className="shrink-0">{target}</span>
    </li>
  )
}
