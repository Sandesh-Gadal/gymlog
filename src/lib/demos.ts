/**
 * Exercise demos: start/end photos and instructions from free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db), released into the public domain (Unlicense).
 * Images live in public/demos/<exercise id>/{0,1}.jpg and are precached for offline use.
 * Keyed by built-in exercise id.
 */
export interface ExerciseDemo {
  /** id in free-exercise-db, for attribution and future updates */
  sourceId: string
  primary: string[]
  secondary: string[]
  steps: string[]
}

const DEMOS: Record<string, ExerciseDemo> = {
  'bench-press': {
    sourceId: 'Barbell_Bench_Press_-_Medium_Grip',
    primary: ['chest'],
    secondary: ['shoulders', 'triceps'],
    steps: [
      'Lie back on a flat bench. Grip the bar at medium width (forearms and upper arms at 90° in the middle of the movement), lift it from the rack and hold it straight over you with your arms locked.',
      'Breathe in and lower the bar slowly until it touches your middle chest.',
      'After a brief pause, breathe out and push the bar back up using your chest. Lock your arms and squeeze your chest at the top for a second.',
      'Lowering should take about twice as long as raising. Repeat, then rack the bar.',
    ],
  },
  squat: {
    sourceId: 'Barbell_Squat',
    primary: ['quadriceps'],
    secondary: ['glutes', 'hamstrings', 'calves', 'lower back'],
    steps: [
      'Use a squat rack. Set the bar just below shoulder height, step under it and rest it across the back of your shoulders, slightly below the neck.',
      'Lift it off the rack by pushing with your legs and straightening your torso. Step back and stand with feet shoulder-width apart, toes slightly out, head up and back straight.',
      'Breathe in and slowly lower by bending knees and hips until your thighs go just past parallel. Keep your knees in line with your toes.',
      'Breathe out and push through your heels to stand back up. Repeat.',
    ],
  },
}

export function demoFor(exerciseId: string): ExerciseDemo | undefined {
  return DEMOS[exerciseId]
}

/** Image URLs (start, end), relative to the app's base path. */
export function demoImages(exerciseId: string, base: string): [string, string] {
  return [`${base}demos/${exerciseId}/0.jpg`, `${base}demos/${exerciseId}/1.jpg`]
}
