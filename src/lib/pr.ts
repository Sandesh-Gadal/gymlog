/**
 * Personal-record engine. Pure functions, no I/O — fully unit tested in pr.test.ts.
 *
 * PR types (see docs/features.md#personal-records):
 *  - weight : heaviest single set ever for the exercise
 *  - e1rm   : best estimated 1-rep max (Epley) across all sets
 *  - volume : most total volume (Σ weight × reps) for the exercise in one workout
 *  - reps   : more reps at a weight you have lifted before than ever done at that weight or
 *             heavier (lighter, never-used weights don't count, so warm-ups don't create noise)
 *
 * The first session of an exercise sets the baseline and is not flagged as a PR.
 */
import type { Workout, WorkoutEntry, WorkoutSet } from './types'

export type PRType = 'weight' | 'e1rm' | 'volume' | 'reps'

export interface PREvent {
  type: PRType
  exerciseId: string
  workoutId: string
  date: string
  /** the new best value (kg for weight/e1rm/volume, reps for reps) */
  value: number
  /** previous best, for "35 → 40 kg" style display */
  previous: number
  /** the set that produced it (not set for volume) */
  set?: WorkoutSet
}

export interface ExerciseRecords {
  maxWeight: number
  maxE1rm: number
  maxVolume: number
  /** weight → most reps ever done at exactly that weight */
  repsAtWeight: Map<number, number>
  sessions: number
}

/** Epley formula. 1 rep returns the weight itself. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return round1(weight * (1 + reps / 30))
}

export function setVolume(s: WorkoutSet): number {
  return Math.max(0, s.weight) * Math.max(0, s.reps)
}

export function entryVolume(e: WorkoutEntry): number {
  return e.sets.reduce((sum, s) => sum + setVolume(s), 0)
}

export function workoutVolume(w: Workout): number {
  return w.entries.reduce((sum, e) => sum + entryVolume(e), 0)
}

/** Only sets with at least one rep count. */
function validSets(e: WorkoutEntry): WorkoutSet[] {
  return e.sets.filter((s) => s.reps > 0 && s.weight >= 0)
}

/** Chronological order: date, then createdAt. */
export function sortChronological<T extends Pick<Workout, 'date' | 'createdAt'>>(ws: T[]): T[] {
  return [...ws].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
}

function emptyRecords(): ExerciseRecords {
  return { maxWeight: 0, maxE1rm: 0, maxVolume: 0, repsAtWeight: new Map(), sessions: 0 }
}

/** Most reps ever done at weight >= w. */
function bestRepsAtOrAbove(rec: ExerciseRecords, w: number): number {
  let best = 0
  for (const [weight, reps] of rec.repsAtWeight) if (weight >= w && reps > best) best = reps
  return best
}

function applyEntry(rec: ExerciseRecords, e: WorkoutEntry): void {
  const sets = validSets(e)
  if (sets.length === 0) return
  for (const s of sets) {
    rec.maxWeight = Math.max(rec.maxWeight, s.weight)
    rec.maxE1rm = Math.max(rec.maxE1rm, estimate1RM(s.weight, s.reps))
    rec.repsAtWeight.set(s.weight, Math.max(rec.repsAtWeight.get(s.weight) ?? 0, s.reps))
  }
  rec.maxVolume = Math.max(rec.maxVolume, entryVolume(e))
  rec.sessions += 1
}

/** PRs set by one entry compared to records built from earlier workouts. */
function detectForEntry(rec: ExerciseRecords, e: WorkoutEntry, w: Workout): PREvent[] {
  const sets = validSets(e)
  if (sets.length === 0 || rec.sessions === 0) return []
  const base = { exerciseId: e.exerciseId, workoutId: w.id, date: w.date }
  const events: PREvent[] = []

  const heaviest = sets.reduce((a, b) => (b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a))
  if (heaviest.weight > 0 && heaviest.weight > rec.maxWeight) {
    events.push({ ...base, type: 'weight', value: heaviest.weight, previous: rec.maxWeight, set: heaviest })
  }

  const bestE1rmSet = sets.reduce((a, b) => (estimate1RM(b.weight, b.reps) > estimate1RM(a.weight, a.reps) ? b : a))
  const e1rm = estimate1RM(bestE1rmSet.weight, bestE1rmSet.reps)
  if (e1rm > 0 && e1rm > rec.maxE1rm) {
    events.push({ ...base, type: 'e1rm', value: e1rm, previous: rec.maxE1rm, set: bestE1rmSet })
  }

  const vol = entryVolume(e)
  if (vol > 0 && vol > rec.maxVolume) {
    events.push({ ...base, type: 'volume', value: vol, previous: rec.maxVolume })
  }

  // Rep PR: only at weights lifted before (new top weights are covered by the weight PR).
  let repPR: PREvent | undefined
  for (const s of sets) {
    if (!rec.repsAtWeight.has(s.weight)) continue
    const prev = bestRepsAtOrAbove(rec, s.weight)
    if (prev > 0 && s.reps > prev) {
      if (!repPR || s.weight > repPR.set!.weight || (s.weight === repPR.set!.weight && s.reps > repPR.value)) {
        repPR = { ...base, type: 'reps', value: s.reps, previous: prev, set: s }
      }
    }
  }
  if (repPR) events.push(repPR)

  return events
}

/**
 * Walk all workouts chronologically and return every PR event plus final records per exercise.
 * Cheap enough to recompute on every change for a personal data set (thousands of workouts).
 */
export function analyzeHistory(workouts: Workout[]): {
  events: PREvent[]
  records: Map<string, ExerciseRecords>
} {
  const records = new Map<string, ExerciseRecords>()
  const events: PREvent[] = []
  for (const w of sortChronological(workouts)) {
    // Merge duplicate entries of the same exercise within a workout before comparing.
    for (const e of mergeEntries(w.entries)) {
      const rec = records.get(e.exerciseId) ?? emptyRecords()
      events.push(...detectForEntry(rec, e, w))
      applyEntry(rec, e)
      records.set(e.exerciseId, rec)
    }
  }
  return { events, records }
}

/** PRs that a specific workout set, evaluated against every workout before it. */
export function prsForWorkout(workout: Workout, allWorkouts: Workout[]): PREvent[] {
  const others = allWorkouts.filter((w) => w.id !== workout.id)
  return analyzeHistory([...others, workout]).events.filter((e) => e.workoutId === workout.id)
}

function mergeEntries(entries: WorkoutEntry[]): WorkoutEntry[] {
  const byId = new Map<string, WorkoutEntry>()
  for (const e of entries) {
    const existing = byId.get(e.exerciseId)
    if (existing) existing.sets = [...existing.sets, ...e.sets]
    else byId.set(e.exerciseId, { ...e, sets: [...e.sets] })
  }
  return [...byId.values()]
}

export const PR_LABELS: Record<PRType, string> = {
  weight: 'Heaviest weight',
  e1rm: 'Best est. 1RM',
  volume: 'Most volume',
  reps: 'Most reps',
}

export function describePR(e: PREvent): string {
  switch (e.type) {
    case 'weight':
      return `${fmt(e.value)} kg × ${e.set?.reps} (prev ${fmt(e.previous)} kg)`
    case 'e1rm':
      return `${fmt(e.value)} kg est. 1RM (prev ${fmt(e.previous)} kg)`
    case 'volume':
      return `${fmt(e.value)} kg total (prev ${fmt(e.previous)} kg)`
    case 'reps':
      return `${e.value} reps @ ${fmt(e.set?.weight ?? 0)} kg (prev ${e.previous})`
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
