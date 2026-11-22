import type { Backup, Exercise, Plan, Profile, WeightEntry, Workout } from './types'

export function createBackup(data: {
  profile: Profile | null
  plan?: Plan | null
  workouts: Workout[]
  exercises: Exercise[]
  weights: WeightEntry[]
}, now: Date = new Date()): Backup {
  return { app: 'gymlog', version: 1, exportedAt: now.toISOString(), ...data, plan: data.plan ?? null }
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
  const plan = raw.plan == null ? null : parsePlan(raw.plan)
  return { app: 'gymlog', version: 1, exportedAt: String(raw.exportedAt ?? ''), profile, plan, workouts, exercises, weights }
}

/** Plan is optional (added in v0.2 without a version bump), but must be well-formed when present. */
function parsePlan(p: unknown): Plan {
  const bad = (what: string) => new BackupError(`Weekly plan has a malformed ${what}.`)
  if (!isObj(p) || !Array.isArray(p.sessions) || !Array.isArray(p.week) || !Array.isArray(p.daily)) throw bad('structure')
  if (p.week.length !== 7 || !p.week.every((d) => d === null || typeof d === 'string')) throw bad('week')
  const checkItems = (items: unknown) => {
    if (!Array.isArray(items)) throw bad('exercise list')
    for (const i of items) {
      if (!isObj(i) || typeof i.exerciseId !== 'string' || !isNum(i.sets) || !isNum(i.repsMin) || !isNum(i.repsMax)) throw bad('exercise')
    }
  }
  for (const s of p.sessions as unknown[]) {
    if (!isObj(s) || typeof s.id !== 'string' || typeof s.title !== 'string') throw bad('session')
    checkItems(s.items)
  }
  checkItems(p.daily)
  return p as unknown as Plan
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
