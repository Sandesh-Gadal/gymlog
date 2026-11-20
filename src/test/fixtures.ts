import type { Workout, WorkoutSet } from '../lib/types'

let seq = 0

/** Build a workout with one or more exercises. sets: [weight, reps][] */
export function workout(date: string, exercises: Record<string, [number, number][]>, id?: string): Workout {
  seq += 1
  return {
    id: id ?? `w${seq}`,
    date,
    createdAt: seq,
    updatedAt: seq,
    entries: Object.entries(exercises).map(([exerciseId, sets]) => ({
      exerciseId,
      sets: sets.map(([weight, reps]): WorkoutSet => ({ weight, reps })),
    })),
  }
}
