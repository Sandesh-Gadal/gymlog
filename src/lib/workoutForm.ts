import type { WorkoutEntry } from './types'

/** Form state keeps numbers as strings so inputs can be empty while typing. */
export interface DraftSet {
  weight: string
  reps: string
}

export interface DraftEntry {
  key: string
  exerciseId: string
  sets: DraftSet[]
  notes: string
}

/** Convert form state to stored entries: parse numbers, drop empty sets and exercises. */
export function toWorkoutEntries(entries: DraftEntry[]): WorkoutEntry[] {
  return entries
    .map((e) => ({
      exerciseId: e.exerciseId,
      notes: e.notes.trim() || undefined,
      sets: e.sets
        .map((s) => ({ weight: Math.max(0, Number(s.weight.replace(',', '.')) || 0), reps: Math.round(Number(s.reps) || 0) }))
        .filter((s) => s.reps > 0),
    }))
    .filter((e) => e.sets.length > 0)
}
