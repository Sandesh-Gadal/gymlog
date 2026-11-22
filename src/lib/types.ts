/** Core domain types. See docs/data-model.md for the storage layout. */

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'full-body'
  | 'cardio'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  /** true for exercises the user created; built-ins live in code (lib/exercises.ts) */
  custom: boolean
  createdAt: number
}

export interface WorkoutSet {
  /** kilograms; 0 for bodyweight */
  weight: number
  reps: number
}

export interface WorkoutEntry {
  exerciseId: string
  sets: WorkoutSet[]
  notes?: string
}

export interface Workout {
  id: string
  /** local calendar date, YYYY-MM-DD */
  date: string
  durationMin?: number
  notes?: string
  entries: WorkoutEntry[]
  createdAt: number
  updatedAt: number
}

export interface WeightEntry {
  id: string
  /** local calendar date, YYYY-MM-DD (one entry per day; id === date) */
  date: string
  kg: number
  createdAt: number
}

export interface Profile {
  name: string
  heightCm: number
  waistIn: number
  startWeightKg: number
  daysPerWeek: number
  sessionMinutes: number
  goals: string
  updatedAt: number
}

/** One exercise in a planned session: a target, not a logged result. */
export interface PlanItem {
  exerciseId: string
  sets: number
  repsMin: number
  /** equal to repsMin for a fixed rep count */
  repsMax: number
}

export interface PlanSession {
  id: string
  /** e.g. "Push" */
  title: string
  /** rest times, focus cues… */
  notes?: string
  items: PlanItem[]
}

/** Weekly plan, stored as a single doc at users/{uid}/meta/plan. */
export interface Plan {
  sessions: PlanSession[]
  /** 7 slots, Monday → Sunday: a session id, or null for a rest day */
  week: (string | null)[]
  /** done every day, rest days included (e.g. mobility) */
  daily: PlanItem[]
  updatedAt: number
}

export type CollectionName = 'workouts' | 'exercises' | 'weights'

export interface CollectionMap {
  workouts: Workout
  exercises: Exercise
  weights: WeightEntry
}

/** Shape of a JSON backup file. Bump `version` on breaking changes. */
export interface Backup {
  app: 'gymlog'
  version: 1
  exportedAt: string
  profile: Profile | null
  /** optional: backups made before the planner have no plan */
  plan?: Plan | null
  workouts: Workout[]
  exercises: Exercise[]
  weights: WeightEntry[]
}
