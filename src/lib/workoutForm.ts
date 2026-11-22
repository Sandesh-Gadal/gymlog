import type { PlanItem, WorkoutEntry, WorkoutSet } from './types'

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

/**
 * Draft entries for a planned day. One row per planned set; weights come from the last
 * session of that exercise (matched set by set, else its last set). Reps start empty so
 * sets you skip are dropped on save.
 */
export function entriesFromPlan(
  items: PlanItem[],
  lastSets: (exerciseId: string) => WorkoutSet[] | undefined,
  makeKey: () => string,
): DraftEntry[] {
  const seen = new Set<string>()
  return items
    .filter((i) => !seen.has(i.exerciseId) && seen.add(i.exerciseId))
    .map((i) => {
      const last = lastSets(i.exerciseId) ?? []
      return {
        key: makeKey(),
        exerciseId: i.exerciseId,
        notes: '',
        sets: Array.from({ length: Math.max(1, i.sets) }, (_, n) => {
          const prev = last[n] ?? last[last.length - 1]
          return { weight: prev ? String(prev.weight) : '', reps: '' }
        }),
      }
    })
}
