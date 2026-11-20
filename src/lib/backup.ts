import type { Backup, Exercise, Profile, WeightEntry, Workout } from './types'

export function createBackup(data: {
  profile: Profile | null
  workouts: Workout[]
  exercises: Exercise[]
  weights: WeightEntry[]
}, now: Date = new Date()): Backup {
  return { app: 'gymlog', version: 1, exportedAt: now.toISOString(), ...data }
}

export class BackupError extends Error {}

/** Validate an untrusted parsed JSON value. Throws BackupError with a human message. */
export function parseBackup(raw: unknown): Backup {
  if (!isObj(raw) || raw.app !== 'gymlog') throw new BackupError('Not a GYMLOG backup file.')
  if (raw.version !== 1) throw new BackupError(`Unsupported backup version: ${String(raw.version)}`)
  const arrays = ['workouts', 'exercises', 'weights'] as const
  for (const k of arrays) if (!Array.isArray(raw[k])) throw new BackupError(`Backup is missing "${k}".`)

  const workouts = (raw.workouts as unknown[]).map((w, i) => {
    if (!isObj(w) || typeof w.id !== 'string' || !isISODate(w.date) || !Array.isArray(w.entries)) {
      throw new BackupError(`Workout #${i + 1} is malformed.`)
    }
    for (const e of w.entries as unknown[]) {
      if (!isObj(e) || typeof e.exerciseId !== 'string' || !Array.isArray(e.sets)) throw new BackupError(`Workout #${i + 1} has a malformed exercise.`)
      for (const s of e.sets as unknown[]) {
        if (!isObj(s) || !isNum(s.weight) || !isNum(s.reps)) throw new BackupError(`Workout #${i + 1} has a malformed set.`)
      }
    }
    return w as unknown as Workout
  })
  const exercises = (raw.exercises as unknown[]).map((e, i) => {
    if (!isObj(e) || typeof e.id !== 'string' || typeof e.name !== 'string') throw new BackupError(`Exercise #${i + 1} is malformed.`)
    return e as unknown as Exercise
  })
  const weights = (raw.weights as unknown[]).map((w, i) => {
    if (!isObj(w) || typeof w.id !== 'string' || !isISODate(w.date) || !isNum(w.kg)) throw new BackupError(`Weight entry #${i + 1} is malformed.`)
    return w as unknown as WeightEntry
  })
  const profile = raw.profile == null ? null : (raw.profile as Profile)
  return { app: 'gymlog', version: 1, exportedAt: String(raw.exportedAt ?? ''), profile, workouts, exercises, weights }
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}
function isISODate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
}
