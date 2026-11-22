import { useState } from 'react'
import { ExercisePicker } from '../components/ExercisePicker'
import { SectionHeader } from '../components/ui'
import { newId } from '../lib/format'
import { emptyPlan, pplTemplate, removeSession, WEEKDAYS } from '../lib/plan'
import type { Plan, PlanItem } from '../lib/types'
import { useData } from '../state/DataContext'

export function PlanPage() {
  const { plan, repo, ready } = useData()
  if (!ready) return <p className="text-muted">Loading…</p>
  if (!plan) {
    return (
      <div>
        <h1 className="page-title mb-4">Weekly plan</h1>
        <section className="card space-y-3">
          <p className="text-sm text-muted">
            Plan which session you do on each day. Logging a workout then fills in the exercises, set counts and rep targets for you.
          </p>
          <button type="button" className="btn-primary w-full" onClick={() => repo.savePlan(pplTemplate())}>
            Use Push / Pull / Legs template
          </button>
          <p className="text-xs text-muted">Push Sun &amp; Wed, Pull Mon &amp; Thu, Legs Tue &amp; Fri, rest Saturday, shoulder mobility every day. Editable afterwards.</p>
          <button type="button" className="btn-ghost w-full" onClick={() => repo.savePlan(emptyPlan())}>
            Start from scratch
          </button>
        </section>
      </div>
    )
  }
  return <PlanEditor key={plan.updatedAt} initial={plan} />
}

/** Where a picked exercise goes: the daily list or a session id. */
type PickTarget = 'daily' | string

