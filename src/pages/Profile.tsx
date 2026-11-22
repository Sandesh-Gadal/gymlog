import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import { SectionHeader } from '../components/ui'
import { BackupError, createBackup, downloadJSON, parseBackup } from '../lib/backup'
import { todayISO } from '../lib/format'
import type { Profile as ProfileT } from '../lib/types'
import { useAuth } from '../state/AuthContext'
import { useData } from '../state/DataContext'
import { getThemePref, setThemePref, type ThemePref } from '../state/theme'

const NUM_FIELDS: { key: keyof ProfileT; label: string; step?: string }[] = [
  { key: 'heightCm', label: 'Height (cm)' },
  { key: 'startWeightKg', label: 'Start weight (kg)', step: '0.1' },
  { key: 'waistIn', label: 'Waist (in)', step: '0.5' },
  { key: 'daysPerWeek', label: 'Days / week' },
  { key: 'sessionMinutes', label: 'Session (min)' },
]

export function Profile() {
  const { user, mode, signOut } = useAuth()
  const { profile, plan, repo, workouts, customExercises, weights } = useData()
  const [theme, setTheme] = useState<ThemePref>(getThemePref())
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    downloadJSON(`gymlog-backup-${todayISO()}.json`, createBackup({ profile, plan, workouts, exercises: customExercises, weights }))
  }

  const importData = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const backup = parseBackup(JSON.parse(await file.text()))
      const summary = `${backup.workouts.length} workouts, ${backup.weights.length} weight entries, ${backup.exercises.length} custom exercises`
      if (!confirm(`Replace ALL current data with this backup?\n\n${summary}`)) return
      await repo.replaceAll(backup)
      setMsg(`Imported ${summary}.`)
    } catch (err) {
      setMsg(err instanceof BackupError ? err.message : 'Could not read that file.')
    }
  }

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        {user?.photoURL && <img src={user.photoURL} alt="" className="size-10 rounded-full" referrerPolicy="no-referrer" />}
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="text-xs text-muted">{mode === 'firebase' ? `Signed in as ${user?.displayName} · synced` : 'Local mode · this device only'}</p>
        </div>
      </header>

      <ProfileForm key={profile.updatedAt} />

      <Link to="/achievements" className="card mt-3 flex items-center justify-between">
        <span>Achievements</span>
        <span className="text-muted">›</span>
      </Link>

      <Link to="/plan" className="card mt-3 flex items-center justify-between">
        <span>Weekly plan</span>
        <span className="text-muted">›</span>
      </Link>

      <Link to="/weight" className="card mt-3 flex items-center justify-between">
        <span>Body weight log</span>
        <span className="text-muted">›</span>
      </Link>

      <SectionHeader title="Appearance" />
      <div className="card flex gap-2" role="radiogroup" aria-label="Theme">
        {(['dark', 'light', 'system'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={theme === t}
            className={`btn flex-1 capitalize ${theme === t ? 'bg-accent text-accent-ink' : 'bg-surface-2'}`}
            onClick={() => (setThemePref(t), setTheme(t))}
          >
            {t}
          </button>
        ))}
      </div>

      <SectionHeader title="Backup" />
      <div className="card space-y-2">
        <p className="text-sm text-muted">Download everything as JSON. Keep a copy somewhere safe (e.g. Google Drive) once a month.</p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={exportData}>
            Export JSON
          </button>
          <button type="button" className="btn-ghost flex-1" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </div>

      {mode === 'firebase' && (
        <button type="button" className="btn-danger mt-6 w-full" onClick={signOut}>
          Sign out
        </button>
      )}
      <p className="mt-6 text-center text-xs text-muted">GYMLOG v{__APP_VERSION__}</p>
    </div>
  )
}

/** Keyed by profile.updatedAt so it resets when the profile changes on another device. */
function ProfileForm() {
  const { profile, repo } = useData()
  const [form, setForm] = useState(profile)
  const [saved, setSaved] = useState(false)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    await repo.saveProfile({ ...form, updatedAt: Date.now() })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
        <form onSubmit={save} className="card space-y-3">
          <label className="block">
            <span className="label">Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {NUM_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="label">{f.label}</span>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step={f.step ?? '1'}
                  value={form[f.key] as number}
                  onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="label">Goals</span>
            <textarea className="input min-h-20 py-2" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
          </label>
          <button className="btn-primary w-full">{saved ? 'Saved ✓' : 'Save profile'}</button>
        </form>
  )
}
