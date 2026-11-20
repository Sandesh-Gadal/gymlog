import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { MUSCLE_GROUPS } from '../lib/exercises'
import { fmtKg, newId, slugify } from '../lib/format'
import type { MuscleGroup } from '../lib/types'
import { useData } from '../state/DataContext'

export function Exercises() {
  const { exercises, records, repo } = useData()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [group, setGroup] = useState<MuscleGroup>('chest')
  const [error, setError] = useState('')

  const s = q.trim().toLowerCase()
  const filtered = s ? exercises.filter((e) => e.name.toLowerCase().includes(s) || e.muscleGroup.includes(s)) : exercises

  const add = async (ev: FormEvent) => {
    ev.preventDefault()
    const n = name.trim()
    if (!n) return
    if (exercises.some((e) => e.name.toLowerCase() === n.toLowerCase())) {
      setError('An exercise with that name already exists.')
      return
    }
    await repo.put('exercises', {
      id: `custom-${slugify(n) || 'exercise'}-${newId().slice(0, 6)}`,
      name: n,
      muscleGroup: group,
      custom: true,
      createdAt: Date.now(),
    })
    setName('')
    setError('')
    setAdding(false)
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="page-title">Exercises</h1>
        <button type="button" className="btn-ghost" onClick={() => setAdding((a) => !a)}>
          {adding ? 'Close' : '+ Custom'}
        </button>
      </header>

      {adding && (
        <form onSubmit={add} className="card mb-4 space-y-2">
          <label className="block">
            <span className="label">Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Machine Chest Press" />
          </label>
          <label className="block">
            <span className="label">Muscle group</span>
            <select className="input capitalize" value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup)}>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn-primary w-full" disabled={!name.trim()}>
            Add exercise
          </button>
        </form>
      )}

      <input className="input mb-3" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {filtered.map((e) => {
          const r = records.get(e.id)
          return (
            <li key={e.id}>
              <Link to={`/exercises/${e.id}`} className="flex items-center justify-between px-4 py-3">
                <span>
                  {e.name}
                  {e.custom && <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">custom</span>}
                  <span className="block text-xs text-muted capitalize">{e.muscleGroup}</span>
                </span>
                {r && <span className="text-xs text-muted">Best {fmtKg(r.maxWeight)} kg</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