function PlanEditor({ initial }: { initial: Plan }) {
  const { repo, exercises } = useData()
  const [plan, setPlan] = useState<Plan>(initial)
  const [picking, setPicking] = useState<PickTarget | null>(null)
  const [saved, setSaved] = useState(false)
  const dirty = JSON.stringify(plan) !== JSON.stringify(initial)

  const update = (fn: (p: Plan) => Plan | void) => {
    setSaved(false)
    setPlan((p) => {
      const copy = structuredClone(p)
      return fn(copy) ?? copy
    })
  }
  const itemsOf = (p: Plan, target: PickTarget) => (target === 'daily' ? p.daily : p.sessions.find((s) => s.id === target)!.items)

  const pick = (exerciseId: string) => {
    const target = picking!
    setPicking(null)
    update((p) => void itemsOf(p, target).push({ exerciseId, sets: 3, repsMin: 8, repsMax: 12 }))
  }

  const save = async () => {
    const fix = (items: PlanItem[]) =>
      items.forEach((i) => {
        i.sets = Math.max(1, Math.round(i.sets) || 1)
        i.repsMin = Math.max(1, Math.round(i.repsMin) || 1)
        i.repsMax = Math.max(i.repsMin, Math.round(i.repsMax) || 0)
      })
    const clean = structuredClone(plan)
    fix(clean.daily)
    clean.sessions.forEach((s) => {
      s.title = s.title.trim() || 'Session'
      s.notes = s.notes?.trim() || undefined
      fix(s.items)
    })
    clean.updatedAt = Date.now()
    await repo.savePlan(clean)
    setSaved(true)
  }

  const applyTemplate = () => {
    if (confirm('Replace your whole plan with the Push / Pull / Legs template?')) update(() => pplTemplate())
  }

  return (
    <div>
      <h1 className="page-title mb-4">Weekly plan</h1>

      <section className="card" aria-label="Week">
        <span className="label">Week</span>
        <ul className="space-y-1.5">
          {WEEKDAYS.map((day, i) => (
            <li key={day} className="flex items-center justify-between gap-3">
              <span className="text-sm">{day}</span>
              <select
                aria-label={`${day} session`}
                className="input w-40"
                value={plan.week[i] ?? ''}
                onChange={(e) => update((p) => void (p.week[i] = e.target.value || null))}
              >
                <option value="">Rest</option>
                {plan.sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || 'Untitled'}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>

      <SectionHeader title="Every day" />
      <section className="card" aria-label="Every day">
        <p className="mb-2 text-xs text-muted">Done daily, rest days included. Added to the start of each workout.</p>
        <ItemList items={plan.daily} onChange={(fn) => update((p) => fn(p.daily))} onAdd={() => setPicking('daily')} />
      </section>

      <SectionHeader title="Sessions" />
      <div className="space-y-3">
        {plan.sessions.map((s, si) => (
          <section key={s.id} className="card" aria-label={`Session ${s.title}`}>
            <div className="mb-2 flex gap-2">
              <input
                className="input font-semibold"
                aria-label="Session name"
                placeholder="Session name, e.g. Push"
                value={s.title}
                onChange={(e) => update((p) => void (p.sessions[si].title = e.target.value))}
              />
              <button
                type="button"
                className="btn-danger"
                onClick={() => confirm(`Delete “${s.title}”? Days using it become rest days.`) && update((p) => removeSession(p, s.id))}
              >
                Delete
              </button>
            </div>
            <input
              className="input mb-3 text-sm"
              aria-label="Session notes"
              placeholder="Notes: rest time, focus… (optional)"
              value={s.notes ?? ''}
              onChange={(e) => update((p) => void (p.sessions[si].notes = e.target.value))}
            />
            <ItemList items={s.items} onChange={(fn) => update((p) => fn(p.sessions[si].items))} onAdd={() => setPicking(s.id)} />
          </section>
        ))}
      </div>
      <button
        type="button"
        className="btn-ghost mt-3 w-full border-dashed"
        onClick={() => update((p) => void p.sessions.push({ id: newId(), title: '', items: [] }))}
      >
        + Add session
      </button>

      <button type="button" className="mt-6 w-full text-center text-xs text-muted underline" onClick={applyTemplate}>
        Replace with Push / Pull / Legs template
      </button>

      <div className="sticky bottom-24 mt-4 flex gap-2">
        <button type="button" className="btn-ghost" disabled={!dirty} onClick={() => update(() => structuredClone(initial))}>
          Undo changes
        </button>
        <button type="button" className="btn-primary flex-1" disabled={!dirty} onClick={save}>
          {saved && !dirty ? 'Saved' : 'Save plan'}
        </button>
      </div>

      {picking && <ExercisePicker exercises={exercises} onPick={pick} onClose={() => setPicking(null)} />}
    </div>
  )
}

function ItemList({
  items,
  onChange,
  onAdd,
}: {
  items: PlanItem[]
  onChange: (fn: (items: PlanItem[]) => void) => void
  onAdd: () => void
}) {
  const { exerciseName } = useData()
  const num = (v: string) => Number(v.replace(',', '.'))
  const field = (i: number, key: 'sets' | 'repsMin' | 'repsMax', label: string) => (
    <label className="flex flex-col text-[10px] text-muted">
      {label}
      <input
        className="input mt-0.5 px-2 text-center"
        inputMode="numeric"
        aria-label={`${exerciseName(items[i].exerciseId)} ${label}`}
        value={Number.isFinite(items[i][key]) && items[i][key] ? String(items[i][key]) : ''}
        onChange={(e) => onChange((list) => void (list[i][key] = num(e.target.value)))}
      />
    </label>
  )
  const move = (i: number, d: -1 | 1) => onChange((list) => void list.splice(i + d, 0, ...list.splice(i, 1)))

  return (
    <div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={`${item.exerciseId}-${i}`} className="border-b border-line pb-3 last:border-0 last:pb-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{exerciseName(item.exerciseId)}</span>
              <span className="flex shrink-0 gap-3 text-muted">
                <button type="button" aria-label="Move up" disabled={i === 0} className="disabled:opacity-30" onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" aria-label="Move down" disabled={i === items.length - 1} className="disabled:opacity-30" onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button type="button" aria-label={`Remove ${exerciseName(item.exerciseId)}`} className="text-danger" onClick={() => onChange((list) => void list.splice(i, 1))}>
                  ×
                </button>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {field(i, 'sets', 'Sets')}
              {field(i, 'repsMin', 'Reps min')}
              {field(i, 'repsMax', 'Reps max')}
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-ghost mt-3 w-full border-dashed" onClick={onAdd}>
        + Add exercise
      </button>
    </div>
  )
}
