import { useState, type FormEvent } from 'react'
import { Empty, SectionHeader, Sparkline, Stat } from '../components/ui'
import { bmi } from '../lib/profile'
import { fmtKg, formatDate, todayISO } from '../lib/format'
import { useData } from '../state/DataContext'

export function Weight() {
  const { weights, profile, repo } = useData()
  const [date, setDate] = useState(todayISO())
  const [kg, setKg] = useState('')

  const latest = weights[0]
  const existing = weights.find((w) => w.date === date)
  const last30 = [...weights].reverse().slice(-30).map((w) => w.kg)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const value = Number(kg.replace(',', '.'))
    if (!(value > 20 && value < 400)) return
    // One entry per day: the date is the id, so re-logging a day overwrites it.
    await repo.put('weights', { id: date, date, kg: Math.round(value * 10) / 10, createdAt: Date.now() })
    setKg('')
  }

  return (
    <div>
      <h1 className="page-title mb-4">Body weight</h1>

      <form onSubmit={save} className="card flex items-end gap-2">
        <label className="flex-1">
          <span className="label">Weight (kg)</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder={latest ? fmtKg(latest.kg) : String(profile.startWeightKg)}
            value={kg}
            onChange={(e) => setKg(e.target.value)}
          />
        </label>
        <label>
          <span className="label">Date</span>
          <input type="date" className="input w-auto" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
        </label>
        <button className="btn-primary" disabled={!kg}>
          {existing ? 'Update' : 'Save'}
        </button>
      </form>

      {latest && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Current" value={fmtKg(latest.kg)} hint="kg" />
          <Stat label="Change" value={`${latest.kg - profile.startWeightKg > 0 ? '+' : ''}${fmtKg(latest.kg - profile.startWeightKg)}`} hint={`from ${fmtKg(profile.startWeightKg)} kg`} />
          <Stat label="BMI" value={bmi(latest.kg, profile.heightCm) || '—'} hint={`${profile.heightCm} cm`} />
        </div>
      )}

      {last30.length > 1 && (
        <div className="card mt-3">
          <div className="label">Last {last30.length} entries</div>
          <Sparkline values={last30} />
        </div>
      )}

      <SectionHeader title="Entries" />
      {weights.length === 0 ? (
        <Empty>Log your weight regularly (same time of day) for a reliable trend.</Empty>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {weights.map((w, i) => {
            const prev = weights[i + 1]
            const d = prev ? w.kg - prev.kg : 0
            return (
              <li key={w.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{formatDate(w.date)}</span>
                <span className="flex items-center gap-3">
                  {prev && <span className={`text-xs ${d <= 0 ? 'text-accent' : 'text-muted'}`}>{d > 0 ? '+' : ''}{fmtKg(d)}</span>}
                  <b>{fmtKg(w.kg)} kg</b>
                  <button type="button" aria-label={`Delete ${w.date}`} className="text-muted" onClick={() => confirm('Delete entry?') && repo.remove('weights', w.id)}>
                    ×
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
