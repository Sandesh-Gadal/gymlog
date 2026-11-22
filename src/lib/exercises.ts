import type { Exercise, MuscleGroup } from './types'

/**
 * Built-in exercise library. Lives in code (not the database) so it costs no reads/writes
 * and can be extended in a release. IDs are stable slugs — never rename an id once shipped,
 * because workouts reference it.
 */
const BUILT_IN: [id: string, name: string, group: MuscleGroup][] = [
  ['bench-press', 'Bench Press', 'chest'],
  ['incline-dumbbell-press', 'Incline Dumbbell Press', 'chest'],
  ['incline-bench-press', 'Incline Bench Press', 'chest'],
  ['dumbbell-fly', 'Dumbbell Fly', 'chest'],
  ['cable-crossover', 'Cable Crossover', 'chest'],
  ['push-up', 'Push-up', 'chest'],
  ['dips', 'Dips', 'chest'],
  ['deadlift', 'Deadlift', 'back'],
  ['pull-up', 'Pull-up', 'back'],
  ['lat-pulldown', 'Lat Pulldown', 'back'],
  ['barbell-row', 'Barbell Row', 'back'],
  ['seated-cable-row', 'Seated Cable Row', 'back'],
  ['overhead-press', 'Overhead Press', 'shoulders'],
  ['dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 'shoulders'],
  ['lateral-raise', 'Lateral Raise', 'shoulders'],
  ['face-pull', 'Face Pull', 'shoulders'],
  ['rear-delt-fly', 'Rear Delt Fly', 'shoulders'],
  ['barbell-curl', 'Barbell Curl', 'arms'],
  ['dumbbell-curl', 'Dumbbell Curl', 'arms'],
  ['triceps-pushdown', 'Triceps Pushdown', 'arms'],
  ['skull-crusher', 'Skull Crusher', 'arms'],
  ['squat', 'Squat', 'legs'],
  ['leg-press', 'Leg Press', 'legs'],
  ['romanian-deadlift', 'Romanian Deadlift', 'legs'],
  ['lunge', 'Lunge', 'legs'],
  ['leg-curl', 'Leg Curl', 'legs'],
  ['leg-extension', 'Leg Extension', 'legs'],
  ['calf-raise', 'Calf Raise', 'legs'],
  ['plank', 'Plank (seconds as reps)', 'core'],
  ['hanging-leg-raise', 'Hanging Leg Raise', 'core'],
  ['cable-crunch', 'Cable Crunch', 'core'],
  // v0.2
  ['hammer-curl', 'Hammer Curl', 'arms'],
  ['overhead-triceps-extension', 'Overhead Triceps Extension', 'arms'],
  ['shoulder-pass-through', 'Shoulder Pass-through (mobility)', 'shoulders'],
]

export const BUILT_IN_EXERCISES: Exercise[] = BUILT_IN.map(([id, name, muscleGroup]) => ({
  id,
  name,
  muscleGroup,
  custom: false,
  createdAt: 0,
}))

export const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full-body', 'cardio']

/** Built-ins plus custom, sorted by name. Custom with a colliding id wins. */
export function mergeExercises(custom: Exercise[]): Exercise[] {
  const map = new Map<string, Exercise>()
  for (const e of BUILT_IN_EXERCISES) map.set(e.id, e)
  for (const e of custom) map.set(e.id, e)
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}
