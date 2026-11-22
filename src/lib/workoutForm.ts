import type { PlanItem, WorkoutEntry, WorkoutSet } from './types'

/** Form state keeps numbers as strings so inputs can be empty while typing. */
export interface DraftSet {
  weight: string
  reps: string
  /** ticked off as completed. Only done sets are saved. */
  done: boolean
}

export interface DraftEntry {
  key: string
  exerciseId: string
  sets: DraftSet[]
  notes: string
}

/** Convert form state to stored entries: parse numbers, keep only done sets with reps, drop empty exercises. */
export function toWorkoutEntries(entries: DraftEntry[]): WorkoutEntry[] {
  return entries
    .map((e) => ({
      exerciseId: e.exerciseId,
      notes: e.notes.trim() || undefined,
      sets: e.sets
        .filter((s) => s.done)
        .map((s) => ({ weight: Math.max(0, Number(s.weight.replace(',', '.')) || 0), reps: Math.round(Number(s.reps) || 0) }))
        .filter((s) => s.reps > 0),
    }))
    .filter((e) => e.sets.length > 0)
}

/**
 * Draft entries for a planned day: a checklist with one row per planned set. Values come
 * from the last session of that exercise (matched set by set, else its last set), or the
 * bottom of the rep range for a new exercise. Nothing is done until ticked.
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
          return { weight: prev ? String(prev.weight) : '', reps: String(prev?.reps ?? i.repsMin), done: false }
        }),
      }
    })
}

/** A set can be ticked once it has reps (weight may be blank for bodyweight). */
export function canComplete(s: DraftSet): boolean {
  return Math.round(Number(s.reps) || 0) > 0
}

export function countSets(entries: DraftEntry[]): { done: number; total: number } {
  const all = entries.flatMap((e) => e.sets)
  return { done: all.filter((s) => s.done && canComplete(s)).length, total: all.length }
}

/** Drafts saved before the checklist had no `done` flag: treat filled-in sets as done. */
export function upgradeDraftSets(entries: DraftEntry[]): DraftEntry[] {
  return entries.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: s.done ?? canComplete(s) })) }))
}
